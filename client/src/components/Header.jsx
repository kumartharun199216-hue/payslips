import React from 'react';
import { Calendar, User, PlusCircle, Shield, Bell } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, user, company }) {
  const titles = {
    dashboard: 'Dashboard Overview',
    company: 'Company Profile & Branding',
    employees: 'Employee Directory & Profiles',
    'salary-structure': 'Salary Structure Manager',
    generate: 'Generate Employee Payslip',
    history: 'Payslip History & Archive',
    settings: 'System Settings & Audit Log'
  };

  const currentDate = new Date();
  const currentMonthYear = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
          {titles[activeTab] || 'Payslip Generator'}
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block">
          {company?.name ? `${company.name} • Payroll Portal` : 'Corporate Payroll & Document System'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Payroll Month Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Current Payroll: {currentMonthYear}</span>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span>{user?.role || 'Admin'}</span>
        </div>

        {/* Quick New Payslip Button */}
        {activeTab !== 'generate' && (
          <button
            onClick={() => setActiveTab('generate')}
            className="bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate Payslip</span>
          </button>
        )}
      </div>
    </header>
  );
}
