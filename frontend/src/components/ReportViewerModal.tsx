import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Printer, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface ReportViewerModalProps {
  reportId: string | null;
  onClose: () => void;
}

interface ReportData {
  id: string;
  name: string;
  category: string;
  period: string;
  generated_at: string;
  status: string;
  summary_metrics: Array<{ label: string; value: string | number; sub: string }>;
  headers: string[];
  records: Array<Record<string, any>>;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ reportId, onClose }) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    api.getReport(reportId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load report', err);
        setError(err.message || 'Unable to generate report data from the planning server.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  if (!reportId) return null;

  const downloadCsv = () => {
    if (!data || !data.records.length) return;
    const headers = data.headers;
    const csvRows = [
      headers.join(','),
      ...data.records.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.id}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-railway-blue">
              <FileText className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{data?.name || 'Report Detail'}</h3>
                {data?.status && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    {data.status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Government of India · Ministry of Railways · Northern Division
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <>
                <button
                  onClick={downloadCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Export records to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-green-600" />
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Print report"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-700" />
                  Print / PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition ml-2"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-5">
          {loading ? (
            <div className="py-24 text-center text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-700 animate-spin mx-auto" />
              <p className="text-sm text-slate-600 font-medium">Generating report...</p>
              <p className="text-[11px] text-slate-400">Querying live railway optimization database and assets</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-slate-600 bg-slate-50 border border-slate-200 rounded p-6 max-w-md mx-auto space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Unable to generate report</p>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs transition"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* Report Metadata Banner */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Report Identifier</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{data.id}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Category</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{data.category}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Planning Period</div>
                  <div className="font-mono text-slate-700 mt-0.5">{data.period}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Generated Timestamp</div>
                  <div className="font-mono text-slate-700 mt-0.5">{data.generated_at}</div>
                </div>
              </div>

              {/* Summary KPIs */}
              {data.summary_metrics && data.summary_metrics.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                    Summary Metrics & Telemetry
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {data.summary_metrics.map((m, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded p-3 shadow-xs">
                        <div className="text-[11px] text-slate-500 font-medium">{m.label}</div>
                        <div className="text-lg font-bold text-blue-900 font-mono mt-1">{m.value}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Data Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Detailed Record Allocation ({data.records.length} items)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Source: PostgreSQL `railopt` database
                  </span>
                </div>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="overflow-x-auto max-h-[44vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr className="border-b border-slate-300 text-slate-600 font-semibold text-[11px]">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          {data.headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.records.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-slate-100 hover:bg-blue-50/40 transition ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            {data.headers.map((h, i) => {
                              const val = row[h];
                              return (
                                <td key={i} className="py-2 px-3 whitespace-nowrap text-slate-700">
                                  {val !== undefined && val !== null ? String(val) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Official RailOpt System Generated Document · Northern Railway Division</span>
          </div>
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
