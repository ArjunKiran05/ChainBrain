import React, { useState, useMemo, useEffect } from "react";
import { useScanStore } from "../../../store/useScanStore";
import type {
  ThreatVector,
  SimulatorNode,
  SimulatorEdge,
  UpwardHop,
  TerminalEntry,
  PerspectiveView,
} from "./types";
import { TOP_20_THREAT_CATALOG } from "./threatCatalog";
import {
  isSoundEnabled,
  setSoundEnabled,
  playTacticalClick,
  playHopSound,
  playBreachAlarm,
  playDefenseShieldChime,
} from "./soundEffects";

import SimulatorHeader from "./SimulatorHeader";
import SimulatorPlaybackBar from "./SimulatorPlaybackBar";
import SimulatorCanvas from "./SimulatorCanvas";
import ExploitTracePanel from "./ExploitTracePanel";
import RemediationPanel from "./RemediationPanel";
import InteractiveCyberConsole from "./InteractiveCyberConsole";
import MitreAttackMatrix from "./MitreAttackMatrix";
import BlastRadiusView from "./BlastRadiusView";
import ThreatCatalogDrawer from "./ThreatCatalogDrawer";
import IncidentReportModal from "./IncidentReportModal";

import {
  Terminal,
  ShieldCheck,
  FileCode,
} from "lucide-react";

