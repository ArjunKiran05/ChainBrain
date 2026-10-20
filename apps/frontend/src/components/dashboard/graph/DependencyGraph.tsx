import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Crosshair,
  Flame,
  Copy,
  Check,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sparkles,
  Terminal,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { useScanStore } from "../../../store/useScanStore";
import type {
  DependencyNode,
  DependencyEdge,
  Vulnerability,
} from "../../../types/upload";

/* -------------------------------------------------------------------------- */
/*                                Types & Models                              */
/* -------------------------------------------------------------------------- */

interface ProcessedNode extends DependencyNode {
  id: string;
  isRoot?: boolean;
  x: number;
  y: number;
  radius: number;
  riskScore: number;
  highestSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
}

interface ProcessedEdge extends DependencyEdge {
  id: string;
  sourceNode?: ProcessedNode;
  targetNode?: ProcessedNode;
}

interface PropagationStep {
  stepIndex: number;
  phase: "INGRESS" | "EXPLOIT" | "PROPAGATE" | "BREACH";
  nodeId: string;
  nodeName: string;
  version: string;
  isRoot: boolean;
  title: string;
  technicalLog: string;
  impactExplanation: string;
  affectedComponents: string[];
}

/* -------------------------------------------------------------------------- */
/*                               Demo Fallback Data                           */
/* -------------------------------------------------------------------------- */

const DEMO_GRAPH_NODES: DependencyNode[] = [
  {
    name: "express",
    version: "4.18.2",
    direct: true,
    dev: false,
    depth: 1,
    dependencies: ["qs@6.11.0", "body-parser@1.20.1"],
    dependents: [],
    vulnerabilities: [],
  },
  {
    name: "jsonwebtoken",
    version: "9.0.0",
    direct: true,
    dev: false,
    depth: 1,
    dependencies: ["lodash.includes@4.3.0"],
    dependents: [],
    vulnerabilities: [
      {
        id: "GHSA-8cf7-32gw-wr33",
        summary: "JsonWebToken Verification Bypass via algorithmic confusion",
        database_specific: { severity: "HIGH" },
      },
    ],
  },
  {
    name: "axios",
    version: "1.5.0",
    direct: true,
    dev: false,
    depth: 1,
    dependencies: ["follow-redirects@1.15.2"],
    dependents: [],
    vulnerabilities: [],
  },
  {
    name: "lodash.includes",
    version: "4.3.0",
    direct: false,
    dev: false,
    depth: 2,
    dependencies: ["lodash@4.17.15"],
    dependents: ["jsonwebtoken@9.0.0"],
    vulnerabilities: [],
  },
  {
    name: "qs",
    version: "6.11.0",
    direct: false,
    dev: false,
    depth: 2,
    dependencies: ["side-channel@1.0.4"],
    dependents: ["express@4.18.2"],
    vulnerabilities: [],
  },
  {
    name: "body-parser",
    version: "1.20.1",
    direct: false,
    dev: false,
    depth: 2,
    dependencies: [],
    dependents: ["express@4.18.2"],
    vulnerabilities: [],
  },
  {
    name: "follow-redirects",
    version: "1.15.2",
    direct: false,
    dev: false,
    depth: 2,
    dependencies: [],
    dependents: ["axios@1.5.0"],
    vulnerabilities: [
      {
        id: "GHSA-cxjh-pqwp-8mfp",
        summary: "Proxy-Authorization Header Exposure in follow-redirects",
        database_specific: { severity: "MEDIUM" },
      },
    ],
  },
  {
    name: "lodash",
    version: "4.17.15",
    direct: false,
    dev: false,
    depth: 3,
    dependencies: [],
    dependents: ["lodash.includes@4.3.0"],
    vulnerabilities: [
      {
        id: "GHSA-p6mc-m468-83gw",
        summary: "Prototype Pollution in lodash via defaultsDeep & zipObjectDeep",
        database_specific: { severity: "CRITICAL" },
      },
      {
        id: "GHSA-29mw-wpgm-hmr9",
        summary: "Regular Expression Denial of Service (ReDoS) in lodash",
        database_specific: { severity: "HIGH" },
      },
    ],
  },
  {
    name: "side-channel",
    version: "1.0.4",
    direct: false,
    dev: false,
    depth: 3,
    dependencies: [],
    dependents: ["qs@6.11.0"],
    vulnerabilities: [],
  },
];

