import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { ScanResult } from '../common/interfaces/ScanResult';

interface ScanTarget {
  package: string;
  version: string;
}

@Injectable()
export class ScannerService {
  async scanPackages(packages: ScanTarget[]): Promise<ScanResult[]> {
    /*
     * De-duplicate by package + version.
     *
     * Different versions of the same package can have
     * different vulnerability sets.
     */
    const uniquePackages = new Map<string, ScanTarget>();

    for (const pkg of packages) {
      const key = `${pkg.package}@${pkg.version}`;

      if (!uniquePackages.has(key)) {
        uniquePackages.set(key, pkg);
      }
    }

    const targets = Array.from(uniquePackages.values());

    /*
     * Limit concurrent OSV requests.
     */
    const limit = 10;

    return this.executeWithConcurrencyLimit(targets, limit, async (pkg) => {
      try {
        const response = await axios.post('https://api.osv.dev/v1/query', {
          package: {
            ecosystem: 'npm',
            name: pkg.package,
          },
          version: pkg.version,
        });

        return {
          package: pkg.package,
          version: pkg.version,
          vulnerabilities: response.data.vulns ?? [],
        };
      } catch {
        return {
          package: pkg.package,
          version: pkg.version,
          vulnerabilities: [],
          error: 'Failed to scan',
        };
      }
    });
  }

  private async executeWithConcurrencyLimit<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);

    let index = 0;

    const workers = Array.from(
      {
        length: Math.min(limit, items.length),
      },
      async () => {
        while (true) {
          const currentIndex = index++;

          if (currentIndex >= items.length) {
            break;
          }

          results[currentIndex] = await fn(items[currentIndex]);
        }
      },
    );

    await Promise.all(workers);

    return results;
  }
}
