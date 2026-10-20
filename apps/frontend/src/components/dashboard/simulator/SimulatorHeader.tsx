import React from "react";
import {
  Flame,
  Radio,
  Volume2,
  VolumeX,
  FileText,
  Maximize2,
  Minimize2,
  Layers,
  Network,
  Crosshair,
  SlidersHorizontal,
} from "lucide-react";
import type { ThreatVector, PerspectiveView } from "./types";

interface SimulatorHeaderProps {
  projectName: string;
  activeVector: ThreatVector | null;
  activeHopIndex: number;
  totalHops: number;
  isPatched: boolean;
  activeView: PerspectiveView;
  onViewChange: (view: PerspectiveView) => void;
  onOpenCatalog: () => void;
  onOpenReport: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const SimulatorHeader: React.FC<SimulatorHeaderProps> = ({
  projectName,
  activeVector,
  activeHopIndex,
  totalHops,
  isPatched,
  activeView,
  onViewChange,
  onOpenCatalog,
  onOpenReport,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  // Compute DEFCON threat posture
  const isBreached = activeHopIndex === totalHops - 1 && !isPatched;
  const isCritical = activeVector?.severity === "CRITICAL";

  let defconLabel = "DEFCON 3 · ELEVATED THREAT";
  let defconColor = "from-amber-500/20 to-amber-600/20 border-amber-500/40 text-amber-400";
  let defconDot = "bg-amber-400";

  if (isPatched) {
    defconLabel = "DEFCON 5 · VECTOR SHIELDED";
    defconColor = "from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 text-emerald-400";
    defconDot = "bg-emerald-400";
  } else if (isBreached) {
    defconLabel = "DEFCON 1 · HOST RUNTIME BREACHED";
    defconColor = "from-rose-500/30 to-red-600/30 border-rose-500 text-rose-300 animate-pulse";
    defconDot = "bg-rose-500 animate-ping";
  } else if (isCritical) {
    defconLabel = "DEFCON 2 · CRITICAL INFILTRATION";
    defconColor = "from-rose-500/20 to-amber-500/20 border-rose-500/50 text-rose-400";
    defconDot = "bg-rose-500";
  }

  return (
    <div className="w-full rounded-3xl bg-slate-900/90 dark:bg-[#070d1d]/90 border border-slate-700/60 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl p-5 relative overflow-hidden transition-all">
      {/* Background Ambient Cyber Glow */}
      <div className="absolute -top-10 right-1/3 w-96 h-40 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Row 1: Tactical Context & DEFCON Status */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-700/50 dark:border-slate-800/60">
        {/* Left: Project Context & DEFCON Banner */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/25 to-amber-500/25 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-sm">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Target Application
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  LIVE TELEMETRY
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{projectName}</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-lg bg-slate-800/60 dark:bg-slate-800 text-slate-300 border border-slate-700/60">
                  Node.js / Express
                </span>
              </h2>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-700/50 dark:bg-slate-800" />

          {/* DEFCON Indicator Badge */}
          <div
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border bg-gradient-to-r ${defconColor} text-xs font-mono font-bold shadow-sm transition-all`}
          >
            <span className={`w-2 h-2 rounded-full ${defconDot}`} />
            <span>{defconLabel}</span>
          </div>

          {/* Active Vector Tag */}
          {activeVector && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 dark:bg-slate-950/80 border border-slate-700/70 dark:border-slate-800 text-xs font-mono text-slate-200">
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-white">{activeVector.name}@{activeVector.version}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                CVSS {activeVector.cvss.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Threat Vector Catalog Drawer Button */}
          <button
            type="button"
            onClick={onOpenCatalog}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono text-slate-200 bg-slate-800/90 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 border border-slate-700/80 dark:border-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Threat Catalog</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">
              20
            </span>
          </button>

          {/* Generate Incident Advisory Report */}
          <button
            type="button"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono text-slate-200 bg-slate-800/90 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 border border-slate-700/80 dark:border-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Generate CISO / Security Advisory Brief"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Incident Brief</span>
          </button>

          {/* Sound Synthesizer Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-xl text-xs border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title={soundEnabled ? "Mute Tactical Audio" : "Enable Tactical Audio Synthesizer"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Fullscreen HUD Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-xs bg-slate-800/60 dark:bg-slate-900 text-slate-400 hover:text-white border border-slate-700/70 dark:border-slate-800 transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen HUD" : "Enter Fullscreen Cyber HUD"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Perspective View Switcher Tabs */}
      <div className="flex items-center justify-between gap-4 pt-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => onViewChange("graph")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeView === "graph"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Topological Exploit Graph</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange("mitre")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeView === "mitre"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MITRE ATT&CK Kill-Chain</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange("blast_radius")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeView === "blast_radius"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Blast Radius & Assets</span>
          </button>
        </div>

        {/* Security Posture Summary Pill */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Exploit: <span className="text-white font-bold">{activeVector?.category || "RCE"}</span>
          </span>
          <span>•</span>
          <span>
            CWE: <span className="text-cyan-400 font-bold">{activeVector?.cwe.split(" ")[0]}</span>
          </span>
          <span>•</span>
          <span>
            Safe: <span className="text-emerald-400 font-bold">{activeVector?.safeVersion}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimulatorHeader;
