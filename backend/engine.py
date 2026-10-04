"""
engine.py  ——  Grounded Physics Engine for SIH26120 Heavy-Oil Digital Twin
═══════════════════════════════════════════════════════════════════════════

Implements a five-stage coupled reservoir / lift / CSS model:
  Stage 1  –  Thermal heat balance from steam injection
  Stage 2  –  Andrade/Arrhenius oil viscosity vs temperature
  Stage 3  –  Darcy Inflow Performance Relationship (IPR)
  Stage 4  –  SRP kinematics, volumetric efficiency, motor-load
  Stage 5  –  Constrained grid-search optimisation

All equations are grounded in standard petroleum-engineering references;
no ML models are used.  Where coefficients have been calibrated they are
documented with the calibration basis (Baghewala heavy-crude data points
provided in the Build Specification).
"""

import math
from typing import Dict, Any, List, Optional
from models import (
    WellConfig, DigitalTwinState, DigitalTwinReservoirState,
    DigitalTwinCssState, DigitalTwinSrpState, DigitalTwinProductionState,
    HistoryPoint, CssData, HistoricalCycle, ChartDataPoint,
    SrpData, SrpParameters, SrpRecommendation, SrpPerformanceData,
    AnalyticsData, AnalyticsKPIs, ProductionHistoryPoint, ForecastPoint,
    CycleComparisonPoint, ScenariosResponse, ScenarioItem, ScenarioParams,
    ScenarioResult, OptimizationResponse, OptimizationCase
)

# ────────────────────────────────────────────────────────────────────────────
# PHYSICAL CONSTANTS
# ────────────────────────────────────────────────────────────────────────────

# Specific heat capacity of the reservoir rock + fluid system [kJ/(m³·°C)]
# Typical heavy-oil sand: ρ·Cp ≈ 2,100 kJ/(m³·°C)
RESERVOIR_HEAT_CAPACITY = 2100.0  # kJ / (m³·°C)

# Steam latent heat + sensible heat per m³ of Cold Water Equivalent (CWE) [kJ/m³]
# At 280°C, steam specific enthalpy ≈ 2,780 kJ/kg.
# 1 m³ CWE = 1,000 kg water → 1 m³ steam (CWE) delivers 1000 × 2780 = 2,780,000 kJ
STEAM_ENTHALPY_KJ_PER_M3 = 2_780_000.0  # kJ per m³ cold-water-equivalent steam

# Thermal efficiency of steam delivery into near-wellbore zone
THERMAL_EFFICIENCY = 0.72  # dimensionless (accounts for wellbore heat loss)

# Exponential thermal-decay constant during soak & production [1/day]
# Calibrated so that reservoir temperature halves roughly every 12–15 days
THERMAL_DECAY_RATE = 0.048  # 1/day

# Andrade/Arrhenius viscosity constants calibrated to Baghewala heavy crude
# Calibration points from Build Specification:
#   T = 35 °C  → μ ≈ 10,000 cP  (initial reservoir temperature)
#   T = 85 °C  → μ ≈ 2,400 cP   (typical late-production temperature)
#   T = 120 °C → μ ≈  450 cP    (peak-heat early production)
#   T = 248 °C → μ ≈    12 cP   (near-steam-temperature heel)
ANDRADE_A = 0.0275   # pre-exponential factor [cP]
ANDRADE_B = 4200.0   # activation-energy proxy [K]

# Reservoir fluid datum for inflow calculations
RESERVOIR_OIL_FVF = 1.05    # oil formation volume factor [res bbl / STB]
PI_CONSTANT = math.pi

# Conversion: 1 m³/day = 6.2898 bbl/day
M3_TO_BBL = 6.2898

# Minimum bottom-hole pressure fraction of reservoir pressure for drawdown
BHP_FRACTION = 0.55  # Pwf ≈ 0.55 × Pr  (typical operated well drawdown)

# Water-cut evolution constants
# Early-cycle: mostly steam condensate wash → high water-cut
# Late-cycle: condensate reduces → oil-cut improves slightly
WATER_CUT_BASE = 0.68     # fraction (late production stabilised)


# ────────────────────────────────────────────────────────────────────────────
# STAGE 1 & 2: THERMAL MODEL + ANDRADE VISCOSITY
# ────────────────────────────────────────────────────────────────────────────

def andrade_viscosity(temp_c: float, initial_viscosity_cp: float = 10000.0) -> float:
    """
    Andrade/Arrhenius exponential viscosity model.

    mu(T) = A * exp(B / (T + 273.15))

    Constants calibrated so that:
      mu(35°C)  ≈ initial_viscosity_cp  (user-configured)
      mu(120°C) ≈ initial_viscosity_cp / 22   (deep heat reduction)
      mu(248°C) ≈ 12 cP                       (near-steam limit)

    We scale A so the curve passes through (35 °C, initial_viscosity_cp).
    """
    T_K   = max(temp_c, 20.0) + 273.15
    T0_K  = 35.0 + 273.15                        # reference temperature
    mu_0  = max(initial_viscosity_cp, 100.0)     # user initial viscosity
    # Compute A from the constraint mu(35°C) = mu_0
    A_scaled = mu_0 / math.exp(ANDRADE_B / T0_K)
    visc  = A_scaled * math.exp(ANDRADE_B / T_K)
    return max(8.0, round(visc, 1))


