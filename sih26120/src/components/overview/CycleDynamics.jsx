import React, { useMemo } from 'react';
import LineChart from '../charts/LineChart';

/**
 * CycleDynamics Component
 * CSS cycle dynamics, downhole P-T profile curves rendered with LineChart,
 * dynamic phase duration bands, live cycle day pointer, click-to-toggle series,
 * and model-derived thermal radius, expected peak production, and SOR.
 */
function CycleDynamicsComponent({
  telemetry = {},
  cycle = {},
  derivedMetrics = {},
  cyclePTData
}) {
  const dayInPhase = cycle?.dayInPhase || 18;
  const currentPhase = cycle?.phase || 'PRODUCTION';

  const totalDays = cyclePTData?.totalDays || 55;
  const injEnd = cyclePTData?.injEnd || 3;
  const soakEnd = cyclePTData?.soakEnd || 10;
  const currentDay = cyclePTData?.currentDay || 28;

  const thermalRadius = cyclePTData?.thermalRadius || derivedMetrics?.thermalRadius || '18.4 m';
  const sor = cyclePTData?.sor || derivedMetrics?.sor || '2.41 m³/m³';
  const expectedPeak = cyclePTData?.expectedPeak || derivedMetrics?.expectedPeak || '101 BPD';

  // 3 series data for LineChart
  const series = useMemo(() => {
    return [
      {
        id: 'tempDownhole',
        name: 'Temp Downhole (°C)',
        data: cyclePTData?.tempDownhole || [],
        color: '#00A86B',
        strokeWidth: 2.2,
        yAxis: 'left',
        formatter: (val) => `${Math.round(val)} °C`
      },
      {
        id: 'bhpModel',
        name: 'BHP Model (MPa)',
        data: cyclePTData?.bhpModel || [],
        color: '#003B25',
        strokeWidth: 2.0,
        yAxis: 'right',
        formatter: (val) => `${Number(val).toFixed(2)} MPa`
      },
      {
        id: 'steamRate',
        name: 'Steam Rate (t/d)',
        data: cyclePTData?.steamRateSeries || [],
        color: '#8FA99B',
        dashed: '3 3',
        strokeWidth: 1.8,
        yAxis: 'left',
        formatter: (val) => `${Math.round(val)} t/d`
      }
    ];
  }, [cyclePTData]);

  // Current day pointer marker
  const markers = useMemo(() => {
    return [
      {
        x: currentDay,
        type: 'vertical',
        color: '#00A86B',
        label: `Day ${currentDay}`
      }
    ];
  }, [currentDay]);

  // Band widths in percentages based on real phase durations
  const injPct = Math.max(5, (injEnd / totalDays) * 100);
  const soakPct = Math.max(5, ((soakEnd - injEnd) / totalDays) * 100);
  const prodPct = Math.max(10, 100 - injPct - soakPct);

  // Formatting helpers
  const xLabelFormatter = (x) => `D${Math.round(x)}`;
  const yLabelFormatter = (y) => `${Math.round(y)}`;
  const yRightLabelFormatter = (y) => `${Number(y).toFixed(1)} MPa`;

  return (
    <div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm select-none">
      {/* Header */}
      <div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[#006B45] text-base">timeline</span>
          <span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs">
            CSS CYCLE DYNAMICS &amp; PRESSURE-TEMPERATURE PROFILE
          </span>
        </div>
      </div>

      <div className="p-space-lg flex flex-col gap-space-md">
        {/* Phase Demarcation Background Bands (Sized from real phase durations) */}
        <div className="w-full flex text-[9px] font-telemetry-dense text-[#52665C] border border-[#C9DCCF] rounded-t-lg overflow-hidden select-none">
          <div
            className={`p-2 border-r border-[#C9DCCF] transition-all truncate ${
              currentPhase === 'INJECTION'
                ? 'bg-[#EAF7EF] text-[#006B45] font-semibold ring-1 ring-inset ring-[#00A86B]'
                : 'bg-[#F9FCFA]'
            }`}
            style={{ width: `${injPct}%` }}
          >
            {currentPhase === 'INJECTION' ? 'CURRENT: ' : ''}INJECTION (D1–{injEnd})
          </div>
          <div
            className={`p-2 border-r border-[#C9DCCF] transition-all truncate ${
              currentPhase === 'SOAK'
                ? 'bg-[#EAF7EF] text-[#006B45] font-semibold ring-1 ring-inset ring-[#00A86B]'
                : 'bg-[#F9FCFA]'
            }`}
            style={{ width: `${soakPct}%` }}
          >
            {currentPhase === 'SOAK' ? 'CURRENT: ' : ''}SOAK (D{injEnd + 1}–{soakEnd})
          </div>
          <div
            className={`p-2 transition-all truncate ${
              currentPhase === 'PRODUCTION'
                ? 'bg-[#EAF7EF] text-[#006B45] font-semibold ring-1 ring-inset ring-[#00A86B]'
                : 'bg-[#FFFFFF]'
            }`}
            style={{ width: `${prodPct}%` }}
          >
            {currentPhase === 'PRODUCTION' ? 'CURRENT: ' : ''}PRODUCTION (D{soakEnd + 1}–{totalDays})
          </div>
        </div>

        {/* Multi-Series Graph using LineChart (Toggleable legend, aria-pressed, dual-axis, tooltip) */}
        <div className="relative w-full bg-[#F4FAF6] rounded-b-lg border-x border-b border-[#C9DCCF] p-space-sm -mt-2">
          {/* Floating Current Pointer Badge */}
          <div
            className="absolute top-1 z-10 -translate-x-1/2 bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#C9DCCF] shadow-xs font-telemetry-dense text-[10px] text-[#10251B] pointer-events-none transition-all duration-150"
            style={{
              left: `${Math.max(12, Math.min(88, (currentDay / totalDays) * 100))}%`
            }}
          >
            <span className="text-[#006B45] font-semibold">T+{dayInPhase}d</span> | T: {telemetry.reservoirTemp || telemetry.heelTemp || 118}°C | P: {telemetry.bottomHolePressure ? (telemetry.bottomHolePressure / 10).toFixed(2) : '6.20'} MPa
          </div>

          <LineChart
            series={series}
            markers={markers}
            xDomain={[0, totalDays]}
            xLabelFormatter={xLabelFormatter}
            yLabelFormatter={yLabelFormatter}
            yRightLabelFormatter={yRightLabelFormatter}
            height={200}
            showLegend={true}
          />
        </div>

        {/* Bottom Axis Legend & Rate Forecast (Derived Metrics from Model) */}
        <div className="flex flex-wrap items-center justify-between pt-space-sm border-t border-[#C9DCCF]/60 font-telemetry-dense text-telemetry-dense text-[#52665C]">
          <div>
            <span>
              Estimated Reservoir Thermal Radius:{' '}
              <strong className="text-[#10251B] font-metric-value ml-1">{thermalRadius}</strong>
            </span>
          </div>
          <div className="flex items-center gap-space-lg">
            <span>
              Expected Peak Production:{' '}
              <strong className="text-[#006B45] font-metric-value ml-1">{expectedPeak}</strong>
            </span>
            <span>
              Predicted SOR:{' '}
              <strong className="text-[#003B25] font-metric-value ml-1">{sor}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CycleDynamicsComponent);
