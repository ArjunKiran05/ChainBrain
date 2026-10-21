import DashboardLayout from "../components/dashboard/DashboardLayout";

import DashboardHero from "../components/dashboard/overview/DashboardHero";

import AISummary from "../components/dashboard/ai/AISummary";
import RecentProjects from "../components/dashboard/projects/RecentProjects";

import DependencyTable from "../components/dashboard/dependencies/DependencyTable";

import FutureFeatures from "../components/dashboard/future/FutureFeatures";

import RiskDistributionChart from "../components/dashboard/charts/RiskDistributionChart";
import SeverityChart from "../components/dashboard/charts/SeverityChart";

const DashboardPage = () => {
  return (
    <DashboardLayout>

      <DashboardHero />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">

        <AISummary />

        <RecentProjects />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">

        <RiskDistributionChart />

        <SeverityChart />

      </div>

      <div className="mt-10">

        <DependencyTable />

      </div>

      <div className="mt-10">

        <FutureFeatures />

      </div>

    </DashboardLayout>
  );
};

export default DashboardPage;