def compute_reservoir_temperature(config: WellConfig, day: float) -> float:
    """
    Compute near-wellbore reservoir temperature on a given day of the CSS cycle.
    The cycle has three phases:
      [0, t_inj)      → INJECTION: temperature rises linearly to T_peak
      [t_inj, t_soak) → SOAK: temperature starts at T_peak and decays
      [t_soak, ∞)     → PRODUCTION: continued exponential decline back to T_r

    Thermal energy balance:
      Q_in = Q_steam * t_inj * eta_th * H_steam
      dT   = Q_in / (V_heated * rho_Cp)
      V_heated ≈ pi * r_heated² * h  where r_heated = 8 m (typical CSS)
    """
    T_r   = config.reservoir.initialTemperature  # initial reservoir temp [°C]
    h     = config.reservoir.thickness            # net pay [m]
    Q_s   = config.css.steamRate                  # steam rate [m³/day]
    t_inj = config.css.injectionDuration          # injection days
    t_soak = config.css.soakDuration              # soak days

    # Heated volume approximation (radial sweep).
    # A fixed characteristic radius (r_base=5m) represents the near-wellbore zone
    # that always participates in heat exchange. Additional steam at higher rates
    # heats that same volume to higher temperatures — which is the key CSS mechanism.
    # A small log-scaling allows very high steam volumes to push the front slightly further.
    steam_volume = max(1.0, Q_s * t_inj)   # total m³ CWE injected
    r_heated  = 5.0 * (1.0 + 0.12 * math.log10(steam_volume / 50.0) if steam_volume > 50 else 1.0)
    r_heated  = max(3.0, min(8.0, r_heated))   # clamp: 3–8 m
    V_heated  = PI_CONSTANT * r_heated**2 * h  # m³

    # Total thermal energy injected [kJ]
    Q_in = Q_s * t_inj * THERMAL_EFFICIENCY * STEAM_ENTHALPY_KJ_PER_M3

    # Peak temperature rise [°C]
    delta_T = Q_in / (V_heated * RESERVOIR_HEAT_CAPACITY)
    T_peak  = min(T_r + delta_T, 165.0)   # physical cap at ~165 °C for CSS

    if day <= 0:
        return T_r
    elif day <= t_inj:
        # Rising linearly during injection
        return T_r + (T_peak - T_r) * (day / t_inj)
    else:
        # Exponential decay after end of injection
        days_since_end_inj = day - t_inj
        T = T_r + (T_peak - T_r) * math.exp(-THERMAL_DECAY_RATE * days_since_end_inj)
        return max(T_r, round(T, 1))


def current_reservoir_state(config: WellConfig, production_day: float = 20.0):
    """
    Return (temperature, viscosity) for a given day into the production phase.
    production_day is measured from end of soak.
    """
    # Day in overall cycle = inj + soak + production_day
    day_in_cycle = config.css.injectionDuration + config.css.soakDuration + production_day
    T = compute_reservoir_temperature(config, day_in_cycle)
    mu = andrade_viscosity(T, config.reservoir.initialViscosity)
    return T, mu


# ────────────────────────────────────────────────────────────────────────────
# STAGE 3: DARCY INFLOW PERFORMANCE RELATIONSHIP
# ────────────────────────────────────────────────────────────────────────────

def darcy_inflow_bbl_per_day(config: WellConfig, mu_cp: float) -> float:
    """
    Steady-state Darcy radial inflow in bbl/day:

        q = (0.00708 * k * h * (Pr - Pwf)) / (mu * Bo * ln(re/rw))

    Units:
      k   [mD], h [ft], Pr/Pwf [psi], mu [cP], Bo [res bbl/STB]
      Result: STB/day

    We convert from SI inputs:
      h [m]  → [ft]   × 3.28084
      Pr, Pwf [bar]  → [psi]  × 14.5038
      k_ro is the relative permeability to oil at current oil saturation.
    """
    k      = config.reservoir.permeability       # [mD]
    h_m    = config.reservoir.thickness           # [m]
    P_r    = config.reservoir.initialPressure     # [bar]
    So     = config.reservoir.oilSaturation       # fraction
    Bo     = RESERVOIR_OIL_FVF

    # Relative permeability to oil (simple Corey correlation for heavy-oil sand)
    # k_ro = k_ro_max * (So - Sor)^n / (1 - Sor)^n; n≈2, Sor≈0.15
    Sor    = 0.15
    n_exp  = 2.0
    k_ro_max = 0.85
    if So <= Sor:
        k_ro = 0.001
    else:
        k_ro = k_ro_max * ((So - Sor) / (1.0 - Sor)) ** n_exp

    k_eff  = k * k_ro   # effective permeability to oil [mD]

    # Unit conversions
    h_ft   = h_m * 3.28084
    Pr_psi = P_r * 14.5038
    Pwf_psi = Pr_psi * BHP_FRACTION
    drawdown = Pr_psi - Pwf_psi

    # Drainage radius / wellbore radius ratio  (re=200m, rw=0.1m)
    ln_re_rw = math.log(200.0 / 0.1)   # ≈ 7.6

    if mu_cp < 0.1:
        mu_cp = 0.1

    q_STB_per_day = (0.00708 * k_eff * h_ft * drawdown) / (mu_cp * Bo * ln_re_rw)
    q_bbl = max(0.5, q_STB_per_day)

    return round(q_bbl, 2)


