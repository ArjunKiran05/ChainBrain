import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';

export interface DependencyNode {
  name: string;
  version: string;

  direct: boolean;
  dev: boolean;

  depth: number;

  dependencies: string[];
  dependents: string[];

  vulnerabilities: any[];
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

@Injectable()
export class DependencyGraphService {
  async build(lockfilePath: string): Promise<DependencyGraph> {
    const lockfile = await fs.readJson(lockfilePath);

    switch (lockfile.lockfileVersion) {
      case 1:
        return this.buildFromV1(lockfile);

      case 2:
      case 3:
        return this.buildFromV2(lockfile);

      default:
        throw new Error(
          `Unsupported package-lock version: ${lockfile.lockfileVersion}`,
        );
    }
  }

  /*
   * ============================================================
   * PACKAGE-LOCK V1
   * ============================================================
   *
   * V1 stores the dependency tree inside:
   *
   * lockfile.dependencies
   *
   * Each dependency can also contain a nested `dependencies`
   * object when npm had to install a different version deeper
   * in the tree.
   */
  private buildFromV1(lockfile: any): DependencyGraph {
    const nodeMap = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];

    const rootDependencies = lockfile.dependencies ?? {};

    const visit = (
      dependencyMap: Record<string, any>,
      parentKey: string | null,
      depth: number,
      direct: boolean,
      visiting: Set<string>,
    ): void => {
      for (const [name, packageInfo] of Object.entries(dependencyMap)) {
        if (!packageInfo || typeof packageInfo !== 'object') {
          continue;
        }

        const info = packageInfo as {
          version?: string;
          dev?: boolean;
          requires?: Record<string, string>;
          dependencies?: Record<string, any>;
        };

        if (!info.version) {
          continue;
        }

        const key = this.nodeKey(name, info.version);

        /*
         * Create the node if we haven't seen it before.
         */
        if (!nodeMap.has(key)) {
          nodeMap.set(key, {
            name,
            version: info.version,
            direct,
            dev: info.dev === true,
            depth,
            dependencies: [],
            dependents: [],
            vulnerabilities: [],
          });
        } else {
          /*
           * A package can be encountered from multiple parents.
           * Preserve the strongest information we've found.
           */
          const existingNode = nodeMap.get(key)!;

          if (direct) {
            existingNode.direct = true;
          }

          if (info.dev === true) {
            existingNode.dev = true;
          }

          existingNode.depth = Math.min(existingNode.depth, depth);
        }

        /*
         * Connect parent -> current package.
         */
        if (parentKey) {
          const parentNode = nodeMap.get(parentKey);
          const currentNode = nodeMap.get(key);

          if (parentNode && currentNode) {
            if (!parentNode.dependencies.includes(key)) {
              parentNode.dependencies.push(key);
            }

            if (!currentNode.dependents.includes(parentKey)) {
              currentNode.dependents.push(parentKey);
            }

            const edgeExists = edges.some(
              (edge) => edge.from === parentKey && edge.to === key,
            );

            if (!edgeExists) {
              edges.push({
                from: parentKey,
                to: key,
              });
            }
          }
        }

        /*
         * Prevent cycles such as:
         *
         * A -> B -> A -> B -> ...
         */
        if (visiting.has(key)) {
          continue;
        }

        const nextVisiting = new Set(visiting);
        nextVisiting.add(key);

        const requires = info.requires ?? {};
        const nestedDependencies = info.dependencies ?? {};

        for (const dependencyName of Object.keys(requires)) {
          /*
           * First preference:
           *
           * Use the exact nested installation recorded by npm.
           */
          if (nestedDependencies[dependencyName]) {
            visit(
              {
                [dependencyName]: nestedDependencies[dependencyName],
              },
              key,
              depth + 1,
              false,
              nextVisiting,
            );

            continue;
          }

          /*
           * Otherwise use the top-level resolved dependency.
           *
           * The cycle protection above prevents infinite recursion.
           */
          if (rootDependencies[dependencyName]) {
            visit(
              {
                [dependencyName]: rootDependencies[dependencyName],
              },
              key,
              depth + 1,
              false,
              nextVisiting,
            );
          }
        }
      }
    };

    /*
     * Start traversal from the root dependencies.
     */
    visit(rootDependencies, null, 1, true, new Set<string>());

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  }

  /*
   * ============================================================
   * PACKAGE-LOCK V2
   * ============================================================
   */
  private buildFromV2(lockfile: any): DependencyGraph {
    const packages = lockfile.packages ?? {};

    const nodeMap = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];

    /*
     * The root package is represented by:
     *
     * packages[""]
     */
    const root = packages[''];

