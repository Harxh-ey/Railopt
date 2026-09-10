import time
from typing import List, Dict, Any, Optional
from models import (
    MaintenanceJob, BlockWindow, Resource, Train, Section,
    Block, WhatIfMutation, WhatIfResult
)
from optimizer import BlockOptimizer
from priority_engine import PriorityEngine

class WhatIfSimulator:
    """
    What-If Scenario Simulation Engine for RailOpt.
    
    Allows dynamic disruption modeling:
    - Block window cancellations (e.g., freight corridor prioritization)
    - Maintenance job delays and priority escalations
    - Crew and machinery breakdowns (resource unavailability)
    - Ad-hoc special train path insertions
    
    Executes re-optimization using CP-SAT and performs rigorous delta analysis.
    """

    def __init__(
        self,
        jobs: List[MaintenanceJob],
        windows: List[BlockWindow],
        resources: List[Resource],
        trains: List[Train],
        sections: List[Section]
    ):
        self.original_jobs = jobs
        self.original_windows = windows
        self.original_resources = resources
        self.original_trains = trains
        self.sections = sections

    def simulate_and_reoptimize(
        self,
        previous_blocks: List[Block],
        mutations: List[WhatIfMutation]
    ) -> WhatIfResult:
        # Clone datasets for mutation
        jobs_copy = [j.model_copy() for j in self.original_jobs]
        windows_copy = [w.model_copy() for w in self.original_windows]
        resources_copy = [r.model_copy() for r in self.original_resources]
        trains_copy = [t.model_copy() for t in self.original_trains]

        # Map previous assignments: job_id -> (block_id, date, start_time)
        prev_job_block_map = {}
        for b in previous_blocks:
            for j_assign in b.jobs:
                prev_job_block_map[j_assign.job_id] = {
                    "block_id": b.block_id,
                    "date": b.date,
                    "start_time": b.start_time,
                    "section_id": b.section_id
                }

        affected_job_ids = set()
        mutation_descriptions = []

        # Apply mutations
        for m in mutations:
            if m.mutation_type == "REMOVE_WINDOW":
                for w in windows_copy:
                    if w.window_id == m.target_id:
                        w.status = "CANCELLED"
                        mutation_descriptions.append(f"Cancelled Block Window {w.window_id} ({w.section_id} on {w.date})")
                        # Identify jobs that were scheduled in this window/block
                        for b in previous_blocks:
                            if b.section_id == w.section_id and b.date == w.date and b.start_time == w.start_time:
                                for ja in b.jobs:
                                    affected_job_ids.add(ja.job_id)

            elif m.mutation_type == "DELAY_JOB":
                delay_days = m.parameters.get("delay_days", 2)
                for j in jobs_copy:
                    if j.job_id == m.target_id:
                        j.overdue_days += delay_days
                        j.urgency = min(10, j.urgency + 1)
                        PriorityEngine.calculate_priority(j)
                        affected_job_ids.add(j.job_id)
                        mutation_descriptions.append(f"Delayed Job {j.job_id} by {delay_days} days (Urgency escalated to {j.urgency})")

            elif m.mutation_type == "CHANGE_PRIORITY":
                new_urg = m.parameters.get("urgency", 10)
                new_crit = m.parameters.get("criticality", 10)
                for j in jobs_copy:
                    if j.job_id == m.target_id:
                        j.urgency = new_urg
                        j.criticality = new_crit
                        PriorityEngine.calculate_priority(j)
                        affected_job_ids.add(j.job_id)
                        mutation_descriptions.append(f"Escalated Job {j.job_id} Priority to Criticality={new_crit}, Urgency={new_urg}")

            elif m.mutation_type == "DISABLE_RESOURCE":
                for r in resources_copy:
                    if r.resource_id == m.target_id:
                        r.availability = "MAINTENANCE"
                        mutation_descriptions.append(f"Resource {r.resource_id} ({r.resource_type}) set to UNAVAILABLE")
                        # Find jobs requiring this resource
                        for j in jobs_copy:
                            if j.required_resource == r.skill and j.job_id in prev_job_block_map:
                                affected_job_ids.add(j.job_id)

            elif m.mutation_type == "ADD_TRAIN_CONFLICT":
                sec = m.parameters.get("section_id", "SEC01")
                arr_t = m.parameters.get("arrival_time", "02:00")
                dep_t = m.parameters.get("departure_time", "02:30")
                new_trn = Train(
                    train_id=f"TRN_EMERGENCY_{int(time.time())}",
                    train_number="00999",
                    train_name="Emergency Freight Rake (VIP)",
                    train_type="Rajdhani/Vande Bharat",
                    section_id=sec,
                    arrival_time=arr_t,
                    departure_time=dep_t,
                    direction="UP",
                    priority=1
                )
                trains_copy.append(new_trn)
                mutation_descriptions.append(f"Injected Emergency High-Priority Train 00999 on section {sec} ({arr_t}-{dep_t})")
                for b in previous_blocks:
                    if b.section_id == sec:
                        for ja in b.jobs:
                            affected_job_ids.add(ja.job_id)

        # Re-run CP-SAT Optimization
        optimizer = BlockOptimizer(jobs_copy, windows_copy, resources_copy, trains_copy, self.sections)
        new_blocks, new_unscheduled, new_telemetry = optimizer.solve()

        # Build new job-to-block mapping
        new_job_block_map = {}
        for b in new_blocks:
            for ja in b.jobs:
                new_job_block_map[ja.job_id] = {
                    "block_id": b.block_id,
                    "date": b.date,
                    "start_time": b.start_time,
                    "section_id": b.section_id
                }

        # Compute dynamic deltas
        rescheduled_jobs = []
        moved_to_later = []
        manual_intervention = []
        affected_details = []

        for j_id in affected_job_ids:
            old_info = prev_job_block_map.get(j_id)
            new_info = new_job_block_map.get(j_id)

            if new_info is None:
                manual_intervention.append(j_id)
                status_str = "MANUAL_INTERVENTION_REQUIRED"
                desc = "Could not find a feasible alternative window; job returned to deferred maintenance backlog."
            elif old_info and (old_info["date"] != new_info["date"] or old_info["start_time"] != new_info["start_time"]):
                if new_info["date"] > old_info["date"]:
                    moved_to_later.append(j_id)
                    status_str = "MOVED_TO_LATER_WINDOW"
                    desc = f"Deferred from {old_info['date']} {old_info['start_time']} to {new_info['date']} {new_info['start_time']} ({new_info['block_id']})."
                else:
                    rescheduled_jobs.append(j_id)
                    status_str = "RESCHEDULED"
                    desc = f"Shifted into block {new_info['block_id']} on {new_info['date']} at {new_info['start_time']}."
            else:
                rescheduled_jobs.append(j_id)
                status_str = "CONFIRMED_FEASIBLE"
                desc = f"Maintained in block {new_info['block_id']} on {new_info['date']}."

            affected_details.append({
                "job_id": j_id,
                "status": status_str,
                "description": desc,
                "previous_block": old_info.get("block_id") if old_info else "None",
                "new_block": new_info.get("block_id") if new_info else "Unscheduled"
            })

        prev_dt = sum(b.duration_minutes for b in previous_blocks)
        new_dt = sum(b.duration_minutes for b in new_blocks)

        summary_diff = (
            f"Scenario Disruption Processed: {'; '.join(mutation_descriptions)}. "
            f"{len(affected_job_ids)} jobs were affected: {len(rescheduled_jobs)} rescheduled immediately, "
            f"{len(moved_to_later)} deferred to later slots, and {len(manual_intervention)} require manual intervention."
        )

        return WhatIfResult(
            scenario_id=f"SIM_{int(time.time())}",
            run_timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            affected_jobs_count=len(affected_job_ids),
            rescheduled_jobs_count=len(rescheduled_jobs),
            moved_to_later_windows_count=len(moved_to_later),
            manual_intervention_count=len(manual_intervention),
            summary_diff=summary_diff,
            previous_blocks_count=len(previous_blocks),
            new_blocks_count=len(new_blocks),
            previous_downtime_minutes=prev_dt,
            new_downtime_minutes=new_dt,
            affected_job_details=affected_details,
            new_schedule=new_blocks
        )