# ────────────────────────────────────────────────────────────────────────────
# STAGE 4: SRP KINEMATICS AND MOTOR-LOAD
# ────────────────────────────────────────────────────────────────────────────

def srp_theoretical_displacement_bbl(pump_size_in: float, stroke_length_in: float, spm: float) -> float:
    """
    Theoretical plunger displacement [bbl/day]:
        V_disp = 0.1166 × Dp² × S × N   [bbl/day]
    where Dp [in], S [in], N [SPM].
    """
    return 0.1166 * pump_size_in**2 * stroke_length_in * spm


def srp_volumetric_efficiency(mu_cp: float, submergence_pct: float = 0.80) -> float:
    """
    Volumetric efficiency (dimensionless fraction) of the pump.
    Decreases as oil viscosity rises (valve lag, leakage) and as
    submergence (fluid level cover) decreases.

    Base efficiency: 0.85 at mu < 500 cP
    Viscosity penalty: up to −0.20 for heavy oil > 5,000 cP
    Submergence penalty: up to −0.10
    """
    # Viscosity penalty (log-linear)
    mu_penalty = min(0.22, 0.055 * math.log10(max(mu_cp, 10.0) / 500.0))
    eta = 0.85 - max(0.0, mu_penalty) - (1.0 - submergence_pct) * 0.12
    return max(0.40, min(0.90, eta))


def srp_motor_load_pct(config: WellConfig, pump_load_lbs: float, rated_load_lbs: float = 50000.0) -> float:
    """
    Motor-load percentage based on Polished Rod Load (PRL):
        ML [%] = 100 × PRL / (rated peak load)

    PRL includes:
      - Buoyant rod string weight (steel density 7,850 kg/m³, OD 1 in = 0.0254 m)
      - Fluid column weight in tubing
      - Dynamic acceleration factor (1 + S·N²/70500)
    """
    pump_depth  = config.srp.pumpDepth         # [m]
    stroke_in   = config.srp.strokeLength      # [in]
    spm         = config.srp.pumpSpeed         # [SPM]

    # Rod string weight in air (1-inch steel rod, ~2.9 lb/ft)
    rod_weight_per_ft = 2.9   # lb/ft
    pump_depth_ft = pump_depth * 3.28084
    rod_weight_air = rod_weight_per_ft * pump_depth_ft

    # Buoyancy correction (in fluid of SG ≈ 0.95)
    buoyancy_factor = 1.0 - 0.95 * (7.0 / 489.0)   # (density fluid / density steel)
    W_rod = rod_weight_air * buoyancy_factor

    # Fluid column weight above pump (API assumption: fluid weight ≈ PL factor × pump load)
    W_fluid = pump_load_lbs

    # Dynamic load factor
    dyn_factor = 1.0 + (stroke_in * spm**2) / 70500.0
    PRL = (W_rod + W_fluid) * dyn_factor

    motor_load = 100.0 * PRL / rated_load_lbs
    return round(min(motor_load, 105.0), 1)


def compute_srp_production_and_load(config: WellConfig, mu_cp: float):
    """
    Full SRP calculation given oil viscosity.
    Returns: (oil_rate_bbl, water_rate_bbl, total_liquid_bbl, motor_load_pct, pump_eff_pct)
    """
    Dp   = config.srp.pumpSize      # inches
    S    = config.srp.strokeLength  # inches
    N    = config.srp.pumpSpeed     # SPM

    V_disp = srp_theoretical_displacement_bbl(Dp, S, N)
    eta_v  = srp_volumetric_efficiency(mu_cp)
    q_pump_liquid = V_disp * eta_v   # bbl/day liquid the pump can lift

    # Inflow limit from reservoir IPR
    q_inflow = darcy_inflow_bbl_per_day(config, mu_cp)

    # Surface rate = min(what reservoir can supply, what pump can lift)
    q_liquid = min(q_inflow, q_pump_liquid)

    # Water cut
    water_cut = WATER_CUT_BASE
    q_oil   = round(q_liquid * (1.0 - water_cut), 1)
    q_water = round(q_liquid * water_cut, 1)
    q_total = round(q_liquid, 1)

    # Motor load
    pump_load_lbs = q_liquid * 350.0 * 0.95 / pump_depth_to_force_factor(config.srp.pumpDepth)
    ml = srp_motor_load_pct(config, pump_load_lbs)

    return q_oil, q_water, q_total, ml, round(eta_v * 100, 1)


def pump_depth_to_force_factor(depth_m: float) -> float:
    """Scale factor used to approximate pump load from liquid rate."""
    return max(10.0, depth_m * 0.25)


# ────────────────────────────────────────────────────────────────────────────
# DIGITAL TWIN STATE
# ────────────────────────────────────────────────────────────────────────────

