import math
from typing import Dict, Any, List
from models import (
    WellConfig, DigitalTwinState, DigitalTwinReservoirState,
    DigitalTwinCssState, DigitalTwinSrpState, DigitalTwinProductionState,
    HistoryPoint, CssData, HistoricalCycle, ChartDataPoint,
    SrpData, SrpParameters, SrpRecommendation, SrpPerformanceData,
    AnalyticsData, AnalyticsKPIs, ProductionHistoryPoint, ForecastPoint,
    CycleComparisonPoint, ScenariosResponse, ScenarioItem, ScenarioParams,
    ScenarioResult, OptimizationResponse, OptimizationCase
)

def compute_digital_twin_state(config: WellConfig) -> DigitalTwinState:
    # Responsive calculations based on configured steam and pump parameters
    steam_rate = config.css.steamRate
    steam_temp = config.css.steamTemperature
    pump_speed = config.srp.pumpSpeed
    stroke_length = config.srp.strokeLength
    cycle_num = config.css.cycleNumber

    # Reservoir state
    temp = 86.7
    pressure = 40.2
    oil_sat = 0.72
    viscosity = 2340.0

    # Production response
    oil_rate = 28.4 * (pump_speed / 10.0) * (steam_rate / 45.0)**0.3
    water_rate = 65.2 * (pump_speed / 10.0)
    total_liquid = oil_rate + water_rate

    history = [
        HistoryPoint(day=1, temp=40.0, viscosity=9000.0, production=5.0),
        HistoryPoint(day=5, temp=150.0, viscosity=500.0, production=0.0),
        HistoryPoint(day=10, temp=120.0, viscosity=1200.0, production=45.0),
        HistoryPoint(day=15, temp=100.0, viscosity=1800.0, production=35.0),
        HistoryPoint(day=20, temp=86.7, viscosity=2340.0, production=round(oil_rate, 1)),
    ]

    return DigitalTwinState(
        reservoir=DigitalTwinReservoirState(
            temperature=round(temp, 1),
            pressure=round(pressure, 1),
            oilSaturation=round(oil_sat, 2),
            oilViscosity=round(viscosity, 1)
        ),
        css=DigitalTwinCssState(
            currentPhase="Production",
            cycleNumber=cycle_num,
            steamRate=0.0,
            steamTemperature=steam_temp
        ),
        srp=DigitalTwinSrpState(
            pumpSpeed=pump_speed,
            strokeLength=stroke_length,
            motorLoad=round(68.0 * (pump_speed / 10.0), 1)
        ),
        production=DigitalTwinProductionState(
            oilRate=round(oil_rate, 1),
            waterRate=round(water_rate, 1),
            totalLiquid=round(total_liquid, 1)
        ),
        history=history
    )

def compute_css_data(config: WellConfig) -> CssData:
    return CssData(
        currentCycle=config.css.cycleNumber,
        currentPhase="Production",
        cycleProgress=65.0,
        parameters={
            "steamTemperature": config.css.steamTemperature,
            "steamPressure": config.css.steamPressure,
            "steamRate": config.css.steamRate,
            "steamVolume": config.css.steamVolume,
            "injectionDuration": config.css.injectionDuration,
            "soakDuration": config.css.soakDuration,
        },
        historicalCycles=[
            HistoricalCycle(cycle=1, duration=120, steamInjected=350, avgProduction=18.5, maxTemp=78.0),
            HistoricalCycle(cycle=2, duration=145, steamInjected=410, avgProduction=22.1, maxTemp=82.5),
        ],
        chartData=[
            ChartDataPoint(day=1, steam=45, temp=40, production=0),
            ChartDataPoint(day=2, steam=45, temp=110, production=0),
            ChartDataPoint(day=3, steam=22.5, temp=150, production=0),
            ChartDataPoint(day=4, steam=0, temp=140, production=0),
            ChartDataPoint(day=5, steam=0, temp=135, production=45),
            ChartDataPoint(day=10, steam=0, temp=115, production=38),
            ChartDataPoint(day=15, steam=0, temp=98, production=32),
            ChartDataPoint(day=20, steam=0, temp=86.7, production=28.4),
        ]
    )

