import React, { useState, useEffect } from 'react';
import {
  Wrench, Search, ArrowUpDown, ChevronRight, RefreshCw, Plus, X
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceJob } from '../types';
import { JobDetailModal } from './JobDetailModal';
import { useAuth } from '../contexts/AuthContext';

interface MaintenanceViewProps {
  onInspectBlock?: (blockId: string) => void;
}

const deptBadge = (dept: string) => {
  if (dept === 'Engineering') return 'bg-blue-50 text-blue-800 border-blue-200';
  if (dept === 'Traction Distribution') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-cyan-50 text-cyan-800 border-cyan-200';
};

const DEPARTMENTS = ['Engineering', 'Traction Distribution', 'Signal & Telecommunication'];
const TYPES = ['Preventive', 'Corrective', 'Emergency'];
const BLOCK_REQS = ['TRAFFIC_BLOCK', 'POWER_BLOCK', 'BOTH'];
const RESOURCES: Record<string, string[]> = {
  Engineering: ['P-Way Gang', 'Track Machine', 'Bridge Inspection Team', 'Rail Grinding Team'],
  'Traction Distribution': ['Cantilever & Insulator Replacement', 'OHE Maintenance Crew', 'Power Block Team', 'HV Inspection Unit'],
  'Signal & Telecommunication': ['Signal Maintenance Team', 'Telecom Crew', 'Cable Jointing Team', 'S&T Inspection Unit'],
};

interface NewJobForm {
  section_id: string;
  asset_id: string;
  department: string;
  maintenance_type: string;
  description: string;
  duration_minutes: number;
  criticality: number;
  urgency: number;
  asset_impact: number;
  due_date: string;
  required_resource: string;
  block_requirement: string;
  isolation_required: boolean;
  compatible_departments: string[];
}