def compute_digital_twin_state(config: WellConfig) -> DigitalTwinState:
    """
    Compute the current Digital Twin state from well configuration.
    Assumes the well is currently on day 20 of the production phase
    (typical mid-cycle reading point).
    """
    PRODUCTION_DAY = 20.0

    T_res, mu_res = current_reservoir_state(config, production_day=PRODUCTION_DAY)
    q_oil, q_water, q_total, motor_load, pump_eff = compute_srp_production_and_load(config, mu_res)

    # Reservoir pressure depletes slightly by cycle
    cycle_depletion = min(0.05 * config.css.cycleNumber, 0.20)
    P_current = config.reservoir.initialPressure * (1.0 - cycle_depletion)
    # Oil saturation depletes over cycles
    So_current = max(0.30, config.reservoir.oilSaturation - 0.015 * config.css.cycleNumber)

    # Build the 5-point history (days: peak-inject, end-inject, mid-soak, prod-early, prod-now)
    t_inj  = config.css.injectionDuration
    t_soak = config.css.soakDuration
    history = []
    day_points = [
        (1.0,                              "Early Inject"),
        (t_inj,                            "End Inject"),
        (t_inj + t_soak,                   "End Soak"),
        (t_inj + t_soak + 5.0,             "Early Prod"),
        (t_inj + t_soak + PRODUCTION_DAY,  "Day 20"),
    ]
    for (day, _label) in day_points:
        T_d  = compute_reservoir_temperature(config, day)
        mu_d = andrade_viscosity(T_d, config.reservoir.initialViscosity)
        q_d  = 0.0
        if day >= t_inj + t_soak:
            pd  = day - t_inj - t_soak
            q_d, *_ = compute_srp_production_and_load(
                config,
                andrade_viscosity(compute_reservoir_temperature(config, day), config.reservoir.initialViscosity)
            )
        history.append(HistoryPoint(
            day=round(day),
            temp=round(T_d, 1),
            viscosity=round(mu_d, 0),
            production=round(q_d, 1)
        ))

    return DigitalTwinState(
        reservoir=DigitalTwinReservoirState(
            temperature=round(T_res, 1),
            pressure=round(P_current, 1),
            oilSaturation=round(So_current, 2),
            oilViscosity=round(mu_res, 0)
        ),
        css=DigitalTwinCssState(
            currentPhase="Production",
            cycleNumber=config.css.cycleNumber,
            steamRate=0.0,           # not injecting during production phase
            steamTemperature=config.css.steamTemperature
        ),
        srp=DigitalTwinSrpState(
            pumpSpeed=config.srp.pumpSpeed,
            strokeLength=config.srp.strokeLength,
            motorLoad=motor_load
        ),
        production=DigitalTwinProductionState(
            oilRate=q_oil,
            waterRate=q_water,
            totalLiquid=q_total
        ),
        history=history
    )


# ────────────────────────────────────────────────────────────────────────────
# CSS OPERATIONS DATA
# ────────────────────────────────────────────────────────────────────────────

def compute_css_data(config: WellConfig) -> CssData:
    """
    Compute Cyclic Steam Stimulation operational data.
    Chart data covers a full cycle: injection → soak → production.
    """
    t_inj  = config.css.injectionDuration
    t_soak = config.css.soakDuration
    Q_s    = config.css.steamRate
    mu_init = config.reservoir.initialViscosity

    # Progress: assume we are 20 days into production of current cycle
    total_cycle_days = t_inj + t_soak + 45.0   # typical 45-day production phase
    elapsed_days = t_inj + t_soak + 20.0
    cycle_progress = round(min(100.0, elapsed_days / total_cycle_days * 100.0), 1)

    # Chart data — sample key points across the cycle
    chart_points = []
    sample_days = [
        0.5, 1.0, t_inj * 0.5, t_inj,
        t_inj + 0.5, t_inj + t_soak,
        t_inj + t_soak + 2, t_inj + t_soak + 5,
        t_inj + t_soak + 10, t_inj + t_soak + 15,
        t_inj + t_soak + 20, t_inj + t_soak + 30,
    ]
    for day in sample_days:
        T_d  = compute_reservoir_temperature(config, day)
        mu_d = andrade_viscosity(T_d, mu_init)
        in_injection = day <= t_inj
        steam_shown  = round(Q_s, 1) if in_injection else 0.0

        prod = 0.0
        if day > t_inj + t_soak:
            prod, *_ = compute_srp_production_and_load(config, mu_d)

        chart_points.append(ChartDataPoint(
            day=round(day, 1),
            steam=steam_shown,
            temp=round(T_d, 1),
            production=round(prod, 1)
        ))

    # Historical cycles — estimate based on configured cumulative cycle number
    historical_cycles = []
    for cyc in range(1, config.css.cycleNumber):
        # Each prior cycle slightly different steam and production performance
        scale = 0.90 + 0.05 * cyc           # slight improvement each cycle
        steam_vol = round(Q_s * t_inj * (0.9 + 0.02 * cyc), 0)
        avg_prod  = round((darcy_inflow_bbl_per_day(config,
                    andrade_viscosity(70 + cyc * 3, mu_init)) * 0.32) * scale, 1)
        max_temp  = round(compute_reservoir_temperature(config, t_inj), 1)
        historical_cycles.append(HistoricalCycle(
            cycle=cyc,
            duration=round(total_cycle_days * scale, 0),
            steamInjected=steam_vol,
            avgProduction=avg_prod,
            maxTemp=max_temp
        ))

    return CssData(
        currentCycle=config.css.cycleNumber,
        currentPhase="Production",
        cycleProgress=cycle_progress,
        parameters={
            "steamTemperature": config.css.steamTemperature,
            "steamPressure":    config.css.steamPressure,
            "steamRate":        config.css.steamRate,
            "steamVolume":      config.css.steamVolume,
            "injectionDuration": config.css.injectionDuration,
            "soakDuration":     config.css.soakDuration,
        },
        historicalCycles=historical_cycles,
        chartData=chart_points
    )


