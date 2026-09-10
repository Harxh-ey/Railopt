# RailOpt: AI-Powered Automatic Block Planning System

**Smart India Hackathon 2026 Solution**  
**Problem Statement SIH26027:** *“AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways.”*

> [!IMPORTANT]
> **Safety / Domain Disclaimer**:  
> RailOpt is a prototype decision-support tool. It does **NOT** directly control physical railway signalling, train routing, or safety-critical infrastructure. All operational records, train paths, and assets are synthetic for planning demonstration and research purposes.

---

## 1. Project Structure

```
Railopt/
├── run_railopt.bat             # 1-Click launcher (starts server & opens browser)
├── README.md                   # Complete architectural & operational guide
├── backend/
│   ├── main.py                 # FastAPI application, CORS, REST endpoints, static hosting
│   ├── models.py               # Pydantic schemas for all 12 logical railway entities
│   ├── dataset.py              # Synthetic railway environment generator conforming to IR norms
│   ├── priority_engine.py      # Transparent multi-factor maintenance priority scoring engine
│   ├── optimizer.py            # Google OR-Tools CP-SAT constraint block optimization engine
│   ├── baseline.py             # Departmental siloed earliest-feasible baseline scheduler
│   ├── simulator.py            # What-If disruption scenario & dynamic re-optimization engine
│   ├── explainability.py       # Explainable AI rationale generator ("Why this block?")
│   ├── test_api.py             # Automated end-to-end verification suite
│   ├── pyproject.toml          # Python project metadata
│   └── .venv/                  # Self-contained Python 3.12 virtual environment
└── frontend/
    ├── package.json            # React 18, TypeScript, Tailwind CSS, Lucide icons
    ├── vite.config.ts          # Vite build config with backend proxy
    ├── index.html              # Clean railway operations layout entrypoint
    ├── dist/                   # Production-compiled React SPA (hosted by backend)
    └── src/
        ├── types/index.ts      # TypeScript interfaces for all data structures
        ├── services/api.ts     # Type-safe API client connecting to backend
        ├── App.tsx             # Root container, view routing, modal orchestration
        └── components/
            ├── Header.tsx             # Navigation, disclaimer banner, quick demo actions
            ├── DashboardView.tsx      # Executive KPIs, workloads, integration status
            ├── DemoScenarioCard.tsx   # Visual SEC01 3-department coordination showcase
            ├── OptimizationHub.tsx    # CP-SAT controls, dynamic Baseline vs RailOpt table
            ├── NetworkMap.tsx         # Interactive SVG schematic of 12 stations & 20 sections
            ├── WeeklyPlanView.tsx     # 7-day Gantt timeline across sections and departments
            ├── MonthlyPlanView.tsx    # 4-week strategic backlog curve & high-risk asset register
            ├── WhatIfSimulator.tsx    # Disruption injector, re-optimizer & delta diff report
            ├── WhyThisBlockModal.tsx  # Transparent constraint reasoning & timeline modal
            └── DataSourcesView.tsx    # Raw & normalized viewer for TMS, SMMS, TDMS, COA
```

---

## 2. How to Run

### Method 1: Instant Launch (Recommended)
Double-click `run_railopt.bat` or execute in PowerShell:
```powershell
.\run_railopt.bat
```
This starts the backend FastAPI server on `http://localhost:8000` (which automatically serves the compiled React application) and launches your browser.

### Method 2: Manual Development Mode
1. **Start Backend**:
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload
   ```
2. **Start Frontend** (with Vite Hot Reload):
   ```powershell
   cd frontend
   & "C:\Program Files\nodejs\npm.cmd" run dev
   ```
   Open `http://localhost:5173`.

---

## 3. Main Architecture

RailOpt bridges the gap between departmental maintenance requirements and train operations:
1. **Data Ingestion & Normalization**: Ingests disparate data feeds from TMS (Engineering), TDMS (Traction Distribution), and SMMS (Signal & Telecom) alongside COA block windows and train timetables.
2. **Transparent Priority Engine**: Evaluates asset condition, failure count, urgency, asset availability impact, and overdue days to produce a standardized 0–100 priority score with explainable factor weights.
3. **CP-SAT Block Optimization Engine**: Models maintenance scheduling as a multi-objective Constraint Satisfaction Problem (CSP) solved via Google OR-Tools CP-SAT.
4. **Baseline Benchmarking**: Solves the same workload using legacy departmental greedy earliest-feasible allocation to dynamically measure savings in corridor downtime, block closures, and train disruptions.
5. **What-If Simulation**: Dynamically injects operational disruptions (window cancellations, crew breakdowns, VIP train insertions) and calculates deltas (rescheduled, deferred, manual intervention).
6. **Explainability Layer**: Unpacks every scheduled block into human-readable engineering justifications.

