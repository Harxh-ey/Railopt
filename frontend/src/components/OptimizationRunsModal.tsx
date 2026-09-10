import React from 'react';
import { X, Cpu, Sliders } from 'lucide-react';
import { OptimizationRun } from '../types';

interface OptimizationRunsModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: OptimizationRun | null;
}

export const OptimizationRunsModal: React.FC<OptimizationRunsModalProps> = ({ isOpen, onClose, telemetry }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6 pt-20 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-700" />
              Optimization Engine — Run Telemetry
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                telemetry?.solver_status === 'OPTIMAL' || telemetry?.solver_status === 'FEASIBLE'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {telemetry?.solver_status || 'READY'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Google OR-Tools CP-SAT — Multi-Objective Constraint Integer Programming
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Top Solver Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
            {[
              { label: 'Solve Time', value: telemetry ? `${telemetry.execution_time_ms} ms` : '—', color: 'text-blue-800' },
              { label: 'Objective Score', value: telemetry ? telemetry.objective_score : '—', color: 'text-green-700' },
              { label: 'Coordination Rate', value: telemetry ? `${telemetry.coordination_rate_percent}%` : '—', color: 'text-blue-700' },
              { label: 'Corridor Downtime', value: telemetry ? `${Math.round(telemetry.total_downtime_minutes / 60)} hrs` : '—', color: 'text-slate-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-slate-500 text-[10px] font-semibold uppercase mb-1">{label}</div>
                <div className={`font-mono text-base font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* CP-SAT Mathematical Model */}
          <div className="border border-slate-200 rounded p-4 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
              <Sliders className="w-4 h-4 text-blue-700" />
              Active Mathematical Formulation (CP-SAT)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">DECISION VARIABLES</div>
                <div className="space-y-1 font-mono text-[11px] text-slate-700">
                  <div>• x[j, w] ∈ &#123;0, 1&#125; (Job Assignment)</div>
                  <div>• y[w] ∈ &#123;0, 1&#125; (Window Activation)</div>
                  <div>• coord[w] ∈ &#123;0, 1&#125; (≥2 Depts Bundling)</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">HARD CONSTRAINTS</div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div>• Window duration capacity per section</div>
                  <div>• Certified gang limits per department</div>
                  <div>• Train safety buffer &gt;30 minutes</div>
                  <div>• Electrical/traffic isolation enforcement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Run Details Table */}
          {telemetry && (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: 'Run Identifier', value: telemetry.run_id },
                    { label: 'Execution Timestamp', value: telemetry.timestamp },
                    { label: 'Planning Horizon', value: telemetry.planning_horizon },
                    { label: 'Jobs Scheduled', value: `${telemetry.scheduled_jobs_count} of ${telemetry.scheduled_jobs_count + telemetry.unscheduled_jobs_count}` },
                    { label: 'Unscheduled Backlog', value: `${telemetry.unscheduled_jobs_count} jobs` },
                    { label: 'Coordinated Blocks', value: `${telemetry.coordinated_blocks_count} of ${telemetry.total_blocks_created}` },
                  ].map(({ label, value }) => (
                    <tr key={label} className="bg-white even:bg-slate-50/50">
                      <td className="py-2 px-4 font-semibold text-slate-500 w-48 text-[11px]">{label}</td>
                      <td className="py-2 px-4 font-mono text-slate-800 text-[11px]">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
