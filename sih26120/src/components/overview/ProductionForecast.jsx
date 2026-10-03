import React, { useState, useMemo, useRef } from 'react';

/**
 * ProductionForecast Component
 * Predictive twin production forecast with selectable ranges (7D/14D/30D),
 * peak/cumulative projections, data-driven SVG multi-curve canvas,
 * dynamic Y-axis ticks, real peak positioning, today marker, and hover crosshair tooltip.
 */
function ProductionForecastComponent({
  telemetry,
  forecastRange = '14D',
  forecastData,
  derivedMetrics,
  actions
}) {
  const containerRef = useRef(null);
  const [hoverPos, setHoverPos] = useState(null);

  const numDays = forecastData?.numDays || 14;
  const peakDay = forecastData?.peakDay || 7;
  const peakBpd = forecastData?.peakBpd || derivedMetrics?.expectedPeakNum || 101;
  const cumulative = forecastData?.expectedCumulative || derivedMetrics?.expectedCumulative || '1,286';
  const baseline = useMemo(() => forecastData?.baseline || [], [forecastData?.baseline]);
  const simulated = useMemo(() => forecastData?.simulated || [], [forecastData?.simulated]);
  const yTicks = forecastData?.yTicks || [60, 80, 100, 120];
  const [yMin, yMax] = forecastData?.yDomain || [40, 120];
  const xLabels = forecastData?.xLabels || [1, 3, 5, 7, 9, 11, 14];
  const todayDay = forecastData?.todayDay || 1;

  const viewBoxWidth = 900;
  const viewBoxHeight = 180;
  const topPad = 15;
  const bottomPad = 165;

  // Coordinate transforms
  const getX = useMemo(() => {
    return (day) => {
      if (numDays <= 1) return 0;
      return ((day - 1) / (numDays - 1)) * viewBoxWidth;
    };
  }, [numDays]);

  const getY = useMemo(() => {
    return (val) => {
      if (yMax === yMin) return viewBoxHeight / 2;
      return bottomPad - ((val - yMin) / (yMax - yMin)) * (bottomPad - topPad);
    };
  }, [yMin, yMax]);

  // Build SVG Paths
  const { baselinePath, simulatedPath, simulatedAreaPath } = useMemo(() => {
    if (baseline.length === 0 || simulated.length === 0) {
      return { baselinePath: '', simulatedPath: '', simulatedAreaPath: '' };
    }

    let bPath = '';
    baseline.forEach((pt, i) => {
      const x = getX(pt.day);
      const y = getY(pt.value);
      bPath += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    let sPath = '';
    simulated.forEach((pt, i) => {
      const x = getX(pt.day);
      const y = getY(pt.value);
      sPath += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    const firstX = getX(simulated[0].day);
    const lastX = getX(simulated[simulated.length - 1].day);
    const areaPath = `${sPath} L ${lastX.toFixed(1)} 180 L ${firstX.toFixed(1)} 180 Z`;

    return {
      baselinePath: bPath,
      simulatedPath: sPath,
      simulatedAreaPath: areaPath
    };
  }, [baseline, simulated, getX, getY]);

  const peakX = getX(peakDay);
  const peakY = getY(peakBpd);
  const todayX = getX(todayDay);

  // Mouse hover handler
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const day = Math.max(1, Math.min(numDays, Math.round(1 + ratio * (numDays - 1))));

    const basePt = baseline.find((p) => p.day === day) || baseline[0];
    const simPt = simulated.find((p) => p.day === day) || simulated[0];
    const baseVal = basePt ? basePt.value : 0;
    const simVal = simPt ? simPt.value : 0;
    const delta = simVal - baseVal;

    setHoverPos({
      svgX: getX(day),
      day,
      baseVal,
      simVal,
      delta
    });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <span className="w-1.5 h-4 bg-[#006B45] rounded-full"></span>
            <h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">
              Production Forecast
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">
              PREDICTIVE TWIN
            </span>
          </div>
          <p className="font-body-md text-body-md text-[#52665C] mt-1 font-normal">
            Baseline vs simulated production
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="flex items-center gap-space-md font-telemetry-dense text-telemetry-dense">
            <span className="flex items-center gap-1.5 text-[#52665C]">
              <span className="w-3 h-0.5 rounded-full bg-[#8FA99B]"></span>Baseline Production
            </span>
            <span className="flex items-center gap-1.5 text-[#006B45]">
              <span className="w-3 h-0.5 rounded-full bg-[#00A86B]"></span>Simulated / Optimized
            </span>
          </div>
          <div className="flex items-center bg-[#FFFFFF] p-1 rounded-lg border border-[#C9DCCF] gap-1 font-label-caps text-label-caps">
            {['7D', '14D', '30D'].map((range) => (
              <button
                key={range}
                onClick={() => actions.setForecastRange(range)}
                className={`px-space-md py-1 rounded-md transition-all cursor-pointer ${
                  forecastRange === range
                    ? 'bg-[#006B45] border border-[#006B45] text-white font-semibold'
                    : 'text-[#52665C] hover:text-[#10251B]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md mb-space-lg">
        <div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col">
          <span className="text-[#52665C] font-label-caps text-label-caps uppercase">
            CURRENT PRODUCTION
          </span>
          <div className="flex items-baseline gap-space-xs mt-1">
            <span className="font-metric-display text-2xl text-[#10251B] font-bold">
              {telemetry.production}
            </span>
            <span className="font-telemetry-data text-telemetry-data text-[#52665C]">BPD</span>
          </div>
        </div>
        <div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[#52665C] font-label-caps text-label-caps uppercase">
              FORECAST PEAK
            </span>
            <span className="text-[#006B45] font-telemetry-dense text-[10px] font-semibold">
              DAY {peakDay}
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs mt-1">
            <span className="font-metric-display text-2xl text-[#003B25] font-bold">
              {peakBpd}
            </span>
            <span className="font-telemetry-data text-telemetry-data text-[#52665C]">BPD</span>
          </div>
        </div>
        <div className="bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col">
          <span className="text-[#52665C] font-label-caps text-label-caps uppercase">
            EXPECTED CUMULATIVE
          </span>
          <div className="flex items-baseline gap-space-xs mt-1">
            <span className="font-metric-display text-2xl text-[#006B45] font-bold">
              {cumulative}
            </span>
            <span className="font-telemetry-data text-telemetry-data text-[#52665C]">bbl</span>
          </div>
        </div>
      </div>

      {/* SVG Forecast Graph Area */}
      <div className="relative w-full h-64 bg-[#F8FCF9] rounded-lg border border-[#C9DCCF] p-space-md overflow-hidden font-telemetry-dense">
        {/* Left Y-Axis Markings (Data-driven min to max) */}
        <div className="absolute left-3 top-3 bottom-8 flex flex-col justify-between text-[#52665C] text-[10px] pointer-events-none z-10 pr-2 border-r border-[#C9DCCF]/60 font-metric-value">
          {yTicks
            .slice()
            .reverse()
            .map((tick, idx) => (
              <span key={`ytick_${idx}`}>{tick} BPD</span>
            ))}
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="ml-14 h-[calc(100%-2rem)] relative cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <span className="sr-only">
            {`Production forecast chart: projected peak of ${peakBpd} BPD at day ${peakDay}, baseline vs simulated curves over ${forecastRange} horizon`}
          </span>
          <svg
            className="w-full h-full overflow-visible"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 900 180"
            role="img"
            aria-label={`Production forecast chart: simulated peak of ${peakBpd} BPD at day ${peakDay}, baseline vs simulated curves over ${forecastRange} horizon`}
          >
            <desc>
              {`Production forecast chart showing baseline and simulated oil rates across a ${forecastRange} projection with expected peak at ${peakBpd} BPD.`}
            </desc>
            <defs>
              <linearGradient id="simulatedGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00A86B" stopOpacity="0.22"></stop>
                <stop offset="100%" stopColor="#EAF7EF" stopOpacity="0.02"></stop>
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines from data ticks */}
            {yTicks.map((tick, i) => {
              const y = getY(tick);
              return (
                <line
                  key={`hgrid_${i}`}
                  stroke="#E2ECE5"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  x1="0"
                  x2="900"
                  y1={y}
                  y2={y}
                />
              );
            })}

            {/* Vertical Grid Lines from xLabels */}
            {xLabels.map((day, i) => {
              const x = getX(day);
              return (
                <line
                  key={`vgrid_${i}`}
                  stroke="#E2ECE5"
                  strokeDasharray="2 4"
                  strokeWidth="0.8"
                  x1={x}
                  x2={x}
                  y1="0"
                  y2="180"
                />
              );
            })}

            {/* Baseline Curve */}
            {baselinePath && (
              <path
                d={baselinePath}
                stroke="#8FA99B"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            )}

            {/* Simulated Curve & Area */}
            {simulatedAreaPath && (
              <path
                d={simulatedAreaPath}
                fill="url(#simulatedGrad)"
              />
            )}
            {simulatedPath && (
              <path
                d={simulatedPath}
                stroke="#00A86B"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            )}

            {/* Today Marker */}
            {todayDay <= numDays && (
              <g>
                <line
                  x1={todayX}
                  x2={todayX}
                  y1="10"
                  y2="180"
                  stroke="#0284C7"
                  strokeDasharray="3 2"
                  strokeWidth="1.2"
                />
                <circle cx={todayX} cy={getY(baseline.find(p => p.day === todayDay)?.value || telemetry.production)} fill="#0284C7" r="3.5" />
              </g>
            )}

            {/* Peak Marker */}
            <line
              stroke="#00A86B"
              strokeDasharray="2 2"
              strokeWidth="1"
              x1={peakX}
              x2={peakX}
              y1="10"
              y2="180"
            />
            <circle cx="0" cy={getY(baseline[0]?.value || telemetry.production)} fill="#00A86B" r="4" />
            <circle
              cx={peakX}
              cy={peakY}
              fill="#FFFFFF"
              r="5"
              stroke="#00A86B"
              strokeWidth="2.5"
            />

            {/* Hover Crosshair & Data Dots */}
            {hoverPos && (
              <g>
                <line
                  x1={hoverPos.svgX}
                  x2={hoverPos.svgX}
                  y1="0"
                  y2="180"
                  stroke="#52665C"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                <circle
                  cx={hoverPos.svgX}
                  cy={getY(hoverPos.baseVal)}
                  r="4"
                  fill="#8FA99B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={hoverPos.svgX}
                  cy={getY(hoverPos.simVal)}
                  r="5"
                  fill="#00A86B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Peak Callout Badge (Positioned dynamically from real peak) */}
          <div
            className="absolute -top-1 -translate-x-1/2 bg-[#003B25] px-2 py-0.5 rounded border border-[#C9DCCF] text-[#FFFFE4] font-telemetry-dense text-[11px] shadow flex items-center gap-1 pointer-events-none transition-all duration-150"
            style={{ left: `${Math.max(8, Math.min(92, (peakX / viewBoxWidth) * 100))}%` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
            Peak: {peakBpd} BPD
          </div>

          {/* Today Badge */}
          {todayDay <= numDays && (
            <div
              className="absolute bottom-1 -translate-x-1/2 bg-[#0284C7]/90 text-white px-1.5 py-0.2 rounded text-[9px] font-telemetry-dense shadow pointer-events-none"
              style={{ left: `${Math.max(6, Math.min(94, (todayX / viewBoxWidth) * 100))}%` }}
            >
              Today (D{todayDay})
            </div>
          )}

          {/* Hover Tooltip Overlay */}
          {hoverPos && (
            <div
              className="absolute top-2 pointer-events-none bg-[#002D1A]/95 text-[#FFFFE4] px-2.5 py-1.5 rounded border border-[#00A86B]/50 shadow-lg text-[11px] font-telemetry-dense z-20 transition-all duration-75"
              style={{
                left: `${Math.max(5, Math.min(75, (hoverPos.svgX / viewBoxWidth) * 100))}%`
              }}
            >
              <div className="font-semibold text-[#8FA99B] border-b border-[#00A86B]/30 pb-0.5 mb-1 flex items-center justify-between gap-4">
                <span>Day {hoverPos.day}</span>
                <span className={hoverPos.delta >= 0 ? 'text-[#00A86B] font-bold' : 'text-[#EF4444] font-bold'}>
                  Δ {hoverPos.delta >= 0 ? `+${hoverPos.delta}` : hoverPos.delta} BPD
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[#EAF7EF]">
                <span className="text-[#8FA99B]">Baseline:</span>
                <span className="font-metric-value font-semibold">{hoverPos.baseVal} BPD</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[#00A86B]">
                <span className="text-[#8FA99B]">Simulated:</span>
                <span className="font-metric-value font-bold text-white">{hoverPos.simVal} BPD</span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis labels (Data-driven) */}
        <div className="ml-14 mt-2 flex justify-between text-[#52665C] text-[10px] font-telemetry-dense">
          {xLabels.map((day) => (
            <span
              key={`xlabel_${day}`}
              className={day === peakDay ? 'text-[#006B45] font-semibold' : ''}
            >
              Day {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductionForecastComponent);
