import random
from typing import List, Dict, Any
from models import (
    Station, Section, Asset, Defect, MaintenanceJob, Department,
    Resource, Train, TrainForecast, BlockWindow
)
from priority_engine import PriorityEngine

def generate_synthetic_data() -> Dict[str, Any]:
    # 1. 12 Stations
    stations = [
        Station(station_id="STN01", name="Anandpur", code="ANP", track_count=4, x_coord=120, y_coord=140),
        Station(station_id="STN02", name="Bharat Nagar", code="BNG", track_count=4, x_coord=260, y_coord=140),
        Station(station_id="STN03", name="Chandrapur", code="CDP", track_count=4, x_coord=400, y_coord=140),
        Station(station_id="STN04", name="Devgarh", code="DVG", track_count=3, x_coord=520, y_coord=220),
        Station(station_id="STN05", name="Ekta Junction", code="EKJ", track_count=6, x_coord=640, y_coord=300),
        Station(station_id="STN06", name="Faridpur", code="FDP", track_count=4, x_coord=760, y_coord=220),
        Station(station_id="STN07", name="Ganga Nagar", code="GNR", track_count=3, x_coord=880, y_coord=140),
        Station(station_id="STN08", name="Haripur", code="HRP", track_count=4, x_coord=800, y_coord=380),
        Station(station_id="STN09", name="Indrapur", code="IDP", track_count=4, x_coord=680, y_coord=470),
        Station(station_id="STN10", name="Jaitpur", code="JTP", track_count=3, x_coord=500, y_coord=470),
        Station(station_id="STN11", name="Krishnapur", code="KNP", track_count=4, x_coord=340, y_coord=410),
        Station(station_id="STN12", name="Lakshmipur", code="LMP", track_count=3, x_coord=200, y_coord=320),
    ]

    # 2. 20 Sections
    sections_raw = [
        ("SEC01", "STN01", "STN02", 24.5, 2, True, 1),
        ("SEC02", "STN02", "STN03", 31.0, 2, True, 1),
        ("SEC03", "STN03", "STN04", 18.2, 1, True, 2),
        ("SEC04", "STN04", "STN05", 28.0, 2, True, 1),
        ("SEC05", "STN05", "STN06", 35.4, 2, True, 1),
        ("SEC06", "STN06", "STN07", 22.0, 2, True, 2),
        ("SEC07", "STN07", "STN08", 40.5, 1, False, 3),
        ("SEC08", "STN08", "STN09", 19.8, 2, True, 2),
        ("SEC09", "STN09", "STN10", 27.2, 2, True, 1),
        ("SEC10", "STN10", "STN11", 33.1, 2, True, 2),
        ("SEC11", "STN11", "STN12", 21.4, 2, True, 2),
        ("SEC12", "STN05", "STN09", 45.0, 1, True, 2),
        ("SEC13", "STN03", "STN06", 38.6, 2, True, 1),
        ("SEC14", "STN02", "STN07", 50.2, 1, True, 3),
        ("SEC15", "STN04", "STN08", 42.0, 1, True, 2),
        ("SEC16", "STN01", "STN04", 36.5, 2, True, 2),
        ("SEC17", "STN06", "STN10", 29.0, 2, True, 2),
        ("SEC18", "STN08", "STN12", 48.4, 2, True, 1),
        ("SEC19", "STN11", "STN09", 25.8, 1, True, 2),
        ("SEC20", "STN05", "STN12", 52.0, 2, True, 1),
    ]

    sections = [
        Section(
            section_id=s[0],
            source_station=s[1],
            destination_station=s[2],
            length_km=s[3],
            track_count=s[4],
            electrified=s[5],
            operational_priority=s[6],
            max_speed_kmh=130 if s[4] >= 2 else 100,
            current_status="NORMAL" if s[0] != "SEC01" and s[0] != "SEC05" else "MAINTENANCE_PLANNED"
        )
        for s in sections_raw
    ]

    # 3. 4 Departments
    departments = [
        Department(department_id="ENG", name="Engineering", working_hours="24x7", maximum_parallel_jobs=6),
        Department(department_id="TRD", name="Traction Distribution", working_hours="24x7", maximum_parallel_jobs=6),
        Department(department_id="SNT", name="Signal & Telecommunication", working_hours="24x7", maximum_parallel_jobs=6),
        Department(department_id="OPT", name="Operating", working_hours="24x7", maximum_parallel_jobs=12),
    ]

    # 4. 18 Resources (6 ENG, 6 TRD, 6 S&T)
    resources = [
        # Engineering Gangs & Machinery
        Resource(resource_id="RES_ENG_01", department_id="ENG", resource_type="BCM_Tamping_Gang", skill="Track Tamping & Alignment", availability="AVAILABLE"),
        Resource(resource_id="RES_ENG_02", department_id="ENG", resource_type="Weld_Repair_Gang", skill="Alumino-Thermic Rail Welding", availability="AVAILABLE"),
        Resource(resource_id="RES_ENG_03", department_id="ENG", resource_type="Turnout_Overhaul_Team", skill="Point & Crossing Replacement", availability="AVAILABLE"),
        Resource(resource_id="RES_ENG_04", department_id="ENG", resource_type="DTS_Stabilizer_Crew", skill="Dynamic Track Stabilization", availability="AVAILABLE"),
        Resource(resource_id="RES_ENG_05", department_id="ENG", resource_type="Track_Renewal_Gang", skill="Through Rail Renewal (TRR)", availability="AVAILABLE"),
        Resource(resource_id="RES_ENG_06", department_id="ENG", resource_type="Ultrasonic_Flaw_Team", skill="USFD Testing & De-stressing", availability="AVAILABLE"),

        # TRD Tower Wagons & Linesmen
        Resource(resource_id="RES_TRD_01", department_id="TRD", resource_type="Tower_Wagon_A", skill="OHE Contact Wire Adjustment", availability="AVAILABLE"),
        Resource(resource_id="RES_TRD_02", department_id="TRD", resource_type="Tower_Wagon_B", skill="Cantilever & Insulator Replacement", availability="AVAILABLE"),
        Resource(resource_id="RES_TRD_03", department_id="TRD", resource_type="TSS_Substation_Crew", skill="Traction Substation Overhaul", availability="AVAILABLE"),
        Resource(resource_id="RES_TRD_04", department_id="TRD", resource_type="OHE_Inspection_Team", skill="Thermal Imaging & Catenary Check", availability="AVAILABLE"),
        Resource(resource_id="RES_TRD_05", department_id="TRD", resource_type="Tower_Wagon_C", skill="Section Insulator Tuning", availability="AVAILABLE"),
        Resource(resource_id="RES_TRD_06", department_id="TRD", resource_type="Power_Isolation_Squad", skill="Earthing & Discharge Rod Specialist", availability="AVAILABLE"),

        # Signal & Telecom Technicians
        Resource(resource_id="RES_SNT_01", department_id="SNT", resource_type="Interlocking_Team_A", skill="Electronic Interlocking (EI) Test", availability="AVAILABLE"),
        Resource(resource_id="RES_SNT_02", department_id="SNT", resource_type="Point_Machine_Gang", skill="Point Motor & Detection Overhaul", availability="AVAILABLE"),
        Resource(resource_id="RES_SNT_03", department_id="SNT", resource_type="Track_Circuit_Crew", skill="Audio Frequency Track Circuit (AFTC)", availability="AVAILABLE"),
        Resource(resource_id="RES_SNT_04", department_id="SNT", resource_type="Axle_Counter_Team", skill="Multi-Section Digital Axle Counter", availability="AVAILABLE"),
        Resource(resource_id="RES_SNT_05", department_id="SNT", resource_type="Signal_Cable_Testing", skill="Signaling Cable Meggering & Relays", availability="AVAILABLE"),
        Resource(resource_id="RES_SNT_06", department_id="SNT", resource_type="Telecom_OFC_Crew", skill="Optical Fiber & V-SAT Alignment", availability="AVAILABLE"),
    ]

    # 5. 50 Assets across sections
    asset_types = [
        ("Track", "ENG"), ("Turnout", "ENG"), ("Sleeper_Bed", "ENG"),
        ("OHE_Mast", "TRD"), ("Substation", "TRD"), ("Cantilever", "TRD"),
        ("Point_Machine", "SNT"), ("Axle_Counter", "SNT"), ("Track_Circuit", "SNT"), ("Signal_Aspect", "SNT")
    ]
    assets = []
    # Seed known assets for critical scenario SEC01
    assets.append(Asset(
        asset_id="AST_SEC01_ENG_01", asset_type="Track", section_id="SEC01",
        installation_date="2020-03-15", criticality=9, condition="POOR",
        last_maintenance_date="2026-07-10", next_due_date="2026-09-12",
        failure_count=4, availability=94.2
    ))
    assets.append(Asset(
        asset_id="AST_SEC01_TRD_01", asset_type="OHE_Mast", section_id="SEC01",
        installation_date="2018-05-20", criticality=8, condition="FAIR",
        last_maintenance_date="2026-06-18", next_due_date="2026-09-13",
        failure_count=3, availability=95.8
    ))
    assets.append(Asset(
        asset_id="AST_SEC01_SNT_01", asset_type="Signal_Aspect", section_id="SEC01",
        installation_date="2021-11-04", criticality=8, condition="FAIR",
        last_maintenance_date="2026-08-01", next_due_date="2026-09-14",
        failure_count=2, availability=97.1
    ))

    # Generate remaining 47 assets spread across sections
    for i in range(4, 51):
        atype, _ = asset_types[(i - 1) % len(asset_types)]
        sec = sections_raw[(i - 1) % len(sections_raw)][0]
        crit = random.choice([5, 6, 7, 8, 9, 10])
        cond = random.choice(["GOOD", "GOOD", "FAIR", "FAIR", "POOR", "CRITICAL"])
        fail_c = random.randint(0, 5)
        avail = round(99.5 - (fail_c * 0.9) - (1.5 if cond in ["POOR", "CRITICAL"] else 0.0), 1)
        assets.append(Asset(
            asset_id=f"AST_{sec}_{i:02d}",
            asset_type=atype,
            section_id=sec,
            installation_date=f"201{random.randint(5, 9)}-{random.randint(1, 12):02d}-15",
            criticality=crit,
            condition=cond,
            last_maintenance_date="2026-07-20",
            next_due_date=f"2026-09-{random.randint(11, 25):02d}",
            failure_count=fail_c,
            availability=avail
        ))

    # 6. 100 Defects (linked to TMS, SMMS, TDMS)
    defects = []
    # Critical defects for SEC01
    defects.append(Defect(
        defect_id="DEF_TMS_001", source_system="TMS", asset_id="AST_SEC01_ENG_01",
        department="Engineering", reported_at="2026-09-08 09:30",
        defect_type="Track Geometry Variation", severity="MAJOR",
        description="Uneven cross-level error > 8mm detected by Track Recording Car near Km 18/4.",
        status="PENDING"
    ))
    defects.append(Defect(
        defect_id="DEF_TDMS_001", source_system="TDMS", asset_id="AST_SEC01_TRD_01",
        department="Traction Distribution", reported_at="2026-09-08 14:15",
        defect_type="Contact Wire Wear & Sag", severity="MAJOR",
        description="OHE contact wire height lowered by 45mm, potential pantograph entangling risk.",
        status="PENDING"
    ))
    defects.append(Defect(
        defect_id="DEF_SMMS_001", source_system="SMMS", asset_id="AST_SEC01_SNT_01",
        department="Signal & Telecommunication", reported_at="2026-09-09 11:20",
        defect_type="Signal Cable Meggering Drop", severity="MEDIUM",
        description="Signaling multicore copper cable insulation value dropped to 0.7 M-ohm/km.",
        status="PENDING"
    ))

    # 97 more defects across the assets
    defect_templates = {
        "Engineering": [
            ("Rail Joint Gap Exceeded", "MAJOR", "Fishplate bolt loose, gap exceeded thermal expansion limit"),
            ("Turnout Tongue Rail Wear", "CRITICAL", "Points 102A chipping on switch rail edge"),
            ("Ballast Deficiency", "MEDIUM", "Cushion depth less than 250mm, tamping required"),
            ("USFD Rail Flaw", "CRITICAL", "Transverse fissure detected in head of left rail"),
            ("Check Rail Clearance Deviation", "MEDIUM", "Check rail clearance out of tolerance by 5mm")
        ],
        "Traction Distribution": [
            ("Cantilever Bracket Crack", "CRITICAL", "Micro-fissure observed on drop arm bracket insulator"),
            ("Neutral Section Carbon Deposition", "MAJOR", "Excess arcing noticed at section insulator runner"),
            ("Earth Continuity Bond Disconnected", "MAJOR", "Mast earthing bond cut near bridge pillar"),
            ("Jumper Wire Strands Snapped", "MEDIUM", "Flexible copper jumper has 3 snapped strands"),
            ("Transformer Buchholz Relay Alert", "CRITICAL", "Gas accumulation detected at TSS sub-station")
        ],
        "Signal & Telecommunication": [
            ("Point Machine Obstruction Sensor", "CRITICAL", "Obstruction test failed on motor point 114"),
            ("AFTC Track Circuit Fluctuation", "MAJOR", "Intermittent drop in track relay TR-10"),
            ("Digital Axle Counter Reset Error", "CRITICAL", "DP counting discrepancy at block entrance"),
            ("Signal Aspect LED Unit Degradation", "MEDIUM", "Green aspect luminous intensity below standard"),
            ("Interlocking Relay Contact Resistance", "MEDIUM", "High contact resistance on route locking relay")
        ]
    }

    dept_source_map = {
        "Engineering": "TMS",
        "Traction Distribution": "TDMS",
        "Signal & Telecommunication": "SMMS"
    }

    for i in range(4, 101):
        dept_name = random.choice(["Engineering", "Traction Distribution", "Signal & Telecommunication"])
        src_sys = dept_source_map[dept_name]
        template = random.choice(defect_templates[dept_name])
        rand_asset = random.choice(assets)
        defects.append(Defect(
            defect_id=f"DEF_{src_sys}_{i:03d}",
            source_system=src_sys,
            asset_id=rand_asset.asset_id,
            department=dept_name,
            reported_at=f"2026-09-{random.randint(6, 10):02d} {random.randint(6, 20):02d}:{random.randint(10, 50):02d}",
            defect_type=template[0],
            severity=template[1],
            description=f"{template[2]} on section {rand_asset.section_id}.",
            status=random.choice(["PENDING", "PENDING", "PENDING", "IN_PROGRESS"])
        ))

    # 7. 80 Maintenance Jobs (derived from defects and routine schedules)
    jobs = []
    # Seed the 3 critical coordinated demonstration jobs on SEC01
    jobs.append(MaintenanceJob(
        job_id="JOB_SEC01_ENG",
        asset_id="AST_SEC01_ENG_01",
        section_id="SEC01",
        department="Engineering",
        maintenance_type="Corrective",
        description="Track geometry correction and mechanized tamping (Km 16-20)",
        duration_minutes=120,
        criticality=9,
        urgency=9,
        asset_impact=10,
        due_date="2026-09-12",
        required_resource="Track Tamping & Alignment",
        block_requirement="COMBINED_BLOCK",
        status="PENDING",
        overdue_days=3,
        failure_history="HIGH",
        isolation_required=True,
        compatible_departments=["Traction Distribution", "Signal & Telecommunication"]
    ))
    jobs.append(MaintenanceJob(
        job_id="JOB_SEC01_TRD",
        asset_id="AST_SEC01_TRD_01",
        section_id="SEC01",
        department="Traction Distribution",
        maintenance_type="Corrective",
        description="OHE contact wire inspection, tensioning & droppers check",
        duration_minutes=90,
        criticality=8,
        urgency=8,
        asset_impact=9,
        due_date="2026-09-12",
        required_resource="OHE Contact Wire Adjustment",
        block_requirement="POWER_BLOCK",
        status="PENDING",
        overdue_days=2,
        failure_history="MEDIUM",
        isolation_required=True,
        compatible_departments=["Engineering", "Signal & Telecommunication"]
    ))
    jobs.append(MaintenanceJob(
        job_id="JOB_SEC01_SNT",
        asset_id="AST_SEC01_SNT_01",
        section_id="SEC01",
        department="Signal & Telecommunication",
        maintenance_type="Preventive",
        description="Signal cable meggering, relay contact testing & aspect alignment",
        duration_minutes=60,
        criticality=9,
        urgency=9,
        asset_impact=9,
        due_date="2026-09-12",
        required_resource="Signaling Cable Meggering & Relays",
        block_requirement="TRAFFIC_BLOCK",
        status="PENDING",
        overdue_days=3,
        failure_history="HIGH",
        isolation_required=False,
        compatible_departments=["Engineering", "Traction Distribution"]
    ))

    # Another coordinated pair on SEC05 (Ekta Junction - Faridpur)
    jobs.append(MaintenanceJob(
        job_id="JOB_SEC05_ENG",
        asset_id="AST_SEC05_05",
        section_id="SEC05",
        department="Engineering",
        maintenance_type="Preventive",
        description="Turnout crossing weld build-up and sleeper realignment",
        duration_minutes=110,
        criticality=8,
        urgency=7,
        asset_impact=8,
        due_date="2026-09-13",
        required_resource="Point & Crossing Replacement",
        block_requirement="COMBINED_BLOCK",
        status="PENDING",
        overdue_days=2,
        failure_history="MEDIUM",
        isolation_required=True,
        compatible_departments=["Traction Distribution", "Signal & Telecommunication"]
    ))
    jobs.append(MaintenanceJob(
        job_id="JOB_SEC05_TRD",
        asset_id="AST_SEC05_06",
        section_id="SEC05",
        department="Traction Distribution",
        maintenance_type="Preventive",
        description="Cantilever insulator washing and bracket tuning",
        duration_minutes=80,
        criticality=7,
        urgency=6,
        asset_impact=7,
        due_date="2026-09-14",
        required_resource="Cantilever & Insulator Replacement",
        block_requirement="POWER_BLOCK",
        status="PENDING",
        overdue_days=0,
        failure_history="LOW",
        isolation_required=True,
        compatible_departments=["Engineering", "Signal & Telecommunication"]
    ))

    # Generate remaining 75 jobs
    job_templates = [
        ("Engineering", "Alumino-Thermic Rail Welding", 90, "Weld flaw cut-and-replace on welded rail panel", "TRAFFIC_BLOCK"),
        ("Engineering", "Dynamic Track Stabilization", 75, "High-speed DTS machine consolidation post tamping", "TRAFFIC_BLOCK"),
        ("Engineering", "Through Rail Renewal (TRR)", 150, "Full replacement of 1.2km worn 60kg rail profile", "COMBINED_BLOCK"),
        ("Engineering", "USFD Testing & De-stressing", 120, "Tensor hydraulic rail de-stressing for summer buffer", "TRAFFIC_BLOCK"),
        ("Traction Distribution", "OHE Contact Wire Adjustment", 105, "Catenary sag profiling and section insulator overhaul", "POWER_BLOCK"),
        ("Traction Distribution", "Traction Substation Overhaul", 120, "Circuit breaker timing & transformer oil filtration", "POWER_BLOCK"),
        ("Traction Distribution", "Thermal Imaging & Catenary Check", 60, "Hot spot rectification on cantilever feeder wire", "POWER_BLOCK"),
        ("Traction Distribution", "Section Insulator Tuning", 80, "Neutral section overhaul and ceramic glider change", "POWER_BLOCK"),
        ("Signal & Telecommunication", "Electronic Interlocking (EI) Test", 90, "Software logic validation & redundant VDU changeover", "DISCONNECTED"),
        ("Signal & Telecommunication", "Point Motor & Detection Overhaul", 70, "143mm stroke point machine lubrication & friction clutch", "TRAFFIC_BLOCK"),
        ("Signal & Telecommunication", "Audio Frequency Track Circuit (AFTC)", 60, "Tuning unit impedance bond inspection", "TRAFFIC_BLOCK"),
        ("Signal & Telecommunication", "Multi-Section Digital Axle Counter", 75, "Trackside wheel detector head calibration", "TRAFFIC_BLOCK"),
        ("Signal & Telecommunication", "Optical Fiber & V-SAT Alignment", 45, "OFC dark-core testing and multiplexer loopback", "DISCONNECTED"),
    ]

    for i in range(6, 81):
        tmpl = job_templates[(i - 6) % len(job_templates)]
        dept = tmpl[0]
        skill = tmpl[1]
        base_dur = tmpl[2]
        desc = tmpl[3]
        req = tmpl[4]
        sec = sections_raw[(i * 3) % len(sections_raw)][0]
        crit = random.randint(4, 10)
        urg = random.randint(4, 10)
        impact = random.randint(4, 10)
        overdue = random.choice([0, 0, 1, 2, 4, 6])
        f_hist = random.choice(["LOW", "LOW", "MEDIUM", "HIGH"])
        
        compat = []
        if req in ["TRAFFIC_BLOCK", "COMBINED_BLOCK", "POWER_BLOCK"]:
            if dept == "Engineering":
                compat = ["Traction Distribution", "Signal & Telecommunication"]
            elif dept == "Traction Distribution":
                compat = ["Engineering", "Signal & Telecommunication"]
            else:
                compat = ["Engineering", "Traction Distribution"]

        jobs.append(MaintenanceJob(
            job_id=f"JOB_{sec}_{i:03d}",
            asset_id=f"AST_{sec}_{(i % 40) + 1:02d}",
            section_id=sec,
            department=dept,
            maintenance_type="Corrective" if crit >= 8 else "Preventive",
            description=f"{desc} (Section {sec})",
            duration_minutes=base_dur,
            criticality=crit,
            urgency=urg,
            asset_impact=impact,
            due_date=f"2026-09-{random.randint(11, 18):02d}",
            required_resource=skill,
            block_requirement=req,
            status="PENDING",
            overdue_days=overdue,
            failure_history=f_hist,
            isolation_required=(req in ["POWER_BLOCK", "COMBINED_BLOCK"]),
            compatible_departments=compat
        ))

    # Calculate initial priority scores for all jobs
    PriorityEngine.score_all_jobs(jobs)

    # 8. 40 Available Block Windows across 7 days (2026-09-11 to 2026-09-17)
    # Windows represent operational traffic-free or shadow slots granted by Operating/COA
    block_windows = []
    
    # Critical window on SEC01: 2026-09-12 01:00 - 04:00 (180 mins)
    block_windows.append(BlockWindow(
        window_id="WIN_SEC01_01",
        section_id="SEC01",
        date="2026-09-12",
        start_time="01:00",
        end_time="04:00",
        block_type="NIGHT_SLOT",
        maximum_duration=180,
        status="AVAILABLE"
    ))

    # Critical window on SEC05: 2026-09-13 01:30 - 04:30 (180 mins)
    block_windows.append(BlockWindow(
        window_id="WIN_SEC05_01",
        section_id="SEC05",
        date="2026-09-13",
        start_time="01:30",
        end_time="04:30",
        block_type="NIGHT_SLOT",
        maximum_duration=180,
        status="AVAILABLE"
    ))

    dates = [
        "2026-09-11", "2026-09-12", "2026-09-13",
        "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17"
    ]
    
    time_slots = [
        ("01:00", "03:30", 150, "NIGHT_SLOT"),
        ("01:30", "04:30", 180, "NIGHT_SLOT"),
        ("02:00", "05:00", 180, "NIGHT_SLOT"),
        ("11:30", "13:30", 120, "REGULAR_SHADOW"),
        ("12:00", "14:30", 150, "REGULAR_SHADOW"),
        ("23:30", "02:00", 150, "NIGHT_SLOT")
    ]

    win_counter = 3
    for d_idx, d_str in enumerate(dates):
        for s_idx in range(len(sections)):
            sec_id = sections[s_idx].section_id
            if sec_id == "SEC01":
                continue  # Keep WIN_SEC01_01 as the designated showcase window
            if (s_idx + d_idx) % 3 == 0 and win_counter <= 40:
                slot = time_slots[(s_idx + d_idx) % len(time_slots)]
                block_windows.append(BlockWindow(
                    window_id=f"WIN_{sec_id}_{win_counter:02d}",
                    section_id=sec_id,
                    date=d_str,
                    start_time=slot[0],
                    end_time=slot[1],
                    block_type=slot[3],
                    maximum_duration=slot[2],
                    status="AVAILABLE"
                ))
                win_counter += 1

    # Ensure exactly 40 windows if loop ended early/late
    while len(block_windows) < 40:
        sec_id = sections[len(block_windows) % len(sections)].section_id
        d_str = dates[len(block_windows) % len(dates)]
        slot = time_slots[len(block_windows) % len(time_slots)]
        block_windows.append(BlockWindow(
            window_id=f"WIN_{sec_id}_{win_counter:02d}",
            section_id=sec_id,
            date=d_str,
            start_time=slot[0],
            end_time=slot[1],
            block_type=slot[3],
            maximum_duration=slot[2],
            status="AVAILABLE"
        ))
        win_counter += 1

    block_windows = block_windows[:40]

    # 9. 100 Train Movements across sections
    train_types = [
        ("Vande Bharat Express", "Rajdhani/Vande Bharat", 1),
        ("Rajdhani Express", "Rajdhani/Vande Bharat", 1),
        ("Shatabdi Express", "Superfast", 2),
        ("Garib Rath Express", "Superfast", 2),
        ("Mail Express", "Express", 3),
        ("Intercity Superfast", "Superfast", 2),
        ("Passenger Special", "Passenger", 4),
        ("Container Freight (CONCOR)", "Freight", 5),
        ("Coal Rake (BOXN)", "Freight", 5),
        ("Petroleum Tanker (BTPN)", "Freight", 5)
    ]

    trains = []
    # Seed trains around SEC01 to create realistic traffic windows
    # Window 01:00-04:00 is clear on SEC01! Trains run before 00:45 and after 04:20
    trains.append(Train(
        train_id="TRN_001", train_number="12001", train_name="Bhopal Shatabdi Exp",
        train_type="Superfast", section_id="SEC01", arrival_time="00:15",
        departure_time="00:35", direction="UP", priority=2
    ))
    trains.append(Train(
        train_id="TRN_002", train_number="22436", train_name="Vande Bharat Express",
        train_type="Rajdhani/Vande Bharat", section_id="SEC01", arrival_time="04:25",
        departure_time="04:45", direction="DOWN", priority=1
    ))
    trains.append(Train(
        train_id="TRN_003", train_number="12424", train_name="Dibrugarh Rajdhani Exp",
        train_type="Rajdhani/Vande Bharat", section_id="SEC01", arrival_time="05:10",
        departure_time="05:30", direction="UP", priority=1
    ))

    # Generate 97 more trains traversing sections
    for i in range(4, 101):
        ttype = train_types[(i - 4) % len(train_types)]
        sec_obj = sections[(i * 5) % len(sections)]
        
        # For sections with major maintenance windows like SEC01 and SEC05, ensure timetable avoids the night maintenance slot
        if sec_obj.section_id == "SEC01":
            arr_hr = 6 + ((i * 3) % 17)  # 06:00 to 23:00
        elif sec_obj.section_id == "SEC05":
            arr_hr = 5 + ((i * 3) % 18)  # 05:00 to 23:00
        else:
            arr_hr = (i * 17) % 24

        arr_min = (i * 11) % 60
        arr_str = f"{arr_hr:02d}:{arr_min:02d}"
        
        dep_min = arr_min + random.randint(15, 30)
        dep_hr = arr_hr + (dep_min // 60)
        dep_min = dep_min % 60
        dep_hr = dep_hr % 24
        dep_str = f"{dep_hr:02d}:{dep_min:02d}"

        trains.append(Train(
            train_id=f"TRN_{i:03d}",
            train_number=f"{random.randint(12000, 22999)}",
            train_name=f"{ttype[0]} #{i}",
            train_type=ttype[1],
            section_id=sec_obj.section_id,
            arrival_time=arr_str,
            departure_time=dep_str,
            direction="UP" if i % 2 == 0 else "DOWN",
            priority=ttype[2]
        ))

    # 10. Train Forecasts
    forecasts = []
    for s in sections:
        for d in dates[:3]:
            total_t = random.randint(45, 90)
            goods_t = random.randint(15, 35)
            forecasts.append(TrainForecast(
                forecast_id=f"FC_{s.section_id}_{d[-2:]}",
                section_id=s.section_id,
                date=d,
                expected_total_trains=total_t,
                expected_goods_trains=goods_t,
                peak_period="07:00-10:30 & 17:00-21:30",
                confidence=round(random.uniform(0.88, 0.96), 2)
            ))

    return {
        "stations": stations,
        "sections": sections,
        "assets": assets,
        "defects": defects,
        "maintenance_jobs": jobs,
        "departments": departments,
        "resources": resources,
        "trains": trains,
        "train_forecasts": forecasts,
        "block_windows": block_windows
    }
