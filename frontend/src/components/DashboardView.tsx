import React, { useState, useEffect } from 'react';
import {
  Wrench, AlertTriangle, Calendar, Layers, ShieldCheck,
  CheckCircle2, ArrowRight, ChevronRight, AlertCircle, Info
} from 'lucide-react';
import { DashboardData, Station, Section } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  onInspectBlock: (blockId: string) => void;
  onNavigateTab: (tab: string) => void;
  onInspectJob?: (job: any) => void;
}

const deptBadge = (dept: string) => {
  if (dept === 'Engineering')
    return 'bg-blue-50 text-blue-800 border-blue-200';
  if (dept === 'Traction Distribution')
    return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-cyan-50 text-cyan-800 border-cyan-200';
};

const deptShort = (dept: string) => {
  if (dept === 'Engineering') return 'ENG';
  if (dept === 'Traction Distribution') return 'TRD';
  return 'S&T';
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onInspectBlock,
  onNavigateTab,
  onInspectJob,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [networkLoading, setNetworkLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getNetworkTopology()
      .then((res) => {
        setStations(res.stations);
        setSections(res.sections);
        const sec01 = res.sections.find((s: Section) => s.section_id === 'SEC01');
        if (sec01) setSelectedSection(sec01);
        setNetworkLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load network topology', e);
        setNetworkLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-600">Loading planning data...</p>
      </div>
    );
  }

  const k = data.kpis;

  const stationMap: Record<string, Station> = {};
  stations.forEach((s) => { stationMap[s.station_id] = s; });

  // Alerts derived from data
  const alerts = [
    ...(k.critical_jobs_count > 0 ? [{
      type: 'critical' as const,
      title: 'Critical Maintenance Due',
      message: `${k.critical_jobs_count} maintenance jobs are at criticality ≥ 8. Immediate scheduling required.`
    }] : []),
    ...(k.unscheduled_backlog > 0 ? [{
      type: 'warning' as const,
      title: 'Unscheduled Backlog',
      message: `${k.unscheduled_backlog} maintenance jobs could not be scheduled in this planning cycle. Manual review required.`
    }] : []),
    {
      type: 'info' as const,
      title: 'COA Block Windows Available',
      message: `${k.available_block_windows} block windows are available from Control Office Application for the current planning week.`
    },
    ...(k.coordinated_blocks > 0 ? [{
      type: 'success' as const,
      title: 'Multi-Department Coordination Active',
      message: `${k.coordinated_blocks} blocks consolidate multiple departments, saving ${k.total_downtime_hours ? Math.round(k.total_downtime_hours * 0.3) : '--'} hours of additional line possession.`
    }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* KPI SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <KPIBox
          label="Total Jobs"
          value={k.pending_maintenance_jobs}
          sublabel="Pending across all depts"
          color="blue"
        />
        <KPIBox
          label="Critical Jobs"
          value={k.critical_jobs_count}
          sublabel="Criticality ≥ 8"
          color="red"
        />
        <KPIBox
          label="Overdue Jobs"
          value={k.unscheduled_backlog}
          sublabel="Require manual review"
          color="amber"
        />
        <KPIBox
          label="Block Windows"
          value={k.available_block_windows}
          sublabel="Available from COA"
          color="default"
        />
        <KPIBox
          label="Generated Blocks"
          value={k.generated_blocks}
          sublabel={`${k.coordination_rate}% coordination rate`}
          color="default"
        />
        <KPIBox
          label="Asset Availability"
          value={`${k.asset_availability_percent}%`}
          sublabel="Network line standard"
          color="green"
        />
        <KPIBox
          label="Plan Conflicts"
          value={k.hard_conflicts ?? 0}
          sublabel="Hard scheduling conflicts"
          color={k.hard_conflicts > 0 ? 'red' : 'green'}
        />
      </div>

      {/* 2-COLUMN MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Maintenance Planning Summary + Railway Network Schematic */}
        <div className="lg:col-span-7 space-y-4">
          {/* Planning Summary */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-800">Maintenance Planning Summary</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Planning Date: 14 September 2026 · Horizon: Weekly (11–17 Sep 2026) · Last Updated: 10 Sep 2026, 22:30
              </p>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3 text-xs">
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-slate-500 mb-1">Engineering (P.Way)</div>
                <div className="text-2xl font-bold text-blue-700 font-mono">{data.department_workload?.Engineering ?? '--'}</div>
                <div className="text-slate-400 mt-0.5">maintenance jobs</div>
              </div>
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-slate-500 mb-1">Traction Distribution</div>
                <div className="text-2xl font-bold text-amber-700 font-mono">{data.department_workload?.['Traction Distribution'] ?? '--'}</div>
                <div className="text-slate-400 mt-0.5">maintenance jobs</div>
              </div>
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-slate-500 mb-1">Signal & Telecom</div>
                <div className="text-2xl font-bold text-cyan-700 font-mono">{data.department_workload?.['Signal & Telecommunication'] ?? '--'}</div>
                <div className="text-slate-400 mt-0.5">maintenance jobs</div>
              </div>
            </div>
            <div className="px-4 pb-3 flex gap-3">
              <button
                onClick={() => onNavigateTab('planning')}
                className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1"
              >
                Generate Block Plan <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1"
              >
                View All Jobs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Railway Network Schematic */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Railway Network — Section Status</h2>
                <p className="text-xs text-slate-500 mt-0.5">Click section to view details</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block border border-green-300"></span>
                  <span className="text-slate-500">Normal</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400 inline-block border border-blue-300"></span>
                  <span className="text-slate-500">Block Planned</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400 inline-block border border-red-300"></span>
                  <span className="text-slate-500">High Risk</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-2 relative flex items-center justify-center min-h-[300px]">
              {networkLoading ? (
                <div className="text-slate-400 text-xs">Loading network topology...</div>
              ) : (
                <svg viewBox="90 90 820 420" className="w-full h-auto max-h-[300px] select-none">
                  {/* Light grid */}
                  <defs>
                    <pattern id="gov-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect x="90" y="90" width="820" height="420" fill="url(#gov-grid)" opacity="0.5" />

                  {/* Section Lines */}
                  {sections.map((sec) => {
                    const s1 = stationMap[sec.source_station];
                    const s2 = stationMap[sec.destination_station];
                    if (!s1 || !s2) return null;

                    const isSelected = selectedSection?.section_id === sec.section_id;
                    let strokeColor = '#22C55E';
                    if (sec.status === 'HIGH_RISK') strokeColor = '#EF4444';
                    else if (sec.status === 'MAINTENANCE_PLANNED') strokeColor = '#3B82F6';

                    const midX = (s1.x_coord + s2.x_coord) / 2;
                    const midY = (s1.y_coord + s2.y_coord) / 2;

                    return (
                      <g
                        key={sec.section_id}
                        onClick={() => setSelectedSection(sec)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <line
                            x1={s1.x_coord} y1={s1.y_coord}
                            x2={s2.x_coord} y2={s2.y_coord}
                            stroke="#1D4ED8"
                            strokeWidth="8"
                            strokeOpacity="0.3"
                            strokeLinecap="round"
                          />
                        )}
                        <line
                          x1={s1.x_coord} y1={s1.y_coord}
                          x2={s2.x_coord} y2={s2.y_coord}
                          stroke={isSelected ? '#1D4ED8' : strokeColor}
                          strokeWidth={isSelected ? '3.5' : '2'}
                          strokeLinecap="round"
                        />
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-18" y="-8" width="36" height="16" rx="3"
                            fill={isSelected ? '#1D4ED8' : '#F8FAFC'}
                            stroke={isSelected ? '#1D4ED8' : '#94A3B8'}
                            strokeWidth="1"
                          />
                          <text
                            x="0" y="3"
                            fill={isSelected ? '#FFFFFF' : '#334155'}
                            fontSize="8" fontWeight="bold"
                            textAnchor="middle" fontFamily="monospace"
                          >
                            {sec.section_id}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Station Nodes */}
                  {stations.map((stn) => {
                    const isJunction = stn.code === 'EKJ' || stn.track_count > 3;
                    return (
                      <g key={stn.station_id} transform={`translate(${stn.x_coord}, ${stn.y_coord})`}>
                        <circle
                          r={isJunction ? '8' : '5'}
                          fill="#FFFFFF"
                          stroke={isJunction ? '#0B3B60' : '#64748B'}
                          strokeWidth={isJunction ? '2' : '1.5'}
                        />
                        <circle r={isJunction ? '4' : '2'} fill={isJunction ? '#0B3B60' : '#334155'} />
                        <text
                          x="0" y={isJunction ? '-12' : '16'}
                          fill="#0F172A"
                          fontSize="9" fontWeight="bold"
                          textAnchor="middle"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {stn.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Section detail strip */}
            {selectedSection && (
              <div className="px-4 py-2.5 border-t border-slate-200 bg-blue-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-800">{selectedSection.section_id}</span>
                  <span className="text-slate-700 font-medium">
                    {selectedSection.source_station} ↔ {selectedSection.destination_station}
                  </span>
                  <span className="text-slate-500">
                    {selectedSection.length_km} km · {selectedSection.electrified ? '25kV OHE' : 'Diesel'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedSection.status === 'HIGH_RISK'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : selectedSection.status === 'MAINTENANCE_PLANNED'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {selectedSection.status?.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Alerts + Critical Jobs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Important Alerts */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-800">Important Alerts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Planning-related notifications requiring attention</p>
            </div>
            <div className="divide-y divide-slate-100">
              {alerts.map((alert, idx) => (
                <div key={idx} className="px-4 py-3 flex gap-3 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {alert.type === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {alert.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                    {alert.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                    {alert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                  <div>
                    <div className={`font-semibold mb-0.5 ${
                      alert.type === 'critical' ? 'text-red-700'
                      : alert.type === 'warning' ? 'text-amber-700'
                      : alert.type === 'success' ? 'text-green-700'
                      : 'text-blue-700'
                    }`}>
                      {alert.type === 'critical' && <span className="inline-block bg-red-100 text-red-700 border border-red-200 text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold">CRITICAL</span>}
                      {alert.type === 'warning' && <span className="inline-block bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold">WARNING</span>}
                      {alert.type === 'info' && <span className="inline-block bg-blue-100 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold">INFO</span>}
                      {alert.type === 'success' && <span className="inline-block bg-green-100 text-green-700 border border-green-200 text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-bold">NOTICE</span>}
                      {alert.title}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Maintenance Jobs */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Critical Maintenance Jobs
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Highest priority — require immediate block scheduling</p>
              </div>
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
              {data.top_critical_jobs.slice(0, 8).map((job, i) => (
                <div
                  key={job.job_id}
                  onClick={() => onInspectJob ? onInspectJob(job) : null}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3 text-xs"
                >
                  <span className="text-slate-400 font-mono w-5 shrink-0 text-[11px]">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-blue-800 text-[11px]">{job.job_id}</span>
                      <span className={`px-1.5 py-0 rounded text-[10px] font-semibold border ${deptBadge(job.department)}`}>
                        {deptShort(job.department)}
                      </span>
                      {job.overdue_days > 0 && (
                        <span className="px-1.5 py-0 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          +{job.overdue_days}d overdue
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 truncate">{job.description}</p>
                    <div className="flex gap-3 text-slate-500 mt-0.5 font-mono text-[11px]">
                      <span>Sec: <strong className="text-slate-700">{job.section_id}</strong></span>
                      <span>Due: <strong className={job.overdue_days > 0 ? 'text-red-600' : 'text-slate-700'}>{job.due_date}</strong></span>
                      <span>Crit: <strong className="text-red-700">{job.criticality}/10</strong></span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-green-700 text-xs shrink-0">{job.priority_score}</span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => onNavigateTab('planning')}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
              >
                Generate Optimized Block Plan <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable KPI Box component
interface KPIBoxProps {
  label: string;
  value: number | string;
  sublabel: string;
  color: 'blue' | 'red' | 'amber' | 'green' | 'default';
}

const KPIBox: React.FC<KPIBoxProps> = ({ label, value, sublabel, color }) => {
  const valueColor = {
    blue: 'text-blue-800',
    red: 'text-red-700',
    amber: 'text-amber-700',
    green: 'text-green-700',
    default: 'text-slate-800',
  }[color];

  const borderColor = {
    blue: 'border-t-blue-600',
    red: 'border-t-red-500',
    amber: 'border-t-amber-500',
    green: 'border-t-green-600',
    default: 'border-t-slate-400',
  }[color];

  return (
    <div className={`bg-white border border-slate-200 border-t-2 ${borderColor} rounded p-3`}>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sublabel}</div>
    </div>
  );
};
