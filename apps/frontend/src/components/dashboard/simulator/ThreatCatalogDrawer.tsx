import React, { useState } from "react";
import {
  X,
  Search,
  Crosshair,
  ChevronRight,
} from "lucide-react";
import type { ThreatVector } from "./types";

interface ThreatCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: ThreatVector[];
  selectedVectorId: string | null;
  onSelectVector: (vector: ThreatVector) => void;
}

export const ThreatCatalogDrawer: React.FC<ThreatCatalogDrawerProps> = ({
  isOpen,
  onClose,
  vectors,
  selectedVectorId,
  onSelectVector,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  if (!isOpen) return null;

  const categories = [
    "ALL",
    "RCE",
    "PROTOTYPE_POLLUTION",
    "XSS",
    "SSRF",
    "DOS",
    "PATH_TRAVERSAL",
    "AUTH_BYPASS",
  ];

  const filteredVectors = vectors.filter((v) => {
    const matchesCat =
      categoryFilter === "ALL" || v.category === categoryFilter;
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cveId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.exploitType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-[#070d1d] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white font-mono tracking-tight">
                HIGH-RISK THREAT VECTORS CATALOG
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Select a threat vector to simulate real-time upward infiltration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-950/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by package name, CVE, or vulnerability type..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer font-bold ${
                  categoryFilter === cat
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Vectors List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredVectors.map((v) => {
            const isSelected = selectedVectorId === `${v.name}@${v.version}`;
            return (
              <div
                key={v.id}
                onClick={() => {
                  onSelectVector(v);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 font-mono ${
                  isSelected
                    ? "bg-rose-950/30 border-rose-500 shadow-md shadow-rose-500/10"
                    : "bg-slate-950/70 border-slate-850 hover:border-slate-750 hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      {v.name}@{v.version}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                        v.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {v.severity} · CVSS {v.cvss.toFixed(1)}
                    </span>
                  </div>

                  <span className="text-[10px] text-cyan-400 font-bold">
                    {v.cveId}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-sans font-medium line-clamp-2">
                  {v.exploitType}: {v.summary}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-850">
                  <span>Depth: Level {v.depth}</span>
                  <span className="text-slate-400">Bridge: {v.parentName}</span>
                  <span className="text-cyan-400 flex items-center gap-1 font-bold">
                    <span>Simulate</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThreatCatalogDrawer;
