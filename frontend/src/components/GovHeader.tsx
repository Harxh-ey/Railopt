import React, { useState } from 'react';
import {
  Bell, Settings, ChevronDown, User, RefreshCw, Play,
  LayoutDashboard, Wrench, Layers, Calendar, CalendarRange,
  Sliders, BarChart3, Database, FileText, RotateCcw
} from 'lucide-react';

interface GovHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunDemoSEC01: () => void;
  onReoptimize: () => void;
  onReset: () => void;
  isOptimizing: boolean;
  onOpenRunsModal: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'planning', label: 'Block Planning', icon: Layers },
  { id: 'weekly', label: 'Weekly Plan', icon: Calendar },
  { id: 'monthly', label: 'Monthly Plan', icon: CalendarRange },
  { id: 'whatif', label: 'What-If Analysis', icon: Sliders },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'datasources', label: 'Data Sources', icon: Database },
];

export const GovHeader: React.FC<GovHeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunDemoSEC01,
  onReoptimize,
  onReset,
  isOptimizing,
  onOpenRunsModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* === TOP BANNER: Indian Railway Portal Style === */}
      <div className="bg-railway-blue border-b border-blue-900">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Emblem + Brand */}
          <div className="flex items-center gap-3">
            {/* Railway Track Emblem — SVG Mark */}
            <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded border border-white/20 shrink-0">
              <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                {/* Stylized railway wheel / track mark */}
                <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="2.5" fill="none"/>
                <circle cx="20" cy="20" r="4" fill="white"/>
                {/* Spokes */}
                <line x1="20" y1="8" x2="20" y2="32" stroke="white" strokeWidth="1.5"/>
                <line x1="8" y1="20" x2="32" y2="20" stroke="white" strokeWidth="1.5"/>
                <line x1="11.5" y1="11.5" x2="28.5" y2="28.5" stroke="white" strokeWidth="1.5"/>
                <line x1="28.5" y1="11.5" x2="11.5" y2="28.5" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-lg tracking-tight leading-none">RailOpt</span>
                <span className="text-blue-200 text-xs font-normal">— Automatic Block Planning System</span>
              </div>
              <div className="text-blue-200 text-[11px] mt-0.5">
                Indian Railways · Northern Division · Maintenance Planning Directorate
              </div>
            </div>
          </div>

          {/* Right: Date / User / Actions */}
          <div className="flex items-center gap-4">
            {/* Planning date context */}
            <div className="hidden md:block text-right">
              <div className="text-blue-100 text-[11px] font-medium">Planning Date</div>
              <div className="text-white text-xs font-bold">14 September 2026</div>
            </div>

            <div className="hidden lg:block h-8 w-px bg-white/20"></div>

            {/* Quick Re-optimize action */}
            <button
              onClick={onReoptimize}
              disabled={isOptimizing}
              className="hidden md:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded transition disabled:opacity-50"
              title="Re-run block plan optimization"
            >
              {isOptimizing
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Play className="w-3.5 h-3.5 fill-white" />
              }
              <span className="hidden lg:inline">{isOptimizing ? 'Optimizing...' : 'Run Optimizer'}</span>
            </button>

            {/* Notifications bell */}
            <button className="relative p-1.5 text-blue-200 hover:text-white transition">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-blue-700"></span>
            </button>

            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-blue-100 hover:text-white transition text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  AK
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-white text-[11px] font-semibold leading-none">A. K. Sharma</div>
                  <div className="text-blue-200 text-[10px] leading-none mt-0.5">Sr. Divisional Planning Officer</div>
                </div>
                <ChevronDown className="w-3 h-3 hidden lg:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-9 w-48 bg-white border border-slate-200 rounded shadow-lg text-xs z-50">
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <div className="font-semibold text-slate-700">A. K. Sharma</div>
                    <div className="text-slate-500 text-[11px]">Sr. Divisional Planning Officer</div>
                    <div className="text-slate-400 text-[11px]">Northern Division, IR</div>
                  </div>
                  <button
                    onClick={() => { onOpenRunsModal(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-50"
                  >
                    Optimization History
                  </button>
                  <button
                    onClick={() => { onReset(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Planning State
                  </button>
                  <button
                    onClick={() => { onRunDemoSEC01(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-50"
                  >
                    Load SEC01 Demo Scenario
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === NAVIGATION BAR: Government Portal Tab Style === */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <nav className="flex items-center overflow-x-auto gap-0" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-railway-blue text-railway-blue bg-blue-50/60 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-railway-blue hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-railway-blue' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
