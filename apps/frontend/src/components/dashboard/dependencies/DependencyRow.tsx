import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  TriangleAlert,
} from "lucide-react";
import SeverityBadge from "./SeverityBadge";
import type { Vulnerability } from "../../../types/upload";

interface DependencyRowProps {
  packageName: string;
  version: string;
  vulnerabilities: Vulnerability[];
}

const DependencyRow = ({
  packageName,
  version,
  vulnerabilities,
}: DependencyRowProps) => {
  const [expanded, setExpanded] = useState(false);

  const severity =
    vulnerabilities.length === 0
      ? "SECURE"
      : (
          vulnerabilities[0]?.database_specific?.severity ?? "LOW"
        ).toUpperCase();

  return (
    <>
      <tr
        onClick={() => vulnerabilities.length > 0 && setExpanded(!expanded)}
        className={`transition-colors duration-150 border-b border-slate-200/60 dark:border-slate-800/60 ${
          vulnerabilities.length > 0
            ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-850/80"
            : "hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
        }`}
      >
        {/* Package info */}
        <td className="py-4 pl-6 pr-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {packageName}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                npm module
              </p>
            </div>
          </div>
        </td>

        {/* Version */}
        <td className="py-4 px-4 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
          v{version}
        </td>

        {/* Severity */}
        <td className="py-4 px-4">
          <SeverityBadge severity={severity} />
        </td>

        {/* Status */}
        <td className="py-4 pl-4 pr-6">
          <div className="flex items-center justify-between">
            {vulnerabilities.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                Secure
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <TriangleAlert className="w-3.5 h-3.5" />
                {vulnerabilities.length} Advisory
                {vulnerabilities.length > 1 ? "ies" : ""}
              </span>
            )}

            {vulnerabilities.length > 0 && (
              <span className="ml-2 text-slate-400 dark:text-slate-500">
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Vulnerability Detail Row */}
      {expanded && (
        <tr>
          <td
            colSpan={4}
            className="bg-slate-50/90 dark:bg-slate-950/70 px-8 py-6 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Detected Vulnerabilities ({vulnerabilities.length})
                </h4>
                <code className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  npm update {packageName}
                </code>
              </div>

              {vulnerabilities.map((vulnerability: Vulnerability, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                          {vulnerability.id}
                        </span>
                        <SeverityBadge
                          severity={
                            (
                              vulnerability.database_specific?.severity ?? "LOW"
                            ).toUpperCase()
                          }
                        />
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium leading-relaxed">
                        {vulnerability.summary ?? "No summary provided in advisory."}
                      </p>
                    </div>

                    <a
                      href={`https://osv.dev/vulnerability/${vulnerability.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 hover:opacity-80 transition-opacity"
                    >
                      <span>OSV Record</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {vulnerability.details && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-3">
                        {vulnerability.details}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default DependencyRow;