import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Calculator, 
  FileCheck2, 
  History, 
  Settings, 
  LogOut,
  Sparkles,
  FileText,
  Palette
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, company }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'salary-structure', label: 'Salary Structures', icon: Calculator },
    { id: 'generate', label: 'Generate Payslip', icon: FileCheck2, highlight: true },
    { id: 'history', label: 'Payslip History', icon: History },
    { id: 'templates', label: 'Templates', icon: Palette },
    { id: 'settings', label: 'Settings & Logs', icon: Settings },
  ];

  const logoUrl = company?.logo_path ? `http://localhost:5000${company.logo_path}` : null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Company Logo" 
            className="w-10 h-10 object-contain rounded bg-white p-1 border border-slate-700" 
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xl shadow-lg">
            P
          </div>
        )}
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">
            Payslip Generator
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            {company?.name ? company.name.substring(0, 20) + (company.name.length > 20 ? '...' : '') : 'Payroll Management'}
          </p>
        </div>
      </div>

      {/* Quick Generator Callout Card */}
      <div className="px-4 pt-4">
        <button
          onClick={() => setActiveTab('generate')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 group"
        >
          <FileCheck2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>New Payslip</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/90 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-700">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.role || 'Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Log Out"
          className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
