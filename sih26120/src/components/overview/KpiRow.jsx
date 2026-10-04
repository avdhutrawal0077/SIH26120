import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getViscosityClassification } from '../../lib/twinModel';

/**
 * Value with subtle flash animation on change
 */
function FlashingValue({ value, className = '' }) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={`${className} transition-all duration-300 ${
        flash ? 'text-[#00A86B] scale-[1.03] inline-block' : ''
      }`}
    >
      {value}
    </span>
  );
}

/**
 * Mini SVG Sparkline
 */
function MiniSparkline({ data = [], color = '#00A86B', height = 22, width = 64 }) {
  if (!data || data.length < 2) return null;

  const points = data.slice(-20);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pathD = points
    .map((val, i) => {
      const x = (i / (points.length - 1)) * (width - 4) + 2;
      const y = height - 2 - ((val - min) / range) * (height - 6);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * KpiRow Component
 * 4-Column High-Density SCADA Matrix with flashing metrics, mini sparklines,
 * dynamic delta % with icon, and computed viscosity badge.
 */
function KpiRowComponent({ telemetry, cycle, historyPoints = [] }) {
  // Sparkline history data series
  const prodHistory = useMemo(() => historyPoints.map(p => p.production), [historyPoints]);
  const tempHistory = useMemo(() => historyPoints.map(p => p.temp), [historyPoints]);
  const viscHistory = useMemo(() => historyPoints.map(p => p.viscosity), [historyPoints]);

  // Delta calculations
  const prodChangeStr = telemetry.prodChange || '+0.0%';
  const isProdPositive = !prodChangeStr.startsWith('-');

  // Viscosity Classification
  const viscInfo = useMemo(() => {
    return getViscosityClassification(telemetry.oilViscosity);
  }, [telemetry.oilViscosity]);

  // Cycle Progress
  const cycleNum = cycle.number || 2;
  const totalCycles = cycle.totalCycles || 5;
  const dayInPhase = cycle.dayInPhase || 18;
  const phaseDays = cycle.phaseDays || 45;
  const progressPct = phaseDays > 0
    ? Math.min(100, Math.max(0, ((dayInPhase / phaseDays) * 100))).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
      {/* Card 1: Current Production */}
      <div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-[#52665C] mb-1.5">
          <span className="font-label-caps text-label-caps tracking-wider uppercase">
            CURRENT PRODUCTION
          </span>
          <span
            className={`px-2 py-0.5 rounded-full ${
              isProdPositive ? 'bg-[#D9F2E6] text-[#006B45]' : 'bg-[#FEE2E2] text-[#DC2626]'
            } font-telemetry-dense text-telemetry-dense border border-[#C9DCCF] flex items-center gap-0.5`}
          >
            <span className="material-symbols-outlined text-xs">
              {isProdPositive ? 'trending_up' : 'trending_down'}
            </span>
            {prodChangeStr}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-space-sm">
            <FlashingValue
              value={telemetry.production}
              className="font-metric-display text-metric-display text-[#10251B] font-bold"
            />
            <span className="font-telemetry-data text-telemetry-data text-[#003B25]">BPD</span>
          </div>
          <MiniSparkline data={prodHistory} color="#00A86B" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense">
          <span className={`${isProdPositive ? 'text-[#006B45]' : 'text-[#DC2626]'} font-medium`}>
            {prodChangeStr} vs previous cycle
          </span>
          <span className="text-[#52665C]">Target: 95 BPD</span>
        </div>
      </div>

      {/* Card 2: Reservoir Temperature */}
      <div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-[#52665C] mb-1.5">
          <span className="font-label-caps text-label-caps tracking-wider uppercase">
            RESERVOIR TEMPERATURE
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-telemetry-dense text-telemetry-dense border border-[#C9DCCF]">
            IN-SITU
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-space-sm">
            <FlashingValue
              value={telemetry.reservoirTemp}
              className="font-metric-display text-metric-display text-[#10251B] font-bold"
            />
            <span className="font-telemetry-data text-telemetry-data text-[#003B25]">°C</span>
          </div>
          <MiniSparkline data={tempHistory} color="#00A86B" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense">
          <span>Current downhole estimate</span>
          <span className="text-[#10251B] font-medium font-metric-value">±1.5 °C</span>
        </div>
      </div>

      {/* Card 3: Oil Viscosity */}
      <div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-[#52665C] mb-1.5">
          <span className="font-label-caps text-label-caps tracking-wider uppercase">
            OIL VISCOSITY
          </span>
          <span
            className={`px-2 py-0.5 rounded-full ${viscInfo.bgClass} ${viscInfo.colorClass} font-telemetry-dense text-telemetry-dense border border-[#C9DCCF]`}
          >
            {viscInfo.label}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-space-sm">
            <FlashingValue
              value={telemetry.oilViscosity}
              className="font-metric-display text-metric-display text-[#10251B] font-bold"
            />
            <span className="font-telemetry-data text-telemetry-data text-[#003B25]">cP</span>
          </div>
          <MiniSparkline data={viscHistory} color="#0284C7" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense">
          <span>Estimated current viscosity</span>
          <span className={`${viscInfo.colorClass} font-medium font-metric-value`}>
            {viscInfo.display}
          </span>
        </div>
      </div>

      {/* Card 4: Cycle Progress */}
      <div className="flex flex-col bg-[#FFFFFF] p-space-lg rounded-xl border border-[#C9DCCF] relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-[#52665C] mb-1.5">
          <span className="font-label-caps text-label-caps tracking-wider uppercase">
            CYCLE PROGRESS
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#006B45] font-telemetry-dense text-telemetry-dense border border-[#C9DCCF]">
            {cycle.phase === 'STANDBY' ? 'STANDBY' : 'ACTIVE'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-headline-md text-headline-md text-[#10251B] font-semibold">
            Cycle {cycleNum} / {totalCycles}
          </span>
          <span className="font-telemetry-dense text-telemetry-dense text-[#006B45] font-medium">
            {progressPct}%
          </span>
        </div>
        <div className="w-full bg-[#D9F2E6] h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#00A86B] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C9DCCF]/60 text-[#52665C] font-telemetry-dense text-telemetry-dense">
          <span>
            {cycle.phase ? cycle.phase.charAt(0) + cycle.phase.slice(1).toLowerCase() : 'Production'} phase
          </span>
          <span className="text-[#10251B] font-medium font-metric-value">
            Day {dayInPhase} of {phaseDays}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(KpiRowComponent);
