import time
from typing import List, Dict, Any, Tuple
from models import (
    MaintenanceJob, BlockWindow, Resource, Train, Block,
    BlockJobAssignment, OptimizationRun, BaselineComparisonMetrics
)

class BaselineScheduler:
    """
    Standard Uncoordinated Departmental Baseline Scheduler.
    
    Mimics legacy railway maintenance planning where Engineering,
    Traction Distribution, and S&T departments schedule blocks in silos:
    - Sorts jobs by priority.
    - Assigns each job to the earliest feasible block window.
    - Strictly forbids cross-departmental coordination (each block window
      is monopolized by a single department).
    - Calculates genuine performance metrics for empirical comparison against RailOpt.
    """

    def __init__(
        self,
        jobs: List[MaintenanceJob],
        windows: List[BlockWindow],
        resources: List[Resource],
        trains: List[Train]
    ):
        self.jobs = [j.model_copy() for j in jobs]
        self.windows = [w.model_copy() for w in windows if w.status == "AVAILABLE"]
        self.resources = resources
        self.trains = trains

        # Department capacity
        self.dept_resources = {}
        for r in resources:
            if r.availability == "AVAILABLE":
                self.dept_resources[r.department_id] = self.dept_resources.get(r.department_id, 0) + 1

    def _has_train_conflict(self, window: BlockWindow) -> Tuple[bool, int]:
        parts_st = [int(p) for p in window.start_time.split(":")]
        parts_et = [int(p) for p in window.end_time.split(":")]
        win_start = parts_st[0] * 60 + parts_st[1]
        win_end = parts_et[0] * 60 + parts_et[1]
        if win_end < win_start:
            win_end += 1440

        conflicts = 0
        fatal = False
        for t in self.trains:
            if t.section_id == window.section_id:
                t_arr_p = [int(p) for p in t.arrival_time.split(":")]
                t_dep_p = [int(p) for p in t.departure_time.split(":")]
                t_arr = t_arr_p[0] * 60 + t_arr_p[1]
                t_dep = t_dep_p[0] * 60 + t_dep_p[1]
                if t_dep < t_arr:
                    t_dep += 1440

                if not (t_dep + 15 <= win_start or t_arr - 15 >= win_end):
                    conflicts += 1
                    if t.priority == 1:
                        fatal = True

        return fatal, conflicts

    def solve(self) -> Tuple[List[Block], List[str], OptimizationRun]:
        start_time = time.time()
        
        # Sort jobs strictly by priority score descending
        sorted_jobs = sorted(self.jobs, key=lambda j: -j.priority_score)
        
        # Sort windows by date and start_time
        sorted_windows = sorted(self.windows, key=lambda w: (w.date, w.start_time))

        blocks = []
        scheduled_job_ids = set()
        # Track window department usage in baseline: each window can ONLY be used by 1 department
        window_dept_used = {}  # win_id -> department
        window_jobs_assigned = {w.window_id: [] for w in sorted_windows}
        window_duration_used = {w.window_id: 0 for w in sorted_windows}

        for job in sorted_jobs:
            assigned = False
            for win in sorted_windows:
                # Check section match
                if job.section_id != win.section_id:
                    continue

                # Check high priority train conflict
                fatal, _ = self._has_train_conflict(win)
                if fatal:
                    continue

                # Baseline Rule: If window is already taken by another department, do NOT coordinate!
                curr_dept = window_dept_used.get(win.window_id)
                if curr_dept is not None and curr_dept != job.department:
                    continue

                # Check remaining window capacity
                rem_capacity = win.maximum_duration - window_duration_used[win.window_id]
                if job.duration_minutes <= rem_capacity:
                    # Assign to window
                    window_dept_used[win.window_id] = job.department
                    window_duration_used[win.window_id] += job.duration_minutes
                    window_jobs_assigned[win.window_id].append(job)
                    scheduled_job_ids.add(job.job_id)
                    assigned = True
                    break

        # Construct Blocks from allocations
        block_counter = 1
        for win in sorted_windows:
            assigned_jobs = window_jobs_assigned[win.window_id]
            if not assigned_jobs:
                continue

            dept = window_dept_used[win.window_id]
            block_job_assignments = []
            curr_offset = 0
            for j in assigned_jobs:
                block_job_assignments.append(
                    BlockJobAssignment(
                        job_id=j.job_id,
                        department=j.department,
                        description=j.description,
                        duration_minutes=j.duration_minutes,
                        start_offset_minutes=curr_offset,
                        end_offset_minutes=curr_offset + j.duration_minutes,
                        priority_score=j.priority_score,
                        required_resource=j.required_resource
                    )
                )
                curr_offset += j.duration_minutes

            _, conflicts_avoided = self._has_train_conflict(win)

            explanation = {
                "coa_window_fit": True,
                "window_type": win.block_type,
                "window_capacity_minutes": win.maximum_duration,
                "utilized_duration_minutes": curr_offset,
                "utilization_percent": round((curr_offset / win.maximum_duration) * 100, 1),
                "departments_combined": [dept],
                "jobs_count": len(assigned_jobs),
                "high_priority_train_conflicts": 0,
                "train_safety_buffer_minutes": 15,
                "downtime_minutes_saved": 0,
                "separate_blocks_avoided": 0,
                "justifications": [
                    f"Baseline single-department allocation for {dept}",
                    f"No inter-departmental coordination attempted",
                    f"Window capacity utilized sequentially ({curr_offset}/{win.maximum_duration} min)"
                ]
            }

            blocks.append(
                Block(
                    block_id=f"BLK_BASE_{block_counter:02d}",
                    section_id=win.section_id,
                    date=win.date,
                    start_time=win.start_time,
                    end_time=win.end_time,
                    duration_minutes=win.maximum_duration,
                    score=round(sum(j.priority_score for j in assigned_jobs), 1),
                    status="APPROVED",
                    block_type="SINGLE_DEPT",
                    departments=[dept],
                    jobs=block_job_assignments,
                    operational_impact="HIGH",  # High disruption due to uncoordinated closures
                    train_conflicts_avoided=conflicts_avoided,
                    coordination_benefit="None (Legacy uncoordinated single-department block)",
                    explanation=explanation
                )
            )
            block_counter += 1

        unscheduled = [j.job_id for j in sorted_jobs if j.job_id not in scheduled_job_ids]
        total_blocks = len(blocks)
        total_downtime = sum(b.duration_minutes for b in blocks)
        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        telemetry = OptimizationRun(
            run_id=f"RUN_BASE_{int(time.time())}",
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            planning_horizon="7 Days (Baseline Uncoordinated)",
            objective_score=round(sum(b.score for b in blocks), 1),
            execution_time_ms=elapsed_ms,
            solver_status="BASELINE_HEURISTIC_COMPLETED",
            total_blocks_created=total_blocks,
            coordinated_blocks_count=0,
            total_downtime_minutes=total_downtime,
            scheduled_jobs_count=len(scheduled_job_ids),
            unscheduled_jobs_count=len(unscheduled),
            coordination_rate_percent=0.0
        )

        return blocks, unscheduled, telemetry

    @classmethod
    def compare_metrics(
        cls,
        baseline_blocks: List[Block],
        baseline_unscheduled: List[str],
        baseline_run: OptimizationRun,
        railopt_blocks: List[Block],
        railopt_unscheduled: List[str],
        railopt_run: OptimizationRun
    ) -> List[BaselineComparisonMetrics]:
        """
        Dynamically calculate comparison metrics between Baseline and RailOpt.
        No hardcoded percentages.
        """
        # 1. Total Blocks Count
        base_blk_c = len(baseline_blocks)
        opt_blk_c = len(railopt_blocks)
        blk_diff = base_blk_c - opt_blk_c
        blk_imp = f"{'+' if blk_diff >= 0 else ''}{blk_diff} blocks ({round(abs(blk_diff)/max(1, base_blk_c)*100, 1)}% fewer separate closures)"

        # 2. Total Downtime
        base_dt = baseline_run.total_downtime_minutes
        opt_dt = railopt_run.total_downtime_minutes
        dt_saved = base_dt - opt_dt
        dt_imp = f"{dt_saved} mins saved ({round(dt_saved / 60, 1)} hrs saved)"

        # 3. Multi-Department Coordinated Blocks
        base_coord = baseline_run.coordinated_blocks_count
        opt_coord = railopt_run.coordinated_blocks_count
        coord_imp = f"+{opt_coord} coordinated blocks ({railopt_run.coordination_rate_percent}% vs 0%)"

        # 4. Jobs Scheduled
        base_sched = baseline_run.scheduled_jobs_count
        opt_sched = railopt_run.scheduled_jobs_count
        sched_diff = opt_sched - base_sched
        sched_imp = f"+{sched_diff} additional jobs completed ({round((sched_diff)/max(1, base_sched)*100, 1)}% increase)"

        # 5. Unscheduled Jobs Backlog
        base_unsched = len(baseline_unscheduled)
        opt_unsched = len(railopt_unscheduled)
        unsched_diff = base_unsched - opt_unsched
        unsched_imp = f"{unsched_diff} fewer deferred jobs in backlog"

        # 6. Overall Objective Score
        score_diff = round(railopt_run.objective_score - baseline_run.objective_score, 1)
        score_imp = f"+{score_diff} optimization quality index"

        metrics = [
            BaselineComparisonMetrics(
                metric_name="Separate Maintenance Blocks Required",
                baseline_value=base_blk_c,
                railopt_value=opt_blk_c,
                unit="blocks",
                improvement=blk_imp,
                impact="Fewer traffic disruption notices and less control room overhead"
            ),
            BaselineComparisonMetrics(
                metric_name="Total Track Possession / Downtime",
                baseline_value=f"{round(base_dt/60, 1)} hrs ({base_dt}m)",
                railopt_value=f"{round(opt_dt/60, 1)} hrs ({opt_dt}m)",
                unit="hours",
                improvement=dt_imp,
                impact="Maximizes network line capacity and passenger punctuality"
            ),
            BaselineComparisonMetrics(
                metric_name="Multi-Department Coordinated Blocks",
                baseline_value="0 (0.0%)",
                railopt_value=f"{opt_coord} ({railopt_run.coordination_rate_percent}%)",
                unit="rate",
                improvement=coord_imp,
                impact="Synergizes Engineering, TRD, and S&T maintenance teams"
            ),
            BaselineComparisonMetrics(
                metric_name="Maintenance Jobs Accomplished",
                baseline_value=base_sched,
                railopt_value=opt_sched,
                unit="jobs",
                improvement=sched_imp,
                impact="Drastically clears statutory safety inspection backlog"
            ),
            BaselineComparisonMetrics(
                metric_name="Unscheduled Backlog Jobs",
                baseline_value=base_unsched,
                railopt_value=opt_unsched,
                unit="jobs",
                improvement=unsched_imp,
                impact="Reduces safety risks on high-criticality railway assets"
            ),
            BaselineComparisonMetrics(
                metric_name="Planning Objective Score",
                baseline_value=baseline_run.objective_score,
                railopt_value=railopt_run.objective_score,
                unit="pts",
                improvement=score_imp,
                impact="High mathematical efficiency under multi-objective constraints"
            )
        ]

        return metrics
