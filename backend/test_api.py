import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all_endpoints():
    print("Testing RailOpt API endpoints...")
    
    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("  [PASS] /api/health ->", r.json()["status"])

    # 2. Core Entities
    for ep in ["stations", "sections", "assets", "defects", "maintenance-jobs", "trains", "block-windows", "resources", "departments"]:
        r = client.get(f"/api/{ep}")
        assert r.status_code == 200, f"Endpoint /api/{ep} failed"
        data = r.json()
        assert len(data) > 0, f"No data returned for /api/{ep}"
        print(f"  [PASS] /api/{ep} -> {len(data)} records")

    # 3. Dashboard
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    d = r.json()
    assert "kpis" in d
    assert "department_workload" in d
    assert "data_integration_status" in d
    print("  [PASS] /api/dashboard -> Generated Blocks:", d["kpis"]["generated_blocks"], "| Coordinated:", d["kpis"]["coordinated_blocks"])

    # 4. Baseline Comparison
    r = client.get("/api/optimization/baseline")
    assert r.status_code == 200
    base = r.json()
    assert "comparison_metrics" in base
    print(f"  [PASS] /api/optimization/baseline -> {len(base['comparison_metrics'])} calculated comparison metrics")

    # 5. Blocks and Explainability
    r = client.get("/api/blocks")
    assert r.status_code == 200
    blocks = r.json()
    assert len(blocks) > 0
    first_block_id = blocks[0]["block_id"]
    
    r_detail = client.get(f"/api/blocks/{first_block_id}")
    assert r_detail.status_code == 200
    detail = r_detail.json()
    assert "explanation" in detail
    assert "reasons" in detail["explanation"]
    print(f"  [PASS] /api/blocks/{first_block_id} -> Why this block has {len(detail['explanation']['reasons'])} clear justifications")

    # 6. Weekly Plan
    r = client.get("/api/plans/weekly")
    assert r.status_code == 200
    w = r.json()
    assert len(w["days"]) == 7
    print(f"  [PASS] /api/plans/weekly -> 7 days scheduled ({sum(d['blocks_count'] for d in w['days'])} total blocks)")

    # 7. Monthly Plan
    r = client.get("/api/plans/monthly")
    assert r.status_code == 200
    m = r.json()
    assert len(m["weeks"]) == 4
    print(f"  [PASS] /api/plans/monthly -> 4 strategic weeks projected")

    # 8. Network Topology
    r = client.get("/api/network")
    assert r.status_code == 200
    net = r.json()
    assert len(net["stations"]) == 12
    assert len(net["sections"]) == 20
    print(f"  [PASS] /api/network -> {len(net['stations'])} stations, {len(net['sections'])} sections")

    # 9. What-If Simulator
    mutations = [
        {"mutation_type": "REMOVE_WINDOW", "target_id": "WIN_SEC01_01"}
    ]
    r = client.post("/api/simulation/reoptimize", json={"mutations": mutations})
    assert r.status_code == 200
    sim_res = r.json()
    assert sim_res["affected_jobs_count"] > 0
    print(f"  [PASS] /api/simulation/reoptimize -> Affected: {sim_res['affected_jobs_count']}, Manual Intervention: {sim_res['manual_intervention_count']}")

    # Reset simulation
    r_reset = client.post("/api/simulation/reset")
    assert r_reset.status_code == 200
    print("  [PASS] /api/simulation/reset -> Active blocks restored")

    print("\nALL RAILOPT BACKEND TESTS PASSED SUCCESSFULLY! (100% Verified)")

if __name__ == "__main__":
    test_all_endpoints()
