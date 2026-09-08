import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  Eye, 
  Download, 
  PlusCircle, 
  History, 
  FileText, 
  Sparkles,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function PayslipSuccess({ payslip, onViewPayslip, onDownloadPdf, onGenerateAnother, onGoToHistory }) {
  useEffect(() => {
    // Fire festive celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  if (!payslip) return null;

  const emp = payslip.employee || {};
  const comp = payslip.company || {};
  const logoUrl = comp.logo_path ? `http://localhost:5000${comp.logo_path}` : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Main Success Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Top Gradient Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600"></div>

        {/* Company Logo and Name */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={comp.name || 'Company Logo'}
              className="h-16 max-w-[200px] object-contain rounded-lg border border-slate-100 p-1 shadow-xs"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-900 to-indigo-700 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
              {comp.name ? comp.name.charAt(0) : 'C'}
            </div>
          )}
          <h3 className="font-extrabold text-slate-800 text-base">{comp.name || 'Company Name'}</h3>
        </div>

        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Official Payslip Ready for Download!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Company details, company logo, employee profile, and salary breakdown recorded in the database.
          </p>
        </div>

        {/* Payslip Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-3 font-sans">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Company</span>
              <span className="font-bold text-slate-900 text-xs">{comp.name || 'Company'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Payslip Reference</span>
              <span className="font-mono font-bold text-blue-900 text-sm">{payslip.payslip_number}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 font-medium block">Employee Name</span>
              <span className="font-bold text-slate-900">{emp.name} ({emp.employee_code || '-'})</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Pay Period</span>
              <span className="font-bold text-slate-900">{payslip.pay_month} {payslip.pay_year}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Gross Salary</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(payslip.gross_salary)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Total Deductions</span>
              <span className="font-mono font-bold text-rose-600">{formatCurrency(payslip.total_deductions)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center bg-blue-900 text-white p-3 rounded-lg">
            <span className="font-bold uppercase tracking-wider text-[11px]">Net Salary Payable</span>
            <span className="font-mono font-extrabold text-lg">{formatCurrency(payslip.net_salary)}</span>
          </div>
        </div>

        {/* Required Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onViewPayslip(payslip)}
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>View Payslip</span>
          </button>

          <button
            onClick={() => onDownloadPdf(payslip)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onGenerateAnother}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Another Payslip</span>
          </button>

          <button
            onClick={onGoToHistory}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <History className="w-4 h-4" />
            <span>Go to Payslip History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