---

## 4. Optimization Formulation (Google OR-Tools CP-SAT)

### Decision Variables
- $x_{j, w} \in \{0, 1\}$: Job $j$ is assigned to block window $w$.
- $y_w \in \{0, 1\}$: Block window $w$ is activated as a traffic/power maintenance block.
- $d_{w, \text{dept}} \in \{0, 1\}$: Department $\text{dept}$ has at least one active job in window $w$.
- $\text{coord}_w \in \{0, 1\}$: Block window $w$ bundles $\ge 2$ departments concurrently.

### Hard Constraints
1. **Single Assignment**: Each maintenance job $j$ is assigned at most once:
   $$\sum_{w \in W(j)} x_{j, w} \le 1$$
2. **Window Activation**: A job can only be assigned if the window is activated:
   $$x_{j, w} \le y_w \quad \forall (j, w)$$
3. **Window Capacity**: The duration of jobs assigned to window $w$ within department $d$ cannot exceed the window duration:
   $$\sum_{j \in J(d)} x_{j, w} \cdot \text{duration}(j) \le \text{max\_duration}(w)$$
4. **Department Resource Limits**: Active concurrent tasks cannot exceed certified crew teams:
   $$\sum_{j \in J(d)} x_{j, w} \le \text{capacity}(d)$$
5. **High-Priority Train Movement Clearance**: No window $w$ on section $s$ is activated if a Priority 1 (Vande Bharat / Rajdhani) train occupies section $s$ during $[t_{\text{start}} - 30\text{m}, t_{\text{end}} + 30\text{m}]$.
6. **Mutual Electrical & Traffic Isolation**: Cross-department jobs share the window only when their synthetic isolation rules are marked compatible (e.g. OHE power block + track tamping + track circuit testing).

### Objective Function
$$\max \sum_{j, w} \left(10 \cdot \text{Priority}(j) \cdot x_{j, w}\right) + 600 \sum_w \text{coord}_w + 400 \sum_w \text{three\_dept}_w - \sum_w \left(0.8 \cdot \text{max\_duration}(w) \cdot y_w\right)$$
- Rewards completing high-priority maintenance.
- Provides a major bonus for multi-department coordination (+600 for 2 departments, +1000 for all 3 departments).
- Penalizes total corridor downtime to prevent unnecessary track possession.

---

## 5. Synthetic Dataset Description

RailOpt models a fictional division conforming to Indian Railways engineering norms:
- **12 Stations**: Anandpur (ANP), Bharat Nagar (BNG), Chandrapur (CDP), Devgarh (DVG), Ekta Junction (EKJ - major 6-track hub), Faridpur (FDP), Ganga Nagar (GNR), Haripur (HRP), Indrapur (IDP), Jaitpur (JTP), Krishnapur (KNP), Lakshmipur (LMP).
- **20 Railway Sections**: Main double-line trunk routes, single-line branches, and chord lines (lengths 18–52 km, electrified 25kV OHE).
- **50 Assets**: Track panels, turnouts, OHE cantilevers, traction substations, point machines, digital axle counters, signal aspects.
- **100 Defect Records**: Directly tagged to TMS, SMMS, and TDMS.
- **80 Maintenance Jobs**: Corrective, preventive, and periodic overhaul tasks.
- **100 Train Movements**: Mixed traffic (Rajdhani, Vande Bharat, Superfast, Mail/Express, Passenger, Container/Coal freight).
- **40 Available COA Block Windows**: Night maintenance slots (01:00–04:30) and regular shadow slots (11:30–14:30) across 7 days.
- **18 Maintenance Resources**: 6 Engineering gangs, 6 TRD tower wagons & linesmen, 6 S&T technician teams.

---

## 6. End-to-End Demonstration Workflow

