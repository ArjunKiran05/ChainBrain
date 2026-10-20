import React from "react";
import { Layers } from "lucide-react";
import type { ThreatVector } from "./types";

interface MitreAttackMatrixProps {
  activeVector: ThreatVector | null;
  activeHopIndex: number;
  totalHops: number;
  isPatched: boolean;
}

interface MitrePhase {
  id: string;
  name: string;
  techniqueId: string;
  techniqueName: string;
  description: string;
  detection: string;
  mitigation: string;
}

const MITRE_KILL_CHAIN: MitrePhase[] = [
  {
    id: "phase-1",
    name: "1. Initial Access",
    techniqueId: "T1195.002",
    techniqueName: "Supply Chain Compromise: Compromised Software Dependencies",
    description: "Adversaries leverage unpinned, outdated, or poisoned third-party dependencies in the application dependency tree.",
    detection: "Automated SBOM scanning, lockfile hash verification, and dependency vulnerability audits.",
    mitigation: "Strict semantic version pinning, transitive overrides, and private artifact caching.",
  },
  {
    id: "phase-2",
    name: "2. Execution",
    techniqueId: "T1059.007",
    techniqueName: "Command & Scripting Interpreter: JavaScript / Node.js",
    description: "Unsanitized user inputs flow into dynamic evaluation sinks (Function, eval, child_process, or regex engine).",
    detection: "Static AST taint analysis, dynamic application security testing (DAST), and runtime exception monitors.",
    mitigation: "Contextual input sanitization, strict schema validation, and disabling unsafe eval sinks.",
  },
  {
    id: "phase-3",
    name: "3. Defense Evasion",
    techniqueId: "T1562.001",
    techniqueName: "Impair Defenses: Disable or Bypass Security Controls",
    description: "Attacker exploits prototype pollution or AST parser boundaries to nullify authentication checks and sandbox isolation.",
    detection: "Integrity monitoring of Object.prototype and Node.js VM context boundary checks.",
    mitigation: "Object.freeze(Object.prototype), running compute workers in hardened V8 isolates.",
  },
  {
    id: "phase-4",
    name: "4. Privilege Escalation",
    techniqueId: "T1068",
    techniqueName: "Exploitation for Privilege Escalation",
    description: "Forged cryptographic credentials or polluted runtime properties elevate unauthenticated traffic to Superadmin status.",
    detection: "Token algorithm pinning, cryptographic signature verification, and RBAC anomaly alerts.",
    mitigation: "Explicit JWT algorithm whitelisting and strictly segregated admin privilege boundaries.",
  },
  {
    id: "phase-5",
    name: "5. Lateral Movement",
    techniqueId: "T1090",
    techniqueName: "Proxy & Transitive Bridge Traversal",
    description: "Corrupted execution state propagates across intermediate libraries to reach internal microservices and intranet metadata.",
    detection: "Network egress socket inspection and metadata IP (169.254.169.254) access alerting.",
    mitigation: "Egress firewall rules blocking RFC1918 / Cloud link-local addresses from server runtimes.",
  },
  {
    id: "phase-6",
    name: "6. Host Impact",
    techniqueId: "T1499",
    techniqueName: "Endpoint Denial of Service & Host Process Takeover",
    description: "Adversary gains full host shell capability, exfiltrates environment secrets, or triggers V8 process death.",
    detection: "Container drift detection, unexpected child_process spawns, and heap memory alarms.",
    mitigation: "Read-only container filesystems, unprivileged container execution, and secrets vault integration.",
  },
];

export const MitreAttackMatrix: React.FC<MitreAttackMatrixProps> = ({
  activeVector,
  activeHopIndex,
  totalHops,
  isPatched,
}) => {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border border-slate-700/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400 mb-1">
            <Layers className="w-4 h-4 text-rose-500" />
            <span>MITRE ATT&CK ENTERPRISE FRAMEWORK</span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            Supply Chain Kill-Chain Mapping:{" "}
            <span className="text-rose-400">
              {activeVector?.name}@{activeVector?.version}
            </span>
          </h3>
          <p className="text-xs text-slate-300 font-sans mt-1">
            Mapping the 6 attack phases required for an adversary to transition from a leaf dependency vulnerability to full host takeover.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs font-mono text-slate-300">
            <span className="text-slate-500 font-bold">Attack Phase: </span>
            <span className="text-white font-bold">
              {activeHopIndex === 0
                ? "Initial Ingestion"
                : activeHopIndex === totalHops - 1
                ? "Host Process Impact"
                : "Privilege Escalation"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Kill-Chain Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MITRE_KILL_CHAIN.map((phase, idx) => {
          const isPhaseActive =
            idx === Math.min(idx, Math.floor((activeHopIndex / (totalHops - 1)) * 5));

          return (
            <div
              key={phase.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isPhaseActive
                  ? isPatched
                    ? "bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                    : "bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-500/10 animate-hazard-pulse"
                  : "bg-slate-900/60 dark:bg-slate-950/70 border-slate-800 text-slate-400"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold pb-2 border-b border-slate-800/80">
                  <span className={isPhaseActive ? (isPatched ? "text-emerald-400" : "text-rose-400") : "text-slate-400"}>
                    {phase.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {phase.techniqueId}
                  </span>
                </div>

                <div className="mt-2 text-xs font-bold text-white font-sans">
                  {phase.techniqueName}
                </div>

                <p className="mt-1.5 text-xs text-slate-300 font-sans leading-relaxed">
                  {phase.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-1 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Detection: </span>
                  <span className="text-slate-300">{phase.detection}</span>
                </div>
                <div>
                  <span className="text-slate-500">Mitigation: </span>
                  <span className="text-emerald-400 font-semibold">{phase.mitigation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MitreAttackMatrix;
