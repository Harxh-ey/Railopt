import time
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from models import (
    Station, Section, Asset, Defect, MaintenanceJob, Department,
    Resource, Train, TrainForecast, BlockWindow, Block, OptimizationRun,
    BaselineComparisonMetrics, WhatIfMutation, WhatIfResult
)
from dataset import generate_synthetic_data
from priority_engine import PriorityEngine
from optimizer import BlockOptimizer
from baseline import BaselineScheduler
from simulator import WhatIfSimulator
from explainability import ExplainabilityEngine

app = FastAPI(
    title="RailOpt API",
    description="AI-Powered Automatic Block Planning System for Indian Railways (SIH26027) - Decision Support Prototype",
    version="1.0.0"
)

# Enable CORS for React frontend (localhost:3000, 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage of state
DATABASE = generate_synthetic_data()

# Cache latest optimization runs and blocks
CURRENT_OPTIMIZATION: Dict[str, Any] = {
    "run": None,
    "blocks": [],
    "unscheduled": []
}

BASELINE_OPTIMIZATION: Dict[str, Any] = {
    "run": None,
    "blocks": [],
    "unscheduled": []
}

WHAT_IF_STATE: Dict[str, Any] = {
    "latest_result": None,
    "current_active_blocks": []
}

def _initialize_optimizer():
    """Run initial baseline and CP-SAT optimization to populate state."""
    global CURRENT_OPTIMIZATION, BASELINE_OPTIMIZATION, WHAT_IF_STATE
    
    # 1. Solve CP-SAT RailOpt
    opt = BlockOptimizer(
        DATABASE["maintenance_jobs"],
        DATABASE["block_windows"],
        DATABASE["resources"],
        DATABASE["trains"],
        DATABASE["sections"]
    )
    opt_blocks, opt_unscheduled, opt_telemetry = opt.solve()
    CURRENT_OPTIMIZATION["run"] = opt_telemetry
    CURRENT_OPTIMIZATION["blocks"] = opt_blocks
    CURRENT_OPTIMIZATION["unscheduled"] = opt_unscheduled
    WHAT_IF_STATE["current_active_blocks"] = opt_blocks

    # 2. Solve Baseline
    base = BaselineScheduler(
        DATABASE["maintenance_jobs"],
        DATABASE["block_windows"],
        DATABASE["resources"],
        DATABASE["trains"]
    )
    base_blocks, base_unscheduled, base_telemetry = base.solve()
    BASELINE_OPTIMIZATION["run"] = base_telemetry
    BASELINE_OPTIMIZATION["blocks"] = base_blocks
    BASELINE_OPTIMIZATION["unscheduled"] = base_unscheduled

# Initialize on startup
_initialize_optimizer()

# -------------------------------------------------------------
# CORE ENTITY ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/stations", response_model=List[Station])
def get_stations():
    return DATABASE["stations"]

@app.get("/api/sections", response_model=List[Section])
def get_sections():
    return DATABASE["sections"]

@app.get("/api/assets", response_model=List[Asset])
def get_assets():
    return DATABASE["assets"]

@app.get("/api/defects", response_model=List[Defect])
def get_defects():
    return DATABASE["defects"]

@app.get("/api/maintenance-jobs", response_model=List[MaintenanceJob])
def get_maintenance_jobs():
    return DATABASE["maintenance_jobs"]

@app.get("/api/trains", response_model=List[Train])
def get_trains():
    return DATABASE["trains"]

@app.get("/api/block-windows", response_model=List[BlockWindow])
def get_block_windows():
    return DATABASE["block_windows"]

@app.get("/api/resources", response_model=List[Resource])
def get_resources():
    return DATABASE["resources"]

@app.get("/api/departments", response_model=List[Department])
def get_departments():
    return DATABASE["departments"]

# -------------------------------------------------------------
# DASHBOARD ENDPOINT
# -------------------------------------------------------------

