import React, { useState, useEffect } from 'react';
import { CalendarRange, ShieldAlert, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Asset } from '../types';

export const MonthlyPlanView: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<{
    monthly_summary: any;
    weeks: any[];
    high_risk_assets: Asset[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getMonthlyPlan()
      .then((res) => { setMonthlyData(res); setLoading(false); })
      .catch((err) => { console.error('Failed to load monthly plan', err); setLoading(false); });
  }, []);

  if (loading || !monthlyData) {
    return (
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-xs">Loading monthly maintenance strategy...</p>
      </div>
    );
  }

  const s = monthlyData.monthly_summary;

  return (
    <div className="space-y-4">
      {/* Monthly Summary Header */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-slate-500" />
              Monthly Strategic Maintenance Plan — 30-Day Horizon
              <span className="text-[11px] font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                Weeks 1–4
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Macro-level asset reliability forecast, planned block budgets, and progressive safety backlog reduction
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="border border-slate-200 rounded px-3 py-2 bg-slate-50 text-center">
              <div className="text-slate-500 text-[10px] mb-0.5">TOTAL JOBS</div>
              <div className="font-bold text-slate-800">{s.total_monthly_jobs}</div>
            </div>
            <div className="border border-slate-200 rounded px-3 py-2 bg-slate-50 text-center">
              <div className="text-slate-500 text-[10px] mb-0.5">TOTAL BLOCKS</div>
              <div className="font-bold text-blue-800">{s.total_monthly_blocks}</div>
            </div>
            <div className="border border-slate-200 rounded px-3 py-2 bg-slate-50 text-center">
              <div className="text-slate-500 text-[10px] mb-0.5">TARGET AVAILABILITY</div>
              <div className="font-bold text-green-700">{s.average_availability_target}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Summary Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">4-Week Maintenance Schedule Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 text-left text-[11px]">Week</th>
                <th className="py-2.5 px-4 text-left text-[11px]">Date Range</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Planned Jobs</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Critical Jobs</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Planned Blocks</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Coordinated</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Coord. Rate</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Est. Availability</th>
                <th className="py-2.5 px-4 text-center text-[11px]">Backlog</th>
                <th className="py-2.5 px-4 text-[11px]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.weeks.map((w, idx) => {
                const isCurrent = idx === 0;
                const coordRate = Math.round((w.coordinated_blocks / w.planned_blocks) * 100);
                const notes = [
                  'Executing optimized schedule with multi-dept bundling.',
                  'Heavy OHE bracket inspections & ultrasonic rail testing.',
                  'Point machine renewals and digital axle counter testing.',
                  'Comprehensive corridor overhaul prior to festival peak.',
                ][idx] || '';
                return (
                  <tr key={w.week} className={`border-b border-slate-100 ${isCurrent ? 'bg-blue-50 border-l-2 border-l-blue-600' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="py-2.5 px-4 font-bold text-slate-800">
                      {w.week}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">CURRENT</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">{w.date_range}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-700">{w.planned_jobs}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-red-700 font-bold">{w.critical_jobs}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-blue-800 font-bold">{w.planned_blocks}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{w.coordinated_blocks}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-green-700">{coordRate}%</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-700">{w.estimated_asset_availability}%</td>
                    <td className="py-2.5 px-4 text-center font-mono text-amber-700 font-bold">{w.maintenance_backlog_jobs}</td>
                    <td className="py-2.5 px-4 text-slate-500 italic text-[11px] max-w-xs">{notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Risk Asset Register */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              High-Risk Asset Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assets with high failure frequency or critical condition requiring priority scheduling
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {monthlyData.high_risk_assets.length} watchlist assets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 text-[11px] w-8">S.No.</th>
                <th className="py-2.5 px-4 text-[11px]">Asset ID</th>
                <th className="py-2.5 px-4 text-[11px]">Type</th>
                <th className="py-2.5 px-4 text-[11px]">Section</th>
                <th className="py-2.5 px-4 text-[11px] text-center">Condition</th>
                <th className="py-2.5 px-4 text-[11px] text-center">Failure Count</th>
                <th className="py-2.5 px-4 text-[11px] text-center">Availability</th>
                <th className="py-2.5 px-4 text-[11px]">Next Due Date</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.high_risk_assets.map((asset, idx) => (
                <tr key={asset.asset_id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-800">{asset.asset_id}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-700">{asset.asset_type}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{asset.section_id}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                      {asset.condition}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-amber-700 font-bold">{asset.failure_count}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-600">{asset.availability}%</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{asset.next_due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
