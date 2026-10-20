import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Check,
  Terminal,
  FileJson,
  Shield,
  Zap,
} from "lucide-react";
import type { ThreatVector } from "./types";

interface RemediationPanelProps {
  activeVector: ThreatVector | null;
  isPatched: boolean;
  onTogglePatch: () => void;
}

export const RemediationPanel: React.FC<RemediationPanelProps> = ({
  activeVector,
  isPatched,
  onTogglePatch,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [pmTab, setPmTab] = useState<"npm" | "yarn" | "pnpm">("npm");

  if (!activeVector) {
    return (
      <div className="p-8 text-center font-mono text-xs text-slate-500">
        No active threat vector selected.
      </div>
    );
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getPmCommand = () => {
    switch (pmTab) {
      case "yarn":
        return `yarn add ${activeVector.name}@${activeVector.safeVersion}`;
      case "pnpm":
        return `pnpm add ${activeVector.name}@${activeVector.safeVersion}`;
      case "npm":
      default:
        return `npm install ${activeVector.name}@${activeVector.safeVersion} --save`;
    }
  };

  const overridesSnippet = JSON.stringify(
    {
      overrides: {
        [activeVector.name]: activeVector.safeVersion,
      },
    },
    null,
    2
  );

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Upper Status & Interactive Shield Simulator */}
      <div className="p-4 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border border-slate-700/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
              isPatched
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            {isPatched ? (
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-slate-400">
              REMEDIATION STATUS
            </div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
              <span>
                {isPatched ? "Defense Shield Deployed" : "Vulnerability Active (Unshielded)"}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isPatched
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {isPatched ? "ATTACK SEVERED" : "BREACH POSSIBLE"}
              </span>
            </div>
          </div>
        </div>

        {/* Test Defense Shield Interactive Button */}
        <button
          type="button"
          onClick={onTogglePatch}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
            isPatched
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25"
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isPatched ? "Remove Virtual Shield" : "Simulate Defense Shield"}</span>
        </button>
      </div>

      {/* Grid: 3 Remediation Pathways */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pathway 1: Package Manager Upgrade Command */}
        <div className="p-4 rounded-2xl bg-black border border-slate-800 flex flex-col justify-between gap-3 font-mono">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                <span>1. DIRECT PACKAGE UPGRADE</span>
              </span>
              <span className="text-[10px] text-slate-500">RECOMMENDED</span>
            </div>

            {/* PM Selector */}
            <div className="flex items-center gap-1 mt-3 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
              {(["npm", "yarn", "pnpm"] as const).map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPmTab(pm)}
                  className={`flex-1 py-1 rounded-md transition-all cursor-pointer font-bold ${
                    pmTab === pm
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-slate-950 text-xs text-slate-200 border border-slate-850">
              <code>{getPmCommand()}</code>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 leading-normal">
              Pins safe release version ({activeVector.safeVersion}) to patch {activeVector.cveId}.
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(getPmCommand(), "pm")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer border border-slate-700"
          >
            {copiedType === "pm" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        {/* Pathway 2: package.json Overrides Generator */}
        <div className="p-4 rounded-2xl bg-black border border-slate-800 flex flex-col justify-between gap-3 font-mono">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <FileJson className="w-4 h-4" />
                <span>2. TRANSITIVE OVERRIDES</span>
              </span>
              <span className="text-[10px] text-slate-500">LOCKFILE FIX</span>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-slate-950 text-xs text-amber-200/90 border border-slate-850 overflow-x-auto">
              <pre>{overridesSnippet}</pre>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 leading-normal">
              Forces all transitive callers to resolve to minimum safe patch without breaking dependencies.
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(overridesSnippet, "overrides")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer border border-slate-700"
          >
            {copiedType === "overrides" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied JSON Snippet!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Overrides Block</span>
              </>
            )}
          </button>
        </div>

        {/* Pathway 3: Virtual Patch / WAF Middleware */}
        <div className="p-4 rounded-2xl bg-black border border-slate-800 flex flex-col justify-between gap-3 font-mono">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>3. VIRTUAL PATCH WAF</span>
              </span>
              <span className="text-[10px] text-slate-500">HOTFIX</span>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-slate-950 text-xs text-emerald-200/90 border border-slate-850 overflow-x-auto max-h-24">
              <pre className="whitespace-pre-wrap">{activeVector.virtualPatch}</pre>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 leading-normal">
              Immediately sanitizes incoming payloads at runtime before they reach vulnerable library.
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(activeVector.virtualPatch, "waf")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer border border-slate-700"
          >
            {copiedType === "waf" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Middleware!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Virtual Patch Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemediationPanel;
