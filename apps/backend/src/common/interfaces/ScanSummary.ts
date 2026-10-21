export interface ScanSummary {
  totalPackages: number;

  securePackages: number;

  vulnerablePackages: number;

  totalVulnerabilities: number;

  securityScore: number;

  riskScore: number;

  riskLevel: string;

  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
