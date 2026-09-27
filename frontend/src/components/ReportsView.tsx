import React, { useState } from 'react';
import { FileText, Download, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { ReportViewerModal } from './ReportViewerModal';

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
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);

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

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async (report: Report) => {
    try {
      if (report.id === 'RPT_WEEKLY_BLOCK' || report.id === 'RPT_MONTHLY_BLOCK') {
        const data = await api.getLatestOptimization();
        const headers = ['Block ID', 'Section', 'Date', 'Start Time', 'End Time', 'Duration (min)', 'Block Type', 'Departments', 'Operational Impact'];
        const rows = (data.blocks || []).map(b => [
          b.block_id, b.section_id, b.date, b.start_time, b.end_time, b.duration_minutes, b.block_type, (b.departments || []).join('; '), b.operational_impact
        ]);
        downloadCsv(`${report.id}_Export.csv`, headers, rows);
      } else if (report.id === 'RPT_DEPT_MAINT') {
        const jobs = await api.getMaintenanceJobs();
        const headers = ['Job ID', 'Asset ID', 'Section', 'Department', 'Type', 'Criticality', 'Urgency', 'Due Date', 'Duration (min)', 'Status', 'Priority Score'];
        const rows = jobs.map(j => [
          j.job_id, j.asset_id, j.section_id, j.department, j.maintenance_type, j.criticality, j.urgency, j.due_date, j.duration_minutes, j.status, j.priority_score
        ]);
        downloadCsv(`Department_Maintenance_Report.csv`, headers, rows);
      } else if (report.id === 'RPT_ASSET_AVAIL') {
        const assets = await api.getAssets();
        const headers = ['Asset ID', 'Section', 'Asset Type', 'Condition', 'Criticality', 'Availability', 'Failure Count', 'Next Due Date'];
        const rows = assets.map(a => [
          a.asset_id, a.section_id, a.asset_type, a.condition, a.criticality, `${a.availability}%`, a.failure_count, a.next_due_date
        ]);
        downloadCsv(`Asset_Availability_Report.csv`, headers, rows);
      } else if (report.id === 'RPT_OPT_PERF') {
        const opt = await api.getLatestOptimization();
        const t = opt.telemetry;
        const headers = ['Metric', 'Value'];
        const rows = [
          ['Run ID', t.run_id],
          ['Timestamp', t.timestamp],
          ['Execution Time (ms)', t.execution_time_ms],
          ['Solver Status', t.solver_status],
          ['Total Blocks Created', t.total_blocks_created],
          ['Coordinated Blocks Count', t.coordinated_blocks_count],
          ['Coordination Rate (%)', `${t.coordination_rate_percent}%`],
          ['Total Downtime (min)', t.total_downtime_minutes],
          ['Scheduled Jobs Count', t.scheduled_jobs_count],
          ['Unscheduled Jobs Count', t.unscheduled_jobs_count]
        ];
        downloadCsv(`Optimization_Performance_Report.csv`, headers, rows);
      } else {
        const trains = await api.getTrains();
        const headers = ['Train ID', 'Train Number', 'Train Name', 'Section', 'Arrival', 'Departure', 'Direction', 'Priority'];
        const rows = trains.map(tr => [
          tr.train_id, tr.train_number, tr.train_name, tr.section_id, tr.arrival_time, tr.departure_time, tr.direction, tr.priority
        ]);
        downloadCsv(`Train_Impact_Report.csv`, headers, rows);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate export. Please try again.');
    }
  };

  const handleExportPdf = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.name} - RailOpt</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 20px; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
            .content { font-size: 13px; line-height: 1.6; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; background: #e0f2fe; color: #0369a1; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Indian Railways · RailOpt Official Report</h1>
          <div class="meta">
            <strong>${report.name}</strong> · Category: <span class="badge">${report.category}</span> · Generated: ${new Date().toLocaleString()}<br/>
            Planning Period: ${report.period}
          </div>
          <div class="content">
            <p>${report.description}</p>
            <p>This report has been compiled directly from the RailOpt Optimization Engine and PostgreSQL database.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                          onClick={() => setViewingReportId(report.id)}
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
          Reports are generated from live planning data and PostgreSQL. PDF and CSV exports reflect the active operational plan.
        </div>
      </div>

      {viewingReportId && (
        <ReportViewerModal
          reportId={viewingReportId}
          onClose={() => setViewingReportId(null)}
        />
      )}
    </div>
  );
};
