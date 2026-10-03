import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import WellConfiguration from './pages/WellConfiguration';
import DigitalTwin from './pages/DigitalTwin';
import ThermalStimulation from './pages/ThermalStimulation';
import ArtificialLift from './pages/ArtificialLift';
import ProductionAnalytics from './pages/ProductionAnalytics';
import ScenarioSimulation from './pages/ScenarioSimulation';
import Optimization from './pages/Optimization';
import MonitoringEvents from './pages/MonitoringEvents';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/configuration" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="configuration" element={<WellConfiguration />} />
          <Route path="digital-twin" element={<DigitalTwin />} />
          <Route path="thermal-stimulation" element={<ThermalStimulation />} />
          <Route path="artificial-lift" element={<ArtificialLift />} />
          <Route path="analytics" element={<ProductionAnalytics />} />
          <Route path="scenarios" element={<ScenarioSimulation />} />
          <Route path="optimization" element={<Optimization />} />
          <Route path="events" element={<MonitoringEvents />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
