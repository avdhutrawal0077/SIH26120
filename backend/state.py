import datetime
from typing import Dict, Any, List
from models import (
    WellConfig, ReservoirConfig, CssConfig, SrpConfig,
    AlertItem, EventHistoryItem
)

# Initial Default Well Configuration matching the API Contract
INITIAL_CONFIG = WellConfig(
    reservoir=ReservoirConfig(
        depth=1100,
        thickness=25,
        porosity=0.32,
        permeability=2500,
        oilSaturation=0.75,
        initialPressure=42,
        initialTemperature=40,
        initialViscosity=10000
    ),
    css=CssConfig(
        steamTemperature=280,
        steamPressure=75,
        steamRate=45,
        steamVolume=450,
        injectionDuration=2.5,
        soakDuration=1.5,
        cycleNumber=3
    ),
    srp=SrpConfig(
        pumpDepth=1100,
        pumpSize=2.25,
        pumpSpeed=10,
        strokeLength=120,
        motorLoad=65
    )
)

class WellStateManager:
    def __init__(self):
        self.config: WellConfig = INITIAL_CONFIG.model_copy(deep=True)
        self.is_initialized: bool = False
        self.alerts: List[AlertItem] = [
            AlertItem(id=1, type="warning", title="Elevated Pump Load", message="Motor load is operating at 82%, near the recommended safety margin (85%). Monitor for overheating.", time="10 mins ago"),
            AlertItem(id=2, type="info", title="Normal CSS Operation", message="Currently in the Production phase of Cycle 3. Steam pressure nominal.", time="2 hours ago"),
            AlertItem(id=3, type="critical", title="Temperature Threshold Event", message="Reservoir temperature sensor 4 dropped below optimal mobility threshold (75°C).", time="5 hours ago")
        ]
        self.events: List[EventHistoryItem] = [
            EventHistoryItem(id=101, type="system", action="Simulation Executed", details="Deterministic scenario simulation completed by Engineer.", timestamp="2026-09-30 14:22:00"),
            EventHistoryItem(id=102, type="system", action="Optimization Completed", details="Grid search evaluated 144 configurations. Recommended: 12 SPM.", timestamp="2026-09-30 14:15:30"),
            EventHistoryItem(id=103, type="process", action="Production Phase Started", details="CSS Cycle 3 transitioned from Soak to Production.", timestamp="2026-09-28 08:00:00"),
            EventHistoryItem(id=104, type="process", action="Soak Phase Started", details="Steam injection halted. Well shut-in for soaking.", timestamp="2026-09-26 12:00:00"),
            EventHistoryItem(id=105, type="process", action="CSS Injection Started", details="Commenced steam injection for Cycle 3 at 45 m³/d.", timestamp="2026-09-24 00:00:00"),
            EventHistoryItem(id=106, type="system", action="Configuration Updated", details="Well parameters updated and Digital Twin initialized.", timestamp="2026-09-23 09:45:00")
        ]

    def get_config(self) -> WellConfig:
        return self.config

    def update_config(self, new_config: WellConfig) -> WellConfig:
        self.config = new_config.model_copy(deep=True)
        self.add_event("system", "Configuration Updated", "Well configuration parameters updated via API.")
        return self.config

    def reset_config(self) -> WellConfig:
        self.config = INITIAL_CONFIG.model_copy(deep=True)
        self.is_initialized = False
        self.add_event("system", "Configuration Reset", "Well parameters restored to initial factory defaults.")
        return self.config

    def initialize_digital_twin(self) -> str:
        self.is_initialized = True
        self.add_event("system", "Digital Twin Initialized", f"Simulation synchronized with Cycle {self.config.css.cycleNumber} CSS profile.")
        return "Digital Twin initialized successfully."

    def add_event(self, event_type: str, action: str, details: str):
        new_id = (self.events[0].id + 1) if self.events else 101
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.events.insert(0, EventHistoryItem(
            id=new_id,
            type=event_type,
            action=action,
            details=details,
            timestamp=now_str
        ))

state_manager = WellStateManager()
