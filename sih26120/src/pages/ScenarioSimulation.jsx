import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GitCompare, PlayCircle, Activity } from 'lucide-react';

export default function ScenarioSimulation() {
  const [data, setData] = useState({ baseline: null, scenarios: [] });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);

  useEffect(() => {
    async function loadScenarios() {
      const res = await wellService.getScenarios();
      setData(res);
      setLoading(false);
    }
    loadScenarios();
  }, []);

  const handleParamChange = (scenId, param, value) => {
    setData(prev => {
      const newScenarios = prev.scenarios.map(s => {
        if (s.id === scenId) {
          return { ...s, params: { ...s.params, [param]: parseFloat(value) || value } };
        }
        return s;
      });
      return { ...prev, scenarios: newScenarios };
    });
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    
    // Simulate baseline
    const baselineResults = await wellService.runSimulation(data.baseline.params);
    
    // Simulate each scenario
    const simulatedScenarios = await Promise.all(
      data.scenarios.map(async (s) => {
        const res = await wellService.runSimulation(s.params);
        return { ...s, results: res };
      })
    );

    setData(prev => ({
      baseline: { ...prev.baseline, results: baselineResults },
      scenarios: simulatedScenarios
    }));

    setHasSimulated(true);
    setSimulating(false);
  };

  if (loading || !data.baseline) {
    return <div className="p-6 text-slate-500 font-medium">Loading Scenarios...</div>;
  }

  const allColumns = [data.baseline, ...data.scenarios];

  const parametersList = [
    { key: 'steamTemperature', label: 'Steam Temp', unit: '°C' },
    { key: 'steamPressure', label: 'Steam Pressure', unit: 'bar' },
    { key: 'steamRate', label: 'Steam Rate', unit: 'm³/d' },
    { key: 'injectionDuration', label: 'Injection Duration', unit: 'days' },
    { key: 'soakDuration', label: 'Soak Duration', unit: 'days' },
    { key: 'pumpSpeed', label: 'Pump Speed', unit: 'SPM' },
    { key: 'strokeLength', label: 'Stroke Length', unit: 'in' },
  ];

  const resultsList = [
    { key: 'reservoirTemperature', label: 'Reservoir Temp', unit: '°C' },
    { key: 'oilViscosity', label: 'Oil Viscosity', unit: 'cP' },
    { key: 'production', label: 'Production', unit: 'bbl/d' },
    { key: 'energyConsumption', label: 'Energy Cost', unit: 'GJ' },
  ];

  // Prepare chart data
  const chartData = hasSimulated ? allColumns.map(col => ({
    name: col.name,
    Production: col.results.production,
    Energy: col.results.energyConsumption,
  })) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-200 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Scenario Simulation</h1>
          <p className="text-sm text-slate-500 mt-1">Deterministic "what-if" modeling for alternate operating configurations.</p>
        </div>
        <button
          onClick={handleRunSimulation}
          disabled={simulating}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
        >
          <PlayCircle className="w-5 h-5" />
          {simulating ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Input Parameters Configuration</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider w-1/5">Parameter</th>
                {allColumns.map(col => (
                  <th key={col.id} className={`px-5 py-3 font-semibold uppercase text-xs tracking-wider ${col.isBaseline ? 'text-primary bg-primary/5' : 'text-slate-600'}`}>
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parametersList.map(param => (
                <tr key={param.key} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {param.label} <span className="text-slate-400 text-xs font-normal">({param.unit})</span>
                  </td>
                  {allColumns.map(col => (
                    <td key={`${col.id}-${param.key}`} className={`px-5 py-2 ${col.isBaseline ? 'bg-primary/5 font-medium text-slate-800' : ''}`}>
                      {col.isBaseline ? (
                        <span>{col.params[param.key]}</span>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          value={col.params[param.key]}
                          onChange={(e) => handleParamChange(col.id, param.key, e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasSimulated && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Simulation Results</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider w-1/5">Output Metric</th>
                    {allColumns.map(col => (
                      <th key={`res-${col.id}`} className="px-5 py-3 font-semibold text-slate-800 uppercase text-xs tracking-wider">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultsList.map(res => (
                    <tr key={res.key} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-bold text-slate-700">
                        {res.label} <span className="text-slate-400 text-xs font-normal">({res.unit})</span>
                      </td>
                      {allColumns.map(col => {
                        const isBetter = col.isBaseline === false && 
                          (res.key === 'production' ? col.results[res.key] > data.baseline.results[res.key] : 
                           res.key === 'energyConsumption' ? col.results[res.key] < data.baseline.results[res.key] : false);
                           
                        return (
                          <td key={`out-${col.id}-${res.key}`} className={`px-5 py-3 font-medium ${isBetter ? 'text-green-600 font-bold' : 'text-slate-800'}`}>
                            {col.results[res.key]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Production vs Energy Trade-off</h2>
            </div>
            <div className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  
                  <Bar yAxisId="left" dataKey="Production" name="Production (bbl/d)" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1e293b' : '#10b981'} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="Energy" name="Energy Cost (MJ)" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-en-${index}`} fill={index === 0 ? '#64748b' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
