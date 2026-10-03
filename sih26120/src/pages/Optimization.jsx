import { useState } from 'react';
import { wellService } from '../services/wellService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Settings2, Target, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

export default function Optimization() {
  const [objective, setObjective] = useState('balanced');
  const [constraints, setConstraints] = useState({ maxSteamRate: 60, maxPumpSpeed: 14 });
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunOptimization = async () => {
    setOptimizing(true);
    const data = await wellService.runOptimization(objective, constraints);
    setResult(data);
    setOptimizing(false);
  };

  const chartData = result ? [
    {
      name: 'Production (bbl/d)',
      Current: result.current.production,
      Recommended: result.recommended.production,
    },
    {
      name: 'Steam (m³/d)',
      Current: result.current.steam,
      Recommended: result.recommended.steam,
    },
    {
      name: 'Efficiency (%)',
      Current: result.current.efficiency,
      Recommended: result.recommended.efficiency,
    }
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-200 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Optimization Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-parameter constrained search for feasible operating configurations.</p>
        </div>
        <div className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-bold tracking-wider border border-primary/20">
          PROTOTYPE OPTIMIZATION — SYNTHETIC MODEL
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Optimization Objective</h2>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" name="objective" value="maximize_oil" 
                  checked={objective === 'maximize_oil'} onChange={(e) => setObjective(e.target.value)}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">Maximize Oil Production</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" name="objective" value="minimize_steam" 
                  checked={objective === 'minimize_steam'} onChange={(e) => setObjective(e.target.value)}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">Minimize Steam Consumption</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" name="objective" value="maximize_efficiency" 
                  checked={objective === 'maximize_efficiency'} onChange={(e) => setObjective(e.target.value)}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">Maximize Operational Efficiency</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" name="objective" value="balanced" 
                  checked={objective === 'balanced'} onChange={(e) => setObjective(e.target.value)}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">Balanced Operation</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Operating Constraints</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Max Allowable Steam Rate (m³/d)</label>
                <input
                  type="number"
                  value={constraints.maxSteamRate}
                  onChange={(e) => setConstraints(prev => ({ ...prev, maxSteamRate: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Max Safe Pump Speed (SPM)</label>
                <input
                  type="number"
                  value={constraints.maxPumpSpeed}
                  onChange={(e) => setConstraints(prev => ({ ...prev, maxPumpSpeed: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={optimizing}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
          >
            {optimizing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching Grid...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Run Optimization
              </>
            )}
          </button>
        </div>

        {/* Right Main Area - Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!result && !optimizing && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl border-dashed flex flex-col items-center justify-center text-slate-400 p-12">
              <Zap className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-600">No Active Recommendations</h3>
              <p className="text-sm mt-1 text-center max-w-md">Select your objective and constraints on the left, then run the optimization engine to search for feasible parameter sets.</p>
            </div>
          )}

          {optimizing && !result && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 p-12">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-medium text-slate-700">Evaluating Configurations...</h3>
              <p className="text-sm mt-1 text-center">Testing deterministic physics boundaries against your constraints.</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configs Evaluated</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{result.configurationsEvaluated}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Feasible Solutions</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{result.feasibleConfigurations}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recommended Configuration</h2>
                  </div>
                </div>
                
                <div className="p-0 flex flex-col md:flex-row">
                  <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Current Parameters</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Steam Rate</span>
                        <span className="text-sm font-medium text-slate-800">{result.current.params.steamRate} m³/d</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Injection Duration</span>
                        <span className="text-sm font-medium text-slate-800">{result.current.params.injectionDuration} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Pump Speed</span>
                        <span className="text-sm font-medium text-slate-800">{result.current.params.pumpSpeed} SPM</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-5 bg-primary/5">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Optimal Parameters</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-medium">Steam Rate</span>
                        <span className="text-sm font-bold text-primary">{result.recommended.params.steamRate} m³/d</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-medium">Injection Duration</span>
                        <span className="text-sm font-bold text-primary">{result.recommended.params.injectionDuration} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-medium">Pump Speed</span>
                        <span className="text-sm font-bold text-primary">{result.recommended.params.pumpSpeed} SPM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-white border-b border-slate-200 px-5 py-4">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Expected Impact</h2>
                </div>
                <div className="p-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      
                      <Bar dataKey="Current" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="Recommended" fill="#001f12" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
