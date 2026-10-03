# SIH26120 --- Digital Twin for Heavy-Oil Well Optimization

## System Architecture & Engineering Build Specification

> **Project:** Digital Twin for Well-to-Surface Optimization of Cyclic
> Steam Stimulation (CSS) and Sucker Rod Pump (SRP) Operations for
> Heavy-Oil Wells of Baghewala Field\
> **Current stage:** Frontend prototype / SIH idea-selection demo\
> **Demo data:** Synthetic / illustrative\
> **Future target:** Physics + ML + optimization driven Digital Twin

------------------------------------------------------------------------

## 1. System Purpose

The system is a web-based engineering platform intended to represent a
heavy-oil well as a **Digital Twin**.

The platform should allow an engineer to:

1.  Configure a virtual well.
2.  View its current virtual state.
3.  Represent Cyclic Steam Stimulation (CSS) operations.
4.  Represent Sucker Rod Pump (SRP) artificial lift operations.
5.  Simulate alternative operating scenarios.
6.  Predict production and other state variables.
7.  Optimize operating parameters subject to constraints.
8.  View recommendations, trends, events, and historical results.

The conceptual relationship is:

``` text
Physical Well
     │
     ▼
Well / Reservoir / CSS / SRP Data
     │
     ▼
Digital Twin
     │
     ├──────────────► Physics-based simulation
     │
     ├──────────────► ML-based prediction
     │
     └──────────────► Scenario simulation
                          │
                          ▼
                    Optimization
                          │
                          ▼
              Recommended configuration
```

The system should **not** be represented as simply:

``` text
Inputs → AI model → Production
```

Instead, the intended architecture is:

``` text
Well state
   ↓
Digital Twin
   ↓
Physics / ML models
   ↓
Simulation
   ↓
Scenario comparison
   ↓
Optimization
   ↓
Recommended operating configuration
```

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                         ┌─────────────────────┐
                         │      ENGINEER       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   REACT FRONTEND    │
                         │                     │
                         │ Overview            │
                         │ Well Configuration  │
                         │ Digital Twin        │
                         │ Thermal Stimulation │
                         │ Artificial Lift     │
                         │ Production Analytics│
                         │ Scenario Simulation │
                         │ Optimization        │
                         │ Monitoring & Events │
                         └──────────┬──────────┘
                                    │
                               REST / JSON
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       FASTAPI       │
                         │   API / Orchestration│
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
       │ PHYSICS      │      │ ML ENGINE    │      │ OPTIMIZATION │
       │ ENGINE       │      │              │      │ ENGINE       │
       │              │      │ Production   │      │ Objectives   │
       │ Thermal      │      │ prediction   │      │ Constraints  │
       │ Viscosity    │      │ Forecasting  │      │ Search       │
       │ Flow         │      │              │      │              │
       │ SRP          │      │              │      │              │
       └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │    DIGITAL TWIN     │
                         │                     │
                         │ Reservoir state     │
                         │ CSS state           │
                         │ SRP state           │
                         │ Production state    │
                         │ Historical state    │
                         │ Simulated future    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     POSTGRESQL      │
                         │                     │
                         │ Well data           │
                         │ Operational data    │
                         │ Simulation results  │
                         │ Optimization results│
                         │ Events / history    │
                         └─────────────────────┘
