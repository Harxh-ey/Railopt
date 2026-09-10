import React from 'react';
import {
  Calendar, Clock, Cpu, Sparkles, RotateCcw, Play,
  Bell, ChevronRight, ShieldCheck, Database
} from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  onRunDemoSEC01: () => void;
  onReoptimize: () => void;
  onReset: () => void;
  isOptimizing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onRunDemoSEC01,
  onReoptimize,
  onReset,
  isOptimizing = false,
}) => {
  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Network Maintenance Overview', category: 'Executive Dashboard' };
      case 'maintenance':
        return { title: 'Maintenance Job Register', category: 'Operational Inventory' };
      case 'planning':
        return { title: 'Automatic Block Planning & Optimization', category: 'Scheduling Engine' };
      case 'weekly':
        return { title: 'Weekly Maintenance Schedule (Gantt)', category: 'Timetable Coordination' };
      case 'monthly':
        return { title: 'Monthly Strategic Outlook', category: 'Macro Asset Planning' };
      case 'whatif':
        return { title: 'What-If Operational Disruption Simulator', category: 'Scenario Intelligence' };
      case 'analytics':
        return { title: 'Operational Analytics & Asset KPIs', category: 'Performance Intelligence' };
      case 'datasources':
        return { title: 'External Source Systems Ingestion', category: 'Data Harmonization' };
      default:
        return { title: 'Overview', category: 'Operations' };
    }
  };

  const { title, category } = getPageTitle(activeTab);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Breadcrumb & Title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <span>RailOpt</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span>{category}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-teal-400 font-semibold">{title}</span>
        </div>
        <h1 className="text-sm font-bold text-white tracking-tight mt-0.5">{title}</h1>
      </div>

      {/* Right: Operational Status Badges & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Planning Horizon */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-xs">
          <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="text-slate-400">Horizon:</span>
          <span className="font-mono text-slate-200 font-semibold">11–17 Sep 2026</span>
        </div>

        {/* Engine Status */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-xs">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Engine:</span>
          <span className="font-mono text-emerald-300 font-semibold">CP-SAT Ready</span>
        </div>

        {/* Demo Data Pill */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span className="text-slate-400 text-[11px] font-mono">Demo Dataset</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

        {/* Quick Demo Scenario Button */}
        <button
          onClick={onRunDemoSEC01}
          className="flex items-center gap-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-sm"
          title="Jump directly to the 3-department SEC01 coordinated demonstration scenario"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">SEC01 Demo</span>
        </button>

        {/* Re-optimize Action */}
        <button
          onClick={onReoptimize}
          disabled={isOptimizing}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-700 transition disabled:opacity-50"
          title="Re-run CP-SAT optimization on current state"
        >
          <Play className={`w-3.5 h-3.5 fill-teal-400 text-teal-400 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Re-Optimize</span>
        </button>

        {/* Reset Action */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
          title="Reset to default divisional plan"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
