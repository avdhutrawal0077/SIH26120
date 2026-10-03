import { useState, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { wellService } from '../services/wellService';
import {
  WELL_PROFILES,
  stepTelemetry,
  andradeViscosity,
  deriveWellMetrics,
  computeForecast,
  computeRecommendation,
  computeThermalViscosityCurve,
  computeCyclePT,
  stepModelParameters,
  reestimateModel,
  evaluateWellStatus
} from '../lib/twinModel';

const STORAGE_KEYS = {
  WELL_ID: 'oil_twin_well_id',
  FORECAST_RANGE: 'oil_twin_forecast_range',
  SETPOINTS: 'oil_twin_setpoints',
  AUTOCAL: 'oil_twin_autocal'
};

const MAX_HISTORY_POINTS = 300;

/**
 * Generate initial pre-populated history buffer for a well profile
 */
function createInitialHistory(profile, count = 40) {
  const points = [];
  const baseTel = profile.baseTelemetry;
  const now = new Date('2025-05-18T14:32:04Z');
  const stepMs = 3500;

  for (let i = count - 1; i >= 0; i--) {
    const ptDate = new Date(now.getTime() - i * stepMs);
    const timeStr = ptDate.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    // Micro-variations around profile base
    const sinOffset = Math.sin(i / 5);
    const prod = profile.status === 'STANDBY' ? 0 : Math.round(baseTel.production + sinOffset * 2);
    const temp = Math.round(baseTel.reservoirTemp + sinOffset * 0.8);
    const visc = Math.round(andradeViscosity(temp));
    const press = Math.round(baseTel.reservoirPressure + sinOffset * 0.4);

    points.push({
      timestamp: timeStr,
      timestampDate: ptDate,
      production: prod,
      temp: temp,
      viscosity: visc,
      pressure: press,
      fluidLevel: baseTel.wellboreFluidLevel,
      bottomHolePressure: baseTel.bottomHolePressure,
      pumpSpeed: baseTel.pumpSpeed,
      motorLoad: baseTel.motorLoad,
      rodLoad: baseTel.rodLoad,
      whPressure: baseTel.whPressure,
      whTemp: baseTel.whTemp,
      heelTemp: baseTel.heelTemp,
      heelPressure: baseTel.heelPressure,
      scadaSync: baseTel.scadaSync,
      scadaLatency: baseTel.scadaLatency,
      prodChange: baseTel.prodChange
    });
  }

  return points;
}

/**
 * Initial State Factory with LocalStorage restoration
 */
function getInitialState() {
  let savedWellId = 'BW-017';
  let savedForecastRange = '14D';
  let savedSetpoints = null;
  let savedAutocal = true;

  try {
    const w = localStorage.getItem(STORAGE_KEYS.WELL_ID);
    if (w && WELL_PROFILES[w]) savedWellId = w;

    const f = localStorage.getItem(STORAGE_KEYS.FORECAST_RANGE);
    if (f && ['7D', '14D', '30D'].includes(f)) savedForecastRange = f;

    const s = localStorage.getItem(STORAGE_KEYS.SETPOINTS);
    if (s) savedSetpoints = JSON.parse(s);

    const a = localStorage.getItem(STORAGE_KEYS.AUTOCAL);
    if (a !== null) savedAutocal = a === 'true';
  } catch (err) {
    console.warn('Could not read from localStorage:', err);
  }

  const profile = WELL_PROFILES[savedWellId] || WELL_PROFILES['BW-017'];
  const setpoints = savedSetpoints || { ...profile.setpoints };
  const historyPoints = createInitialHistory(profile, 40);
  const latestPt = historyPoints[historyPoints.length - 1];

  const telemetry = {
    ...profile.baseTelemetry,
    timestamp: latestPt.timestamp,
    timestampDate: latestPt.timestampDate,
    production: latestPt.production,
    reservoirTemp: latestPt.temp,
    oilViscosity: latestPt.viscosity.toLocaleString(),
    reservoirPressure: latestPt.pressure
  };

  return {
    wellId: savedWellId,
    mode: 'LIVE', // 'LIVE' | 'PLAYBACK'
    playbackSpeed: 1, // 1, 4, 16
    isPlayingPlayback: false,
    scrubIndex: null, // null when live, number when scrubbing
    isRefreshing: false,
    simTime: latestPt.timestamp,
    simTimeDate: latestPt.timestampDate,
    telemetry,
    cycle: { ...profile.cycle },
    setpoints,
    model: {
      ...profile.model,
      autocalOn: savedAutocal
    },
    history: {
      points: historyPoints
    },
    alerts: [
      {
        id: 1,
        type: 'info',
        code: '[INFO]',
        color: 'text-[rgb(37,99,235)]',
        border: 'border-[rgb(37,99,235)]',
        title: 'EnKF State Vector Updated',
        time: '14:31:42',
        message: 'Cycle #3 soak temperature propagation matched within 0.042 RMSE tolerance.'
      },
      {
        id: 2,
        type: 'warn',
        code: '[WARN]',
        color: 'text-[rgb(245,158,11)]',
        border: 'border-[rgb(245,158,11)]',
        title: 'TC-04 Transient Drift',
        time: '14:28:10',
        message: 'Thermocouple heel quadrant transient spike +1.8°C. Thermal boundary auto-damped.'
      },
      {
        id: 3,
        type: 'routine',
        code: '[DATA]',
        color: 'text-[#003B25]',
        border: 'border-[#003B25]',
        title: 'Modbus Poll Pad-07',
        time: '14:26:01',
        message: '32/32 RTU channels verified. Packet loss 0.00%. Latency nominal at 12ms.'
      },
      {
        id: 4,
        type: 'notice',
        code: '[VALVE]',
        color: 'text-[#003B25]',
        border: 'border-[#003B25]',
        title: 'SOV-21 Interlock Engaged',
        time: '14:15:33',
        message: 'Casing bleed valve placed into automatic soak-backpressure lock state (2.1 MPa).'
      }
    ],
    log: [
      {
        id: 1,
        time: '14:31:42',
        type: 'INFO',
        title: 'EnKF State Vector Updated',
        text: 'Cycle #3 soak temperature propagation matched within 0.042 RMSE tolerance.'
      },
      {
        id: 2,
        time: '14:28:10',
        type: 'WARN',
        title: 'TC-04 Transient Drift',
        text: 'Thermocouple heel quadrant transient spike +1.8°C. Thermal boundary auto-damped.'
      },
      {
        id: 3,
        time: '14:26:01',
        type: 'DATA',
        title: 'Modbus Poll Pad-07',
        text: '32/32 RTU channels verified. Packet loss 0.00%. Latency nominal at 12ms.'
      },
      {
        id: 4,
        time: '14:15:33',
        type: 'VALVE',
        title: 'SOV-21 Interlock Engaged',
        text: 'Casing bleed valve placed into automatic soak-backpressure lock state (2.1 MPa).'
      }
    ],
    forecastRange: savedForecastRange,
    previousSetpoints: null,
    scenarioCounter: 1,
    backendStatus: 'connected',
    toast: null,
    autocalCountdown: 30
  };
}

/**
 * State Reducer
 */
function wellTwinReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.mode !== 'LIVE' && !state.isPlayingPlayback) return state;

      if (state.mode === 'PLAYBACK' && state.isPlayingPlayback) {
        // Step scrub index in playback
        const points = state.history.points;
        const currentIdx = state.scrubIndex !== null ? state.scrubIndex : points.length - 1;
        const nextIdx = Math.min(points.length - 1, currentIdx + state.playbackSpeed);
        const scrubbedPt = points[nextIdx];

        return {
          ...state,
          scrubIndex: nextIdx,
          simTime: scrubbedPt.timestamp,
          simTimeDate: scrubbedPt.timestampDate
        };
      }

      // Step telemetry through physics engine
      const updatedTel = stepTelemetry(state, 3.5);
      const newPt = {
        timestamp: updatedTel.timestamp,
        timestampDate: updatedTel.timestampDate,
        production: updatedTel.production,
        temp: updatedTel.reservoirTemp,
        viscosity: parseInt(String(updatedTel.oilViscosity).replace(/,/g, ''), 10) || 1240,
        pressure: updatedTel.reservoirPressure,
        fluidLevel: updatedTel.wellboreFluidLevel,
        bottomHolePressure: updatedTel.bottomHolePressure,
        pumpSpeed: updatedTel.pumpSpeed,
        motorLoad: updatedTel.motorLoad,
        rodLoad: updatedTel.rodLoad,
        whPressure: updatedTel.whPressure,
        whTemp: updatedTel.whTemp,
        heelTemp: updatedTel.heelTemp,
        heelPressure: updatedTel.heelPressure,
        scadaSync: updatedTel.scadaSync,
        scadaLatency: updatedTel.scadaLatency,
        prodChange: updatedTel.prodChange
      };

      const updatedHistory = [...state.history.points, newPt];
      if (updatedHistory.length > MAX_HISTORY_POINTS) {
        updatedHistory.shift();
      }

      const tickCount = (state.tickCount || 0) + 1;
      let newLog = state.log;
      const timeStr = updatedTel.timestamp.substring(11, 19);

      if (tickCount % 9 === 0) {
        const pollLog = {
          id: Date.now(),
          time: timeStr,
          type: 'DATA',
          title: `Modbus Poll Pad-07 (${state.wellId})`,
          text: `32/32 RTU channels verified. Packet loss 0.00%. Latency nominal at ${updatedTel.scadaLatency}.`
        };
        newLog = [...newLog.slice(-49), pollLog];
      }

      if (tickCount % 23 === 0) {
        const valveLog = {
          id: Date.now() + 1,
          time: timeStr,
          type: 'VALVE',
          title: 'SOV-21 Interlock Verified',
          text: `Casing bleed backpressure lock verified nominal at ${updatedTel.whPressure} MPa.`
        };
        newLog = [...newLog.slice(-49), valveLog];
      }

      return {
        ...state,
        tickCount,
        telemetry: updatedTel,
        model: stepModelParameters(state.model),
        simTime: updatedTel.timestamp,
        simTimeDate: updatedTel.timestampDate,
        history: {
          points: updatedHistory
        },
        log: newLog
      };
    }

    case 'SET_WELL_ID': {
      const newWellId = action.payload;
      const profile = WELL_PROFILES[newWellId] || WELL_PROFILES['BW-017'];
      const historyPoints = createInitialHistory(profile, 40);
      const latestPt = historyPoints[historyPoints.length - 1];

      try {
        localStorage.setItem(STORAGE_KEYS.WELL_ID, newWellId);
        localStorage.setItem(STORAGE_KEYS.SETPOINTS, JSON.stringify(profile.setpoints));
      } catch {
        // ignore
      }

      const telemetry = {
        ...profile.baseTelemetry,
        timestamp: latestPt.timestamp,
        timestampDate: latestPt.timestampDate,
        production: latestPt.production,
        reservoirTemp: latestPt.temp,
        oilViscosity: latestPt.viscosity.toLocaleString(),
        reservoirPressure: latestPt.pressure
      };

      return {
        ...state,
        wellId: newWellId,
        scrubIndex: null,
        isPlayingPlayback: false,
        simTime: latestPt.timestamp,
        simTimeDate: latestPt.timestampDate,
        telemetry,
        cycle: { ...profile.cycle },
        setpoints: { ...profile.setpoints },
        model: {
          ...profile.model,
          autocalOn: state.model.autocalOn
        },
        history: {
          points: historyPoints
        }
      };
    }

    case 'SET_MODE': {
      const newMode = action.payload;
      return {
        ...state,
        mode: newMode,
        isPlayingPlayback: false,
        scrubIndex: newMode === 'PLAYBACK' ? state.history.points.length - 1 : null,
        simTime: newMode === 'LIVE' ? state.telemetry.timestamp : state.simTime
      };
    }

    case 'SCRUB_PLAYBACK': {
      const idx = Math.max(0, Math.min(state.history.points.length - 1, action.payload));
      const pt = state.history.points[idx];
      return {
        ...state,
        scrubIndex: idx,
        simTime: pt ? pt.timestamp : state.simTime,
        simTimeDate: pt ? pt.timestampDate : state.simTimeDate
      };
    }

    case 'SET_PLAYBACK_SPEED': {
      return {
        ...state,
        playbackSpeed: action.payload
      };
    }

    case 'TOGGLE_PLAYBACK_PLAY': {
      return {
        ...state,
        isPlayingPlayback: !state.isPlayingPlayback
      };
    }

    case 'SET_FORECAST_RANGE': {
      try {
        localStorage.setItem(STORAGE_KEYS.FORECAST_RANGE, action.payload);
      } catch {
        // ignore
      }
      return {
        ...state,
        forecastRange: action.payload
      };
    }

    case 'SET_SETPOINTS': {
      const updated = { ...state.setpoints, ...action.payload };
      try {
        localStorage.setItem(STORAGE_KEYS.SETPOINTS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);
      const patchKeys = Object.keys(action.payload).join(', ');
      const logItem = {
        id: Date.now(),
        time: timeStr,
        type: 'VALVE',
        title: 'Operational Setpoint Modified',
        text: `Setpoint parameter [${patchKeys}] adjusted. Target soak: ${updated.soakDurationHrs}h, steam: ${updated.steamRate} m³/d.`
      };
      return {
        ...state,
        setpoints: updated,
        log: [...state.log.slice(-49), logItem]
      };
    }

    case 'SET_AUTOCAL': {
      const nextVal = typeof action.payload === 'boolean' ? action.payload : !state.model.autocalOn;
      try {
        localStorage.setItem(STORAGE_KEYS.AUTOCAL, String(nextVal));
      } catch {
        // ignore
      }
      return {
        ...state,
        model: {
          ...state.model,
          autocalOn: nextVal
        }
      };
    }

    case 'SET_REFRESHING': {
      return {
        ...state,
        isRefreshing: action.payload
      };
    }

    case 'SYNC_BACKEND_STATE': {
      const backend = action.payload;
      if (!backend || !backend.reservoir) return state;

      const updatedTel = {
        ...state.telemetry,
        reservoirTemp: Math.round(backend.reservoir.temperature),
        oilViscosity: Number(backend.reservoir.oilViscosity).toLocaleString(),
        reservoirPressure: Math.round(backend.reservoir.pressure),
        oilSaturation: Math.round(backend.reservoir.oilSaturation * 100),
        pumpSpeed: backend.srp?.pumpSpeed ? String(backend.srp.pumpSpeed) : state.telemetry.pumpSpeed,
        motorLoad: Math.round(backend.srp?.motorLoad || state.telemetry.motorLoad),
        production: Math.round(backend.production?.oilRate || state.telemetry.production)
      };

      return {
        ...state,
        telemetry: updatedTel
      };
    }

    case 'APPEND_LOG': {
      return {
        ...state,
        log: [...state.log.slice(-49), action.payload]
      };
    }

    case 'ACKNOWLEDGE_ALARMS': {
      const updatedLog = state.log.map((entry) => {
        const t = (entry.type || '').toUpperCase();
        if (t === 'WARN' || t === 'CRITICAL' || t === 'ALARM') {
          return { ...entry, acknowledged: true };
        }
        return entry;
      });
      const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);
      const ackLog = {
        id: Date.now(),
        time: timeStr,
        type: 'INFO',
        title: 'All Active Alarms Acknowledged',
        text: 'All active alarms acknowledged by operator in control room.',
        acknowledged: true
      };
      return {
        ...state,
        alerts: [],
        log: [...updatedLog.slice(-49), ackLog]
      };
    }

    case 'ADVANCE_PHASE': {
      const cycle = state.cycle;
      const phases = ['INJECTION', 'SOAK', 'PRODUCTION'];
      const currentIdx = phases.indexOf(cycle.phase);
      let nextPhase;
      let nextCycleNum = cycle.number;
      let nextPhaseDays;

      if (currentIdx === 0) {
        // INJECTION -> SOAK
        nextPhase = 'SOAK';
        nextPhaseDays = Math.max(1, Math.round(parseFloat(state.setpoints?.soakDurationHrs || 168) / 24));
      } else if (currentIdx === 1) {
        // SOAK -> PRODUCTION
        nextPhase = 'PRODUCTION';
        nextPhaseDays = 45;
      } else {
        // PRODUCTION -> INJECTION (advance cycle!)
        nextPhase = 'INJECTION';
        nextCycleNum = cycle.number >= cycle.totalCycles ? 1 : cycle.number + 1;
        nextPhaseDays = Math.max(1, Math.round(parseFloat(state.setpoints?.injectionDays || 2.5)));
      }

      const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);

      // Recompute telemetry to match physical conditions of next phase
      let updatedTel = { ...state.telemetry };
      if (nextPhase === 'INJECTION') {
        updatedTel.production = 0;
        updatedTel.reservoirTemp = Math.min(248, state.telemetry.reservoirTemp + 35);
        updatedTel.oilViscosity = Math.round(andradeViscosity(updatedTel.reservoirTemp)).toLocaleString();
        updatedTel.bottomHolePressure = 8.5;
        updatedTel.whPressure = 7.8;
      } else if (nextPhase === 'SOAK') {
        updatedTel.production = 0;
        updatedTel.reservoirTemp = 245;
        updatedTel.oilViscosity = Math.round(andradeViscosity(245)).toLocaleString();
        updatedTel.bottomHolePressure = 7.9;
        updatedTel.whPressure = 6.2;
      } else {
        // PRODUCTION
        const metrics = deriveWellMetrics(state);
        updatedTel.production = Math.round(metrics.expectedPeakNum * 0.95);
        updatedTel.reservoirTemp = 135;
        updatedTel.oilViscosity = Math.round(andradeViscosity(135)).toLocaleString();
        updatedTel.bottomHolePressure = 6.2;
        updatedTel.whPressure = 4.1;
      }

      const newLogEntry = {
        id: Date.now(),
        time: timeStr,
        type: 'CYCLE',
        title: `CSS Phase Advanced: ${nextPhase}`,
        text: `Cycle #${nextCycleNum} transitioned from ${cycle.phase} to ${nextPhase}. Downhole thermodynamic parameters and SCADA state vector updated.`
      };

      return {
        ...state,
        cycle: {
          ...cycle,
          number: nextCycleNum,
          phase: nextPhase,
          dayInPhase: 1,
          phaseDays: nextPhaseDays,
          productionDay: nextPhase === 'PRODUCTION' ? 1 : cycle.productionDay,
          productionDayTotal: nextPhase === 'PRODUCTION' ? nextPhaseDays : cycle.productionDayTotal
        },
        telemetry: updatedTel,
        log: [...state.log.slice(-49), newLogEntry]
      };
    }

    case 'REESTIMATE_MODEL': {
      const newModel = reestimateModel(state.model);
      const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);
      const logItem = {
        id: Date.now(),
        time: timeStr,
        type: 'INFO',
        title: 'EnKF State Vector Updated',
        text: `Cycle #${state.cycle.number} soak temperature propagation matched within 0.038 RMSE tolerance. State vector converged.`
      };
      return {
        ...state,
        model: newModel,
        scenarioCounter: (state.scenarioCounter || 1) + 1,
        autocalCountdown: 30,
        log: [...state.log.slice(-49), logItem],
        toast: 'EnKF state vector updated'
      };
    }

    case 'APPLY_RECOMMENDATION': {
      const rec = action.payload;
      const prev = { ...state.setpoints };
      const nextSetpoints = {
        ...state.setpoints,
        steamRate: rec.steamRateM3,
        injectionDays: rec.steamDurationDays,
        soakDurationHrs: Math.round(rec.soakDurationDays * 24),
        srpSpm: rec.srpSpeedSpm
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SETPOINTS, JSON.stringify(nextSetpoints));
      } catch {
        // ignore
      }
      const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);
      const logItem = {
        id: Date.now(),
        time: timeStr,
        type: 'VALVE',
        title: 'Prescriptive Setpoints Applied',
        text: `Applied ${rec.scenarioId}: Steam ${rec.steamRateM3} m³/d, Soak ${Math.round(rec.soakDurationDays * 24)}h, SRP ${rec.srpSpeedSpm} SPM. Target production ${rec.expectedProductionBpd} BPD.`
      };
      return {
        ...state,
        previousSetpoints: prev,
        setpoints: nextSetpoints,
        log: [...state.log.slice(-49), logItem],
        toast: 'Prescriptive setpoints applied (simulation)'
      };
    }

    case 'REVERT_SETPOINTS': {
      if (!state.previousSetpoints) return state;
      const restored = { ...state.previousSetpoints };
      try {
        localStorage.setItem(STORAGE_KEYS.SETPOINTS, JSON.stringify(restored));
      } catch {
        // ignore
      }
      const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);
      const logItem = {
        id: Date.now(),
        time: timeStr,
        type: 'VALVE',
        title: 'Setpoints Reverted',
        text: 'Operational setpoints restored to prior baseline state.'
      };
      return {
        ...state,
        setpoints: restored,
        previousSetpoints: null,
        log: [...state.log.slice(-49), logItem],
        toast: 'Setpoints reverted to prior configuration'
      };
    }

    case 'DECREMENT_AUTOCAL': {
      if (!state.model.autocalOn) return state;
      if (state.autocalCountdown <= 1) {
        const newModel = reestimateModel(state.model);
        const timeStr = state.simTime ? state.simTime.substring(11, 19) : new Date().toTimeString().substring(0, 8);
        const logItem = {
          id: Date.now(),
          time: timeStr,
          type: 'INFO',
          title: 'Autocal Re-estimate Complete',
          text: `Automated EnKF covariance assimilation complete for ${state.wellId}. State vector converged.`
        };
        return {
          ...state,
          model: newModel,
          autocalCountdown: 30,
          scenarioCounter: (state.scenarioCounter || 1) + 1,
          log: [...state.log.slice(-49), logItem],
          toast: 'EnKF auto-calibration complete'
        };
      }
      return {
        ...state,
        autocalCountdown: state.autocalCountdown - 1
      };
    }

    case 'SET_TOAST': {
      return {
        ...state,
        toast: action.payload
      };
    }

    case 'SET_BACKEND_STATUS': {
      return {
        ...state,
        backendStatus: action.payload
      };
    }

    default:
      return state;
  }
}