```

------------------------------------------------------------------------

# 3. Final Frontend Modules

The application should use these professional module names.

## 3.1 Overview

### Purpose

Provide a high-level operational view of the well.

### Include

-   Well ID
-   Field
-   Current simulation status
-   CSS cycle
-   Current production
-   Reservoir temperature
-   Reservoir pressure
-   Oil viscosity
-   SRP operating status
-   Production trend
-   Temperature trend
-   Viscosity trend
-   Current optimization recommendation

### Important principle

The engineer should understand the current state of the system within
approximately 10--15 seconds.

------------------------------------------------------------------------

## 3.2 Well Configuration

### Purpose

Configure the virtual well and its operating parameters.

### Reservoir properties

-   Depth
-   Thickness
-   Porosity
-   Permeability
-   Oil saturation
-   Reservoir pressure
-   Reservoir temperature
-   Initial oil viscosity

### CSS parameters

-   Steam temperature
-   Steam pressure
-   Steam injection rate
-   Steam volume
-   Injection duration
-   Soak duration
-   Cycle number

### SRP parameters

-   Pump depth
-   Pump size
-   Pump speed
-   Stroke length
-   Motor load
-   Other parameters added when the SRP model is defined

### Actions

-   Save configuration
-   Reset configuration
-   Initialize Digital Twin

### Important principle

Do not hard-code field-specific engineering limits unless they are
supported by authoritative data. Prototype validation can use sensible
synthetic bounds, but these must be clearly identified as demo
assumptions.

------------------------------------------------------------------------

# 4. Digital Twin

## Purpose

Represent the virtual state of the physical well.

The Digital Twin is the central state layer, not merely a visualization
page.

### State categories

#### Reservoir

-   Temperature
-   Pressure
-   Oil saturation
-   Oil viscosity
-   Other modeled state variables

#### CSS

-   Current cycle
-   Current phase
-   Steam rate
-   Steam temperature
-   Steam pressure
-   Injection state
-   Soak state

#### SRP

-   Pump speed
-   Stroke length
-   Pump size
-   Motor load
-   Pump state

#### Production

-   Oil rate
-   Water rate
-   Total liquid rate
-   Water cut
-   Other modeled outputs

### Visualization

Use a clean 2D engineering schematic:

``` text
Surface
   │
Pumping Unit
   │
Sucker Rod
   │
SRP Pump
   │
Wellbore
   │
══════════════════
   Reservoir
══════════════════
   Heated Zone
   ↑
   Steam
```

A complex 3D reservoir model is **not required for the initial
prototype**.

### State evolution

The Digital Twin should support:

``` text
Current State
     ↓
Simulation Step
     ↓
Updated State
     ↓
Next Simulation Step
     ↓
Future State
```

------------------------------------------------------------------------

# 5. Thermal Stimulation

## Purpose

Represent and manage Cyclic Steam Stimulation (CSS).

The core cycle is:

``` text
INJECTION
    ↓
SOAK
    ↓
PRODUCTION
    ↓
NEXT CYCLE
```

### Display

-   Current cycle
-   Cycle progress
-   Current phase
-   Steam temperature
-   Steam pressure
-   Steam rate
-   Steam volume
-   Injection duration
-   Soak duration
-   Production duration
-   Historical cycle results

### Charts

-   Reservoir temperature vs time
-   Steam injected vs time
-   Production vs time
-   Viscosity vs time

### Important domain principle

The prototype should demonstrate the relationship:

``` text
Steam
  ↓
Heat transfer
  ↓
Reservoir temperature increases
  ↓
Heavy-oil viscosity decreases
  ↓
Oil mobility increases
  ↓
Production response
```

Do not invent precise field-specific physical equations without
appropriate domain validation.

------------------------------------------------------------------------

# 6. Artificial Lift

## Purpose

Represent Sucker Rod Pump (SRP) operation.

SRP is the artificial-lift portion of the well-to-surface system.

### Display

-   Pump status
-   Pump speed
-   Stroke length
-   Pump size
-   Pump depth
-   Motor load
-   Rod load
-   Fluid level
-   Pump efficiency
-   Production response

### Charts

-   Production vs pump speed
-   Motor load vs pump speed
-   Pump efficiency
-   Liquid rate
-   Load/performance trends

### Future optimization variables

Potential variables include:

-   Pump speed
-   Stroke length
-   Pump size
-   Other equipment/operational variables supported by the final SRP
    model

------------------------------------------------------------------------

# 7. Production Analytics

## Purpose

Analyze historical, current, and predicted production behavior.

### KPIs

-   Oil production
-   Water production
-   Total liquid production
-   Water cut
-   Reservoir pressure
-   Temperature
-   Viscosity

### Charts

-   Historical production
-   Production by CSS cycle
-   Production vs temperature
-   Production vs viscosity
-   Pressure trend
-   Forecast

### Future ML integration

``` text
Historical data
      ↓
