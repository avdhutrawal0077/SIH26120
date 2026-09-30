import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Flame, Clock, Gauge, ArrowRight } from 'lucide-react';

export default function ThermalStimulation() {
  const [cssData, setCssData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await wellService.getCssData();
      setCssData(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !cssData) {
    return <div className="p-6 text-slate-500 font-medium">Loading CSS data...</div>;
  }

  const phases = ['Injection', 'Soak', 'Production'];
  const currentIndex = phases.indexOf(cssData.currentPhase);

  const ParamCard = ({ label, value, unit }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-800 mt-1 flex items-baseline gap-1">
        {value} <span className="text-sm font-medium text-slate-400">{unit}</span>
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Thermal Stimulation</h1>
        <p className="text-sm text-slate-500 mt-1">Cyclic Steam Stimulation (CSS)</p>
      </div>

      {/* Cycle Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-800">Current CSS Cycle: <span className="text-primary">{cssData.currentCycle}</span></h2>
          </div>
          <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Cycle Progress: {cssData.cycleProgress}%
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000"
            style={{ width: `${cssData.cycleProgress}%` }}
          ></div>
          
          <div className="relative flex justify-between">
            {phases.map((phase, index) => {
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={phase} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 transition-colors ${
                    isCurrent ? 'bg-primary border-white shadow-md' :
                    isPast ? 'bg-primary border-primary' : 'bg-slate-200 border-white'
                  }`}>
                    {isPast ? <ArrowRight className="w-4 h-4 text-white" /> : 
                     isCurrent ? <div className="w-3 h-3 bg-white rounded-full animate-pulse" /> : 
                     <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                  </div>
                  <div className={`mt-3 text-sm font-bold uppercase tracking-wider ${isCurrent ? 'text-primary' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>
                    {phase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cycle Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ParamCard label="Steam Temp" value={cssData.parameters.steamTemperature} unit="°C" />
        <ParamCard label="Steam Pressure" value={cssData.parameters.steamPressure} unit="bar" />
        <ParamCard label="Steam Rate" value={cssData.parameters.steamRate} unit="m³/d" />
        <ParamCard label="Steam Volume" value={cssData.parameters.steamVolume} unit="m³" />
        <ParamCard label="Inj Duration" value={cssData.parameters.injectionDuration} unit="days" />
        <ParamCard label="Soak Duration" value={cssData.parameters.soakDuration} unit="days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steam & Temp Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Steam Injected & Temp vs Time</h2>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cssData.chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="step" dataKey="steam" name="Steam Rate (m³/d)" fill="#bae6fd" stroke="#0ea5e9" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="temp" name="Reservoir Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temp & Production Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Production & Temp vs Time</h2>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cssData.chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="production" name="Production (bbl/d)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="temp" name="Reservoir Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Cycle Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Historical Cycle Data</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">CSS Cycle</th>
                <th className="px-6 py-4">Duration (Days)</th>
                <th className="px-6 py-4">Total Steam (m³)</th>
                <th className="px-6 py-4">Avg Production (bbl/d)</th>
                <th className="px-6 py-4">Max Temp (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cssData.historicalCycles.map((cycle) => (
                <tr key={cycle.cycle} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">Cycle {cycle.cycle}</td>
                  <td className="px-6 py-4">{cycle.duration}</td>
                  <td className="px-6 py-4">{cycle.steamInjected}</td>
                  <td className="px-6 py-4">{cycle.avgProduction}</td>
                  <td className="px-6 py-4">{cycle.maxTemp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
