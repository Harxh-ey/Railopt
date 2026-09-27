import asyncio
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from db.connection import engine, AsyncSessionLocal, Base
from db.models_db import (
    User, Department, Station, Section, Asset, Defect, MaintenanceJob,
    Resource, Train, TrainForecast, BlockWindow
)
from dataset import generate_synthetic_data
from auth.hashing import get_password_hash
from dotenv import load_dotenv

load_dotenv()

async def seed_data():
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    data = generate_synthetic_data()

    async with AsyncSessionLocal() as db:
        # ── 1. Departments (no deps) ─────────────────────────────────────
        for d in data["departments"]:
            stmt = insert(Department).values(
                id=d.department_id, name=d.name,
                working_hours=d.working_hours, max_parallel_jobs=d.maximum_parallel_jobs
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(data['departments'])} departments")

        # ── 2. Demo users ────────────────────────────────────────────────
        demo_users = [
            {"email": "superadmin@railopt.local",  "name": "Super Admin",         "role": "SUPER_ADMIN",        "dept": None},
            {"email": "engineering@railopt.local",  "name": "Eng. Admin",          "role": "ENGINEERING_ADMIN",  "dept": "ENG"},
            {"email": "traction@railopt.local",     "name": "Traction Admin",      "role": "TRACTION_ADMIN",     "dept": "TRD"},
            {"email": "snt@railopt.local",          "name": "S&T Admin",           "role": "SNT_ADMIN",          "dept": "SNT"},
            {"email": "operations@railopt.local",   "name": "Operations Viewer",   "role": "OPERATIONS_VIEWER",  "dept": None},
        ]
        for u in demo_users:
            stmt = insert(User).values(
                email=u["email"],
                full_name=u["name"],
                hashed_password=get_password_hash("RailOpt@2026!"),
                role=u["role"],
                department_id=u["dept"]
            ).on_conflict_do_update(
                index_elements=["email"],
                set_={
                    "hashed_password": get_password_hash("RailOpt@2026!"),
                    "role": u["role"],
                    "full_name": u["name"],
                    "department_id": u["dept"],
                    "is_active": True
                }
            )
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(demo_users)} demo users")

        # ── 3. Stations (no deps) ─────────────────────────────────────────
        for s in data["stations"]:
            stmt = insert(Station).values(
                station_id=s.station_id, name=s.name, code=s.code,
                division=s.division, track_count=s.track_count,
                x_coord=s.x_coord, y_coord=s.y_coord
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(data['stations'])} stations")

        # ── 4. Sections (depends on stations) ────────────────────────────
        for s in data["sections"]:
            stmt = insert(Section).values(
                section_id=s.section_id,
                source_station_id=s.source_station,
                destination_station_id=s.destination_station,
                length_km=s.length_km, track_count=s.track_count,
                electrified=s.electrified, operational_priority=s.operational_priority,
                max_speed_kmh=s.max_speed_kmh, current_status=s.current_status
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(data['sections'])} sections")

        # ── 5. Assets (depends on sections) ──────────────────────────────
        valid_section_ids = {s.section_id for s in data["sections"]}
        valid_assets = [a for a in data["assets"] if a.section_id in valid_section_ids]
        for a in valid_assets:
            stmt = insert(Asset).values(
                asset_id=a.asset_id, asset_type=a.asset_type, section_id=a.section_id,
                installation_date=a.installation_date, criticality=a.criticality,
                condition=a.condition, last_maintenance_date=a.last_maintenance_date,
                next_due_date=a.next_due_date, failure_count=a.failure_count,
                availability=a.availability
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(valid_assets)} assets")

        # ── 6. Defects (depends on assets) ───────────────────────────────
        valid_asset_ids = {a.asset_id for a in valid_assets}
        valid_defects = [d for d in data["defects"] if d.asset_id in valid_asset_ids]
        for d in valid_defects:
            stmt = insert(Defect).values(
                defect_id=d.defect_id, source_system=d.source_system, asset_id=d.asset_id,
                department=d.department, reported_at=d.reported_at, defect_type=d.defect_type,
                severity=d.severity, description=d.description, status=d.status
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(valid_defects)} defects (of {len(data['defects'])} total)")

        # ── 7. Maintenance jobs (depends on assets + sections) ────────────
        # Build lookup: section_id → first valid asset_id for remapping
        section_to_asset: dict = {}
        for a in valid_assets:
            if a.section_id not in section_to_asset:
                section_to_asset[a.section_id] = a.asset_id

        skipped_jobs = 0
        seeded_jobs = 0
        for j in data["maintenance_jobs"]:
            if j.section_id not in valid_section_ids:
                skipped_jobs += 1
                continue
            # Remap asset_id if it doesn't exist — use the first asset in the same section
            asset_id = j.asset_id if j.asset_id in valid_asset_ids else section_to_asset.get(j.section_id)
            if not asset_id:
                skipped_jobs += 1
                continue
            stmt = insert(MaintenanceJob).values(
                job_id=j.job_id, asset_id=asset_id, section_id=j.section_id,
                department=j.department, maintenance_type=j.maintenance_type,
                description=j.description, duration_minutes=j.duration_minutes,
                criticality=j.criticality, urgency=j.urgency, asset_impact=j.asset_impact,
                due_date=j.due_date, required_resource=j.required_resource,
                block_requirement=j.block_requirement, status=j.status,
                overdue_days=j.overdue_days, failure_history=j.failure_history,
                priority_score=j.priority_score, isolation_required=j.isolation_required,
                compatible_departments=j.compatible_departments
            ).on_conflict_do_nothing()
            await db.execute(stmt)
            seeded_jobs += 1
        await db.commit()
        print(f"  Seeded {seeded_jobs} maintenance jobs ({skipped_jobs} skipped — no section)")


        # ── 8. Resources (depends on departments) ─────────────────────────
        for r in data["resources"]:
            stmt = insert(Resource).values(
                resource_id=r.resource_id, department_id=r.department_id,
                resource_type=r.resource_type, skill=r.skill, availability=r.availability
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(data['resources'])} resources")

        # ── 9. Trains (depends on sections) ──────────────────────────────
        valid_trains = [t for t in data["trains"] if t.section_id in valid_section_ids]
        for t in valid_trains:
            stmt = insert(Train).values(
                train_id=t.train_id, train_number=t.train_number, train_name=t.train_name,
                train_type=t.train_type, section_id=t.section_id,
                arrival_time=t.arrival_time, departure_time=t.departure_time,
                direction=t.direction, priority=t.priority
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(valid_trains)} trains")

        # ── 10. Train forecasts (depends on sections) ─────────────────────
        valid_forecasts = [f for f in data["train_forecasts"] if f.section_id in valid_section_ids]
        for f in valid_forecasts:
            stmt = insert(TrainForecast).values(
                forecast_id=f.forecast_id, section_id=f.section_id, date=f.date,
                expected_total_trains=f.expected_total_trains,
                expected_goods_trains=f.expected_goods_trains,
                peak_period=f.peak_period, confidence=f.confidence
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(valid_forecasts)} train forecasts")

        # ── 11. Block windows (depends on sections) ────────────────────────
        valid_windows = [w for w in data["block_windows"] if w.section_id in valid_section_ids]
        for w in valid_windows:
            stmt = insert(BlockWindow).values(
                window_id=w.window_id, section_id=w.section_id, date=w.date,
                start_time=w.start_time, end_time=w.end_time, block_type=w.block_type,
                maximum_duration=w.maximum_duration, status=w.status
            ).on_conflict_do_nothing()
            await db.execute(stmt)
        await db.commit()
        print(f"  Seeded {len(valid_windows)} block windows")

    print("\nOK: Seeding completed successfully.")
    print("\nDemo accounts (all use password: RailOpt@2026!):")
    for u in demo_users:
        print(f"  {u['email']:40s} [{u['role']}]")

if __name__ == "__main__":
    asyncio.run(seed_data())
