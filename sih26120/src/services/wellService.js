import { initialWellConfig } from '../data/wells';

// In a real application, these would be API calls using fetch or axios
class WellService {
  constructor() {
    // Initialize with mock data, store in memory or local storage for persistence across views during demo
    this.currentConfig = { ...initialWellConfig };
    this.isTwinInitialized = false;
  }

  getConfig() {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...this.currentConfig }), 300);
    });
  }

  saveConfig(newConfig) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentConfig = { ...newConfig };
        resolve({ success: true, data: this.currentConfig });
      }, 500);
    });
  }

  resetConfig() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentConfig = { ...initialWellConfig };
        this.isTwinInitialized = false;
        resolve({ ...this.currentConfig });
      }, 300);
    });
  }

  initializeDigitalTwin() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isTwinInitialized = true;
        resolve({ success: true, message: 'Digital Twin initialized successfully.' });
      }, 800);
    });
  }

  getWellState() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock current state based on config
        const state = {
          reservoir: {
            temperature: 86.7, // °C
            pressure: 40.2, // bar
            oilSaturation: 0.72,
            oilViscosity: 2340 // cP
          },
          css: {
            currentPhase: 'Production',
            cycleNumber: this.currentConfig.css.cycleNumber || 3,
            steamRate: 0, // 0 during production
            steamTemperature: this.currentConfig.css.steamTemperature || 280
          },
          srp: {
            pumpSpeed: this.currentConfig.srp.pumpSpeed || 10, // SPM
            strokeLength: this.currentConfig.srp.strokeLength || 120, // in
            motorLoad: 68 // %
          },
          production: {
            oilRate: 28.4, // bbl/day
            waterRate: 65.2, // bbl/day
            totalLiquid: 93.6 // bbl/day
          },
          history: [
            { day: 1, temp: 40, viscosity: 9000, production: 5 },
            { day: 5, temp: 150, viscosity: 500, production: 0 },
            { day: 10, temp: 120, viscosity: 1200, production: 45 },
            { day: 15, temp: 100, viscosity: 1800, production: 35 },
            { day: 20, temp: 86.7, viscosity: 2340, production: 28.4 },
          ]
        };
        resolve(state);
      }, 400);
    });
  }

  getCssData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          currentCycle: this.currentConfig.css.cycleNumber || 3,
          currentPhase: 'Production',
          cycleProgress: 65, // %
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
            { day: 3, steam: 22.5, temp: 150, production: 0 }, // injection ends
            { day: 4, steam: 0, temp: 140, production: 0 }, // soak
            { day: 5, steam: 0, temp: 135, production: 45 }, // production starts
            { day: 10, steam: 0, temp: 115, production: 38 },
            { day: 15, steam: 0, temp: 98, production: 32 },
            { day: 20, steam: 0, temp: 86.7, production: 28.4 },
          ]
        });
      }, 400);
    });
  }

  getSrpData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'Running',
          parameters: {
            pumpSpeed: this.currentConfig.srp.pumpSpeed || 10,
            strokeLength: this.currentConfig.srp.strokeLength || 120,
            pumpSize: this.currentConfig.srp.pumpSize || 2.25,
            pumpDepth: this.currentConfig.srp.pumpDepth || 1100,
            motorLoad: this.currentConfig.srp.motorLoad || 65,
            rodLoad: 12500, // lbs
            fluidLevel: 850, // m from surface
            pumpEfficiency: 82, // %
            productionResponse: 28.4 // bbl/d
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
        });
      }, 400);
    });
  }

  getAnalyticsData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          kpis: {
            oilProduction: 28.4,
            waterProduction: 65.2,
            totalLiquid: 93.6,
            waterCut: 69.7, // %
            pressureTrend: -0.2, // bar/month
            temperatureTrend: -1.5, // C/month
          },
          productionHistory: [
            { month: 'Jan', oil: 22, water: 50, liquid: 72, temp: 95, pressure: 42 },
            { month: 'Feb', oil: 26, water: 55, liquid: 81, temp: 120, pressure: 41.5 }, // CSS peak
            { month: 'Mar', oil: 35, water: 60, liquid: 95, temp: 110, pressure: 41 },
            { month: 'Apr', oil: 31, water: 62, liquid: 93, temp: 98, pressure: 40.8 },
            { month: 'May', oil: 28.4, water: 65.2, liquid: 93.6, temp: 86.7, pressure: 40.2 }, // Current
          ],
          forecastData: [
            { month: 'May', historical: 28.4, forecast: 28.4, upperBound: 28.4, lowerBound: 28.4 },
            { month: 'Jun', historical: null, forecast: 26.1, upperBound: 28.0, lowerBound: 24.2 },
            { month: 'Jul', historical: null, forecast: 24.5, upperBound: 27.1, lowerBound: 21.9 },
            { month: 'Aug', historical: null, forecast: 22.8, upperBound: 26.0, lowerBound: 19.6 }, // Needs new CSS
            { month: 'Sep', historical: null, forecast: 36.0, upperBound: 40.0, lowerBound: 32.0 }, // Simulated next cycle
          ],
          cycleComparison: [
            { cycle: 'Cycle 1', oil: 1250, water: 2800 },
            { cycle: 'Cycle 2', oil: 1420, water: 3100 },
            { cycle: 'Cycle 3 (YTD)', oil: 850, water: 1950 },
          ]
        });
      }, 400);
    });
  }

  getScenarios() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Build baseline from current config
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
          results: null // Needs to be simulated
        };

        resolve({
          baseline,
          scenarios: [
            { id: 'scenA', name: 'Scenario A', isBaseline: false, params: { ...baseline.params, steamRate: 50, injectionDuration: 3, pumpSpeed: 12 }, results: null },
            { id: 'scenB', name: 'Scenario B', isBaseline: false, params: { ...baseline.params, steamRate: 40, injectionDuration: 2, pumpSpeed: 8 }, results: null },
            { id: 'scenC', name: 'Scenario C', isBaseline: false, params: { ...baseline.params }, results: null },
          ]
        });
      }, 400);
    });
  }

  runSimulation(scenarioParams) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Deterministic mock calculations
        const { steamRate, injectionDuration, soakDuration, pumpSpeed } = scenarioParams;
        
        // Base arbitrary formulas that are deterministic
        const steamVolume = steamRate * injectionDuration;
        const heatEnergy = steamVolume * 2.5; // Mock factor
        
        const reservoirTemp = 40 + (heatEnergy * 0.1) - (soakDuration * 2);
        const oilViscosity = Math.max(100, 10000 - (reservoirTemp * 80)); // Viscosity drops as temp rises
        
        // Production increases with lower viscosity and higher pump speed
        let production = (3000 / (oilViscosity / 100)) * (pumpSpeed / 10);
        
        // Cap or scale it reasonably
        production = Math.min(Math.max(production, 5), 80);

        resolve({
          reservoirTemperature: parseFloat(reservoirTemp.toFixed(1)),
          oilViscosity: parseFloat(oilViscosity.toFixed(0)),
          production: parseFloat(production.toFixed(1)),
          energyConsumption: parseFloat(heatEnergy.toFixed(0)),
          steamConsumption: parseFloat(steamVolume.toFixed(1)),
        });
      }, 600); // Simulate heavier calculation
    });
  }

  runOptimization(objective, constraints) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock deterministic optimization 
        // In a real app, this would perform a grid search or use Optuna over the physics model
        
        let recommendedParams = { ...this.currentConfig.css, ...this.currentConfig.srp };
        let expectedProduction = 28.4;
        let expectedSteam = 45;
        let expectedEfficiency = 82;

        if (objective === 'maximize_oil') {
          recommendedParams.pumpSpeed = Math.min(constraints.maxPumpSpeed || 14, 14);
          recommendedParams.steamRate = Math.min(constraints.maxSteamRate || 60, 60);
          expectedProduction = 38.5;
          expectedSteam = 60;
          expectedEfficiency = 75;
        } else if (objective === 'minimize_steam') {
          recommendedParams.pumpSpeed = 10;
          recommendedParams.steamRate = Math.max(constraints.maxSteamRate ? constraints.maxSteamRate * 0.5 : 20, 20);
          expectedProduction = 22.0;
          expectedSteam = 20;
          expectedEfficiency = 88;
        } else if (objective === 'maximize_efficiency') {
          recommendedParams.pumpSpeed = 11;
          recommendedParams.steamRate = 35;
          expectedProduction = 29.5;
          expectedSteam = 35;
          expectedEfficiency = 92;
        } else { // balanced
          recommendedParams.pumpSpeed = 12;
          recommendedParams.steamRate = 45;
          expectedProduction = 34.0;
          expectedSteam = 45;
          expectedEfficiency = 85;
        }

        resolve({
          configurationsEvaluated: 144, // Mock 12x12 grid
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
        });
      }, 1200); // Simulate grid search delay
    });
  }

  getEvents() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
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
        });
      }, 300);
    });
  }
}

export const wellService = new WellService();
