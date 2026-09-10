from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime

class Station(BaseModel):
    station_id: str
    name: str
    code: str
    division: str = "Northern Railway Division"
    track_count: int = 4
    x_coord: float
    y_coord: float

class Section(BaseModel):
    section_id: str
    source_station: str
    destination_station: str
    length_km: float
    track_count: int
    electrified: bool
    operational_priority: int  # 1 (highest) to 5
    max_speed_kmh: int = 130
    current_status: str = "NORMAL"  # NORMAL, MAINTENANCE_PLANNED, HIGH_RISK

class Asset(BaseModel):
    asset_id: str
    asset_type: str  # Track, Turnout, OHE_Mast, Substation, Point_Machine, Axle_Counter, Signal
    section_id: str
    installation_date: str
    criticality: int  # 1-10
    condition: str  # GOOD, FAIR, POOR, CRITICAL
    last_maintenance_date: str
    next_due_date: str
    failure_count: int
    availability: float  # e.g., 96.5%

class Defect(BaseModel):
    defect_id: str
    source_system: str  # TMS, SMMS, TDMS
    asset_id: str
    department: str  # Engineering, Traction Distribution, Signal & Telecommunication
    reported_at: str
    defect_type: str
    severity: str  # MINOR, MEDIUM, MAJOR, CRITICAL
    description: str
    status: str  # PENDING, IN_PROGRESS, RESOLVED

class MaintenanceJob(BaseModel):
    job_id: str
    asset_id: str
    section_id: str
    department: str  # Engineering, Traction Distribution, Signal & Telecommunication
    maintenance_type: str  # Corrective, Preventive, Overhaul, Emergency
    description: str
    duration_minutes: int
    criticality: int  # 1-10
    urgency: int  # 1-10
    asset_impact: int  # 1-10
    due_date: str
    required_resource: str
    block_requirement: str  # TRAFFIC_BLOCK, POWER_BLOCK, COMBINED_BLOCK, DISCONNECTED
    status: str  # PENDING, SCHEDULED, UNSCHEDULED
    overdue_days: int = 0
    failure_history: str = "LOW"  # LOW, MEDIUM, HIGH
    priority_score: float = 0.0
    isolation_required: bool = False
    compatible_departments: List[str] = Field(default_factory=list)

class Department(BaseModel):
    department_id: str
    name: str
    working_hours: str
    maximum_parallel_jobs: int

class Resource(BaseModel):
    resource_id: str
    department_id: str
    resource_type: str  # Gang, Tower Wagon, Tech Crew
    skill: str
    availability: str  # AVAILABLE, DEPLOYED, MAINTENANCE

class Train(BaseModel):
    train_id: str
    train_number: str
    train_name: str
    train_type: str  # Rajdhani/Vande Bharat, Superfast, Express, Passenger, Freight
    section_id: str
    arrival_time: str  # HH:MM
    departure_time: str  # HH:MM
    direction: str  # UP, DOWN
    priority: int  # 1 (Highest, VIP) to 5 (Freight)

class TrainForecast(BaseModel):
    forecast_id: str
    section_id: str
    date: str
    expected_total_trains: int
    expected_goods_trains: int
    peak_period: str
    confidence: float

class BlockWindow(BaseModel):
    window_id: str
    section_id: str
    date: str
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    block_type: str  # REGULAR_SHADOW, NIGHT_SLOT, TRAFFIC_FREE, EMERGENCY
    maximum_duration: int  # minutes
    status: str  # AVAILABLE, ALLOCATED, CANCELLED

class BlockJobAssignment(BaseModel):
    job_id: str
    department: str
    description: str
    duration_minutes: int
    start_offset_minutes: int
    end_offset_minutes: int
    priority_score: float
    required_resource: str

class Block(BaseModel):
    block_id: str
    section_id: str
    date: str
    start_time: str
    end_time: str
    duration_minutes: int
    score: float
    status: str  # APPROVED, GENERATED, SIMULATED
    block_type: str  # SINGLE_DEPT, MULTI_DEPT_COORDINATED
    departments: List[str]
    jobs: List[BlockJobAssignment]
    operational_impact: str
    train_conflicts_avoided: int
    coordination_benefit: str
    explanation: Dict[str, Any] = Field(default_factory=dict)

class OptimizationRun(BaseModel):
    run_id: str
    timestamp: str
    planning_horizon: str
    objective_score: float
    execution_time_ms: float
    solver_status: str
    total_blocks_created: int
    coordinated_blocks_count: int
    total_downtime_minutes: int
    scheduled_jobs_count: int
    unscheduled_jobs_count: int
    coordination_rate_percent: float

class BaselineComparisonMetrics(BaseModel):
    metric_name: str
    baseline_value: Any
    railopt_value: Any
    unit: str
    improvement: str
    impact: str

class WhatIfMutation(BaseModel):
    mutation_type: str  # REMOVE_WINDOW, DELAY_JOB, CHANGE_PRIORITY, DISABLE_RESOURCE, ADD_TRAIN_CONFLICT
    target_id: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class WhatIfResult(BaseModel):
    scenario_id: str
    run_timestamp: str
    affected_jobs_count: int
    rescheduled_jobs_count: int
    moved_to_later_windows_count: int
    manual_intervention_count: int
    summary_diff: str
    previous_blocks_count: int
    new_blocks_count: int
    previous_downtime_minutes: int
    new_downtime_minutes: int
    affected_job_details: List[Dict[str, Any]]
    new_schedule: List[Block]
