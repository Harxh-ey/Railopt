import React from 'react';
import {
  LayoutDashboard, Wrench, Layers, Calendar, CalendarRange,
  Sliders, BarChart3, Database, Cpu, Activity, ShieldAlert,
  ChevronLeft, ChevronRight, Train, CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenRunsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onOpenRunsModal,
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'maintenance', label: 'Maintenance Jobs', icon: Wrench, badge: '80' },
    { id: 'planning', label: 'Block Planning', icon: Layers, badge: 'CP-SAT' },
    { id: 'weekly', label: 'Weekly Schedule', icon: Calendar, badge: '7d' },
    { id: 'monthly', label: 'Monthly Strategic', icon: CalendarRange, badge: '30d' },
    { id: 'whatif', label: 'What-If Simulator', icon: Sliders, badge: 'Sim' },
    { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart3, badge: null },
    { id: 'datasources', label: 'Data Sources', icon: Database, badge: 'TMS' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Section: Brand & Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-sm">
              <Train className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white tracking-tight font-sans">RailOpt</span>
                  <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Plan Smarter. Keep India Moving.
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center p-2 border-b border-slate-800">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="px-3 py-4 space-y-1">
          <div className={`px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
            {!collapsed ? 'Planning & Operations' : '•••'}
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-teal-500/25 text-teal-200'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Administration Section */}
        <div className="px-3 py-2 border-t border-slate-800/80 space-y-1">
          <div className={`px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
            {!collapsed ? 'System Controls' : '•••'}
          </div>

          <button
            onClick={onOpenRunsModal}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition group"
            title={collapsed ? 'Optimization Telemetry' : undefined}
          >
            <Cpu className="w-4 h-4 text-slate-400 group-hover:text-teal-400 shrink-0" />
            {!collapsed && <span className="truncate">Optimization Runs</span>}
          </button>

          <div
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400"
            title={collapsed ? 'System Status: Active' : undefined}
          >
            <Activity className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">System Status</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">ONLINE</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Profile & Safety Banner */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-3">
        {/* Prototype Disclaimer */}
        {!collapsed ? (
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-tight">
              <strong>Decision Support Prototype:</strong> Not for direct railway operational control.
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="Prototype / Decision Support - Not for direct railway operational control">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
        )}

        {/* User / Officer Profile */}
        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-300 shrink-0">
            CP
          </div>
          {!collapsed && (
            <div className="truncate text-left">
              <div className="text-xs font-bold text-white truncate">Planning Control</div>
              <div className="text-[10px] text-slate-400 truncate">Northern Division (IR)</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
