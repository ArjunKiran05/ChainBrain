import { Link } from "react-router-dom";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";

const Navbar = () => {
  return (
    <header className="sticky top-4 z-50 mx-auto w-[92%] max-w-7xl">
      <nav className="glass-card rounded-full px-6 py-3 flex items-center justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ChainBrain
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#scanner"
            className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
          >
            Scanner
          </a>
          <a
            href="#features"
            className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
          >
            Capabilities
          </a>
          <a
            href="#architecture"
            className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
          >
            Architecture
          </a>
          <Link
            to="/dashboard"
            className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/visualizer"
            className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
          >
            Visualizer
          </Link>
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;