Follow these steps to demonstrate the prototype:

1. **Step 1: Open Dashboard**  
   Open `http://localhost:8000`. Observe the safety disclaimer banner, KPI cards, and data integration status (TMS, SMMS, TDMS, COA all synced).
2. **Step 2: Department Workloads**  
   Review the Department Maintenance Workload chart showing pending requirements across Engineering, Traction Distribution, and S&T.
3. **Step 3: Multi-Department Conflict Spotlight (SEC01)**  
   Inspect the **Critical Demonstration Scenario Card** showing section `SEC01`. Notice that Engineering, TRD, and S&T all have jobs on the same section.
4. **Step 4: Operational Windows & Trains**  
   Review available COA window (01:00–04:00, 180 mins) and verify trains are cleared during this slot.
5. **Step 5: Explainable Priority Scores**  
   Scroll to the **Top Urgent & High-Impact Maintenance Tasks** table to inspect transparent priority scores (e.g. 94.5/100).
6. **Step 6: Run Optimization**  
   Navigate to the **Block Optimizer & Benchmark** tab and click **RUN OPTIMIZATION**. Watch Google OR-Tools CP-SAT solve in <100ms.
7. **Step 7: Coordinated Block Output**  
   See block `BLK_01` generated on `SEC01`, combining Engineering (120m), Traction (90m), and S&T (60m) inside the single 180m window.
8. **Step 8: Baseline vs. RailOpt Comparison**  
   Examine the **Rigorous Empirical Benchmark Table**. Notice that RailOpt achieves:
   - **4.5+ hours saved** in corridor downtime.
   - **91.7%** multi-department coordination rate (vs 0% in baseline).
   - **78.6% increase** in maintenance jobs accomplished.
   - **33 fewer deferred jobs** in the backlog.
9. **Step 9: "Why this block?" Explainability**  
   Click on `BLK_01` or any block card to open the **Explainable Rationale Panel**. Review the satisfied constraints, train buffers, and downtime saved.
10. **Step 10: Open What-If Simulator**  
    Switch to the **What-If Simulator** tab.
11. **Step 11: Inject Disruption**  
    Click the quick preset **"🚫 Cancel Window WIN_SEC01_01"** (or select a crew breakdown / emergency VIP train).
12. **Step 12: Click RE-OPTIMIZE**  
    Click **RE-OPTIMIZE SCHEDULE**.
13. **Step 13: Review Dynamic Delta Impact**  
    Observe the dynamically calculated delta: affected jobs, rescheduled jobs, jobs moved to later windows, and manual intervention alerts.
14. **Step 14: Inspect Weekly & Monthly Planning**  
    Navigate to the **Weekly Gantt Schedule** (Monday–Sunday) and the **Monthly Strategic Plan** (Weeks 1–4 asset availability projection and high-risk asset register).

---

## 7. Known Limitations & Safety Boundaries

1. **Advisory Decision Support Only**: This tool generates planning recommendations. Final block grants must always be verified and sanctioned by section controllers and station masters via block instruments and safety rules.
2. **Synthetic Operational Data**: Timetables and block availability are simulated. In production, live streams from FOIS/COA APIs will replace synthetic models.
3. **Simplified Isolation Rules**: Physical safety isolation (traction power OHE permit-to-work, track circuit shunting) is modeled as constraint predicates; physical earthing rods and interlocking keys remain strictly field procedures.

---

## 8. Next Steps to Production-Grade IR Deployment

1. **Enterprise Integration**: Connect directly with CRIS (Centre for Railway Information Systems) APIs:
   - **TMS** via REST / SOAP endpoints.
   - **COA (Control Office Application)** for real-time shadow block availability.
   - **FOIS (Freight Operations Information System)** for real-time goods rake transit forecasts.
2. **Machine Learning Predictive Degradation**: Augment the priority scoring formula with an XGBoost / Random Forest model trained on historical Track Recording Car (TRC) and Oscillation Monitoring Unit (OMU) records.
3. **GIS & Corridor Topology**: Ingest shapefiles from IR's GIS portal to visualize block bounds along actual track kilometers and curves.
4. **Mobile Crew Field App**: Provide field supervisors (Senior Section Engineers - P.Way, OHE, Signal) with a companion tablet app to report job commencement, power block cut-off, and clearance in real time.