export const AttackSimulator: React.FC = () => {
  const { scanResult } = useScanStore();

  const isDemo = !scanResult || !scanResult.dependencyGraphs?.length;
  const projectName =
    scanResult?.projects?.[0]?.name || (isDemo ? "owasp-nodejs-goat" : "active-project");
  const rootNodeId = `__root__@${projectName}`;

  // 1. Merge Real Scanned Packages with Threat Catalog
  const fullCatalog = useMemo(() => {
    const list: ThreatVector[] = [...TOP_20_THREAT_CATALOG];

    if (scanResult?.scanResults?.results) {
      scanResult.scanResults.results.forEach((pkg) => {
        if (pkg.vulnerabilities && pkg.vulnerabilities.length > 0) {
          const firstVuln = pkg.vulnerabilities[0];
          const calculatedSev =
            (firstVuln.database_specific?.severity as any) || "HIGH";
          const exists = list.find((v) => v.name === pkg.package);

          if (!exists) {
            list.unshift({
              id: `${pkg.package}-${pkg.version}`,
              name: pkg.package,
              version: pkg.version,
              depth: 3,
              direct: false,
              filePath: `node_modules/${pkg.package}/index.js`,
              parentName: "express",
              parentVersion: "4.18.2",
              parentFilePath: "src/server.js:45",
              exploitType: firstVuln.summary?.substring(0, 32) || "Vulnerability Exploit",
              category: "RCE",
              cveId: firstVuln.id || "CVE-SCANNED",
              cwe: "CWE-Unknown",
              cvss: calculatedSev === "CRITICAL" ? 9.8 : calculatedSev === "HIGH" ? 7.5 : 5.0,
              severity: calculatedSev === "CRITICAL" ? "CRITICAL" : calculatedSev === "HIGH" ? "HIGH" : "MEDIUM",
              summary: firstVuln.summary || "Real scan advisory discovered in application dependency tree.",
              mitreTactic: "Execution",
              mitreTechnique: "T1203 - Exploitation for Client Execution",
              safeVersion: "^latest",
              payloadSample: `// Scanned exploit trigger payload for ${pkg.package}@${pkg.version}\nrequire('${pkg.package}').execute(untrustedInput);`,
              leafCode: `// Discovered in scan: ${pkg.package}@${pkg.version}\nfunction execute(input) { return unverified(input); }`,
              parentBridgeCode: `const handler = require('${pkg.package}');\nhandler.process(req.data);`,
              rootMountCode: `app.use(apiRouter);`,
              virtualPatch: `// Input guard for ${pkg.package}\napp.use((req, res, next) => { /* validate inputs */ next(); });`,
              propagationMechanism: `Package "${pkg.package}@${pkg.version}" contains vulnerability ${firstVuln.id || "advisory"}. Data ingested from HTTP request parameters flows unchecked into the leaf module.`,
              technicalLog: `[SCAN_ALERT] Remote payload delivered to ${pkg.package}. Downstream advisory ${firstVuln.id || "CVE-UNKNOWN"} triggered.`,
              threatImpact: "Arbitrary execution context poisoned. Caller module passes unverified response to root controller.",
              callStackFrames: [
                {
                  file: `node_modules/${pkg.package}/index.js`,
                  line: 12,
                  fn: "execute(input)",
                  code: "return unverified(input);",
                  tainted: true,
                  description: "Ingests raw user input without validation.",
                },
                {
                  file: "src/server.js",
                  line: 45,
                  fn: "app.use(apiRouter)",
                  code: "handler.process(req.data);",
                  tainted: false,
                  description: "Caller router forwards request data to vulnerable package.",
                },
              ],
              blastRadius: {
                secrets: ["Application Environment Variables", "Local Process Memory"],
                endpoints: ["/api/v1/*"],
                processes: ["Node.js Host Process"],
                impactSummary: "Transitive exploit reachable via application HTTP router.",
              },
            });
          }
        }
      });
    }

    return list;
  }, [scanResult]);

  // State
  const [selectedVectorId, setSelectedVectorId] = useState<string>(
    `${fullCatalog[0]?.name}@${fullCatalog[0]?.version}`
  );
  const [activeHopIndex, setActiveHopIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState<0.5 | 1 | 2>(1);
  const [isPatched, setIsPatched] = useState(false);
  const [activeView, setActiveView] = useState<PerspectiveView>("graph");
  const [activeTab, setActiveTab] = useState<"logs" | "remediation" | "console">("logs");
  const [selectedNode, setSelectedNode] = useState<SimulatorNode | null>(null);
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled());
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Threat Vector
  const activeVector = useMemo(() => {
    return (
      fullCatalog.find(
        (v) => `${v.name}@${v.version}` === selectedVectorId
      ) || fullCatalog[0]
    );
  }, [fullCatalog, selectedVectorId]);

  // Terminal Streaming Logs
  const [terminalLogs, setTerminalLogs] = useState<TerminalEntry[]>([
    {
      id: "sys-init",
      timestamp: "00:00:01",
      type: "system",
      text: "ChainBrain Threat Vector Engine initialized. Real-time upward simulation armed.",
    },
    {
      id: "sys-ready",
      timestamp: "00:00:02",
      type: "info",
      text: "Monitoring unpinned transitive dependency propagation from leaf nodes to host runtime.",
    },
  ]);

  /* -------------------------------------------------------------------------- */
  /*       2. Construct Hierarchical Topological Graph Coordinates              */
  /* -------------------------------------------------------------------------- */

  const { nodeMap, processedNodes, processedEdges } = useMemo(() => {
    const finalMap = new Map<string, SimulatorNode>();

    // Root Node (Host) at Zone 0 top center
    const rootNode: SimulatorNode = {
      id: rootNodeId,
      name: projectName,
      version: "host",
      direct: true,
      dev: false,
      depth: 0,
      level: 0,
      x: 460,
      y: 65,
      radius: 36,
      highestSeverity: "NONE",
      filePath: "src/server.js",
      exploitType: "Host Application Process & Runtime",
      isRoot: true,
    };
    finalMap.set(rootNodeId, rootNode);

    // Group active vectors into levels
    const level1Nodes = new Map<string, SimulatorNode>();
    const level2Nodes = new Map<string, SimulatorNode>();
    const level3Nodes = new Map<string, SimulatorNode>();

    const activeScope = fullCatalog.slice(0, 15);

    activeScope.forEach((vector) => {
      const leafId = `${vector.name}@${vector.version}`;
      const parentId = `${vector.parentName}@${vector.parentVersion}`;

      // Level 3 (Leaf)
      if (!level3Nodes.has(leafId)) {
        level3Nodes.set(leafId, {
          id: leafId,
          name: vector.name,
          version: vector.version,
          direct: vector.direct,
          dev: false,
          depth: vector.depth,
          level: 3,
          x: 0,
          y: 0,
          radius: 22,
          highestSeverity: vector.severity,
          filePath: vector.filePath,
          exploitType: vector.exploitType,
          isRoot: false,
          category: vector.category,
        });
      }

      // Level 2 (Transitive Bridge)
      if (!vector.direct && !level2Nodes.has(parentId)) {
        level2Nodes.set(parentId, {
          id: parentId,
          name: vector.parentName,
          version: vector.parentVersion,
          direct: false,
          dev: false,
          depth: 2,
          level: 2,
          x: 0,
          y: 0,
          radius: 24,
          highestSeverity: "NONE",
          filePath: vector.parentFilePath,
          exploitType: "Transitive Bridge Package",
          isRoot: false,
        });
      }

      // Level 1 (Direct Gateway)
      const directGateId = `express@4.18.2`;
      if (!level1Nodes.has(directGateId)) {
        level1Nodes.set(directGateId, {
          id: directGateId,
          name: "express",
          version: "4.18.2",
          direct: true,
          dev: false,
          depth: 1,
          level: 1,
          x: 0,
          y: 0,
          radius: 28,
          highestSeverity: "NONE",
          filePath: "src/app.js",
          exploitType: "Core Web Framework / Router",
          isRoot: false,
        });
      }
    });

    // Position Level 1 (Direct Gateways - y = 185)
    const l1List = Array.from(level1Nodes.values());
    l1List.forEach((n, idx) => {
      n.x = 100 + ((idx + 1) * (920 - 200)) / (l1List.length + 1);
      n.y = 185;
      finalMap.set(n.id, n);
    });

    // Position Level 2 (Transitive Bridges - y = 305)
    const l2List = Array.from(level2Nodes.values());
    l2List.forEach((n, idx) => {
      n.x = 90 + ((idx + 1) * (920 - 180)) / (l2List.length + 1);
      n.y = 305;
      finalMap.set(n.id, n);
    });

    // Position Level 3 (Leaf Injection - y = 435)
    const l3List = Array.from(level3Nodes.values());
    l3List.forEach((n, idx) => {
      n.x = 60 + ((idx + 1) * (920 - 120)) / (l3List.length + 1);
      n.y = 435;
      finalMap.set(n.id, n);
    });

    // Build directed UPWARD edges (Bottom -> Upward)
    const upwardEdges: SimulatorEdge[] = [];

    l3List.forEach((leaf) => {
      const vec = fullCatalog.find((v) => `${v.name}@${v.version}` === leaf.id);
      const parentKey = vec?.direct
        ? l1List[0]?.id || rootNodeId
        : `${vec?.parentName}@${vec?.parentVersion}`;
      const target = finalMap.get(parentKey) || l2List[0] || l1List[0] || rootNode;

      upwardEdges.push({
        id: `upward-${leaf.id}->${target.id}`,
        from: leaf.id,
        to: target.id,
        sourceNode: leaf,
        targetNode: target,
      });
    });

    l2List.forEach((bridge, idx) => {
      const targetL1 = l1List[idx % l1List.length] || rootNode;
      upwardEdges.push({
        id: `upward-${bridge.id}->${targetL1.id}`,
        from: bridge.id,
        to: targetL1.id,
        sourceNode: bridge,
        targetNode: targetL1,
      });
    });

    l1List.forEach((direct) => {
      upwardEdges.push({
        id: `upward-${direct.id}->${rootNode.id}`,
        from: direct.id,
        to: rootNode.id,
        sourceNode: direct,
        targetNode: rootNode,
      });
    });

    return {
      nodeMap: finalMap,
      processedNodes: Array.from(finalMap.values()),
      processedEdges: upwardEdges,
    };
  }, [fullCatalog, projectName, rootNodeId]);

  /* -------------------------------------------------------------------------- */
  /*       3. Construct Upward Attack Chain Hops for Active Vector              */
  /* -------------------------------------------------------------------------- */

  const upwardChain: UpwardHop[] = useMemo(() => {
    if (!activeVector) return [];

    const leafId = `${activeVector.name}@${activeVector.version}`;
    const pathIds: string[] = [leafId];
    let current = leafId;
    const visited = new Set<string>();

    while (current !== rootNodeId && !visited.has(current)) {
      visited.add(current);
      const edge = processedEdges.find((e) => e.from === current);
      if (edge) {
        pathIds.push(edge.to);
        current = edge.to;
      } else {
        pathIds.push(rootNodeId);
        break;
      }
    }

    if (pathIds[pathIds.length - 1] !== rootNodeId) {
      pathIds.push(rootNodeId);
    }

    return pathIds.map((nodeId, idx) => {
      const node = nodeMap.get(nodeId);
      const isLeaf = idx === 0;
      const isRoot = nodeId === rootNodeId;
      const parentId = pathIds[idx + 1];
      const parentNode = parentId ? nodeMap.get(parentId) : null;

      let mechanism = "";
      let log = "";
      let impact = "";
      let code = "";

      if (isLeaf) {
        mechanism = activeVector.propagationMechanism;
        log = `[HOP 0: LEAF INGESTION] Exploiting unpatched ${activeVector.name}@${activeVector.version} (${activeVector.cveId}). File: ${activeVector.filePath}. Tainted payload: ${activeVector.exploitType}.`;
        impact = activeVector.threatImpact;
        code = activeVector.leafCode;
      } else if (isRoot) {
        mechanism = `Host application "${projectName}" mounts top-level middleware from "${pathIds[idx - 1]}". Corrupted execution ascends into master server process lifecycle.`;
        log = `[HOP ${idx}: HOST BREACH] Infiltration reaches application entry "${projectName}". Process dominance attained! Host environment variables & secrets compromised.`;
        impact = "CRITICAL: Server runtime fully compromised. Remote adversary possesses capabilities equivalent to the application host process.";
        code = activeVector.rootMountCode;
      } else {
        mechanism = `Intermediate bridge "${node?.name}@${node?.version}" imports downstream "${pathIds[idx - 1]}". Because it forwards returned parameters without strict sanitization, corrupted execution state ascends into "${parentNode?.name || projectName}".`;
        log = `[HOP ${idx}: ESCALATE] Corrupted memory buffer ascends into "${node?.name}@${node?.version}". Boundary crossed without AST filter; poisoned object handed to caller.`;
        impact = `Transitive encapsulation breached. Injected state is now reachable by "${parentNode?.name || projectName}".`;
        code = activeVector.parentBridgeCode;
      }

      return {
        hopIndex: idx,
        nodeId,
        nodeName: node?.name || nodeId,
        version: node?.version || "",
        isLeaf,
        isRoot,
        level: node?.level ?? 2,
        severity: isLeaf ? activeVector.severity : isRoot ? "CRITICAL" : "MEDIUM",
        filePath: node?.filePath || activeVector.filePath,
        propagationMechanism: mechanism,
        technicalLog: log,
        threatImpact: impact,
        codeSnippet: code,
        callStackFrame: activeVector.callStackFrames[idx],
      };
    });
  }, [activeVector, processedEdges, nodeMap, rootNodeId, projectName]);

  /* -------------------------------------------------------------------------- */
  /*       4. Playback Timer for Real-Time Hop Infiltration                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isPlaying || upwardChain.length === 0) return;

    const intervalTime = Math.max(1200, 2400 / simSpeed);
    const timer = setInterval(() => {
      setActiveHopIndex((prev) => {
        if (prev >= upwardChain.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        // Sound cue
        if (soundActive) {
          const hop = upwardChain[next];
          if (hop?.isRoot && !isPatched) {
            playBreachAlarm();
          } else {
            playHopSound(hop?.severity || "HIGH");
          }
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, upwardChain, soundActive, isPatched]);

  // Log active hop into terminal stream
  useEffect(() => {
    const hop = upwardChain[activeHopIndex];
    if (hop) {
      const now = new Date().toTimeString().split(" ")[0];
      const entryType = isPatched
        ? "defense"
        : hop.isRoot
        ? "breach"
        : hop.isLeaf
        ? "exploit"
        : "warning";

      setTerminalLogs((prev) => [
        ...prev,
        {
          id: `hop-${Date.now()}-${activeHopIndex}`,
          timestamp: now,
          type: entryType,
          text: hop.technicalLog,
        },
      ]);
    }
  }, [activeHopIndex, upwardChain, isPatched]);

  const handleSelectHop = (idx: number) => {
    playTacticalClick();
    setActiveHopIndex(idx);
    setIsPlaying(false);
    if (soundActive) {
      const hop = upwardChain[idx];
      if (hop?.isRoot && !isPatched) {
        playBreachAlarm();
      } else {
        playHopSound(hop?.severity || "MEDIUM");
      }
    }
  };

  const handleTogglePatch = () => {
    const nextState = !isPatched;
    setIsPatched(nextState);
    if (nextState) {
      playDefenseShieldChime();
      const now = new Date().toTimeString().split(" ")[0];
      setTerminalLogs((prev) => [
        ...prev,
        {
          id: `shield-${Date.now()}`,
          timestamp: now,
          type: "defense",
          text: `[DEFENSE SHIELD ENGAGED] Attack path severed at ${activeVector?.name}@${activeVector?.version}. Ingress vector neutralized.`,
        },
      ]);
    } else {
      playTacticalClick();
    }
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playTacticalClick();
  };

  const handleSelectVector = (vector: ThreatVector) => {
    playTacticalClick();
    setSelectedVectorId(`${vector.name}@${vector.version}`);
    setActiveHopIndex(0);
    setIsPlaying(false);
    setIsPatched(false);
  };

  return (
    <div
      className={`flex flex-col gap-5 w-full transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#030712] p-6 overflow-y-auto"
          : ""
      }`}
    >
      {/* 1. Top HUD Command Header */}
      <SimulatorHeader
        projectName={projectName}
        activeVector={activeVector}
        activeHopIndex={activeHopIndex}
        totalHops={upwardChain.length}
        isPatched={isPatched}
        activeView={activeView}
        onViewChange={(v) => {
          playTacticalClick();
          setActiveView(v);
        }}
        onOpenCatalog={() => {
          playTacticalClick();
          setIsCatalogOpen(true);
        }}
        onOpenReport={() => {
          playTacticalClick();
          setIsReportOpen(true);
        }}
        soundEnabled={soundActive}
        onToggleSound={handleToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => {
          playTacticalClick();
          setIsFullscreen(!isFullscreen);
        }}
      />

      {/* 2. Interactive Playback Transport Bar */}
      <SimulatorPlaybackBar
        upwardChain={upwardChain}
        activeHopIndex={activeHopIndex}
        onSelectHop={handleSelectHop}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          playTacticalClick();
          setIsPlaying(!isPlaying);
        }}
        simSpeed={simSpeed}
        onChangeSpeed={(s) => {
          playTacticalClick();
          setSimSpeed(s);
        }}
        onReset={() => {
          playTacticalClick();
          setActiveHopIndex(0);
          setIsPlaying(false);
        }}
        isPatched={isPatched}
        onTogglePatch={handleTogglePatch}
      />

      {/* 3. Primary Studio Perspective View */}
      {activeView === "graph" && (
        <SimulatorCanvas
          nodes={processedNodes}
          edges={processedEdges}
          upwardChain={upwardChain}
          activeHopIndex={activeHopIndex}
          selectedLeafTarget={selectedVectorId}
          isPatched={isPatched}
          simSpeed={simSpeed}
          onNodeClick={(node) => {
            playTacticalClick();
            setSelectedNode(node);
          }}
          selectedNode={selectedNode}
          onCloseNodeDetails={() => setSelectedNode(null)}
        />
      )}

      {activeView === "mitre" && (
        <div className="w-full rounded-3xl bg-slate-900/90 dark:bg-[#070d1d]/90 border border-slate-700/60 dark:border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden">
          <MitreAttackMatrix
            activeVector={activeVector}
            activeHopIndex={activeHopIndex}
            totalHops={upwardChain.length}
            isPatched={isPatched}
          />
        </div>
      )}

      {activeView === "blast_radius" && (
        <div className="w-full rounded-3xl bg-slate-900/90 dark:bg-[#070d1d]/90 border border-slate-700/60 dark:border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden">
          <BlastRadiusView
            activeVector={activeVector}
            isPatched={isPatched}
          />
        </div>
      )}

      {/* 4. Lower Cyber Intelligence Workbench Suite */}
      <div className="w-full rounded-3xl bg-slate-900/90 dark:bg-[#070d1d]/90 border border-slate-700/60 dark:border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Workbench Tab Bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">
              WORKBENCH:
            </span>
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  playTacticalClick();
                  setActiveTab("logs");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  activeTab === "logs"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Exploit Call-Stack</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTacticalClick();
                  setActiveTab("remediation");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  activeTab === "remediation"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1-Click Remediation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTacticalClick();
                  setActiveTab("console");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  activeTab === "console"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Interactive Cyber CLI</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>STAGE {activeHopIndex + 1}/{upwardChain.length}</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">{upwardChain[activeHopIndex]?.nodeName}</span>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "logs" && (
          <ExploitTracePanel
            activeVector={activeVector}
            currentHop={upwardChain[activeHopIndex]}
            activeHopIndex={activeHopIndex}
            totalHops={upwardChain.length}
          />
        )}

        {activeTab === "remediation" && (
          <RemediationPanel
            activeVector={activeVector}
            isPatched={isPatched}
            onTogglePatch={handleTogglePatch}
          />
        )}

        {activeTab === "console" && (
          <InteractiveCyberConsole
            logs={terminalLogs}
            activeVector={activeVector}
            upwardChain={upwardChain}
            activeHopIndex={activeHopIndex}
            onSelectHop={handleSelectHop}
            isPatched={isPatched}
            onTogglePatch={handleTogglePatch}
            onClearLogs={() => setTerminalLogs([])}
            onAddLog={(entry) => setTerminalLogs((p) => [...p, entry])}
            onOpenReport={() => setIsReportOpen(true)}
          />
        )}
      </div>

      {/* 5. Drawers & Modals */}
      <ThreatCatalogDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        vectors={fullCatalog}
        selectedVectorId={selectedVectorId}
        onSelectVector={handleSelectVector}
      />

      <IncidentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        activeVector={activeVector}
        projectName={projectName}
      />
    </div>
  );
};

export default AttackSimulator;
