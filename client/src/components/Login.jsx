import React, { useState } from 'react';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@payslip.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('payslip_auth_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    // Submit
    setTimeout(() => {
      api.login(demoEmail, demoPass).then(data => {
        localStorage.setItem('payslip_auth_token', data.token);
        onLoginSuccess(data.user);
      }).catch(err => setError(err.message));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Payslip Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Corporate Payroll & Employee Payslip System
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition"
                placeholder="admin@payslip.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Access */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <p className="text-[11px] font-semibold text-slate-400 text-center mb-3">
            QUICK ACCESS DEMO ACCOUNTS
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@payslip.com', 'admin123')}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg font-medium transition text-left flex flex-col"
            >
              <span className="font-bold text-white text-[11px]">Administrator</span>
              <span className="text-[10px] text-slate-400 truncate">admin@payslip.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('hr@payslip.com', 'hr123')}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg font-medium transition text-left flex flex-col"
            >
              <span className="font-bold text-white text-[11px]">Payroll Manager</span>
              <span className="text-[10px] text-slate-400 truncate">hr@payslip.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
