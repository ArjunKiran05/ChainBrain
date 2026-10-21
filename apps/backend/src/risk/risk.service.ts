import { Injectable } from '@nestjs/common';

import { ScanResult } from '../common/interfaces/ScanResult';
import { ScanSummary } from '../common/interfaces/ScanSummary';
import {
  DependencyGraph,
  DependencyNode,
} from '../dependency/dependency.service';

@Injectable()
export class RiskService {
  calculate(
    results: ScanResult[],
    dependencyGraphs: {
      project: string;
      graph: DependencyGraph;
    }[] = [],
  ): ScanSummary {
    /*
     * ----------------------------------------------------------
     * STEP 1: Basic vulnerability statistics
     * ----------------------------------------------------------
     */
    const uniquePackages = new Set<string>();

    let vulnerablePackages = 0;
    let totalVulnerabilities = 0;

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const pkg of results) {
      const packageKey = this.nodeKey(pkg.package, pkg.version);

      uniquePackages.add(packageKey);

      if (pkg.vulnerabilities.length > 0) {
        vulnerablePackages++;
      }

      for (const vuln of pkg.vulnerabilities) {
        totalVulnerabilities++;

        const severity = this.getSeverity(vuln);

        switch (severity) {
          case 'CRITICAL':
            critical++;
            break;

          case 'HIGH':
            high++;
            break;

          case 'MEDIUM':
            medium++;
            break;

          case 'LOW':
            low++;
            break;
        }
      }
    }

    const totalPackages = uniquePackages.size;

    const securePackages = Math.max(0, totalPackages - vulnerablePackages);

    /*
     * ----------------------------------------------------------
     * STEP 2: Create vulnerability lookup
     * ----------------------------------------------------------
     */
    const scanMap = new Map<string, ScanResult>();

    for (const result of results) {
      scanMap.set(this.nodeKey(result.package, result.version), result);
    }

    /*
     * ----------------------------------------------------------
     * STEP 3: Calculate risk across each dependency graph
     * ----------------------------------------------------------
     */
    const nodeRisks: number[] = [];

    for (const projectGraph of dependencyGraphs) {
      const graph = projectGraph.graph;

      const graphNodeMap = new Map<string, DependencyNode>();

      for (const node of graph.nodes) {
        graphNodeMap.set(this.nodeKey(node.name, node.version), node);
      }

      /*
       * Number of direct dependencies in this project.
       *
       * This helps us estimate how much of the application
       * directly depends on a vulnerable node.
       */
      const directDependencyCount = graph.nodes.filter(
        (node) => node.direct,
      ).length;

      for (const node of graph.nodes) {
        if (node.vulnerabilities.length === 0) {
          continue;
        }

        const key = this.nodeKey(node.name, node.version);

        const scanResult = scanMap.get(key);

        /*
         * The graph node already contains vulnerabilities,
         * but the scan result is the authoritative source.
         *
         * Use the scan result when available.
         */
        const vulnerabilities =
          scanResult?.vulnerabilities ?? node.vulnerabilities;

        if (vulnerabilities.length === 0) {
          continue;
        }

        /*
         * ------------------------------------------------------
         * Intrinsic risk
         *
         * How dangerous are the vulnerabilities themselves?
         * ------------------------------------------------------
         */
        const intrinsicRisk = this.calculateIntrinsicRisk(vulnerabilities);

        /*
         * ------------------------------------------------------
         * Exposure
         *
         * How directly exposed is this dependency?
         * ------------------------------------------------------
         */
        const exposureFactor = this.calculateExposureFactor(node);

        /*
         * ------------------------------------------------------
         * Blast radius / propagation
         *
         * How many parts of the dependency tree ultimately
         * depend on this vulnerable package?
         * ------------------------------------------------------
         */
        const affectedDependents = this.findAffectedDependents(
          node,
          graphNodeMap,
        );

        const directAncestors = this.countDirectAncestors(node, graphNodeMap);

        const blastRadiusFactor = this.calculateBlastRadiusFactor(
          affectedDependents.size,
          directAncestors,
          directDependencyCount,
        );

        /*
         * ------------------------------------------------------
         * Final risk contribution of this package
         * ------------------------------------------------------
         */
        const nodeRisk = Math.min(
          100,
          intrinsicRisk * exposureFactor * blastRadiusFactor,
        );

        nodeRisks.push(nodeRisk);
      }
    }