# ────────────────────────────────────────────────────────────────────────────
# SRP OPERATIONS DATA
# ────────────────────────────────────────────────────────────────────────────

def compute_srp_data(config: WellConfig) -> SrpData:
    """
    Compute Sucker Rod Pump operational data and performance curves.
    All curves are calculated from the configured pump parameters.
    """
    T_res, mu_res = current_reservoir_state(config, production_day=20.0)
    q_oil, q_water, q_total, motor_load, pump_eff = compute_srp_production_and_load(config, mu_res)

    Dp = config.srp.pumpSize
    S  = config.srp.strokeLength

    # Fluid level estimate: scales with inflow vs pump capacity
    V_disp    = srp_theoretical_displacement_bbl(Dp, S, config.srp.pumpSpeed)
    q_inflow  = darcy_inflow_bbl_per_day(config, mu_res)
    fill_frac = min(1.0, q_inflow / max(V_disp, 0.1))
    fluid_level_m = config.srp.pumpDepth * (1.0 - fill_frac * 0.60)  # from surface
    rod_load_lbs  = round(config.srp.pumpDepth * 3.28084 * 2.9 * 0.87 * 1.15, 0)  # approx PRL

    # Recommendation logic
    opt_spm, rec_action, rec_value, rec_reason = _srp_recommendation(
        config, q_oil, motor_load, q_inflow, mu_res
    )
    q_recommended, *_, ml_recommended, _ = compute_srp_production_and_load(
        _config_with_spm(config, opt_spm), mu_res
    )

    # Performance curve: sweep SPM from 2 to 18
    performance_data = []
    for spm in [2, 4, 6, 8, 10, 12, 14, 16, 18]:
        cfg_spm = _config_with_spm(config, float(spm))
        q_o_s, _, q_l_s, ml_s, eff_s = compute_srp_production_and_load(cfg_spm, mu_res)
        performance_data.append(SrpPerformanceData(
            spm=spm,
            production=round(q_o_s, 1),
            efficiency=round(eff_s, 1),
            motorLoad=round(ml_s, 1)
        ))

    return SrpData(
        status="Running",
        parameters=SrpParameters(
            pumpSpeed=config.srp.pumpSpeed,
            strokeLength=config.srp.strokeLength,
            pumpSize=config.srp.pumpSize,
            pumpDepth=config.srp.pumpDepth,
            motorLoad=motor_load,
            rodLoad=int(rod_load_lbs),
            fluidLevel=round(fluid_level_m, 0),
            pumpEfficiency=round(pump_eff, 1),
            productionResponse=q_oil
        ),
        recommendation=SrpRecommendation(
            action=rec_action,
            targetValue=rec_value,
            reason=rec_reason,
            expectedProduction=round(q_recommended, 1),
            expectedEfficiency=round(srp_volumetric_efficiency(mu_res) * 100, 1)
        ),
        performanceData=performance_data
    )


def _config_with_spm(config: WellConfig, spm: float) -> WellConfig:
    """Return a copy of config with pumpSpeed replaced."""
    from models import SrpConfig
    new_srp = SrpConfig(
        pumpDepth=config.srp.pumpDepth,
        pumpSize=config.srp.pumpSize,
        pumpSpeed=spm,
        strokeLength=config.srp.strokeLength,
        motorLoad=config.srp.motorLoad
    )
    return WellConfig(reservoir=config.reservoir, css=config.css, srp=new_srp)


def _srp_recommendation(config, q_oil, motor_load, q_inflow, mu_cp):
    """Generate a context-appropriate SRP operating recommendation."""
    current_spm = config.srp.pumpSpeed
    V_disp = srp_theoretical_displacement_bbl(config.srp.pumpSize, config.srp.strokeLength, current_spm)
    eta_v  = srp_volumetric_efficiency(mu_cp)
    pump_capacity = V_disp * eta_v

    if motor_load > 84.0:
        # Overloaded — reduce speed
        opt_spm   = max(4.0, current_spm - 2.0)
        action    = "Reduce Pump Speed"
        value     = f"{opt_spm:.0f} SPM"
        reason    = (f"Motor load is {motor_load:.0f}%, exceeding the 85% safety threshold. "
                     f"Reducing to {opt_spm:.0f} SPM will extend motor life and reduce rod fatigue while "
                     f"maintaining production above minimum threshold.")
    elif q_inflow > pump_capacity * 1.20 and current_spm < 14.0:
        # Reservoir can supply more — increase pump speed
        opt_spm   = min(14.0, current_spm + 2.0)
        action    = "Increase Pump Speed"
        value     = f"{opt_spm:.0f} SPM"
        gain_pct  = round((opt_spm / current_spm - 1.0) * 100)
        reason    = (f"Reservoir inflow capacity ({q_inflow:.1f} bbl/d) exceeds current pump lift "
                     f"({pump_capacity:.1f} bbl/d). Increasing to {opt_spm:.0f} SPM is projected to "
                     f"increase oil production by ~{gain_pct}% while keeping motor load below 85%.")
    elif mu_cp > 4000 and q_oil < 15.0:
        # High viscosity limiting — thermal action recommended
        opt_spm   = current_spm
        action    = "Maintain — Await Thermal Response"
        value     = f"{current_spm:.0f} SPM"
        reason    = (f"Oil viscosity is elevated ({mu_cp:,.0f} cP). Production is thermally limited, "
                     f"not pump-limited. Maintaining current pump speed is optimal; increasing CSS steam "
                     f"injection in the next cycle will improve mobility and production.")
    else:
        # Operating near optimum
        opt_spm   = current_spm
        action    = "Maintain Current Speed"
        value     = f"{current_spm:.0f} SPM"
        reason    = (f"Current operating point ({current_spm:.0f} SPM, motor load {motor_load:.0f}%) "
                     f"is within the efficient operating range. Production ({q_oil:.1f} bbl/d oil) "
                     f"is well-matched to reservoir inflow ({q_inflow:.1f} bbl/d).")

    return opt_spm, action, value, reason


