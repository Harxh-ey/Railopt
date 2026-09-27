import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/auth';
import { Plus, X, RefreshCw, ShieldCheck, ShieldOff, KeyRound, Edit2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const ROLES = ['SUPER_ADMIN', 'ENGINEERING_ADMIN', 'TRACTION_ADMIN', 'SNT_ADMIN', 'OPERATIONS_VIEWER'];
const DEPT_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'ENG', label: 'Engineering' },
  { value: 'TRD', label: 'Traction Distribution' },
  { value: 'SNT', label: 'Signal & Telecommunication' },
];

const roleBadge = (role: string) => {
  if (role === 'SUPER_ADMIN') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (role === 'ENGINEERING_ADMIN') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (role === 'TRACTION_ADMIN') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (role === 'SNT_ADMIN') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

interface AdminUser extends User { is_active?: boolean; }

export const AdminPanel: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '', email: '', password: '', role: 'OPERATIONS_VIEWER', department_id: ''
  });
  const [createError, setCreateError] = useState('');

  // Edit role inline
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');

  // Reset password
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/users`, { headers: authHeaders });
      if (res.ok) setUsers(await res.json());
      else setError('Failed to load users.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ full_name: '', email: '', password: '', role: 'OPERATIONS_VIEWER', department_id: '' });
        fetchUsers();
      } else {
        const d = await res.json();
        setCreateError(d.detail ?? 'Failed to create user.');
      }
    } catch { setCreateError('Network error.'); }
    finally { setCreating(false); }
  };

  const handleUpdateRole = async (userId: string) => {
    await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ role: editingRole }),
    });
    setEditingRoleId(null);
    fetchUsers();
  };

  const handleToggleActive = async (user: AdminUser) => {
    await fetch(`${BASE_URL}/admin/users/${user.id}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    fetchUsers();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setResetting(true);
    try {
      await fetch(`${BASE_URL}/admin/users/${resetUserId}/reset-password`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ new_password: resetPw }),
      });
      setResetUserId(null); setResetPw('');
    } finally { setResetting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">User Administration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage access, roles, and credentials for RailOpt users</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} className="p-1.5 hover:bg-slate-200 rounded text-slate-500" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded hover:bg-blue-800 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Create User
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> Loading users...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600 text-xs">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold text-[11px]">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Full Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{user.full_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{user.email}</td>
                    <td className="px-4 py-2.5">
                      {editingRoleId === user.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white focus:outline-none focus:border-blue-500"
                          >
                            {ROLES.map((r) => <option key={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleUpdateRole(user.id)} className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700">Save</button>
                          <button onClick={() => setEditingRoleId(null)} className="p-1 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge(user.role)}`}>{user.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                      {DEPT_OPTIONS.find(d => d.value === user.department_id)?.label ?? (user.department_id || '—')}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${
                        user.is_active !== false
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingRoleId(user.id); setEditingRole(user.role); }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-700 border border-blue-200 rounded hover:bg-blue-50"
                          title="Edit Role"
                        >
                          <Edit2 className="w-3 h-3" /> Role
                        </button>
                        <button
                          onClick={() => { setResetUserId(user.id); setResetPw(''); }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-700 border border-amber-200 rounded hover:bg-amber-50"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3 h-3" /> Password
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border ${
                            user.is_active !== false
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-green-700 border-green-200 hover:bg-green-50'
                          }`}
                          title={user.is_active !== false ? 'Deactivate' : 'Reactivate'}
                        >
                          {user.is_active !== false ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          {user.is_active !== false ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-xs">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create User Modal ─────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-700" /> Create New User
              </h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            {createError && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded">{createError}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input required value={createForm.full_name} onChange={(e) => setCreateForm(f => ({...f, full_name: e.target.value}))}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
                <input required type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role <span className="text-red-500">*</span></label>
                  <select value={createForm.role} onChange={(e) => setCreateForm(f => ({...f, role: e.target.value}))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500">
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                  <select value={createForm.department_id} onChange={(e) => setCreateForm(f => ({...f, department_id: e.target.value}))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500">
                    {DEPT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Initial Password <span className="text-red-500">*</span></label>
                <input required type="password" value={createForm.password} onChange={(e) => setCreateForm(f => ({...f, password: e.target.value}))}
                  placeholder="Min 8 characters"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2 bg-blue-700 text-white text-xs font-semibold rounded hover:bg-blue-800 transition disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-100">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ─────────────────────────────── */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" /> Reset Password
              </h3>
              <button onClick={() => setResetUserId(null)} className="p-1.5 hover:bg-slate-100 rounded"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password <span className="text-red-500">*</span></label>
                <input required type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={resetting}
                  className="flex-1 py-2 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition disabled:opacity-60">
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setResetUserId(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-100">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