Feature engineering
      ↓
ML model
      ↓
Production prediction
      ↓
Forecast visualization
```

Start with tabular models such as XGBoost before considering deep
learning.

------------------------------------------------------------------------

# 8. Scenario Simulation

## Purpose

Allow an engineer to evaluate alternative operating configurations
before selecting an operating point.

This replaces the informal label "What-if Analysis".

### Scenario parameters

-   Steam temperature
-   Steam pressure
-   Steam injection rate
-   Steam volume
-   Injection duration
-   Soak duration
-   Pump speed
-   Stroke length
-   Other validated operating variables

### Example

``` text
BASELINE

Steam rate:       40 m³/day
Injection:         2 days
Soak:              1 day
Pump speed:       10 SPM
```

versus:

``` text
SCENARIO A

Steam rate:       50 m³/day
Injection:         3 days
Soak:            1.5 days
Pump speed:       12 SPM
```

### Results

Compare:

-   Reservoir temperature
-   Oil viscosity
-   Production
-   Steam consumption
-   Energy/operational metrics
-   Constraint violations

### Important requirement

Simulation results should be **deterministic** in the prototype. Do not
generate random results each time the user clicks "Run Simulation".

------------------------------------------------------------------------

# 9. Optimization

## Purpose

Search the feasible operating space and identify a configuration that
best satisfies the selected objective.

### Possible objectives

-   Maximize oil production
-   Minimize steam consumption
-   Maximize operational efficiency
-   Balanced operation

### Constraints

Potential constraints include:

-   Steam rate
-   Steam pressure
-   Injection duration
-   Pump speed
-   Equipment limits
-   Operational limits

Actual limits must eventually come from authoritative engineering
specifications or field data.

### Initial implementation

Use:

``` text
Grid Search
```

For example:

``` text
Injection duration:
1, 2, 3, 4 days

Steam rate:
30, 40, 50, 60 m³/day

Soak:
1, 1.5, 2 days
```

Evaluate feasible combinations.

### Later implementation

Use:

``` text
Optuna / constrained optimization
```

### Output

Show:

-   Current configuration
-   Configurations evaluated
-   Feasible configurations
-   Recommended configuration
-   Predicted production
-   Predicted efficiency
-   Constraint status

------------------------------------------------------------------------

# 10. Monitoring & Events

## Purpose

Combine operational monitoring, alerts, and historical events.

### Active events

Examples:

-   Elevated pump load
-   Steam pressure warning
-   Temperature threshold event
-   Abnormal production response
-   Normal CSS operation

### Event history

Examples:

``` text
CSS injection started
Soak phase started
Production phase started
Simulation executed
Optimization completed
Configuration updated
```

### Important principle

Warnings should be visually distinct from normal informational events.

------------------------------------------------------------------------

# 11. Recommended Technology Stack

## Frontend

``` text
React
Vite
JavaScript
Tailwind CSS
Recharts
Lucide React
Axios
```

### Why

-   Fast to develop
-   Familiar to the team
-   Good dashboard support
-   Easy chart integration
-   Easy migration from mock services to REST APIs

------------------------------------------------------------------------

## Backend

``` text
Python
FastAPI
Pydantic
SQLAlchemy
```

### Responsibilities

-   REST API
-   Input validation
-   Simulation orchestration
-   Digital Twin state management
-   ML inference
-   Optimization requests
-   Database interaction

------------------------------------------------------------------------

## Scientific computing

``` text
NumPy
SciPy
Pandas
CoolProp
```

### Responsibilities

**NumPy** - Numerical calculations

**SciPy** - Numerical methods - Optimization - Interpolation -
Scientific utilities

**Pandas** - Historical/time-series data

**CoolProp** - Thermophysical properties where appropriate

------------------------------------------------------------------------

## Machine Learning

``` text
scikit-learn
XGBoost
```

### Initial ML use cases

-   Production prediction
-   Forecasting
-   Surrogate modeling
-   Anomaly detection if sufficient data becomes available

Do not start with LSTM/Transformers unless the available sequential
dataset justifies them.

------------------------------------------------------------------------

## Optimization

``` text
SciPy optimization
Optuna
```

Start with grid search.

Move to Optuna or other constrained optimization methods after the
objective function and constraints are validated.

------------------------------------------------------------------------

## Database

``` text
PostgreSQL
```

Potential data groups:

-   Well configurations
-   Reservoir properties
-   CSS cycles
-   SRP operations
-   Production history
-   Simulation results
-   Optimization results
-   Events
-   Alerts

------------------------------------------------------------------------

## Deployment

``` text
Docker
```

Optional future production setup:

``` text
Nginx
+
Docker
+
Cloud / local server
```

Do not introduce Kubernetes or microservices unless the project
requirements genuinely justify them.

------------------------------------------------------------------------

# 12. Frontend → Backend Boundary

The frontend should not contain petroleum engineering calculations.

The intended future flow is:

``` text
React
  │
  │ JSON
  ▼
