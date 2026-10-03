import React, { useMemo } from 'react';
import LineChart from '../charts/LineChart';

/**
 * ThermalViscosity Component
 * Downhole temperature stimulation vs in-situ crude oil viscosity response,
 * dual-axis chart rendered with LineChart, live operating point marker,
 * and 5-node thermodynamic causal relationship chain with live values.
 */
function ThermalViscosityComponent({
  telemetry,
  cycle = {},
  setpoints = {},
  derivedMetrics = {},
  thermalViscData
}) {
  const dayInPhase = cycle?.dayInPhase || 18;
  const currentTemp = Number(telemetry.reservoirTemp) || 118;
  const currentVisc = parseInt(String(telemetry.oilViscosity).replace(/,/g, ''), 10) || 1240;
  const currentDay = thermalViscData?.currentDay || 21;
  const totalDays = thermalViscData?.totalDays || 68;
  const mobilityRatio = thermalViscData?.mobilityRatio || '10.2';
  const expectedPeak = derivedMetrics?.expectedPeakNum || 101;

  // Dual-axis series configuration for LineChart
  const series = useMemo(() => {
    return [
      {
        id: 'temp',
        name: 'Reservoir Temp (°C)',
        data: thermalViscData?.tempSeries || [],
        color: '#00A86B',
        strokeWidth: 2.5,
        areaFill: true,
        yAxis: 'left'
      },
      {
        id: 'visc',
        name: 'Oil Viscosity (cP)',
        data: thermalViscData?.viscSeries || [],
        color: '#0284C7',
        strokeWidth: 2.2,
        dashed: '5 3',
        areaFill: true,
        yAxis: 'right'
      }
    ];
  }, [thermalViscData]);

  // Operational markers
  const markers = useMemo(() => {
    return [
      {
        x: currentDay,
        type: 'vertical',
        color: '#00A86B',
        label: `Day ${currentDay}`
      },
      {
        x: currentDay,
        y: currentTemp,
        yAxis: 'left',
        color: '#00A86B'
      },
      {
        x: currentDay,
        y: currentVisc,
        yAxis: 'right',
        color: '#0284C7'
      }
    ];
  }, [currentDay, currentTemp, currentVisc]);

  // Label formatters
  const xLabelFormatter = (val) => `Day ${Math.round(val)}`;
  const yLabelFormatter = (val) => `${Math.round(val)} °C`;
  const yRightLabelFormatter = (val) => `${Math.round(val).toLocaleString()} cP`;

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none">
      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-[#C9DCCF]">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
            <h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">
              Thermal &amp; Viscosity Response
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">
              THERMODYNAMIC COUPLING
            </span>
          </div>
          <p className="font-body-md text-body-md text-[#52665C] mt-1 font-normal">
            Downhole temperature stimulation vs in-situ crude oil viscosity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg font-telemetry-dense text-telemetry-dense text-[#003B25] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
            <span>
              Current Op Point:{' '}
              <strong className="font-metric-value text-[#10251B]">{telemetry.reservoirTemp}°C</strong> @{' '}
              <strong className="font-metric-value text-[#006B45]">{telemetry.oilViscosity} cP</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Dual-Axis Telemetry Chart (Rendered via LineChart) */}
      <div className="relative w-full bg-[#F8FCF9] rounded-lg border border-[#C9DCCF] p-space-md mb-space-lg">
        {/* Floating HUD Milestone Badge */}
        <div
          className="absolute -top-2 z-10 bg-[#002D1A] px-2.5 py-1 rounded border border-[#00A86B] text-[#FFFFE4] font-telemetry-dense text-[10px] shadow flex items-center gap-1.5 pointer-events-none transition-all duration-150"
          style={{
            left: `${Math.max(10, Math.min(85, (currentDay / totalDays) * 100))}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
          <span>
            Day {dayInPhase} ({cycle?.phase || 'Active'}): {telemetry.reservoirTemp}°C / {telemetry.oilViscosity} cP
          </span>
        </div>

        <LineChart
          series={series}
          markers={markers}
          xDomain={[0, totalDays]}
          xLabelFormatter={xLabelFormatter}
          yLabelFormatter={yLabelFormatter}
          yRightLabelFormatter={yRightLabelFormatter}
          height={220}
          showLegend={true}
        />

        {/* Timeline Phases Landmark Labels */}
        <div className="mx-14 mt-1 flex justify-between text-[#52665C] text-[10px] font-telemetry-dense border-t border-[#C9DCCF]/50 pt-1.5">
          <span>Pre-Injection (45°C)</span>
          <span className="text-[#006B45] font-semibold">
            Peak Injection ({thermalViscData?.peakTemp || 248}°C)
          </span>
          <span>Soak Diffusion</span>
          <span className="text-[#003B25] font-bold">
            {cycle?.phase || 'Production'} Day {dayInPhase} (Live)
          </span>
          <span>Late Cycle</span>
        </div>
      </div>

      {/* Compact Thermodynamic Causal Relationship Bar with Live Numbers */}
      <div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm overflow-x-auto">
        {/* Node 1: Steam */}
        <div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
          <div className="flex items-center justify-between text-[#10251B] font-label-caps text-label-caps">
            <span className="font-semibold uppercase tracking-wide">Steam Injection</span>
            <span className="material-symbols-outlined text-xs text-[#00A86B]">mode_heat</span>
          </div>
          <span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">
            {setpoints?.steamRate || 52} m³/d ({telemetry.whPressure} bar)
          </span>
        </div>
        <span className="material-symbols-outlined text-[#00A86B] font-bold self-center text-sm rotate-90 md:rotate-0">
          arrow_forward
        </span>

        {/* Node 2: Temperature */}
        <div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
          <div className="flex items-center justify-between text-[#006B45] font-label-caps text-label-caps">
            <span className="font-semibold uppercase tracking-wide">Temperature ↑</span>
            <span className="material-symbols-outlined text-xs text-[#00A86B]">device_thermostat</span>
          </div>
          <span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">
            45°C → {telemetry.reservoirTemp}°C (Peak {telemetry.heelTemp || 248}°C)
          </span>
        </div>
        <span className="material-symbols-outlined text-[#00A86B] font-bold self-center text-sm rotate-90 md:rotate-0">
          arrow_forward
        </span>

        {/* Node 3: Viscosity */}
        <div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
          <div className="flex items-center justify-between text-[#0284C7] font-label-caps text-label-caps">
            <span className="font-semibold uppercase tracking-wide">Viscosity ↓</span>
            <span className="material-symbols-outlined text-xs text-[#0284C7]">water_drop</span>
          </div>
          <span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">
            12,500 cP → {telemetry.oilViscosity} cP
          </span>
        </div>
        <span className="material-symbols-outlined text-[#00A86B] font-bold self-center text-sm rotate-90 md:rotate-0">
          arrow_forward
        </span>

        {/* Node 4: Mobility */}
        <div className="flex-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
          <div className="flex items-center justify-between text-[#0D9488] font-label-caps text-label-caps">
            <span className="font-semibold uppercase tracking-wide">Mobility ↑</span>
            <span className="material-symbols-outlined text-xs text-[#0D9488]">fast_forward</span>
          </div>
          <span className="text-[10px] text-[#52665C] font-telemetry-dense mt-0.5">
            Darcy k_ro/μ ratio (+{mobilityRatio}x)
          </span>
        </div>
        <span className="material-symbols-outlined text-[#00A86B] font-bold self-center text-sm rotate-90 md:rotate-0">
          arrow_forward
        </span>

        {/* Node 5: Production */}
        <div className="flex-1 bg-[#FFFFFF] border border-[#00A86B]/50 rounded-lg p-space-sm flex flex-col min-w-[140px] shadow-xs">
          <div className="flex items-center justify-between text-[#003B25] font-label-caps text-label-caps">
            <span className="font-bold uppercase tracking-wide">Production ↑</span>
            <span className="material-symbols-outlined text-xs text-[#00A86B]">oil_barrel</span>
          </div>
          <span className="text-[10px] text-[#006B45] font-telemetry-dense font-medium mt-0.5">
            {telemetry.production} BPD (Target peak {expectedPeak} BPD)
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ThermalViscosityComponent);
