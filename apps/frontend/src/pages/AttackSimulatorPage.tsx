import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  Flame,
  Boxes,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import ThemeToggle from "../components/common/ThemeToggle";
import Footer from "../components/layout/Footer";
import ChatAssistant from "../components/dashboard/chat/ChatAssistant";
import { useScanStore } from "../store/useScanStore";
import AttackSimulator from "../components/dashboard/simulator/AttackSimulator";
import DependencyGraph from "../components/dashboard/graph/DependencyGraph";

const AttackSimulatorPage = () => {
  const location = useLocation();
  const initialTab =
    location.pathname.includes("visualizer") || location.search.includes("tab=graph")
      ? "visualizer"
      : "simulator";

  const [activeTab, setActiveTab] = useState<"visualizer" | "simulator">(initialTab);

  const { scanResult } = useScanStore();
  const projectName = scanResult?.projects?.[0]?.name || "owasp-nodejs-goat";
  const securityScore = scanResult?.scanResults?.summary?.securityScore ?? 74;
  const totalPackages = scanResult?.scanResults?.summary?.totalPackages ?? 42;
  const vulnerableCount = scanResult?.scanResults?.summary?.vulnerablePackages ?? 7;
  const criticalCount = scanResult?.scanResults?.summary?.severityCounts?.critical ?? 2;
  const highCount = scanResult?.scanResults?.summary?.severityCounts?.high ?? 4;

  return (
    <div className="min-h-screen flex flex-col justify-between relative transition-colors hero-gradient">
      <div>
        {/* Floating Capsule Header - Matches DashboardNavbar & Navbar */}
        <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="glass-card rounded-2xl md:rounded-full px-6 py-3.5 flex items-center justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-xl">
            {/* Left Side: Brand & Project Context */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  ChainBrain
                </span>
              </Link>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Visualizer & Threat Studio
                </span>
              </div>

              {/* Active project tag */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {projectName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Score: {securityScore}/100
                </span>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <span>Dashboard</span>
              </Link>

              <ThemeToggle />

              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Scan another project"
              >
                <UploadCloud className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                <span className="hidden md:inline">Scan New Project</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Executive Visualizer Hero Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 flex items-center gap-1">
                    <Flame className="w-3 h-3 animate-pulse" />
                    Transitive Attack Visualizer
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800/80">
                    Target: {projectName}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Supply Chain Attack Propagation Visualizer & Simulator
                </h1>

                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl mt-2 leading-relaxed">
                  Inspect the full dependency graph topology and trace weaponized payload paths ascending from deep unpinned leaf dependencies into your master server process.
                </p>
              </div>

              {/* Quick Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Packages</div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalPackages}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vulnerabilities</div>
                  <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{vulnerableCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Critical / High</div>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{criticalCount + highCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Security Score</div>
                  <div className="text-xl font-extrabold text-indigo-600 dark:text-cyan-400 mt-0.5">{securityScore}/100</div>
                </div>
              </div>
            </div>

            {/* Mode Selector Tabs */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-inner gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("visualizer")}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "visualizer"
                      ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-md shadow-indigo-500/10 dark:shadow-indigo-500/30 scale-[1.01]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Boxes className="w-4 h-4 text-indigo-500 dark:text-cyan-300" />
                  <span>Attack Propagation Visualizer</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                    Graph View
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("simulator")}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "simulator"
                      ? "bg-white dark:bg-rose-600 text-rose-700 dark:text-white shadow-md shadow-rose-500/10 dark:shadow-rose-500/30 scale-[1.01]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-500 dark:text-rose-400 animate-pulse" />
                  <span>Threat Exploit Studio</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Simulator
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                <span>
                  {activeTab === "visualizer"
                    ? "Interactive SVG graph with multi-hop attack propagation and node drilldown"
                    : "Real-time tactical execution engine with virtual AST patch verification"}
                </span>
              </div>
            </div>
          </div>

          {/* Active View Container */}
          <div className="w-full">
            {activeTab === "visualizer" ? (
              <DependencyGraph />
            ) : (
              <AttackSimulator />
            )}
          </div>
        </main>
      </div>

      <Footer />

      <ChatAssistant />
    </div>
  );
};

export default AttackSimulatorPage;
