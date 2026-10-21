import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import AttackSimulatorPage from "./pages/AttackSimulatorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/dashboard"
        element={<DashboardPage />}
      />

      <Route
        path="/simulator"
        element={<AttackSimulatorPage />}
      />

      <Route
        path="/visualizer"
        element={<AttackSimulatorPage />}
      />
    </Routes>
  );
}

export default App;