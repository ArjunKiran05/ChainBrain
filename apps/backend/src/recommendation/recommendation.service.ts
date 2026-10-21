import { Injectable } from '@nestjs/common';

import { Recommendation } from '../common/interfaces/Recommendation';
import { ScanResult } from '../common/interfaces/ScanResult';

@Injectable()
export class RecommendationService {
  generate(results: ScanResult[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const pkg of results) {
      if (!pkg.vulnerabilities.length) continue;

      const highestSeverity = pkg.vulnerabilities.reduce(
        (highest: string, vuln: any) => {
          const severity = (
            vuln.database_specific?.severity ?? 'LOW'
          ).toUpperCase();

          const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

          return order.indexOf(severity) > order.indexOf(highest)
            ? severity
            : highest;
        },
        'LOW',
      );

      recommendations.push({
        package: pkg.package,
        version: pkg.version,
        severity: highestSeverity,
        fix: 'Upgrade to the latest secure version.',
        reason: `${pkg.vulnerabilities.length} known vulnerability(s) detected.`,
      });
    }

    const severityOrder: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    recommendations.sort((a, b) => {
      return (
        (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0)
      );
    });

    return recommendations.slice(0, 10);
  }
}
