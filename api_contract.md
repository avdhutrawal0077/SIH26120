# SIH26120 API Contract

This document outlines the REST API endpoints required by the React frontend for the Heavy-Oil Well Digital Twin platform. The backend is expected to be built using FastAPI, taking and returning JSON payloads. 

**Base URL:** `/api/v1`

---

## 1. Well Configuration

### `GET /config`
Retrieves the current virtual well configuration.

**Response:** `200 OK`
```json
{
  "reservoir": {
    "depth": 1100,
    "thickness": 25,
    "porosity": 0.32,
    "permeability": 2500,
    "oilSaturation": 0.75,
    "initialPressure": 42,
    "initialTemperature": 40,
    "initialViscosity": 10000
  },
  "css": {
    "steamTemperature": 280,
    "steamPressure": 75,
    "steamRate": 45,
    "steamVolume": 450,
    "injectionDuration": 2.5,
    "soakDuration": 1.5,
    "cycleNumber": 3
  },
  "srp": {
    "pumpDepth": 1100,
    "pumpSize": 2.25,
    "pumpSpeed": 10,
    "strokeLength": 120,
    "motorLoad": 65
  }
}
```

### `PUT /config`
Updates the well configuration.

**Request Body:** JSON object matching the `GET /config` response.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { ...updatedConfig... }
}
```

### `POST /config/reset`
Resets the well configuration to initial defaults and clears digital twin initialization state.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { ...initialConfig... }
}
```

---

## 2. Digital Twin