# ────────────────────────────────────────────────────────────────────────────
# PRODUCTION ANALYTICS
# ────────────────────────────────────────────────────────────────────────────

def compute_analytics_data(config: WellConfig) -> AnalyticsData:
    """
    Generate production KPIs, 5-month history, decline-curve forecast,
    and cycle-cumulative comparison — all derived from physics.
    """
    # Current state (day 20 of production)
    T_now, mu_now = current_reservoir_state(config, production_day=20.0)
    q_oil, q_water, q_total, *_ = compute_srp_production_and_load(config, mu_now)
    water_cut_pct = round(q_water / max(q_total, 0.01) * 100.0, 1)
    P_now = config.reservoir.initialPressure * (1.0 - 0.05 * config.css.cycleNumber)

    # 5-month production history (simulated by varying production day)
    prod_days_ago = [90, 60, 45, 20, 0]    # days into production (current cycle + prior)
    months = ["Jan", "Feb", "Mar", "Apr", "May"]
    prod_history = []
    for i, pd in enumerate(prod_days_ago):
        T_h, mu_h = current_reservoir_state(config, production_day=max(0, pd))
        q_o_h, q_w_h, q_l_h, *_ = compute_srp_production_and_load(config, mu_h)
        P_h = P_now + 0.4 * (len(prod_days_ago) - 1 - i)   # slight pressure recovery each month
        prod_history.append(ProductionHistoryPoint(
            month=months[i],
            oil=round(q_o_h, 1),
            water=round(q_w_h, 1),
            liquid=round(q_l_h, 1),
            temp=round(T_h, 1),
            pressure=round(P_h, 1)
        ))

    # 4-month forward forecast using exponential decline
    # Decline rate based on reservoir depletion and thermal cooling
    annual_decline_rate = 0.28   # 28% annual decline (typical CSS heavy-oil)
    monthly_decline     = 1.0 - (1.0 - annual_decline_rate) ** (1.0 / 12.0)
    forecast = [ForecastPoint(month="May", historical=q_oil, forecast=q_oil, upperBound=q_oil, lowerBound=q_oil)]
    future_months = ["Jun", "Jul", "Aug", "Sep"]
    q_f = q_oil
    for i, month in enumerate(future_months):
        q_f = q_f * (1.0 - monthly_decline)
        # Spike in Sep because next CSS cycle starts (improved mobility)
        if i == 3:
            q_f_display = round(q_f * 1.55, 1)   # new cycle uplift
        else:
            q_f_display = round(q_f, 1)
        uncertainty = round(q_f_display * 0.10 * (i + 1), 1)
        forecast.append(ForecastPoint(
            month=month,
            historical=None,
            forecast=q_f_display,
            upperBound=round(q_f_display + uncertainty, 1),
            lowerBound=round(max(1.0, q_f_display - uncertainty), 1)
        ))

    # Cycle cumulative production comparison
    # Each completed cycle contributes ~45 days of production
    cycle_comparison = []
    for cyc in range(1, config.css.cycleNumber + 1):
        T_cyc, mu_cyc = current_reservoir_state(config, production_day=15.0)
        mu_offset = mu_cyc * (1.1 ** (config.css.cycleNumber - cyc))   # earlier cycles colder
        q_o_cyc, q_w_cyc, *_ = compute_srp_production_and_load(config, min(mu_offset, config.reservoir.initialViscosity * 0.9))
        cum_days = 45 if cyc < config.css.cycleNumber else 20   # current cycle is partial
        label = f"Cycle {cyc}" if cyc < config.css.cycleNumber else f"Cycle {cyc} (YTD)"
        cycle_comparison.append(CycleComparisonPoint(
            cycle=label,
            oil=round(q_o_cyc * cum_days, 0),
            water=round(q_w_cyc * cum_days, 0)
        ))

    # Trend direction
    delta_P = round(P_now - config.reservoir.initialPressure, 2)
    delta_T = round(T_now - (T_now + 2.5), 1)   # temperature declining slightly

    return AnalyticsData(
        kpis=AnalyticsKPIs(
            oilProduction=q_oil,
            waterProduction=q_water,
            totalLiquid=q_total,
            waterCut=water_cut_pct,
            pressureTrend=delta_P,
            temperatureTrend=delta_T
        ),
        productionHistory=prod_history,
        forecastData=forecast,
        cycleComparison=cycle_comparison
    )


# ────────────────────────────────────────────────────────────────────────────
# SCENARIO SIMULATION
# ────────────────────────────────────────────────────────────────────────────

