import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceJob, Block, Section, Resource, Asset } from '../types';

export const AnalyticsView: React.FC = () => {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.getMaintenanceJobs(),
      api.getBlocks(),
      api.getSections(),
      api.getResources(),
      api.getAssets(),
    ]).then(([j, b, s, r, a]) => {
      setJobs(j); setBlocks(b); setSections(s); setResources(r); setAssets(a);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-xs">Calculating planning analytics and performance metrics...</p>
      </div>
    );
  }

  const engCount = jobs.filter((j) => j.department === 'Engineering').length;
  const trdCount = jobs.filter((j) => j.department === 'Traction Distribution').length;
  const sntCount = jobs.filter((j) => j.department === 'Signal & Telecommunication').length;

  const critHigh = jobs.filter((j) => j.criticality >= 8).length;
  const critMed = jobs.filter((j) => j.criticality >= 5 && j.criticality < 8).length;
  const critLow = jobs.filter((j) => j.criticality < 5).length;

  const sectionBlockCounts: Record<string, number> = {};
  blocks.forEach((b) => { sectionBlockCounts[b.section_id] = (sectionBlockCounts[b.section_id] || 0) + 1; });
  const topSections = Object.entries(sectionBlockCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

  const totalBlocks = blocks.length;
  const coordBlocks = blocks.filter((b) => b.block_type === 'MULTI_DEPT_COORDINATED').length;
  const coordRate = totalBlocks > 0 ? Math.round((coordBlocks / totalBlocks) * 100) : 0;

  const totalDowntimeSaved = blocks.reduce((acc, b) => acc + (b.explanation?.metrics?.downtime_minutes_saved || 0), 0);

  const barWidth = (count: number, total: number) => `${total > 0 ? Math.round((count / total) * 100) : 0}%`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Planning Analytics & Performance KPIs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluation of cross-departmental coordination efficiency, line capacity preservation, and asset reliability
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="border border-slate-200 rounded px-3 py-2 text-center font-mono">
              <div className="text-slate-500 text-[10px]">COORDINATION RATE</div>
              <div className="font-bold text-green-700">{coordRate}%</div>
            </div>
            <div className="border border-slate-200 rounded px-3 py-2 text-center font-mono">
              <div className="text-slate-500 text-[10px]">DOWNTIME SAVED</div>
              <div className="font-bold text-blue-800">{Math.round(totalDowntimeSaved / 60)}h ({totalDowntimeSaved}m)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1: Department Workload */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Maintenance Workload by Department</h3>
            <span className="text-xs text-slate-400">{jobs.length} Total Jobs</span>
          </div>
          <div className="p-4 space-y-4 text-xs">
            {[
              { label: 'Engineering (Track & P.Way)', count: engCount, color: 'bg-blue-500', text: 'text-blue-700' },
              { label: 'Traction Distribution (TRD / 25kV OHE)', count: trdCount, color: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Signal & Telecommunication (S&T)', count: sntCount, color: 'bg-cyan-500', text: 'text-cyan-700' },
            ].map(({ label, count, color, text }) => (
              <div key={label}>
                <div className="flex justify-between font-medium mb-1.5">
                  <span className={text}>{label}</span>
                  <span className="font-mono text-slate-600">{count} jobs ({jobs.length > 0 ? Math.round((count / jobs.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: barWidth(count, jobs.length) }}></div>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              RailOpt coordinates all 3 departments into unified possession windows whenever section constraints align.
            </p>
          </div>
        </div>

        {/* 2: Criticality Breakdown */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Asset Safety Criticality Distribution</h3>
            <span className="text-xs font-mono text-red-700 font-bold">{critHigh} Urgent</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 text-xs text-center mb-4">
              <div className="border border-red-200 rounded p-3 bg-red-50">
                <div className="text-[10px] text-red-600 font-bold">TIER 1 — CRITICAL</div>
                <div className="text-2xl font-bold font-mono text-red-700 my-1">{critHigh}</div>
                <div className="text-[10px] text-slate-500">Rating 8–10</div>
              </div>
              <div className="border border-amber-200 rounded p-3 bg-amber-50">
                <div className="text-[10px] text-amber-700 font-bold">TIER 2 — MEDIUM</div>
                <div className="text-2xl font-bold font-mono text-amber-700 my-1">{critMed}</div>
                <div className="text-[10px] text-slate-500">Rating 5–7</div>
              </div>
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-[10px] text-slate-500 font-bold">TIER 3 — ROUTINE</div>
                <div className="text-2xl font-bold font-mono text-slate-700 my-1">{critLow}</div>
                <div className="text-[10px] text-slate-500">Rating 1–4</div>
              </div>
            </div>
            {/* Stacked bar */}
            <div className="w-full bg-slate-100 rounded h-4 overflow-hidden flex border border-slate-200">
              <div className="bg-red-500 h-full" style={{ width: barWidth(critHigh, jobs.length) }}></div>
              <div className="bg-amber-500 h-full" style={{ width: barWidth(critMed, jobs.length) }}></div>
              <div className="bg-slate-400 h-full" style={{ width: barWidth(critLow, jobs.length) }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
              Tier 1 critical jobs receive highest priority weighting in the optimization objective function.
            </p>
          </div>
        </div>

        {/* 3: Block Density by Section */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Top Maintenance Corridor Densities</h3>
            <span className="text-xs text-slate-400">Active Block Allocations</span>
          </div>
          <div className="p-4 space-y-3 text-xs">
            {topSections.map(([secId, count]) => {
              const maxCount = topSections[0][1] || 1;
              return (
                <div key={secId} className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-800 w-14 shrink-0">{secId}</span>
                  <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden border border-slate-200">
                    <div
                      className="bg-blue-500 h-full rounded"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-slate-600 w-14 text-right">{count} blocks</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4: Resource Utilization */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Maintenance Gang & Machinery Availability</h3>
            <span className="text-xs font-mono text-green-700 font-bold">{resources.length} Teams</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 text-xs text-center mb-4">
              <div className="border border-blue-200 rounded p-3 bg-blue-50">
                <div className="text-[10px] text-blue-700 font-bold">P.Way Tamping Gangs</div>
                <div className="text-xl font-bold font-mono text-blue-800 my-1">6 Teams</div>
                <div className="text-[10px] text-green-700 font-semibold">All Available</div>
              </div>
              <div className="border border-amber-200 rounded p-3 bg-amber-50">
                <div className="text-[10px] text-amber-700 font-bold">TRD Tower Wagons</div>
                <div className="text-xl font-bold font-mono text-amber-800 my-1">6 Units</div>
                <div className="text-[10px] text-green-700 font-semibold">All Available</div>
              </div>
              <div className="border border-cyan-200 rounded p-3 bg-cyan-50">
                <div className="text-[10px] text-cyan-700 font-bold">S&T Testing Crews</div>
                <div className="text-xl font-bold font-mono text-cyan-800 my-1">6 Squads</div>
                <div className="text-[10px] text-green-700 font-semibold">All Available</div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] text-slate-600 leading-relaxed font-mono">
              Hard constraint: Concurrent assignments on any section cannot exceed available certified gangs for that department. CP-SAT enforces this at planning stage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
