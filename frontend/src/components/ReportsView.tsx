import React, { useState } from 'react';
import { FileText, Download, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  period: string;
  lastGenerated: string;
  status: 'available' | 'pending' | 'not_generated';
}

const reports: Report[] = [
  {
    id: 'RPT_WEEKLY_BLOCK',
    name: 'Weekly Maintenance Block Plan',
    description: 'Consolidated 7-day block schedule for all sections and departments. Includes Gantt timeline, section-wise allocations, and coordination summary.',
    category: 'Block Planning',
    period: '11–17 September 2026',
    lastGenerated: '10 Sep 2026, 22:30',
    status: 'available',
  },
  {
    id: 'RPT_MONTHLY_BLOCK',
    name: 'Monthly Maintenance Block Plan',
    description: '30-day strategic maintenance horizon. Includes week-by-week job distribution, asset availability projections, and backlog trends.',
    category: 'Block Planning',
    period: 'September 2026',
    lastGenerated: '10 Sep 2026, 22:30',
    status: 'available',
  },
  {
    id: 'RPT_DEPT_MAINT',
    name: 'Department-wise Maintenance Report',
    description: 'Workload breakdown by Engineering, Traction Distribution, and Signal & Telecommunication departments. Job status, criticality tiers, and resource utilization.',
    category: 'Maintenance',
    period: '11–17 September 2026',
    lastGenerated: '10 Sep 2026, 22:00',
    status: 'available',
  },
  {
    id: 'RPT_ASSET_AVAIL',
    name: 'Asset Availability Report',
    description: 'Current and projected availability percentages for all tracked assets. Highlights high-risk and overdue maintenance assets.',
    category: 'Assets',
    period: 'September 2026',
    lastGenerated: '10 Sep 2026, 22:00',
    status: 'available',
  },
  {
    id: 'RPT_OPT_PERF',
    name: 'Optimization Performance Report',
    description: 'Solver telemetry and baseline comparison. Includes blocks generated, coordination rate, downtime saved, and CP-SAT execution metrics.',
    category: 'Analytics',
    period: 'Last optimization run',
    lastGenerated: '10 Sep 2026, 22:30',
    status: 'available',
  },
  {
    id: 'RPT_TRAIN_IMPACT',
    name: 'Train Impact Report',
    description: 'Assessment of maintenance block impact on train movements. Train conflicts avoided, buffer adherence, and timetable compatibility analysis.',
    category: 'Operations',
    period: '11–17 September 2026',
    lastGenerated: '—',
    status: 'not_generated',
  },
];

export const ReportsView: React.FC = () => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'Block Planning': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Maintenance': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Assets': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Analytics': return 'bg-green-50 text-green-700 border-green-200';
      case 'Operations': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const handleGenerate = (reportId: string) => {
    setGeneratingId(reportId);
    setTimeout(() => {
      setGeneratingId(null);
      setGenerated((prev) => new Set([...prev, reportId]));
    }, 1500);
  };

  const handleExportPdf = (report: Report) => {
    alert(`Exporting "${report.name}" as PDF...\n\nNote: PDF export requires a backend rendering service. This button is wired for integration.`);
  };

  const handleExportExcel = (report: Report) => {
    alert(`Exporting "${report.name}" as Excel...\n\nNote: Excel export requires a backend rendering service. This button is wired for integration.`);
  };

  const groupedReports: Record<string, Report[]> = {};
  reports.forEach((r) => {
    if (!groupedReports[r.category]) groupedReports[r.category] = [];
    groupedReports[r.category].push(r);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            Reports & Exports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and export maintenance planning reports for submission, records, and inter-departmental communication.
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 text-[11px] w-8">S.No.</th>
                <th className="py-2.5 px-4 text-[11px]">Report Name</th>
                <th className="py-2.5 px-4 text-[11px]">Category</th>
                <th className="py-2.5 px-4 text-[11px]">Planning Period</th>
                <th className="py-2.5 px-4 text-[11px]">Last Generated</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Status</th>
                <th className="py-2.5 px-4 text-[11px] text-center" colSpan={4}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, idx) => {
                const isGenerating = generatingId === report.id;
                const isGenerated = generated.has(report.id) || report.status === 'available';
                return (
                  <tr key={report.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 mb-0.5">{report.name}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed max-w-md">{report.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${categoryColor(report.category)}`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{report.period}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{report.lastGenerated}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`flex items-center justify-center gap-1 font-semibold text-[11px] ${
                        isGenerated ? 'text-green-700' : 'text-slate-500'
                      }`}>
                        {isGenerated ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Available
                          </>
                        ) : (
                          'Not Generated'
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {isGenerated && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-[11px] text-slate-700 hover:bg-slate-50 transition whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3 text-blue-700" /> View
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleGenerate(report.id)}
                        disabled={isGenerating}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 rounded text-[11px] text-blue-700 font-semibold hover:bg-blue-50 transition disabled:opacity-50 whitespace-nowrap"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate'}
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleExportPdf(report)}
                        disabled={!isGenerated}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-[11px] text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 whitespace-nowrap"
                      >
                        <Download className="w-3 h-3 text-red-600" /> PDF
                      </button>
                    </td>
                    <td className="py-3 px-2 pr-4">
                      <button
                        onClick={() => handleExportExcel(report)}
                        disabled={!isGenerated}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-[11px] text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 whitespace-nowrap"
                      >
                        <Download className="w-3 h-3 text-green-600" /> Excel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-400">
          Reports are generated from live planning data. PDF and Excel exports require server-side rendering (wired for integration). Planning data is based on synthetic demo dataset.
        </div>
      </div>
    </div>
  );
};
