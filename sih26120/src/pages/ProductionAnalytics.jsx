import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';
import { TrendingDown, TrendingUp, Droplets, Target } from 'lucide-react';

export default function ProductionAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await wellService.getAnalyticsData();
      setAnalytics(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !analytics) {
    return <div className="p-6 text-slate-500 font-medium">Loading Production Analytics...</div>;
  }

  const KPICard = ({ title, value, unit, trend, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {Icon && <Icon className={`w-4 h-4 ${colorClass}`} />}
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-sm font-medium text-slate-400 ml-1">{unit}</span>
      </div>
      {trend !== undefined && (
        <div className={`mt-2 flex items-center text-xs font-medium ${trend < 0 ? 'text-red-500' : 'text-green-600'}`}>
          {trend < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
          {Math.abs(trend)} {unit}/mo
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Production Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Historical performance, cycle comparison, and ML-driven forecasting.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Oil Production" value={analytics.kpis.oilProduction} unit="bbl/d" icon={Droplets} colorClass="text-slate-800" />
        <KPICard title="Water Production" value={analytics.kpis.waterProduction} unit="bbl/d" icon={Droplets} colorClass="text-blue-500" />
        <KPICard title="Total Liquid" value={analytics.kpis.totalLiquid} unit="bbl/d" />
        <KPICard title="Water Cut" value={analytics.kpis.waterCut} unit="%" icon={Target} colorClass="text-blue-600" />
        <KPICard title="Pressure" value={40.2} unit="bar" trend={analytics.kpis.pressureTrend} />
        <KPICard title="Temperature" value={86.7} unit="°C" trend={analytics.kpis.temperatureTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Historical Production */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Historical Production</h2>
          </div>
          <div className="p-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.productionHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="water" stackId="1" name="Water (bbl/d)" stroke="#3b82f6" fill="#93c5fd" />
                <Area type="monotone" dataKey="oil" stackId="1" name="Oil (bbl/d)" stroke="#1e293b" fill="#475569" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ML Forecast */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Production Forecast (ML)</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">SYNTHETIC XGBOOST MODEL</span>
          </div>
          <div className="p-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                
                {/* Confidence Interval (Area) */}
                <Area type="monotone" dataKey="upperBound" stroke="none" fill="#e2e8f0" fillOpacity={0.5} activeDot={false} />
                <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#ffffff" fillOpacity={1} activeDot={false} />
                
                <Line type="monotone" dataKey="historical" name="Historical Oil" stroke="#1e293b" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast Oil" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Cycle Comparison & Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Production by CSS Cycle</h2>
        </div>
        <div className="p-5 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.cycleComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis type="category" dataKey="cycle" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 500 }} width={100} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="oil" name="Cumulative Oil (bbl)" fill="#001f12" radius={[0, 4, 4, 0]} barSize={24} />
              <Bar dataKey="water" name="Cumulative Water (bbl)" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
