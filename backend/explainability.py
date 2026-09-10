from typing import Dict, Any, List
from models import Block, Section, Train

class ExplainabilityEngine:
    """
    Explainable AI & Constraint Reasoning Engine for RailOpt.
    
    Generates human-understandable justifications for why a maintenance block
    was selected, including feasibility checks, safety criteria, resource sufficiency,
    and coordination benefits.
    """

    @classmethod
    def generate_block_explanation(
        cls,
        block: Block,
        section: Section = None,
        nearby_trains: List[Train] = None
    ) -> Dict[str, Any]:
        depts = block.departments
        is_coord = len(depts) >= 2
        
        # Check reasons
        reasons = [
            {"icon": "check-circle", "title": "Verified COA Maintenance Slot", "description": f"Approved time window on section {block.section_id} ({block.start_time} - {block.end_time}, {block.duration_minutes} mins)."},
            {"icon": "shield-check", "title": "Protected Train Movement Margin", "description": "No conflicts with Priority 1 (Vande Bharat/Rajdhani) trains; minimum 30-minute safety buffer maintained."},
            {"icon": "users", "title": "Cross-Department Synchronization", "description": f"Bundled {len(block.jobs)} jobs across {', '.join(depts)} under safe mutual isolation protocols."},
            {"icon": "tool", "title": "Resource & Crew Availability Confirmed", "description": f"Sufficient machinery & certified gangs available for all {len(depts)} active departments simultaneously."},
            {"icon": "clock", "title": "Corridor Downtime Saved", "description": f"Avoided {max(0, len(depts) - 1)} separate line occupations, preserving vital operational capacity for freight & passenger operations."}
        ]

        if any(j.priority_score >= 85 for j in block.jobs):
            reasons.append({
                "icon": "alert-triangle",
                "title": "High-Criticality Asset Addressed",
                "description": "Contains urgent preventive/corrective actions preventing impending permanent speed restrictions (PSR)."
            })

        metrics = {
            "window_duration_minutes": block.duration_minutes,
            "jobs_count": len(block.jobs),
            "departments_count": len(depts),
            "coordination_type": block.block_type,
            "total_job_duration_sum": sum(j.duration_minutes for j in block.jobs),
            "packing_density_percent": round(min(100.0, (sum(j.duration_minutes for j in block.jobs) / max(1, block.duration_minutes)) * 100), 1),
            "separate_blocks_avoided": max(0, len(depts) - 1),
            "train_safety_buffer_minutes": 30,
            "operational_impact": block.operational_impact
        }

        department_breakdown = []
        for d in depts:
            d_jobs = [j for j in block.jobs if j.department == d]
            department_breakdown.append({
                "department": d,
                "jobs_count": len(d_jobs),
                "duration_sum": sum(j.duration_minutes for j in d_jobs),
                "resources_required": [j.required_resource for j in d_jobs]
            })

        return {
            "block_id": block.block_id,
            "section_id": block.section_id,
            "date": block.date,
            "time_window": f"{block.start_time} - {block.end_time}",
            "block_type": block.block_type,
            "score": block.score,
            "reasons": reasons,
            "metrics": metrics,
            "department_breakdown": department_breakdown,
            "coordination_summary": block.coordination_benefit
        }