const EMPTY_FORM: NewJobForm = {
  section_id: '',
  asset_id: '',
  department: 'Engineering',
  maintenance_type: 'Preventive',
  description: '',
  duration_minutes: 60,
  criticality: 5,
  urgency: 5,
  asset_impact: 5,
  due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  required_resource: '',
  block_requirement: 'TRAFFIC_BLOCK',
  isolation_required: false,
  compatible_departments: [],
};

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onInspectBlock }) => {
  const { user, isReadOnly } = useAuth();
  const readOnly = isReadOnly();
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('priority_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Register modal state
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState<NewJobForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    api.getMaintenanceJobs()
      .then((data) => { setJobs(data); setLoading(false); })
      .catch((err) => { console.error('Failed to load maintenance jobs', err); setLoading(false); });
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (departmentFilter !== 'ALL' && j.department !== departmentFilter) return false;
    if (typeFilter !== 'ALL' && j.maintenance_type !== typeFilter) return false;
    if (overdueOnly && j.overdue_days <= 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !j.job_id.toLowerCase().includes(q) &&
        !j.description.toLowerCase().includes(q) &&
        !j.section_id.toLowerCase().includes(q) &&
        !j.asset_id.toLowerCase().includes(q) &&
        !j.required_resource.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let valA = (a as any)[sortBy];
    let valB = (b as any)[sortBy];
    if (typeof valA === 'string') return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const totalPages = Math.ceil(sortedJobs.length / PAGE_SIZE);
  const pagedJobs = sortedJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setCurrentPage(1);
  };

  const setField = <K extends keyof NewJobForm>(key: K, value: NewJobForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const created = await api.createMaintenanceJob(form as any);
      setJobs((prev) => [...prev, created]);
      setSubmitSuccess(`Job ${created.job_id} registered — Priority Score: ${created.priority_score}`);
      setForm(EMPTY_FORM);
      setTimeout(() => { setShowRegister(false); setSubmitSuccess(''); }, 2500);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to register job. Check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const SliderField = ({
    label, field, min = 1, max = 10,
  }: { label: string; field: 'criticality' | 'urgency' | 'asset_impact'; min?: number; max?: number }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[11px] font-semibold text-slate-600">{label}</label>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
          form[field] >= 8 ? 'bg-red-100 text-red-700' : form[field] >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        }`}>{form[field]}/10</span>
      </div>
      <input
        type="range" min={min} max={max} value={form[field]}
        onChange={(e) => setField(field, Number(e.target.value))}
        className="w-full accent-blue-700"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              Maintenance Job Register
              <span className="text-[11px] font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                {jobs.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated work requests from Track Management (TMS), Signaling (SMMS), and Traction Distribution (TDMS)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Showing <strong className="text-slate-700">{sortedJobs.length}</strong> of {jobs.length} records
            </span>
            {!readOnly && (
              <button
                onClick={() => { setShowRegister(true); setSubmitError(''); setSubmitSuccess(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded hover:bg-blue-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Register New Job
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Job ID, section, asset, description..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Traction Distribution">Traction Distribution</option>
              <option value="Signal & Telecommunication">Signal & Telecom</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Maintenance Type</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="Corrective">Corrective</option>
              <option value="Preventive">Preventive</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Filter</label>
            <label className="flex items-center gap-2 cursor-pointer border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs select-none">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => { setOverdueOnly(e.target.checked); setCurrentPage(1); }}
                className="rounded border-slate-400 text-blue-700 focus:ring-blue-500"
              />
              <span className={overdueOnly ? 'text-red-700 font-semibold' : 'text-slate-600'}>Overdue Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Loading maintenance register...
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No records match the current filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-center w-10 text-[11px]">S.No.</th>
                    <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 text-[11px]" onClick={() => handleSort('job_id')}>
                      <span className="flex items-center gap-1">Job ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                    </th>
                    <th className="py-2.5 px-3 text-[11px]">Asset ID</th>
                    <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 text-[11px]" onClick={() => handleSort('section_id')}>
                      <span className="flex items-center gap-1">Section <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                    </th>
                    <th className="py-2.5 px-3 text-[11px]">Department</th>
                    <th className="py-2.5 px-3 text-[11px]">Type</th>
                    <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200 text-[11px]" onClick={() => handleSort('criticality')}>
                      <span className="flex items-center justify-center gap-1">Criticality <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                    </th>
                    <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200 text-[11px]" onClick={() => handleSort('urgency')}>
                      <span className="flex items-center justify-center gap-1">Urgency <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 text-[11px]" onClick={() => handleSort('due_date')}>
                      <span className="flex items-center gap-1">Due Date <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                    </th>
                    <th className="py-2.5 px-3 text-center text-[11px]">Duration</th>
                    <th className="py-2.5 px-3 text-[11px]">Required Resource</th>
                    <th className="py-2.5 px-3 text-[11px]">Status</th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 text-[11px] text-blue-700" onClick={() => handleSort('priority_score')}>
                      <span className="flex items-center justify-end gap-1">Priority Score <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="py-2.5 px-2 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedJobs.map((job, idx) => {
                    const isHighCrit = job.criticality >= 8;
                    const isOverdue = job.overdue_days > 0;
                    const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr
                        key={job.job_id}
                        onClick={() => setSelectedJob(job)}
                        className={`border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{rowNum}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-800">{job.job_id}</td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{job.asset_id}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{job.section_id}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${deptBadge(job.department)}`}>
                            {job.department === 'Engineering' ? 'Engineering'
                              : job.department === 'Traction Distribution' ? 'TRD'
                              : 'S&T'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{job.maintenance_type}</td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={`font-bold ${isHighCrit ? 'text-red-700' : 'text-slate-600'}`}>
                            {job.criticality}/10
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">{job.urgency}/10</td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          <span className={isOverdue ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                            {job.due_date}
                          </span>
                          {isOverdue && (
                            <span className="ml-1 text-[10px] bg-red-50 text-red-600 border border-red-200 px-1 rounded">
                              +{job.overdue_days}d
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">{job.duration_minutes}m</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] max-w-[130px] truncate">{job.required_resource}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            job.status === 'SCHEDULED' ? 'bg-green-50 text-green-700 border-green-200'
                            : job.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-green-700">{job.priority_score}</td>
                        <td className="py-2 px-2">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedJobs.length)} of {sortedJobs.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 text-[11px]">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 border rounded text-[11px] ${
                        currentPage === page ? 'bg-blue-700 text-white border-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                    className="px-2.5 py-1 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 text-[11px]">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Register New Job Modal ─────────────────────────────────── */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={() => setShowRegister(false)} />

          {/* Slide-in panel */}
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-700" />
                  Register New Maintenance Job
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Job ID and Priority Score are auto-generated</p>
              </div>
              <button onClick={() => setShowRegister(false)} className="p-1.5 hover:bg-slate-200 rounded">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 px-5 py-5 space-y-5">

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded font-semibold">{submitSuccess}</div>
              )}

              {/* Section & Asset */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section ID <span className="text-red-500">*</span></label>
                  <input
                    required value={form.section_id}
                    onChange={(e) => setField('section_id', e.target.value.toUpperCase())}
                    placeholder="e.g. SEC01"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Asset ID <span className="text-red-500">*</span></label>
                  <input
                    required value={form.asset_id}
                    onChange={(e) => setField('asset_id', e.target.value.toUpperCase())}
                    placeholder="e.g. AST_SEC01_21"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Department & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department <span className="text-red-500">*</span></label>
                  <select
                    value={form.department}
                    onChange={(e) => { setField('department', e.target.value); setField('required_resource', ''); }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Maintenance Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.maintenance_type}
                    onChange={(e) => setField('maintenance_type', e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  required rows={2} value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe the maintenance work to be performed..."
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Duration & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (minutes) <span className="text-red-500">*</span></label>
                  <input
                    required type="number" min={10} max={480} value={form.duration_minutes}
                    onChange={(e) => setField('duration_minutes', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input
                    required type="date" value={form.due_date}
                    onChange={(e) => setField('due_date', e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Priority sliders */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-3">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Priority Factors</p>
                <SliderField label="Asset Criticality" field="criticality" />
                <SliderField label="Urgency" field="urgency" />
                <SliderField label="Asset Impact" field="asset_impact" />
              </div>

              {/* Required Resource */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Required Resource <span className="text-red-500">*</span></label>
                <select
                  required value={form.required_resource}
                  onChange={(e) => setField('required_resource', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">— Select Resource —</option>
                  {(RESOURCES[form.department] ?? []).map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              {/* Block Requirement & Isolation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Block Requirement</label>
                  <select
                    value={form.block_requirement}
                    onChange={(e) => setField('block_requirement', e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    {BLOCK_REQS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer border border-slate-300 rounded px-3 py-2 bg-white text-xs select-none">
                    <input
                      type="checkbox" checked={form.isolation_required}
                      onChange={(e) => setField('isolation_required', e.target.checked)}
                      className="rounded border-slate-400 text-blue-700"
                    />
                    <span className="text-slate-700 font-medium">Isolation Required</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition disabled:opacity-60"
                >
                  {submitting ? 'Registering...' : 'Register Job'}
                </button>
                <button
                  type="button" onClick={() => setShowRegister(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onViewBlock={onInspectBlock}
        onJobUpdated={(updated) => {
          setJobs((prev) => prev.map((j) => (j.job_id === updated.job_id ? updated : j)));
          setSelectedJob(updated);
        }}
      />
    </div>
  );
};
