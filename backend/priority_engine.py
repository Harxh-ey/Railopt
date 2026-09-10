from typing import Dict, Any, Tuple
from models import MaintenanceJob

class PriorityEngine:
    """
    Explainable weighted priority scoring engine for railway maintenance activities.
    
    Factors considered:
    1. Criticality of Asset / Failure (weight 0.25): Inherent asset importance to safe running
    2. Urgency of Maintenance (weight 0.25): Operational necessity to address before speed restrictions
    3. Asset Availability Impact (weight 0.20): Impact on overall section throughput
    4. Overdue Factor (weight 0.15): Penalty for maintenance exceeding statutory periodic window
    5. Failure History (weight 0.15): Repeat breakdown frequency from TMS/SMMS/TDMS
    
    Produces an explainable normalized score from 0 to 100.
    """

    WEIGHTS = {
        "criticality": 2.5,     # Max 10 * 2.5 = 25
        "urgency": 2.5,         # Max 10 * 2.5 = 25
        "asset_impact": 2.0,    # Max 10 * 2.0 = 20
        "overdue": 1.5,         # Max 10 * 1.5 = 15
        "failure_history": 1.5  # Max 10 * 1.5 = 15
    }

    FAILURE_HISTORY_SCORES = {
        "LOW": 3.0,
        "MEDIUM": 6.5,
        "HIGH": 10.0
    }

    @classmethod
    def calculate_priority(cls, job: MaintenanceJob) -> Tuple[float, Dict[str, Any]]:
        # Normalize overdue days (cap at 10 days = 10.0 pts)
        overdue_factor = min(10.0, float(max(0, job.overdue_days)))
        
        # Failure history rating
        history_factor = cls.FAILURE_HISTORY_SCORES.get(job.failure_history.upper(), 4.0)

        # Component contributions
        c_score = job.criticality * cls.WEIGHTS["criticality"]
        u_score = job.urgency * cls.WEIGHTS["urgency"]
        a_score = job.asset_impact * cls.WEIGHTS["asset_impact"]
        o_score = overdue_factor * cls.WEIGHTS["overdue"]
        h_score = history_factor * cls.WEIGHTS["failure_history"]

        total_score = round(min(100.0, max(5.0, c_score + u_score + a_score + o_score + h_score)), 1)

        breakdown = {
            "criticality_points": round(c_score, 1),
            "urgency_points": round(u_score, 1),
            "asset_impact_points": round(a_score, 1),
            "overdue_points": round(o_score, 1),
            "failure_history_points": round(h_score, 1),
            "total_score": total_score,
            "weights_used": cls.WEIGHTS,
            "formula": "2.5*Criticality + 2.5*Urgency + 2.0*AssetImpact + 1.5*OverdueFactor + 1.5*FailureHistory"
        }

        return total_score, breakdown

    @classmethod
    def score_all_jobs(cls, jobs: list) -> list:
        for j in jobs:
            score, breakdown = cls.calculate_priority(j)
            j.priority_score = score
        return jobs