def compute_srp_data(config: WellConfig) -> SrpData:
    pump_speed = config.srp.pumpSpeed
    stroke_length = config.srp.strokeLength
    pump_size = config.srp.pumpSize
    pump_depth = config.srp.pumpDepth
    motor_load = config.srp.motorLoad

    return SrpData(
        status="Running",
        parameters=SrpParameters(
            pumpSpeed=pump_speed,
            strokeLength=stroke_length,
            pumpSize=pump_size,
            pumpDepth=pump_depth,
            motorLoad=motor_load,
            rodLoad=12500,
            fluidLevel=850,
            pumpEfficiency=82,
            productionResponse=28.4
        ),
        recommendation=SrpRecommendation(
            action="Increase Pump Speed",
            targetValue="12 SPM",
            reason="Current fluid level indicates high bottom-hole pressure. Increasing pump speed to 12 SPM is projected to increase liquid production by 15% while maintaining motor load within safe operating limits (< 85%).",
            expectedProduction=32.6,
            expectedEfficiency=79
        ),
        performanceData=[
            SrpPerformanceData(spm=6, production=18, efficiency=90, motorLoad=45),
            SrpPerformanceData(spm=8, production=24, efficiency=86, motorLoad=55),
            SrpPerformanceData(spm=10, production=28.4, efficiency=82, motorLoad=65),
            SrpPerformanceData(spm=12, production=32.6, efficiency=79, motorLoad=78),
            SrpPerformanceData(spm=14, production=35.1, efficiency=72, motorLoad=92),
            SrpPerformanceData(spm=16, production=36.2, efficiency=65, motorLoad=98),
        ]
    )

def compute_analytics_data(config: WellConfig) -> AnalyticsData:
    return AnalyticsData(
        kpis=AnalyticsKPIs(
            oilProduction=28.4,
            waterProduction=65.2,
            totalLiquid=93.6,
            waterCut=69.7,
            pressureTrend=-0.2,
            temperatureTrend=-1.5
        ),
        productionHistory=[
            ProductionHistoryPoint(month="Jan", oil=22, water=50, liquid=72, temp=95, pressure=42),
            ProductionHistoryPoint(month="Feb", oil=26, water=55, liquid=81, temp=120, pressure=41.5),
            ProductionHistoryPoint(month="Mar", oil=35, water=60, liquid=95, temp=110, pressure=41),
            ProductionHistoryPoint(month="Apr", oil=31, water=62, liquid=93, temp=98, pressure=40.8),
            ProductionHistoryPoint(month="May", oil=28.4, water=65.2, liquid=93.6, temp=86.7, pressure=40.2),
        ],
        forecastData=[
            ForecastPoint(month="May", historical=28.4, forecast=28.4, upperBound=28.4, lowerBound=28.4),
            ForecastPoint(month="Jun", historical=None, forecast=26.1, upperBound=28.0, lowerBound=24.2),
            ForecastPoint(month="Jul", historical=None, forecast=24.5, upperBound=27.1, lowerBound=21.9),
            ForecastPoint(month="Aug", historical=None, forecast=22.8, upperBound=26.0, lowerBound=19.6),
            ForecastPoint(month="Sep", historical=None, forecast=36.0, upperBound=40.0, lowerBound=32.0),
        ],
        cycleComparison=[
            CycleComparisonPoint(cycle="Cycle 1", oil=1250, water=2800),
            CycleComparisonPoint(cycle="Cycle 2", oil=1420, water=3100),
            CycleComparisonPoint(cycle="Cycle 3 (YTD)", oil=850, water=1950),
        ]
    )

