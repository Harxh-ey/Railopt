import {
  Station, Section, Asset, Defect, MaintenanceJob, Resource, Train,
  BlockWindow, Block, OptimizationRun, BaselineComparisonMetrics,
  DashboardData, WhatIfResult
} from '../types';

// Production: FastAPI serves frontend → same origin → relative URLs work (BASE_URL = '')
// Dev: Vite proxy forwards /api → localhost:8000 → relative URLs also work
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => fetchJson<DashboardData>('/api/dashboard'),
  
  getStations: () => fetchJson<Station[]>('/api/stations'),
  getSections: () => fetchJson<Section[]>('/api/sections'),
  getAssets: () => fetchJson<Asset[]>('/api/assets'),
  getDefects: () => fetchJson<Defect[]>('/api/defects'),
  getMaintenanceJobs: () => fetchJson<MaintenanceJob[]>('/api/maintenance-jobs'),
  getTrains: () => fetchJson<Train[]>('/api/trains'),
  getBlockWindows: () => fetchJson<BlockWindow[]>('/api/block-windows'),
  getResources: () => fetchJson<Resource[]>('/api/resources'),

  runOptimization: () => fetchJson<{ telemetry: OptimizationRun; blocks: Block[]; unscheduled_job_ids: string[] }>('/api/optimization/run', { method: 'POST' }),
  getLatestOptimization: () => fetchJson<{ telemetry: OptimizationRun; blocks: Block[]; unscheduled_job_ids: string[] }>('/api/optimization/latest'),
  getBaselineComparison: () => fetchJson<{
    baseline_run: OptimizationRun;
    railopt_run: OptimizationRun;
    comparison_metrics: BaselineComparisonMetrics[];
    baseline_blocks_count: number;
    railopt_blocks_count: number;
  }>('/api/optimization/baseline'),

  getBlocks: () => fetchJson<Block[]>('/api/blocks'),
  getBlockDetail: (id: string) => fetchJson<{ block: Block; section: Section; explanation: any }>(`/api/blocks/${id}`),

  simulateReoptimize: (mutations: Array<{ mutation_type: string; target_id: string; parameters?: any }>) =>
    fetchJson<WhatIfResult>('/api/simulation/reoptimize', {
      method: 'POST',
      body: JSON.stringify({ mutations }),
    }),
  resetSimulation: () => fetchJson<{ status: string; active_blocks_count: number }>('/api/simulation/reset', { method: 'POST' }),

  getWeeklyPlan: () => fetchJson<{ planning_horizon: string; days: any[] }>('/api/plans/weekly'),
  getMonthlyPlan: () => fetchJson<{ monthly_summary: any; weeks: any[]; high_risk_assets: Asset[] }>('/api/plans/monthly'),
  getNetworkTopology: () => fetchJson<{ stations: Station[]; sections: Section[] }>('/api/network'),
};
