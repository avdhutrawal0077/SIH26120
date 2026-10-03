import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { BellRing, History, AlertTriangle, Info, ShieldAlert, Activity, CheckCircle, Clock } from 'lucide-react';

export default function MonitoringEvents() {
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await wellService.getEvents();
      setEventsData(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !eventsData) {
    return <div className="p-6 text-slate-500 font-medium">Loading Monitoring Data...</div>;
  }

  const getAlertStyle = (type) => {
    switch (type) {
      case 'critical':
        return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: ShieldAlert, iconColor: 'text-red-500' };
      case 'warning':
        return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: AlertTriangle, iconColor: 'text-amber-500' };
      case 'info':
      default:
        return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: Info, iconColor: 'text-blue-500' };
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'system': return <Activity className="w-4 h-4 text-primary" />;
      case 'process': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Monitoring & Events</h1>
        <p className="text-sm text-slate-500 mt-1">Operational alerts, warnings, and system event history log.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Alerts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">Active Events</h2>
          </div>
          
          <div className="space-y-4">
            {eventsData.activeAlerts.map(alert => {
              const style = getAlertStyle(alert.type);
              const Icon = style.icon;
              return (
                <div key={alert.id} className={`rounded-lg border p-4 shadow-sm flex gap-4 items-start ${style.bg}`}>
                  <div className={`mt-0.5 ${style.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${style.text}`}>{alert.title}</h3>
                      <span className="text-xs font-medium text-slate-500 bg-white/50 px-2 py-0.5 rounded border border-white/40">{alert.time}</span>
                    </div>
                    <p className={`text-sm mt-1.5 opacity-90 ${style.text}`}>{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">Event History</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4 w-12"></th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventsData.eventHistory.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          {getEventIcon(event.type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                        {event.timestamp}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {event.action}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {event.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