/**
 * useWellTwin Hook
 * Single source of truth for the digital twin dashboard.
 */
export function useWellTwin() {
  const [state, dispatch] = useReducer(wellTwinReducer, undefined, getInitialState);
  const isDocumentVisibleRef = useRef(true);

  // Sync with live Digital Twin state from backend
  const syncWithBackendState = useCallback(async () => {
    try {
      // Probe if backend is reachable
      const checkLive = await fetch('/api/v1/config', { method: 'GET' }).catch(() => null);
      if (checkLive && checkLive.ok) {
        const res = await wellService.getWellState();
        if (res && res.reservoir) {
          dispatch({ type: 'SYNC_BACKEND_STATE', payload: res });
          dispatch({ type: 'SET_BACKEND_STATUS', payload: 'connected' });
          return;
        }
      }
      // If backend unreachable or not running, fall back cleanly to simulation
      dispatch({ type: 'SET_BACKEND_STATUS', payload: 'offline' });
    } catch (e) {
      console.warn('Could not sync with live twin state:', e);
      dispatch({ type: 'SET_BACKEND_STATUS', payload: 'offline' });
    }
  }, []);

  // Listen to visibility change to pause live tick when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initial sync with backend on mount
  useEffect(() => {
    syncWithBackendState();
  }, [syncWithBackendState]);

  // Toast auto-clear
  useEffect(() => {
    if (!state.toast) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_TOAST', payload: null });
    }, 2800);
    return () => clearTimeout(timer);
  }, [state.toast]);

  // Autocal countdown timer (1-second tick when autocal is active)
  useEffect(() => {
    if (!state.model?.autocalOn || state.mode !== 'LIVE') return;
    const timer = setInterval(() => {
      if (isDocumentVisibleRef.current) {
        dispatch({ type: 'DECREMENT_AUTOCAL' });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state.model?.autocalOn, state.mode]);

  // Main simulation tick interval
  useEffect(() => {
    // Only tick when in LIVE mode, or when playing playback
    const shouldTick = (state.mode === 'LIVE' && !state.isRefreshing) ||
      (state.mode === 'PLAYBACK' && state.isPlayingPlayback);

    if (!shouldTick) return;

    const intervalTime = state.mode === 'PLAYBACK'
      ? Math.max(200, Math.round(1500 / state.playbackSpeed))
      : 3500;

    const timer = setInterval(() => {
      if (isDocumentVisibleRef.current) {
        dispatch({ type: 'TICK' });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [state.mode, state.isRefreshing, state.isPlayingPlayback, state.playbackSpeed]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    dispatch({ type: 'SET_REFRESHING', payload: true });

    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8);

    await syncWithBackendState();

    setTimeout(() => {
      dispatch({ type: 'TICK' });
      dispatch({
        type: 'APPEND_LOG',
        payload: {
          id: Date.now(),
          time: timeStr,
          type: 'SYNC',
          title: 'SCADA State Vector Refreshed',
          text: `Telemetry synchronized for ${state.wellId}. Reservoir & downhole parameters updated.`
        }
      });
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }, 500);
  }, [state.isRefreshing, state.wellId, syncWithBackendState]);

  // Actions
  const setWellId = useCallback((id) => dispatch({ type: 'SET_WELL_ID', payload: id }), []);
  const setMode = useCallback((mode) => dispatch({ type: 'SET_MODE', payload: mode }), []);
  const scrubPlayback = useCallback((idx) => dispatch({ type: 'SCRUB_PLAYBACK', payload: idx }), []);
  const setPlaybackSpeed = useCallback((speed) => dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed }), []);
  const togglePlaybackPlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAYBACK_PLAY' }), []);
  const setForecastRange = useCallback((range) => dispatch({ type: 'SET_FORECAST_RANGE', payload: range }), []);
  const setSetpoints = useCallback((patch) => dispatch({ type: 'SET_SETPOINTS', payload: patch }), []);
  const toggleAutocal = useCallback((val) => dispatch({ type: 'SET_AUTOCAL', payload: val }), []);
  const acknowledgeAlarms = useCallback(() => dispatch({ type: 'ACKNOWLEDGE_ALARMS' }), []);
  const advancePhase = useCallback(() => dispatch({ type: 'ADVANCE_PHASE' }), []);
  const reestimateModelAction = useCallback(() => dispatch({ type: 'REESTIMATE_MODEL' }), []);
  const applyRecommendationAction = useCallback((rec) => dispatch({ type: 'APPLY_RECOMMENDATION', payload: rec }), []);
  const revertSetpointsAction = useCallback(() => dispatch({ type: 'REVERT_SETPOINTS' }), []);
  const setToastAction = useCallback((msg) => dispatch({ type: 'SET_TOAST', payload: msg }), []);

  // Active Telemetry to display: in playback mode with a scrubIndex, replay that historical point
  const activeTelemetry = useMemo(() => {
    if (state.mode === 'PLAYBACK' && state.scrubIndex !== null && state.history.points[state.scrubIndex]) {
      const pt = state.history.points[state.scrubIndex];
      return {
        ...state.telemetry,
        timestamp: pt.timestamp,
        timestampDate: pt.timestampDate,
        production: pt.production,
        reservoirTemp: pt.temp,
        oilViscosity: pt.viscosity.toLocaleString(),
        reservoirPressure: pt.pressure,
        wellboreFluidLevel: pt.fluidLevel,
        bottomHolePressure: pt.bottomHolePressure,
        pumpSpeed: pt.pumpSpeed,
        motorLoad: pt.motorLoad,
        rodLoad: pt.rodLoad,
        whPressure: pt.whPressure,
        whTemp: pt.whTemp,
        heelTemp: pt.heelTemp,
        heelPressure: pt.heelPressure,
        scadaSync: 'PAUSED',
        scadaLatency: pt.scadaLatency,
        prodChange: pt.prodChange
      };
    }
    return state.telemetry;
  }, [state.mode, state.scrubIndex, state.history.points, state.telemetry]);

  // Derived metrics
  const derivedMetrics = useMemo(() => {
    return deriveWellMetrics({
      ...state,
      telemetry: activeTelemetry
    });
  }, [state, activeTelemetry]);

  // Forecast data
  const forecastData = useMemo(() => {
    return computeForecast(
      { ...state, telemetry: activeTelemetry },
      state.forecastRange
    );
  }, [state, activeTelemetry]);

  // Thermal & Viscosity Curve data
  const thermalViscData = useMemo(() => {
    return computeThermalViscosityCurve({
      ...state,
      telemetry: activeTelemetry
    });
  }, [state, activeTelemetry]);

  // CSS Cycle P-T Profile data
  const cyclePTData = useMemo(() => {
    return computeCyclePT({
      ...state,
      telemetry: activeTelemetry
    });
  }, [state, activeTelemetry]);

  // Prescriptive recommendation with debounced 500ms recalculation
  const [recommendation, setRecommendation] = useState(() => {
    const init = getInitialState();
    return computeRecommendation(init, 1);
  });
  const [isRecShimmering, setIsRecShimmering] = useState(false);
  const scenarioCounterRef = useRef(1);
  const recDebounceTimerRef = useRef(null);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    setIsRecShimmering(true);
    if (recDebounceTimerRef.current) clearTimeout(recDebounceTimerRef.current);

    recDebounceTimerRef.current = setTimeout(() => {
      scenarioCounterRef.current += 1;
      const nextRec = computeRecommendation(
        { ...state, telemetry: activeTelemetry },
        scenarioCounterRef.current
      );
      setRecommendation(nextRec);
      setIsRecShimmering(false);
    }, 500);

    return () => {
      if (recDebounceTimerRef.current) clearTimeout(recDebounceTimerRef.current);
    };
  }, [
    activeTelemetry.production,
    activeTelemetry.reservoirTemp,
    activeTelemetry.reservoirPressure,
    activeTelemetry.heelPressure,
    activeTelemetry.whPressure,
    state.model,
    state.setpoints,
    state.wellId
  ]);

  // Well Operating Status Rule Engine
  const wellStatus = useMemo(() => {
    return evaluateWellStatus(activeTelemetry, state.model);
  }, [activeTelemetry, state.model]);

  const appendLogAction = useCallback((item) => dispatch({ type: 'APPEND_LOG', payload: item }), []);

  return {
    state,
    telemetry: activeTelemetry,
    derivedMetrics,
    forecastData,
    thermalViscData,
    cyclePTData,
    recommendation,
    isRecShimmering,
    wellStatus,
    toast: state.toast,
    canRevert: Boolean(state.previousSetpoints),
    autocalCountdown: state.autocalCountdown,
    backendStatus: state.backendStatus,
    actions: {
      setWellId,
      setMode,
      scrubPlayback,
      setPlaybackSpeed,
      togglePlaybackPlay,
      setForecastRange,
      setSetpoints,
      toggleAutocal,
      handleRefresh,
      acknowledgeAlarms,
      syncWithBackendState,
      advancePhase,
      reestimateModel: reestimateModelAction,
      applyRecommendation: applyRecommendationAction,
      revertSetpoints: revertSetpointsAction,
      setToast: setToastAction,
      appendLog: appendLogAction
    }
  };
}
