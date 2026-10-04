import { useState, useMemo, useRef, useCallback } from 'react';

/**
 * Reusable SVG LineChart Component
 *
 * Props:
 * - series: Array<{
 *     id: string,
 *     name: string,
 *     data: Array<{ x: number, y: number }>,
 *     color?: string,
 *     dashed?: boolean | string,
 *     areaFill?: boolean | string,
 *     yAxis?: 'left' | 'right',
 *     strokeWidth?: number
 *   }>
 * - xDomain?: [number, number]
 * - yDomain?: [number, number]
 * - yDomainRight?: [number, number]
 * - markers?: Array<{
 *     x?: number,
 *     y?: number,
 *     label?: string,
 *     color?: string,
 *     type?: 'vertical' | 'horizontal' | 'point'
 *   }>
 * - xLabelFormatter?: (val: number) => string
 * - yLabelFormatter?: (val: number) => string
 * - yRightLabelFormatter?: (val: number) => string
 * - height?: number | string
 * - className?: string
 * - showLegend?: boolean
 */
export default function LineChart({
  series = [],
  xDomain,
  yDomain,
  yDomainRight,
  markers = [],
  xLabelFormatter = (x) => String(x),
  yLabelFormatter = (y) => String(y),
  yRightLabelFormatter = (y) => String(y),
  height = 240,
  className = '',
  showLegend = true
}) {
  const containerRef = useRef(null);
  const [hoverPos, setHoverPos] = useState(null); // { svgX, dataX }
  const [hiddenSeries, setHiddenSeries] = useState({});

  // Active (non-hidden) series
  const activeSeries = useMemo(() => {
    return series.filter(s => !hiddenSeries[s.id || s.name]);
  }, [series, hiddenSeries]);

  // SVG dimensions & margins
  const viewBoxWidth = 800;
  const viewBoxHeight = 240;
  const hasRightAxis = useMemo(() => series.some(s => s.yAxis === 'right'), [series]);
  const margin = {
    top: 20,
    right: hasRightAxis ? 55 : 20,
    bottom: 30,
    left: 55
  };
  const chartWidth = viewBoxWidth - margin.left - margin.right;
  const chartHeight = viewBoxHeight - margin.top - margin.bottom;

  // Compute domains
  const computedXDomain = useMemo(() => {
    if (xDomain) return xDomain;
    let minX = Infinity;
    let maxX = -Infinity;
    series.forEach(s => {
      s.data?.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
      });
    });
    return [minX === Infinity ? 0 : minX, maxX === -Infinity ? 10 : maxX];
  }, [xDomain, series]);

  const computedYDomain = useMemo(() => {
    if (yDomain) return yDomain;
    let minY = Infinity;
    let maxY = -Infinity;
    series
      .filter(s => s.yAxis !== 'right')
      .forEach(s => {
        s.data?.forEach(pt => {
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        });
      });
    if (minY === Infinity) return [0, 100];
    const pad = (maxY - minY) * 0.1 || 10;
    return [Math.max(0, minY - pad), maxY + pad];
  }, [yDomain, series]);

  const computedYDomainRight = useMemo(() => {
    if (yDomainRight) return yDomainRight;
    let minY = Infinity;
    let maxY = -Infinity;
    series
      .filter(s => s.yAxis === 'right')
      .forEach(s => {
        s.data?.forEach(pt => {
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        });
      });
    if (minY === Infinity) return [0, 1000];
    const pad = (maxY - minY) * 0.1 || 100;
    return [Math.max(0, minY - pad), maxY + pad];
  }, [yDomainRight, series]);

  // Coordinate transforms
  const getX = useCallback((val) => {
    const [minX, maxX] = computedXDomain;
    if (maxX === minX) return margin.left;
    return margin.left + ((val - minX) / (maxX - minX)) * chartWidth;
  }, [computedXDomain, margin.left, chartWidth]);

  const getYLeft = useCallback((val) => {
    const [minY, maxY] = computedYDomain;
    if (maxY === minY) return margin.top + chartHeight / 2;
    return margin.top + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
  }, [computedYDomain, margin.top, chartHeight]);

  const getYRight = useCallback((val) => {
    const [minY, maxY] = computedYDomainRight;
    if (maxY === minY) return margin.top + chartHeight / 2;
    return margin.top + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
  }, [computedYDomainRight, margin.top, chartHeight]);

  const getY = useCallback((val, yAxis) => {
    return yAxis === 'right' ? getYRight(val) : getYLeft(val);
  }, [getYRight, getYLeft]);

  // Ticks
  const yTicksLeft = useMemo(() => {
    const [min, max] = computedYDomain;
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(min + (max - min) * (i / count));
    }
    return ticks;
  }, [computedYDomain]);

  const yTicksRight = useMemo(() => {
    if (!hasRightAxis) return [];
    const [min, max] = computedYDomainRight;
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(min + (max - min) * (i / count));
    }
    return ticks;
  }, [hasRightAxis, computedYDomainRight]);

  const xTicks = useMemo(() => {
    const [min, max] = computedXDomain;
    const count = Math.min(6, Math.max(2, max - min));
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(min + (max - min) * (i / count));
    }
    return ticks;
  }, [computedXDomain]);

  // Build SVG Paths
  const paths = useMemo(() => {
    return activeSeries.map(s => {
      if (!s.data || s.data.length === 0) return null;
      const sorted = [...s.data].sort((a, b) => a.x - b.x);

      let d = '';
      sorted.forEach((pt, i) => {
        const x = getX(pt.x);
        const y = getY(pt.y, s.yAxis);
        d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      });

      let areaD = null;
      if (s.areaFill) {
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const bottomY = margin.top + chartHeight;
        areaD = `${d} L ${getX(last.x).toFixed(1)} ${bottomY} L ${getX(first.x).toFixed(1)} ${bottomY} Z`;
      }

      return {
        ...s,
        linePath: d,
        areaPath: areaD
      };
    }).filter(Boolean);
  }, [activeSeries, getX, getY, margin.top, chartHeight]);

  // Mouse hover handler
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * viewBoxWidth;

    // Constrain to chart bounds
    if (svgX < margin.left || svgX > margin.left + chartWidth) {
      setHoverPos(null);
      return;
    }

    const [minX, maxX] = computedXDomain;
    const dataX = minX + ((svgX - margin.left) / chartWidth) * (maxX - minX);

    // Find closest point across active series
    let closestDist = Infinity;
    let closestX = dataX;

    activeSeries.forEach(s => {
      s.data?.forEach(pt => {
        const dist = Math.abs(pt.x - dataX);
        if (dist < closestDist) {
          closestDist = dist;
          closestX = pt.x;
        }
      });
    });

    setHoverPos({
      svgX: getX(closestX),
      dataX: closestX
    });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  const toggleSeries = (id) => {
    setHiddenSeries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const chartSummary = useMemo(() => {
    const names = series.map(s => s.name).join(', ');
    return `Interactive line chart displaying ${names || 'operational telemetry'} trends across simulated timeline`;
  }, [series]);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <span className="sr-only">{chartSummary}</span>
      {/* Series Toggle Legend */}
      {showLegend && series.length > 1 && (
        <div className="flex flex-wrap items-center gap-space-md mb-2 font-telemetry-dense text-telemetry-dense select-none">
          {series.map(s => {
            const isHidden = hiddenSeries[s.id || s.name];
            return (
              <button
                key={s.id || s.name}
                type="button"
                aria-pressed={!isHidden}
                aria-label={`Toggle visibility of ${s.name}`}
                onClick={() => toggleSeries(s.id || s.name)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-opacity ${
                  isHidden ? 'opacity-40 line-through text-[#52665C]' : 'opacity-100 text-[#10251B]'
                }`}
              >
                <span
                  className="w-3 h-1 rounded-full"
                  style={{ backgroundColor: s.color || '#00A86B' }}
                />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden select-none"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={chartSummary}
        >
          <desc>{chartSummary}</desc>
          <defs>
            {series.map(s => {
              if (!s.areaFill) return null;
              const gradId = `chartGrad_${s.id || s.name}`.replace(/[^a-zA-Z0-9]/g, '_');
              return (
                <linearGradient key={gradId} id={gradId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={s.color || '#00A86B'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={s.color || '#00A86B'} stopOpacity="0.02" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid lines: horizontal */}
          {yTicksLeft.map((tick, i) => {
            const y = getYLeft(tick);
            return (
              <line
                key={`yGrid_${i}`}
                x1={margin.left}
                x2={margin.left + chartWidth}
                y1={y}
                y2={y}
                stroke="#E2ECE5"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Grid lines: vertical */}
          {xTicks.map((tick, i) => {
            const x = getX(tick);
            return (
              <line
                key={`xGrid_${i}`}
                x1={x}
                x2={x}
                y1={margin.top}
                y2={margin.top + chartHeight}
                stroke="#E2ECE5"
                strokeDasharray="2 4"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Left Y-Axis labels */}
          {yTicksLeft.map((tick, i) => {
            const y = getYLeft(tick);
            return (
              <text
                key={`yText_${i}`}
                x={margin.left - 8}
                y={y + 3}
                fill="#52665C"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {yLabelFormatter(tick)}
              </text>
            );
          })}

          {/* Right Y-Axis labels */}
          {hasRightAxis && yTicksRight.map((tick, i) => {
            const y = getYRight(tick);
            return (
              <text
                key={`yRightText_${i}`}
                x={margin.left + chartWidth + 8}
                y={y + 3}
                fill="#0284C7"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="start"
              >
                {yRightLabelFormatter(tick)}
              </text>
            );
          })}

          {/* X-Axis labels */}
          {xTicks.map((tick, i) => {
            const x = getX(tick);
            return (
              <text
                key={`xText_${i}`}
                x={x}
                y={margin.top + chartHeight + 16}
                fill="#52665C"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {xLabelFormatter(tick)}
              </text>
            );
          })}

          {/* Render Area Fills */}
          {paths.map(s => {
            if (!s.areaPath) return null;
            const gradId = `chartGrad_${s.id || s.name}`.replace(/[^a-zA-Z0-9]/g, '_');
            return (
              <path
                key={`area_${s.id || s.name}`}
                d={s.areaPath}
                fill={`url(#${gradId})`}
              />
            );
          })}

          {/* Render Lines */}
          {paths.map(s => (
            <path
              key={`line_${s.id || s.name}`}
              d={s.linePath}
              stroke={s.color || '#00A86B'}
              strokeWidth={s.strokeWidth || 2.2}
              strokeDasharray={s.dashed ? (typeof s.dashed === 'string' ? s.dashed : '4 3') : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

          {/* Reference Markers */}
          {markers.map((m, idx) => {
            if (m.type === 'vertical' && m.x !== undefined) {
              const mx = getX(m.x);
              return (
                <g key={`marker_${idx}`}>
                  <line
                    x1={mx}
                    x2={mx}
                    y1={margin.top}
                    y2={margin.top + chartHeight}
                    stroke={m.color || '#00A86B'}
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                  {m.label && (
                    <text
                      x={mx}
                      y={margin.top - 5}
                      fill={m.color || '#00A86B'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                    >
                      {m.label}
                    </text>
                  )}
                </g>
              );
            }
            if (m.x !== undefined && m.y !== undefined) {
              const mx = getX(m.x);
              const my = getY(m.y, m.yAxis);
              return (
                <circle
                  key={`marker_${idx}`}
                  cx={mx}
                  cy={my}
                  r="4"
                  fill="#FFFFFF"
                  stroke={m.color || '#00A86B'}
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}

          {/* Hover Crosshair & Data Dots */}
          {hoverPos && (
            <g>
              <line
                x1={hoverPos.svgX}
                x2={hoverPos.svgX}
                y1={margin.top}
                y2={margin.top + chartHeight}
                stroke="#52665C"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {activeSeries.map(s => {
                const pt = s.data?.find(d => d.x === hoverPos.dataX);
                if (!pt) return null;
                const py = getY(pt.y, s.yAxis);
                return (
                  <circle
                    key={`hoverDot_${s.id || s.name}`}
                    cx={hoverPos.svgX}
                    cy={py}
                    r="4.5"
                    fill={s.color || '#00A86B'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverPos && (
          <div
            className="absolute top-2 pointer-events-none bg-[#002D1A]/95 text-[#FFFFE4] px-2.5 py-1.5 rounded border border-[#00A86B]/40 shadow-lg text-[10px] font-telemetry-dense z-20 transition-all duration-75"
            style={{
              left: Math.min(
                viewBoxWidth - 140,
                Math.max(margin.left, (hoverPos.svgX / viewBoxWidth) * 100)
              ) + '%'
            }}
          >
            <div className="font-semibold text-[#8FA99B] mb-0.5 border-b border-[#00A86B]/30 pb-0.5">
              {xLabelFormatter(hoverPos.dataX)}
            </div>
            {activeSeries.map(s => {
              const pt = s.data?.find(d => d.x === hoverPos.dataX);
              if (!pt) return null;
              return (
                <div key={s.id || s.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: s.color || '#00A86B' }}
                    />
                    <span className="text-[#EAF7EF]">{s.name}:</span>
                  </span>
                  <span className="font-semibold font-metric-value text-white">
                    {s.formatter ? s.formatter(pt.y) : (s.yAxis === 'right' ? yRightLabelFormatter(pt.y) : yLabelFormatter(pt.y))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
