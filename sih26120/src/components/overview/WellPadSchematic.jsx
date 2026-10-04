import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * Sensor definitions anchored to the SVG blueprint.
 * Each sensor has a position in SVG viewBox coords plus metadata and telemetry getter.
 */
const SENSOR_DEFS = [
  {
    id: 'WH-01',
    label: 'WH-01 (Wellhead Casing)',
    layer: 'INJ',
    cx: 180, cy: 18,
    fill: '#001F12', stroke: '#00A86B', r: 5, strokeWidth: 2,
    getValues: (tel) => ({
      primary: `${tel.whPressure || '2.15'} MPa`,
      secondary: `${tel.whTemp || '42.1'}°C`,
      unit: 'MPa / °C',
      threshold: 'Tolerance ±0.20 MPa',
      trend: parseFloat(tel.whPressure) > 2.35 ? '▲ Elevated (+0.21)' : parseFloat(tel.whPressure) < 1.95 ? '▼ Depressed (-0.22)' : '→ Nominal (±0.04)',
      historyKey: 'whPressure'
    })
  },
  {
    id: 'DTS-02',
    label: 'DTS-02 (Casing Mid-Zone)',
    layer: 'INJ',
    cx: 180, cy: 95,
    fill: '#34D399', stroke: 'none', r: 4, strokeWidth: 0,
    getValues: (tel) => {
      const temp = Math.round(parseFloat(tel.heelTemp || 248.6) * 0.68);
      return {
        primary: `${temp}°C`,
        secondary: 'Clearwater FM Boundary',
        unit: '°C',
        threshold: '<300°C Thermal Limit',
        trend: temp > 200 ? '▲ Thermal Bloom (+3.2)' : '→ Stable Diffusion',
        historyKey: 'heelTemp',
        historyScale: 0.68
      };
    }
  },
  {
    id: 'DTS-01',
    label: 'DTS-01 (Heel Quadrant)',
    layer: 'INJ',
    cx: 280, cy: 205,
    fill: '#001F12', stroke: '#00A86B', r: 5.5, strokeWidth: 2,
    getValues: (tel) => ({
      primary: `${tel.heelTemp || '248.6'}°C`,
      secondary: `${tel.heelPressure || '8.42'} MPa`,
      unit: '°C / MPa',
      threshold: 'Containment 8.75 MPa',
      trend: parseFloat(tel.heelPressure) >= 8.35 ? '▲ Upper Bound (+0.12)' : '→ Steady State',
      historyKey: 'heelTemp'
    })
  },
  {
    id: 'DTS-03',
    label: 'DTS-03 (Mid-Lateral)',
    layer: 'INJ',
    cx: 370, cy: 205,
    fill: '#34D399', stroke: 'none', r: 4, strokeWidth: 0,
    getValues: (tel) => {
      const temp = Math.round(parseFloat(tel.heelTemp || 248.6) * 0.95);
      return {
        primary: `${temp}°C`,
        secondary: 'Perforated Slotted Liner',
        unit: '°C',
        threshold: '<260°C Liner Rating',
        trend: `→ Gradient -${Math.round(parseFloat(tel.heelTemp || 248.6) - temp)}°C`,
        historyKey: 'heelTemp',
        historyScale: 0.95
      };
    }
  },
  {
    id: 'PT-TOE',
    label: 'PT-TOE (Lateral Toe)',
    layer: 'INJ',
    cx: 475, cy: 205,
    fill: '#001F12', stroke: '#ffb4ab', r: 5.5, strokeWidth: 2,
    getValues: (tel) => {
      const toeTemp = (parseFloat(tel.heelTemp || 248.6) * 0.92).toFixed(1);
      return {
        primary: `${toeTemp}°C`,
        secondary: 'Payzone Base Interface',
        unit: '°C',
        threshold: 'Nominal Drawdown Range',
        trend: '→ Stable Gradient',
        historyKey: 'heelTemp',
        historyScale: 0.92
      };
    }
  },
  {
    id: 'OBS-TOP',
    label: 'OBS-7B (Upper Clearwater)',
    layer: 'OBS',
    cx: 520, cy: 150,
    fill: '#38BDF8', stroke: 'none', r: 4, strokeWidth: 0,
    getValues: (tel) => {
      const isObs = tel.heelTemp && parseFloat(tel.heelTemp) < 190;
      const t = isObs ? (parseFloat(tel.heelTemp) * 0.85).toFixed(1) : '142.8';
      return {
        primary: `${t}°C`,
        secondary: 'Offset Thermal Boundary',
        unit: '°C',
        threshold: 'Heat Front Watch <160°C',
        trend: '→ Background Attenuation',
        historyKey: 'whTemp'
      };
    }
  },
  {
    id: 'OBS-MID',
    label: 'OBS-7B (Mid Thermal Front)',
    layer: 'OBS',
    cx: 520, cy: 185,
    fill: '#38BDF8', stroke: 'none', r: 4, strokeWidth: 0,
    getValues: (tel) => {
      const isObs = tel.heelTemp && parseFloat(tel.heelTemp) < 190;
      const t = isObs ? (parseFloat(tel.heelTemp) * 0.99).toFixed(1) : '182.4';
      return {
        primary: `${t}°C`,
        secondary: 'Therm Heat Front Perimeter',
        unit: '°C',
        threshold: '<190°C Thermal Break',
        trend: '▲ Approaching Front (+0.6)',
        historyKey: 'reservoirTemp'
      };
    }
  },
  {
    id: 'OBS-LOW',
    label: 'OBS-7B (Lower Payzone)',
    layer: 'OBS',
    cx: 520, cy: 220,
    fill: '#38BDF8', stroke: 'none', r: 4, strokeWidth: 0,
    getValues: (tel) => {
      const isObs = tel.heelTemp && parseFloat(tel.heelTemp) < 190;
      const t = isObs ? (parseFloat(tel.heelTemp) * 0.92).toFixed(1) : '168.1';
      return {
        primary: `${t}°C`,
        secondary: 'Gravity Drainage Monitor',
        unit: '°C',
        threshold: 'Reservoir Bed Limit',
        trend: '→ Steady Diffusion',
        historyKey: 'reservoirTemp'
      };
    }
  }
];

