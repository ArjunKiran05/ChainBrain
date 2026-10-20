import React from "react";
import {
  Radio,
  Key,
  Globe,
  Cpu,
  AlertTriangle,
  Server,
  Database,
  Lock,
} from "lucide-react";
import type { ThreatVector } from "./types";

interface BlastRadiusViewProps {
  activeVector: ThreatVector | null;
  isPatched: boolean;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({
  activeVector,
  isPatched,
}) => {
  if (!activeVector) {
    return (
      <div className="p-8 text-center font-mono text-xs text-slate-500">
        No active threat vector selected.
      </div>
    );
  }

  const { blastRadius } = activeVector;

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border border-slate-700/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 mb-1">
            <Radio className="w-4 h-4 text-amber-400" />
            <span>BLAST RADIUS & ASSET EXPOSURE ANALYSIS</span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            Potential Cascading Damage from{" "}
            <span className="text-rose-400">
              {activeVector.name}@{activeVector.version}
            </span>
          </h3>
          <p className="text-xs text-slate-300 font-sans mt-1">
            Evaluating all runtime secrets, network endpoints, and host processes within the explosive perimeter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              isPatched
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {isPatched ? "Perimeter: Protected / Severed" : "Perimeter: High Exposure"}
          </div>
        </div>
      </div>

      {/* 3 Core Impact Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Compromised Secrets & Tokens */}
        <div className="p-5 rounded-2xl bg-black border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-rose-400 font-bold text-xs flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span>EXPOSED SECRETS & KEYS</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {blastRadius.secrets.length} ITEMS
            </span>
          </div>

          <div className="space-y-2 mt-1">
            {blastRadius.secrets.map((secret) => (
              <div
                key={secret}
                className="p-2.5 rounded-xl bg-slate-950 border border-rose-900/40 text-xs text-rose-200 flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{secret}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 leading-normal mt-2">
            Adversary can extract these environment values directly from the host process memory table.
          </div>
        </div>

        {/* Card 2: Affected API Endpoints */}
        <div className="p-5 rounded-2xl bg-black border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-cyan-400 font-bold text-xs flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>AFFECTED ENDPOINTS</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {blastRadius.endpoints.length} ROUTES
            </span>
          </div>

          <div className="space-y-2 mt-1">
            {blastRadius.endpoints.map((ep) => (
              <div
                key={ep}
                className="p-2.5 rounded-xl bg-slate-950 border border-cyan-900/40 text-xs text-cyan-200 flex items-center gap-2"
              >
                <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{ep}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 leading-normal mt-2">
            These ingress paths ingest untrusted payload data that triggers vulnerable downward call stacks.
          </div>
        </div>

        {/* Card 3: Host Processes & Sockets */}
        <div className="p-5 rounded-2xl bg-black border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-amber-400 font-bold text-xs flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>HOST SYSTEM RESOURCES</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {blastRadius.processes.length} SUBSYSTEMS
            </span>
          </div>

          <div className="space-y-2 mt-1">
            {blastRadius.processes.map((proc) => (
              <div
                key={proc}
                className="p-2.5 rounded-xl bg-slate-950 border border-amber-900/40 text-xs text-amber-200 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{proc}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 leading-normal mt-2">
            Operating system resources and process lifecycles compromised if the attack is not severed.
          </div>
        </div>
      </div>

      {/* Summary Impact Callout */}
      <div className="p-4 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border border-slate-700/60 dark:border-slate-800 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-mono font-bold text-white block mb-0.5">
            CUMULATIVE BLAST RADIUS CONCLUSION:
          </span>
          <span className="text-xs text-slate-300 font-sans leading-relaxed">
            {blastRadius.impactSummary}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlastRadiusView;