FastAPI
  │
  ├── Validation
  ├── Simulation Controller
  ├── Digital Twin Manager
  ├── Physics Engine
  ├── ML Engine
  └── Optimization Engine
```

Example future request:

``` json
{
  "well_id": "BW-042",
  "reservoir": {
    "depth_m": 1200,
    "thickness_m": 15,
    "porosity": 0.28,
    "permeability_md": 250,
    "oil_saturation": 0.75,
    "pressure_bar": 40,
    "temperature_c": 35,
    "oil_viscosity_cp": 10000
  },
  "css": {
    "steam_temperature_c": 280,
    "steam_pressure_bar": 75,
    "steam_rate_m3_day": 45,
    "injection_duration_day": 2.5,
    "soak_duration_day": 1.5,
    "cycle": 3
  }
}
```

The actual schema should evolve after the domain model is validated.

------------------------------------------------------------------------

# 13. Mock Prototype Architecture

For the immediate SIH demo, do NOT implement the complete backend.

Use:

``` text
React
  │
  ▼
Mock Service Layer
  │
  ├── Synthetic well data
  ├── Synthetic production history
  ├── Deterministic simulation
  └── Deterministic optimization
```

Recommended frontend structure:

``` text
src/
├── components/
├── pages/
├── layouts/
├── charts/
├── data/
│   ├── wells.js
│   ├── production.js
│   ├── simulations.js
│   ├── scenarios.js
│   └── alerts.js
├── services/
│   ├── simulationService.js
│   ├── optimizationService.js
│   └── wellService.js
├── utils/
└── App.jsx
```

The service layer is important.

Avoid:

``` text
Component
  ↓
hard-coded fake values everywhere
```

Prefer:

``` text
Component
  ↓
service
  ↓
mock data
```

Later:

``` text
Component
  ↓
service
  ↓
FastAPI
```

This allows the prototype frontend to survive the transition to the real
system.

------------------------------------------------------------------------

# 14. Synthetic Data Rules

The current prototype does not have verified Baghewala field data.

Therefore:

### Do

-   Use realistic-looking synthetic data.
-   Keep relationships internally consistent.
-   Label data as synthetic.
-   Use deterministic calculations.
-   Keep data generation centralized.

### Do not

-   Claim synthetic values are actual OIL measurements.
-   Invent proprietary Baghewala data.
-   Present fabricated engineering limits as official limits.
-   Present prototype optimization output as a real field
    recommendation.

Recommended UI label:

> **DEMO MODE --- Synthetic / Illustrative Data**

------------------------------------------------------------------------

# 15. Physics Model Development Strategy

Do not attempt to create a full reservoir simulator immediately.

Use an incremental approach.

## Stage 1 --- Thermal response

Model the conceptual relationship:

``` text
Steam input
     ↓
Thermal energy
     ↓
Reservoir temperature
```

## Stage 2 --- Viscosity response

``` text
Temperature
     ↓
Oil viscosity
```

## Stage 3 --- Flow response

``` text
Temperature
+
Viscosity
+
Pressure
+
Permeability
     ↓
Estimated production
```

## Stage 4 --- SRP

``` text
Pump parameters
     ↓
