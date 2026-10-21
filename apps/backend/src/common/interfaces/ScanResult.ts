export interface ScanResult {
  package: string;
  version: string;
  vulnerabilities: any[];
  error?: string;
}
