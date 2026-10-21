export interface AiReport {
  overallAssessment: string;

  deploymentRecommendation?: 'SAFE' | 'CAUTION' | 'BLOCK';

  keyFindings: string[];

  recommendations: string[];

  priorityPackages: {
    package: string;
    severity: string;
    reason: string;
  }[];

  conclusion: string;
}