Lifting behavior
     ↓
Surface production
```

## Stage 5 --- Combined well-to-surface model

``` text
CSS
 ↓
Reservoir response
 ↓
Oil mobility
 ↓
SRP
 ↓
Surface production
```

All equations and coefficients must eventually be validated against
authoritative petroleum-engineering references and, where possible,
field data.

------------------------------------------------------------------------

# 16. ML Strategy

Do not begin by choosing a neural network.

First establish:

1.  What variable is being predicted?
2.  What data is available?
3.  What is the prediction horizon?
4.  What are the input features?
5.  What baseline model should be beaten?
6.  What metrics will evaluate the model?

Possible first model:

``` text
XGBoost
```

Example:

``` text
Inputs
  ├── Reservoir state
  ├── CSS parameters
  ├── SRP parameters
  ├── Historical production
  └── Lagged features
       ↓
XGBoost
       ↓
Production prediction
```

Potential metrics:

-   MAE
-   RMSE
-   MAPE where appropriate
-   R²

Model selection should be driven by data and validation results, not by
model complexity.

------------------------------------------------------------------------

# 17. Optimization Strategy

The optimizer should never blindly maximize production.

The objective should account for constraints and, if data permits,
operating cost.

Conceptually:

``` text
Objective =
Production benefit
− Steam cost
− Energy cost
− Operating cost
```

subject to:

``` text
Operational constraints
Equipment constraints
Available steam
Pump constraints
Pressure constraints
Temperature constraints
```

The exact objective and constraints must be defined with domain
experts/data.

------------------------------------------------------------------------

# 18. Digital Twin Design Principles

The Digital Twin should have:

### State

What is happening now?

### History

What happened previously?

### Simulation

What happens if operating conditions change?

### Prediction

What is likely to happen next?

### Optimization

Which feasible configuration best satisfies the chosen objective?

This gives the Digital Twin a useful functional definition:

``` text
State
+
History
+
Simulation
+
Prediction
+
Optimization
```

------------------------------------------------------------------------

# 19. API Design --- Future

Potential endpoints:

``` text
GET    /api/wells
GET    /api/wells/{well_id}

POST   /api/wells
PUT    /api/wells/{well_id}

GET    /api/wells/{well_id}/state

POST   /api/simulation
GET    /api/simulation/{simulation_id}

POST   /api/scenarios
GET    /api/scenarios/{scenario_id}

POST   /api/optimization
GET    /api/optimization/{optimization_id}

GET    /api/production/{well_id}
GET    /api/events/{well_id}
GET    /api/alerts/{well_id}
```

The exact API should be finalized after the domain data model is
defined.

------------------------------------------------------------------------

# 20. Performance Considerations

The application is primarily a scientific/engineering computation
system, so avoid unnecessary complexity.

### Frontend

-   Lazy-load large pages where useful.
-   Avoid rendering thousands of chart points unnecessarily.
-   Keep chart data downsampled when needed.
-   Centralize state where appropriate.
-   Avoid excessive animation.

### Backend

-   Keep physics calculations modular.
-   Avoid blocking long computations inside ordinary request handlers.
-   For expensive simulations, eventually use background jobs.
-   Cache repeated simulation results where appropriate.
-   Validate inputs before expensive calculations.

### Database

-   Index well IDs and timestamps.
-   Store time-series data efficiently.
-   Avoid storing redundant derived values unless useful for
    reproducibility.

------------------------------------------------------------------------

# 21. Error Handling

Every engineering operation should have explicit states:

``` text
Idle
Running
Completed
Failed
Invalid Input
Constraint Violation
```

Example:

``` text
Simulation failed

