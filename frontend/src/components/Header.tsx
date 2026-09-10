import React from 'react';
import { ShieldAlert, Cpu, Activity, RotateCcw, Train, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunDemoSEC01: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunDemoSEC01,
  onReset,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Executive Dashboard' },
    { id: 'optimizer', label: 'Block Optimizer & Benchmark' },
    { id: 'network', label: 'Railway Network View' },
    { id: 'weekly', label: 'Weekly Gantt Schedule' },
    { id: 'monthly', label: 'Monthly Strategic Plan' },
    { id: 'whatif', label: 'What-If Simulator' },
    { id: 'datasources', label: 'Data Sources (TMS/SMMS/TDMS/COA)' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      {/* Safety Disclaimer Banner */}
      <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>PROTOTYPE / DECISION SUPPORT SYSTEM:</strong> Not for direct railway operational control, train movement authorization, or safety-critical interlocking.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-amber-300/80">
          <span>Problem Statement: <strong>SIH26027</strong></span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-300 font-mono text-[11px]">SOLVER: CP-SAT ACTIVE</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-black text-xl">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">RailOpt</h1>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded text-xs font-semibold">
                IR-DecisionSupport v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI-Powered Cross-Departmental Block Planning for Indian Railways
            </p>
          </div>
        </div>

        {/* Demo Fast-Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRunDemoSEC01}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-md transition"
            title="Jump directly to the 3-department SEC01 coordination showcase"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SEC01 Multi-Dept Demo</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 transition"
            title="Reset active simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto border-t border-slate-800/80">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
                isActive
                  ? 'border-teal-400 text-teal-300 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
