import { Clock3, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useScanStore } from "../../../store/useScanStore";
import MetricsGrid from "./MetricsGrid";

const DashboardHero = () => {
  const scanResult = useScanStore((state) => state.scanResult);

  if (!scanResult) {
    return (
      <section className="glass-card rounded-3xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          No Scan Loaded Yet
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Upload a project archive to start deep SCA vulnerability analysis and risk scoring.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all"
          >
            Upload Project
          </Link>
        </div>
      </section>
    );
  }

  const project = scanResult.projects[0] || { name: "Active Project" };
  const summary = scanResult.scanResults.summary;
  const isHealthy = summary.vulnerablePackages === 0;

  return (
    <section className="glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[250px] bg-indigo-500/10 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            <span>Project Assessment</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-cyan-400">Node.js Ecosystem</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {project.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border ${
                isHealthy
                  ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              }`}
            >
              {isHealthy ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Baseline Secure</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{summary.vulnerablePackages} Vulnerable Packages</span>
                </>
              )}
            </span>

            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Clock3 className="w-3.5 h-3.5" />
              Scanned: Latest Build
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/simulator"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white rounded-full font-bold text-xs shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Launch interactive attack propagation simulation"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>Simulate Attack Path</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-xs transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      <MetricsGrid />
    </section>
  );
};

export default DashboardHero;