Reason:
Injection duration must be positive.
```

Do not silently produce results from invalid inputs.

------------------------------------------------------------------------

# 22. Testing Strategy

## Frontend

Test:

-   Navigation
-   Forms
-   Validation
-   Scenario creation
-   Charts
-   Optimization result display
-   Error states

## Backend

Test:

-   Input validation
-   Physics model functions
-   Simulation determinism
-   Optimization constraints
-   API responses

## ML

Test:

-   Train/test separation
-   Cross-validation
-   Baselines
-   Data leakage
-   Prediction error

## System

Test:

``` text
Configuration
→ Simulation
→ Digital Twin update
→ Optimization
→ Result
```

as an end-to-end workflow.

------------------------------------------------------------------------

# 23. Reproducibility

Every simulation should ideally have:

-   Input parameters
-   Model version
-   Timestamp
-   Simulation ID
-   Output values
-   Optimization settings

This allows the engineer to answer:

> "Why did the system produce this recommendation?"

That is especially important for engineering decision-support systems.

------------------------------------------------------------------------

# 24. Explainability

Recommendations should not be presented as unexplained AI output.

For example:

``` text
Recommended Configuration

Injection duration: 2.5 days
Steam rate: 45 m³/day
Soak duration: 1.5 days

Why?

• Predicted reservoir heating increased
• Predicted oil viscosity decreased
• Production increased
• Steam consumption remained within configured constraint
• SRP remained within configured operating constraint
```

The exact explanations must be generated from actual model outputs
rather than fabricated text.

------------------------------------------------------------------------

# 25. Security

Even though the prototype is local, the future system should consider:

-   Authentication
-   Authorization
-   Input validation
-   Secure API configuration
-   Secrets through environment variables
-   Database credentials outside source code
-   Audit logs
-   HTTPS in deployment
-   Role-based access if multiple user types are introduced

Never put passwords/API keys directly in the frontend source.

------------------------------------------------------------------------

# 26. Extensibility

Design the system so additional models can be added without rewriting
the frontend.

For example:

``` text
physics/
├── thermal_model.py
├── viscosity_model.py
├── flow_model.py
└── srp_model.py
```

Later:

``` text
physics/
├── thermal_model.py
├── viscosity_model.py
├── flow_model.py
├── srp_model.py
├── reservoir_pressure_model.py
└── water_cut_model.py
```

Similarly:

``` text
ml/
├── production_model.py
└── forecasting.py
```

This makes the system modular.

------------------------------------------------------------------------

# 27. Things NOT to Build Initially

Avoid unnecessary complexity.

Do not start with:

-   LSTM
-   Transformer
-   Reinforcement learning
-   Kubernetes
-   Microservices
-   Kafka
-   Redis
-   Real-time WebSockets
-   Complex 3D reservoir rendering
-   Full-scale reservoir simulation
-   A custom physics engine from scratch
-   A massive deep-learning model

The initial system should prove the architecture and engineering
workflow first.

------------------------------------------------------------------------

# 28. Recommended Development Order

## Phase 0 --- Demo

``` text
React
↓
Mock data
↓
Functional dashboard
```

Build:

1.  Overview
2.  Well Configuration
3.  Digital Twin
4.  Thermal Stimulation
5.  Artificial Lift
6.  Production Analytics
7.  Scenario Simulation
8.  Optimization
9.  Monitoring & Events

------------------------------------------------------------------------

## Phase 1 --- Backend Foundation

``` text
FastAPI
PostgreSQL
Pydantic
SQLAlchemy
```

Connect the existing frontend through REST APIs.

------------------------------------------------------------------------

## Phase 2 --- Physics

Implement and test:

``` text
Thermal model
↓
Temperature model
↓
Viscosity model
↓
Flow / production model
↓
SRP model
```

------------------------------------------------------------------------

## Phase 3 --- Digital Twin

Connect the physics models into a stateful simulation.

``` text
Initial state
↓
Simulation step
↓
Updated state
↓
Next step
```

------------------------------------------------------------------------

## Phase 4 --- ML

Add:

``` text
Historical data
↓
Feature engineering
↓
Baseline model
↓
XGBoost
↓
Production prediction
```

------------------------------------------------------------------------

## Phase 5 --- Optimization

Start with:

``` text
Grid search
```

Then:

``` text
Optuna / constrained optimization
```

------------------------------------------------------------------------

## Phase 6 --- Validation

Compare:

``` text
Physics prediction
vs
Historical observations
```

and:

``` text
ML prediction
vs
Historical observations
```

Tune/calibrate only when appropriate data is available.

------------------------------------------------------------------------

# 29. Team Separation

A practical team split:

### AI / Data

-   Physics model research
-   Feature engineering
-   ML
-   Production prediction
-   Optimization
-   Evaluation

### Backend

-   FastAPI
-   Database
-   API
-   Simulation orchestration
-   Digital Twin state management

### Frontend

-   React
-   Dashboard
-   Charts
-   Scenario UI
-   Visualization

### Domain / Research

-   CSS research
-   SRP research
-   Engineering constraints
-   Data sources
-   Model assumptions
-   Validation

### Integration

-   API integration
-   Deployment
-   Testing
-   Documentation

------------------------------------------------------------------------

# 30. Critical Engineering Principles

Keep these principles visible throughout development.

### Principle 1

**Do not fake real engineering claims.**

Synthetic data is acceptable for the prototype, but label it.

### Principle 2

**Do not call a black-box ML predictor a Digital Twin.**

The twin should maintain and evolve system state.

### Principle 3

**Do not over-engineer the first version.**

Build the simplest defensible model first.

### Principle 4

**Every recommendation should have traceable inputs.**

### Principle 5

**Every optimization result must respect explicit constraints.**

### Principle 6

**Physics and domain assumptions must be documented.**

### Principle 7

**ML should supplement physics rather than automatically replace it.**

### Principle 8

**The frontend must remain independent of the scientific
implementation.**

### Principle 9

**Prototype values must never be presented as actual Baghewala
measurements.**

### Principle 10

**Validate engineering equations and parameters before treating
simulation output as meaningful.**

------------------------------------------------------------------------

# 31. Final Target Architecture

The mature system should ultimately look like:

``` text
                        ENGINEER
                           │
                           ▼
                   ┌───────────────┐
                   │ React + Vite  │
                   │ Engineering  │
                   │ Dashboard     │
                   └───────┬───────┘
                           │
                         REST
                           │
                           ▼
                   ┌───────────────┐
                   │    FastAPI    │
                   │ Orchestration │
                   └───────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     PHYSICS             ML             OPTIMIZER
     ENGINE            ENGINE             ENGINE
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                   DIGITAL TWIN
                           │
                           ▼
                      POSTGRESQL
