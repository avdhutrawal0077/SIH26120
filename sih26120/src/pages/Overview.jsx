import React, { useState, useEffect, useCallback } from 'react';
import { wellService } from '../services/wellService';

/**
 * Initial baseline telemetry dataset for the Industrial Telemetry Cockpit (Overview page)
 */
const initialTelemetry = {
  production: 82,
  prodChange: '+6.4%',
  reservoirTemp: 118,
  oilViscosity: '1,240',
  reservoirPressure: 42,
  oilSaturation: 61,
  wellboreFluidLevel: 684,
  bottomHolePressure: 31,
  pumpSpeed: '4.2',
  rodLoad: '7.8',
  motorLoad: 58,
  scadaLatency: '12ms',
  whPressure: '2.15',
  whTemp: '42.1',
  heelTemp: '248.6',
  heelPressure: '8.42',
  timestamp: '2025-05-18 14:32:04 UTC',
  timestampDate: new Date('2025-05-18T14:32:04Z'),
  scadaSync: '1.2s'
};

/**
 * Helper to generate realistic telemetry micro-variations
 */
function generateTelemetry(prev) {
  const prodVariation = Math.floor(Math.random() * 5) - 2;
  const newProd = Math.max(79, Math.min(86, 82 + prodVariation));
  const prodPct = (6.0 + (newProd - 80) * 0.4).toFixed(1);
  
  const tempOffset = (Math.random() * 0.4 - 0.2);
  const newTemp = Math.round(118 + tempOffset);
  
  const viscFluct = Math.floor(Math.random() * 20) - 10;
  const newVisc = (1240 + viscFluct).toLocaleString();
  
  const newSync = (0.8 + Math.random() * 0.7).toFixed(1) + 's';
  const newLatency = Math.round(11 + Math.random() * 3) + 'ms';
  
  const newWhPressure = (2.14 + Math.random() * 0.03).toFixed(2);
  const newWhTemp = (41.9 + Math.random() * 0.4).toFixed(1);
  const newHeelTemp = (248.3 + Math.random() * 0.6).toFixed(1);
  const newHeelPressure = (8.40 + Math.random() * 0.05).toFixed(2);
  
  const newPress = Math.round(41 + Math.random() * 2);
  const newFluid = Math.round(683 + Math.random() * 3);
  const newBhp = Math.round(30 + Math.random() * 2);
  const newSpm = (4.1 + Math.random() * 0.2).toFixed(1);
  const newRod = (7.7 + Math.random() * 0.2).toFixed(1);
  const newMotor = Math.round(57 + Math.random() * 2);

  const currentSimTime = new Date(prev.timestampDate.getTime() + (3000 + Math.floor(Math.random() * 2000)));
  const formattedTime = currentSimTime.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return {
    production: newProd,
    prodChange: '+' + prodPct + '%',
    reservoirTemp: newTemp,
    oilViscosity: newVisc,
    reservoirPressure: newPress,
    oilSaturation: 61,
    wellboreFluidLevel: newFluid,
    bottomHolePressure: newBhp,
    pumpSpeed: newSpm,
    rodLoad: newRod,
    motorLoad: newMotor,
    scadaLatency: newLatency,
    whPressure: newWhPressure,
    whTemp: newWhTemp,
    heelTemp: newHeelTemp,
    heelPressure: newHeelPressure,
    timestamp: formattedTime,
    timestampDate: currentSimTime,
    scadaSync: newSync
  };
}

/**
 * Overview Component
 * Implements functional LIVE / PLAYBACK modes, SCADA sync indicator, realistic telemetry updates, and Refresh button loading state using React hooks.
 */
