export interface Vulnerability {
  id?: string;
  summary?: string;
  details?: string;

  database_specific?: {
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
}

export interface PackageScan {
  package: string;
  version: string;
  vulnerabilities: Vulnerability[];
  error?: string;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ScanSummary {
  totalPackages: number;
  securePackages: number;
  vulnerablePackages: number;
  totalVulnerabilities: number;

  securityScore: number;
  riskScore: number;

  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  severityCounts: SeverityCounts;
}

export interface ScanResults {
  summary: ScanSummary;
  results: PackageScan[];
}

export interface Recommendation {
  package: string;
  version: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  fix: string;
  reason: string;
}

export interface PriorityPackage {
  package: string;
  severity: string;
  reason: string;
}

export interface AIReport {
  overallAssessment: string;

  deploymentRecommendation:
    | "SAFE"
    | "CAUTION"
    | "BLOCK";

  keyFindings: string[];

  recommendations: string[];

  priorityPackages: PriorityPackage[];

  conclusion: string;
}

export interface Project {
  path: string;
  name?: string;
  version?: string;

  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface DependencyNode {
  name: string;
  version: string;
  direct: boolean;
  dev: boolean;
  depth: number;
  dependencies: string[];
  dependents: string[];
  vulnerabilities: Vulnerability[];
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export interface DependencyGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface ProjectDependencyGraph {
  project: string;
  graph: DependencyGraphData;
}

export interface UploadResponse {
  status: string;

  extractPath: string;

  projects: Project[];

  dependencyGraphs?: ProjectDependencyGraph[];

  scanResults: ScanResults;

  recommendations: Recommendation[];

  aiReport: AIReport;
}