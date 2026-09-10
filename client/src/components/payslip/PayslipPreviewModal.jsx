import React, { useState, useEffect } from 'react';
import { X, Palette, Download, Printer } from 'lucide-react';
import PayslipTemplate from '../PayslipTemplate';
import { generatePayslipPdf } from '../../utils/pdfGenerator';

export default function PayslipPreviewModal({
  isOpen,
  onClose,
  company,
  employee,
  earnings,
  deductions,
  payslipData,
  templates = [],
  activeTemplate = null,
  onConfirmGenerate
}) {
  if (!isOpen) return null;

  const [selectedTemplate, setSelectedTemplate] = useState(
    activeTemplate || templates.find(t => t.is_default) || templates[0] || null
  );
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (activeTemplate) {
      setSelectedTemplate(activeTemplate);
    } else if (templates && templates.length > 0) {
      setSelectedTemplate(templates.find(t => t.is_default) || templates[0]);
    }
  }, [activeTemplate, templates, isOpen]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const elem = document.getElementById('printable-payslip');
      if (elem) {
        const empName = (employee?.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
        const month = payslipData?.pay_month || 'Month';
        const year = payslipData?.pay_year || 'Year';
        await generatePayslipPdf(elem, `Payslip_${empName}_${month}_${year}.pdf`);
      } else {
        alert('Could not locate printable payslip element in preview.');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export note: ' + (err.message || 'Failed to export PDF'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 md:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto relative">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 no-print">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Corporate Payslip Preview</span>
            
            {/* Quick Template Switcher */}
            {templates && templates.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <Palette className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline">Layout:</span>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const t = templates.find(item => String(item.id) === e.target.value);
                    if (t) setSelectedTemplate(t);
                  }}
                  className="text-xs bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.is_default ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <PayslipTemplate
          company={company}
          employee={employee}
          earnings={earnings}
          deductions={deductions}
          payslip={payslipData}
          template={selectedTemplate}
        />

        <div className="flex justify-end gap-3 pt-2 no-print">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition">
            Back to Form
          </button>
          {onConfirmGenerate && (
            <button
              onClick={() => {
                onClose();
                onConfirmGenerate();
              }}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs shadow-md transition"
            >
              Confirm & Generate Payslip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
