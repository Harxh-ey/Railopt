import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="bg-railway-blue py-3 w-full border-b border-blue-900">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded border border-white/20 shrink-0">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="2.5" fill="none"/>
              <circle cx="20" cy="20" r="4" fill="white"/>
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
              Indian Railways · Northern Division
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 mt-20 mb-auto">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded shadow-sm p-8 mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-slate-800 font-bold text-lg">Administrator Login</h1>
            <p className="text-slate-500 text-xs mt-1">Authorised Personnel Only</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-railway-blue focus:ring-1 focus:ring-railway-blue"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-railway-blue focus:ring-1 focus:ring-railway-blue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-railway-blue text-white rounded py-2 font-semibold hover:bg-railway-blue-dark transition disabled:opacity-70 mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <footer className="py-6">
        <p className="text-xs text-slate-400 text-center">
          RailOpt v2.0 · SIH26027 · Indian Railways
        </p>
      </footer>
    </div>
  );
};
