import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Block } from '../types';

interface WeeklyPlanViewProps {
  onInspectBlock: (blockId: string) => void;
}

const deptBarColor = (dept: string) => {
  if (dept === 'Engineering') return 'bg-blue-500';
  if (dept === 'Traction Distribution') return 'bg-amber-500';
  return 'bg-cyan-500';
};

const deptBadge = (dept: string) => {
  if (dept === 'Engineering') return 'bg-blue-50 text-blue-800 border-blue-200';
  if (dept === 'Traction Distribution') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-cyan-50 text-cyan-800 border-cyan-200';
};

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({ onInspectBlock }) => {
  const [weeklyData, setWeeklyData] = useState<{ planning_horizon: string; days: any[] } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getWeeklyPlan()
      .then((res) => { setWeeklyData(res); setLoading(false); })
      .catch((err) => { console.error('Failed to fetch weekly plan', err); setLoading(false); });
  }, []);

  if (loading || !weeklyData) {
    return (
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-xs">Loading weekly maintenance schedule...</p>
      </div>
    );
  }

  const activeDay = weeklyData.days[selectedDayIndex] || weeklyData.days[0];
  const filteredBlocks: Block[] = (activeDay.blocks || []).filter((b: Block) => {
    if (selectedDept === 'ALL') return true;
    return b.departments.includes(selectedDept);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              Weekly Maintenance Block Schedule
              <span className="text-[11px] font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                Horizon: {weeklyData.planning_horizon}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-by-day maintenance block plan for the division. Click any block to view planning justification.
            </p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Filter by Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering (Track)</option>
              <option value="Traction Distribution">Traction Distribution</option>
              <option value="Signal & Telecommunication">Signal & Telecom</option>
            </select>
          </div>
        </div>

        {/* Day Selector */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.days.map((d: any, idx: number) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-2.5 rounded border text-left transition text-xs ${
                    isSelected
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{d.day.slice(0, 3)}</div>
                  <div className={`font-mono text-[11px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                    {d.date.slice(5)}
                  </div>
                  <div className={`flex gap-1.5 mt-1.5 text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    <span>{d.blocks_count} blks</span>
                  </div>
                  {d.coordinated_blocks_count > 0 && (
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-100' : 'text-green-700'}`}>
                      {d.coordinated_blocks_count} coord.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Schedule */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {activeDay.day}, {activeDay.date}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredBlocks.length} blocks · {Math.round(activeDay.total_downtime_minutes / 60)}h total line possession
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span> Engineering</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span> TRD</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block"></span> S&T</span>
          </div>
        </div>

        {filteredBlocks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredBlocks.map((blk) => {
              const isCoord = blk.block_type === 'MULTI_DEPT_COORDINATED';
              return (
                <div
                  key={blk.block_id}
                  onClick={() => onInspectBlock(blk.block_id)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition group"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {/* Block ID + Section */}
                    <span className="font-mono font-bold text-blue-800 text-sm">{blk.block_id}</span>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                      {blk.section_id}
                    </span>
                    {isCoord && (
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                        Multi-Dept Coordinated
                      </span>
                    )}

                    {/* Time */}
                    <div className="ml-auto flex items-center gap-3 text-xs font-mono">
                      <span className="font-bold text-slate-700">{blk.start_time} — {blk.end_time}</span>
                      <span className="text-slate-500">({blk.duration_minutes} min)</span>
                      {blk.score && (
                        <span className="text-green-700 font-bold">Score: {blk.score}</span>
                      )}
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700" />
                  </div>

                  {/* Department badges */}
                  <div className="flex gap-1.5 mb-2">
                    {blk.departments.map((d, i) => (
                      <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${deptBadge(d)}`}>
                        {d === 'Engineering' ? 'Engineering' : d === 'Traction Distribution' ? 'TRD' : 'S&T'}
                      </span>
                    ))}
                  </div>

                  {/* Gantt bar for this block */}
                  <div className="bg-slate-100 rounded p-2 border border-slate-200">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>{blk.start_time}</span>
                      <span className="text-slate-500">{blk.jobs.length} maintenance tasks</span>
                      <span>{blk.end_time}</span>
                    </div>
                    <div className="space-y-1.5">
                      {blk.jobs.map((j) => {
                        const widthPct = Math.min(100, Math.max(15, (j.duration_minutes / blk.duration_minutes) * 100));
                        const leftPct = Math.min(85, (j.start_offset_minutes / blk.duration_minutes) * 100);
                        return (
                          <div key={j.job_id} className="relative h-5 bg-white rounded overflow-hidden border border-slate-200">
                            <div
                              className={`absolute top-0 bottom-0 ${deptBarColor(j.department)} opacity-85 flex items-center px-1.5`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            >
                              <span className="text-[9px] text-white font-medium truncate">
                                {j.department.slice(0, 3)}: {j.description} ({j.duration_minutes}m)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {blk.coordination_benefit && (
                    <p className="text-[11px] text-slate-500 italic mt-1.5">{blk.coordination_benefit}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No maintenance blocks match the selected department filter on this date.
          </div>
        )}
      </div>
    </div>
  );
};
