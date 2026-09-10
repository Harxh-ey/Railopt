import React, { useState, useEffect } from 'react';
import {
  Play, RefreshCw, Download, BarChart2, ChevronRight, ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { Block, OptimizationRun, BaselineComparisonMetrics } from '../types';

interface BlockPlanningViewProps {
  onInspectBlock: (blockId: string) => void;
}

const deptBadge = (dept: string) => {
  if (dept === 'Engineering') return 'bg-blue-50 text-blue-800 border-blue-200';
  if (dept === 'Traction Distribution') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-cyan-50 text-cyan-800 border-cyan-200';
};

const deptBarColor = (dept: string) => {
  if (dept === 'Engineering') return 'bg-blue-500';
  if (dept === 'Traction Distribution') return 'bg-amber-500';
  return 'bg-cyan-500';
};

export const BlockPlanningView: React.FC<BlockPlanningViewProps> = ({ onInspectBlock }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [telemetry, setTelemetry] = useState<OptimizationRun | null>(null);
  const [comparison, setComparison] = useState<BaselineComparisonMetrics[]>([]);
  const [baselineRun, setBaselineRun] = useState<OptimizationRun | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showBaseline, setShowBaseline] = useState<boolean>(false);

  const [planningHorizon, setPlanningHorizon] = useState<string>('WEEKLY');
  const [objective, setObjective] = useState<string>('BALANCED');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadData = async () => {
    setLoading(true);
    try {
      const [optRes, baseRes] = await Promise.all([
        api.getLatestOptimization(),
        api.getBaselineComparison()
      ]);
      setBlocks(optRes.blocks);
      setTelemetry(optRes.telemetry);
      setComparison(baseRes.comparison_metrics);
      setBaselineRun(baseRes.baseline_run);
    } catch (e) {
      console.error('Failed to load optimization data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await api.runOptimization();
      setBlocks(res.blocks);
      setTelemetry(res.telemetry);
      const baseRes = await api.getBaselineComparison();
      setComparison(baseRes.comparison_metrics);
    } catch (e) {
      console.error('Optimization run failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPlan = () => {
    const exportData = { planning_horizon: planningHorizon, telemetry, blocks };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RailOpt_BlockPlan_${planningHorizon}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBlocks = blocks.filter((b) => {
    if (selectedDeptFilter !== 'ALL' && !b.departments.includes(selectedDeptFilter)) return false;
    if (selectedSectionFilter !== 'ALL' && b.section_id !== selectedSectionFilter) return false;
    return true;
  });

  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    const va = (a as any)[sortBy];
    const vb = (b as any)[sortBy];
    if (typeof va === 'string') return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortOrder === 'asc' ? va - vb : vb - va;
  });

  const uniqueSections = Array.from(new Set(blocks.map((b) => b.section_id))).sort();

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="space-y-4">
      {/* Controls Panel */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">Automatic Block Planning</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Constraint-aware scheduling integrating Engineering, Traction Distribution, and Signal & Telecommunication maintenance into conflict-free block windows
          </p>
        </div>

        <div className="px-4 py-4">
          {/* Planning Parameters */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Planning Horizon</label>
              <select
                value={planningHorizon}
                onChange={(e) => setPlanningHorizon(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="WEEKLY">Weekly (7-Day)</option>
                <option value="MONTHLY">Monthly (30-Day)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Planning Date</label>
              <input
                type="text"
                defaultValue="14/09/2026"
                readOnly
                className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 cursor-default w-28"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Objective</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="BALANCED">Balanced</option>
                <option value="MAXIMIZE_COORD">Maximize Coordination</option>
                <option value="MINIMIZE_DOWNTIME">Minimize Downtime</option>
                <option value="CRITICAL_FIRST">Critical Jobs First</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="flex items-center gap-2 bg-railway-blue hover:bg-railway-blue-dark text-white text-xs font-semibold px-4 py-2 rounded border border-blue-900 transition disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                Generate Plan
              </button>

              <button
                onClick={() => setShowBaseline(!showBaseline)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded border border-slate-300 transition"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-700" />
                Compare with Baseline
              </button>

              <button
                onClick={handleExportPlan}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded border border-slate-300 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Optimization Result Status Bar */}
          {telemetry && (
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200 text-xs">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                telemetry.solver_status === 'OPTIMAL' || telemetry.solver_status === 'FEASIBLE'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {telemetry.solver_status}
              </span>
              <span className="text-slate-500">
                <strong className="text-slate-700">{telemetry.total_blocks_created}</strong> blocks generated
              </span>
              <span className="text-slate-500">
                <strong className="text-slate-700">{telemetry.coordinated_blocks_count}</strong> multi-department coordinated
              </span>
              <span className="text-slate-500">
                <strong className="text-slate-700">{telemetry.scheduled_jobs_count}</strong> jobs scheduled
              </span>
              <span className="text-slate-500">
                Solver time: <strong className="text-slate-700 font-mono">{telemetry.execution_time_ms}ms</strong>
              </span>
              <span className="text-slate-400 text-[11px] font-mono">Run ID: {telemetry.run_id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Baseline Comparison Panel */}
      {showBaseline && comparison.length > 0 && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden animate-fadeIn">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Baseline vs. RailOpt — Planning Improvement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of manual departmental scheduling against RailOpt optimized coordination
              </p>
            </div>
            <button
              onClick={() => setShowBaseline(false)}
              className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 px-2.5 py-1 rounded bg-white"
            >
              Hide
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4 text-[11px]">Metric</th>
                  <th className="py-2.5 px-4 text-[11px] text-red-700">Baseline (Manual / Legacy)</th>
                  <th className="py-2.5 px-4 text-[11px] text-blue-800">RailOpt (Optimized)</th>
                  <th className="py-2.5 px-4 text-[11px] text-green-700">Improvement</th>
                  <th className="py-2.5 px-4 text-[11px] text-slate-500">Operational Significance</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((m, idx) => (
                  <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{m.metric_name}</td>
                    <td className="py-2.5 px-4 font-mono text-red-700">{m.baseline_value}</td>
                    <td className="py-2.5 px-4 font-mono text-blue-800 font-bold">{m.railopt_value}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-green-700">{m.improvement}</td>
                    <td className="py-2.5 px-4 text-slate-600">{m.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block Plan Table + Gantt */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Optimized Block Plan
              {filteredBlocks.length > 0 && (
                <span className="text-[11px] font-normal text-slate-500 ml-2">
                  ({filteredBlocks.length} blocks · {sortedBlocks.filter(b => b.block_type === 'MULTI_DEPT_COORDINATED').length} coordinated)
                </span>
              )}
            </h3>
          </div>

          {/* Table-level filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Traction Distribution">Traction Distribution</option>
              <option value="Signal & Telecommunication">Signal & Telecom</option>
            </select>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono"
            >
              <option value="ALL">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Generating block plan...
          </div>
        ) : sortedBlocks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            {blocks.length === 0
              ? 'No block plan generated yet. Use "Generate Plan" to run the optimizer.'
              : 'No blocks match the current filters.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 text-[11px] w-10 text-center">S.No.</th>
                  <th className="py-2.5 px-3 text-[11px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort('block_id')}>
                    <span className="flex items-center gap-1">Block ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                  </th>
                  <th className="py-2.5 px-3 text-[11px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort('section_id')}>
                    <span className="flex items-center gap-1">Section <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                  </th>
                  <th className="py-2.5 px-3 text-[11px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort('date')}>
                    <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                  </th>
                  <th className="py-2.5 px-3 text-[11px]">Start</th>
                  <th className="py-2.5 px-3 text-[11px]">End</th>
                  <th className="py-2.5 px-3 text-[11px] text-center">Duration</th>
                  <th className="py-2.5 px-3 text-[11px]">Departments</th>
                  <th className="py-2.5 px-3 text-[11px]">Gantt / Job Timeline</th>
                  <th className="py-2.5 px-3 text-[11px] text-center">Jobs</th>
                  <th className="py-2.5 px-3 text-[11px]">Train Impact</th>
                  <th className="py-2.5 px-3 text-[11px]">Status</th>
                  <th className="py-2.5 px-3 text-[11px] text-right text-blue-700">Score</th>
                  <th className="py-2.5 px-2 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {sortedBlocks.map((blk, idx) => {
                  const isCoord = blk.block_type === 'MULTI_DEPT_COORDINATED';
                  return (
                    <tr
                      key={blk.block_id}
                      onClick={() => onInspectBlock(blk.block_id)}
                      className={`border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-800">{blk.block_id}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{blk.section_id}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{blk.date}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{blk.start_time}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{blk.end_time}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{blk.duration_minutes}m</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {blk.departments.map((d, i) => (
                            <span key={i} className={`px-1.5 py-0 rounded text-[10px] font-semibold border ${deptBadge(d)}`}>
                              {d === 'Engineering' ? 'ENG' : d === 'Traction Distribution' ? 'TRD' : 'S&T'}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Mini Gantt inline */}
                      <td className="py-2 px-3">
                        <div className="w-32 bg-slate-200 rounded overflow-hidden h-4 relative">
                          {blk.jobs.map((j) => {
                            const leftPct = Math.min(80, (j.start_offset_minutes / blk.duration_minutes) * 100);
                            const widthPct = Math.min(100 - leftPct, Math.max(10, (j.duration_minutes / blk.duration_minutes) * 100));
                            return (
                              <div
                                key={j.job_id}
                                title={`${j.department}: ${j.description}`}
                                className={`absolute top-0 h-full opacity-80 ${deptBarColor(j.department)}`}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              />
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{blk.jobs.length}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[11px] font-semibold ${
                          blk.operational_impact === 'LOW' ? 'text-green-700'
                          : blk.operational_impact === 'MEDIUM' ? 'text-amber-700'
                          : 'text-red-700'
                        }`}>
                          {blk.operational_impact || 'Low'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          isCoord
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isCoord ? 'Optimized' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-green-700">{blk.score}</td>
                      <td className="py-2 px-2">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {sortedBlocks.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center gap-4 text-[11px] text-slate-500">
            <span>Gantt Legend:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span> Engineering</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span> Traction</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block"></span> S&T</span>
            <span className="ml-auto text-blue-700 font-medium">
              Click any row to view Planning Justification →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
