import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Block, Section } from '../types';

interface WhyThisBlockModalProps {
  blockId: string | null;
  onClose: () => void;
}

export const WhyThisBlockModal: React.FC<WhyThisBlockModalProps> = ({ blockId, onClose }) => {
  const [data, setData] = useState<{ block: Block; section: Section; explanation: any } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blockId) return;
    setLoading(true);
    setError(null);
    api.getBlockDetail(blockId)
      .then((res) => { setData(res); setLoading(false); })
      .catch((err) => { setError(err.message || 'Failed to load block information.'); setLoading(false); });
  }, [blockId]);

  if (!blockId) return null;

  const deptBadge = (dept: string) => {
    if (dept === 'Engineering') return 'border-l-blue-500 bg-blue-50';
    if (dept === 'Traction Distribution') return 'border-l-amber-500 bg-amber-50';
    return 'border-l-cyan-500 bg-cyan-50';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6 pt-16 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-fadeIn">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-slate-800">Planning Justification</h3>
              <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                {blockId}
              </span>
            </div>
            <p className="text-xs text-slate-500">Reason for Block Selection · Constraint Evaluation · Scheduling Rationale</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {loading && (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading block information...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Planning Pipeline */}
              <div className="border border-slate-200 rounded bg-slate-50 p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Planning Decision Pipeline
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { step: '1. Requirements', value: `${data.block.jobs.length} Priority Jobs`, color: 'text-red-700 bg-red-50 border-red-200' },
                    null,
                    { step: '2. Constraints', value: 'Isolation · Buffer ≥30m', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                    null,
                    { step: '3. COA Window', value: `${data.block.duration_minutes}m slot`, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    null,
                    { step: '4. Optimization', value: `Score: ${data.block.score}`, color: 'text-slate-700 bg-white border-slate-200' },
                    null,
                    { step: '5. Selected Block', value: data.block.block_id, color: 'text-green-700 bg-green-50 border-green-300' },
                  ].map((item, idx) =>
                    item === null ? (
                      <ArrowRight key={idx} className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : (
                      <div key={idx} className={`px-2.5 py-1.5 rounded border text-center ${item.color}`}>
                        <div className="text-[10px] text-slate-400">{item.step}</div>
                        <div className="font-bold text-[11px]">{item.value}</div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Block Specifications */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Block Specifications</div>
                <table className="w-full border-collapse border border-slate-200 rounded overflow-hidden">
                  <tbody className="text-xs divide-y divide-slate-100">
                    <tr className="bg-white">
                      <td className="py-2 px-3 font-semibold text-slate-500 w-1/4">Section</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{data.block.section_id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-500 w-1/4">Status</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">
                          {data.block.status}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-500">Date</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{data.block.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-500">Block Type</td>
                      <td className="py-2 px-3 text-slate-700">{data.block.block_type?.replace(/_/g, ' ')}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-3 font-semibold text-slate-500">Window</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-800">{data.block.start_time} — {data.block.end_time}</td>
                      <td className="py-2 px-3 font-semibold text-slate-500">Duration</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{data.block.duration_minutes} minutes</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-500">Departments</td>
                      <td className="py-2 px-3">{data.block.departments.join(', ')}</td>
                      <td className="py-2 px-3 font-semibold text-slate-500">Downtime Saved</td>
                      <td className="py-2 px-3 font-mono font-bold text-green-700">
                        {data.explanation?.metrics?.downtime_minutes_saved || 0} minutes
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reason for Selection */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Reason for Selection
                </div>
                <div className="space-y-2">
                  {(data.explanation.reasons || []).map((r: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded p-3 flex items-start gap-3 bg-white">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-800 text-[11px] mb-0.5">{r.title}</div>
                        <div className="text-slate-500 leading-relaxed">{r.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance Activities */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Maintenance Activities ({data.block.jobs.length} Jobs)
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Total work duration: {data.explanation?.metrics?.total_job_duration_sum || 0} minutes
                  </span>
                </div>
                <div className="space-y-2">
                  {data.block.jobs.map((j) => (
                    <div
                      key={j.job_id}
                      className={`border border-slate-200 border-l-4 rounded-r p-3 flex justify-between items-start gap-3 ${deptBadge(j.department)}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-blue-800 text-[11px]">{j.job_id}</span>
                          <span className="text-slate-600 font-semibold">{j.department}</span>
                          <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            Priority: {j.priority_score}
                          </span>
                        </div>
                        <p className="text-slate-700">{j.description}</p>
                        <p className="text-slate-500 mt-0.5">Resource: <strong>{j.required_resource}</strong></p>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {j.duration_minutes}m
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          +{j.start_offset_minutes}m → +{j.end_offset_minutes}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
