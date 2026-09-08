import React from 'react';
import { CheckCircle, X, Download, ArrowRight } from 'lucide-react';

export default function ImportedOfferLetterModal({
  data,
  onGeneratePayslip,
  onDownloadPdf,
  onPayslipGenerated,
  onClose
}) {
  if (!data) return null;
  const { employee, company = {}, payslip, summary } = data;
  const logoUrl = company?.logo_path ? `http://localhost:5000${company.logo_path}` : null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-start border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Offer Letter Imported Successfully!</h3>
              <p className="text-xs text-slate-500">Company profile, logo, employee, and payslip generated in database.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Company Card with Logo */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={company.name || 'Company Logo'}
              className="h-12 max-w-[140px] object-contain rounded border border-slate-200 p-0.5 bg-white"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold text-lg shrink-0">
              {company.name ? company.name.charAt(0) : 'C'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Employer / Organization</div>
            <div className="font-extrabold text-slate-900 text-sm truncate">{company.name || 'Company Name'}</div>
            <div className="text-[11px] text-slate-500 truncate">{company.city}, {company.state} • {company.website || 'Official Payroll'}</div>
          </div>
        </div>

        {/* Extracted Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">{employee.name}</h4>
              <p className="font-mono text-blue-900 text-[11px] font-bold">{employee.employee_code} • {employee.designation}</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
              Active in DB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
            <div>Department: <span className="font-semibold text-slate-900">{employee.department}</span></div>
            <div>Date of Joining: <span className="font-semibold text-slate-900">{employee.date_of_joining}</span></div>
            <div>PAN: <span className="font-mono text-slate-900">{employee.pan || '-'}</span></div>
            <div>UAN: <span className="font-mono text-slate-900">{employee.uan || '-'}</span></div>
          </div>

          {/* Extracted Salary Summary */}
          <div className="pt-2 border-t grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Salary</span>
              <span className="font-bold text-slate-900 font-mono text-xs">₹{summary?.gross_earnings?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Deductions</span>
              <span className="font-bold text-rose-600 font-mono text-xs">₹{summary?.total_deductions?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase font-bold">Net Salary</span>
              <span className="font-extrabold text-emerald-800 font-mono text-xs">₹{summary?.net_salary?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
          <button
            onClick={onClose}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold text-xs"
          >
            Close
          </button>

          {payslip && onDownloadPdf && (
            <button
              onClick={() => onDownloadPdf(payslip)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Payslip (PDF)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (payslip && onPayslipGenerated) {
                onPayslipGenerated(payslip);
              } else if (onGeneratePayslip) {
                onGeneratePayslip(employee.id);
              }
              onClose();
            }}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <span>View Full Payslip</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
