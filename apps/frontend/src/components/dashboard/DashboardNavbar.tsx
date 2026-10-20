import { Link } from "react-router-dom";
import { Shield, UploadCloud } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";
import { useScanStore } from "../../store/useScanStore";

const DashboardNavbar = () => {
  const { scanResult } = useScanStore();
  const projectName = scanResult?.projects?.[0]?.name || "owasp-nodejs-goat";
  const securityScore = scanResult?.scanResults?.summary?.securityScore ?? 74;

  return (
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

          {/* Active project tag */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {projectName}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
              Score: {securityScore}/100
            </span>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2.5">
          {/* Attack Simulator Launch Button */}
          <Link
            to="/simulator"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Launch Real-Time Dependency Attack Simulator"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>Attack Simulator</span>
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
  );
};

export default DashboardNavbar;