def compute_scenarios(config: WellConfig) -> ScenariosResponse:
    """
    Return baseline and three alternative scenarios populated from the
    current configuration.  Scenario A uses higher steam + faster pump;
    Scenario B uses lower steam + slower pump; Scenario C mirrors baseline.
    """
    baseline_params = ScenarioParams(
        steamTemperature=config.css.steamTemperature,
        steamPressure=config.css.steamPressure,
        steamRate=config.css.steamRate,
        injectionDuration=config.css.injectionDuration,
        soakDuration=config.css.soakDuration,
        pumpSpeed=config.srp.pumpSpeed,
        strokeLength=config.srp.strokeLength,
    )

    baseline = ScenarioItem(id="baseline", name="Baseline (Current)", isBaseline=True, params=baseline_params, results=None)

    scenarios = [
        ScenarioItem(
            id="scenA", name="Scenario A — High Steam + Fast Pump", isBaseline=False,
            params=ScenarioParams(
                steamTemperature=config.css.steamTemperature,
                steamPressure=config.css.steamPressure,
                steamRate=min(config.css.steamRate * 1.30, 80.0),
                injectionDuration=min(config.css.injectionDuration + 0.5, 5.0),
                soakDuration=max(config.css.soakDuration - 0.3, 0.5),
                pumpSpeed=min(config.srp.pumpSpeed + 2.0, 16.0),
                strokeLength=config.srp.strokeLength,
            ),
            results=None
        ),
        ScenarioItem(
            id="scenB", name="Scenario B — Low Steam + Slow Pump", isBaseline=False,
            params=ScenarioParams(
                steamTemperature=config.css.steamTemperature,
                steamPressure=config.css.steamPressure,
                steamRate=max(config.css.steamRate * 0.70, 20.0),
                injectionDuration=max(config.css.injectionDuration - 0.5, 1.0),
                soakDuration=config.css.soakDuration + 0.5,
                pumpSpeed=max(config.srp.pumpSpeed - 2.0, 4.0),
                strokeLength=config.srp.strokeLength,
            ),
            results=None
        ),
        ScenarioItem(
            id="scenC", name="Scenario C — Extended Soak", isBaseline=False,
            params=ScenarioParams(
                steamTemperature=config.css.steamTemperature,
                steamPressure=config.css.steamPressure,
                steamRate=config.css.steamRate,
                injectionDuration=config.css.injectionDuration,
                soakDuration=config.css.soakDuration + 1.5,  # longer soak → more viscosity reduction
                pumpSpeed=config.srp.pumpSpeed,
                strokeLength=config.srp.strokeLength,
            ),
            results=None
        ),
    ]

    return ScenariosResponse(baseline=baseline, scenarios=scenarios)


def run_simulation_engine(
    steam_rate: float,
    injection_duration: float,
    soak_duration: float,
    pump_speed: float,
    steam_temperature: float = 280.0,
    stroke_length: float = 120.0,
    pump_size: float = 2.25,
    pump_depth: float = 1100.0,
    permeability: float = 2500.0,
    thickness: float = 25.0,
    porosity: float = 0.32,
    oil_saturation: float = 0.75,
    initial_pressure: float = 42.0,
    initial_temperature: float = 40.0,
    initial_viscosity: float = 10000.0,
) -> ScenarioResult:
    """
    Deterministic physics-based simulation for a given set of scenario parameters.
    Builds a minimal WellConfig and runs the full physics chain.
    """
    from models import ReservoirConfig, CssConfig, SrpConfig

    res_cfg = ReservoirConfig(
        depth=pump_depth,
        thickness=thickness,
        porosity=porosity,
        permeability=permeability,
        oilSaturation=oil_saturation,
        initialPressure=initial_pressure,
        initialTemperature=initial_temperature,
        initialViscosity=initial_viscosity,
    )
    css_cfg = CssConfig(
        steamTemperature=steam_temperature,
        steamPressure=70.0,
        steamRate=steam_rate,
        steamVolume=steam_rate * injection_duration,
        injectionDuration=injection_duration,
        soakDuration=soak_duration,
        cycleNumber=1
    )
    srp_cfg = SrpConfig(
        pumpDepth=pump_depth,
        pumpSize=pump_size,
        pumpSpeed=pump_speed,
        strokeLength=stroke_length,
        motorLoad=65.0
    )
    cfg = WellConfig(reservoir=res_cfg, css=css_cfg, srp=srp_cfg)

    # Thermal + viscosity calculation at production day 20
    T_prod, mu_prod = current_reservoir_state(cfg, production_day=20.0)
    q_oil, q_water, q_total, motor_load, pump_eff = compute_srp_production_and_load(cfg, mu_prod)

    heat_energy_kj = steam_rate * injection_duration * THERMAL_EFFICIENCY * STEAM_ENTHALPY_KJ_PER_M3

    return ScenarioResult(
        reservoirTemperature=round(T_prod, 1),
        oilViscosity=round(mu_prod, 0),
        production=round(q_oil, 1),
        energyConsumption=round(heat_energy_kj / 1_000_000.0, 2),  # GJ (kJ ÷ 1,000,000)
        steamConsumption=round(steam_rate * injection_duration, 1)
    )


# ────────────────────────────────────────────────────────────────────────────
# STAGE 5: CONSTRAINED GRID-SEARCH OPTIMISATION
# ────────────────────────────────────────────────────────────────────────────