export default function Overview() {
  const [mode, setMode] = useState('LIVE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState(initialTelemetry);

  // Sync with live Digital Twin state from backend
  const syncWithBackendState = useCallback(async () => {
    try {
      const state = await wellService.getWellState();
      if (state && state.reservoir) {
        setTelemetry(prev => ({
          ...prev,
          reservoirTemp: Math.round(state.reservoir.temperature),
          oilViscosity: Number(state.reservoir.oilViscosity).toLocaleString(),
          reservoirPressure: Math.round(state.reservoir.pressure),
          oilSaturation: Math.round(state.reservoir.oilSaturation * 100),
          pumpSpeed: state.srp?.pumpSpeed ? String(state.srp.pumpSpeed) : prev.pumpSpeed,
          motorLoad: Math.round(state.srp?.motorLoad || prev.motorLoad),
          production: Math.round(state.production?.oilRate || prev.production),
        }));
      }
    } catch (e) {
      console.warn("Could not sync with live twin state:", e);
    }
  }, []);

  useEffect(() => {
    syncWithBackendState();
  }, [syncWithBackendState]);

  // LIVE: Start simulated telemetry updates every 3-5 seconds
  useEffect(() => {
    if (mode !== 'LIVE' || isRefreshing) {
      return;
    }

    const timer = setInterval(() => {
      setTelemetry(prev => generateTelemetry(prev));
    }, 3500);

    return () => clearInterval(timer);
  }, [mode, isRefreshing]);

  // Refresh button: show short loading state, refresh telemetry and timestamp, return to normal
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await syncWithBackendState();

    setTimeout(() => {
      setTelemetry(prev => generateTelemetry(prev));
      setIsRefreshing(false);
    }, 500);
  }, [isRefreshing, syncWithBackendState]);

  return (
    <React.Fragment>
{/* Status Bar — sits within the DashboardLayout flow (no fixed positioning) */}
<div className="w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#C9DCCF] px-space-lg py-2 flex items-center justify-between">
  <div className="flex items-center gap-space-lg">
    <div className="flex items-center gap-space-xs font-telemetry-data text-telemetry-data">
      <span className="text-[#52665C]">OIL TWIN</span>
      <span className="text-[#C9DCCF]">&gt;</span>
      <span className="text-[#10251B] font-semibold">Overview</span>
    </div>
    <div className="h-4 w-px bg-[#C9DCCF]"></div>
    <div className="flex items-center gap-2">
      <span className="px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-full font-label-caps text-label-caps text-[#003B25] tracking-wider">Field: Baghewala Field</span>
      <span className="px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-full font-label-caps text-label-caps text-[#003B25] tracking-wider">Well: BW-017</span>
    </div>
  </div>
  <div className="flex items-center gap-space-md">
    <div className="flex items-center gap-1.5 px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
      <span className="font-telemetry-dense text-telemetry-dense text-[#003B25]">Prototype Simulation — Demonstration Data</span>
    </div>
    <div className="flex items-center gap-space-xs px-space-md py-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg">
      <span className="material-symbols-outlined text-[#52665C] text-xs">schedule</span>
      <span className="font-telemetry-dense text-telemetry-dense text-[#52665C] tracking-wider">{telemetry.timestamp}</span>
    </div>
  </div>
</div>
<main className="w-full flex-1 bg-[#FFFFE4]"><div className="flex flex-col w-full p-space-lg gap-space-lg select-none">
{/* View Control Sub-Header */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-lg bg-[#FFFFFF] px-space-xl py-space-lg rounded-xl border border-[#C9DCCF] shadow-sm"><div className="flex flex-col"><div className="flex items-center gap-space-sm"><span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span><h1 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">Overview</h1><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">BW-017 // THERMAL</span></div><p className="font-body-md text-body-md text-[#52665C] mt-1 font-normal">Well-to-Surface Operating Intelligence</p></div><div className="flex flex-wrap items-center gap-space-md"><div className="relative"><select className="appearance-none bg-[#FFFFFF] text-[#10251B] font-telemetry-data text-telemetry-data px-space-md py-1.5 pr-8 rounded-lg border border-[#C9DCCF] focus:outline-none focus:border-[#00A86B] cursor-pointer"><option>BW-017 (Baghewala Field)</option><option>BW-012 (Observation)</option><option>BW-004 (Standby)</option></select><span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#52665C] pointer-events-none text-sm">unfold_more</span></div><div className="flex items-center bg-[#EAF7EF] p-1 rounded-lg border border-[#C9DCCF] gap-0.5">
  <button
    id="mode-live"
    onClick={() => setMode('LIVE')}
    className={`px-space-md py-1 rounded-md font-label-caps text-label-caps transition-all cursor-pointer ${
      mode === 'LIVE' ? 'bg-[#00A86B] text-white' : 'text-[#52665C] hover:text-[#10251B]'
    }`}
  >
    LIVE
  </button>
  <button
    id="mode-playback"
    onClick={() => setMode('PLAYBACK')}
    className={`px-space-md py-1 rounded-md font-label-caps text-label-caps transition-all cursor-pointer ${
      mode === 'PLAYBACK' ? 'bg-[#00A86B] text-white' : 'text-[#52665C] hover:text-[#10251B]'
    }`}
  >
    PLAYBACK
  </button>
</div><div className="flex items-center gap-space-xs px-space-md py-1.5 bg-[#EAF7EF] rounded-lg border border-[#C9DCCF]">
  <span className={`w-1.5 h-1.5 rounded-full ${mode === 'LIVE' ? 'bg-[#00A86B] animate-pulse' : 'bg-[#52665C]'}`}></span>
  <span className="font-telemetry-dense text-telemetry-dense text-[#52665C]">
    SCADA SYNC: <span className={`font-medium ${mode === 'LIVE' ? 'text-[#006B45]' : 'text-[#52665C]'}`}>{mode === 'LIVE' ? telemetry.scadaSync : 'PAUSED'}</span>
  </span>
</div><button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className={`flex items-center justify-center p-2 bg-[#FFFFFF] hover:bg-[#EAF7EF] rounded-lg text-[#10251B] transition-colors border border-[#C9DCCF] ${isRefreshing ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
  title="Refresh State Vector"
>
  <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
</button></div></div>
{/* Top Metric Bar: 4-Column High-Density SCADA Matrix */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">{/* Card 1: Current Production */}<div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm"><div className="flex items-center justify-between text-[#52665C] mb-1.5"><span className="font-label-caps text-label-caps tracking-wider uppercase">CURRENT PRODUCTION</span><span className="px-2 py-0.5 rounded-full bg-[#D9F2E6] text-[#006B45] font-telemetry-dense text-telemetry-dense border border-[#C9DCCF] flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">trending_up</span>{telemetry.prodChange}</span></div><div className="flex items-baseline gap-space-sm mt-1"><span className="font-metric-display text-metric-display text-[#10251B] font-bold">{telemetry.production}</span><span className="font-telemetry-data text-telemetry-data text-[#003B25]">BPD</span></div><div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense"><span className="text-[#006B45] font-medium">{telemetry.prodChange} vs previous cycle</span><span className="text-[#52665C]">Target: 95 BPD</span></div></div>{/* Card 2: Reservoir Temperature */}<div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm"><div className="flex items-center justify-between text-[#52665C] mb-1.5"><span className="font-label-caps text-label-caps tracking-wider uppercase">RESERVOIR TEMPERATURE</span><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-telemetry-dense text-telemetry-dense border border-[#C9DCCF]">IN-SITU</span></div><div className="flex items-baseline gap-space-sm mt-1"><span className="font-metric-display text-metric-display text-[#10251B] font-bold">{telemetry.reservoirTemp}</span><span className="font-telemetry-data text-telemetry-data text-[#003B25]">°C</span></div><div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense"><span className="">Current downhole estimate</span><span className="text-[#10251B] font-medium font-metric-value">±1.5 °C</span></div></div>{/* Card 3: Oil Viscosity */}<div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm"><div className="flex items-center justify-between text-[#52665C] mb-1.5"><span className="font-label-caps text-label-caps tracking-wider uppercase">OIL VISCOSITY</span><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-telemetry-dense text-telemetry-dense border border-[#C9DCCF]">HEAVY CRUDE</span></div><div className="flex items-baseline gap-space-sm mt-1"><span className="font-metric-display text-metric-display text-[#10251B] font-bold">{telemetry.oilViscosity}</span><span className="font-telemetry-data text-telemetry-data text-[#003B25]">cP</span></div><div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense"><span className="">Estimated current viscosity</span><span className="text-[#006B45] font-medium font-metric-value">Mobile</span></div></div>{/* Card 4: Cycle Progress */}<div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm"><div className="flex items-center justify-between text-[#52665C] mb-1.5"><span className="font-label-caps text-label-caps tracking-wider uppercase">CYCLE PROGRESS</span><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-telemetry-dense text-telemetry-dense border border-[#C9DCCF]">ACTIVE</span></div><div className="flex items-baseline justify-between mt-1"><span className="font-headline-md text-headline-md text-[#10251B] font-semibold">Cycle 2 / 5</span><span className="font-telemetry-dense text-telemetry-dense text-[#006B45] font-medium">40.0%</span></div><div className="w-full bg-[#D9F2E6] h-1.5 rounded-full mt-3 overflow-hidden"><div className="h-full rounded-full bg-[#00A86B]" style={{ width: "40%" }}></div></div><div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense"><span className="">Production phase</span><span className="text-[#10251B] font-medium font-metric-value">Day 18 of 45</span></div></div></div><div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none"><div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg"><div className="flex flex-col"><div className="flex items-center gap-space-sm"><span className="w-1.5 h-4 bg-[#006B45] rounded-full"></span><h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">Production Forecast</h2><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">PREDICTIVE TWIN</span></div><p className="font-body-md text-body-md text-[#52665C] mt-1 font-normal">Baseline vs simulated production</p></div><div className="flex flex-wrap items-center gap-space-lg"><div className="flex items-center gap-space-md font-telemetry-dense text-telemetry-dense"><span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-3 h-0.5 rounded-full bg-[#8FA99B]"></span>Baseline Production</span><span className="flex items-center gap-1.5 text-[#006B45]"><span className="w-3 h-0.5 rounded-full bg-[#00A86B]"></span>Simulated / Optimized</span></div><div className="flex items-center bg-[#FFFFFF] p-1 rounded-lg border border-[#C9DCCF] gap-1 font-label-caps text-label-caps"><button className="px-space-md py-1 rounded-md text-[#52665C] hover:text-[#10251B] transition-all">7D</button><button className="px-space-md py-1 rounded-md bg-[#006B45] border border-[#006B45] text-white font-semibold transition-all">14D</button><button className="px-space-md py-1 rounded-md text-[#52665C] hover:text-[#10251B] transition-all">30D</button></div></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md mb-space-lg"><div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col"><span className="text-[#52665C] font-label-caps text-label-caps uppercase">CURRENT PRODUCTION</span><div className="flex items-baseline gap-space-xs mt-1"><span className="font-metric-display text-2xl text-[#10251B] font-bold">{telemetry.production}</span><span className="font-telemetry-data text-telemetry-data text-[#52665C]">BPD</span></div></div><div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col"><div className="flex items-center justify-between"><span className="text-[#52665C] font-label-caps text-label-caps uppercase">FORECAST PEAK</span><span className="text-[#006B45] font-telemetry-dense text-[10px] font-semibold">DAY 7</span></div><div className="flex items-baseline gap-space-xs mt-1"><span className="font-metric-display text-2xl text-[#003B25] font-bold">101</span><span className="font-telemetry-data text-telemetry-data text-[#52665C]">BPD</span></div></div><div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col"><span className="text-[#52665C] font-label-caps text-label-caps uppercase">EXPECTED CUMULATIVE</span><div className="flex items-baseline gap-space-xs mt-1"><span className="font-metric-display text-2xl text-[#006B45] font-bold">1,286</span><span className="font-telemetry-data text-telemetry-data text-[#52665C]">bbl</span></div></div></div><div className="relative w-full h-64 bg-[#F8FCF9] rounded-lg border border-[#C9DCCF] p-space-md overflow-hidden font-telemetry-dense"><div className="absolute left-3 top-3 bottom-8 flex flex-col justify-between text-[#52665C] text-[10px] pointer-events-none z-10 pr-2 border-r border-[#C9DCCF]/60"><span className="">120 BPD</span><span className="">100 BPD</span><span className="">80 BPD</span><span className="">60 BPD</span></div><div className="ml-14 h-[calc(100%-2rem)] relative"><svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 900 180"><defs><linearGradient id="simulatedGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00A86B" stopOpacity="0.22"></stop><stop offset="100%" stopColor="#EAF7EF" stopOpacity="0.02"></stop></linearGradient></defs><line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="10" y2="10"></line><line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="65" y2="65"></line><line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="120" y2="120"></line><line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="175" y2="175"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="0" x2="0" y1="0" y2="180"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="140" x2="140" y1="0" y2="180"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="280" x2="280" y1="0" y2="180"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="420" x2="420" y1="0" y2="180"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="560" x2="560" y1="0" y2="180"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="700" x2="700" y1="0" y2="180"></line><line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="900" x2="900" y1="0" y2="180"></line><path d="M 0 115 L 140 120 L 280 125 L 420 133 L 560 142 L 700 152 L 900 162" stroke="#8FA99B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M 0 115 C 80 110, 180 95, 280 82 C 340 70, 380 62, 420 62 C 480 62, 530 75, 590 82 C 670 88, 770 88, 900 87 L 900 180 L 0 180 Z" fill="url(#simulatedGrad)"></path><path d="M 0 115 C 80 110, 180 95, 280 82 C 340 70, 380 62, 420 62 C 480 62, 530 75, 590 82 C 670 88, 770 88, 900 87" stroke="#00A86B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path><circle cx="0" cy="115" fill="#00A86B" r="4"></circle><circle cx="420" cy="62" fill="#FFFFFF" r="5" stroke="#00A86B" strokeWidth="2.5"></circle><line stroke="#00A86B" strokeDasharray="2 2" strokeWidth="1" x1="420" x2="420" y1="10" y2="180"></line></svg><div className="absolute left-[47%] -top-1 -translate-x-1/2 bg-[#003B25] px-2 py-0.5 rounded border border-[#C9DCCF] text-[#FFFFE4] font-telemetry-dense text-[11px] shadow flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>Peak: 101 BPD</div></div><div className="ml-14 mt-2 flex justify-between text-[#52665C] text-[10px] font-telemetry-dense"><span className="">Day 1</span><span className="">Day 3</span><span className="">Day 5</span><span className="text-[#006B45] font-semibold">Day 7</span><span className="">Day 9</span><span className="">Day 11</span><span className="">Day 14</span></div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg select-none"><div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md border-b border-[#C9DCCF] mb-space-md"><div className="flex items-center gap-space-sm"><span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span><h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">Digital Twin State</h2><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] border border-[#C9DCCF] text-[#003B25] font-label-caps text-label-caps">REAL-TIME RECONSTRUCTION</span></div><div className="flex items-center gap-1.5 font-telemetry-dense text-telemetry-dense text-[#006B45]"><span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span><span>SYNCHRONIZED ({telemetry.scadaLatency})</span></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-space-md"><div className="flex flex-col bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md"><div className="flex items-center justify-between pb-1.5 border-b border-[#C9DCCF]/60 mb-space-sm"><span className="font-label-caps text-label-caps uppercase text-[#003B25] font-semibold tracking-wider">RESERVOIR</span><span className="material-symbols-outlined text-[#52665C] text-xs">layers</span></div><div className="flex flex-col gap-2 font-telemetry-dense"><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Temperature</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.reservoirTemp} <span className="text-[#52665C] font-normal">°C</span></span></div><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Pressure</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.reservoirPressure} <span className="text-[#52665C] font-normal">bar</span></span></div><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Oil Saturation</span><span className="text-[#006B45] font-semibold font-metric-value text-xs">61%</span></div><div className="w-full bg-[#D9F2E6] h-1 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#00A86B]" style={{ width: "61%" }}></div></div><div className="flex items-center justify-between pt-1"><span className="text-[#52665C] text-[11px]">Viscosity</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.oilViscosity} <span className="text-[#52665C] font-normal">cP</span></span></div></div></div><div className="flex flex-col bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md"><div className="flex items-center justify-between pb-1.5 border-b border-[#C9DCCF]/60 mb-space-sm"><span className="font-label-caps text-label-caps uppercase text-[#003B25] font-semibold tracking-wider">WELLBORE</span><span className="material-symbols-outlined text-[#52665C] text-xs">precision_manufacturing</span></div><div className="flex flex-col gap-2 font-telemetry-dense"><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Fluid Level</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.wellboreFluidLevel} <span className="text-[#52665C] font-normal">m</span></span></div><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Bottom-hole P.</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.bottomHolePressure} <span className="text-[#52665C] font-normal">bar</span></span></div><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Flow Rate</span><span className="text-[#006B45] font-semibold font-metric-value text-xs">{telemetry.production} <span className="text-[#52665C] font-normal">BPD</span></span></div><div className="w-full bg-[#D9F2E6] h-1 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#00A86B]" style={{ width: "72%" }}></div></div><div className="flex items-center justify-between pt-1"><span className="text-[#52665C] text-[11px]">Status</span><span className="text-[#006B45] bg-[#D9F2E6] px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">Stable Lift</span></div></div></div><div className="flex flex-col bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md"><div className="flex items-center justify-between pb-1.5 border-b border-[#C9DCCF]/60 mb-space-sm"><span className="font-label-caps text-label-caps uppercase text-[#003B25] font-semibold tracking-wider">SRP (SUCKER ROD)</span><span className="material-symbols-outlined text-[#52665C] text-xs">swap_vertical_circle</span></div><div className="flex flex-col gap-2 font-telemetry-dense"><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Pump Speed</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.pumpSpeed} <span className="text-[#52665C] font-normal">SPM</span></span></div><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Stroke Length</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">96 <span className="text-[#52665C] font-normal">in</span></span></div><div className="flex items-center justify-between"><span className="text-[#52665C] text-[11px]">Rod Load</span><span className="text-[#10251B] font-semibold font-metric-value text-xs">{telemetry.rodLoad} <span className="text-[#52665C] font-normal">klb</span></span></div><div className="w-full bg-[#D9F2E6] h-1 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#006B45]" style={{ width: "58%" }}></div></div><div className="flex items-center justify-between pt-1"><span className="text-[#52665C] text-[11px]">Motor Load</span><span className="text-[#10251B] text-[10px] font-medium">{telemetry.motorLoad}% Nominal</span></div></div></div></div></div><div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md border-b border-[#C9DCCF] mb-space-md"><div className="flex items-center gap-space-sm"><span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span><h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">Current CSS Cycle</h2><span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">CYCLE 2 / 5</span></div><div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded bg-[#D9F2E6] border border-[#C9DCCF] text-[#006B45] font-telemetry-dense text-telemetry-dense"><span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span><span className="font-semibold">PRODUCTION ACTIVE</span></div></div><div className="flex flex-col gap-space-md"><div className="flex items-center justify-between relative px-2"><div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#C9DCCF] -z-0"></div><div className="flex flex-col items-center relative z-10"><div className="w-8 h-8 rounded-full bg-[#D9F2E6] border border-[#C9DCCF] flex items-center justify-center text-[#006B45] shadow-sm"><span className="material-symbols-outlined text-sm font-bold">check</span></div><span className="font-label-caps text-[10px] uppercase text-[#52665C] mt-1.5">1. INJECTION</span><span className="font-telemetry-dense text-[9px] text-[#52665C]">Completed</span></div><div className="flex flex-col items-center relative z-10"><div className="w-8 h-8 rounded-full bg-[#D9F2E6] border border-[#C9DCCF] flex items-center justify-center text-[#006B45] shadow-sm"><span className="material-symbols-outlined text-sm font-bold">check</span></div><span className="font-label-caps text-[10px] uppercase text-[#52665C] mt-1.5">2. SOAK</span><span className="font-telemetry-dense text-[9px] text-[#52665C]">Completed</span></div><div className="flex flex-col items-center relative z-10"><div className="w-8 h-8 rounded-full bg-[#00A86B] border-2 border-[#006B45] flex items-center justify-center text-white shadow"><span className="material-symbols-outlined text-sm">play_arrow</span></div><span className="font-label-caps text-[10px] uppercase text-[#003B25] font-bold mt-1.5">3. PRODUCTION</span><span className="font-telemetry-dense text-[9px] text-[#006B45] font-medium flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-[#00A86B] animate-pulse"></span>Active</span></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-xs"><div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col justify-between"><div className="flex items-center justify-between text-[#52665C] text-[10px] font-label-caps uppercase"><span className="">INJECTION</span><span className="">STAGE 1</span></div><div className="mt-1 font-telemetry-dense"><div className="text-[#10251B] font-semibold text-xs">48 m³/day</div><div className="text-[#52665C] text-[10px] mt-0.5">Duration: 2.0 days</div></div></div><div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col justify-between"><div className="flex items-center justify-between text-[#52665C] text-[10px] font-label-caps uppercase"><span className="">SOAK</span><span className="">STAGE 2</span></div><div className="mt-1 font-telemetry-dense"><div className="text-[#10251B] font-semibold text-xs">1.0 day</div><div className="text-[#52665C] text-[10px] mt-0.5">Thermal Diffusion Peak</div></div></div><div className="bg-[#EAF7EF] border-2 border-[#00A86B] rounded-lg p-space-sm flex flex-col justify-between"><div className="flex items-center justify-between text-[#003B25] text-[10px] font-label-caps uppercase font-semibold"><span className="">PRODUCTION</span><span className="flex items-center gap-1 text-[#006B45]"><span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>LIVE</span></div><div className="mt-1 font-telemetry-dense"><div className="text-[#003B25] font-bold text-xs">Started 18h ago</div><div className="text-[#52665C] text-[10px] mt-0.5">Target: Day 18 of 45</div></div></div></div></div></div></div>
{/* Thermal & Viscosity Response Card */}
<div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none">
{/* Card Header */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-[#C9DCCF]">
<div className="flex flex-col">
<div className="flex items-center gap-space-sm">
<span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
<h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">Thermal &amp; Viscosity Response</h2>
<span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">THERMODYNAMIC COUPLING</span>
</div>
<p className="font-body-md text-body-md text-[#52665C] mt-1 font-normal">Downhole temperature stimulation vs in-situ crude oil viscosity</p>
</div>
<div className="flex flex-wrap items-center gap-space-lg">
<div className="flex items-center gap-space-md font-telemetry-dense text-telemetry-dense">
<span className="flex items-center gap-1.5 text-[#006B45] font-medium"><span className="w-3 h-0.5 rounded-full bg-[#00A86B]"></span>Reservoir Temp (°C)</span>
<span className="flex items-center gap-1.5 text-[#036c46] font-medium"><span className="w-3 h-0.5 rounded-full bg-[#0284C7] stroke-dasharray"></span>Oil Viscosity (cP)</span>
</div>
<div className="px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg font-telemetry-dense text-telemetry-dense text-[#003B25] flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
<span className="">Current Op Point: <strong className="font-metric-value text-[#10251B]">{telemetry.reservoirTemp}°C</strong> @ <strong className="font-metric-value text-[#006B45]">{telemetry.oilViscosity} cP</strong></span>
</div>
</div>
</div>
{/* Dual-Trend Telemetry Chart */}
<div className="relative w-full h-64 bg-[#F8FCF9] rounded-lg border border-[#C9DCCF] p-space-md overflow-hidden font-telemetry-dense mb-space-lg">
{/* Left Y-Axis Markings (Temperature °C) */}
<div className="absolute left-3 top-3 bottom-8 flex flex-col justify-between text-[#006B45] text-[10px] pointer-events-none z-10 pr-2 border-r border-[#C9DCCF]/60 font-metric-value">
<span className="">250 °C</span>
<span className="">180 °C</span>
<span className="">110 °C</span>
<span className="">40 °C</span>
</div>
{/* Right Y-Axis Markings (Viscosity cP) */}
<div className="absolute right-3 top-3 bottom-8 flex flex-col justify-between text-[#0284C7] text-[10px] pointer-events-none z-10 pl-2 border-l border-[#C9DCCF]/60 text-right font-metric-value">
<span className="">15,000 cP</span>
<span className="">10,000 cP</span>
<span className="">5,000 cP</span>
<span className="">100 cP</span>
</div>
{/* Chart Canvas Area */}
<div className="mx-16 h-[calc(100%-2rem)] relative">
<svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 900 180">
<defs>
<linearGradient id="thermalGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stopColor="#00A86B" stopOpacity="0.20"></stop>
<stop offset="100%" stopColor="#EAF7EF" stopOpacity="0.01"></stop>
</linearGradient>
<linearGradient id="viscosityGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stopColor="#0284C7" stopOpacity="0.14"></stop>
<stop offset="100%" stopColor="#EAF7EF" stopOpacity="0.01"></stop>
</linearGradient>
</defs>
{/* Horizontal Guide Lines */}
<line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="10" y2="10"></line>
<line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="65" y2="65"></line>
<line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="120" y2="120"></line>
<line stroke="#E2ECE5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="900" y1="175" y2="175"></line>
{/* Vertical Timeline Markers */}
<line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="0" x2="0" y1="0" y2="180"></line>
<line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="225" x2="225" y1="0" y2="180"></line>
<line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="450" x2="450" y1="0" y2="180"></line>
<line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="675" x2="675" y1="0" y2="180"></line>
<line stroke="#E2ECE5" strokeDasharray="2 4" strokeWidth="0.8" x1="900" x2="900" y1="0" y2="180"></line>
{/* Viscosity Area Fill & Curve (Starts ~12,500 cP [y=25], plummets to ~280 cP [y=168], levels out to 1,240 cP [y=155]) */}
<path d="M 0 25 C 90 28, 170 120, 225 168 C 300 172, 380 166, 450 162 C 550 159, 620 155, 675 155 C 750 155, 830 150, 900 148 L 900 180 L 0 180 Z" fill="url(#viscosityGradient)"></path>
<path d="M 0 25 C 90 28, 170 120, 225 168 C 300 172, 380 166, 450 162 C 550 159, 620 155, 675 155 C 750 155, 830 150, 900 148" stroke="#0284C7" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
{/* Temperature Area Fill & Curve (Starts baseline ~45°C [y=165], rises to 248°C peak [y=12], equilibrates through soak to 118°C [y=105]) */}
<path d="M 0 165 C 80 160, 160 30, 225 12 C 300 12, 370 42, 450 68 C 550 88, 620 102, 675 105 C 750 110, 830 118, 900 124 L 900 180 L 0 180 Z" fill="url(#thermalGradient)"></path>
<path d="M 0 165 C 80 160, 160 30, 225 12 C 300 12, 370 42, 450 68 C 550 88, 620 102, 675 105 C 750 110, 830 118, 900 124" stroke="#00A86B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
{/* Current Operating Point (Day 18 Marker) */}
<line stroke="#00A86B" strokeDasharray="2 2" strokeWidth="1.2" x1="675" x2="675" y1="0" y2="180"></line>
<circle cx="675" cy="105" fill="#FFFFFF" r="5" stroke="#00A86B" strokeWidth="2.5"></circle>
<circle cx="675" cy="155" fill="#FFFFFF" r="5" stroke="#0284C7" strokeWidth="2.5"></circle>
</svg>
{/* Operational Milestone HUD Floating Badge at Day 18 */}
<div className="absolute left-[75%] -top-2 -translate-x-1/2 bg-[#002D1A] px-2.5 py-1 rounded border border-[#00A86B] text-[#FFFFE4] font-telemetry-dense text-[10px] shadow flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
<span className="">Day 18 (Active): {telemetry.reservoirTemp}°C / {telemetry.oilViscosity} cP</span>
</div>
</div>
{/* Timeline Phases Axis Labeling */}
<div className="mx-16 mt-2 flex justify-between text-[#52665C] text-[10px] font-telemetry-dense">
<span className="">Pre-Injection (45°C)</span>
<span className="text-[#006B45] font-semibold">Peak Injection (248°C)</span>
<span className="">Soak Diffusion</span>
<span className="text-[#003B25] font-bold">Production Phase Day 18 (Current)</span>
<span className="">Late Production Cycle</span>
</div>
</div>
{/* Compact Thermodynamic Causal Relationship Bar */}
<div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm overflow-x-auto">
{/* Node 1 */}
<div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
<div className="flex items-center justify-between text-[#10251B] font-label-caps text-label-caps">
<span className="font-semibold uppercase tracking-wide">Steam Injection</span>
<span className="material-symbols-outlined text-xs text-[#00A86B]">mode_heat</span>
</div>
<span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">Enthalpy transfer (2.15 MPa)</span>
</div>
<span className="material-symbols-outlined text-[#52665C] self-center text-sm rotate-90 md:rotate-0">arrow_forward</span>
{/* Node 2 */}
<div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
<div className="flex items-center justify-between text-[#006B45] font-label-caps text-label-caps">
<span className="font-semibold uppercase tracking-wide">Temperature ↑</span>
<span className="material-symbols-outlined text-xs text-[#00A86B]">device_thermostat</span>
</div>
<span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">45°C → 248°C (Peak thermal)</span>
</div>
<span className="material-symbols-outlined text-[#52665C] self-center text-sm rotate-90 md:rotate-0">arrow_forward</span>
{/* Node 3 */}
<div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
<div className="flex items-center justify-between text-[#0284C7] font-label-caps text-label-caps">
<span className="font-semibold uppercase tracking-wide">Viscosity ↓</span>
<span className="material-symbols-outlined text-xs text-[#0284C7]">water_drop</span>
</div>
<span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">12,500 cP → 1,240 cP</span>
</div>
<span className="material-symbols-outlined text-[#52665C] self-center text-sm rotate-90 md:rotate-0">arrow_forward</span>
{/* Node 4 */}
<div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
<div className="flex items-center justify-between text-[#0D9488] font-label-caps text-label-caps">
<span className="font-semibold uppercase tracking-wide">Mobility ↑</span>
<span className="material-symbols-outlined text-xs text-[#0D9488]">fast_forward</span>
</div>
<span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">Darcy k_ro/μ ratio (+10.2x)</span>
</div>
<span className="material-symbols-outlined text-[#52665C] self-center text-sm rotate-90 md:rotate-0">arrow_forward</span>
{/* Node 5 */}
<div className="flex-1 bg-[#FFFFFF] border border-[#00A86B]/50 rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
<div className="flex items-center justify-between text-[#003B25] font-label-caps text-label-caps">
<span className="font-bold uppercase tracking-wide">Production ↑</span>
<span className="material-symbols-outlined text-xs text-[#00A86B]">oil_barrel</span>
</div>
<span className="text-[10px] text-[#006B45] font-telemetry-dense font-medium mt-0.5">{telemetry.production} BPD (Target peak 101 BPD)</span>
</div>
</div>
</div>
{/* Primary Workspace Layout (2-Column Grid: 8-col primary foundation / 4-col companion docks) */}
{/* Prescriptive Optimization Recommendation & Well Operating Status Section */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg select-none">
{/* Left 8-col: Prescriptive Optimization Recommendation Card */}
<div className="lg:col-span-8 flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm">
{/* Header */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md border-b border-[#C9DCCF] mb-space-md">
<div className="flex items-center gap-space-sm">
<span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
<h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-bold">Prescriptive Optimization Recommendation</h2>
<span className="px-2.5 py-1 rounded bg-[#006B45]/10 text-[#006B45] border border-[#006B45]/30 font-label-caps text-xs font-semibold">Prototype Model Recommendation</span>
</div>
<span className="font-telemetry-dense text-telemetry-dense text-[#006B45] font-medium flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>CYCLE OPTIMIZATION READY
      </span>
</div>
{/* Metrics Grid */}
<div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md mb-space-lg">
{/* Metric 1: Steam Duration */}
<div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
<span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">Steam Injection Duration</span>
<div className="flex items-baseline gap-1 mt-1.5">
<span className="font-metric-display text-2xl text-[#10251B] font-bold">2.5</span>
<span className="font-telemetry-data text-xs text-[#52665C]">days</span>
</div>
<span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">+0.5d vs baseline</span>
</div>
{/* Metric 2: Steam Rate */}
<div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
<span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">Steam Rate</span>
<div className="flex items-baseline gap-1 mt-1.5">
<span className="font-metric-display text-2xl text-[#10251B] font-bold">52</span>
<span className="font-telemetry-data text-xs text-[#52665C]">m³/day</span>
</div>
<span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">Controlled thermal plume</span>
</div>
{/* Metric 3: Soak Duration */}
<div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
<span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">Soak Duration</span>
<div className="flex items-baseline gap-1 mt-1.5">
<span className="font-metric-display text-2xl text-[#10251B] font-bold">1.5</span>
<span className="font-telemetry-data text-xs text-[#52665C]">days</span>
</div>
<span className="text-[10px] text-[#52665C] font-telemetry-dense mt-1">36h diffusion cycle</span>
</div>
{/* Metric 4: SRP Speed */}
<div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
<span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">Recommended SRP Speed</span>
<div className="flex items-baseline gap-1 mt-1.5">
<span className="font-metric-display text-2xl text-[#10251B] font-bold">4.5</span>
<span className="font-telemetry-data text-xs text-[#52665C]">SPM</span>
</div>
<span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">Dynamic rod tuning</span>
</div>
{/* Metric 5: Expected Production */}
<div className="bg-[#EAF7EF] border border-[#00A86B]/40 rounded-lg p-space-md flex flex-col justify-between">
<span className="text-[#003B25] font-label-caps text-[10px] uppercase font-semibold tracking-wider">Expected Production</span>
<div className="flex items-baseline gap-1 mt-1.5">
<span className="font-metric-display text-2xl text-[#003B25] font-bold">97</span>
<span className="font-telemetry-data text-xs text-[#006B45] font-semibold">BPD</span>
</div>
<span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">Near peak target (101 BPD)</span>
</div>
{/* Metric 6: Expected Yield Change (Highlighted) */}
<div className="bg-[#D9F2E6] border-2 border-[#00A86B] rounded-lg p-space-md flex flex-col justify-between">
<div className="flex items-center justify-between text-[#003B25] font-label-caps text-[10px] uppercase font-bold">
<span className="">Yield Change</span>
<span className="material-symbols-outlined text-xs text-[#006B45]">trending_up</span>
</div>
<div className="flex items-baseline gap-1 mt-1.5">
<span className="font-metric-display text-2xl text-[#006B45] font-bold">+18.7%</span>
</div>
<span className="text-[10px] text-[#003B25] font-telemetry-dense mt-1 font-semibold">Simulated vs unassisted baseline</span>
</div>
</div>
{/* Action Button Footer */}
<div className="pt-space-sm border-t border-[#C9DCCF] flex items-center justify-between flex-wrap gap-2">
<div className="text-[#52665C] font-telemetry-dense text-xs">
        Prescriptive candidate: <span className="text-[#10251B] font-semibold">Opt-Scenario #04B</span> (EnKF calibrated)
      </div>
<button className="px-space-lg py-2 bg-[#006B45] hover:bg-[#003B25] text-white rounded-lg font-medium text-xs flex items-center gap-2 border border-[#006B45] transition-colors cursor-pointer shadow-sm">
<span className="material-symbols-outlined text-sm">tune</span>
<span className="">View Optimization Details</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/* Right 4-col: Compact Well Operating Status / Alerts Section */}
<div className="lg:col-span-4 flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl overflow-hidden shadow-sm">
{/* Header */}
<div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-[#00A86B] text-base">verified</span>
<h3 className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs font-semibold">Well Operating Status &amp; Alerts</h3>
</div>
<span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-label-caps text-label-caps border border-[#C9DCCF]">NORMAL COND</span>
</div>
{/* Diagnostic Status Items List */}
<div className="p-space-lg flex flex-col gap-space-sm justify-between flex-1">
<div className="flex flex-col gap-2.5">
{/* Status Item 1: Steam Injection */}
<div className="p-2.5 bg-[#F9FCFA] rounded-lg border-l-2 border-[#00A86B] border-y border-r border-[#C9DCCF] flex items-center gap-2.5 shadow-xs">
<span className="material-symbols-outlined text-[#00A86B] text-base shrink-0">check_circle</span>
<div className="flex flex-col min-w-0">
<span className="text-[#10251B] text-xs font-medium leading-tight">Steam injection within operating range</span>
<span className="text-[#52665C] font-telemetry-dense text-[10px] mt-0.5">Wellhead pressure steady at 2.15 MPa (Tolerance ±0.2)</span>
</div>
</div>
{/* Status Item 2: SRP Load */}
<div className="p-2.5 bg-[#F9FCFA] rounded-lg border-l-2 border-[#00A86B] border-y border-r border-[#C9DCCF] flex items-center gap-2.5 shadow-xs">
<span className="material-symbols-outlined text-[#00A86B] text-base shrink-0">check_circle</span>
<div className="flex flex-col min-w-0">
<span className="text-[#10251B] text-xs font-medium leading-tight">SRP load within acceptable range</span>
<span className="text-[#52665C] font-telemetry-dense text-[10px] mt-0.5">Motor load 58% nominal · Rod tension 7.8 klb safe</span>
</div>
</div>
{/* Status Item 3: Warning Item Reservoir Pressure */}
<div className="p-2.5 bg-[#F7FAF8] rounded-lg border-l-2 border-[rgb(245,158,11)] border-y border-r border-[#C9DCCF] flex items-center gap-2.5 shadow-xs">
<span className="material-symbols-outlined text-[rgb(245,158,11)] text-base shrink-0">warning</span>
<div className="flex flex-col min-w-0">
<span className="text-[#10251B] text-xs font-medium leading-tight">Reservoir pressure approaching target limit</span>
<span className="text-[#52665C] font-telemetry-dense text-[10px] mt-0.5">Heel zone at 8.42 MPa (Upper threshold 8.75 MPa)</span>
</div>
</div>
</div>
{/* Summary footer */}
<div className="pt-space-sm border-t border-[#C9DCCF]/60 flex items-center justify-between text-[#52665C] font-telemetry-dense text-[11px]">
<span className="">Safety interlock check: <strong className="text-[#006B45]">Pass</strong></span>
<span className="text-[#10251B] font-metric-value">2 OK / 1 WATCH</span>
</div>
</div>
</div>
</div><div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
{/* LEFT COLUMN: Primary Engineering Modules (8-col) */}
<div className="lg:col-span-8 flex flex-col gap-space-lg">
{/* WELL PAD PHYSICAL SCHEMATIC & SENSOR MAP */}
<div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm">
{/* Module Header */}
<div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-[#00A86B] text-base">account_tree</span>
<span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs">WELL PAD PHYSICAL SCHEMATIC &amp; SENSOR MAP</span>
<span className="font-telemetry-dense text-telemetry-dense text-[#52665C] ml-1">TVD 0m – 1,250m</span>
</div>
<div className="flex items-center gap-space-lg font-telemetry-dense text-telemetry-dense">
<span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-2.5 h-2.5 rounded-xs bg-[#00A86B]"></span>INJ WELL 7A</span>
<span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-2.5 h-2.5 rounded-xs bg-[#38BDF8]"></span>OBS WELL 7B</span>
<span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-2.5 h-2.5 rounded-xs bg-[#003B25]"></span>CHAMBER</span>
</div>
</div>
{/* Schematic Canvas */}
<div className="p-space-lg flex flex-col gap-space-md">
<div className="relative w-full h-80 bg-[#001F12] rounded-lg border border-[#002D1A] p-space-md overflow-hidden font-telemetry-dense">
{/* Grid Lines Background */}
<div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundSize: "32px 32px", backgroundImage: "linear-gradient(to right, #6FA389 1px, transparent 1px), linear-gradient(to bottom, #6FA389 1px, transparent 1px)" }}></div>
{/* TVD Axis Markers (Left Rail) */}
<div className="absolute left-2 top-3 bottom-3 flex flex-col justify-between text-[#A3D9BE] text-[10px] pointer-events-none z-10 border-r border-[#C9DCCF]/20 pr-2">
<span className="">0 m (Surface)</span>
<span className="">250 m (Caprock)</span>
<span className="">550 m (Upper Sand)</span>
<span className="">900 m (Clearwater)</span>
<span className="">1,250 m (Payzone Base)</span>
</div>
{/* Blueprint SVG Architecture Overlay */}
<svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 760 290">
{/* Geological Stratigraphy Bands */}
<rect fill="#002D1A" height="2" opacity="0.8" width="650" x="100" y="55"></rect>
<text fill="#FFFFE4" fontFamily="JetBrains Mono" fontSize="9" x="690" y="50">OVERBURDEN</text>
<rect fill="#002D1A" height="2" opacity="0.8" width="650" x="100" y="125"></rect>
<text fill="#FFFFE4" fontFamily="JetBrains Mono" fontSize="9" x="690" y="120">CLEARWATER FM</text>
{/* Steam Chamber Plume Envelope (Thermal propagation contour) */}
<path d="M 230 195 C 190 170, 190 140, 270 135 C 360 130, 420 150, 430 180 C 440 215, 360 240, 260 230 Z" fill="#00A86B" fillOpacity="0.15" stroke="#00A86B" strokeDasharray="3 3" strokeWidth="1.2"></path>
<path d="M 250 195 C 220 180, 230 155, 280 150 C 330 145, 370 160, 375 185 C 380 205, 330 220, 270 215 Z" fill="#00A86B" fillOpacity="0.25" stroke="#00A86B" strokeWidth="1.2"></path>
<text fill="#FFFFE4" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" x="260" y="185">STEAM CHEST: 248.6°C</text>
{/* Wellbore 7A: Main Injector / Producer Profile (Dual String) */}
<path d="M 180 10 L 180 80 L 180 140 C 180 190, 210 205, 290 205 L 480 205" stroke="#00A86B" strokeLinecap="round" strokeWidth="2.5"></path>
<path d="M 184 10 L 184 80 L 184 140 C 184 187, 212 201, 290 201 L 480 201" stroke="#001F12" strokeWidth="1"></path>
{/* Wellbore 7B: Thermal Observation Offset Well */}
<path d="M 520 10 L 520 225" stroke="#38BDF8" strokeDasharray="4 2" strokeWidth="1.8"></path>
{/* Perforated Intervals / Slotted Liner Zone */}
<line stroke="#FFFFE4" strokeDasharray="2 3" strokeWidth="3" x1="310" x2="470" y1="205" y2="205"></line>
{/* Sensor Nodes & Callouts on Wellbore */}
{/* PT-01: Wellhead Pressure */}
<circle cx="180" cy="18" fill="#001F12" r="4" stroke="#00A86B" strokeWidth="2"></circle>
{/* TC-02: Intermediate Casing Thermocouple */}
<circle cx="180" cy="95" fill="#34D399" r="3.5"></circle>
{/* P/T Gauge Array Heel */}
<circle cx="280" cy="205" fill="#001F12" r="4.5" stroke="#00A86B" strokeWidth="2"></circle>
{/* Fiber Optics Distributed Acoustic/Temp (DTS/DAS) along lateral */}
<circle cx="370" cy="205" fill="#34D399" r="3.5"></circle>
{/* Toe Pressure Transducer PT-04 */}
<circle cx="475" cy="205" fill="#001F12" r="4.5" stroke="#ffb4ab" strokeWidth="2"></circle>
{/* Observation Well Sensor Nodes */}
<circle cx="520" cy="150" fill="#38BDF8" r="3.5"></circle>
<circle cx="520" cy="185" fill="#38BDF8" r="3.5"></circle>
<circle cx="520" cy="220" fill="#38BDF8" r="3.5"></circle>
</svg>
{/* Interactive Sensor HUD Overlay Callouts */}
<div className="absolute left-48 top-4 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
<span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
<span className="text-[#FFFFE4] font-telemetry-dense">WH-01: {telemetry.whPressure} MPa / {telemetry.whTemp}°C</span>
</div>
<div className="absolute left-72 top-36 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
<span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
<span className="text-[#FFFFE4] font-telemetry-dense">HEEL (DTS-01): {telemetry.heelTemp}°C // {telemetry.heelPressure} MPa</span>
</div>
<div className="absolute right-36 bottom-14 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
<span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
<span className="text-[#FFFFE4] font-telemetry-dense">OBS-7B (Mid): 182.4°C (Therm Heat Front)</span>
</div>
<div className="absolute right-6 top-16 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
<span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
<span className="text-[#FFFFE4] font-telemetry-dense">PUMP: ESP Submerged (Idle Soak)</span>
</div>
</div>
{/* Sensor Pinout Table Strip */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm text-telemetry-dense font-telemetry-dense">
<div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
<span className="text-[#52665C] font-label-caps">PT-101 (CASING)</span>
<div className="flex items-center justify-between mt-1">
<span className="text-[#003B25] font-semibold">2.14 MPa</span>
<span className="text-[#006B45] text-[10px] font-medium">HEALTHY</span>
</div>
</div>
<div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
<span className="text-[#52665C] font-label-caps">TC-04 (HEEL MID)</span>
<div className="flex items-center justify-between mt-1">
<span className="text-[#003B25] font-semibold">248.6 °C</span>
<span className="text-[#006B45] text-[10px] font-medium">STABLE</span>
</div>
</div>
<div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
<span className="text-[#52665C] font-label-caps">TC-08 (LATERAL TOE)</span>
<div className="flex items-center justify-between mt-1">
<span className="text-[#003B25] font-semibold">236.1 °C</span>
<span className="text-[#006B45] text-[10px] font-medium">GRADIENT -12°C</span>
</div>
</div>
<div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
<span className="text-[#52665C] font-label-caps">FIBER DAS ACOUSTIC</span>
<div className="flex items-center justify-between mt-1">
<span className="text-[#003B25] font-semibold">14.2 kHz</span>
<span className="text-[#006B45] text-[10px] font-medium">NO CONING</span>
</div>
</div>
</div>
</div>
</div>
{/* CSS CYCLE DYNAMICS & PRESSURE-TEMPERATURE PROFILE */}
<div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm">
<div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-[#006B45] text-base">timeline</span>
<span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs">CSS CYCLE DYNAMICS &amp; PRESSURE-TEMPERATURE PROFILE</span>
</div>
<div className="flex items-center gap-space-lg font-telemetry-dense text-telemetry-dense">
<span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-3 h-0.5 rounded-full bg-[#00A86B]"></span>Temp Downhole (°C)</span>
<span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-3 h-0.5 rounded-full bg-[#003B25]"></span>BHP Model (MPa)</span>
<span className="flex items-center gap-1.5 text-[#52665C]"><span className="w-3 h-0.5 rounded-full bg-[#8FA99B] stroke-dasharray"></span>Steam Rate (t/d)</span>
</div>
</div>
<div className="p-space-lg flex flex-col gap-space-md">
{/* Multi-Series Telemetry Spark Graph */}
<div className="relative w-full h-56 bg-[#F4FAF6] rounded-lg border border-[#C9DCCF] p-space-sm overflow-hidden">
{/* Phase Demarcation Background Bands */}
<div className="absolute inset-0 flex text-[9px] font-telemetry-dense text-[#52665C] select-none pointer-events-none">
<div className="w-[30%] h-full border-r border-[#C9DCCF] bg-[#EAF7EF]/30 p-2">
                INJECTION PHASE (Days 1–12)
              </div>
<div className="w-[35%] h-full border-r border-[#00A86B]/30 bg-[#EAF7EF]/70 p-2 text-[#006B45] font-semibold">
                CURRENT: SOAK PHASE (Days 13–19)
              </div>
<div className="w-[35%] h-full bg-[#FFFFFF]/40 p-2">
                PRODUCTION STAGE (Projected Days 20–85)
              </div>
</div>
{/* Trend SVG Lines */}
<svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 700 190">
{/* Y-Grid Guides */}
<line stroke="#C9DCCF" strokeDasharray="2 3" strokeWidth="0.8" x1="0" x2="700" y1="40" y2="40"></line>
<line stroke="#C9DCCF" strokeDasharray="2 3" strokeWidth="0.8" x1="0" x2="700" y1="95" y2="95"></line>
<line stroke="#C9DCCF" strokeDasharray="2 3" strokeWidth="0.8" x1="0" x2="700" y1="150" y2="150"></line>
{/* Series 1: Temperature Downhole (Teal/Green) */}
<path d="M 0 170 C 50 160, 110 50, 210 25 L 245 28 C 320 32, 420 48, 455 58 C 520 85, 600 130, 700 150" stroke="#00A86B" strokeLinecap="round" strokeWidth="2.2"></path>
{/* Series 2: Bottomhole Pressure (Dark Green) */}
<path d="M 0 140 C 70 125, 140 30, 210 20 L 245 35 C 330 65, 410 90, 455 98 C 530 115, 610 140, 700 165" stroke="#003B25" strokeLinecap="round" strokeWidth="2"></path>
{/* Series 3: Projected Bitumen Inflow Rate (Muted Green dashed) */}
<path d="M 455 180 C 470 140, 490 60, 520 50 C 580 55, 630 110, 700 145" stroke="#8FA99B" strokeDasharray="3 3" strokeWidth="1.8"></path>
{/* Current Time Pointer Line */}
<line stroke="#00A86B" strokeWidth="1.2" x1="365" x2="365" y1="0" y2="190"></line>
<circle cx="365" cy="42" fill="#00A86B" r="3.5"></circle>
<circle cx="365" cy="74" fill="#003B25" r="3.5"></circle>
</svg>
{/* Float Marker Overlay at Cursor/Time */}
<div className="absolute left-[52%] top-3 bg-[#FFFFFF] px-space-sm py-1 rounded-lg border border-[#C9DCCF] shadow font-telemetry-dense text-[10px] text-[#10251B]">
<span className="text-[#006B45] font-semibold">T+16d 08h</span> | T: 248.6°C | P: 8.42 MPa
</div>
</div>
{/* Bottom Axis Legend & Rate Forecast */}
<div className="flex flex-wrap items-center justify-between pt-space-sm border-t border-[#C9DCCF]/60 font-telemetry-dense text-telemetry-dense text-[#52665C]">
<div>
<span className="">Estimated Reservoir Thermal Radius: <strong className="text-[#10251B] font-metric-value ml-1">18.4 m</strong></span>
</div>
<div className="flex items-center gap-space-lg">
<span className="">Expected Peak Production: <strong className="text-[#006B45] font-metric-value ml-1">340 bbl/d</strong></span>
<span className="">Predicted SOR: <strong className="text-[#003B25] font-metric-value ml-1">2.41 m³/m³</strong></span>
</div>
</div>
</div>
</div>
</div>
{/* RIGHT COLUMN: Operational Feeds, Model Parameters & SCADA Log (4-col) */}
<div className="lg:col-span-4 flex flex-col gap-space-lg">
{/* DIGITAL TWIN STATUS & RESERVOIR PARAMETERS */}
<div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm">
<div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-[#00A86B] text-base">settings_suggest</span>
<span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs">MODEL ESTIMATOR STATE</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-label-caps text-label-caps border border-[#C9DCCF]">EnKF RUNNING</span>
</div>
<div className="p-space-lg flex flex-col gap-space-md">
{/* Parameter Matrix */}
<table className="w-full text-left font-telemetry-dense text-telemetry-dense border-collapse">
<thead>
<tr className="text-[#52665C] border-b border-[#C9DCCF]/60 text-[10px]">
<th className="pb-1.5 font-medium">PARAMETER</th>
<th className="pb-1.5 text-right font-medium">CALIBRATED</th>
<th className="pb-1.5 text-right font-medium">VARIANCE</th>
</tr>
</thead>
<tbody className="text-[#10251B] divide-y divide-[#C9DCCF]/40">
<tr className="hover:bg-[#F9FCFA] transition-colors">
<td className="py-2 text-[#52665C]">Steam Quality (X)</td>
<td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">0.82</td>
<td className="py-2 text-right text-[#006B45] font-metric-value">±0.015</td>
</tr>
<tr className="hover:bg-[#F9FCFA] transition-colors bg-[#F9FCFA]/50">
<td className="py-2 text-[#52665C]">Bitumen Viscosity (@248°C)</td>
<td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">12.4 mPa·s</td>
<td className="py-2 text-right text-[#52665C] font-metric-value">Nominal</td>
</tr>
<tr className="hover:bg-[#F9FCFA] transition-colors">
<td className="py-2 text-[#52665C]">Reservoir Permeability (Kh)</td>
<td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">1,480 mD</td>
<td className="py-2 text-right text-[#006B45] font-metric-value">+40 mD</td>
</tr>
<tr className="hover:bg-[#F9FCFA] transition-colors bg-[#F9FCFA]/50">
<td className="py-2 text-[#52665C]">Overburden Heat Loss Rate</td>
<td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">184 kW</td>
<td className="py-2 text-right text-[#006B45] font-metric-value">-2.1%</td>
</tr>
<tr className="hover:bg-[#F9FCFA] transition-colors">
<td className="py-2 text-[#52665C]">Skin Factor (S)</td>
<td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">+0.42</td>
<td className="py-2 text-right text-[#006B45] font-metric-value">Clean</td>
</tr>
<tr className="hover:bg-[#F9FCFA] transition-colors bg-[#F9FCFA]/50">
<td className="py-2 text-[#52665C]">Caprock Integrity Index</td>
<td className="py-2 text-right font-semibold text-[#003B25] font-metric-value">0.982 / 1.0</td>
<td className="py-2 text-right text-[#006B45] font-metric-value">SAFE</td>
</tr>
</tbody>
</table>
{/* Actuator Interlock Action */}
<div className="pt-space-sm border-t border-[#C9DCCF]/60 flex items-center justify-between">
<button className="px-space-md py-1.5 bg-[#006B45] hover:bg-[#003B25] text-white rounded-lg font-label-caps text-label-caps border border-[#006B45] transition-colors flex items-center gap-1.5 shadow-sm">
<span className="material-symbols-outlined text-sm">tune</span>RE-ESTIMATE MATRIX
</button>
<span className="text-[#52665C] font-telemetry-dense text-[10px]">Autocal: ON (30m)</span>
</div>
</div>
</div>
{/* ACTIVE ALERTS & INDUSTRIAL SCADA LOG */}
<div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm">
<div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-[#006B45] text-base">notifications</span>
<span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs">SCADA TELEMETRY &amp; ALARM LOG</span>
</div>
<span className="font-telemetry-dense text-telemetry-dense text-[#52665C] font-medium">FILTER: ALL</span>
</div>
<div className="p-space-md flex flex-col gap-2 max-h-[320px] overflow-y-auto font-telemetry-dense text-telemetry-dense">
{/* Alert Item 1: Info */}
<div className="p-space-sm bg-[#F7FAF8] rounded-lg border-l-2 border-[rgb(37,99,235)] border-y border-r border-[#C9DCCF] flex flex-col gap-1 shadow-sm">
<div className="flex items-center justify-between">
<span className="text-[rgb(37,99,235)] font-semibold">[INFO] EnKF State Vector Updated</span>
<span className="text-[#52665C] text-[10px]">14:31:42</span>
</div>
<p className="text-[#10251B] text-[11px] leading-tight">Cycle #3 soak temperature propagation matched within 0.042 RMSE tolerance.</p>
</div>
{/* Alert Item 2: Warn */}
<div className="p-space-sm bg-[#F7FAF8] rounded-lg border-l-2 border-[rgb(245,158,11)] border-y border-r border-[#C9DCCF] flex flex-col gap-1 shadow-sm">
<div className="flex items-center justify-between">
<span className="text-[rgb(245,158,11)] font-semibold">[WARN] TC-04 Transient Drift</span>
<span className="text-[#52665C] text-[10px]">14:28:10</span>
</div>
<p className="text-[#10251B] text-[11px] leading-tight">Thermocouple heel quadrant transient spike +1.8°C. Thermal boundary auto-damped.</p>
</div>
{/* Alert Item 3: Routine */}
<div className="p-space-sm bg-[#F7FAF8] rounded-lg border-l-2 border-[#003B25] border-y border-r border-[#C9DCCF] flex flex-col gap-1 shadow-sm">
<div className="flex items-center justify-between">
<span className="text-[#003B25] font-semibold">[DATA] Modbus Poll Pad-07</span>
<span className="text-[#52665C] text-[10px]">14:26:01</span>
</div>
<p className="text-[#52665C] text-[11px] leading-tight">32/32 RTU channels verified. Packet loss 0.00%. Latency nominal at 12ms.</p>
</div>
{/* Alert Item 4: Notice */}
<div className="p-space-sm bg-[#F7FAF8] rounded-lg border-l-2 border-[#003B25] border-y border-r border-[#C9DCCF] flex flex-col gap-1 shadow-sm">
<div className="flex items-center justify-between">
<span className="text-[#003B25] font-semibold">[VALVE] SOV-21 Interlock Engaged</span>
<span className="text-[#52665C] text-[10px]">14:15:33</span>
</div>
<p className="text-[#52665C] text-[11px] leading-tight">Casing bleed valve placed into automatic soak-backpressure lock state (2.1 MPa).</p>
</div>
</div>
{/* Acknowledge Footer Button Strip */}
<div className="p-space-sm bg-[#FFFFFF] border-t border-[#C9DCCF] flex items-center justify-between">
<button className="w-full py-1.5 text-center bg-[#EAF7EF] hover:bg-[#D9F2E6] text-[#003B25] font-label-caps text-label-caps rounded-lg transition-colors border border-[#006B45]">
            ACKNOWLEDGE ALL ACTIVE ALARMS (3)
          </button>
</div>
</div>
{/* Quick Setpoint Stepper Widget */}
<div className="p-space-lg bg-[#EAF7EF] rounded-xl border border-[#C9DCCF] flex flex-col gap-space-sm shadow-sm">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-[#52665C] uppercase tracking-wide">SOAK PERIOD SETPOINT</span>
<span className="text-[#006B45] font-telemetry-dense font-medium">DAY 4 OF 7</span>
</div>
<div className="flex items-center justify-between gap-space-md mt-1">
<div className="flex-1 bg-[#FFFFFF] px-space-md py-1.5 rounded-lg border border-[#C9DCCF] flex items-center justify-between">
<span className="font-telemetry-dense text-[#10251B] font-medium">Target Soak Duration</span>
<span className="text-[#003B25] font-metric-value text-metric-value font-bold">168.0 hrs</span>
</div>
<div className="flex items-center gap-1.5">
<button className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] rounded-lg border border-[#C9DCCF] text-[#10251B] hover:border-[#00A86B] text-sm font-bold transition-colors shadow-sm" title="Decrease target">-</button>
<button className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] rounded-lg border border-[#C9DCCF] text-[#10251B] hover:border-[#00A86B] text-sm font-bold transition-colors shadow-sm" title="Increase target">+</button>
</div>
</div>
<div className="flex items-center justify-between text-[#52665C] text-[10px] font-telemetry-dense mt-1">
<span className="">Min: 96 hrs</span>
<span className="">Switch to Prod: 2025-05-21 14:00 UTC</span>
<span className="">Max: 240 hrs</span>
</div>
</div>
</div>
</div>
</div>
</main>
    </React.Fragment>
  );
}
