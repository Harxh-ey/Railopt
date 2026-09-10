import React, { useState, useEffect } from 'react';
import { GovHeader } from './components/GovHeader';
import { DashboardView } from './components/DashboardView';
import { MaintenanceView } from './components/MaintenanceView';
import { BlockPlanningView } from './components/BlockPlanningView';
import { WeeklyPlanView } from './components/WeeklyPlanView';
import { MonthlyPlanView } from './components/MonthlyPlanView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AnalyticsView } from './components/AnalyticsView';
import { DataSourcesView } from './components/DataSourcesView';
import { ReportsView } from './components/ReportsView';
import { WhyThisBlockModal } from './components/WhyThisBlockModal';
import { OptimizationRunsModal } from './components/OptimizationRunsModal';
import { JobDetailModal } from './components/JobDetailModal';
import { api } from './services/api';
import { DashboardData, OptimizationRun, MaintenanceJob } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [telemetry, setTelemetry] = useState<OptimizationRun | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Modals state
  const [inspectBlockId, setInspectBlockId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [runsModalOpen, setRunsModalOpen] = useState<boolean>(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchDashboard = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(),
      api.getLatestOptimization()
    ])
      .then(([dash, opt]) => {
        setDashboardData(dash);
        setTelemetry(opt.telemetry);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRunDemoSEC01 = () => {
    setActiveTab('planning');
    setInspectBlockId('BLK_01');
    showToast('Loaded coordinated maintenance scenario for SEC01');
  };

  const handleReoptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.runOptimization();
      setTelemetry(res.telemetry);
      fetchDashboard();
      showToast(`Block plan generated successfully. Solver completed in ${res.telemetry.execution_time_ms} ms.`);
    } catch (e) {
      console.error('Optimization failed', e);
      showToast('Plan generation failed. Please check planning constraints.', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      fetchDashboard();
      setInspectBlockId(null);
      showToast('Planning state reset to active baseline.');
    } catch (e) {
      console.error('Reset failed', e);
    }
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Railway Maintenance Planning Dashboard';
      case 'maintenance': return 'Maintenance Job Register';
      case 'planning': return 'Automatic Block Planning';
      case 'weekly': return 'Weekly Maintenance Schedule';
      case 'monthly': return 'Monthly Strategic Plan';
      case 'whatif': return 'What-If Analysis';
      case 'analytics': return 'Planning Analytics & Performance';
      case 'reports': return 'Reports & Exports';
      case 'datasources': return 'Data Sources';
      default: return 'RailOpt';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Government Portal Header & Navigation */}
      <GovHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunDemoSEC01={handleRunDemoSEC01}
        onReoptimize={handleReoptimize}
        onReset={handleReset}
        isOptimizing={isOptimizing}
        onOpenRunsModal={() => setRunsModalOpen(true)}
      />

      {/* Page content area */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-5">
        {/* Page title bar */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-railway-blue">{getPageTitle(activeTab)}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Northern Division · Planning Date: 14 September 2026 · Planning Horizon: Weekly
            </p>
          </div>
          {activeTab === 'planning' && (
            <button
              onClick={handleReoptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 bg-railway-blue hover:bg-railway-blue-dark text-white text-xs font-semibold px-4 py-2 rounded border border-blue-900 transition disabled:opacity-50"
            >
              {isOptimizing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              <span>{isOptimizing ? 'Generating Plan...' : 'Generate Plan'}</span>
            </button>
          )}
        </div>

        {/* View Routing */}
        {activeTab === 'dashboard' && (
          <DashboardView
            data={dashboardData}
            loading={loading}
            onInspectBlock={(id) => setInspectBlockId(id)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onInspectJob={(job) => setSelectedJob(job)}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            onInspectBlock={(id) => setInspectBlockId(id)}
          />
        )}

        {activeTab === 'planning' && (
          <BlockPlanningView
            onInspectBlock={(id) => setInspectBlockId(id)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyPlanView
            onInspectBlock={(id) => setInspectBlockId(id)}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyPlanView />
        )}

        {activeTab === 'whatif' && (
          <WhatIfSimulator
            onInspectBlock={(id) => setInspectBlockId(id)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}

        {activeTab === 'reports' && (
          <ReportsView />
        )}

        {activeTab === 'datasources' && (
          <DataSourcesView />
        )}
      </main>

      {/* Government Portal Footer */}
      <footer className="border-t border-slate-300 bg-white text-slate-500 text-xs px-6 py-3 mt-8">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div>
            <span className="font-semibold text-railway-blue">RailOpt — Automatic Block Planning System</span>
            <span className="text-slate-400 ml-2">·</span>
            <span className="ml-2">Indian Railways · Northern Division</span>
            <span className="text-slate-400 ml-2">·</span>
            <span className="ml-2">Problem Statement SIH26027</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono text-slate-400">Solver: OR-Tools CP-SAT 9.15</span>
            <span className="font-mono text-slate-400">API: FastAPI 3.12</span>
            <span className="flex items-center gap-1 text-green-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              System Operational
            </span>
          </div>
        </div>
      </footer>

      {/* Block Planning Justification Modal */}
      <WhyThisBlockModal
        blockId={inspectBlockId}
        onClose={() => setInspectBlockId(null)}
      />

      {/* Optimization Telemetry Modal */}
      <OptimizationRunsModal
        isOpen={runsModalOpen}
        onClose={() => setRunsModalOpen(false)}
        telemetry={telemetry}
      />

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onViewBlock={(id) => {
          setSelectedJob(null);
          setInspectBlockId(id);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 border px-4 py-3 rounded shadow-lg flex items-center gap-2.5 text-xs font-medium animate-fadeIn ${
          toastType === 'success'
            ? 'bg-white border-green-300 text-green-800'
            : 'bg-white border-red-300 text-red-800'
        }`}>
          {toastType === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          }
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
