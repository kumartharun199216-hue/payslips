import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Printer, 
  Trash2, 
  FileText, 
  Calendar, 
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function PayslipHistory({ employees, onSelectPayslipToView, onDownloadPdf, onPrintPayslip }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Active');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchPayslips();
  }, [searchTerm, selectedEmp, selectedMonth, selectedYear, selectedDept, selectedStatus]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedEmp !== 'All') filters.employee_id = selectedEmp;
      if (selectedMonth !== 'All') filters.pay_month = selectedMonth;
      if (selectedYear !== 'All') filters.pay_year = selectedYear;
      if (selectedDept !== 'All') filters.department = selectedDept;
      if (selectedStatus !== 'All') filters.status = selectedStatus;

      const data = await api.getPayslips(filters);
      setPayslips(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch payslip archive.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async (id, number) => {
    if (!confirm(`Are you sure you want to mark payslip #${number} as void?`)) return;
    try {
      await api.voidPayslip(id);
      fetchPayslips();
    } catch (err) {
      alert(err.message || 'Failed to void payslip.');
    }
  };

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Payslip History & Archive</h2>
            <p className="text-xs text-slate-500">Search, filter, view, print, and export generated corporate employee payslips</p>
          </div>
        </div>

        <button
          onClick={fetchPayslips}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Employee, ID, or Payslip No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Employee Filter */}
          <div>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Years</option>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Dept Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          </div>
        ) : payslips.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-xs text-slate-700">No payslips match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Payslip No</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Salary</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.payslip_number}
                      {p.revision_number > 0 && (
                        <span className="block text-[10px] text-amber-700 font-semibold">Rev {p.revision_number}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.employee_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{p.employee_code} • {p.department}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-900">
                      {p.pay_month} {p.pay_year}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(p.gross_salary)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">{formatCurrency(p.total_deductions)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.net_salary)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.generation_timestamp)}</td>
                    <td className="py-3 px-4">
                      <span className={p.status === 'Active' ? 'badge-active' : 'badge-inactive'}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectPayslipToView(p.id)}
                          title="View Details"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDownloadPdf(p)}
                          title="Download PDF"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPrintPayslip(p.id)}
                          title="Print Document"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {p.status === 'Active' && (
                          <button
                            onClick={() => handleVoid(p.id, p.payslip_number)}
                            title="Void Payslip"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
