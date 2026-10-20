export type ThreatCategory =
  | "RCE"
  | "PROTOTYPE_POLLUTION"
  | "XSS"
  | "SSRF"
  | "DOS"
  | "PATH_TRAVERSAL"
  | "BUFFER_OVERFLOW"
  | "AUTH_BYPASS";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface CallStackFrame {
  file: string;
  line: number;
  fn: string;
  code: string;
  tainted: boolean;
  description: string;
}

export interface BlastRadiusData {
  secrets: string[];
  endpoints: string[];
  processes: string[];
  impactSummary: string;
}

export interface ThreatVector {
  id: string;
  name: string;
  version: string;
  depth: number;
  direct: boolean;
  filePath: string;
  parentName: string;
  parentVersion: string;
  parentFilePath: string;
  exploitType: string;
  category: ThreatCategory;
  cveId: string;
  cwe: string;
  cvss: number;
  severity: SeverityLevel;
  summary: string;
  mitreTactic: string;
  mitreTechnique: string;
  safeVersion: string;
  payloadSample: string;
  leafCode: string;
  parentBridgeCode: string;
  rootMountCode: string;
  virtualPatch: string;
  propagationMechanism: string;
  technicalLog: string;
  threatImpact: string;
  callStackFrames: CallStackFrame[];
  blastRadius: BlastRadiusData;
}

export interface SimulatorNode {
  id: string;
  name: string;
  version: string;
  direct: boolean;
  dev: boolean;
  depth: number;
  level: number; // 0 = Host (top), 1 = Direct Gateway, 2 = Intermediate Bridge, 3 = Vulnerable Leaf (bottom)
  x: number;
  y: number;
  radius: number;
  highestSeverity: SeverityLevel | "NONE";
  filePath: string;
  exploitType: string;
  isRoot: boolean;
  isPatched?: boolean;
  isCompromised?: boolean;
  category?: ThreatCategory;
}

export interface SimulatorEdge {
  id: string;
  from: string; // Child / Leaf / Lower
  to: string; // Parent / Host / Upper
  sourceNode: SimulatorNode;
  targetNode: SimulatorNode;
  isSevered?: boolean;
}

export interface UpwardHop {
  hopIndex: number;
  nodeId: string;
  nodeName: string;
  version: string;
  isLeaf: boolean;
  isRoot: boolean;
  level: number;
  severity: SeverityLevel | "NONE";
  vulnerabilityId?: string;
  filePath: string;
  propagationMechanism: string;
  technicalLog: string;
  threatImpact: string;
  codeSnippet: string;
  callStackFrame?: CallStackFrame;
}

export interface TerminalEntry {
  id: string;
  timestamp: string;
  type: "system" | "info" | "warning" | "exploit" | "breach" | "defense" | "command";
  text: string;
  meta?: Record<string, any>;
}

export type PerspectiveView = "graph" | "mitre" | "blast_radius";