### `POST /digital-twin/initialize`
Initializes the digital twin simulation environment based on the current configuration.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Digital Twin initialized successfully."
}
```

### `GET /digital-twin/state`
Retrieves the current state of the Digital Twin.

**Response:** `200 OK`
```json
{
  "reservoir": {
    "temperature": 86.7,
    "pressure": 40.2,
    "oilSaturation": 0.72,
    "oilViscosity": 2340
  },
  "css": {
    "currentPhase": "Production",
    "cycleNumber": 3,
    "steamRate": 0,
    "steamTemperature": 280
  },
  "srp": {
    "pumpSpeed": 10,
    "strokeLength": 120,
    "motorLoad": 68
  },
  "production": {
    "oilRate": 28.4,
    "waterRate": 65.2,
    "totalLiquid": 93.6
  },
  "history": [
    { "day": 1, "temp": 40, "viscosity": 9000, "production": 5 },
    { "day": 5, "temp": 150, "viscosity": 500, "production": 0 }
  ]
}
```

---

## 3. Operations Data

### `GET /css/data`
Retrieves Cyclic Steam Stimulation (CSS) parameters and historical performance.

**Response:** `200 OK`
```json
{
  "currentCycle": 3,
  "currentPhase": "Production",
  "cycleProgress": 65,
  "parameters": {
    "steamTemperature": 280,
    "steamPressure": 75,
    "steamRate": 45,
    "steamVolume": 450,
    "injectionDuration": 2.5,
    "soakDuration": 1.5
  },
  "historicalCycles": [
    { "cycle": 1, "duration": 120, "steamInjected": 350, "avgProduction": 18.5, "maxTemp": 78.0 }
  ],
  "chartData": [
    { "day": 1, "steam": 45, "temp": 40, "production": 0 }
  ]
}
```

### `GET /srp/data`
Retrieves Sucker Rod Pump (SRP) data, current performance, and recommendations.

**Response:** `200 OK`
```json
{
  "status": "Running",
  "parameters": {
    "pumpSpeed": 10,
    "strokeLength": 120,
    "pumpSize": 2.25,
    "pumpDepth": 1100,
    "motorLoad": 65,
    "rodLoad": 12500,
    "fluidLevel": 850,
    "pumpEfficiency": 82,
    "productionResponse": 28.4
  },
  "recommendation": {
    "action": "Increase Pump Speed",
    "targetValue": "12 SPM",
    "reason": "Current fluid level indicates high bottom-hole pressure...",
    "expectedProduction": 32.6,
    "expectedEfficiency": 79
  },
  "performanceData": [
    { "spm": 6, "production": 18, "efficiency": 90, "motorLoad": 45 }
  ]
}
```

---

## 4. Analytics

### `GET /analytics`
Retrieves KPIs, historical production, and forecast data.

**Response:** `200 OK`
```json
{
  "kpis": {
    "oilProduction": 28.4,
    "waterProduction": 65.2,
    "totalLiquid": 93.6,
    "waterCut": 69.7,
    "pressureTrend": -0.2,
    "temperatureTrend": -1.5
  },
  "productionHistory": [
    { "month": "Jan", "oil": 22, "water": 50, "liquid": 72, "temp": 95, "pressure": 42 }
  ],
  "forecastData": [
    { "month": "May", "historical": 28.4, "forecast": 28.4, "upperBound": 28.4, "lowerBound": 28.4 }
  ],
  "cycleComparison": [
    { "cycle": "Cycle 1", "oil": 1250, "water": 2800 }
  ]
}
```

---

## 5. Scenario Simulation

### `GET /scenarios`
Retrieves the list of configured scenarios for simulation.

**Response:** `200 OK`
```json
{
  "baseline": {
    "id": "baseline",
    "name": "Baseline",
    "isBaseline": true,
    "params": {
      "steamTemperature": 280,
      "steamPressure": 75,
      "steamRate": 45,
      "injectionDuration": 2.5,
      "soakDuration": 1.5,
      "pumpSpeed": 10,
      "strokeLength": 120
    },
    "results": null
  },
  "scenarios": [
    {
      "id": "scenA",
      "name": "Scenario A",
      "isBaseline": false,
      "params": {
        "steamRate": 50,
        "injectionDuration": 3,
        "pumpSpeed": 12
      },
      "results": null
    }
  ]
}
```

### `POST /scenarios/simulate`
Runs deterministic simulation on given scenario parameters.

**Request Body:**
```json
{
  "steamRate": 50,
  "injectionDuration": 3,
  "soakDuration": 1.5,
  "pumpSpeed": 12
}
```

**Response:** `200 OK`
```json
{
  "reservoirTemperature": 140.5,
  "oilViscosity": 1500,
  "production": 45.2,
  "energyConsumption": 375,
  "steamConsumption": 150
}
```

---

## 6. Optimization

### `POST /optimization/run`
Runs an optimization search given an objective and constraints.

**Request Body:**
```json
{
  "objective": "maximize_oil", 
  "constraints": {
    "maxPumpSpeed": 14,
    "maxSteamRate": 60
  }
}
```
*(Valid objectives: `maximize_oil`, `minimize_steam`, `maximize_efficiency`, `balanced`)*

**Response:** `200 OK`
```json
{
  "configurationsEvaluated": 144,
  "feasibleConfigurations": 89,
  "current": {
    "production": 28.4,
    "steam": 45,
    "efficiency": 82,
    "params": {
      "steamRate": 45,
      "injectionDuration": 2.5,
      "pumpSpeed": 10,
      "strokeLength": 120
    }
  },
  "recommended": {
    "production": 38.5,
    "steam": 60,
    "efficiency": 75,
    "params": {
      "steamRate": 60,
      "injectionDuration": 2.5,
      "pumpSpeed": 14,
      "strokeLength": 120
    }
  }
}
```

---

## 7. Monitoring & Events

### `GET /events`
Retrieves current alerts and event history logs.

**Response:** `200 OK`
```json
{
  "activeAlerts": [
    {
      "id": 1,
      "type": "warning",
      "title": "Elevated Pump Load",
      "message": "Motor load is operating at 82%...",
      "time": "10 mins ago"
    }
  ],
  "eventHistory": [
    {
      "id": 101,
      "type": "system",
      "action": "Simulation Executed",
      "details": "Deterministic scenario simulation completed by Engineer.",
      "timestamp": "2026-09-30 14:22:00"
    }
  ]
}
```
