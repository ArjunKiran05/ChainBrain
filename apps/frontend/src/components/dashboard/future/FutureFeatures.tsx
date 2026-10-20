import {
  Bot,
  Boxes,
  FileCode2,
  GitBranch,
  Workflow,
  Sparkles,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "./FeatureCard";

const FutureFeatures = () => {
  const navigate = useNavigate();

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Enterprise Security & Simulation Modules
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <FeatureCard
          title="Attack Simulator"
          icon={<Flame className="w-6 h-6 text-rose-500 animate-pulse" />}
          badge="Live Studio"
          onClick={() => navigate("/simulator")}
        />

        <FeatureCard
          title="Dependency Graph"
          icon={<Boxes className="w-6 h-6" />}
          badge="Visualizer"
          onClick={() => navigate("/simulator")}
        />

        <FeatureCard
          title="GitHub Actions"
          icon={<GitBranch className="w-6 h-6" />}
          badge="CI/CD"
        />

        <FeatureCard
          title="CycloneDX SBOM"
          icon={<FileCode2 className="w-6 h-6" />}
          badge="Standard"
        />

        <FeatureCard
          title="Policy Engine"
          icon={<Workflow className="w-6 h-6" />}
          badge="Compliance"
        />

        <FeatureCard
          title="AI Remediation"
          icon={<Bot className="w-6 h-6" />}
          badge="Live"
        />
      </div>
    </section>
  );
};

export default FutureFeatures;