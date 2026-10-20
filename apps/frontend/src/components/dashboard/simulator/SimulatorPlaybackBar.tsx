import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import type { UpwardHop } from "./types";

interface SimulatorPlaybackBarProps {
  upwardChain: UpwardHop[];
  activeHopIndex: number;
  onSelectHop: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  simSpeed: 0.5 | 1 | 2;
  onChangeSpeed: (speed: 0.5 | 1 | 2) => void;
  onReset: () => void;
  isPatched: boolean;
  onTogglePatch: () => void;
}

export const SimulatorPlaybackBar: React.FC<SimulatorPlaybackBarProps> = ({
  upwardChain,
  activeHopIndex,
  onSelectHop,
  isPlaying,
  onTogglePlay,
  simSpeed,
  onChangeSpeed,
  onReset,
  isPatched,
  onTogglePatch,
}) => {
  const currentHop = upwardChain[activeHopIndex];
  const isBreached = activeHopIndex === upwardChain.length - 1 && !isPatched;

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 dark:bg-[#070d1d]/90 border border-slate-700/60 dark:border-slate-800/80 shadow-xl backdrop-blur-xl p-4 flex flex-col gap-3">
      {/* Upper Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectHop(Math.max(0, activeHopIndex - 1))}
              disabled={activeHopIndex === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg transition-all cursor-pointer"
              title="Previous Hop (Downwards)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                isPlaying
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  : isPatched
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Infiltration</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Propagate Vector</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectHop(Math.min(upwardChain.length - 1, activeHopIndex + 1))}
              disabled={activeHopIndex >= upwardChain.length - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg transition-all cursor-pointer"
              title="Next Hop (Upwards to Host)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all cursor-pointer"
            title="Reset to Origin Leaf"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Presets */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs font-mono font-bold">
            {([0.5, 1, 2] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  simSpeed === s
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Stage Narrative & 1-Click Shield Button */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-300 hidden sm:flex items-center gap-2">
            <span className="text-slate-500 font-bold">Active Stage:</span>
            <span className="text-cyan-400 font-bold">
              {currentHop?.isLeaf
                ? "Leaf Ingestion"
                : currentHop?.isRoot
                ? "Host Execution Breach"
                : `Hop ${activeHopIndex} Escalation`}
            </span>
          </div>

          {/* Sever / Shield Button */}
          <button
            type="button"
            onClick={onTogglePatch}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-md active:scale-95 cursor-pointer border ${
              isPatched
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/40 hover:bg-rose-500/20"
            }`}
          >
            {isPatched ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Defense Shield Active</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Sever Vector (Virtual Patch)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upward Interactive Scrubbing Track */}
      <div className="w-full pt-1 overflow-x-auto pb-1 flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold shrink-0 flex items-center gap-1">
          <ArrowUp className="w-3 h-3 text-rose-500 animate-bounce" /> Path:
        </span>

        {upwardChain.map((hop, idx) => {
          const isCurrent = idx === activeHopIndex;
          const isCompleted = idx < activeHopIndex;
          const isBreachNode = hop.isRoot && isBreached;

          return (
            <React.Fragment key={hop.nodeId}>
              <button
                type="button"
                onClick={() => onSelectHop(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isCurrent
                    ? isPatched
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 scale-105"
                      : isBreachNode
                      ? "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40 scale-105 animate-hazard-pulse"
                      : "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-105"
                    : isCompleted
                    ? isPatched
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                      : "bg-rose-950/40 text-rose-300 border-rose-800/60"
                    : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <span className="text-[10px] opacity-75">
                  {hop.isLeaf ? "🌱 LEAF" : hop.isRoot ? "👑 HOST" : `L${hop.level}`}
                </span>
                <span>{hop.nodeName}</span>
                {isCompleted && <span className="text-[10px] text-emerald-400">✓</span>}
              </button>

              {idx < upwardChain.length - 1 && (
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 ${
                    idx < activeHopIndex
                      ? isPatched
                        ? "text-emerald-500"
                        : "text-rose-500"
                      : "text-slate-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default SimulatorPlaybackBar;
