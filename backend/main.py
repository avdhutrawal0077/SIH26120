import uvicorn
from fastapi import FastAPI, APIRouter, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from models import (
    WellConfig, StandardResponse, DigitalTwinState, CssData,
    SrpData, AnalyticsData, ScenariosResponse, SimulateRequest,
    ScenarioResult, OptimizationRequest, OptimizationResponse,
    EventsResponse
)
from state import state_manager
from engine import (
    compute_digital_twin_state, compute_css_data, compute_srp_data,
    compute_analytics_data, compute_scenarios, run_simulation_engine,
    run_optimization_engine
)

app = FastAPI(
    title="SIH26120 Heavy-Oil Well Digital Twin API",
    version="1.0.0",
    description="REST API backend implementation for SIH26120 Heavy-Oil Well Optimization platform."
)

# Enable CORS for local development and frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router with Base URL /api/v1
api_v1 = APIRouter(prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SIH26120 Digital Twin API", "version": "1.0.0"}

# --- 1. Well Configuration ---

@api_v1.get("/config", response_model=WellConfig, summary="Get Virtual Well Configuration")
def get_well_config():
    """Retrieves the current virtual well configuration."""
    return state_manager.get_config()

@api_v1.put("/config", summary="Update Well Configuration")
def update_well_config(new_config: WellConfig):
    """Updates the well configuration."""
    updated = state_manager.update_config(new_config)
    return {
        "success": True,
        "data": updated.model_dump()
    }

@api_v1.post("/config/reset", summary="Reset Well Configuration")
def reset_well_config():
    """Resets the well configuration to initial defaults and clears digital twin initialization state."""
    reset_data = state_manager.reset_config()
    return {
        "success": True,
        "data": reset_data.model_dump()
    }

# --- 2. Digital Twin ---

@api_v1.post("/digital-twin/initialize", summary="Initialize Digital Twin")
def initialize_digital_twin():
    """Initializes the digital twin simulation environment based on the current configuration."""
    message = state_manager.initialize_digital_twin()
    return {
        "success": True,
        "message": message
    }

@api_v1.get("/digital-twin/state", response_model=DigitalTwinState, summary="Get Digital Twin State")
def get_digital_twin_state():
    """Retrieves the current state of the Digital Twin."""
    cfg = state_manager.get_config()
    return compute_digital_twin_state(cfg)

# --- 3. Operations Data ---

@api_v1.get("/css/data", response_model=CssData, summary="Get CSS Operations Data")
def get_css_data():
    """Retrieves Cyclic Steam Stimulation (CSS) parameters and historical performance."""
    cfg = state_manager.get_config()
    return compute_css_data(cfg)

@api_v1.get("/srp/data", response_model=SrpData, summary="Get SRP Operations Data")
def get_srp_data():
    """Retrieves Sucker Rod Pump (SRP) data, current performance, and recommendations."""
    cfg = state_manager.get_config()
    return compute_srp_data(cfg)

# --- 4. Analytics ---

@api_v1.get("/analytics", response_model=AnalyticsData, summary="Get Analytics and Forecasts")
def get_analytics():
    """Retrieves KPIs, historical production, and forecast data."""
    cfg = state_manager.get_config()
    return compute_analytics_data(cfg)

# --- 5. Scenario Simulation ---

@api_v1.get("/scenarios", response_model=ScenariosResponse, summary="Get Scenarios")
def get_scenarios():
    """Retrieves the list of configured scenarios for simulation."""
    cfg = state_manager.get_config()
    return compute_scenarios(cfg)

@api_v1.post("/scenarios/simulate", response_model=ScenarioResult, summary="Simulate Scenario")
def simulate_scenario(req: SimulateRequest):
    """Runs deterministic simulation on given scenario parameters."""
    res = run_simulation_engine(
        steam_rate=req.steamRate,
        injection_duration=req.injectionDuration,
        soak_duration=req.soakDuration,
        pump_speed=req.pumpSpeed
    )
    state_manager.add_event(
        "system",
        "Simulation Executed",
        f"Simulated: Steam {req.steamRate} m³/d, Inj {req.injectionDuration} d, Pump {req.pumpSpeed} SPM -> Prod {res.production} bbl/d."
    )
    return res

# --- 6. Optimization ---

@api_v1.post("/optimization/run", response_model=OptimizationResponse, summary="Run Optimization Engine")
def run_optimization(req: OptimizationRequest):
    """Runs an optimization search given an objective and constraints."""
    cfg = state_manager.get_config()
    constraints_dict = req.constraints.model_dump() if req.constraints else {}
    res = run_optimization_engine(req.objective, constraints_dict, cfg)
    state_manager.add_event(
        "system",
        "Optimization Completed",
        f"Evaluated {res.configurationsEvaluated} configs ({res.feasibleConfigurations} feasible). Objective: {req.objective}."
    )
    return res

# --- 7. Monitoring & Events ---

@api_v1.get("/events", response_model=EventsResponse, summary="Get Events and Alerts")
def get_events():
    """Retrieves current alerts and event history logs."""
    return EventsResponse(
        activeAlerts=state_manager.alerts,
        eventHistory=state_manager.events
    )

# Mount API Router
app.include_router(api_v1)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
