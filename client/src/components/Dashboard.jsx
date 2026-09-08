import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  PlusCircle, 
  Building2, 
  Download, 
  Eye,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Dashboard({ setActiveTab, onSelectPayslipToView }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs text-center my-6">
        {error}
      </div>
    );
  }

  const cards = [
    { title: 'Total Employees', value: stats?.totalEmployees || 0, icon: Users, color: 'from-blue-600 to-indigo-600', textColor: 'text-blue-600' },
    { title: 'Payslips Generated', value: stats?.totalPayslips || 0, icon: FileText, color: 'from-emerald-600 to-teal-600', textColor: 'text-emerald-600' },
    { title: 'Generated This Month', value: stats?.payslipsThisMonth || 0, icon: Calendar, color: 'from-violet-600 to-purple-600', textColor: 'text-violet-600' },
    { title: 'Current Payroll Month', value: stats?.currentPayrollMonth || '-', icon: TrendingUp, color: 'from-amber-500 to-orange-600', textColor: 'text-amber-600' },
  ];

  const financialCards = [
    { title: 'Total Gross Salary', value: formatCurrency(stats?.totalGrossSalary || 0), icon: DollarSign, bg: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
    { title: 'Total Deductions', value: formatCurrency(stats?.totalDeductions || 0), icon: CreditCard, bg: 'bg-rose-50 text-rose-900 border-rose-200' },
    { title: 'Total Net Salary', value: formatCurrency(stats?.totalNetSalary || 0), icon: CheckCircle2, bg: 'bg-blue-50 text-blue-900 border-blue-200' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Payroll Management Dashboard
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-xl">
              Create, view, manage, and export verified corporate employee payslips.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('generate')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Payslip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs card-hover flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{c.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {financialCards.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className={`border rounded-xl p-4 flex items-center gap-4 ${f.bg}`}>
              <div className="w-10 h-10 rounded-lg bg-white/80 backdrop-blur-xs flex items-center justify-center font-bold shadow-xs">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{f.title}</p>
                <p className="text-xl font-extrabold font-mono tracking-tight">{f.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Payslips Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Generated Payslips</h3>
            <p className="text-xs text-slate-500">Latest payroll records issued to employees</p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recentPayslips?.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No payslips generated yet.</p>
            <button
              onClick={() => setActiveTab('generate')}
              className="mt-3 text-xs bg-blue-900 text-white px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Generate First Payslip</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Salary</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {stats.recentPayslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.employee_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.employee_code}</td>
                    <td className="py-3 px-4 font-medium text-blue-900">{p.pay_month} {p.pay_year}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(p.gross_salary)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">{formatCurrency(p.total_deductions)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.net_salary)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.generation_timestamp)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectPayslipToView(p.id)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px] px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
