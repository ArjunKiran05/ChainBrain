import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Flame,
  UploadCloud,
  Activity,
} from "lucide-react";
import ThemeToggle from "../components/common/ThemeToggle";
import { useScanStore } from "../store/useScanStore";
import AttackSimulator from "../components/dashboard/simulator/AttackSimulator";

const AttackSimulatorPage = () => {
  const { scanResult } = useScanStore();
  const projectName = scanResult?.projects?.[0]?.name || "owasp-nodejs-goat";
  const securityScore = scanResult?.scanResults?.summary?.securityScore ?? 74;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-300 relative selection:bg-rose-500/30 selection:text-white overflow-x-hidden">
      {/* Ambient Cyber Flares in Background */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[400px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[450px] h-[350px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Top Tactical Command Header Bar */}
      <header className="sticky top-3 z-40 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 mb-4">
        <div className="rounded-2xl md:rounded-full px-5 py-3 flex items-center justify-between border border-slate-800/90 shadow-2xl backdrop-blur-2xl bg-slate-900/85">
          {/* Left: Back Link & Product Mark */}
          <div className="flex items-center gap-3.5">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-750 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dashboard</span>
            </Link>

            <span className="hidden sm:inline text-slate-700">|</span>

            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    ChainBrain
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    Threat Studio
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Transitive Supply Chain Exploit Simulator
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right: Live Project Telemetry & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-slate-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-slate-200">
                {projectName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Score: {securityScore}/100
              </span>
            </div>

            <ThemeToggle />

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Scan another repository"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">New Scan</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-14 flex flex-col gap-6">
        <AttackSimulator />
      </main>
    </div>
  );
};

export default AttackSimulatorPage;
