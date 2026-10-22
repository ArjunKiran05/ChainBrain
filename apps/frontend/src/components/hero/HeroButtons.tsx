import { ShieldCheck } from "lucide-react";
import UploadButton from "../upload/UploadButton";

interface HeroButtonsProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
}

const HeroButtons = ({ onFileSelected, loading }: HeroButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
      <UploadButton onFileSelected={onFileSelected} loading={loading} />

<div className="relative inline-block group">
  <a
    href="https://github.com/ArjunKiran05/ChainBrain/releases/download/0.1.0/chainbrain-0.1.0.vsix"
    className="px-7 py-3.5 rounded-full font-bold text-sm text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95"
    download
  >
    <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
    <span>Download VS Code Extension</span>
  </a>
  <div className="absolute top-0 left-full ml-2 mt-0 w-56 p-2 bg-white/90 dark:bg-slate-800/90 text-xs text-slate-800 dark:text-slate-200 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
    style={{ pointerEvents: 'none' }}
  >
    <p className="font-medium mb-1">In VS Code:</p>
    <ol className="list-decimal list-inside space-y-1">
      <li>Press Ctrl + Shift + X to open Extensions.</li>
      <li>Click the three‑dot menu (...) near the top of the Extensions panel.</li>
      <li>Select <span className="font-medium">Install from VSIX...</span></li>
      <li>Select the downloaded vs code extension file:<br/><span className="font-mono">chainbrain-0.1.0.vsix</span></li>
    </ol>
  </div>
</div>
    </div>
  );
};

export default HeroButtons;