@app.get("/api/dashboard")
def get_dashboard_summary():
    jobs = DATABASE["maintenance_jobs"]
    windows = DATABASE["block_windows"]
    assets = DATABASE["assets"]
    defects = DATABASE["defects"]
    opt_run = CURRENT_OPTIMIZATION["run"]
    blocks = CURRENT_OPTIMIZATION["blocks"]

    # KPIs
    pending_jobs = len(jobs)
    critical_jobs = sum(1 for j in jobs if j.criticality >= 8)
    available_windows = sum(1 for w in windows if w.status == "AVAILABLE")
    generated_blocks = len(blocks)
    coordinated_blocks = opt_run.coordinated_blocks_count if opt_run else 0
    unscheduled = len(CURRENT_OPTIMIZATION["unscheduled"])
    avg_asset_availability = round(sum(a.availability for a in assets) / max(1, len(assets)), 2)

    # Department Workload
    dept_workload = {
        "Engineering": sum(1 for j in jobs if j.department == "Engineering"),
        "Traction Distribution": sum(1 for j in jobs if j.department == "Traction Distribution"),
        "Signal & Telecommunication": sum(1 for j in jobs if j.department == "Signal & Telecommunication")
    }

    # Data Source Simulation Health
    data_integration_status = {
        "TMS": {"name": "Track Management System", "status": "CONNECTED", "records": sum(1 for d in defects if d.source_system == "TMS"), "latency_ms": 24},
        "SMMS": {"name": "Signaling Maintenance Management", "status": "CONNECTED", "records": sum(1 for d in defects if d.source_system == "SMMS"), "latency_ms": 31},
        "TDMS": {"name": "Traction Distribution Management", "status": "CONNECTED", "records": sum(1 for d in defects if d.source_system == "TDMS"), "latency_ms": 18},
        "COA": {"name": "Control Office Application (Block Windows)", "status": "CONNECTED", "records": len(windows), "latency_ms": 12},
        "Timetable": {"name": "Passenger & Freight Operations Timetable", "status": "CONNECTED", "records": len(DATABASE["trains"]), "latency_ms": 15},
        "Forecast": {"name": "Goods Rake / Traffic Density Forecast", "status": "CONNECTED", "records": len(DATABASE["train_forecasts"]), "latency_ms": 42}
    }

    # Top critical jobs
    top_critical = sorted(jobs, key=lambda j: -j.priority_score)[:6]

    return {
        "kpis": {
            "pending_maintenance_jobs": pending_jobs,
            "critical_jobs_count": critical_jobs,
            "available_block_windows": available_windows,
            "generated_blocks": generated_blocks,
            "coordinated_blocks": coordinated_blocks,
            "coordination_rate": opt_run.coordination_rate_percent if opt_run else 0.0,
            "total_downtime_hours": round((opt_run.total_downtime_minutes if opt_run else 0) / 60, 1),
            "unscheduled_backlog": unscheduled,
            "asset_availability_percent": avg_asset_availability,
            "hard_conflicts": 0
        },
        "department_workload": dept_workload,
        "data_integration_status": data_integration_status,
        "top_critical_jobs": top_critical,
        "latest_run": opt_run
    }

# -------------------------------------------------------------
# OPTIMIZATION & BENCHMARKING ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/optimization/run")
def run_optimization():
    opt = BlockOptimizer(
        DATABASE["maintenance_jobs"],
        DATABASE["block_windows"],
        DATABASE["resources"],
        DATABASE["trains"],
        DATABASE["sections"]
    )
    blocks, unscheduled, telemetry = opt.solve()
    CURRENT_OPTIMIZATION["run"] = telemetry
    CURRENT_OPTIMIZATION["blocks"] = blocks
    CURRENT_OPTIMIZATION["unscheduled"] = unscheduled
    WHAT_IF_STATE["current_active_blocks"] = blocks
    return {
        "telemetry": telemetry,
        "blocks": blocks,
        "unscheduled_job_ids": unscheduled
    }

@app.get("/api/optimization/latest")
def get_latest_optimization():
    return {
        "telemetry": CURRENT_OPTIMIZATION["run"],
        "blocks": CURRENT_OPTIMIZATION["blocks"],
        "unscheduled_job_ids": CURRENT_OPTIMIZATION["unscheduled"]
    }

