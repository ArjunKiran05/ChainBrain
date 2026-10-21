import React, { useState, useRef, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";
import type { TerminalEntry, ThreatVector, UpwardHop } from "./types";

interface InteractiveCyberConsoleProps {
  logs: TerminalEntry[];
  activeVector: ThreatVector | null;
  upwardChain: UpwardHop[];
  activeHopIndex: number;
  onSelectHop: (idx: number) => void;
  isPatched: boolean;
  onTogglePatch: () => void;
  onClearLogs: () => void;
  onAddLog: (entry: TerminalEntry) => void;
  onOpenReport: () => void;
}

export const InteractiveCyberConsole: React.FC<InteractiveCyberConsoleProps> = ({
  logs,
  activeVector,
  upwardChain,
  activeHopIndex,
  onSelectHop,
  isPatched,
  onTogglePatch,
  onClearLogs,
  onAddLog,
  onOpenReport,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyPtr, setHistoryPtr] = useState<number>(-1);
  const [filterType, setFilterType] = useState<"ALL" | "BREACH" | "EXPLOIT" | "DEFENSE">("ALL");

  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommandSubmit = (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryPtr(-1);
    setInputVal("");

    const now = new Date().toTimeString().split(" ")[0];

    // Log the user's input command
    onAddLog({
      id: `cmd-${Date.now()}`,
      timestamp: now,
      type: "command",
      text: `$ ${trimmed}`,
    });

    const parts = trimmed.toLowerCase().split(" ");
    const cmd = parts[0];

    switch (cmd) {
      case "help":
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "system",
          text: `AVAILABLE CYBER COMMANDS:
  - analyze: Deep telemetry report on active threat vector
  - trace: Print complete upward call stack from leaf to host runtime
  - blast-radius: Enumerate compromised tokens, secrets, and microservices
  - payload: Display weaponized exploit string
  - patch: Output instant package manager remediation command
  - mitigate: Toggle virtual defense shield to sever attack path
  - step: Advance simulation to next upward hop
  - reset: Reset propagation back to leaf stage 0
  - report: Generate formal Security Advisory Incident Brief
  - clear / cls: Clear terminal output`,
        });
        break;

      case "analyze":
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "info",
          text: `[THREAT VECTOR TELEMETRY]
Name: ${activeVector?.name}@${activeVector?.version}
CVE: ${activeVector?.cveId} | CWE: ${activeVector?.cwe} | CVSS: ${activeVector?.cvss}
Origin File: ${activeVector?.filePath}
Attack Class: ${activeVector?.category} (${activeVector?.exploitType})
Transitive Depth: Level ${activeVector?.depth}
Defense State: ${isPatched ? "SHIELDED / SEVERED" : "UNPATCHED / EXPLOITABLE"}`,
        });
        break;

      case "trace": {
        const trace = upwardChain
          .map(
            (h, idx) =>
              `  ${idx === activeHopIndex ? "►" : " "} [Hop ${idx}] ${h.nodeName}@${h.version} ➔ ${h.filePath}`
          )
          .join("\n");
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "info",
          text: `[UPWARD CALL STACK TRACE]\n${trace}`,
        });
        break;
      }

      case "blast-radius":
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "warning",
          text: `[BLAST RADIUS ASSESSMENT]
Exposed Secrets: ${activeVector?.blastRadius.secrets.join(", ")}
Target Endpoints: ${activeVector?.blastRadius.endpoints.join(", ")}
Host Processes: ${activeVector?.blastRadius.processes.join(", ")}
Impact: ${activeVector?.blastRadius.impactSummary}`,
        });
        break;

      case "payload":
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "exploit",
          text: `[WEAPONIZED PAYLOAD]\n${activeVector?.payloadSample}`,
        });
        break;

      case "patch":
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "defense",
          text: `[REMEDIATION SCRIPT]
Run: npm install ${activeVector?.name}@${activeVector?.safeVersion} --save
Or pin overrides in package.json:
"overrides": { "${activeVector?.name}": "${activeVector?.safeVersion}" }`,
        });
        break;

      case "mitigate":
      case "shield":
        onTogglePatch();
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "defense",
          text: isPatched
            ? `[DEFENSE SHIELD DISABLED] Infiltration vector is now unblocked.`
            : `[DEFENSE SHIELD ACTIVE] Vector severed! Runtime protected.`,
        });
        break;

      case "step":
        if (activeHopIndex < upwardChain.length - 1) {
          onSelectHop(activeHopIndex + 1);
          onAddLog({
            id: `reply-${Date.now()}`,
            timestamp: now,
            type: "info",
            text: `Advanced to Stage ${activeHopIndex + 1}: ${upwardChain[activeHopIndex + 1]?.nodeName}`,
          });
        } else {
          onAddLog({
            id: `reply-${Date.now()}`,
            timestamp: now,
            type: "breach",
            text: `HOST APPLICATION IS BREACHED. Target runtime fully compromised!`,
          });
        }
        break;

      case "reset":
        onSelectHop(0);
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "system",
          text: "Simulation reset back to leaf ingestion.",
        });
        break;

      case "report":
        onOpenReport();
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "info",
          text: "Opening formal Incident Advisory Brief generator...",
        });
        break;

      case "clear":
      case "cls":
        onClearLogs();
        break;

      default:
        onAddLog({
          id: `reply-${Date.now()}`,
          timestamp: now,
          type: "warning",
          text: `Unknown command "${trimmed}". Type "help" to see valid commands.`,
        });
        break;
    }
  };

  const filteredLogs = logs.filter((entry) => {
    if (filterType === "ALL") return true;
    if (filterType === "BREACH") return entry.type === "breach";
    if (filterType === "EXPLOIT") return entry.type === "exploit";
    if (filterType === "DEFENSE") return entry.type === "defense";
    return true;
  });

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Terminal Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter Event Stream:</span>
          <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
            {(["ALL", "BREACH", "EXPLOIT", "DEFENSE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                  filterType === t
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-800 transition-all cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
        <span className="text-slate-500 text-[11px]">Quick actions:</span>
        {[
          "analyze",
          "trace",
          "blast-radius",
          "payload",
          "patch",
          "mitigate",
          "step",
          "report",
        ].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => handleCommandSubmit(cmd)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer text-[11px]"
          >
            &gt; {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Screen Output */}
      <div
        ref={outputRef}
        className="w-full h-64 rounded-2xl bg-black border border-slate-800 p-4 font-mono text-xs overflow-y-auto space-y-2 text-slate-300 shadow-inner"
      >
        {filteredLogs.map((entry) => (
          <div key={entry.id} className="leading-relaxed">
            <span className="text-slate-500 mr-2 text-[11px]">
              [{entry.timestamp}]
            </span>
            {entry.type === "command" ? (
              <span className="text-cyan-400 font-bold">{entry.text}</span>
            ) : entry.type === "breach" ? (
              <span className="text-rose-400 font-bold">{entry.text}</span>
            ) : entry.type === "exploit" ? (
              <span className="text-rose-300">{entry.text}</span>
            ) : entry.type === "defense" ? (
              <span className="text-emerald-300 font-bold">{entry.text}</span>
            ) : entry.type === "warning" ? (
              <span className="text-amber-300">{entry.text}</span>
            ) : (
              <span className="text-slate-300 whitespace-pre-wrap">{entry.text}</span>
            )}
          </div>
        ))}
      </div>

      {/* Command Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCommandSubmit(inputVal);
        }}
        className="flex items-center gap-2 bg-black border border-slate-800 rounded-2xl px-4 py-2.5 font-mono text-xs focus-within:border-cyan-500/50 shadow-md"
      >
        <span className="text-cyan-400 font-bold">root@chainbrain#</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              if (history.length > 0) {
                const nextPtr =
                  historyPtr === -1 ? history.length - 1 : Math.max(0, historyPtr - 1);
                setHistoryPtr(nextPtr);
                setInputVal(history[nextPtr]);
              }
            } else if (e.key === "ArrowDown") {
              if (history.length > 0 && historyPtr !== -1) {
                const nextPtr = historyPtr + 1;
                if (nextPtr < history.length) {
                  setHistoryPtr(nextPtr);
                  setInputVal(history[nextPtr]);
                } else {
                  setHistoryPtr(-1);
                  setInputVal("");
                }
              }
            }
          }}
          placeholder="type 'help', 'analyze', 'trace', 'blast-radius', 'patch'..."
          className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-600"
        />
        <button
          type="submit"
          className="px-3.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
        >
          <Send className="w-3 h-3" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};

export default InteractiveCyberConsole;
