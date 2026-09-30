import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  MonitorPlay, 
  Thermometer, 
  Activity, 
  LineChart, 
  GitCompare, 
  Zap, 
  Bell 
} from 'lucide-react';

const navigation = [
  { name: 'Overview', to: '/overview', icon: LayoutDashboard },
  { name: 'Well Configuration', to: '/configuration', icon: Settings },
  { name: 'Digital Twin', to: '/digital-twin', icon: MonitorPlay },
  { name: 'Thermal Stimulation', to: '/thermal-stimulation', icon: Thermometer },
  { name: 'Artificial Lift', to: '/artificial-lift', icon: Activity },
  { name: 'Production Analytics', to: '/analytics', icon: LineChart },
  { name: 'Scenario Simulation', to: '/scenarios', icon: GitCompare },
  { name: 'Optimization', to: '/optimization', icon: Zap },
  { name: 'Monitoring & Events', to: '/events', icon: Bell },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-primary text-slate-300 flex flex-col border-r border-primary">
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Zap className="h-6 w-6 text-teal-400" />
          <span className="font-semibold text-lg tracking-wide truncate">Digital Twin</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon
                className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300"
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-xs font-semibold text-teal-400 mb-1 uppercase tracking-wider">Demo Mode</p>
          <p className="text-xs text-slate-400 leading-tight">Synthetic / Illustrative Data</p>
        </div>
      </div>
    </div>
  );
}