const DEMO_GRAPH_EDGES: DependencyEdge[] = [
  { from: "express@4.18.2", to: "qs@6.11.0" },
  { from: "express@4.18.2", to: "body-parser@1.20.1" },
  { from: "jsonwebtoken@9.0.0", to: "lodash.includes@4.3.0" },
  { from: "axios@1.5.0", to: "follow-redirects@1.15.2" },
  { from: "lodash.includes@4.3.0", to: "lodash@4.17.15" },
  { from: "qs@6.11.0", to: "side-channel@1.0.4" },
];

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

const getHighestSeverity = (
  vulns: Vulnerability[]
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" => {
  if (!vulns || vulns.length === 0) return "NONE";

  const severities = vulns.map((v) => {
    const raw = (
      v.database_specific?.severity ||
      (v as any).ecosystem_specific?.severity ||
      "LOW"
    ).toUpperCase();
    if (raw === "MODERATE") return "MEDIUM";
    return raw;
  });

  if (severities.includes("CRITICAL")) return "CRITICAL";
  if (severities.includes("HIGH")) return "HIGH";
  if (severities.includes("MEDIUM")) return "MEDIUM";
  if (severities.includes("LOW")) return "LOW";
  return "LOW";
};

const calculateNodeRiskScore = (node: DependencyNode): number => {
  let score = 0;
  if (!node.vulnerabilities || node.vulnerabilities.length === 0) {
    return node.direct ? 5 : 1;
  }

  for (const vuln of node.vulnerabilities) {
    const sev = (
      vuln.database_specific?.severity ||
      (vuln as any).ecosystem_specific?.severity ||
      "LOW"
    ).toUpperCase();

    if (sev === "CRITICAL") score += 100;
    else if (sev === "HIGH") score += 50;
    else if (sev === "MEDIUM" || sev === "MODERATE") score += 20;
    else score += 5;
  }

  if (node.direct) score += 20;
  score += Math.min(25, (node.dependents?.length || 0) * 5);
  return score;
};

const getSeverityColor = (
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE"
) => {
  switch (severity) {
    case "CRITICAL":
      return {
        fill: "#450a0a",
        stroke: "#f43f5e",
        text: "#fecdd3",
        glow: "rgba(244, 63, 94, 0.7)",
      };
    case "HIGH":
      return {
        fill: "#431407",
        stroke: "#f97316",
        text: "#fed7aa",
        glow: "rgba(249, 115, 22, 0.6)",
      };
    case "MEDIUM":
      return {
        fill: "#422006",
        stroke: "#eab308",
        text: "#fef08a",
        glow: "rgba(234, 179, 8, 0.5)",
      };
    case "LOW":
      return {
        fill: "#172554",
        stroke: "#38bdf8",
        text: "#bae6fd",
        glow: "rgba(56, 189, 248, 0.4)",
      };
    case "NONE":
    default:
      return {
        fill: "#0f172a",
        stroke: "#334155",
        text: "#94a3b8",
        glow: "none",
      };
  }
};

/* -------------------------------------------------------------------------- */
/*                           Main Component                                   */
/* -------------------------------------------------------------------------- */

