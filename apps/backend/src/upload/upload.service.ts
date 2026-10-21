import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { Readable } from 'stream';

import { ScannerService } from '../scanner/scanner.service';
import { RiskService } from '../risk/risk.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import {
  DependencyGraph,
  DependencyGraphService,
} from '../dependency/dependency.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly scannerService: ScannerService,
    private readonly riskService: RiskService,
    private readonly recommendationService: RecommendationService,
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly dependencyGraphService: DependencyGraphService,
  ) {}

  async processZip(buffer: Buffer) {
    /*
     * ----------------------------------------------------------
     * STEP 1: Extract ZIP
     * ----------------------------------------------------------
     */
    const extractPath = path.join(
      'uploads',
      'extracted',
      Date.now().toString(),
    );

    await fs.ensureDir(extractPath);

    await Readable.from(buffer)
      .pipe(
        unzipper.Extract({
          path: extractPath,
        }),
      )
      .promise();

    /*
     * ----------------------------------------------------------
     * STEP 2: Find projects
     * ----------------------------------------------------------
     */
    const packageJsonFiles = await this.findPackageJsons(extractPath);

    const projects: {
      path: string;
      name: string;
      version: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      lockfilePath: string | null;
    }[] = [];

    for (const packageJsonPath of packageJsonFiles) {
      const packageJson = await fs.readJson(packageJsonPath);

      const projectDir = path.dirname(packageJsonPath);

      const lockfilePath = path.join(projectDir, 'package-lock.json');

      const hasLockfile = await fs.pathExists(lockfilePath);

      projects.push({
        path: packageJsonPath,
        name: packageJson.name ?? 'Unknown Project',
        version: packageJson.version ?? '0.0.0',

        dependencies: packageJson.dependencies ?? {},

        devDependencies: packageJson.devDependencies ?? {},

        lockfilePath: hasLockfile ? lockfilePath : null,
      });

      console.log({
        project: packageJson.name,
        lockfilePath: hasLockfile ? lockfilePath : null,
      });
    }

    /*
     * ----------------------------------------------------------
     * STEP 3: Build dependency graphs
     * ----------------------------------------------------------
     */
    const dependencyGraphs: {
      project: string;
      graph: DependencyGraph;
    }[] = [];

    for (const project of projects) {
      if (!project.lockfilePath) {
        continue;
      }

      const graph = await this.dependencyGraphService.build(
        project.lockfilePath,
      );

      dependencyGraphs.push({
        project: project.name,
        graph,
      });
    }

    /*
     * ----------------------------------------------------------
     * STEP 4: Build complete scan target set
     * ----------------------------------------------------------
     *
     * Lockfile-backed projects:
     *     every resolved dependency
     *
     * Projects without lockfiles:
     *     package.json dependencies as fallback
     */
    const scanTargetMap = new Map<
      string,
      {
        package: string;
        version: string;
      }
    >();

    /*
     * Resolved packages from lockfiles.
     */
    for (const projectGraph of dependencyGraphs) {
      for (const node of projectGraph.graph.nodes) {
        const key = `${node.name}@${node.version}`;

        if (!scanTargetMap.has(key)) {
          scanTargetMap.set(key, {
            package: node.name,
            version: node.version,
          });
        }
      }
    }

    /*
     * Fallback for projects without lockfiles.
     */
    for (const project of projects) {
      if (project.lockfilePath) {
        continue;
      }

      const dependencies = {
        ...project.dependencies,
        ...project.devDependencies,
      };

      for (const [packageName, versionRange] of Object.entries(dependencies)) {
        const version = versionRange.replace(/^[~^<>= ]+/, '');

        const key = `${packageName}@${version}`;

        if (!scanTargetMap.has(key)) {
          scanTargetMap.set(key, {
            package: packageName,
            version,
          });
        }
      }
    }

    const scanTargets = Array.from(scanTargetMap.values());

    console.log('\n=== SCAN TARGETS ===');

    console.log('Resolved packages:', scanTargets.length);

    /*
     * ----------------------------------------------------------
     * STEP 5: Scan every resolved dependency
     * ----------------------------------------------------------
     */
    const results = await this.scannerService.scanPackages(scanTargets);

    console.log('\n=== VULNERABILITY SCAN ===');

    console.log('Scan targets:', scanTargets.length);

    console.log('Scan results:', results.length);

    /*
     * ----------------------------------------------------------
     * STEP 6: Attach vulnerabilities to graph nodes
     * ----------------------------------------------------------
     */
    const scanMap = new Map<string, (typeof results)[number]>();

    for (const result of results) {
      const key = `${result.package}@${result.version}`;

      scanMap.set(key, result);
    }

    for (const projectGraph of dependencyGraphs) {
      for (const node of projectGraph.graph.nodes) {
        const key = `${node.name}@${node.version}`;

        const scanResult = scanMap.get(key);

        node.vulnerabilities = scanResult?.vulnerabilities ?? [];
      }
    }

    /*
     * ----------------------------------------------------------
     * STEP 7: Calculate graph-aware risk
     * ----------------------------------------------------------
     */
    const summary = this.riskService.calculate(results, dependencyGraphs);

    /*
     * ----------------------------------------------------------
     * STEP 8: Generate recommendations
     * ----------------------------------------------------------
     */
    const recommendations = this.recommendationService.generate(results);

    /*
     * ----------------------------------------------------------
     * STEP 9: Generate AI report
     * ----------------------------------------------------------
     */
    const aiReport = await this.aiService.generateReport({
      summary,
      results,
      recommendations,
    });

    /*
     * ----------------------------------------------------------
     * STEP 10: Persist scan
     * ----------------------------------------------------------
     */
    await this.prisma.scan.create({
      data: {
        projectName: projects[0]?.name ?? 'Unknown Project',

        totalPackages: summary.totalPackages,

        vulnerablePackages: summary.vulnerablePackages,

        totalVulnerabilities: summary.totalVulnerabilities,
      },
    });

    /*
     * ----------------------------------------------------------
     * STEP 11: Return complete result
     * ----------------------------------------------------------
     */
    return {
      status: 'success',

      extractPath,

      projects,

      dependencyGraphs,

      scanResults: {
        summary,
        results,
      },

      recommendations,

      aiReport,
    };
  }

  private async findPackageJsons(dir: string): Promise<string[]> {
    const results: string[] = [];

    const entries = await fs.readdir(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);

      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        if (entry === 'node_modules') {
          continue;
        }

        results.push(...(await this.findPackageJsons(fullPath)));
      } else if (entry === 'package.json') {
        results.push(fullPath);
      }
    }

    return results;
  }
}
