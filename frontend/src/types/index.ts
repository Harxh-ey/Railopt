export interface Station {
  station_id: string;
  name: string;
  code: string;
  division: string;
  track_count: number;
  x_coord: number;
  y_coord: number;
}

export interface Section {
  section_id: string;
  source_station: string;
  destination_station: string;
  length_km: number;
  track_count: number;
  electrified: boolean;
  operational_priority: number;
  max_speed_kmh: number;
  status: string;
  assets_count?: number;
  pending_jobs_count?: number;
  train_density?: number;
  active_blocks_count?: number;
  assets?: Asset[];
  jobs?: MaintenanceJob[];
  blocks?: Block[];
}

export interface Asset {
  asset_id: string;
  asset_type: string;
  section_id: string;
  installation_date: string;
  criticality: number;
  condition: string;
  last_maintenance_date: string;
  next_due_date: string;
  failure_count: number;
  availability: number;
}

export interface Defect {
  defect_id: string;
  source_system: string;
  asset_id: string;
  department: string;
  reported_at: string;
  defect_type: string;
  severity: string;
  description: string;
  status: string;
}

export interface MaintenanceJob {
  job_id: string;
  asset_id: string;
  section_id: string;
  department: string;
  maintenance_type: string;
  description: string;
  duration_minutes: number;
  criticality: number;
  urgency: number;
  asset_impact: number;
  due_date: string;
  required_resource: string;
  block_requirement: string;
  status: string;
  overdue_days: number;
  failure_history: string;
  priority_score: number;
  isolation_required: boolean;
  compatible_departments: string[];
}

export interface Resource {
  resource_id: string;
  department_id: string;
  resource_type: string;
  skill: string;
  availability: string;
}

export interface Train {
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  section_id: string;
  arrival_time: string;
  departure_time: string;
  direction: string;
  priority: number;
}

export interface BlockWindow {
  window_id: string;
  section_id: string;
  date: string;
  start_time: string;
  end_time: string;
  block_type: string;
  maximum_duration: number;
  status: string;
}

export interface BlockJobAssignment {
  job_id: string;
  department: string;
  description: string;
  duration_minutes: number;
  start_offset_minutes: number;
  end_offset_minutes: number;
  priority_score: number;
  required_resource: string;
}

export interface Block {
  block_id: string;
  section_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  score: number;
  status: string;
  block_type: string;
  departments: string[];
  jobs: BlockJobAssignment[];
  operational_impact: string;
  train_conflicts_avoided: number;
  coordination_benefit: string;
  explanation: {
    coa_window_fit?: boolean;
    window_type?: string;
    window_capacity_minutes?: number;
    utilized_duration_minutes?: number;
    utilization_percent?: number;
    departments_combined?: string[];
    jobs_count?: number;
    high_priority_train_conflicts?: number;
    train_safety_buffer_minutes?: number;
    downtime_minutes_saved?: number;
    separate_blocks_avoided?: number;
    justifications?: string[];
    metrics?: any;
    reasons?: any[];
    [key: string]: any;
  };
}

export interface OptimizationRun {
  run_id: string;
  timestamp: string;
  planning_horizon: string;
  objective_score: number;
  execution_time_ms: number;
  solver_status: string;
  total_blocks_created: number;
  coordinated_blocks_count: number;
  total_downtime_minutes: number;
  scheduled_jobs_count: number;
  unscheduled_jobs_count: number;
  coordination_rate_percent: number;
}

export interface BaselineComparisonMetrics {
  metric_name: string;
  baseline_value: any;
  railopt_value: any;
  unit: string;
  improvement: string;
  impact: string;
}

export interface DashboardData {
  kpis: {
    pending_maintenance_jobs: number;
    critical_jobs_count: number;
    available_block_windows: number;
    generated_blocks: number;
    coordinated_blocks: number;
    coordination_rate: number;
    total_downtime_hours: number;
    unscheduled_backlog: number;
    asset_availability_percent: number;
    hard_conflicts: number;
  };
  department_workload: {
    Engineering: number;
    "Traction Distribution": number;
    "Signal & Telecommunication": number;
  };
  data_integration_status: Record<string, {
    name: string;
    status: string;
    records: number;
    latency_ms: number;
  }>;
  top_critical_jobs: MaintenanceJob[];
  latest_run: OptimizationRun;
}

export interface WhatIfResult {
  scenario_id: string;
  run_timestamp: string;
  affected_jobs_count: number;
  rescheduled_jobs_count: number;
  moved_to_later_windows_count: number;
  manual_intervention_count: number;
  summary_diff: string;
  previous_blocks_count: number;
  new_blocks_count: number;
  previous_downtime_minutes: number;
  new_downtime_minutes: number;
  affected_job_details: Array<{
    job_id: string;
    status: string;
    description: string;
    previous_block: string;
    new_block: string;
  }>;
  new_schedule: Block[];
}