export const DependencyGraph = () => {
  const { scanResult } = useScanStore();

  // Mode and view configuration
  const [maxNodesLimit, setMaxNodesLimit] = useState<10 | 15 | 20>(15);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attack Path Simulation states
  const [selectedAttackTarget, setSelectedAttackTarget] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 1.5 | 2>(1);
  const [copiedFix, setCopiedFix] = useState(false);
  const [terminalTab, setTerminalTab] = useState<"terminal" | "ai_exploit" | "remediation">("terminal");

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const terminalLogsRef = useRef<HTMLDivElement>(null);

  const isDemo = !scanResult || !scanResult.dependencyGraphs?.length;

  const rawGraphData = useMemo(() => {
    if (
      scanResult &&
      scanResult.dependencyGraphs &&
      scanResult.dependencyGraphs.length > 0 &&
      scanResult.dependencyGraphs[0].graph.nodes.length > 0
    ) {
      return scanResult.dependencyGraphs[0].graph;
    }

    if (scanResult && scanResult.scanResults?.results?.length > 0) {
      const nodes: DependencyNode[] = scanResult.scanResults.results.map((res) => ({
        name: res.package,
        version: res.version,
        direct: true,
        dev: false,
        depth: 1,
        dependencies: [],
        dependents: [],
        vulnerabilities: res.vulnerabilities || [],
      }));
      return { nodes, edges: [] };
    }

    return {
      nodes: DEMO_GRAPH_NODES,
      edges: DEMO_GRAPH_EDGES,
    };
  }, [scanResult]);

  const projectName =
    scanResult?.projects?.[0]?.name || (isDemo ? "demo-web-service" : "project");

  const rootNodeId = `__root__@${projectName}`;

  /* -------------------------------------------------------------------------- */
  /*                 Top 10-20 High-Risk Node Selection Filter                  */
  /* -------------------------------------------------------------------------- */

  const {
    processedNodes,
    processedEdges,
    nodeMap,
    vulnerableCandidates,
    totalRawPackages,
  } = useMemo(() => {
    const rawNodes = rawGraphData.nodes;
    const totalCount = rawNodes.length;

    // 1. Calculate risk scores for all nodes and rank them
    const scoredNodes = rawNodes.map((node) => ({
      node,
      id: `${node.name}@${node.version}`,
      riskScore: calculateNodeRiskScore(node),
      highestSeverity: getHighestSeverity(node.vulnerabilities),
    }));

    // Sort by risk descending
    scoredNodes.sort((a, b) => b.riskScore - a.riskScore);

    // 2. Select the top N highest risk packages
    const topScored = scoredNodes.slice(0, maxNodesLimit);
    const chosenIds = new Set<string>(topScored.map((s) => s.id));

    // 3. For any transitive node, ensure its parent path to direct dependencies is retained
    topScored.forEach(({ node }) => {
      node.dependents?.forEach((depKey) => {
        if (chosenIds.size < maxNodesLimit + 6) {
          chosenIds.add(depKey);
        }
      });
    });

    const map = new Map<string, ProcessedNode>();
    const vulnIds: string[] = [];

    // 4. Create Root Node
    const rootNode: ProcessedNode = {
      id: rootNodeId,
      name: projectName,
      version: "app",
      direct: true,
      dev: false,
      depth: 0,
      dependencies: [],
      dependents: [],
      vulnerabilities: [],
      isRoot: true,
      x: 450,
      y: 65,
      radius: 30,
      riskScore: 0,
      highestSeverity: "NONE",
    };
    map.set(rootNodeId, rootNode);

    // 5. Populate chosen nodes in the map
    rawNodes.forEach((node) => {
      const id = `${node.name}@${node.version}`;
      if (!chosenIds.has(id)) return;

      const highestSeverity = getHighestSeverity(node.vulnerabilities);
      if (highestSeverity !== "NONE") {
        vulnIds.push(id);
      }

      map.set(id, {
        ...node,
        id,
        isRoot: false,
        x: 0,
        y: 0,
        radius: node.direct ? 24 : 20,
        riskScore: calculateNodeRiskScore(node),
        highestSeverity,
      });
    });

    // 6. Connect Root node to direct nodes
    const rawEdges: DependencyEdge[] = [];
    rawGraphData.edges.forEach((edge) => {
      if (map.has(edge.from) && map.has(edge.to)) {
        rawEdges.push(edge);
      }
    });

    map.forEach((node) => {
      if (node.direct && !node.isRoot) {
        rawEdges.push({ from: rootNodeId, to: node.id });
        rootNode.dependencies.push(node.id);
        node.dependents.push(rootNodeId);
      }
    });

    // 7. Layered Depth Layout with Clean Spacing
    const WIDTH = 920;
    const HEIGHT = 520;
    const depthGroups = new Map<number, ProcessedNode[]>();

    map.forEach((node) => {
      const d = node.isRoot ? 0 : Math.max(1, Math.min(3, node.depth));
      const list = depthGroups.get(d) || [];
      list.push(node);
      depthGroups.set(d, list);
    });

    const sortedDepths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
    const verticalGap = (HEIGHT - 130) / Math.max(1, sortedDepths.length - 1);

    sortedDepths.forEach((depthLevel) => {
      const nodesAtDepth = depthGroups.get(depthLevel) || [];
      const count = nodesAtDepth.length;
      const y = 65 + depthLevel * verticalGap;

      nodesAtDepth.forEach((node, idx) => {
        const spacing = (WIDTH - 120) / (count + 1);
        node.x = 60 + (idx + 1) * spacing;
        node.y = y;
      });
    });

    // 8. Process Edges
    const edges: ProcessedEdge[] = [];
    rawEdges.forEach((edge, index) => {
      const source = map.get(edge.from);
      const target = map.get(edge.to);
      if (source && target) {
        edges.push({
          id: `edge-${index}-${edge.from}->${edge.to}`,
          from: edge.from,
          to: edge.to,
          sourceNode: source,
          targetNode: target,
        });
      }
    });

    return {
      processedNodes: Array.from(map.values()),
      processedEdges: edges,
      nodeMap: map,
      vulnerableCandidates: vulnIds,
      totalRawPackages: totalCount,
    };
  }, [rawGraphData, projectName, rootNodeId, maxNodesLimit]);

  // Set default selected attack target to the highest severity vulnerable node
  useEffect(() => {
    if (!selectedAttackTarget && vulnerableCandidates.length > 0) {
      setSelectedAttackTarget(vulnerableCandidates[0]);
    }
  }, [vulnerableCandidates, selectedAttackTarget]);

  /* -------------------------------------------------------------------------- */
  /*                  Attack Path Computation & Multi-Hop Chain                 */
  /* -------------------------------------------------------------------------- */

  const { attackChain, pathNodesSet, pathEdgesSet, targetNode } = useMemo(() => {
    if (!selectedAttackTarget || !nodeMap.has(selectedAttackTarget)) {
      return {
        attackChain: [] as PropagationStep[],
        pathNodesSet: new Set<string>(),
        pathEdgesSet: new Set<string>(),
        targetNode: null,
      };
    }

    const target = nodeMap.get(selectedAttackTarget)!;
    const pathNodes = new Set<string>([selectedAttackTarget]);
    const pathEdges = new Set<string>();

    // BFS backwards along dependents to reach rootNodeId
    const queue: string[][] = [[selectedAttackTarget]];
    let shortestChain: string[] = [];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const currentId = currentPath[currentPath.length - 1];

      if (currentId === rootNodeId) {
        shortestChain = currentPath.reverse(); // root -> direct -> ... -> target
        break;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodeMap.get(currentId);
      if (!node) continue;

      const parentIds = [...(node.dependents || [])];
      if (node.direct && !parentIds.includes(rootNodeId)) {
        parentIds.push(rootNodeId);
      }

      for (const parentId of parentIds) {
        if (!currentPath.includes(parentId)) {
          queue.push([...currentPath, parentId]);
        }
      }
    }

    if (shortestChain.length === 0) {
      const directParent = processedNodes.find((n) => n.direct && !n.isRoot);
      if (directParent) {
        shortestChain = [rootNodeId, directParent.id, selectedAttackTarget];
      } else {
        shortestChain = [rootNodeId, selectedAttackTarget];
      }
    }

    shortestChain.forEach((id) => pathNodes.add(id));
    for (let i = 0; i < shortestChain.length - 1; i++) {
      pathEdges.add(`${shortestChain[i]}->${shortestChain[i + 1]}`);
    }

    // Build the step-by-step narrative chain
    const steps: PropagationStep[] = [];
    const targetVuln = target.vulnerabilities?.[0];
    const vulnId = targetVuln?.id || "CVE-UNKNOWN";
    const vulnSummary = targetVuln?.summary || "Arbitrary code execution flaw";

    // Step 0: Initial External Ingress
    steps.push({
      stepIndex: 0,
      phase: "INGRESS",
      nodeId: shortestChain[shortestChain.length - 1],
      nodeName: target.name,
      version: target.version,
      isRoot: false,
      title: `1. Threat Actor Initiates Malicious Payload`,
      technicalLog: `[INGRESS] Remote attacker submits crafted payload via untrusted HTTP request targeting ${target.name}@${target.version} API surface (${vulnId}).`,
      impactExplanation: `The attack initiates from public network boundaries. The application accepts external user input which flows unparsed into internal service handlers.`,
      affectedComponents: [target.name],
    });

    // Step 1: Vulnerability Trigger in Target Package
    steps.push({
      stepIndex: 1,
      phase: "EXPLOIT",
      nodeId: target.id,
      nodeName: target.name,
      version: target.version,
      isRoot: false,
      title: `2. Exploit Execution in ${target.name}`,
      technicalLog: `[EXPLOIT] Vulnerability triggered: ${vulnSummary}. State corruption allows memory overwrite, object property injection, or prototype poisoning.`,
      impactExplanation: `${target.name}@${target.version} contains known unpatched vulnerability ${vulnId}. When processing input, internal sanity checks are bypassed, executing attacker-supplied instructions.`,
      affectedComponents: [target.name],
    });

    // Steps 2+: Upstream Propagation along Intermediate & Direct dependencies
    for (let i = shortestChain.length - 2; i > 0; i--) {
      const parentId = shortestChain[i];
      const parentNode = nodeMap.get(parentId);
      if (!parentNode) continue;

      steps.push({
        stepIndex: steps.length,
        phase: "PROPAGATE",
        nodeId: parentId,
        nodeName: parentNode.name,
        version: parentNode.version,
        isRoot: false,
        title: `${steps.length + 1}. Lateral Propagation to ${parentNode.name}`,
        technicalLog: `[PROPAGATE] Poisoned object/state consumed by caller "${parentNode.name}@${parentNode.version}". Downstream trusted contract violated.`,
        impactExplanation: `Because "${parentNode.name}" relies on the compromised library without isolating its execution context, corrupted references propagate into your application's middleware and routing layers.`,
        affectedComponents: [target.name, parentNode.name],
      });
    }

    // Final Step: Host Application Compromise
    steps.push({
      stepIndex: steps.length,
      phase: "BREACH",
      nodeId: rootNodeId,
      nodeName: projectName,
      version: "app",
      isRoot: true,
      title: `${steps.length + 1}. Full Application Impact & Breach`,
      technicalLog: `[BREACH] Host runtime "${projectName}" execution hijacked. Attacker achieves environment compromise (secrets exfiltration, token bypass, or denial of service).`,
      impactExplanation: `The vulnerability in unpinned package "${target.name}" has propagated completely through your dependency graph into "${projectName}". Production services running this build are actively exploitable.`,
      affectedComponents: [projectName, target.name],
    });

    return {
      attackChain: steps,
      pathNodesSet: pathNodes,
      pathEdgesSet: pathEdges,
      targetNode: target,
    };
  }, [selectedAttackTarget, nodeMap, rootNodeId, processedNodes, projectName]);

  /* -------------------------------------------------------------------------- */
  /*                  Real-time Simulation Timer (Autoplay)                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isPlaying || attackChain.length === 0) return;

    const intervalTime = Math.max(1200, 3000 / simSpeed);
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= attackChain.length - 1) {
          return 0; // Loop or stay at finish
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, attackChain.length]);

  // Scroll terminal logs automatically when active step changes
  useEffect(() => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = terminalLogsRef.current.scrollHeight;
    }
  }, [activeStepIndex]);

  const currentStep = attackChain[activeStepIndex] || attackChain[0];

  /* -------------------------------------------------------------------------- */
  /*                          Pan, Zoom & Canvas Events                         */
  /* -------------------------------------------------------------------------- */

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCopyFix = (packageName: string) => {
    navigator.clipboard.writeText(`npm install ${packageName}@latest`);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  return (
    <section
      ref={containerRef}
      className={`glass-card rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-300 relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none bg-slate-950/98 backdrop-blur-2xl p-6 overflow-y-auto"
          : ""
      }`}
    >
      {/* Background ambient security glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* -------------------------------------------------------------------- */}
      {/* Top Header: Title, Focus Scope & Target Exploit Selector             */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-5 h-5 animate-pulse text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Attack Propagation Visualizer
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Focus: Top {maxNodesLimit} High-Risk Threat Surface
                </span>
                {totalRawPackages > maxNodesLimit && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Filtered from {totalRawPackages} total packages)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time simulation tracing how unpinned transitive dependencies
                compromise application entry points.
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Target Selector, Scope Limit & Screen Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Node Scope Limit Pill (10 vs 15 vs 20) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <span className="text-slate-400 px-2 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3" /> Scope:
            </span>
            {([10, 15, 20] as const).map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setMaxNodesLimit(limit)}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  maxNodesLimit === limit
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Top {limit}
              </button>
            ))}
          </div>

          {/* Launch Dedicated Attack Studio button */}
          <Link
            to="/simulator"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-md shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Open Dedicated Full-Screen Attack Simulator Studio"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse text-amber-200" />
            <span>Open Attack Studio</span>
          </Link>

          {/* Reset & Fullscreen */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              title="Reset View"
              onClick={resetZoomAndPan}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Simulation Command Strip: Target selector + Step Controller          */}
      {/* -------------------------------------------------------------------- */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-indigo-950/40 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Crosshair className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
              Exploit Target Vector
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedAttackTarget || ""}
                onChange={(e) => {
                  setSelectedAttackTarget(e.target.value);
                  setActiveStepIndex(0);
                }}
                className="bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 cursor-pointer"
              >
                {vulnerableCandidates.map((id) => {
                  const n = nodeMap.get(id);
                  return (
                    <option key={id} value={id}>
                      {id} [{n?.highestSeverity || "VULNERABLE"}]
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Playback Controller */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              setActiveStepIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={activeStepIndex === 0}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 rounded-xl transition-all"
            title="Step Back"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
              isPlaying
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play Live</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveStepIndex((prev) =>
                Math.min(attackChain.length - 1, prev + 1)
              )
            }
            disabled={activeStepIndex >= attackChain.length - 1}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 rounded-xl transition-all"
            title="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 p-0.5 rounded-xl text-[11px] font-bold">
            {([1, 1.5, 2] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  simSpeed === s
                    ? "bg-rose-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Main Grid: SVG Visualizer (Left) + Interactive Shell Console (Right) */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* SVG Graph Viewport (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col">
          <div
            className="relative w-full h-[480px] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Subtle grid background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#64748b 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
            />

            <svg
              ref={svgRef}
              className="w-full h-full"
              viewBox="0 0 920 520"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="20"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                </marker>

                <marker
                  id="arrow-attack-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                </marker>

                <linearGradient id="attack-beam" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>

                <radialGradient id="root-app-glow">
                  <stop offset="0%" stopColor="#a5b4fc" />
                  <stop offset="60%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#312e81" />
                </radialGradient>
              </defs>

              <g
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                transform-origin="460 260"
              >
                {/* ---------------- Edges Layer ---------------- */}
                <g className="edges-layer">
                  {processedEdges.map((edge) => {
                    const { sourceNode, targetNode } = edge;
                    if (!sourceNode || !targetNode) return null;

                    const isAttackEdge =
                      pathEdgesSet.has(`${edge.from}->${edge.to}`) ||
                      pathEdgesSet.has(`${edge.to}->${edge.from}`);

                    const isEdgeActiveNow =
                      isAttackEdge &&
                      (currentStep?.nodeId === edge.from ||
                        currentStep?.nodeId === edge.to);

                    const curveY = (sourceNode.y + targetNode.y) / 2;
                    const pathD = `M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x} ${curveY}, ${targetNode.x} ${curveY}, ${targetNode.x} ${targetNode.y}`;

                    return (
                      <g key={edge.id}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={
                            isEdgeActiveNow
                              ? "#f43f5e"
                              : isAttackEdge
                              ? "url(#attack-beam)"
                              : "#334155"
                          }
                          strokeWidth={isEdgeActiveNow ? 4 : isAttackEdge ? 2.5 : 1.2}
                          strokeDasharray={isAttackEdge ? "6 4" : "none"}
                          opacity={isAttackEdge ? 1 : 0.25}
                          markerEnd={
                            isAttackEdge
                              ? "url(#arrow-attack-active)"
                              : "url(#arrow-default)"
                          }
                          className="transition-all duration-300"
                        />

                        {/* Animated Laser Pulse traveling along active edge */}
                        {isAttackEdge && isPlaying && (
                          <circle r="4.5" fill="#f43f5e">
                            <animateMotion
                              path={pathD}
                              dur={`${2.2 / simSpeed}s`}
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* ---------------- Nodes Layer ---------------- */}
                <g className="nodes-layer">
                  {processedNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    const isTarget = node.id === selectedAttackTarget;
                    const isCurrentHop = currentStep?.nodeId === node.id;
                    const isPathNode = pathNodesSet.has(node.id);

                    const colorConfig = getSeverityColor(node.highestSeverity);

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        opacity={isPathNode ? 1 : 0.4}
                      >
                        {/* Active Hop Shockwave Ripple */}
                        {isCurrentHop && (
                          <circle
                            r={node.radius + 14}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                            className="animate-ping"
                            opacity="0.8"
                          />
                        )}

                        {/* Target spinning outer ring */}
                        {(isTarget || isSelected) && (
                          <circle
                            r={node.radius + 10}
                            fill="none"
                            stroke={isTarget ? "#f43f5e" : "#6366f1"}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                            className="animate-spin"
                            style={{
                              transformOrigin: "center",
                              animationDuration: "6s",
                            }}
                          />
                        )}

                        {/* Main Node Circle */}
                        <circle
                          r={node.radius}
                          fill={
                            node.isRoot
                              ? "url(#root-app-glow)"
                              : colorConfig.fill
                          }
                          stroke={
                            node.isRoot
                              ? "#818cf8"
                              : isCurrentHop
                              ? "#f43f5e"
                              : colorConfig.stroke
                          }
                          strokeWidth={
                            node.isRoot ? 3.5 : isCurrentHop ? 3 : 2
                          }
                          style={{
                            filter:
                              isCurrentHop || node.highestSeverity === "CRITICAL"
                                ? "drop-shadow(0 0 10px rgba(244, 63, 94, 0.8))"
                                : node.highestSeverity === "HIGH"
                                ? "drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))"
                                : "none",
                          }}
                        />

                        {/* Center Icon / Text */}
                        {node.isRoot ? (
                          <text
                            textAnchor="middle"
                            dy="4"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            className="pointer-events-none tracking-wider"
                          >
                            APP
                          </text>
                        ) : node.highestSeverity !== "NONE" ? (
                          <text
                            textAnchor="middle"
                            dy="4"
                            fill={colorConfig.text}
                            fontSize="11"
                            fontWeight="extrabold"
                            className="pointer-events-none"
                          >
                            !
                          </text>
                        ) : (
                          <circle
                            r="3"
                            fill={colorConfig.stroke}
                            className="pointer-events-none"
                          />
                        )}

                        {/* Node Label */}
                        <g transform={`translate(0, ${node.radius + 14})`}>
                          <text
                            textAnchor="middle"
                            fill={
                              isCurrentHop
                                ? "#f43f5e"
                                : isSelected || isHovered
                                ? "#ffffff"
                                : "#cbd5e1"
                            }
                            fontSize={node.isRoot ? "12" : "10"}
                            fontWeight={
                              node.isRoot || node.direct || isCurrentHop
                                ? "bold"
                                : "normal"
                            }
                            className="pointer-events-none"
                          >
                            {node.name.length > 15
                              ? `${node.name.substring(0, 13)}…`
                              : node.name}
                          </text>

                          {!node.isRoot && (
                            <text
                              textAnchor="middle"
                              dy="10"
                              fill="#64748b"
                              fontSize="8"
                              className="pointer-events-none font-mono"
                            >
                              v{node.version}
                            </text>
                          )}
                        </g>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>

            {/* Viewport Zoom Overlay */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
              <button
                type="button"
                title="Zoom In"
                onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Zoom Out"
                onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Reset View"
                onClick={resetZoomAndPan}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Legend Badge */}
            <div className="absolute bottom-4 left-4 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 backdrop-blur-md flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Host Root</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Active Hop</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Vulnerable</span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Interactive Shell & Security Event Narrator (Right 5 Cols)         */}
        {/* ------------------------------------------------------------------ */}
        <div className="xl:col-span-5 flex flex-col rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden h-[480px]">
          {/* Terminal Title Bar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>attack-simulator@chainbrain:~</span>
              </span>
            </div>

            {/* Terminal Tab Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTerminalTab("terminal")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  terminalTab === "terminal"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live Log
              </button>
              <button
                type="button"
                onClick={() => setTerminalTab("ai_exploit")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  terminalTab === "ai_exploit"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Threat Matrix
              </button>
              <button
                type="button"
                onClick={() => setTerminalTab("remediation")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  terminalTab === "remediation"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Remediation
              </button>
            </div>
          </div>

          {/* Terminal Content Body */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed" ref={terminalLogsRef}>
            {terminalTab === "terminal" ? (
              <div className="space-y-3">
                <div className="text-[11px] text-cyan-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>[STATUS: {isPlaying ? "SIMULATION RUNNING" : "PAUSED"}]</span>
                  <span>STEP {activeStepIndex + 1} OF {attackChain.length}</span>
                </div>

                {attackChain.slice(0, activeStepIndex + 1).map((step, idx) => {
                  const isLatest = idx === activeStepIndex;
                  return (
                    <div
                      key={step.stepIndex}
                      className={`p-3 rounded-xl border transition-all ${
                        isLatest
                          ? "bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-950/50"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span
                          className={`${
                            step.phase === "BREACH"
                              ? "text-rose-400"
                              : step.phase === "EXPLOIT"
                              ? "text-amber-400"
                              : "text-cyan-400"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          T+{idx * 2}s
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-200 mt-1">
                        {step.technicalLog}
                      </p>

                      <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>{step.impactExplanation}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Blinking prompt line */}
                <div className="flex items-center gap-2 text-cyan-400 pt-2 text-[11px]">
                  <span>root@chainbrain#</span>
                  <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />
                </div>
              </div>
            ) : terminalTab === "ai_exploit" ? (
              /* Threat Matrix & Whole Project Impact Breakdown */
              <div className="space-y-4 font-sans text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Whole-Project Impact Analysis</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    This exploit does not stay quarantined in{" "}
                    <code className="text-rose-300">
                      {targetNode?.name}@{targetNode?.version}
                    </code>
                    . Because Node.js shares global prototype structures and single-threaded event loops, exploiting this unpinned transitive module allows unauthenticated actors to breach upstream business logic in{" "}
                    <strong className="text-white">{projectName}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Attack Origin Depth
                    </span>
                    <span className="text-base font-extrabold text-white mt-0.5 block">
                      Depth {targetNode?.depth || "Transitive"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {targetNode?.direct ? "Direct Dependency" : "Transitive Library"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Propagation Reach
                    </span>
                    <span className="text-base font-extrabold text-rose-400 mt-0.5 block">
                      {attackChain.length - 1} Hops to Root
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Directly poisons host runtime
                    </span>
                  </div>
                </div>

                {targetNode?.vulnerabilities?.[0] && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 block mb-1">
                      Advisory Metadata:
                    </span>
                    <p className="font-mono text-[11px] text-rose-400 font-bold">
                      {targetNode.vulnerabilities[0].id}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {targetNode.vulnerabilities[0].summary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Remediation Tab */
              <div className="space-y-4 font-sans text-xs">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                  <span className="font-bold text-white text-sm block mb-1">
                    Immediate Remediation Step
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Update the vulnerable dependency or override its transitive resolution
                    in your project's lockfile.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Bash Command
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyFix(targetNode?.name || selectedAttackTarget || "")
                      }
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      {copiedFix ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Fix</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 rounded-xl bg-black font-mono text-xs text-emerald-400 overflow-x-auto">
                    npm install {targetNode?.name || selectedAttackTarget}@latest
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Timeline Footer */}
          <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              Active Stage: <strong className="text-white">{currentStep?.title}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              {attackChain.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveStepIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    i === activeStepIndex
                      ? "bg-rose-500 scale-125 shadow-sm shadow-rose-500"
                      : i < activeStepIndex
                      ? "bg-emerald-500"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  title={`Jump to step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Node Inspector Drawer (When clicked)                                 */}
      {/* -------------------------------------------------------------------- */}
      {selectedNode && (
        <div className="mt-6 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  selectedNode.highestSeverity === "CRITICAL"
                    ? "bg-rose-500"
                    : selectedNode.highestSeverity === "HIGH"
                    ? "bg-amber-500"
                    : selectedNode.highestSeverity === "MEDIUM"
                    ? "bg-yellow-400"
                    : "bg-emerald-500"
                }`}
              />
              <h3 className="text-lg font-extrabold text-white">
                {selectedNode.name}
                <span className="text-sm font-mono text-slate-400 ml-2">
                  @{selectedNode.version}
                </span>
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {selectedNode.direct
                  ? "Direct Dependency"
                  : `Transitive (Depth ${selectedNode.depth})`}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {selectedNode.vulnerabilities.length > 0 ? (
                <span className="text-rose-400 font-semibold">
                  ⚠️ {selectedNode.vulnerabilities.length} known security advisory
                  reported by OSV.dev
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
                  ✅ Clean - No known CVE vulnerabilities reported in this installed version.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedNode.highestSeverity !== "NONE" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAttackTarget(selectedNode.id);
                  setActiveStepIndex(0);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Simulate Attack from this Node</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCopyFix(selectedNode.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              {copiedFix ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied `npm install`</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default DependencyGraph;