    const directDependencies = new Set(Object.keys(root?.dependencies ?? {}));

    const directDevDependencies = new Set(
      Object.keys(root?.devDependencies ?? {}),
    );

    /*
     * First pass:
     *
     * Create a node for every resolved package.
     */
    for (const [packagePath, packageInfo] of Object.entries(packages)) {
      if (packagePath === '') {
        continue;
      }

      const name = this.getPackageName(packagePath);

      if (!packageInfo || typeof packageInfo !== 'object') {
        continue;
      }

      const info = packageInfo as {
        version?: string;
        dev?: boolean;
        dependencies?: Record<string, string>;
      };

      if (!info.version) {
        continue;
      }

      const direct = directDependencies.has(name);
      const dev = directDevDependencies.has(name) || info.dev === true;

      nodeMap.set(this.nodeKey(name, info.version), {
        name,
        version: info.version,
        direct,
        dev,
        depth: direct ? 1 : Infinity,
        dependencies: [],
        dependents: [],
        vulnerabilities: [],
      });
    }

    /*
     * Second pass:
     *
     * Build dependency relationships.
     */
    for (const [packagePath, packageInfo] of Object.entries(packages)) {
      if (packagePath === '') {
        continue;
      }

      if (!packageInfo || typeof packageInfo !== 'object') {
        continue;
      }

      const info = packageInfo as {
        version?: string;
        dependencies?: Record<string, string>;
      };

      if (!info.version) {
        continue;
      }

      const fromName = this.getPackageName(packagePath);
      const fromKey = this.nodeKey(fromName, info.version);

      const fromNode = nodeMap.get(fromKey);

      if (!fromNode) {
        continue;
      }

      for (const dependencyName of Object.keys(info.dependencies ?? {})) {
        const dependencyPath = this.findDependencyPath(
          packagePath,
          dependencyName,
          packages,
        );

        if (!dependencyPath) {
          continue;
        }

        const dependencyInfo = packages[dependencyPath] as {
          version?: string;
        };

        if (!dependencyInfo?.version) {
          continue;
        }

        const toKey = this.nodeKey(dependencyName, dependencyInfo.version);

        const toNode = nodeMap.get(toKey);

        if (!toNode) {
          continue;
        }

        if (!fromNode.dependencies.includes(toKey)) {
          fromNode.dependencies.push(toKey);
        }

        if (!toNode.dependents.includes(fromKey)) {
          toNode.dependents.push(fromKey);
        }

        const edgeExists = edges.some(
          (edge) => edge.from === fromKey && edge.to === toKey,
        );

        if (!edgeExists) {
          edges.push({
            from: fromKey,
            to: toKey,
          });
        }
      }
    }

    /*
     * Calculate dependency depth from the root.
     */
    this.calculateDepths(nodeMap, directDependencies, directDevDependencies);

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  }

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  private getPackageName(packagePath: string): string {
    const parts = packagePath.split('node_modules/');

    return parts[parts.length - 1];
  }

  private nodeKey(name: string, version: string): string {
    return `${name}@${version}`;
  }

  private findDependencyPath(
    parentPath: string,
    dependencyName: string,
    packages: Record<string, any>,
  ): string | null {
    let currentPath = parentPath;

    while (true) {
      const candidate = currentPath
        ? `${currentPath}/node_modules/${dependencyName}`
        : `node_modules/${dependencyName}`;

      if (packages[candidate]) {
        return candidate;
      }

      const lastNodeModules = currentPath.lastIndexOf('node_modules/');

      if (lastNodeModules === -1) {
        break;
      }

      currentPath = currentPath.substring(0, lastNodeModules - 1);
    }

    const topLevelCandidate = `node_modules/${dependencyName}`;

    return packages[topLevelCandidate] ? topLevelCandidate : null;
  }

  private calculateDepths(
    nodeMap: Map<string, DependencyNode>,
    directDependencies: Set<string>,
    directDevDependencies: Set<string>,
  ): void {
    const queue: DependencyNode[] = [];

    for (const node of nodeMap.values()) {
      if (
        directDependencies.has(node.name) ||
        directDevDependencies.has(node.name)
      ) {
        node.depth = 1;
        queue.push(node);
      }
    }

    let index = 0;

    while (index < queue.length) {
      const current = queue[index++];

      for (const dependencyKey of current.dependencies) {
        const dependency = nodeMap.get(dependencyKey);

        if (!dependency) {
          continue;
        }

        const newDepth = current.depth + 1;

        if (newDepth < dependency.depth) {
          dependency.depth = newDepth;
          queue.push(dependency);
        }
      }
    }
  }
}
