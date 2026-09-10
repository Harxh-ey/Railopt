import React from 'react';
import { X, Wrench } from 'lucide-react';
import { MaintenanceJob } from '../types';

interface JobDetailModalProps {
  job: MaintenanceJob | null;
  onClose: () => void;
  onViewBlock?: (blockId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onViewBlock }) => {
  if (!job) return null;

  const cPoints = (job.criticality * 2.5).toFixed(1);
  const uPoints = (job.urgency * 2.5).toFixed(1);
  const aPoints = (job.asset_impact * 2.0).toFixed(1);
  const oPoints = (Math.min(10, Math.max(0, job.overdue_days)) * 1.5).toFixed(1);
  const historyScore = job.failure_history === 'HIGH' ? 10.0 : job.failure_history === 'MEDIUM' ? 6.5 : 3.0;
  const hPoints = (historyScore * 1.5).toFixed(1);

  const deptBadge =
    job.department === 'Engineering' ? 'bg-blue-50 text-blue-800 border-blue-200'
    : job.department === 'Traction Distribution' ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-cyan-50 text-cyan-800 border-cyan-200';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6 pt-16 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Wrench className="w-4 h-4 text-slate-500" />
              <span className="font-mono font-bold text-slate-800">{job.job_id}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${deptBadge}`}>
                {job.department}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                {job.maintenance_type}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Section: <strong className="text-slate-700">{job.section_id}</strong> · Asset: <strong className="text-slate-700">{job.asset_id}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Description */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">Scope of Work</div>
            <p className="text-slate-700 leading-relaxed">{job.description}</p>
          </div>

          {/* Priority Score */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold text-slate-700">Priority Score Calculation</div>
              <span className="font-mono text-xl font-extrabold text-green-700">{job.priority_score} / 100</span>
            </div>
            <div className="grid grid-cols-5 divide-x divide-slate-100">
              {[
                { label: 'Criticality', val: `${job.criticality}/10`, pts: cPoints },
                { label: 'Urgency', val: `${job.urgency}/10`, pts: uPoints },
                { label: 'Asset Impact', val: `${job.asset_impact}/10`, pts: aPoints },
                { label: 'Overdue', val: `+${job.overdue_days}d`, pts: oPoints },
                { label: 'Failure Hist.', val: job.failure_history, pts: hPoints },
              ].map(({ label, val, pts }) => (
                <div key={label} className="p-2.5 text-center bg-white">
                  <div className="text-[10px] text-slate-500 mb-1">{label}</div>
                  <div className="font-bold font-mono text-slate-800">{val}</div>
                  <div className="text-[10px] text-green-700 font-semibold mt-0.5">+{pts} pts</div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Details */}
          <table className="w-full border-collapse border border-slate-200 rounded overflow-hidden">
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="py-2 px-3 font-semibold text-slate-500 text-[11px] w-36">Required Resource</td>
                <td className="py-2 px-3 text-slate-700 font-semibold">{job.required_resource}</td>
                <td className="py-2 px-3 font-semibold text-slate-500 text-[11px] w-28">Duration</td>
                <td className="py-2 px-3 font-mono text-slate-700">{job.duration_minutes} minutes</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 px-3 font-semibold text-slate-500 text-[11px]">Block Requirement</td>
                <td className="py-2 px-3 font-mono text-blue-800 font-bold">{job.block_requirement}</td>
                <td className="py-2 px-3 font-semibold text-slate-500 text-[11px]">Isolation</td>
                <td className="py-2 px-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                    job.isolation_required
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {job.isolation_required ? 'Isolation Required' : 'No Isolation'}
                  </span>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-3 font-semibold text-slate-500 text-[11px]">Due Date</td>
                <td className="py-2 px-3 font-mono text-slate-700">{job.due_date}</td>
                <td className="py-2 px-3 font-semibold text-slate-500 text-[11px]">Status</td>
                <td className="py-2 px-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                    job.status === 'SCHEDULED' ? 'bg-green-50 text-green-700 border-green-200'
                    : job.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {job.status}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Compatible Departments */}
          {job.compatible_departments && job.compatible_departments.length > 0 && (
            <div className="border border-slate-200 rounded p-3 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Compatible Cross-Department Activities:</span>
              <div className="flex gap-1.5">
                {job.compatible_departments.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                    {d}
                  </span>
                ))}
              </div>
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
