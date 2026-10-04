import { initialWellConfig } from '../data/wells';

const API_BASE = '/api/v1';

class WellService {
  constructor() {
    this.currentConfig = { ...initialWellConfig };
    this.isTwinInitialized = false;
  }

  /**
   * Internal HTTP request helper that contacts the FastAPI backend
   * and falls back to deterministic client-side simulation if offline.
   */
  async _fetchApi(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      console.warn(`[WellService] API call ${endpoint} unavailable, using client-side fallback:`, err.message);
      return null;
    }
  }

  // --- 1. Well Configuration ---

  async getConfig() {
    const res = await this._fetchApi('/config');
    if (res) {
      this.currentConfig = res;
      return res;
    }
    // Fallback
    return { ...this.currentConfig };
  }

  async saveConfig(newConfig) {
    const res = await this._fetchApi('/config', {
      method: 'PUT',
      body: JSON.stringify(newConfig)
    });
    if (res) {
      this.currentConfig = res.data || newConfig;
      return res;
    }
    // Fallback
    this.currentConfig = { ...newConfig };
    return { success: true, data: this.currentConfig };
  }

  async resetConfig() {
    const res = await this._fetchApi('/config/reset', {
      method: 'POST'
    });
    if (res) {
      this.currentConfig = res.data || { ...initialWellConfig };
      this.isTwinInitialized = false;
      return res;
    }
    // Fallback
    this.currentConfig = { ...initialWellConfig };
    this.isTwinInitialized = false;
    return { success: true, data: { ...this.currentConfig } };
  }

  // --- 2. Digital Twin ---

  async initializeDigitalTwin() {
    const res = await this._fetchApi('/digital-twin/initialize', {
      method: 'POST'
    });
    if (res) {
      this.isTwinInitialized = true;
      return res;
    }
    // Fallback
    this.isTwinInitialized = true;
    return { success: true, message: 'Digital Twin initialized successfully.' };
  }

  async getWellState() {
    const res = await this._fetchApi('/digital-twin/state');
    if (res) {
      return res;
    }
    // Fallback
    return {
      reservoir: {
        temperature: 86.7,
        pressure: 40.2,
        oilSaturation: 0.72,
        oilViscosity: 2340
      },
      css: {
        currentPhase: 'Production',
        cycleNumber: this.currentConfig.css.cycleNumber || 3,
        steamRate: 0,
        steamTemperature: this.currentConfig.css.steamTemperature || 280
      },
      srp: {
        pumpSpeed: this.currentConfig.srp.pumpSpeed || 10,
        strokeLength: this.currentConfig.srp.strokeLength || 120,
        motorLoad: 68
      },
      production: {
        oilRate: 28.4,
        waterRate: 65.2,
        totalLiquid: 93.6
      },
      history: [
        { day: 1, temp: 40, viscosity: 9000, production: 5 },
        { day: 5, temp: 150, viscosity: 500, production: 0 },
        { day: 10, temp: 120, viscosity: 1200, production: 45 },
        { day: 15, temp: 100, viscosity: 1800, production: 35 },
        { day: 20, temp: 86.7, viscosity: 2340, production: 28.4 },
      ]
    };
  }

  // --- 3. Operations Data ---

  async getCssData() {
    const res = await this._fetchApi('/css/data');
    if (res) {
      return res;
    }
    // Fallback
    return {
      currentCycle: this.currentConfig.css.cycleNumber || 3,
      currentPhase: 'Production',
      cycleProgress: 65,
      parameters: {
        steamTemperature: this.currentConfig.css.steamTemperature || 280,
        steamPressure: this.currentConfig.css.steamPressure || 75,
        steamRate: this.currentConfig.css.steamRate || 45,
        steamVolume: this.currentConfig.css.steamVolume || 450,
        injectionDuration: this.currentConfig.css.injectionDuration || 2.5,
        soakDuration: this.currentConfig.css.soakDuration || 1.5,
      },
      historicalCycles: [
        { cycle: 1, duration: 120, steamInjected: 350, avgProduction: 18.5, maxTemp: 78.0 },
        { cycle: 2, duration: 145, steamInjected: 410, avgProduction: 22.1, maxTemp: 82.5 },
      ],
      chartData: [
        { day: 1, steam: 45, temp: 40, production: 0 },
        { day: 2, steam: 45, temp: 110, production: 0 },
        { day: 3, steam: 22.5, temp: 150, production: 0 },
        { day: 4, steam: 0, temp: 140, production: 0 },
        { day: 5, steam: 0, temp: 135, production: 45 },
        { day: 10, steam: 0, temp: 115, production: 38 },
        { day: 15, steam: 0, temp: 98, production: 32 },
        { day: 20, steam: 0, temp: 86.7, production: 28.4 },
      ]
    };
  }

  async getSrpData() {
    const res = await this._fetchApi('/srp/data');
    if (res) {
      return res;
    }
    // Fallback
    return {
      status: 'Running',
      parameters: {
        pumpSpeed: this.currentConfig.srp.pumpSpeed || 10,
        strokeLength: this.currentConfig.srp.strokeLength || 120,
        pumpSize: this.currentConfig.srp.pumpSize || 2.25,
        pumpDepth: this.currentConfig.srp.pumpDepth || 1100,
        motorLoad: this.currentConfig.srp.motorLoad || 65,
        rodLoad: 12500,
        fluidLevel: 850,
        pumpEfficiency: 82,
        productionResponse: 28.4
      },
      recommendation: {
        action: 'Increase Pump Speed',
        targetValue: '12 SPM',
        reason: 'Current fluid level indicates high bottom-hole pressure. Increasing pump speed to 12 SPM is projected to increase liquid production by 15% while maintaining motor load within safe operating limits (< 85%).',
        expectedProduction: 32.6,
        expectedEfficiency: 79
      },
      performanceData: [
        { spm: 6, production: 18, efficiency: 90, motorLoad: 45 },
        { spm: 8, production: 24, efficiency: 86, motorLoad: 55 },
        { spm: 10, production: 28.4, efficiency: 82, motorLoad: 65 },
        { spm: 12, production: 32.6, efficiency: 79, motorLoad: 78 },
        { spm: 14, production: 35.1, efficiency: 72, motorLoad: 92 },
        { spm: 16, production: 36.2, efficiency: 65, motorLoad: 98 },
      ]
    };
  }

  // --- 4. Analytics ---

  async getAnalyticsData() {
    const res = await this._fetchApi('/analytics');
    if (res) {
      return res;
    }
    // Fallback
    return {
      kpis: {
        oilProduction: 28.4,
        waterProduction: 65.2,
        totalLiquid: 93.6,
        waterCut: 69.7,
        pressureTrend: -0.2,
        temperatureTrend: -1.5,
      },
      productionHistory: [
        { month: 'Jan', oil: 22, water: 50, liquid: 72, temp: 95, pressure: 42 },
        { month: 'Feb', oil: 26, water: 55, liquid: 81, temp: 120, pressure: 41.5 },
        { month: 'Mar', oil: 35, water: 60, liquid: 95, temp: 110, pressure: 41 },
        { month: 'Apr', oil: 31, water: 62, liquid: 93, temp: 98, pressure: 40.8 },
        { month: 'May', oil: 28.4, water: 65.2, liquid: 93.6, temp: 86.7, pressure: 40.2 },
      ],
      forecastData: [
        { month: 'May', historical: 28.4, forecast: 28.4, upperBound: 28.4, lowerBound: 28.4 },
        { month: 'Jun', historical: null, forecast: 26.1, upperBound: 28.0, lowerBound: 24.2 },
        { month: 'Jul', historical: null, forecast: 24.5, upperBound: 27.1, lowerBound: 21.9 },
        { month: 'Aug', historical: null, forecast: 22.8, upperBound: 26.0, lowerBound: 19.6 },
        { month: 'Sep', historical: null, forecast: 36.0, upperBound: 40.0, lowerBound: 32.0 },
      ],
      cycleComparison: [
        { cycle: 'Cycle 1', oil: 1250, water: 2800 },
        { cycle: 'Cycle 2', oil: 1420, water: 3100 },
        { cycle: 'Cycle 3 (YTD)', oil: 850, water: 1950 },
      ]
    };
  }

  // --- 5. Scenario Simulation ---

  async getScenarios() {
    const res = await this._fetchApi('/scenarios');
    if (res) {
      return res;
    }
    // Fallback
    const baseline = {
      id: 'baseline',
      name: 'Baseline',
      isBaseline: true,
      params: {
        steamTemperature: this.currentConfig.css.steamTemperature || 280,
        steamPressure: this.currentConfig.css.steamPressure || 75,
        steamRate: this.currentConfig.css.steamRate || 45,
        injectionDuration: this.currentConfig.css.injectionDuration || 2.5,
        soakDuration: this.currentConfig.css.soakDuration || 1.5,
        pumpSpeed: this.currentConfig.srp.pumpSpeed || 10,
        strokeLength: this.currentConfig.srp.strokeLength || 120,
      },
      results: null
    };

    return {
      baseline,
      scenarios: [
        { id: 'scenA', name: 'Scenario A', isBaseline: false, params: { ...baseline.params, steamRate: 50, injectionDuration: 3, pumpSpeed: 12 }, results: null },
        { id: 'scenB', name: 'Scenario B', isBaseline: false, params: { ...baseline.params, steamRate: 40, injectionDuration: 2, pumpSpeed: 8 }, results: null },
        { id: 'scenC', name: 'Scenario C', isBaseline: false, params: { ...baseline.params }, results: null },
      ]
    };
  }

  async runSimulation(scenarioParams) {
    // Enrich with current reservoir context so the backend physics chain gets
    // the correct initial viscosity, permeability, thickness, etc.
    const cfg = this.currentConfig || {};
    const r   = cfg.reservoir || {};
    const s   = cfg.srp || {};

    const enriched = {
      steamRate:          scenarioParams.steamRate,
      injectionDuration:  scenarioParams.injectionDuration,
      soakDuration:       scenarioParams.soakDuration ?? 1.5,
      pumpSpeed:          scenarioParams.pumpSpeed,
      steamTemperature:   scenarioParams.steamTemperature ?? cfg.css?.steamTemperature ?? 280,
      strokeLength:       scenarioParams.strokeLength  ?? s.strokeLength ?? 120,
      pumpSize:           scenarioParams.pumpSize      ?? s.pumpSize     ?? 2.25,
      pumpDepth:          scenarioParams.pumpDepth     ?? s.pumpDepth    ?? 1100,
      permeability:       r.permeability    ?? 2500,
      thickness:          r.thickness       ?? 25,
      porosity:           r.porosity        ?? 0.32,
      oilSaturation:      r.oilSaturation   ?? 0.75,
      initialPressure:    r.pressure        ?? r.initialPressure    ?? 42,
      initialTemperature: r.temperature     ?? r.initialTemperature ?? 40,
      initialViscosity:   r.oilViscosity    ?? r.initialViscosity   ?? 10000,
    };

    const res = await this._fetchApi('/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(enriched)
    });
    if (res) return res;

    // Offline fallback — grounded Andrade viscosity + Darcy-style approximation
    const { steamRate, injectionDuration, soakDuration = 1.5, pumpSpeed,
            permeability = 2500, thickness = 25,
            initialTemperature = 40, initialViscosity = 10000,
            pumpSize = 2.25, strokeLength = 120,
            oilSaturation = 0.75, initialPressure = 42 } = enriched;

    // Thermal heat balance (condensed)
    const HEATED_VOL = Math.PI * 64 * thickness;
    const Q_in      = steamRate * injectionDuration * 0.72 * 2780;
    const dT        = Q_in / (HEATED_VOL * 2100);
    const T_peak    = Math.min(initialTemperature + dT, 165);
    const T_res     = initialTemperature + (T_peak - initialTemperature) * Math.exp(-0.048 * (soakDuration + 20));

    // Andrade/Arrhenius viscosity
    const B    = 4200;
    const A_sc = initialViscosity / Math.exp(B / (35 + 273.15));
    const oilViscosity = Math.max(8, A_sc * Math.exp(B / (Math.max(T_res, 20) + 273.15)));

    // Simplified Darcy inflow
    const k_ro    = oilSaturation > 0.15 ? 0.85 * Math.pow((oilSaturation - 0.15) / 0.85, 2) : 0.001;
    const q_in    = (0.00708 * permeability * k_ro * thickness * 3.28084 * initialPressure * 14.5038 * 0.45) / (oilViscosity * 1.05 * 7.6);

    // SRP displacement
    const mu_pen  = Math.min(0.22, 0.055 * Math.log10(Math.max(oilViscosity, 10) / 500));
    const eta_v   = Math.max(0.40, 0.85 - Math.max(0, mu_pen));
    const q_liq   = Math.min(q_in, 0.1166 * pumpSize * pumpSize * strokeLength * pumpSpeed * eta_v);
    const production = Math.max(0.5, q_liq * (1 - 0.68));

    return {
      reservoirTemperature: parseFloat(T_res.toFixed(1)),
      oilViscosity:         parseFloat(oilViscosity.toFixed(0)),
      production:           parseFloat(production.toFixed(1)),
      energyConsumption:    parseFloat((Q_in / 1_000_000).toFixed(2)), // GJ
      steamConsumption:     parseFloat((steamRate * injectionDuration).toFixed(1)),
    };
  }

  // --- 6. Optimization ---

  async runOptimization(objective, constraints) {
    const res = await this._fetchApi('/optimization/run', {
      method: 'POST',
      body: JSON.stringify({ objective, constraints })
    });
    if (res) {
      return res;
    }
    // Fallback
    let recommendedParams = { ...this.currentConfig.css, ...this.currentConfig.srp };
    let expectedProduction = 28.4;
    let expectedSteam = 45;
    let expectedEfficiency = 82;

    if (objective === 'maximize_oil') {
      recommendedParams.pumpSpeed = Math.min(constraints?.maxPumpSpeed || 14, 14);
      recommendedParams.steamRate = Math.min(constraints?.maxSteamRate || 60, 60);
      expectedProduction = 38.5;
      expectedSteam = 60;
      expectedEfficiency = 75;
    } else if (objective === 'minimize_steam') {
      recommendedParams.pumpSpeed = 10;
      recommendedParams.steamRate = Math.max(constraints?.maxSteamRate ? constraints.maxSteamRate * 0.5 : 20, 20);
      expectedProduction = 22.0;
      expectedSteam = 20;
      expectedEfficiency = 88;
    } else if (objective === 'maximize_efficiency') {
      recommendedParams.pumpSpeed = 11;
      recommendedParams.steamRate = 35;
      expectedProduction = 29.5;
      expectedSteam = 35;
      expectedEfficiency = 92;
    } else {
      recommendedParams.pumpSpeed = 12;
      recommendedParams.steamRate = 45;
      expectedProduction = 34.0;
      expectedSteam = 45;
      expectedEfficiency = 85;
    }

    return {
      configurationsEvaluated: 144,
      feasibleConfigurations: 89,
      current: {
        production: 28.4,
        steam: 45,
        efficiency: 82,
        params: {
          steamRate: 45,
          injectionDuration: 2.5,
          pumpSpeed: 10,
          strokeLength: 120
        }
      },
      recommended: {
        production: expectedProduction,
        steam: expectedSteam,
        efficiency: expectedEfficiency,
        params: {
          steamRate: recommendedParams.steamRate,
          injectionDuration: recommendedParams.injectionDuration || 2.5,
          pumpSpeed: recommendedParams.pumpSpeed,
          strokeLength: recommendedParams.strokeLength || 120
        }
      }
    };
  }

  // --- 7. Monitoring & Events ---

  async getEvents() {
    const res = await this._fetchApi('/events');
    if (res) {
      return res;
    }
    // Fallback
    return {
      activeAlerts: [
        { id: 1, type: 'warning', title: 'Elevated Pump Load', message: 'Motor load is operating at 82%, near the recommended safety margin (85%). Monitor for overheating.', time: '10 mins ago' },
        { id: 2, type: 'info', title: 'Normal CSS Operation', message: 'Currently in the Production phase of Cycle 3. Steam pressure nominal.', time: '2 hours ago' },
        { id: 3, type: 'critical', title: 'Temperature Threshold Event', message: 'Reservoir temperature sensor 4 dropped below optimal mobility threshold (75°C).', time: '5 hours ago' }
      ],
      eventHistory: [
        { id: 101, type: 'system', action: 'Simulation Executed', details: 'Deterministic scenario simulation completed by Engineer.', timestamp: '2026-09-30 14:22:00' },
        { id: 102, type: 'system', action: 'Optimization Completed', details: 'Grid search evaluated 144 configurations. Recommended: 12 SPM.', timestamp: '2026-09-30 14:15:30' },
        { id: 103, type: 'process', action: 'Production Phase Started', details: 'CSS Cycle 3 transitioned from Soak to Production.', timestamp: '2026-09-28 08:00:00' },
        { id: 104, type: 'process', action: 'Soak Phase Started', details: 'Steam injection halted. Well shut-in for soaking.', timestamp: '2026-09-26 12:00:00' },
        { id: 105, type: 'process', action: 'CSS Injection Started', details: 'Commenced steam injection for Cycle 3 at 45 m³/d.', timestamp: '2026-09-24 00:00:00' },
        { id: 106, type: 'system', action: 'Configuration Updated', details: 'Well parameters updated and Digital Twin initialized.', timestamp: '2026-09-23 09:45:00' },
      ]
    };
  }
}

export const wellService = new WellService();