/**
 * WellPadSchematic Component
 * Physical schematic & subsurface sensor map (TVD 0m – 1,250m).
 * Fully data-driven:
 * - Dynamic steam chamber scale tied to thermalRadius
 * - Real-time state-dependent pump label (Soak vs Prod)
 * - Interactive hoverable/clickable sensor nodes with mini sparklines
 * - Layer toggles for INJ WELL 7A, OBS WELL 7B, and CHAMBER
 * - Live HUD callouts and 4 sensor table tiles with computed health and gradients
 */
function WellPadSchematicComponent({
  telemetry = {},
  cycle = {},
  derivedMetrics = {},
  historyPoints = []
}) {
  const [hoveredSensor, setHoveredSensor] = useState(null);
  const [pinnedSensor, setPinnedSensor] = useState(null);
  const [layers, setLayers] = useState({ INJ: true, OBS: true, CHAMBER: true });
  const popoverRef = useRef(null);

  // Unpin on click outside
  useEffect(() => {
    if (!pinnedSensor) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPinnedSensor(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pinnedSensor]);

  const toggleLayer = useCallback((layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  }, []);

  const activeSensorId = pinnedSensor || hoveredSensor;
  const activeSensor = useMemo(() => {
    return activeSensorId ? SENSOR_DEFS.find((s) => s.id === activeSensorId) : null;
  }, [activeSensorId]);

  const activeSensorValues = useMemo(() => {
    return activeSensor ? activeSensor.getValues(telemetry) : null;
  }, [activeSensor, telemetry]);

  // Compute mini trend sparkline for the active sensor
  const sparklineData = useMemo(() => {
    if (!activeSensor || !activeSensorValues || historyPoints.length < 2) return null;
    const key = activeSensorValues.historyKey || 'reservoirTemp';
    const scale = activeSensorValues.historyScale || 1.0;
    const recent = historyPoints.slice(-15);
    const rawValues = recent.map((pt) => {
      const v = parseFloat(pt[key]);
      return isNaN(v) ? 0 : v * scale;
    });

    const min = Math.min(...rawValues);
    const max = Math.max(...rawValues);
    const range = max - min || 1;

    const points = rawValues.map((val, idx) => {
      const x = (idx / (rawValues.length - 1)) * 100;
      const y = 20 - ((val - min) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const delta = rawValues[rawValues.length - 1] - rawValues[0];
    const deltaStr = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;

    return { points, deltaStr };
  }, [activeSensor, activeSensorValues, historyPoints]);

  // Dynamic steam chamber scale factor tied to model thermalRadius (default ~18m)
  const thermalRadiusVal = useMemo(() => {
    const rStr = derivedMetrics?.thermalRadius || '18.4 m';
    const parsed = parseFloat(rStr);
    return isNaN(parsed) ? 18.4 : parsed;
  }, [derivedMetrics]);

  const chamberScale = useMemo(() => {
    // Normal nominal radius is 18.0 m. Clamp between 0.75 and 1.35
    return Math.max(0.75, Math.min(1.35, thermalRadiusVal / 18.0));
  }, [thermalRadiusVal]);

  // Dynamic pump label based on cycle phase
  const cyclePhase = cycle && cycle.phase ? String(cycle.phase).toUpperCase() : '';
  const pumpSpeed = telemetry && telemetry.pumpSpeed ? telemetry.pumpSpeed : '';
  const pumpLabel = (() => {
    if (cyclePhase === 'SOAK') return 'ESP Submerged (Idle Soak)';
    if (cyclePhase === 'INJECTION') return 'Steam Injection Active (SRP Isolated)';
    if (cyclePhase === 'PRODUCTION') {
      const spm = pumpSpeed && pumpSpeed !== 'N/A' && pumpSpeed !== '0.0' ? pumpSpeed : '4.2';
      return `SRP Running @ ${spm} SPM`;
    }
    return 'Pump Idle / Submerged';
  })();

  // Popover placement positioning relative to SVG coordinate frame using percentages
  const popoverStyle = useMemo(() => {
    if (!activeSensor) return { display: 'none' };
    const pctX = (activeSensor.cx / 760) * 100;
    const pctY = (activeSensor.cy / 290) * 100;

    const left = pctX > 60 ? `${pctX - 30}%` : `${pctX + 3}%`;
    const top = pctY > 60 ? `${pctY - 25}%` : `${pctY + 4}%`;

    return {
      position: 'absolute',
      left,
      top,
      zIndex: 30,
      pointerEvents: pinnedSensor ? 'auto' : 'none'
    };
  }, [activeSensor, pinnedSensor]);

  const whPress = telemetry.whPressure || '2.15';
  const whTemp = telemetry.whTemp || '42.1';
  const heelTemp = telemetry.heelTemp || '248.6';
  const heelPress = telemetry.heelPressure || '8.42';
  const toeTemp = (parseFloat(heelTemp) * 0.92).toFixed(1);

  // Health and gradient classifications
  const whDev = Math.abs(parseFloat(whPress) - 2.15);
  const whHealth = whDev > 0.35 ? 'CRITICAL' : whDev > 0.18 ? 'WATCH' : 'HEALTHY';
  const whHealthColor = whHealth === 'CRITICAL' ? 'text-[#DC2626]' : whHealth === 'WATCH' ? 'text-[rgb(245,158,11)]' : 'text-[#006B45]';

  const heelTempNum = parseFloat(heelTemp);
  const heelHealth = heelTempNum > 260 ? 'HOT ZONE' : 'STABLE';
  const toeGradient = Math.round(heelTempNum - parseFloat(toeTemp));

  return (
    <div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm select-none">
      {/* Module Header */}
      <div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[#00A86B] text-base">account_tree</span>
          <span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs font-semibold">
            WELL PAD PHYSICAL SCHEMATIC &amp; SENSOR MAP
          </span>
          <span className="font-telemetry-dense text-telemetry-dense text-[#52665C] ml-1">
            TVD 0m – 1,250m
          </span>
        </div>

        {/* Layer Toggles Strip */}
        <div className="flex items-center gap-space-lg font-telemetry-dense text-telemetry-dense">
          <button
            type="button"
            onClick={() => toggleLayer('INJ')}
            className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
              layers.INJ ? 'opacity-100 font-medium' : 'opacity-40'
            }`}
            aria-label="Toggle injection well 7A layer"
            aria-pressed={layers.INJ}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-[#00A86B]"></span>
            <span className="text-[#52665C]">INJ WELL 7A</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('OBS')}
            className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
              layers.OBS ? 'opacity-100 font-medium' : 'opacity-40'
            }`}
            aria-label="Toggle observation well 7B layer"
            aria-pressed={layers.OBS}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-[#38BDF8]"></span>
            <span className="text-[#52665C]">OBS WELL 7B</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('CHAMBER')}
            className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
              layers.CHAMBER ? 'opacity-100 font-medium' : 'opacity-40'
            }`}
            aria-label="Toggle steam chamber layer"
            aria-pressed={layers.CHAMBER}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-[#003B25]"></span>
            <span className="text-[#52665C]">CHAMBER</span>
          </button>
        </div>
      </div>

      {/* Schematic Canvas */}
      <div className="p-space-lg flex flex-col gap-space-md">
        <div className="relative w-full h-80 bg-[#001F12] rounded-lg border border-[#002D1A] p-space-md overflow-hidden font-telemetry-dense">
          {/* Grid Lines Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundSize: '32px 32px',
              backgroundImage:
                'linear-gradient(to right, #6FA389 1px, transparent 1px), linear-gradient(to bottom, #6FA389 1px, transparent 1px)'
            }}
          ></div>

          {/* TVD Axis Markers (Left Rail) */}
          <div className="absolute left-2 top-3 bottom-3 flex flex-col justify-between text-[#A3D9BE] text-[10px] pointer-events-none z-10 border-r border-[#C9DCCF]/20 pr-2">
            <span>0 m (Surface)</span>
            <span>250 m (Caprock)</span>
            <span>550 m (Upper Sand)</span>
            <span>900 m (Clearwater)</span>
            <span>1,250 m (Payzone Base)</span>
          </div>

          {/* Blueprint SVG Architecture Overlay */}
          <svg
            className="w-full h-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 760 290"
            role="img"
            aria-label="Subsurface geological cross section and wellbore trajectory schematic with active downhole sensors"
          >
            {/* Geological Stratigraphy Bands */}
            <rect fill="#002D1A" height="2" opacity="0.8" width="650" x="100" y="55"></rect>
            <text fill="#FFFFE4" fontFamily="JetBrains Mono" fontSize="9" x="690" y="50">
              OVERBURDEN
            </text>
            <rect fill="#002D1A" height="2" opacity="0.8" width="650" x="100" y="125"></rect>
            <text fill="#FFFFE4" fontFamily="JetBrains Mono" fontSize="9" x="690" y="120">
              CLEARWATER FM
            </text>

            {/* Steam Chamber Plume Envelope (Scales with thermalRadius) */}
            {layers.CHAMBER && (
              <g
                className="transition-transform duration-500 ease-out"
                transform={`translate(300, 185) scale(${chamberScale}) translate(-300, -185)`}
              >
                <path
                  d="M 230 195 C 190 170, 190 140, 270 135 C 360 130, 420 150, 430 180 C 440 215, 360 240, 260 230 Z"
                  fill="#00A86B"
                  fillOpacity="0.15"
                  stroke="#00A86B"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                ></path>
                <path
                  d="M 250 195 C 220 180, 230 155, 280 150 C 330 145, 370 160, 375 185 C 380 205, 330 220, 270 215 Z"
                  fill="#00A86B"
                  fillOpacity="0.25"
                  stroke="#00A86B"
                  strokeWidth="1.2"
                ></path>
                <text fill="#FFFFE4" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" x="250" y="185">
                  STEAM CHEST: {heelTemp}°C (R_th {thermalRadiusVal.toFixed(1)}m)
                </text>
              </g>
            )}

            {/* Wellbore 7A: Main Injector / Producer Profile */}
            {layers.INJ && (
              <g className="transition-opacity duration-300">
                <path
                  d="M 180 10 L 180 80 L 180 140 C 180 190, 210 205, 290 205 L 480 205"
                  stroke="#00A86B"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                ></path>
                <path
                  d="M 184 10 L 184 80 L 184 140 C 184 187, 212 201, 290 201 L 480 201"
                  stroke="#001F12"
                  strokeWidth="1"
                ></path>
                {/* Perforated Intervals / Slotted Liner Zone */}
                <line stroke="#FFFFE4" strokeDasharray="2 3" strokeWidth="3" x1="310" x2="470" y1="205" y2="205"></line>
              </g>
            )}

            {/* Wellbore 7B: Thermal Observation Offset Well */}
            {layers.OBS && (
              <g className="transition-opacity duration-300">
                <path d="M 520 10 L 520 225" stroke="#38BDF8" strokeDasharray="4 2" strokeWidth="1.8"></path>
              </g>
            )}

            {/* Sensor Nodes & Click Interactivity */}
            {SENSOR_DEFS.map((sensor) => {
              const layerKey = sensor.layer === 'INJ' ? 'INJ' : 'OBS';
              if (!layers[layerKey]) return null;

              const isActive = activeSensorId === sensor.id;

              return (
                <g key={sensor.id} className="cursor-pointer">
                  {/* Outer active pulse ring */}
                  {isActive && (
                    <circle
                      cx={sensor.cx}
                      cy={sensor.cy}
                      r={sensor.r + 5}
                      fill="none"
                      stroke={sensor.stroke !== 'none' ? sensor.stroke : sensor.fill}
                      strokeWidth="1.2"
                      opacity="0.8"
                    >
                      <animate attributeName="r" from={sensor.r + 2} to={sensor.r + 9} dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Invisible enlarged hit target for effortless clicking */}
                  <circle
                    cx={sensor.cx}
                    cy={sensor.cy}
                    r={12}
                    fill="transparent"
                    onMouseEnter={() => !pinnedSensor && setHoveredSensor(sensor.id)}
                    onMouseLeave={() => !pinnedSensor && setHoveredSensor(null)}
                    onClick={() => setPinnedSensor((prev) => (prev === sensor.id ? null : sensor.id))}
                  />
                  {/* Visible sensor node */}
                  <circle
                    cx={sensor.cx}
                    cy={sensor.cy}
                    fill={sensor.fill}
                    r={isActive ? sensor.r + 1.5 : sensor.r}
                    stroke={sensor.stroke !== 'none' ? sensor.stroke : undefined}
                    strokeWidth={sensor.strokeWidth || undefined}
                    className="transition-all duration-150 pointer-events-none"
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Sensor Popover */}
          {activeSensor && activeSensorValues && (
            <div
              ref={popoverRef}
              style={popoverStyle}
              className="bg-[#002D1A]/95 backdrop-blur-md px-3 py-2.5 rounded-lg border border-[#00A86B]/60 shadow-xl min-w-[210px] transition-all duration-150"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        activeSensor.fill === '#001F12' ? activeSensor.stroke || '#00A86B' : activeSensor.fill
                    }}
                  ></span>
                  <span className="text-[#FFFFE4] font-semibold text-[11px]">
                    {activeSensor.label}
                  </span>
                </div>
                {pinnedSensor && (
                  <button
                    onClick={() => setPinnedSensor(null)}
                    className="text-[#A3D9BE] hover:text-[#FFFFE4] text-[10px] cursor-pointer"
                    aria-label="Close sensor popup"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#A3D9BE]">Value</span>
                  <span className="text-[#FFFFE4] font-semibold">{activeSensorValues.primary}</span>
                </div>
                {activeSensorValues.secondary && (
                  <div className="flex justify-between">
                    <span className="text-[#A3D9BE]">Location</span>
                    <span className="text-[#C9DCCF]">{activeSensorValues.secondary}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#A3D9BE]">Threshold</span>
                  <span className="text-[#C9DCCF]">{activeSensorValues.threshold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3D9BE]">Trend</span>
                  <span
                    className={`font-medium ${
                      activeSensorValues.trend.startsWith('▲')
                        ? 'text-[rgb(245,158,11)]'
                        : activeSensorValues.trend.startsWith('▼')
                        ? 'text-[#38BDF8]'
                        : 'text-[#34D399]'
                    }`}
                  >
                    {activeSensorValues.trend}
                  </span>
                </div>
              </div>

              {/* Sparkline mini-trend chart */}
              {sparklineData && (
                <div className="mt-2 pt-1.5 border-t border-[#00A86B]/30 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[9px] text-[#A3D9BE]">
                    <span>History (15 ticks)</span>
                    <span className="font-semibold text-[#FFFFE4]">{sparklineData.deltaStr}</span>
                  </div>
                  <svg className="w-full h-5 mt-0.5" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparklineData.points}
                    />
                  </svg>
                </div>
              )}

              {pinnedSensor && (
                <div className="mt-1.5 pt-1 border-t border-[#00A86B]/30 text-[9px] text-[#A3D9BE] text-center">
                  Pinned · Click sensor or outside to unpin
                </div>
              )}
            </div>
          )}

          {/* Static HUD Callouts (visible when no popover is pinned) */}
          {!pinnedSensor && (
            <>
              <div className="absolute left-48 top-4 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                <span className="text-[#FFFFE4] font-telemetry-dense">
                  WH-01: {whPress} MPa / {whTemp}°C
                </span>
              </div>
              <div className="absolute left-72 top-36 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                <span className="text-[#FFFFE4] font-telemetry-dense">
                  HEEL (DTS-01): {heelTemp}°C // {heelPress} MPa
                </span>
              </div>
              <div className="absolute right-36 bottom-14 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                <span className="text-[#FFFFE4] font-telemetry-dense">
                  OBS-7B (Mid): 182.4°C (Therm Heat Front)
                </span>
              </div>
              <div className="absolute right-6 top-16 bg-[#002D1A]/95 px-space-sm py-1 rounded-lg border border-[#00A86B]/40 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                <span className="text-[#FFFFE4] font-telemetry-dense">
                  PUMP: {pumpLabel}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Sensor Pinout Table Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm text-telemetry-dense font-telemetry-dense">
          <div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
            <span className="text-[#52665C] font-label-caps">PT-101 (CASING)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[#003B25] font-semibold">{whPress} MPa</span>
              <span className={`text-[10px] font-medium ${whHealthColor}`}>{whHealth}</span>
            </div>
          </div>
          <div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
            <span className="text-[#52665C] font-label-caps">TC-04 (HEEL MID)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[#003B25] font-semibold">{heelTemp} °C</span>
              <span className="text-[#006B45] text-[10px] font-medium">{heelHealth}</span>
            </div>
          </div>
          <div className="bg-[#EAF7EF] p-space-sm rounded-lg border border-[#C9DCCF] flex flex-col">
            <span className="text-[#52665C] font-label-caps">TC-08 (LATERAL TOE)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[#003B25] font-semibold">{toeTemp} °C</span>
              <span className="text-[#006B45] text-[10px] font-medium">GRADIENT -{toeGradient}°C</span>
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
  );
}

export default React.memo(WellPadSchematicComponent);
