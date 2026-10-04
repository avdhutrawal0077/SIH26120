import React, { useState, useMemo } from 'react';

/**
 * MetricRow with hover tooltip showing 5-minute min/max & trend
 */
function MetricRow({
  label,
  value,
  unit,
  historyPoints = [],
  historyKey,
  isHighlighted = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Compute 5-minute statistics (last ~85 points at 3.5s ticks)
  const stats = useMemo(() => {
    if (!historyPoints || historyPoints.length === 0 || !historyKey) return null;
    const recent = historyPoints.slice(-85);
    const nums = recent
      .map((p) => {
        const val = p[historyKey];
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseFloat(val.replace(/,/g, ''));
        return NaN;
      })
      .filter((n) => !isNaN(n));

    if (nums.length === 0) return null;

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] < min) min = nums[i];
      if (nums[i] > max) max = nums[i];
    }

    const first = nums[0];
    const latest = nums[nums.length - 1];
    const diff = latest - first;
    let trend = 'Stable';
    let trendColor = 'text-[#52665C]';

    if (Math.abs(diff) > 0.05) {
      if (diff > 0) {
        trend = 'Rising ↑';
        trendColor = 'text-[#00A86B]';
      } else {
        trend = 'Falling ↓';
        trendColor = 'text-[#0284C7]';
      }
    }

    return {
      min: min.toLocaleString(),
      max: max.toLocaleString(),
      trend,
      trendColor
    };
  }, [historyPoints, historyKey]);

  return (
    <div
      className="relative flex items-center justify-between py-0.5 px-1 rounded transition-colors hover:bg-[#EAF7EF]/60 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-[#52665C] text-[11px]">{label}</span>
      <span
        className={`font-semibold font-metric-value text-xs ${
          isHighlighted ? 'text-[#006B45]' : 'text-[#10251B]'
        }`}
      >
        {value} <span className="text-[#52665C] font-normal">{unit}</span>
      </span>

      {/* Hover Tooltip with 5-minute min/max & trend */}
      {isHovered && stats && (
        <div className="absolute right-0 bottom-full mb-1 z-30 pointer-events-none bg-[#002D1A]/95 text-[#FFFFE4] px-2.5 py-1.5 rounded border border-[#00A86B]/40 shadow-lg text-[10px] font-telemetry-dense whitespace-nowrap">
          <div className="text-[#8FA99B] font-semibold border-b border-[#00A86B]/30 pb-0.5 mb-1 flex items-center justify-between gap-3">
            <span>5-Min Window ({label})</span>
            <span className={`font-bold ${stats.trendColor}`}>{stats.trend}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Min: <strong className="font-metric-value text-white">{stats.min}</strong> {unit}
            </span>
            <span>
              Max: <strong className="font-metric-value text-white">{stats.max}</strong> {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DigitalTwinState Component
 * Real-time 3D state reconstruction across Reservoir, Wellbore, and SRP systems.
 * Data-driven bar widths, computed lift status chips, thresholded motor load colors,
 * and 5-min history min/max hover tooltips.
 */
function DigitalTwinStateComponent({ telemetry, historyPoints = [] }) {
  const motorLoadVal = Number(telemetry.motorLoad) || 0;
  const oilSatVal = Number(telemetry.oilSaturation) || 61;
  const productionVal = Number(telemetry.production) || 0;
  const rodLoadVal = Number(telemetry.rodLoad) || 0;
  const fluidLevelVal = Number(telemetry.wellboreFluidLevel) || 720;

  // Bar widths: value / max
  const oilSatBarWidth = Math.min(100, Math.max(0, oilSatVal));
  // Design capacity = 100 BPD
  const flowBarWidth = Math.min(100, Math.max(0, Math.round((productionVal / 100) * 100)));
  // Rated rod load = 10.0 klb
  const srpBarWidth = Math.min(100, Math.max(0, Math.round((rodLoadVal / 10.0) * 100)));

  // Computed Status Chip: Stable Lift / Gas Interference / Pump-Off
  const statusChip = useMemo(() => {
    if (fluidLevelVal < 600) {
      return {
        label: 'Pump-Off',
        className: 'text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A]'
      };
    }
    if (motorLoadVal > 80) {
      return {
        label: 'Gas Interference',
        className: 'text-[#C2410C] bg-[#FFEDD5] border border-[#FED7AA]'
      };
    }
    return {
      label: 'Stable Lift',
      className: 'text-[#006B45] bg-[#D9F2E6]'
    };
  }, [fluidLevelVal, motorLoadVal]);

  // Motor Load Status Text and Threshold Colors
  const motorLoadInfo = useMemo(() => {
    if (motorLoadVal <= 0) {
      return {
        text: 'Idle / Off',
        className: 'text-[#52665C]'
      };
    }
    if (motorLoadVal > 85) {
      return {
        text: `${motorLoadVal}% Overload`,
        className: 'text-[#DC2626] font-semibold'
      };
    }
    if (motorLoadVal > 70) {
      return {
        text: `${motorLoadVal}% High`,
        className: 'text-[#D97706] font-semibold'
      };
    }
    return {
      text: `${motorLoadVal}% Nominal`,
      className: 'text-[#006B45] font-medium'
    };
  }, [motorLoadVal]);

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md border-b border-[#C9DCCF] mb-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
          <h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">
            Digital Twin State
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] border border-[#C9DCCF] text-[#003B25] font-label-caps text-label-caps">
            REAL-TIME RECONSTRUCTION
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-telemetry-dense text-telemetry-dense text-[#006B45]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
          <span>SYNCHRONIZED ({telemetry.scadaLatency})</span>
        </div>
      </div>

      {/* 3 Module Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Panel 1: Reservoir */}
        <div className="flex flex-col bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#C9DCCF]/60 mb-space-sm">
            <span className="font-label-caps text-label-caps uppercase text-[#003B25] font-semibold tracking-wider">
              RESERVOIR
            </span>
            <span className="material-symbols-outlined text-[#52665C] text-xs">layers</span>
          </div>
          <div className="flex flex-col gap-1.5 font-telemetry-dense">
            <MetricRow
              label="Temperature"
              value={telemetry.reservoirTemp}
              unit="°C"
              historyPoints={historyPoints}
              historyKey="temp"
            />
            <MetricRow
              label="Pressure"
              value={telemetry.reservoirPressure}
              unit="bar"
              historyPoints={historyPoints}
              historyKey="pressure"
            />
            <MetricRow
              label="Oil Saturation"
              value={`${oilSatVal}%`}
              unit=""
              historyPoints={historyPoints}
              historyKey="oilSaturation"
              isHighlighted={true}
            />
            {/* Real Data-driven Oil Saturation Bar */}
            <div className="w-full bg-[#D9F2E6] h-1 rounded-full overflow-hidden my-0.5">
              <div
                className="h-full rounded-full bg-[#00A86B] transition-all duration-300"
                style={{ width: `${oilSatBarWidth}%` }}
              ></div>
            </div>
            <MetricRow
              label="Viscosity"
              value={telemetry.oilViscosity}
              unit="cP"
              historyPoints={historyPoints}
              historyKey="viscosity"
            />
          </div>
        </div>

        {/* Panel 2: Wellbore */}
        <div className="flex flex-col bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#C9DCCF]/60 mb-space-sm">
            <span className="font-label-caps text-label-caps uppercase text-[#003B25] font-semibold tracking-wider">
              WELLBORE
            </span>
            <span className="material-symbols-outlined text-[#52665C] text-xs">
              precision_manufacturing
            </span>
          </div>
          <div className="flex flex-col gap-1.5 font-telemetry-dense">
            <MetricRow
              label="Fluid Level"
              value={telemetry.wellboreFluidLevel}
              unit="m"
              historyPoints={historyPoints}
              historyKey="fluidLevel"
            />
            <MetricRow
              label="Bottom-hole P."
              value={telemetry.bottomHolePressure}
              unit="bar"
              historyPoints={historyPoints}
              historyKey="bottomHolePressure"
            />
            <MetricRow
              label="Flow Rate"
              value={telemetry.production}
              unit="BPD"
              historyPoints={historyPoints}
              historyKey="production"
              isHighlighted={true}
            />
            {/* Real Data-driven Flow Bar (Production / Design Capacity 100 BPD) */}
            <div className="w-full bg-[#D9F2E6] h-1 rounded-full overflow-hidden my-0.5">
              <div
                className="h-full rounded-full bg-[#00A86B] transition-all duration-300"
                style={{ width: `${flowBarWidth}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between pt-1 px-1">
              <span className="text-[#52665C] text-[11px]">Status</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${statusChip.className}`}
              >
                {statusChip.label}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: SRP (Sucker Rod Pump) */}
        <div className="flex flex-col bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#C9DCCF]/60 mb-space-sm">
            <span className="font-label-caps text-label-caps uppercase text-[#003B25] font-semibold tracking-wider">
              SRP (SUCKER ROD)
            </span>
            <span className="material-symbols-outlined text-[#52665C] text-xs">
              swap_vertical_circle
            </span>
          </div>
          <div className="flex flex-col gap-1.5 font-telemetry-dense">
            <MetricRow
              label="Pump Speed"
              value={telemetry.pumpSpeed}
              unit="SPM"
              historyPoints={historyPoints}
              historyKey="pumpSpeed"
            />
            <MetricRow
              label="Stroke Length"
              value={telemetry.strokeLength ?? 96}
              unit="in"
              historyPoints={historyPoints}
              historyKey="strokeLength"
            />
            <MetricRow
              label="Rod Load"
              value={telemetry.rodLoad}
              unit="klb"
              historyPoints={historyPoints}
              historyKey="rodLoad"
            />
            {/* Real Data-driven SRP Bar (Rod Load / Rated 10 klb) */}
            <div className="w-full bg-[#D9F2E6] h-1 rounded-full overflow-hidden my-0.5">
              <div
                className="h-full rounded-full bg-[#006B45] transition-all duration-300"
                style={{ width: `${srpBarWidth}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between pt-1 px-1">
              <span className="text-[#52665C] text-[11px]">Motor Load</span>
              <span className={`text-[10px] ${motorLoadInfo.className}`}>
                {motorLoadInfo.text}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DigitalTwinStateComponent);
