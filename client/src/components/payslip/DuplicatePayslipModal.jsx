import React from 'react';
import { AlertTriangle, Eye, FileCheck2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function DuplicatePayslipModal({
  duplicateWarning,
  selectedEmp,
  payMonth,
  payYear,
  submitting,
  onViewExisting,
  onExecuteRevision,
  onCancel
}) {
  if (!duplicateWarning) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Duplicate Payslip Alert</h3>
            <p className="text-xs text-slate-600 mt-1">
              A payslip already exists for <span className="font-bold">{selectedEmp?.name}</span> for <span className="font-bold">{payMonth} {payYear}</span>.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-700">
          <div>Existing Payslip No: <span className="font-bold">{duplicateWarning.payslip.payslip_number}</span></div>
          <div>Net Salary: <span className="font-bold">{formatCurrency(duplicateWarning.payslip.net_salary)}</span></div>
          <div>Current Revision: <span className="font-bold">Revision {duplicateWarning.payslip.revision_number}</span></div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => onViewExisting(duplicateWarning.payslip.id)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Existing Payslip</span>
          </button>

          <button
            onClick={onExecuteRevision}
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Generate Replacement / Revision {duplicateWarning.payslip.revision_number + 1}</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full text-slate-500 hover:text-slate-700 py-1.5 text-xs font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
