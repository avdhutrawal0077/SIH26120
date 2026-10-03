import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, ArrowUpRight, Zap, AlertCircle } from 'lucide-react';

export default function ArtificialLift() {
  const [srpData, setSrpData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await wellService.getSrpData();
      setSrpData(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !srpData) {
    return <div className="p-6 text-slate-500 font-medium">Loading Artificial Lift data...</div>;
  }

  const ParamCard = ({ label, value, unit, highlight = false }) => (
    <div className={`rounded-lg border p-4 flex flex-col justify-between ${highlight ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-primary-100 opacity-80' : 'text-slate-500'}`}>{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-slate-800'}`}>{value}</span>
        {unit && <span className={`text-sm font-medium ${highlight ? 'text-primary-200 opacity-80' : 'text-slate-400'}`}>{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-slate-200 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Artificial Lift</h1>
          <p className="text-sm text-slate-500 mt-1">Sucker Rod Pump (SRP)</p>
        </div>
        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium flex items-center gap-2 border border-green-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Status: {srpData.status}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ParamCard label="Pump Speed" value={srpData.parameters.pumpSpeed} unit="SPM" highlight />
        <ParamCard label="Stroke Length" value={srpData.parameters.strokeLength} unit="in" />
        <ParamCard label="Pump Size" value={srpData.parameters.pumpSize} unit="in" />
        <ParamCard label="Pump Depth" value={srpData.parameters.pumpDepth} unit="m" />
        <ParamCard label="Fluid Level" value={srpData.parameters.fluidLevel} unit="m" />
        
        <ParamCard label="Motor Load" value={srpData.parameters.motorLoad} unit="%" />
        <ParamCard label="Rod Load" value={(srpData.parameters.rodLoad / 1000).toFixed(1)} unit="k lbs" />
        <ParamCard label="Pump Efficiency" value={srpData.parameters.pumpEfficiency} unit="%" />
        <ParamCard label="Production" value={srpData.parameters.productionResponse} unit="bbl/d" highlight />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recommendation Card */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Optimization Recommendation</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-primary mb-2">
                {srpData.recommendation.action} to {srpData.recommendation.targetValue}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {srpData.recommendation.reason}
              </p>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Expected Prod.</p>
                <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                  {srpData.recommendation.expectedProduction} <span className="text-sm font-medium">bbl/d</span>
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Est. Efficiency</p>
                <p className="text-lg font-bold text-slate-800">
                  {srpData.recommendation.expectedEfficiency} <span className="text-sm font-medium">%</span>
                </p>
              </div>
            </div>

            <button className="mt-6 w-full bg-primary hover:opacity-90 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
              Apply Recommended Scenario
            </button>
          </div>
        </div>

        {/* Pump Performance Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pump Performance Analysis</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="w-4 h-4" />
              Simulated Load vs Production
            </div>
          </div>
          <div className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={srpData.performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="spm" name="Pump Speed" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(value) => `${value} SPM`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                
                {/* Bar for Motor Load (right axis) */}
                <Bar yAxisId="right" dataKey="motorLoad" name="Motor Load (%)" fill="#bae6fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                
                {/* Line for Production (left axis) */}
                <Line yAxisId="left" type="monotone" dataKey="production" name="Production (bbl/d)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                
                {/* Line for Efficiency (right axis) */}
                <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Pump Efficiency (%)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