```

The central engineering loop is:

``` text
CONFIGURE
    ↓
OBSERVE
    ↓
SIMULATE
    ↓
PREDICT
    ↓
COMPARE
    ↓
OPTIMIZE
    ↓
RECOMMEND
    ↓
UPDATE DIGITAL TWIN
```

------------------------------------------------------------------------

# 32. Build Checklist

Before considering the prototype complete:

-   [ ] All 9 navigation modules work.
-   [ ] Synthetic data is centralized.
-   [ ] Synthetic-data disclaimer is visible.
-   [ ] Well configuration works.
-   [ ] Digital Twin state is visualized.
-   [ ] CSS cycle is visualized.
-   [ ] SRP state is visualized.
-   [ ] Production charts work.
-   [ ] Scenario simulation works.
-   [ ] Scenario comparison works.
-   [ ] Optimization returns deterministic results.
-   [ ] Recommendations are clearly displayed.
-   [ ] Alerts/events work.
-   [ ] No fake data is presented as actual Baghewala data.
-   [ ] UI is responsive.
-   [ ] Mock services are separated from UI components.
-   [ ] Future REST API boundaries are clear.
-   [ ] No unnecessary ML/deep-learning complexity is introduced.
-   [ ] Future physics models can be added independently.
-   [ ] Engineering assumptions are documented.

------------------------------------------------------------------------

## Final Product Definition

The project should ultimately be understood as:

> **A hybrid physics-informed Digital Twin platform that represents the
> state of a heavy-oil well, simulates CSS and SRP operations, predicts
> production behavior, evaluates alternative operating scenarios, and
> identifies feasible operating configurations through optimization.**

For the current SIH demo, implement the **frontend and deterministic
synthetic simulation layer** first. After selection, progressively
replace each mock component with validated physics, real data, ML
models, and optimization algorithms.
