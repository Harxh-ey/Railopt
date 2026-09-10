import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Defect, BlockWindow } from '../types';

export const DataSourcesView: React.FC = () => {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [windows, setWindows] = useState<BlockWindow[]>([]);
  const [activeSource, setActiveSource] = useState<string>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([api.getDefects(), api.getBlockWindows()]).then(([d, w]) => {
      setDefects(d);
      setWindows(w);
      setLoading(false);
    });
  }, []);

  const tmsRecords = defects.filter((d) => d.source_system === 'TMS');
  const smmsRecords = defects.filter((d) => d.source_system === 'SMMS');
  const tdmsRecords = defects.filter((d) => d.source_system === 'TDMS');

  const sources = [
    { id: 'TMS', name: 'Track Management System', abbr: 'TMS', dept: 'Engineering', records: tmsRecords.length, quality: 'Good', lastUpdated: '10 Sep 2026, 22:00', status: 'Connected', note: 'Demo Dataset' },
    { id: 'SMMS', name: 'Signaling Maintenance Mgmt System', abbr: 'SMMS', dept: 'S&T', records: smmsRecords.length, quality: 'Good', lastUpdated: '10 Sep 2026, 21:45', status: 'Connected', note: 'Demo Dataset' },
    { id: 'TDMS', name: 'Traction Distribution Mgmt System', abbr: 'TDMS', dept: 'Traction Distribution', records: tdmsRecords.length, quality: 'Good', lastUpdated: '10 Sep 2026, 22:15', status: 'Connected', note: 'Demo Dataset' },
    { id: 'COA', name: 'Control Office Application', abbr: 'COA', dept: 'Operations', records: windows.length, quality: 'Good', lastUpdated: '10 Sep 2026, 20:30', status: 'Connected', note: 'Demo Dataset' },
    { id: 'TIMETABLE', name: 'Train Timetable (Passenger)', abbr: 'Timetable', dept: 'Operations', records: 100, quality: 'Good', lastUpdated: '08 Sep 2026', status: 'Connected', note: 'Demo Dataset' },
    { id: 'FORECAST', name: 'Goods Train Traffic Forecast', abbr: 'Forecast', dept: 'Operations', records: 60, quality: 'Estimated', lastUpdated: '09 Sep 2026', status: 'Connected', note: 'Demo Dataset' },
  ];

  const activeSources = ['TMS', 'SMMS', 'TDMS', 'COA'];

  const deptBadge = (dept: string) => {
    if (dept === 'Engineering') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (dept === 'Traction Distribution') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (dept === 'S&T') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            Data Sources
            <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
              All Systems Operational
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Departmental source systems connected to RailOpt for maintenance planning. Data is simulated for this planning cycle — not connected to live IR operational systems.
          </p>
        </div>
      </div>

      {/* Data Sources Summary Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Integration Status Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 text-[11px] w-8">S.No.</th>
                <th className="py-2.5 px-4 text-[11px]">Source System</th>
                <th className="py-2.5 px-4 text-[11px]">Full Name</th>
                <th className="py-2.5 px-4 text-[11px]">Department</th>
                <th className="py-2.5 px-4 text-[11px] text-center">Status</th>
                <th className="py-2.5 px-4 text-[11px] text-center">Records</th>
                <th className="py-2.5 px-4 text-[11px]">Last Updated</th>
                <th className="py-2.5 px-4 text-[11px] text-center">Data Quality</th>
                <th className="py-2.5 px-4 text-[11px]">Note</th>
                <th className="py-2.5 px-4 text-[11px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, idx) => (
                <tr
                  key={src.id}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-800">{src.abbr}</td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">{src.name}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${deptBadge(src.dept)}`}>
                      {src.dept}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="flex items-center justify-center gap-1 text-green-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      {src.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">{src.records}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{src.lastUpdated}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      src.quality === 'Good' ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {src.quality}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-slate-500 italic">{src.note}</td>
                  <td className="py-2.5 px-4">
                    {activeSources.includes(src.id) && (
                      <button
                        onClick={() => setActiveSource(src.id)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                          activeSource === src.id
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        Browse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source Data Browser */}
      {activeSource !== 'OVERVIEW' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden animate-fadeIn">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {activeSource} — Source Records
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeSource === 'COA' ? `${windows.length} block window records from Control Office Application`
                  : `${(activeSource === 'TMS' ? tmsRecords : activeSource === 'SMMS' ? smmsRecords : tdmsRecords).length} defect records`}
              </p>
            </div>
            <button
              onClick={() => setActiveSource('OVERVIEW')}
              className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 px-2.5 py-1 rounded bg-white"
            >
              Hide
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            {activeSource === 'COA' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-300">
                  <tr className="text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-[11px]">Window ID</th>
                    <th className="py-2.5 px-3 text-[11px]">Section</th>
                    <th className="py-2.5 px-3 text-[11px]">Date</th>
                    <th className="py-2.5 px-3 text-[11px]">Time Slot</th>
                    <th className="py-2.5 px-3 text-[11px]">Max Duration</th>
                    <th className="py-2.5 px-3 text-[11px]">Type</th>
                    <th className="py-2.5 px-3 text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w, idx) => (
                    <tr key={w.window_id} className={`border-b border-slate-100 hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-3 font-mono font-bold text-blue-800">{w.window_id}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{w.section_id}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{w.date}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{w.start_time} — {w.end_time}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{w.maximum_duration} min</td>
                      <td className="py-2 px-3 text-slate-500">{w.block_type}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          w.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-300">
                  <tr className="text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-[11px]">Defect ID</th>
                    <th className="py-2.5 px-3 text-[11px]">Asset ID</th>
                    <th className="py-2.5 px-3 text-[11px]">Reported At</th>
                    <th className="py-2.5 px-3 text-[11px]">Type</th>
                    <th className="py-2.5 px-3 text-[11px]">Severity</th>
                    <th className="py-2.5 px-3 text-[11px]">Description</th>
                    <th className="py-2.5 px-3 text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeSource === 'TMS' ? tmsRecords : activeSource === 'SMMS' ? smmsRecords : tdmsRecords).map((d, idx) => (
                    <tr key={d.defect_id} className={`border-b border-slate-100 hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-3 font-mono font-bold text-blue-800">{d.defect_id}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{d.asset_id}</td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{d.reported_at}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700">{d.defect_type}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          d.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200'
                          : d.severity === 'MAJOR' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {d.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-sm truncate">{d.description}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