    /*
     * ----------------------------------------------------------
     * STEP 4: Aggregate vulnerable nodes
     * ----------------------------------------------------------
     *
     * We use a diminishing-return combination rather than
     * simply summing risks.
     *
     * Example:
     *
     * 80 + 70 + 60
     *
     * must not become 210.
     *
     * Instead, multiple risks progressively push the project
     * toward 100.
     */
    let combinedRisk = 0;

    for (const nodeRisk of nodeRisks) {
      const normalizedRisk = nodeRisk / 100;

      combinedRisk = 1 - (1 - combinedRisk) * (1 - normalizedRisk);
    }

    const riskScore = Math.min(
      100,
      Math.max(0, Math.round(combinedRisk * 100)),
    );

    const securityScore = 100 - riskScore;

    /*
     * ----------------------------------------------------------
     * STEP 5: Risk classification
     * ----------------------------------------------------------
     */
    let riskLevel: ScanSummary['riskLevel'];

    if (riskScore >= 70) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 45) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 20) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      totalPackages,
      securePackages,
      vulnerablePackages,
      totalVulnerabilities,

      securityScore,
      riskScore,
      riskLevel,

      severityCounts: {
        critical,
        high,
        medium,
        low,
      },
    };
  }

  /*
   * ==========================================================
   * SEVERITY
   * ==========================================================
   */
  private getSeverity(
    vulnerability: any,
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const databaseSeverity = vulnerability?.database_specific?.severity;

    if (typeof databaseSeverity === 'string') {
      const normalized = databaseSeverity.toUpperCase();

      switch (normalized) {
        case 'CRITICAL':
          return 'CRITICAL';

        case 'HIGH':
          return 'HIGH';

        case 'MODERATE':
        case 'MEDIUM':
          return 'MEDIUM';

        case 'LOW':
          return 'LOW';
      }
    }

    const ecosystemSeverity = vulnerability?.ecosystem_specific?.severity;

    if (typeof ecosystemSeverity === 'string') {
      const normalized = ecosystemSeverity.toUpperCase();

      switch (normalized) {
        case 'CRITICAL':
          return 'CRITICAL';

        case 'HIGH':
          return 'HIGH';

        case 'MODERATE':
        case 'MEDIUM':
          return 'MEDIUM';

        case 'LOW':
          return 'LOW';
      }
    }

    /*
     * Unknown severity should not silently disappear.
     *
     * We conservatively treat it as LOW.
     */
    return 'LOW';
  }

  /*
   * ==========================================================
   * INTRINSIC RISK
   * ==========================================================
   *
   * Base risk:
   *
   * CRITICAL = 75
   * HIGH     = 55
   * MEDIUM   = 30
   * LOW      = 10
   *
   * Multiple vulnerabilities use diminishing returns.
   */
  private calculateIntrinsicRisk(vulnerabilities: any[]): number {
    let combinedRisk = 0;

    for (const vulnerability of vulnerabilities) {
      const severity = this.getSeverity(vulnerability);

      let severityRisk: number;

      switch (severity) {
        case 'CRITICAL':
          severityRisk = 75;
          break;

        case 'HIGH':
          severityRisk = 55;
          break;

        case 'MEDIUM':
          severityRisk = 30;
          break;

        case 'LOW':
          severityRisk = 10;
          break;
      }

      combinedRisk = 1 - (1 - combinedRisk) * (1 - severityRisk / 100);
    }

    return Math.min(100, combinedRisk * 100);
  }

  /*
   * ==========================================================
   * EXPOSURE FACTOR
   * ==========================================================
   *
   * Direct production dependency:
   *     highest exposure
   *
   * Transitive dependency:
   *     lower exposure
   *
   * Development-only dependency:
   *     substantially reduced exposure
   *
   * Greater depth:
   *     slightly reduced exposure
   */
  private calculateExposureFactor(node: DependencyNode): number {
    let factor = node.direct ? 1.0 : 0.82;

    if (node.dev) {
      factor *= 0.55;
    }

    if (node.depth !== Infinity && node.depth > 1) {
      const depthReduction = Math.min(node.depth - 1, 5) * 0.07;

      factor *= 1 - depthReduction;
    }

    return Math.max(0.25, factor);
  }

  /*
   * ==========================================================
   * DEPENDENCY PROPAGATION
   * ==========================================================
   *
   * Starting from a vulnerable package, walk backwards through
   * its dependents.
   *
   * This answers:
   *
   * "Which other packages can ultimately be affected by this
   * vulnerable dependency?"
   */
  private findAffectedDependents(
    vulnerableNode: DependencyNode,
    graphNodes: Map<string, DependencyNode>,
  ): Set<string> {
    const affected = new Set<string>();

    const queue: string[] = [];

    for (const dependentKey of vulnerableNode.dependents) {
      queue.push(dependentKey);
    }

    let index = 0;

    while (index < queue.length) {
      const currentKey = queue[index++];

      if (affected.has(currentKey)) {
        continue;
      }

      affected.add(currentKey);

      const dependent = graphNodes.get(currentKey);

      if (!dependent) {
        continue;
      }

      for (const nextDependent of dependent.dependents) {
        if (!affected.has(nextDependent)) {
          queue.push(nextDependent);
        }
      }
    }

    return affected;
  }

  /*
   * ==========================================================
   * DIRECT ANCESTORS
   * ==========================================================
   *
   * Count how many direct project dependencies ultimately depend
   * on the vulnerable package.
   */
  private countDirectAncestors(
    vulnerableNode: DependencyNode,
    graphNodes: Map<string, DependencyNode>,
  ): number {
    const visited = new Set<string>();

    const queue: string[] = [...vulnerableNode.dependents];

    let count = 0;
    let index = 0;

    while (index < queue.length) {
      const currentKey = queue[index++];

      if (visited.has(currentKey)) {
        continue;
      }

      visited.add(currentKey);

      const currentNode = graphNodes.get(currentKey);

      if (!currentNode) {
        continue;
      }

      if (currentNode.direct) {
        count++;
      }

      for (const dependentKey of currentNode.dependents) {
        if (!visited.has(dependentKey)) {
          queue.push(dependentKey);
        }
      }
    }

    /*
     * The vulnerable package itself may be a direct dependency.
     */
    if (vulnerableNode.direct) {
      count++;
    }

    return count;
  }

  /*
   * ==========================================================
   * BLAST RADIUS
   * ==========================================================
   *
   * Two signals:
   *
   * 1. Number of affected dependents.
   * 2. Fraction of direct project dependencies affected.
   *
   * Both are bounded.
   */
  private calculateBlastRadiusFactor(
    affectedDependents: number,
    directAncestors: number,
    totalDirectDependencies: number,
  ): number {
    const dependentImpact = Math.min(
      0.6,
      Math.log2(affectedDependents + 1) * 0.1,
    );

    const directCoverage =
      totalDirectDependencies > 0
        ? directAncestors / totalDirectDependencies
        : 0;

    const coverageImpact = Math.min(0.35, directCoverage * 0.35);

    return Math.min(1.85, 1 + dependentImpact + coverageImpact);
  }

  /*
   * ==========================================================
   * PACKAGE KEY
   * ==========================================================
   */
  private nodeKey(name: string, version: string): string {
    return `${name}@${version}`;
  }
}
