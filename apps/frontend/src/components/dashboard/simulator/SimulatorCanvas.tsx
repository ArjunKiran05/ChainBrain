import React, { useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code2,
  Copy,
  Check,
  LocateFixed,
  AlertTriangle,
  Server,
  Workflow,
  Cpu,
} from "lucide-react";
import type {
  SimulatorNode,
  SimulatorEdge,
  UpwardHop,
} from "./types";

interface SimulatorCanvasProps {
  nodes: SimulatorNode[];
  edges: SimulatorEdge[];
  upwardChain: UpwardHop[];
  activeHopIndex: number;
  selectedLeafTarget: string | null;
  isPatched: boolean;
  simSpeed: 0.5 | 1 | 2;
  onNodeClick: (node: SimulatorNode) => void;
  selectedNode: SimulatorNode | null;
  onCloseNodeDetails: () => void;
}

export const SimulatorCanvas: React.FC<SimulatorCanvasProps> = ({
  nodes,
  edges,
  upwardChain,
  activeHopIndex,
  selectedLeafTarget,
  isPatched,
  simSpeed,
  onNodeClick,
  selectedNode,
  onCloseNodeDetails,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [copiedFix, setCopiedFix] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const currentHop = upwardChain[activeHopIndex];
  const activeHopNodeId = currentHop?.nodeId;

  // Active path node IDs and edge IDs
  const activePathNodeIds = new Set(upwardChain.map((h) => h.nodeId));
  const activePathEdgeKeys = new Set<string>();
  for (let i = 0; i < upwardChain.length - 1; i++) {
    activePathEdgeKeys.add(`${upwardChain[i].nodeId}->${upwardChain[i + 1].nodeId}`);
  }

  // Mouse drag handlers
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

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Center on active node
  const centerOnActiveNode = () => {
    if (!activeHopNodeId) return;
    const node = nodes.find((n) => n.id === activeHopNodeId);
    if (!node) return;
    setPan({
      x: 460 - node.x,
      y: 260 - node.y,
    });
    setZoom(1.15);
  };

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[540px] rounded-3xl border border-slate-700/60 dark:border-slate-800 bg-[#060b18] overflow-hidden select-none shadow-2xl cursor-grab active:cursor-grabbing transition-colors"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Cyber Grid & Vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 cyber-dot-pattern"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#060b18] via-transparent to-transparent opacity-80" />

      {/* Layer Boundaries Overlay (Zone Markers) */}
      <div className="absolute left-6 top-0 bottom-0 pointer-events-none flex flex-col justify-between py-8 z-10 text-[10px] font-mono font-bold tracking-wider">
        {/* Zone 0 */}
        <div className="flex items-center gap-2 text-indigo-300 bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-700/50 backdrop-blur-md shadow-lg">
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>ZONE 0: HOST PROCESS & RUNTIME (server.js)</span>
        </div>

        {/* Zone 1 */}
        <div className="flex items-center gap-2 text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-lg">
          <Workflow className="w-3.5 h-3.5 text-cyan-400" />
          <span>ZONE 1: DIRECT DEPENDENCIES & WEB ROUTERS</span>
        </div>

        {/* Zone 2 */}
        <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/60 backdrop-blur-md shadow-lg">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>ZONE 2: TRANSITIVE BRIDGE LIBRARIES</span>
        </div>

        {/* Zone 3 */}
        <div className="flex items-center gap-2 text-rose-300 bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800/60 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>ZONE 3: VULNERABLE LEAF NODES (INJECTION ROOTS)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full"
        viewBox="0 0 920 520"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrowhead default */}
          <marker
            id="sim-arrow-default"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
          </marker>

          {/* Arrowhead active attack laser */}
          <marker
            id="sim-arrow-active"
            viewBox="0 0 10 10"
            refX="26"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>

          {/* Arrowhead patched shield */}
          <marker
            id="sim-arrow-shield"
            viewBox="0 0 10 10"
            refX="26"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>

          {/* Upward Laser Beam Gradient */}
          <linearGradient id="sim-upward-laser" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>

          {/* Patched Shield Gradient */}
          <linearGradient id="sim-shield-laser" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Host Node Radial Glow */}
          <radialGradient id="sim-host-glow">
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#312e81" />
          </radialGradient>
        </defs>

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: "460px 260px" }}
        >
          {/* 1. Edges Layer (Drawn Upwards from Child to Parent) */}
          <g className="edges-layer">
            {edges.map((edge) => {
              const { sourceNode, targetNode } = edge;
              if (!sourceNode || !targetNode) return null;

              const edgeKey = `${edge.from}->${edge.to}`;
              const isOnActivePath = activePathEdgeKeys.has(edgeKey);
              const isCurrentFiring =
                isOnActivePath &&
                currentHop &&
                currentHop.nodeId === edge.from &&
                !isPatched;

              const curveY = (sourceNode.y + targetNode.y) / 2;
              const pathD = `M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x} ${curveY}, ${targetNode.x} ${curveY}, ${targetNode.x} ${targetNode.y}`;

              return (
                <g key={edge.id}>
                  {/* Outer Glow Path on Active Infiltration */}
                  {isOnActivePath && !isPatched && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="8"
                      strokeOpacity="0.25"
                      className="blur-sm"
                    />
                  )}

                  {/* Main Path Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isPatched && isOnActivePath
                        ? "#10b981"
                        : isCurrentFiring
                        ? "#f43f5e"
                        : isOnActivePath
                        ? "url(#sim-upward-laser)"
                        : "#1e293b"
                    }
                    strokeWidth={
                      isPatched && isOnActivePath
                        ? 2.5
                        : isCurrentFiring
                        ? 4.5
                        : isOnActivePath
                        ? 3
                        : 1.2
                    }
                    strokeDasharray={
                      isPatched && isOnActivePath
                        ? "6 4"
                        : isOnActivePath
                        ? "8 4"
                        : "none"
                    }
                    opacity={isOnActivePath ? 1 : 0.25}
                    markerEnd={
                      isPatched && isOnActivePath
                        ? "url(#sim-arrow-shield)"
                        : isOnActivePath
                        ? "url(#sim-arrow-active)"
                        : "url(#sim-arrow-default)"
                    }
                    className="transition-all duration-300"
                  />

                  {/* Laser Particle Traveling UPWARDS along the edge */}
                  {isOnActivePath && !isPatched && (
                    <circle r="4.5" fill="#f43f5e">
                      <animateMotion
                        path={pathD}
                        dur={`${2 / simSpeed}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Nodes Layer */}
          <g className="nodes-layer">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isTargetOrigin = node.id === selectedLeafTarget;
              const isCurrentActive = activeHopNodeId === node.id;
              const isOnActivePath = activePathNodeIds.has(node.id);
              const isHostBreached =
                node.isRoot &&
                activeHopIndex === upwardChain.length - 1 &&
                !isPatched;

              // Color configs based on severity & state
              let strokeColor = "#334155";
              let fillColor = "#0b1329";
              let textColor = "#94a3b8";

              if (node.isRoot) {
                if (isPatched) {
                  strokeColor = "#10b981";
                  fillColor = "#064e3b";
                } else if (isHostBreached) {
                  strokeColor = "#f43f5e";
                  fillColor = "#450a0a";
                } else {
                  strokeColor = "#818cf8";
                  fillColor = "url(#sim-host-glow)";
                }
              } else if (node.highestSeverity === "CRITICAL") {
                strokeColor = "#f43f5e";
                fillColor = isCurrentActive ? "#4c0519" : "#300814";
                textColor = "#fecdd3";
              } else if (node.highestSeverity === "HIGH") {
                strokeColor = "#f97316";
                fillColor = "#351508";
                textColor = "#fed7aa";
              } else if (node.highestSeverity === "MEDIUM") {
                strokeColor = "#eab308";
                fillColor = "#2d1a04";
                textColor = "#fef08a";
              } else {
                strokeColor = "#38bdf8";
                fillColor = "#082f49";
                textColor = "#bae6fd";
              }

              if (isPatched && isOnActivePath) {
                strokeColor = "#10b981";
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(node);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  opacity={isOnActivePath ? 1 : 0.3}
                >
                  {/* Ping shockwave when node is the active hop */}
                  {isCurrentActive && !isPatched && (
                    <circle
                      r={node.radius + 18}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      className="animate-ping"
                      opacity="0.8"
                    />
                  )}

                  {/* Shield glow when patched */}
                  {isPatched && isOnActivePath && (
                    <circle
                      r={node.radius + 10}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{
                        transformOrigin: "center",
                        animationDuration: "8s",
                      }}
                    />
                  )}

                  {/* Target Origin Spinning Crosshairs Ring */}
                  {isTargetOrigin && !isPatched && (
                    <circle
                      r={node.radius + 10}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{
                        transformOrigin: "center",
                        animationDuration: "5s",
                      }}
                    />
                  )}

                  {/* Selected Outer Halo */}
                  {isSelected && (
                    <circle
                      r={node.radius + 8}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Main Circle Body */}
                  <circle
                    r={node.radius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={
                      node.isRoot || isCurrentActive || isSelected ? 3.5 : 2
                    }
                    style={{
                      filter:
                        isCurrentActive || isHostBreached
                          ? "drop-shadow(0 0 16px rgba(244, 63, 94, 0.9))"
                          : isPatched && isOnActivePath
                          ? "drop-shadow(0 0 14px rgba(16, 185, 129, 0.8))"
                          : node.highestSeverity === "CRITICAL"
                          ? "drop-shadow(0 0 8px rgba(244, 63, 94, 0.5))"
                          : "none",
                    }}
                  />

                  {/* Center Emblem / Icon */}
                  {node.isRoot ? (
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      className="pointer-events-none font-mono tracking-wider"
                    >
                      {isPatched ? "SHIELD" : isHostBreached ? "BREACH" : "HOST"}
                    </text>
                  ) : node.highestSeverity !== "NONE" ? (
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill={isPatched ? "#a7f3d0" : textColor}
                      fontSize="12"
                      fontWeight="extrabold"
                      className="pointer-events-none font-mono"
                    >
                      {isPatched ? "✓" : "!"}
                    </text>
                  ) : (
                    <circle
                      r="3.5"
                      fill={isPatched ? "#10b981" : strokeColor}
                      className="pointer-events-none"
                    />
                  )}

                  {/* Package Label */}
                  <g transform={`translate(0, ${node.radius + 15})`}>
                    <text
                      textAnchor="middle"
                      fill={
                        isCurrentActive
                          ? isPatched
                            ? "#10b981"
                            : "#f43f5e"
                          : isSelected || isHovered
                          ? "#ffffff"
                          : "#cbd5e1"
                      }
                      fontSize={node.isRoot ? "12" : "10"}
                      fontWeight={
                        node.isRoot || node.direct || isCurrentActive
                          ? "bold"
                          : "normal"
                      }
                      className="pointer-events-none font-mono"
                    >
                      {node.name.length > 15
                        ? `${node.name.substring(0, 13)}…`
                        : node.name}
                    </text>

                    {!node.isRoot && (
                      <text
                        textAnchor="middle"
                        dy="11"
                        fill="#64748b"
                        fontSize="8.5"
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

      {/* Floating Canvas Camera Tools (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-700/70 rounded-2xl shadow-2xl backdrop-blur-md z-10">
        <button
          type="button"
          title="Center on Active Infiltration Node"
          onClick={centerOnActiveNode}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <LocateFixed className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          type="button"
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Reset Zoom & Pan"
          onClick={resetView}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Minimap Radar Thumbnail (Bottom Left) */}
      <div className="absolute bottom-4 left-6 hidden md:block w-36 h-24 rounded-2xl bg-black/80 border border-slate-800 p-2 shadow-2xl backdrop-blur-md z-10 pointer-events-none">
        <div className="w-full h-full relative">
          <div className="absolute top-1 left-1 text-[8px] font-mono font-bold text-slate-500 uppercase">
            Radar
          </div>
          {nodes.map((n) => {
            const rx = (n.x / 920) * 100;
            const ry = (n.y / 520) * 100;
            const isOnPath = activePathNodeIds.has(n.id);
            return (
              <div
                key={`radar-${n.id}`}
                className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                  n.isRoot
                    ? "bg-indigo-400"
                    : isOnPath
                    ? isPatched
                      ? "bg-emerald-400"
                      : "bg-rose-500 animate-pulse"
                    : "bg-slate-600"
                }`}
                style={{ left: `${rx}%`, top: `${ry}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Interactive Node Telemetry Inspector Popover (Top Right) */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-84 p-5 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl z-20 text-xs font-mono transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>
                {selectedNode.name}@{selectedNode.version}
              </span>
            </span>
            <button
              type="button"
              onClick={onCloseNodeDetails}
              className="text-slate-400 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2 text-slate-300">
            <div>
              <span className="text-slate-500">Path: </span>
              <span className="text-cyan-300 font-mono text-[11px]">
                {selectedNode.filePath || "src/index.js"}
              </span>
            </div>

            <div>
              <span className="text-slate-500">Topology Role: </span>
              <span className="font-bold text-white">
                {selectedNode.isRoot
                  ? "Host Application Runtime"
                  : selectedNode.direct
                  ? "Direct Application Gateway"
                  : "Transitive Bridge Module"}
              </span>
            </div>

            <div>
              <span className="text-slate-500">Threat Classification: </span>
              <span className="text-rose-400 font-bold block mt-0.5">
                {selectedNode.exploitType || "Standard Dependency"}
              </span>
            </div>

            {selectedNode.highestSeverity !== "NONE" && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300 mt-2">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Severity: {selectedNode.highestSeverity}</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Discovered vulnerability allows propagation into application host lifecycle.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">npm remediation:</span>
            <button
              type="button"
              onClick={() => handleCopyCommand(`npm install ${selectedNode.name}@latest`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer shadow-md"
            >
              {copiedFix ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulatorCanvas;