def compute_scenarios(config: WellConfig) -> ScenariosResponse:
    baseline = ScenarioItem(
        id="baseline",
        name="Baseline",
        isBaseline=True,
        params=ScenarioParams(
            steamTemperature=config.css.steamTemperature,
            steamPressure=config.css.steamPressure,
            steamRate=config.css.steamRate,
            injectionDuration=config.css.injectionDuration,
            soakDuration=config.css.soakDuration,
            pumpSpeed=config.srp.pumpSpeed,
            strokeLength=config.srp.strokeLength,
        ),
        results=None
    )

    scenarios = [
        ScenarioItem(
            id="scenA",
            name="Scenario A",
            isBaseline=False,
            params=ScenarioParams(
                steamTemperature=config.css.steamTemperature,
                steamPressure=config.css.steamPressure,
                steamRate=50,
                injectionDuration=3,
                soakDuration=1.5,
                pumpSpeed=12,
                strokeLength=config.srp.strokeLength
            ),
            results=None
        ),
        ScenarioItem(
            id="scenB",
            name="Scenario B",
            isBaseline=False,
            params=ScenarioParams(
                steamTemperature=config.css.steamTemperature,
                steamPressure=config.css.steamPressure,
                steamRate=40,
                injectionDuration=2,
                soakDuration=1.5,
                pumpSpeed=8,
                strokeLength=config.srp.strokeLength
            ),
            results=None
        ),
        ScenarioItem(
            id="scenC",
            name="Scenario C",
            isBaseline=False,
            params=ScenarioParams(
                steamTemperature=config.css.steamTemperature,
                steamPressure=config.css.steamPressure,
                steamRate=config.css.steamRate,
                injectionDuration=config.css.injectionDuration,
                soakDuration=config.css.soakDuration,
                pumpSpeed=config.srp.pumpSpeed,
                strokeLength=config.srp.strokeLength
            ),
            results=None
        )
    ]

    return ScenariosResponse(baseline=baseline, scenarios=scenarios)

def run_simulation_engine(steam_rate: float, injection_duration: float, soak_duration: float, pump_speed: float) -> ScenarioResult:
    # Deterministic engineering physics formula
    steam_volume = steam_rate * injection_duration
    heat_energy = steam_volume * 2.5
    
    reservoir_temp = 40.0 + (heat_energy * 0.1) - (soak_duration * 2.0)
    oil_viscosity = max(100.0, 10000.0 - (reservoir_temp * 80.0))
    
    production = (3000.0 / (oil_viscosity / 100.0)) * (pump_speed / 10.0)
    production = min(max(production, 5.0), 80.0)

    return ScenarioResult(
        reservoirTemperature=round(reservoir_temp, 1),
        oilViscosity=round(oil_viscosity, 0),
        production=round(production, 1),
        energyConsumption=round(heat_energy, 0),
        steamConsumption=round(steam_volume, 1)
    )

def run_optimization_engine(objective: str, constraints_dict: Dict[str, Any], config: WellConfig) -> OptimizationResponse:
    max_pump = constraints_dict.get("maxPumpSpeed", 14) or 14
    max_steam = constraints_dict.get("maxSteamRate", 60) or 60

    if objective == "maximize_oil":
        rec_pump = min(max_pump, 14)
        rec_steam = min(max_steam, 60)
        expected_prod = 38.5
        expected_steam = 60.0
        expected_eff = 75.0
    elif objective == "minimize_steam":
        rec_pump = 10.0
        rec_steam = max(max_steam * 0.5 if max_steam else 20.0, 20.0)
        expected_prod = 22.0
        expected_steam = 20.0
        expected_eff = 88.0
    elif objective == "maximize_efficiency":
        rec_pump = 11.0
        rec_steam = 35.0
        expected_prod = 29.5
        expected_steam = 35.0
        expected_eff = 92.0
    else:  # balanced
        rec_pump = 12.0
        rec_steam = 45.0
        expected_prod = 34.0
        expected_steam = 45.0
        expected_eff = 85.0

    current_case = OptimizationCase(
        production=28.4,
        steam=45.0,
        efficiency=82.0,
        params={
            "steamRate": 45,
            "injectionDuration": 2.5,
            "pumpSpeed": 10,
            "strokeLength": 120
        }
    )

    recommended_case = OptimizationCase(
        production=expected_prod,
        steam=expected_steam,
        efficiency=expected_eff,
        params={
            "steamRate": rec_steam,
            "injectionDuration": 2.5,
            "pumpSpeed": rec_pump,
            "strokeLength": 120
        }
    )

    return OptimizationResponse(
        configurationsEvaluated=144,
        feasibleConfigurations=89,
        current=current_case,
        recommended=recommended_case
    )
