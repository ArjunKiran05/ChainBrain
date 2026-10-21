import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useScanStore } from "../../../store/useScanStore";
import type { Vulnerability } from "../../../types/upload";

const SeverityChart = () => {
  const results = useScanStore(
    (state) => state.scanResult?.scanResults.results ?? []
  );

  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  results.forEach((pkg) => {
    pkg.vulnerabilities?.forEach((v: Vulnerability) => {
      const s =
        v.database_specific?.severity?.toUpperCase() ??
        "LOW";

      if (s === "CRITICAL") critical++;
      else if (s === "HIGH") high++;
      else if (s === "MEDIUM" || s === "MODERATE") medium++;
      else low++;
    });
  });

  const data = [
    { name: "Critical", count: critical, color: "#f43f5e" },
    { name: "High", count: high, color: "#f97316" },
    { name: "Medium", count: medium, color: "#eab308" },
    { name: "Low", count: low, color: "#10b981" },
  ];

  return (
    <div className="glass-card rounded-3xl p-7 md:p-8 h-[420px] flex flex-col justify-between shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Severity Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of detected vulnerabilities by CVSS severity
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                fontSize: "12px",
                fontWeight: "600",
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SeverityChart;