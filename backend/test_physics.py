import engine
from state import state_manager
cfg = state_manager.get_config()

# Test viscosity at different temperatures (sanity check Andrade curve)
print("-- Andrade Viscosity Curve --")
for t in [35, 60, 85, 120, 160]:
    v = engine.andrade_viscosity(t, 10000)
    print(f"  T={t:3d}C -> visc={v:8.0f} cP")

# Test thermal model at key days
print("-- Thermal model (injection 2.5d, soak 1.5d) --")
for day in [0, 1, 2.5, 3, 4, 8, 20, 30]:
    T = engine.compute_reservoir_temperature(cfg, day)
    mu = engine.andrade_viscosity(T, cfg.reservoir.initialViscosity)
    print(f"  day={day:5.1f}: T={T:5.1f}C, mu={mu:7.0f} cP")

# Test SRP at peak-heat conditions
print("-- SRP production at T=100C (mid-production) --")
q_oil, q_water, q_total, ml, eff = engine.compute_srp_production_and_load(cfg, engine.andrade_viscosity(100, 10000))
print(f"  oil={q_oil} bbl/d, water={q_water}, total={q_total}, motorLoad={ml}%, eff={eff}%")

# Test simulation engine
print("-- run_simulation_engine --")
sim = engine.run_simulation_engine(
    steam_rate=45, injection_duration=2.5, soak_duration=1.5, pump_speed=10,
    permeability=2500, thickness=25, initial_viscosity=10000
)
print(f"  T_res={sim.reservoirTemperature}C, visc={sim.oilViscosity}cP, prod={sim.production} bbl/d")

# Test optimization
print("-- Optimization grid search (balanced) --")
res = engine.run_optimization_engine("balanced", {"maxPumpSpeed": 14, "maxSteamRate": 60}, cfg)
print(f"  Evaluated={res.configurationsEvaluated}, Feasible={res.feasibleConfigurations}")
print(f"  Current: prod={res.current.production} bbl/d")
rec_pump = res.recommended.params.get("pumpSpeed")
rec_steam = res.recommended.params.get("steamRate")
print(f"  Recommended: pump={rec_pump} SPM, steam={rec_steam} m3/d, prod={res.recommended.production} bbl/d")
