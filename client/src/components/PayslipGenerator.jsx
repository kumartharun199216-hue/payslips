import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCheck2, 
  Clock, 
  Eye, 
  CheckCircle, 
  Sparkles,
  Layers,
  Palette,
  X
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency } from '../utils/formatters';
import { numberToWords } from '../utils/numberToWords';
import DuplicatePayslipModal from './payslip/DuplicatePayslipModal';
import PayslipPreviewModal from './payslip/PayslipPreviewModal';
import SalaryReviewCard from './payslip/SalaryReviewCard';
import VisualCanvasDesigner from './templates/VisualCanvasDesigner';

export default function PayslipGenerator({ 
  employees, 
  company, 
  companies = [],
  initialEmployeeId,
  onCompanyUpdated,
  onEmployeeAdded,
  onPayslipGenerated, 
  onNavigateToHistory, 
  onSelectPayslipToView,
  onDownloadPdf
}) {
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeId || '');
  const [selectedEmp, setSelectedEmp] = useState(null);

  const activeCompany = (companies && selectedEmp?.company_id 
    ? companies.find(c => String(c.id) === String(selectedEmp.company_id)) 
    : null) || company || {};

  // Period & Days
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentDate = new Date();
  const currentMonthName = months[currentDate.getMonth()];
  const currentYearNum = currentDate.getFullYear();

  function getDaysInMonth(monthName, year) {
    const idx = months.indexOf(monthName);
    if (idx === -1) return 30;
    return new Date(year, idx + 1, 0).getDate();
  }

  const initialMonthDays = getDaysInMonth(currentMonthName, currentYearNum);

  const [payMonth, setPayMonth] = useState(currentMonthName);
  const [payYear, setPayYear] = useState(currentYearNum);
  const [workingDays, setWorkingDays] = useState(initialMonthDays);
  const [paidDays, setPaidDays] = useState(initialMonthDays);
  const [lopDays, setLopDays] = useState(0);

  // Generation Date & Time
  const [genTimestamp, setGenTimestamp] = useState(new Date().toISOString().substring(0, 16));

  // Salary Components & Unmutable Base Contractual Reference
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const baseSalaryRef = useRef({ earnings: [], deductions: [] });

  // Templates & Visual Layout Designer State
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [canvasDesignerOpen, setCanvasDesignerOpen] = useState(false);

  // States
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    // Load available templates
    api.getTemplates().then((tmpls) => {
      setTemplates(tmpls || []);
      if (tmpls && tmpls.length > 0) {
        const def = tmpls.find(t => t.is_default) || tmpls[0];
        setActiveTemplate(def);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialEmployeeId) {
      handleSelectEmployee(initialEmployeeId);
    } else if (employees.length > 0 && !selectedEmpId) {
      handleSelectEmployee(employees[0].id);
    }
  }, [initialEmployeeId, employees]);

  // AUTOMATIC REACTIVE PRORATION ENGINE: Always fires whenever workingDays or paidDays changes!
  useEffect(() => {
    const bEarns = baseSalaryRef.current.earnings;
    const bDeds = baseSalaryRef.current.deductions;

    // If base salary is not yet loaded into ref, try initializing from current earnings
    if (!bEarns || bEarns.length === 0) {
      if (earnings.length > 0) {
        baseSalaryRef.current = {
          earnings: earnings.map(e => ({ ...e, amount: Number(e.amount) || 0 })),
          deductions: deductions.map(d => ({ ...d, amount: Number(d.amount) || 0 }))
        };
      }
      return;
    }

    const w = Number(workingDays) || 30;
    const p = Math.max(0, Number(paidDays) || 0);
    const ratio = w > 0 ? (p / w) : 1;

    // Prorate all earnings
    const updatedEarnings = bEarns.map((e) => {
      const baseAmt = Number(e.amount) || 0;
      const proratedAmt = (p === w || w <= 0) ? baseAmt : Math.round(baseAmt * ratio);
      return {
        ...e,
        amount: proratedAmt
      };
    });

    // Deductions remain constant even when LOP changes (LOP is deducted from earnings, not deductions)
    const updatedDeductions = bDeds.map((d) => {
      const baseAmt = Number(d.amount) || 0;
      return {
        ...d,
        amount: baseAmt
      };
    });

    setEarnings(updatedEarnings);
    setDeductions(updatedDeductions);
  }, [workingDays, paidDays]);

  const handleSelectEmployee = async (empId) => {
    setSelectedEmpId(empId);
    setError('');
    const emp = employees.find((e) => String(e.id) === String(empId));
    setSelectedEmp(emp || null);

    if (empId) {
      setLoadingSalary(true);
      try {
        const struct = await api.getSalaryStructure(empId);
        let loadedEarnings = [];
        let loadedDeductions = [];

        if (struct.earnings && struct.earnings.length > 0) {
          loadedEarnings = struct.earnings.map(e => ({ ...e, amount: Number(e.amount) || 0 }));
        } else {
          loadedEarnings = [
            { name: 'Basic Salary', amount: 35000, type: 'Fixed', taxable: true, pf_calc: true },
            { name: 'HRA', amount: 14000, type: 'Fixed', taxable: true, pf_calc: false },
            { name: 'Special Allowance', amount: 8000, type: 'Fixed', taxable: true, pf_calc: false }
          ];
        }

        if (struct.deductions && struct.deductions.length > 0) {
          loadedDeductions = struct.deductions.map(d => ({ ...d, amount: Number(d.amount) || 0 }));
        } else {
          loadedDeductions = [
            { name: 'Employee PF', amount: 1800, type: 'Fixed', auto: true },
            { name: 'Professional Tax', amount: 200, type: 'Fixed', auto: true }
          ];
        }

        // Store pristine contractual salary in ref
        baseSalaryRef.current = {
          earnings: loadedEarnings,
          deductions: loadedDeductions
        };

        const daysInM = getDaysInMonth(payMonth, payYear);
        setWorkingDays(daysInM);
        setPaidDays(daysInM);
        setLopDays(0);
        setEarnings(loadedEarnings);
        setDeductions(loadedDeductions);
      } catch (err) {
        setError('Failed to load employee salary components.');
      } finally {
        setLoadingSalary(false);
      }
    }
  };

  // Synchronized Attendance Handlers (Triggers the reactive useEffect automatically)
  const handleWorkingDaysChange = (val) => {
    const w = Math.max(1, Number(val) || 0);
    setWorkingDays(w);
    setPaidDays(Math.max(0, w - lopDays));
  };

  const handlePaidDaysChange = (val) => {
    const p = Math.max(0, Number(val) || 0);
    setPaidDays(p);
    setLopDays(Math.max(0, workingDays - p));
  };

  const handleLopDaysChange = (val) => {
    const l = Math.max(0, Number(val) || 0);
    setLopDays(l);
    setPaidDays(Math.max(0, workingDays - l));
  };

  const handleMonthChange = (newMonth) => {
    setPayMonth(newMonth);
    const daysInM = getDaysInMonth(newMonth, payYear);
    setWorkingDays(daysInM);
    setPaidDays(daysInM);
    setLopDays(0);
  };

  const handleYearChange = (newYear) => {
    const y = Number(newYear) || currentYearNum;
    setPayYear(y);
    const daysInM = getDaysInMonth(payMonth, y);
    setWorkingDays(daysInM);
    setPaidDays(daysInM);
    setLopDays(0);
  };

  const handleResetToFullMonth = () => {
    setPaidDays(workingDays);
    setLopDays(0);
  };

  // Component inline editing
  const handleEarningChange = (idx, field, value) => {
    setEarnings((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
    // Keep base salary in sync if edited manually
    if (baseSalaryRef.current.earnings[idx]) {
      if (field === 'amount') {
        const num = Number(value) || 0;
        const ratio = workingDays > 0 ? (paidDays / workingDays) : 1;
        baseSalaryRef.current.earnings[idx].amount = ratio > 0 ? Math.round(num / ratio) : num;
      } else {
        baseSalaryRef.current.earnings[idx][field] = value;
      }
    }
  };

  const handleDeductionChange = (idx, field, value) => {
    setDeductions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
    if (baseSalaryRef.current.deductions[idx]) {
      if (field === 'amount') {
        const num = Number(value) || 0;
        baseSalaryRef.current.deductions[idx].amount = num;
      } else {
        baseSalaryRef.current.deductions[idx][field] = value;
      }
    }
  };

  const addEarningRow = () => {
    setEarnings((prev) => [...prev, { name: 'Performance Bonus', amount: 0, type: 'Fixed' }]);
  };

  const addDeductionRow = () => {
    setDeductions((prev) => [...prev, { name: 'Other Deduction', amount: 0, type: 'Fixed' }]);
  };

  const removeEarningRow = (idx) => {
    setEarnings((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeDeductionRow = (idx) => {
    setDeductions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Live Totals
  const grossEarnings = earnings.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalDeductions = deductions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netSalary = grossEarnings - totalDeductions;
  const netWords = numberToWords(netSalary);

  // Submit & Check Duplicate logic
  const handleInitiateGenerate = async (isRevisionMode = false) => {
    if (!selectedEmpId || !selectedEmp) {
      setError('Please select an employee.');
      return;
    }
    if (netSalary < 0) {
      setError('Net Salary cannot be negative. Please adjust deductions.');
      return;
    }

    setError('');
    
    // Check duplicate first if not explicitly continuing a revision
    if (!isRevisionMode) {
      try {
        const dupCheck = await api.checkDuplicatePayslip(selectedEmpId, payMonth, payYear);
        if (dupCheck.exists) {
          setDuplicateWarning(dupCheck);
          return; // Stop and show warning modal
        }
      } catch (e) {
        console.error('Duplicate check warning:', e);
      }
    }

    // Proceed to generate
    await executeGeneration(isRevisionMode);
  };

  const executeGeneration = async (isRevision) => {
    setSubmitting(true);
    setDuplicateWarning(null);
    try {
      const payload = {
        employee_id: selectedEmpId,
        pay_month: payMonth,
        pay_year: Number(payYear),
        generation_timestamp: new Date(genTimestamp).toISOString(),
        working_days: Number(workingDays),
        paid_days: Number(paidDays),
        lop_days: Number(lopDays),
        gross_salary: grossEarnings,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        net_salary_words: netWords,
        earnings,
        deductions,
        is_revision: isRevision
      };

      const result = await api.generatePayslip(payload);
      onPayslipGenerated(result.payslip);
    } catch (err) {
      setError(err.message || 'Failed to generate payslip.');
    } finally {
      setSubmitting(false);
    }
  };

  const [parsingOfferLetter, setParsingOfferLetter] = useState(false);
  const [offerLetterNotice, setOfferLetterNotice] = useState('');

  const handleOfferLetterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsingOfferLetter(true);
    setOfferLetterNotice('');
    setError('');
    try {
      const data = await api.uploadAndSaveOfferLetter(file);
      const savedEmp = data.employee;
      const savedCompany = data.company;
      const generatedPayslip = data.payslip;

      if (onCompanyUpdated) {
        await onCompanyUpdated(savedCompany);
      }
      if (onEmployeeAdded) {
        await onEmployeeAdded(savedEmp);
      }

      // If payslip was generated, transition immediately to the Download & View screen!
      if (generatedPayslip && onPayslipGenerated) {
        onPayslipGenerated(generatedPayslip);
      } else {
        setSelectedEmpId(savedEmp.id);
        setSelectedEmp(savedEmp);
        const parsedEarns = (data.earnings || []).map(e => ({ ...e, amount: Number(e.amount) || 0 }));
        const parsedDeds = (data.deductions || []).map(d => ({ ...d, amount: Number(d.amount) || 0 }));
        baseSalaryRef.current = {
          earnings: parsedEarns,
          deductions: parsedDeds
        };
        setEarnings(parsedEarns);
        setDeductions(parsedDeds);
        setOfferLetterNotice(
          `Success! Extracted details for ${savedEmp.name} at ${savedCompany?.name || 'Company'}. Everything saved in database!`
        );
      }
    } catch (err) {
      setError('Offer Letter processing failed: ' + err.message);
    } finally {
      setParsingOfferLetter(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Generate Employee Payslip</h2>
            <p className="text-xs text-slate-500">Select employee or upload Offer Letter to auto-fill employee details & salary components</p>
          </div>
        </div>
      </div>

      {/* Offer Letter Upload & Parsing Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center font-bold text-white shrink-0 text-lg">
            📄
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
              <span>Instant Onboarding & Payslip from Offer Letter</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30">Auto DB Save</span>
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Upload PDF or Text Offer Letter — extracts details, saves employee & salary structure in database, and loads components for immediate payslip generation.
            </p>
          </div>
        </div>

        <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shrink-0 shadow-md">
          <Sparkles className="w-4 h-4" />
          <span>{parsingOfferLetter ? 'Extracting Data...' : 'Upload Offer Letter'}</span>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx,.png,.jpg"
            onChange={handleOfferLetterUpload}
            className="hidden"
            disabled={parsingOfferLetter}
          />
        </label>
      </div>

      {offerLetterNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{offerLetterNotice}</span>
          </div>
          <button onClick={() => setOfferLetterNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 4-Step Form Layout */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-8">
        {/* Step 1: Select Employee */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-extrabold">1</span>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Select Employee</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Search & Choose Employee *</label>
              <select
                value={selectedEmpId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 bg-slate-50 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code}) — {emp.designation} [{emp.department}]
                  </option>
                ))}
              </select>
            </div>

            {selectedEmp && (
              <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Employee Name</span>
                  <span className="font-bold text-slate-900">{selectedEmp.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Employee ID</span>
                  <span className="font-mono font-bold text-blue-900">{selectedEmp.employee_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Company / Organization</span>
                  <span className="font-bold text-indigo-900">{activeCompany.name || 'Acme Solutions'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Designation</span>
                  <span>{selectedEmp.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Department</span>
                  <span>{selectedEmp.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Date of Joining</span>
                  <span>{selectedEmp.date_of_joining}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">PAN / UAN</span>
                  <span className="font-mono">{selectedEmp.pan || '-'} / {selectedEmp.uan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Bank Account</span>
                  <span className="font-mono">{selectedEmp.bank_name} ({selectedEmp.account_number ? selectedEmp.account_number.slice(-4) : '-'})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Pay Period & Attendance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-extrabold">2</span>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Pay Period & Attendance</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pay Month *</label>
              <select
                value={payMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pay Year *</label>
              <select
                value={payYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Working Days</label>
              <input
                type="number"
                min="1"
                max="31"
                value={workingDays}
                onChange={(e) => handleWorkingDaysChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Paid Days</label>
              <input
                type="number"
                min="0"
                max={workingDays}
                value={paidDays}
                onChange={(e) => handlePaidDaysChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-center text-emerald-700 bg-emerald-50/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">LOP Days</label>
              <input
                type="number"
                min="0"
                max={workingDays}
                value={lopDays}
                onChange={(e) => handleLopDaysChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-center text-rose-700 bg-rose-50/50"
              />
            </div>
          </div>

          {/* Proration Alert & Reset */}
          {paidDays !== workingDays && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between text-xs text-blue-900 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Auto-Prorated ({paidDays} of {workingDays} Days):</strong> Salary components have been automatically calculated based on attendance.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToFullMonth}
                className="text-xs font-bold text-blue-700 hover:text-blue-950 underline shrink-0 cursor-pointer"
              >
                Reset to Full Month ({workingDays} Days)
              </button>
            </div>
          )}
        </div>

        {/* Step 3: Payslip Generation Timestamp */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-extrabold">3</span>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Payslip Generation Timestamp</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="w-full sm:w-72">
              <input
                type="datetime-local"
                value={genTimestamp}
                onChange={(e) => setGenTimestamp(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
              />
            </div>
            <button
              type="button"
              onClick={() => setGenTimestamp(new Date().toISOString().substring(0, 16))}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Use Current Date & Time</span>
            </button>
          </div>
        </div>

        {/* Step 4: Salary Component Verification & Inline Adjustment */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-extrabold">4</span>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Salary Components Review</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCanvasDesignerOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition transform active:scale-95"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Customize Layout (Excel Mode)</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Inline edits apply to this payslip</span>
            </div>
          </div>

          <SalaryReviewCard
            loadingSalary={loadingSalary}
            earnings={earnings}
            deductions={deductions}
            grossEarnings={grossEarnings}
            totalDeductions={totalDeductions}
            onEarningChange={handleEarningChange}
            onAddEarning={addEarningRow}
            onRemoveEarning={removeEarningRow}
            onDeductionChange={handleDeductionChange}
            onAddDeduction={addDeductionRow}
            onRemoveDeduction={removeDeductionRow}
          />
        </div>

        {/* Live Net Summary Box */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">CALCULATED NET SALARY</span>
            <p className="text-2xl font-extrabold font-mono text-white mt-0.5">{formatCurrency(netSalary)}</p>
            <p className="text-xs text-blue-100 italic mt-1">{netWords}</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex-1 md:flex-none bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-2 backdrop-blur-xs transition"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Payslip</span>
            </button>

            <button
              type="button"
              onClick={() => handleInitiateGenerate(false)}
              disabled={submitting || !selectedEmpId}
              className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Generating...' : 'Generate Payslip'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate Payslip Warning Modal */}
      <DuplicatePayslipModal
        duplicateWarning={duplicateWarning}
        selectedEmp={selectedEmp}
        payMonth={payMonth}
        payYear={payYear}
        submitting={submitting}
        onViewExisting={(id) => {
          setDuplicateWarning(null);
          onSelectPayslipToView(id);
        }}
        onExecuteRevision={() => executeGeneration(true)}
        onCancel={() => setDuplicateWarning(null)}
      />

      {/* Live Preview Modal */}
      <PayslipPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        company={activeCompany}
        employee={selectedEmp}
        earnings={earnings}
        deductions={deductions}
        templates={templates}
        activeTemplate={activeTemplate}
        payslipData={{
          pay_month: payMonth,
          pay_year: payYear,
          working_days: workingDays,
          paid_days: paidDays,
          lop_days: lopDays,
          gross_salary: grossEarnings,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          net_salary_words: netWords,
          generation_timestamp: genTimestamp
        }}
        onConfirmGenerate={() => handleInitiateGenerate(false)}
      />

      {/* Visual Canvas Designer (Excel Mode) Modal */}
      {canvasDesignerOpen && (
        <VisualCanvasDesigner
          template={activeTemplate || templates.find(t => t.is_default) || templates[0]}
          isOpen={canvasDesignerOpen}
          onClose={() => setCanvasDesignerOpen(false)}
          onSave={async (savedLayout) => {
            const tmplToSave = activeTemplate || templates[0];
            if (tmplToSave) {
              await api.updateTemplate(tmplToSave.id, savedLayout);
            } else {
              await api.createTemplate(savedLayout);
            }
            const reloaded = await api.getTemplates();
            setTemplates(reloaded || []);
            const updated = reloaded?.find(t => t.id === tmplToSave?.id) || reloaded?.[0];
            setActiveTemplate(updated);
          }}
        />
      )}
    </div>
  );
}
