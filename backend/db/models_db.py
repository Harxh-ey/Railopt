import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, JSON, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.connection import Base
import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String)
    department_id = Column(String, ForeignKey('departments.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Department(Base):
    __tablename__ = 'departments'
    id = Column(String, primary_key=True)
    name = Column(String)
    working_hours = Column(String)
    max_parallel_jobs = Column(Integer)

class Station(Base):
    __tablename__ = 'stations'
    station_id = Column(String, primary_key=True)
    name = Column(String)
    code = Column(String)
    division = Column(String)
    track_count = Column(Integer)
    x_coord = Column(Float)
    y_coord = Column(Float)

class Section(Base):
    __tablename__ = 'sections'
    section_id = Column(String, primary_key=True)
    source_station_id = Column(String, ForeignKey('stations.station_id'))
    destination_station_id = Column(String, ForeignKey('stations.station_id'))
    length_km = Column(Float)
    track_count = Column(Integer)
    electrified = Column(Boolean)
    operational_priority = Column(Integer)
    max_speed_kmh = Column(Integer)
    current_status = Column(String)

class Asset(Base):
    __tablename__ = 'assets'
    asset_id = Column(String, primary_key=True)
    asset_type = Column(String)
    section_id = Column(String, ForeignKey('sections.section_id'))
    installation_date = Column(String)
    criticality = Column(Integer)
    condition = Column(String)
    last_maintenance_date = Column(String)
    next_due_date = Column(String)
    failure_count = Column(Integer)
    availability = Column(Float)

class Defect(Base):
    __tablename__ = 'defects'
    defect_id = Column(String, primary_key=True)
    source_system = Column(String)
    asset_id = Column(String, ForeignKey('assets.asset_id'))
    department = Column(String)
    reported_at = Column(String)
    defect_type = Column(String)
    severity = Column(String)
    description = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MaintenanceJob(Base):
    __tablename__ = 'maintenance_jobs'
    job_id = Column(String, primary_key=True)
    asset_id = Column(String, ForeignKey('assets.asset_id'))
    section_id = Column(String, ForeignKey('sections.section_id'))
    department = Column(String)
    maintenance_type = Column(String)
    description = Column(String)
    duration_minutes = Column(Integer)
    criticality = Column(Integer)
    urgency = Column(Integer)
    asset_impact = Column(Integer)
    due_date = Column(String)
    required_resource = Column(String)
    block_requirement = Column(String)
    status = Column(String)
    overdue_days = Column(Integer)
    failure_history = Column(String)
    priority_score = Column(Float)
    isolation_required = Column(Boolean)
    compatible_departments = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Resource(Base):
    __tablename__ = 'resources'
    resource_id = Column(String, primary_key=True)
    department_id = Column(String, ForeignKey('departments.id'))
    resource_type = Column(String)
    skill = Column(String)
    availability = Column(String)

class Train(Base):
    __tablename__ = 'trains'
    train_id = Column(String, primary_key=True)
    train_number = Column(String)
    train_name = Column(String)
    train_type = Column(String)
    section_id = Column(String, ForeignKey('sections.section_id'))
    arrival_time = Column(String)
    departure_time = Column(String)
    direction = Column(String)
    priority = Column(Integer)

class TrainForecast(Base):
    __tablename__ = 'train_forecasts'
    forecast_id = Column(String, primary_key=True)
    section_id = Column(String, ForeignKey('sections.section_id'))
    date = Column(String)
    expected_total_trains = Column(Integer)
    expected_goods_trains = Column(Integer)
    peak_period = Column(String)
    confidence = Column(Float)

class BlockWindow(Base):
    __tablename__ = 'block_windows'
    window_id = Column(String, primary_key=True)
    section_id = Column(String, ForeignKey('sections.section_id'))
    date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    block_type = Column(String)
    maximum_duration = Column(Integer)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class OptimizationRun(Base):
    __tablename__ = 'optimization_runs'
    run_id = Column(String, primary_key=True)
    timestamp = Column(String)
    planning_horizon = Column(String)
    objective_score = Column(Float)
    execution_time_ms = Column(Float)
    solver_status = Column(String)
    total_blocks_created = Column(Integer)
    coordinated_blocks_count = Column(Integer)
    total_downtime_minutes = Column(Integer)
    scheduled_jobs_count = Column(Integer)
    unscheduled_jobs_count = Column(Integer)
    coordination_rate_percent = Column(Float)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

class Block(Base):
    __tablename__ = 'blocks'
    block_id = Column(String, primary_key=True)
    section_id = Column(String, ForeignKey('sections.section_id'))
    optimization_run_id = Column(String, ForeignKey('optimization_runs.run_id'))
    date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    duration_minutes = Column(Integer)
    score = Column(Float)
    status = Column(String)
    block_type = Column(String)
    departments = Column(JSON)
    operational_impact = Column(String)
    train_conflicts_avoided = Column(Integer)
    coordination_benefit = Column(String)
    explanation = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BlockJobAssignment(Base):
    __tablename__ = 'block_job_assignments'
    id = Column(Integer, primary_key=True, autoincrement=True)
    block_id = Column(String, ForeignKey('blocks.block_id'))
    job_id = Column(String, ForeignKey('maintenance_jobs.job_id'))
    department = Column(String)
    description = Column(String)
    duration_minutes = Column(Integer)
    start_offset_minutes = Column(Integer)
    end_offset_minutes = Column(Integer)
    priority_score = Column(Float)
    required_resource = Column(String)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    user_email = Column(String)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    metadata_ = Column("metadata", JSON)
    ip_address = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