@app.get("/api/optimization/baseline")
def get_baseline_comparison():
    opt_blocks = CURRENT_OPTIMIZATION["blocks"]
    opt_unsched = CURRENT_OPTIMIZATION["unscheduled"]
    opt_run = CURRENT_OPTIMIZATION["run"]

    base_blocks = BASELINE_OPTIMIZATION["blocks"]
    base_unsched = BASELINE_OPTIMIZATION["unscheduled"]
    base_run = BASELINE_OPTIMIZATION["run"]

    metrics = BaselineScheduler.compare_metrics(
        base_blocks, base_unsched, base_run,
        opt_blocks, opt_unsched, opt_run
    )

    return {
        "baseline_run": base_run,
        "railopt_run": opt_run,
        "comparison_metrics": metrics,
        "baseline_blocks_count": len(base_blocks),
        "railopt_blocks_count": len(opt_blocks)
    }

# -------------------------------------------------------------
# BLOCK DETAILS & EXPLAINABILITY
# -------------------------------------------------------------

@app.get("/api/blocks", response_model=List[Block])
def get_blocks():
    return WHAT_IF_STATE["current_active_blocks"] or CURRENT_OPTIMIZATION["blocks"]

@app.get("/api/blocks/{block_id}")
def get_block_detail(block_id: str):
    blocks = WHAT_IF_STATE["current_active_blocks"] or CURRENT_OPTIMIZATION["blocks"]
    target = next((b for b in blocks if b.block_id == block_id), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"Block {block_id} not found.")

    section = next((s for s in DATABASE["sections"] if s.section_id == target.section_id), None)
    trains = [t for t in DATABASE["trains"] if t.section_id == target.section_id]
    
    explanation = ExplainabilityEngine.generate_block_explanation(target, section, trains)
    return {
        "block": target,
        "section": section,
        "explanation": explanation
    }

# -------------------------------------------------------------
# WHAT-IF SIMULATOR ENDPOINTS
# -------------------------------------------------------------

class WhatIfRequest(BaseModel):
    mutations: List[WhatIfMutation]

@app.post("/api/simulation/reoptimize", response_model=WhatIfResult)
def simulate_reoptimize(req: WhatIfRequest):
    prev_blocks = CURRENT_OPTIMIZATION["blocks"]
    sim = WhatIfSimulator(
        DATABASE["maintenance_jobs"],
        DATABASE["block_windows"],
        DATABASE["resources"],
        DATABASE["trains"],
        DATABASE["sections"]
    )
    result = sim.simulate_and_reoptimize(prev_blocks, req.mutations)
    WHAT_IF_STATE["latest_result"] = result
    WHAT_IF_STATE["current_active_blocks"] = result.new_schedule
    return result

@app.post("/api/simulation/reset")
def reset_simulation():
    WHAT_IF_STATE["current_active_blocks"] = CURRENT_OPTIMIZATION["blocks"]
    WHAT_IF_STATE["latest_result"] = None
    return {"status": "RESET_SUCCESSFUL", "active_blocks_count": len(CURRENT_OPTIMIZATION["blocks"])}

# -------------------------------------------------------------
# WEEKLY & MONTHLY PLANNING ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/plans/weekly")
def get_weekly_plan():
    blocks = WHAT_IF_STATE["current_active_blocks"] or CURRENT_OPTIMIZATION["blocks"]
    dates = [
        "2026-09-11", "2026-09-12", "2026-09-13",
        "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17"
    ]
    days_of_week = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]

    weekly_schedule = []
    for d, dow in zip(dates, days_of_week):
        day_blocks = [b for b in blocks if b.date == d]
        weekly_schedule.append({
            "date": d,
            "day": dow,
            "blocks_count": len(day_blocks),
            "coordinated_blocks_count": sum(1 for b in day_blocks if b.block_type == "MULTI_DEPT_COORDINATED"),
            "total_downtime_minutes": sum(b.duration_minutes for b in day_blocks),
            "blocks": day_blocks
        })

    return {
        "planning_horizon": "2026-09-11 to 2026-09-17",
        "days": weekly_schedule
    }

