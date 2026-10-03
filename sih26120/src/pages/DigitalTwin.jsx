import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Droplet, ThermometerSun, Activity, Database, AlertCircle } from 'lucide-react';

export default function DigitalTwin() {
  const [wellState, setWellState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadState() {
      const state = await wellService.getWellState();
      setWellState(state);
      setLoading(false);
    }
    loadState();
  }, []);

  if (loading || !wellState) {
    return <div className="p-6 text-slate-500 font-medium">Synchronizing with Digital Twin...</div>;
  }

  const StateCard = ({ title, icon: Icon, data }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {Object.entries(data).map(([key, value]) => {
          // Format keys to Title Case
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return (
            <div key={key}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{formattedKey}</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Digital Twin</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time virtual representation of physical well state.</p>
        </div>
        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium flex items-center gap-2 border border-green-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Twin Synchronized
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Schematic Visualization (Left) */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden">
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Well Schematic</span>
          </div>
          
          {/* Surface */}
          <div className="w-full flex flex-col items-center mt-8">
            <div className="text-xs font-medium text-slate-500 mb-2">Surface Pumping Unit</div>
            <div className="w-24 h-12 bg-primary rounded-t-md relative flex justify-center items-end">
              <div className="w-16 h-4 bg-slate-300 rounded-t-sm"></div>
            </div>
            <div className="w-full border-t-4 border-slate-300"></div>
          </div>

          {/* Subsurface - Wellbore & Sucker Rod */}
          <div className="w-full flex-1 flex justify-center relative my-2">
            {/* Wellbore casing */}
            <div className="w-16 h-full border-l-2 border-r-2 border-slate-400 bg-slate-100 flex justify-center relative">
              {/* Sucker Rod */}
              <div className="w-1 h-full bg-slate-800"></div>
              {/* SRP Pump */}
              <div className="absolute bottom-12 w-6 h-16 bg-slate-600 rounded-sm"></div>
            </div>
          </div>

          {/* Reservoir & Heated Zone */}
          <div className="w-full flex flex-col items-center relative">
            <div className="absolute -top-12 w-48 h-32 bg-orange-400/20 blur-xl rounded-full"></div>
            <div className="w-full border-t-2 border-dashed border-orange-300 mb-2"></div>
            <div className="text-xs font-medium text-orange-600 mb-2 z-10 bg-white/80 px-2 rounded">Heated Zone</div>
            <div className="w-full h-24 bg-gradient-to-b from-orange-100 to-amber-900 rounded-b-lg border-2 border-amber-900 flex items-center justify-center relative overflow-hidden">
               <div className="text-sm font-bold text-white z-10 shadow-sm">Heavy Oil Reservoir</div>
            </div>
          </div>
        </div>

        {/* Current State Cards (Right) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <StateCard 
            title="Reservoir State" 
            icon={Database} 
            data={{
              Temperature: `${wellState.reservoir.temperature} °C`,
              Pressure: `${wellState.reservoir.pressure} bar`,
              OilSaturation: `${wellState.reservoir.oilSaturation}`,
              OilViscosity: `${wellState.reservoir.oilViscosity} cP`
            }} 
          />
          <StateCard 
            title="CSS State" 
            icon={ThermometerSun} 
            data={{
              CurrentPhase: wellState.css.currentPhase,
              CycleNumber: wellState.css.cycleNumber,
              SteamRate: `${wellState.css.steamRate} m³/d`,
              SteamTemperature: `${wellState.css.steamTemperature} °C`
            }} 
          />
          <StateCard 
            title="SRP State" 
            icon={Activity} 
            data={{
              PumpSpeed: `${wellState.srp.pumpSpeed} SPM`,
              StrokeLength: `${wellState.srp.strokeLength} in`,
              MotorLoad: `${wellState.srp.motorLoad} %`,
              Status: 'Running'
            }} 
          />
          <StateCard 
            title="Production State" 
            icon={Droplet} 
            data={{
              OilRate: `${wellState.production.oilRate} bbl/d`,
              WaterRate: `${wellState.production.waterRate} bbl/d`,
              TotalLiquid: `${wellState.production.totalLiquid} bbl/d`,
              WaterCut: `${((wellState.production.waterRate / wellState.production.totalLiquid) * 100).toFixed(1)} %`
            }} 
          />
        </div>
      </div>

      {/* State Evolution Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Simulated State Evolution</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4" />
            Deterministic simulation data over current CSS cycle
          </div>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wellState.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" name="Temperature (°C)" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" name="Viscosity (cP)" dataKey="viscosity" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line yAxisId="left" type="monotone" name="Production (bbl/d)" dataKey="production" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
