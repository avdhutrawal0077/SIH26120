from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- 1. Well Configuration Models ---

class ReservoirConfig(BaseModel):
    depth: float = Field(default=1100, description="Well depth in meters")
    thickness: float = Field(default=25, description="Net pay thickness in meters")
    porosity: float = Field(default=0.32, description="Formation porosity (fraction)")
    permeability: float = Field(default=2500, description="Absolute permeability in mD")
    oilSaturation: float = Field(default=0.75, description="Initial oil saturation (fraction)")
    initialPressure: float = Field(default=42, description="Initial reservoir pressure in bar")
    initialTemperature: float = Field(default=40, description="Initial reservoir temperature in °C")
    initialViscosity: float = Field(default=10000, description="Initial dead oil viscosity in cP")

class CssConfig(BaseModel):
    steamTemperature: float = Field(default=280, description="Injected steam temperature in °C")
    steamPressure: float = Field(default=75, description="Injected steam pressure in bar")
    steamRate: float = Field(default=45, description="Steam injection rate in m3/day")
    steamVolume: float = Field(default=450, description="Total steam volume per cycle in m3")
    injectionDuration: float = Field(default=2.5, description="Injection duration in days")
    soakDuration: float = Field(default=1.5, description="Soak shut-in duration in days")
    cycleNumber: int = Field(default=3, description="Current CSS cycle number")

class SrpConfig(BaseModel):
    pumpDepth: float = Field(default=1100, description="Pump seating depth in meters")
    pumpSize: float = Field(default=2.25, description="Plunger diameter in inches")
    pumpSpeed: float = Field(default=10, description="Pumping speed in strokes per minute (SPM)")
    strokeLength: float = Field(default=120, description="Stroke length in inches")
    motorLoad: float = Field(default=65, description="Target motor load percentage")

class WellConfig(BaseModel):
    reservoir: ReservoirConfig = Field(default_factory=ReservoirConfig)
    css: CssConfig = Field(default_factory=CssConfig)
    srp: SrpConfig = Field(default_factory=SrpConfig)

class StandardResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None

# --- 2. Digital Twin Models ---

class HistoryPoint(BaseModel):
    day: int
    temp: float
    viscosity: float
    production: float

class DigitalTwinReservoirState(BaseModel):
    temperature: float
    pressure: float
    oilSaturation: float
    oilViscosity: float

class DigitalTwinCssState(BaseModel):
    currentPhase: str
    cycleNumber: int
    steamRate: float
    steamTemperature: float

class DigitalTwinSrpState(BaseModel):
    pumpSpeed: float
    strokeLength: float
    motorLoad: float

class DigitalTwinProductionState(BaseModel):
    oilRate: float
    waterRate: float
    totalLiquid: float

class DigitalTwinState(BaseModel):
    reservoir: DigitalTwinReservoirState
    css: DigitalTwinCssState
    srp: DigitalTwinSrpState
    production: DigitalTwinProductionState
    history: List[HistoryPoint]

# --- 3. Operations Models ---

class HistoricalCycle(BaseModel):
    cycle: int
    duration: float
    steamInjected: float
    avgProduction: float
    maxTemp: float

class ChartDataPoint(BaseModel):
    day: int
    steam: float
    temp: float
    production: float

class CssData(BaseModel):
    currentCycle: int
    currentPhase: str
    cycleProgress: float
    parameters: Dict[str, float]
    historicalCycles: List[HistoricalCycle]
    chartData: List[ChartDataPoint]

class SrpParameters(BaseModel):
    pumpSpeed: float
    strokeLength: float
    pumpSize: float
    pumpDepth: float
    motorLoad: float
    rodLoad: float
    fluidLevel: float
    pumpEfficiency: float
    productionResponse: float

class SrpRecommendation(BaseModel):
    action: str
    targetValue: str
    reason: str
    expectedProduction: float
    expectedEfficiency: float

class SrpPerformanceData(BaseModel):
    spm: float
    production: float
    efficiency: float
    motorLoad: float

class SrpData(BaseModel):
    status: str
    parameters: SrpParameters
    recommendation: SrpRecommendation
    performanceData: List[SrpPerformanceData]

# --- 4. Analytics Models ---

class AnalyticsKPIs(BaseModel):
    oilProduction: float
    waterProduction: float
    totalLiquid: float
    waterCut: float
    pressureTrend: float
    temperatureTrend: float

class ProductionHistoryPoint(BaseModel):
    month: str
    oil: float
    water: float
    liquid: float
    temp: float
    pressure: float

class ForecastPoint(BaseModel):
    month: str
    historical: Optional[float] = None
    forecast: float
    upperBound: float
    lowerBound: float

class CycleComparisonPoint(BaseModel):
    cycle: str
    oil: float
    water: float

class AnalyticsData(BaseModel):
    kpis: AnalyticsKPIs
    productionHistory: List[ProductionHistoryPoint]
    forecastData: List[ForecastPoint]
    cycleComparison: List[CycleComparisonPoint]

# --- 5. Scenario Simulation Models ---

class ScenarioParams(BaseModel):
    steamTemperature: Optional[float] = None
    steamPressure: Optional[float] = None
    steamRate: float
    injectionDuration: float
    soakDuration: Optional[float] = 1.5
    pumpSpeed: float
    strokeLength: Optional[float] = 120

class ScenarioResult(BaseModel):
    reservoirTemperature: float
    oilViscosity: float
    production: float
    energyConsumption: float
    steamConsumption: float

class ScenarioItem(BaseModel):
    id: str
    name: str
    isBaseline: bool
    params: ScenarioParams
    results: Optional[ScenarioResult] = None

class ScenariosResponse(BaseModel):
    baseline: ScenarioItem
    scenarios: List[ScenarioItem]

class SimulateRequest(BaseModel):
    steamRate: float
    injectionDuration: float
    soakDuration: float = 1.5
    pumpSpeed: float

# --- 6. Optimization Models ---

class OptimizationConstraints(BaseModel):
    maxPumpSpeed: Optional[float] = 14
    maxSteamRate: Optional[float] = 60

class OptimizationRequest(BaseModel):
    objective: str = Field(default="maximize_oil", description="maximize_oil, minimize_steam, maximize_efficiency, balanced")
    constraints: Optional[OptimizationConstraints] = Field(default_factory=OptimizationConstraints)

class OptimizationCase(BaseModel):
    production: float
    steam: float
    efficiency: float
    params: Dict[str, Any]

class OptimizationResponse(BaseModel):
    configurationsEvaluated: int
    feasibleConfigurations: int
    current: OptimizationCase
    recommended: OptimizationCase

# --- 7. Monitoring & Events Models ---

class AlertItem(BaseModel):
    id: int
    type: str
    title: str
    message: str
    time: str

class EventHistoryItem(BaseModel):
    id: int
    type: str
    action: str
    details: str
    timestamp: str

class EventsResponse(BaseModel):
    activeAlerts: List[AlertItem]
    eventHistory: List[EventHistoryItem]