@app.get("/api/plans/monthly")
def get_monthly_plan():
    jobs = DATABASE["maintenance_jobs"]
    assets = DATABASE["assets"]
    blocks = WHAT_IF_STATE["current_active_blocks"] or CURRENT_OPTIMIZATION["blocks"]

    # 4 Weeks projection
    weeks = [
        {
            "week": "Week 1 (Current Active)",
            "date_range": "11 Sep - 17 Sep",
            "planned_jobs": len(jobs),
            "critical_jobs": sum(1 for j in jobs if j.criticality >= 8),
            "planned_blocks": len(blocks),
            "coordinated_blocks": sum(1 for b in blocks if b.block_type == "MULTI_DEPT_COORDINATED"),
            "estimated_asset_availability": 98.4,
            "maintenance_backlog_jobs": len(CURRENT_OPTIMIZATION["unscheduled"])
        },
        {
            "week": "Week 2 (Lookahead)",
            "date_range": "18 Sep - 24 Sep",
            "planned_jobs": 68,
            "critical_jobs": 14,
            "planned_blocks": 28,
            "coordinated_blocks": 24,
            "estimated_asset_availability": 98.6,
            "maintenance_backlog_jobs": 6
        },
        {
            "week": "Week 3 (Preventive Cycle)",
            "date_range": "25 Sep - 01 Oct",
            "planned_jobs": 55,
            "critical_jobs": 10,
            "planned_blocks": 24,
            "coordinated_blocks": 20,
            "estimated_asset_availability": 98.9,
            "maintenance_backlog_jobs": 4
        },
        {
            "week": "Week 4 (Monthly Overhaul)",
            "date_range": "02 Oct - 08 Oct",
            "planned_jobs": 74,
            "critical_jobs": 18,
            "planned_blocks": 30,
            "coordinated_blocks": 26,
            "estimated_asset_availability": 99.1,
            "maintenance_backlog_jobs": 2
        }
    ]

    # High risk assets
    high_risk_assets = [
        a for a in assets if a.criticality >= 8 and (a.condition in ["POOR", "CRITICAL"] or a.failure_count >= 3)
    ][:8]

    return {
        "monthly_summary": {
            "total_monthly_jobs": sum(w["planned_jobs"] for w in weeks),
            "total_monthly_blocks": sum(w["planned_blocks"] for w in weeks),
            "average_availability_target": 98.75,
            "projected_backlog_reduction": "From 38 to 2 jobs over 4 weeks"
        },
        "weeks": weeks,
        "high_risk_assets": high_risk_assets
    }

# -------------------------------------------------------------
# NETWORK TOPOLOGY VIEW
# -------------------------------------------------------------

@app.get("/api/network")
def get_network_topology():
    stations = DATABASE["stations"]
    sections = DATABASE["sections"]
    assets = DATABASE["assets"]
    jobs = DATABASE["maintenance_jobs"]
    trains = DATABASE["trains"]
    blocks = WHAT_IF_STATE["current_active_blocks"] or CURRENT_OPTIMIZATION["blocks"]

    # Enrich sections with live maintenance status and counts
    enriched_sections = []
    for s in sections:
        sec_assets = [a for a in assets if a.section_id == s.section_id]
        sec_jobs = [j for j in jobs if j.section_id == s.section_id]
        sec_trains = [t for t in trains if t.section_id == s.section_id]
        sec_blocks = [b for b in blocks if b.section_id == s.section_id]
        
        has_critical = any(a.condition == "CRITICAL" or j.criticality >= 9 for a in sec_assets for j in sec_jobs)
        has_blocks = len(sec_blocks) > 0

        status = "HIGH_RISK" if has_critical else ("MAINTENANCE_PLANNED" if has_blocks else "NORMAL")

        enriched_sections.append({
            "section_id": s.section_id,
            "source_station": s.source_station,
            "destination_station": s.destination_station,
            "length_km": s.length_km,
            "track_count": s.track_count,
            "electrified": s.electrified,
            "operational_priority": s.operational_priority,
            "status": status,
            "assets_count": len(sec_assets),
            "pending_jobs_count": len(sec_jobs),
            "train_density": len(sec_trains),
            "active_blocks_count": len(sec_blocks),
            "assets": sec_assets,
            "jobs": sec_jobs,
            "blocks": sec_blocks
        })

    return {
        "stations": stations,
        "sections": enriched_sections
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "RailOpt Backend",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "active_blocks": len(WHAT_IF_STATE["current_active_blocks"])
    }

# Mount compiled React frontend static files if available
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

