import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoint(name, url, method="GET", body=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8") if body else None,
        headers={"Content-Type": "application/json"} if body else {},
        method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[PASS] {method} {url} -> {resp.status}")
            return data
    except Exception as e:
        print(f"[FAIL] {method} {url} -> {e}")
        raise e

def run_tests():
    print("Testing SIH26120 API Contract...")
    
    # 1. Well Configuration
    cfg = test_endpoint("GET /config", f"{BASE_URL}/config")
    assert "reservoir" in cfg and "css" in cfg and "srp" in cfg, "Invalid config response"
    
    # PUT /config
    put_res = test_endpoint("PUT /config", f"{BASE_URL}/config", method="PUT", body=cfg)
    assert put_res.get("success") is True and "data" in put_res, "Invalid put config response"

    # POST /config/reset
    reset_res = test_endpoint("POST /config/reset", f"{BASE_URL}/config/reset", method="POST")
    assert reset_res.get("success") is True and "data" in reset_res, "Invalid reset config response"

    # 2. Digital Twin
    init_res = test_endpoint("POST /digital-twin/initialize", f"{BASE_URL}/digital-twin/initialize", method="POST")
    assert init_res.get("success") is True, "Invalid initialize response"

    twin_state = test_endpoint("GET /digital-twin/state", f"{BASE_URL}/digital-twin/state")
    assert "reservoir" in twin_state and "css" in twin_state and "srp" in twin_state and "production" in twin_state and "history" in twin_state

    # 3. Operations Data
    css_data = test_endpoint("GET /css/data", f"{BASE_URL}/css/data")
    assert "currentCycle" in css_data and "historicalCycles" in css_data and "chartData" in css_data

    srp_data = test_endpoint("GET /srp/data", f"{BASE_URL}/srp/data")
    assert "status" in srp_data and "parameters" in srp_data and "recommendation" in srp_data and "performanceData" in srp_data

    # 4. Analytics
    analytics = test_endpoint("GET /analytics", f"{BASE_URL}/analytics")
    assert "kpis" in analytics and "productionHistory" in analytics and "forecastData" in analytics and "cycleComparison" in analytics

    # 5. Scenario Simulation
    scenarios = test_endpoint("GET /scenarios", f"{BASE_URL}/scenarios")
    assert "baseline" in scenarios and "scenarios" in scenarios

    sim_res = test_endpoint("POST /scenarios/simulate", f"{BASE_URL}/scenarios/simulate", method="POST", body={
        "steamRate": 50,
        "injectionDuration": 3,
        "soakDuration": 1.5,
        "pumpSpeed": 12
    })
    assert "reservoirTemperature" in sim_res and "production" in sim_res

    # 6. Optimization
    opt_res = test_endpoint("POST /optimization/run", f"{BASE_URL}/optimization/run", method="POST", body={
        "objective": "maximize_oil",
        "constraints": {
            "maxPumpSpeed": 14,
            "maxSteamRate": 60
        }
    })
    assert "configurationsEvaluated" in opt_res and "current" in opt_res and "recommended" in opt_res

    # 7. Monitoring & Events
    events = test_endpoint("GET /events", f"{BASE_URL}/events")
    assert "activeAlerts" in events and "eventHistory" in events

    print("\nALL CONTRACT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