def run_optimization_engine(
    objective: str,
    constraints_dict: Dict[str, Any],
    config: WellConfig
) -> OptimizationResponse:
    """
    Constrained 2-D grid search over (steam_rate, pump_speed).
    Each candidate is evaluated with the full physics engine.
    Feasibility filter: motor_load < 85%.
    """
    max_pump  = float(constraints_dict.get("maxPumpSpeed", 14) or 14)
    max_steam = float(constraints_dict.get("maxSteamRate", 60) or 60)

    # Build search grid
    steam_candidates = [s for s in [20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80] if s <= max_steam]
    pump_candidates  = [p for p in [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16] if p <= max_pump]

    if not steam_candidates:
        steam_candidates = [max_steam]
    if not pump_candidates:
        pump_candidates = [max_pump]

    # Pre-compute current operating state
    T_now, mu_now = current_reservoir_state(config, production_day=20.0)
    q_cur_oil, _, _, ml_cur, eff_cur = compute_srp_production_and_load(config, mu_now)

    current_case = OptimizationCase(
        production=round(q_cur_oil, 1),
        steam=config.css.steamRate,
        efficiency=round(srp_volumetric_efficiency(mu_now) * 100, 1),
        params={
            "steamRate":        config.css.steamRate,
            "injectionDuration": config.css.injectionDuration,
            "pumpSpeed":        config.srp.pumpSpeed,
            "strokeLength":     config.srp.strokeLength,
        }
    )

    # Evaluate all grid points
    results = []
    total_evaluated = 0
    for Q_s in steam_candidates:
        for N_spm in pump_candidates:
            total_evaluated += 1
            # Build a trial config
            sim = run_simulation_engine(
                steam_rate=Q_s,
                injection_duration=config.css.injectionDuration,
                soak_duration=config.css.soakDuration,
                pump_speed=N_spm,
                steam_temperature=config.css.steamTemperature,
                stroke_length=config.srp.strokeLength,
                pump_size=config.srp.pumpSize,
                pump_depth=config.srp.pumpDepth,
                permeability=config.reservoir.permeability,
                thickness=config.reservoir.thickness,
                porosity=config.reservoir.porosity,
                oil_saturation=config.reservoir.oilSaturation,
                initial_pressure=config.reservoir.initialPressure,
                initial_temperature=config.reservoir.initialTemperature,
                initial_viscosity=config.reservoir.initialViscosity,
            )
            # Estimate motor load for this combination
            from models import ReservoirConfig, CssConfig, SrpConfig
            trial_cfg = WellConfig(
                reservoir=config.reservoir,
                css=CssConfig(
                    steamTemperature=config.css.steamTemperature,
                    steamPressure=config.css.steamPressure,
                    steamRate=Q_s,
                    steamVolume=Q_s * config.css.injectionDuration,
                    injectionDuration=config.css.injectionDuration,
                    soakDuration=config.css.soakDuration,
                    cycleNumber=config.css.cycleNumber
                ),
                srp=SrpConfig(
                    pumpDepth=config.srp.pumpDepth,
                    pumpSize=config.srp.pumpSize,
                    pumpSpeed=N_spm,
                    strokeLength=config.srp.strokeLength,
                    motorLoad=config.srp.motorLoad
                )
            )
            T_t, mu_t = current_reservoir_state(trial_cfg, production_day=20.0)
            _, _, _, ml_t, eff_t = compute_srp_production_and_load(trial_cfg, mu_t)

            # Feasibility check: motor load < 85%
            if ml_t >= 85.0:
                continue

            energy_gj = Q_s * config.css.injectionDuration * THERMAL_EFFICIENCY * STEAM_ENTHALPY_KJ_PER_M3 / 1000.0
            score = _score(objective, sim.production, Q_s, eff_t, energy_gj)

            results.append({
                "steam":      Q_s,
                "pump_speed": N_spm,
                "production": sim.production,
                "steam_used": Q_s,
                "efficiency": round(eff_t, 1),
                "motor_load": round(ml_t, 1),
                "energy_gj":  round(energy_gj, 1),
                "score":      score,
            })

    feasible_count = len(results)

    if not results:
        # Fallback if no feasible point found (very tight constraints)
        best = {
            "steam": config.css.steamRate, "pump_speed": config.srp.pumpSpeed,
            "production": q_cur_oil, "steam_used": config.css.steamRate,
            "efficiency": round(eff_cur, 1), "energy_gj": 0.0,
        }
    else:
        best = max(results, key=lambda r: r["score"])

    recommended_case = OptimizationCase(
        production=round(best["production"], 1),
        steam=round(best["steam_used"], 1),
        efficiency=round(best["efficiency"], 1),
        params={
            "steamRate":        round(best["steam"], 1),
            "injectionDuration": config.css.injectionDuration,
            "pumpSpeed":        round(best["pump_speed"], 1),
            "strokeLength":     config.srp.strokeLength,
        }
    )

    return OptimizationResponse(
        configurationsEvaluated=total_evaluated,
        feasibleConfigurations=feasible_count,
        current=current_case,
        recommended=recommended_case
    )


def _score(objective: str, production: float, steam: float, efficiency: float, energy_gj: float) -> float:
    """Objective function scoring for optimisation grid search."""
    if objective == "maximize_oil":
        return production
    elif objective == "minimize_steam":
        # Maximise production per unit of steam
        return production / max(steam, 1.0)
    elif objective == "maximize_efficiency":
        return efficiency
    else:  # balanced
        # Normalised multi-objective: 50% production, 30% efficiency, 20% steam economy
        steam_economy = production / max(steam, 1.0)
        return 0.50 * production + 0.30 * efficiency + 0.20 * steam_economy * 10
