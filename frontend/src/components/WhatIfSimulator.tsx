import React, { useState, useEffect } from 'react';
import { RotateCcw, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { WhatIfResult, BlockWindow, MaintenanceJob, Resource } from '../types';

interface WhatIfSimulatorProps {
  onInspectBlock: (blockId: string) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ onInspectBlock }) => {
  const [windows, setWindows] = useState<BlockWindow[]>([]);
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [mutationType, setMutationType] = useState<string>('REMOVE_WINDOW');
  const [targetId, setTargetId] = useState<string>('WIN_SEC01_01');
  const [delayDays, setDelayDays] = useState<number>(3);
  const [newUrgency, setNewUrgency] = useState<number>(10);
  const [activeMutations, setActiveMutations] = useState<Array<{ mutation_type: string; target_id: string; parameters?: any }>>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  useEffect(() => {
    Promise.all([
      api.getBlockWindows(),
      api.getMaintenanceJobs(),
      api.getResources()
    ]).then(([w, j, r]) => {
      setWindows(w);
      setJobs(j);
      setResources(r);
    });
  }, []);

  const handleAddMutation = () => {
    let params: any = {};
    if (mutationType === 'DELAY_JOB') params = { delay_days: delayDays };
    if (mutationType === 'CHANGE_PRIORITY') params = { urgency: newUrgency, criticality: 10 };
    if (mutationType === 'ADD_TRAIN_CONFLICT') params = { section_id: 'SEC01', arrival_time: '02:00', departure_time: '02:30' };
    setActiveMutations([...activeMutations, { mutation_type: mutationType, target_id: targetId, parameters: params }]);
  };

  const handleApplyPreset = (presetType: string) => {
    if (presetType === 'CANCEL_SEC01') {
      setActiveMutations([{ mutation_type: 'REMOVE_WINDOW', target_id: 'WIN_SEC01_01' }]);
    } else if (presetType === 'BCM_BREAKDOWN') {
      setActiveMutations([{ mutation_type: 'DISABLE_RESOURCE', target_id: 'RES_ENG_01' }]);
    } else if (presetType === 'EMERGENCY_TRAIN') {
      setActiveMutations([{ mutation_type: 'ADD_TRAIN_CONFLICT', target_id: 'SEC01', parameters: { section_id: 'SEC01', arrival_time: '01:30', departure_time: '02:15' } }]);
    }
  };

  const handleReoptimize = async () => {
    setLoading(true);
    try {
      const res = await api.simulateReoptimize(activeMutations);
      setResult(res);
    } catch (e) {
      console.error('Simulation failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetSimulation();
      setActiveMutations([]);
      setResult(null);
    } catch (e) {
      console.error('Reset failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">What-If Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate the impact of changes before finalizing the maintenance plan. Add scenario changes, then re-run the optimizer to compare results.
          </p>
        </div>

        <div className="px-4 py-4">
          {/* Quick Scenario Presets */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">Quick Scenario Presets</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleApplyPreset('CANCEL_SEC01')}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-700 transition"
              >
                Cancel Window WIN_SEC01_01
              </button>
              <button
                onClick={() => handleApplyPreset('BCM_BREAKDOWN')}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-700 transition"
              >
                Tamping Gang Breakdown (RES_ENG_01)
              </button>
              <button
                onClick={() => handleApplyPreset('EMERGENCY_TRAIN')}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-700 transition"
              >
                Insert Emergency Train (SEC01, 01:30–02:15)
              </button>
            </div>
          </div>

          {/* Scenario Parameter Entry Form */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="text-[11px] font-semibold text-slate-600 mb-3 uppercase tracking-wide">Scenario Parameters</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Change Type</label>
                <select
                  value={mutationType}
                  onChange={(e) => {
                    setMutationType(e.target.value);
                    if (e.target.value === 'REMOVE_WINDOW') setTargetId('WIN_SEC01_01');
                    if (e.target.value === 'DISABLE_RESOURCE') setTargetId('RES_ENG_01');
                    if (e.target.value === 'DELAY_JOB' || e.target.value === 'CHANGE_PRIORITY') setTargetId('JOB_SEC01_ENG');
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="REMOVE_WINDOW">Remove Block Window</option>
                  <option value="DELAY_JOB">Delay Maintenance Job</option>
                  <option value="CHANGE_PRIORITY">Change Job Priority</option>
                  <option value="DISABLE_RESOURCE">Make Resource Unavailable</option>
                  <option value="ADD_TRAIN_CONFLICT">Add Train Movement</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Target</label>
                {mutationType === 'REMOVE_WINDOW' && (
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono">
                    {windows.slice(0, 15).map((w) => (
                      <option key={w.window_id} value={w.window_id}>
                        {w.window_id} ({w.section_id} · {w.date} {w.start_time}-{w.end_time})
                      </option>
                    ))}
                  </select>
                )}
                {(mutationType === 'DELAY_JOB' || mutationType === 'CHANGE_PRIORITY') && (
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono">
                    {jobs.slice(0, 15).map((j) => (
                      <option key={j.job_id} value={j.job_id}>
                        {j.job_id} ({j.section_id} · {j.department.slice(0, 3)})
                      </option>
                    ))}
                  </select>
                )}
                {mutationType === 'DISABLE_RESOURCE' && (
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono">
                    {resources.map((r) => (
                      <option key={r.resource_id} value={r.resource_id}>
                        {r.resource_id} ({r.resource_type} · {r.department_id})
                      </option>
                    ))}
                  </select>
                )}
                {mutationType === 'ADD_TRAIN_CONFLICT' && (
                  <div className="text-xs text-slate-500 pt-1.5 font-mono">SEC01 (01:30 — 02:15)</div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Parameters</label>
                {mutationType === 'DELAY_JOB' && (
                  <input type="number" min="1" max="14" value={delayDays}
                    onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    placeholder="Delay (days)" />
                )}
                {mutationType === 'CHANGE_PRIORITY' && (
                  <input type="number" min="1" max="10" value={newUrgency}
                    onChange={(e) => setNewUrgency(parseInt(e.target.value) || 10)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    placeholder="New urgency (1–10)" />
                )}
                {['REMOVE_WINDOW', 'DISABLE_RESOURCE', 'ADD_TRAIN_CONFLICT'].includes(mutationType) && (
                  <div className="text-xs text-slate-400 pt-1.5 italic">No additional parameters</div>
                )}
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddMutation}
                  className="w-full bg-white hover:bg-slate-50 text-blue-700 font-semibold px-3 py-1.5 rounded text-xs border border-blue-300 transition"
                >
                  + Add to Scenario
                </button>
              </div>
            </div>
          </div>

          {/* Active Scenario Changes */}
          {activeMutations.length > 0 && (
            <div className="mt-3 border border-amber-200 rounded p-3 bg-amber-50">
              <div className="text-[11px] font-semibold text-amber-700 mb-2">
                Pending Scenario Changes ({activeMutations.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {activeMutations.map((m, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs flex items-center gap-2">
                    <span className="font-semibold text-amber-700 font-mono">{m.mutation_type}:</span>
                    <span className="text-slate-700 font-mono">{m.target_id}</span>
                    <button
                      onClick={() => setActiveMutations(activeMutations.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleReoptimize}
              disabled={loading || activeMutations.length === 0}
              className="flex items-center gap-2 bg-railway-blue hover:bg-railway-blue-dark text-white text-xs font-semibold px-5 py-2 rounded border border-blue-900 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              Re-Optimize Schedule
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded border border-slate-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Baseline
            </button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      {result && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden animate-fadeIn">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-800">Revised Planning Result</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Scenario ID: {result.scenario_id}</span>
          </div>

          {/* Summary message */}
          <div className="px-4 py-3 border-b border-slate-200 bg-blue-50 text-xs text-blue-800 leading-relaxed font-mono">
            {result.summary_diff}
          </div>

          {/* Comparison stats: Original vs Revised */}
          <div className="px-4 py-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Plan Comparison</div>
            <table className="w-full text-xs border-collapse border border-slate-200 rounded overflow-hidden">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                  <th className="py-2 px-4 text-left">Metric</th>
                  <th className="py-2 px-4 text-center text-slate-600">Original Plan</th>
                  <th className="py-2 px-4 text-center text-blue-700">Revised Plan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-700 font-medium">Total Blocks</td>
                  <td className="py-2 px-4 text-center font-mono">{result.previous_blocks_count}</td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-blue-800">{result.new_blocks_count}</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="py-2 px-4 text-slate-700 font-medium">Corridor Downtime</td>
                  <td className="py-2 px-4 text-center font-mono">{Math.round(result.previous_downtime_minutes / 60)}h {result.previous_downtime_minutes % 60}m</td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-blue-800">{Math.round(result.new_downtime_minutes / 60)}h {result.new_downtime_minutes % 60}m</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-700 font-medium">Affected Jobs</td>
                  <td className="py-2 px-4 text-center font-mono">—</td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-amber-700">{result.affected_jobs_count}</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="py-2 px-4 text-slate-700 font-medium">Rescheduled</td>
                  <td className="py-2 px-4 text-center font-mono">—</td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-green-700">{result.rescheduled_jobs_count}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-700 font-medium">Unscheduled (Manual Required)</td>
                  <td className="py-2 px-4 text-center font-mono">—</td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-red-700">{result.manual_intervention_count}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Changed Jobs Detail */}
          {result.affected_job_details.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Changes in Plan</div>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                      <th className="py-2 px-3 text-[11px]">Job ID</th>
                      <th className="py-2 px-3 text-[11px]">Description</th>
                      <th className="py-2 px-3 text-[11px]">Previous Block</th>
                      <th className="py-2 px-3 text-[11px]">Revised Block</th>
                      <th className="py-2 px-3 text-[11px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.affected_job_details.map((item, idx) => {
                      const isManual = item.status === 'MANUAL_INTERVENTION_REQUIRED';
                      return (
                        <tr key={idx} className={`border-b border-slate-100 ${isManual ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="py-2 px-3 font-mono font-bold text-blue-800">{item.job_id}</td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{item.description}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.previous_block || '—'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{item.new_block || '—'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              isManual
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                              {isManual ? 'Manual Required' : item.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
