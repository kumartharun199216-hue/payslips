import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Save, CheckCircle, AlertCircle, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { formatCurrency } from '../utils/formatters';

export default function SalaryStructure({ initialEmployeeId, employees, onStructureSaved }) {
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeId || (employees[0]?.id || ''));
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    } else if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [initialEmployeeId, employees]);

  useEffect(() => {
    if (selectedEmpId) {
      fetchSalaryStructure(selectedEmpId);
    }
  }, [selectedEmpId]);

  const fetchSalaryStructure = async (empId) => {
    try {
      setLoading(true);
      const data = await api.getSalaryStructure(empId);
      if (data.earnings && data.earnings.length > 0) {
        setEarnings(data.earnings);
      } else {
        // Default standard earnings template
        setEarnings([
          { name: 'Basic Salary', amount: 35000, type: 'Fixed', taxable: true, pf_calc: true },
          { name: 'HRA', amount: 14000, type: 'Fixed', taxable: true, pf_calc: false },
          { name: 'Conveyance Allowance', amount: 3000, type: 'Fixed', taxable: false, pf_calc: false },
          { name: 'Special Allowance', amount: 10000, type: 'Fixed', taxable: true, pf_calc: false }
        ]);
      }

      if (data.deductions && data.deductions.length > 0) {
        setDeductions(data.deductions);
      } else {
        // Default standard deductions template
        setDeductions([
          { name: 'Employee PF', amount: 1800, type: 'Fixed', auto: true },
          { name: 'Professional Tax', amount: 200, type: 'Fixed', auto: true },
          { name: 'TDS (Income Tax)', amount: 2500, type: 'Fixed', auto: false }
        ]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Earning Component Handlers
  const handleEarningChange = (index, field, value) => {
    setEarnings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addEarning = () => {
    setEarnings((prev) => [
      ...prev,
      { name: 'Other Allowance', amount: 0, type: 'Fixed', taxable: true, pf_calc: false }
    ]);
  };

  const removeEarning = (index) => {
    setEarnings((prev) => prev.filter((_, i) => i !== index));
  };

  // Deduction Component Handlers
  const handleDeductionChange = (index, field, value) => {
    setDeductions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addDeduction = () => {
    setDeductions((prev) => [
      ...prev,
      { name: 'Other Deduction', amount: 0, type: 'Fixed', auto: false }
    ]);
  };

  const removeDeduction = (index) => {
    setDeductions((prev) => prev.filter((_, i) => i !== index));
  };

  // Automatic Statutory Rule Helper
  const autoCalculateStatutory = () => {
    const basicComponent = earnings.find((e) => e.name.toLowerCase().includes('basic'));
    const basicAmount = Number(basicComponent?.amount || 0);

    // Auto PF calculation (12% of Basic up to max ₹1,800)
    const calculatedPF = Math.min(Math.round(basicAmount * 0.12), 1800);

    // Auto PT calculation (Standard Indian slab default: ₹200/month if Basic > 15000)
    const calculatedPT = basicAmount >= 15000 ? 200 : (basicAmount >= 10000 ? 150 : 0);

    setDeductions((prev) =>
      prev.map((d) => {
        if (d.name.toLowerCase().includes('pf')) {
          return { ...d, amount: calculatedPF, auto: true };
        }
        if (d.name.toLowerCase().includes('professional tax') || d.name.toLowerCase().includes('pt')) {
          return { ...d, amount: calculatedPT, auto: true };
        }
        return d;
      })
    );

    setMessage({ type: 'success', text: 'Auto-calculated PF and Professional Tax based on Basic salary.' });
  };

  // Calculation Totals
  const grossEarnings = earnings.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalDeductions = deductions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netSalary = grossEarnings - totalDeductions;

  const handleSave = async () => {
    if (!selectedEmpId) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.updateSalaryStructure(selectedEmpId, { earnings, deductions });
      setMessage({ type: 'success', text: 'Salary structure updated successfully.' });
      if (onStructureSaved) onStructureSaved();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save salary structure.' });
    } finally {
      setSaving(false);
    }
  };

  const currentEmp = employees.find((e) => String(e.id) === String(selectedEmpId));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Salary Structure Management</h2>
            <p className="text-xs text-slate-500">Define employee earnings components, statutory deductions, and tax rules</p>
          </div>
        </div>

        {/* Employee Selector Dropdown */}
        <div className="w-full md:w-72">
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Employee</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employee_code}) — {emp.designation}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {currentEmp && (
        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap justify-between items-center text-xs gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span className="font-extrabold text-sm">{currentEmp.name}</span>
            <span className="text-slate-400 font-mono">({currentEmp.employee_code})</span>
          </div>
          <div className="flex gap-4 text-slate-300">
            <div>Dept: <span className="font-semibold text-white">{currentEmp.department}</span></div>
            <div>Designation: <span className="font-semibold text-white">{currentEmp.designation}</span></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Earnings Components</span>
              </h3>
              <button
                onClick={addEarning}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Earning</span>
              </button>
            </div>

            <div className="space-y-3">
              {earnings.map((earn, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={earn.name}
                      onChange={(e) => handleEarningChange(idx, 'name', e.target.value)}
                      className="flex-1 border rounded p-1.5 font-bold text-slate-900 bg-white"
                      placeholder="Component Name"
                    />
                    <div className="w-32 relative">
                      <span className="absolute left-2 top-2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={earn.amount}
                        onChange={(e) => handleEarningChange(idx, 'amount', Number(e.target.value))}
                        className="w-full border rounded pl-6 pr-2 py-1.5 font-mono font-bold text-slate-900 bg-white text-right"
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={() => removeEarning(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Remove Component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={earn.taxable ?? true}
                        onChange={(e) => handleEarningChange(idx, 'taxable', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Taxable Component</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={earn.pf_calc ?? false}
                        onChange={(e) => handleEarningChange(idx, 'pf_calc', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Includes in PF Calc</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">TOTAL GROSS EARNINGS</span>
              <span className="font-mono text-base text-emerald-700">{formatCurrency(grossEarnings)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Deduction Components</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={autoCalculateStatutory}
                  className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-2 py-1 rounded border border-blue-200"
                  title="Auto-calculate PF and PT based on standard statutory rules"
                >
                  Auto-Calc Rules
                </button>
                <button
                  onClick={addDeduction}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Deduction</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {deductions.map((ded, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ded.name}
                      onChange={(e) => handleDeductionChange(idx, 'name', e.target.value)}
                      className="flex-1 border rounded p-1.5 font-bold text-slate-900 bg-white"
                      placeholder="Component Name"
                    />
                    <div className="w-32 relative">
                      <span className="absolute left-2 top-2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={ded.amount}
                        onChange={(e) => handleDeductionChange(idx, 'amount', Number(e.target.value))}
                        className="w-full border rounded pl-6 pr-2 py-1.5 font-mono font-bold text-slate-900 bg-white text-right"
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={() => removeDeduction(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Remove Component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">TOTAL DEDUCTIONS</span>
              <span className="font-mono text-base text-rose-700">{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs text-blue-200 uppercase font-semibold">ESTIMATED MONTHLY NET SALARY</span>
          <p className="text-2xl font-extrabold font-mono mt-0.5">{formatCurrency(netSalary)}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selectedEmpId}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-8 rounded-xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Salary Structure'}</span>
        </button>
      </div>
    </div>
  );
}
