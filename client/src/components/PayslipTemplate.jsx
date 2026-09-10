import React from 'react';
import { formatCurrency, formatDate, formatDateTime, maskAccountNumber } from '../utils/formatters';
import { Building2, ShieldCheck, Printer, Download, Eye, Award, FileText } from 'lucide-react';
import AdeccoPayslipLayout from './payslip/AdeccoPayslipLayout';

export const DEFAULT_BLOCKS = [
  { id: 'b_header', type: 'company_header', title: 'Company Header', width: '100%', align: 'split', showLogo: true, showAddress: true, showContacts: true },
  { id: 'b_statutory', type: 'statutory_bar', title: 'Company Tax & Reg Bar', width: '100%' },
  { id: 'b_employee', type: 'employee_details', title: 'Employee Information', width: '50%' },
  { id: 'b_bank', type: 'bank_details', title: 'Bank & Statutory Details', width: '50%' },
  { id: 'b_attendance', type: 'attendance', title: 'Attendance Summary', width: '100%' },
  { id: 'b_salary', type: 'salary_table', title: 'Earnings & Deductions Table', width: '100%' },
  { id: 'b_netpay', type: 'net_pay_banner', title: 'Net Pay Highlight Card', width: '100%' },
  { id: 'b_signatures', type: 'signatures', title: 'Signatures Block', width: '100%' },
  { id: 'b_footer', type: 'footer_notes', title: 'Footer Disclaimer & Timestamp', width: '100%' }
];

export default function PayslipTemplate({ 
  payslip, 
  company, 
  employee, 
  earnings, 
  deductions, 
  template = null,
  isPrintMode = false 
}) {
  if (!payslip && (!company || !employee)) {
    return (
      <div className="p-8 text-center text-slate-500">
        No payslip data available for preview.
      </div>
    );
  }

  // Helper to safely parse objects/arrays if stored as JSON string
  const safeParse = (val, fallback) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  // Handle snapshot object or live prop fallback
  const comp = safeParse(payslip?.company || payslip?.company_snapshot_json, company || {});
  const emp = safeParse(payslip?.employee || payslip?.employee_snapshot_json, employee || {});
  const rawEarn = safeParse(payslip?.earnings || payslip?.earnings_snapshot_json, earnings || []);
  const rawDed = safeParse(payslip?.deductions || payslip?.deductions_snapshot_json, deductions || []);
  const earnList = Array.isArray(rawEarn) ? rawEarn : [];
  const dedList = Array.isArray(rawDed) ? rawDed : [];

  // Active Template Settings
  const tmpl = template || {
    name: 'Adecco Enterprise',
    slug: 'adecco-corporate',
    layout_type: 'adecco',
    header_style: 'centered',
    theme_color: '#000000',
    accent_color: '#da291c',
    show_company_logo: 1,
    show_bank_details: 1,
    show_statutory_ids: 1,
    show_attendance: 1,
    show_signature_block: 1,
    watermark_text: '',
    footer_notes: 'This is a computer-generated payslip and does not require a physical signature.'
  };

  const themeColor = tmpl.theme_color || '#0f172a';
  const accentColor = tmpl.accent_color || '#2563eb';
  const layoutType = tmpl.layout_type || 'adecco';
  const headerStyle = tmpl.header_style || 'split';

  // Dedicated Enterprise Tabular (Adecco) Layout Handler
  if ((layoutType === 'adecco' || tmpl.slug === 'adecco-corporate') && !tmpl.layout_config_json) {
    return (
      <AdeccoPayslipLayout
        payslip={payslip}
        company={comp}
        employee={emp}
        earnings={earnList}
        deductions={dedList}
        template={tmpl}
        isPrintMode={isPrintMode}
      />
    );
  }

  const logoUrl = comp.logo_path ? `http://localhost:5000${comp.logo_path}` : null;

  const grossEarnings = payslip?.gross_salary ?? earnList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalDeductions = payslip?.total_deductions ?? dedList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netSalary = payslip?.net_salary ?? (grossEarnings - totalDeductions);
  const netWords = payslip?.net_salary_words || '';

  // Max rows balance for earnings and deductions side-by-side
  const maxRows = Math.max(earnList.length, dedList.length);
  const paddedEarnList = [...earnList];
  const paddedDedList = [...dedList];
  while (paddedEarnList.length < maxRows) paddedEarnList.push({ name: '', amount: '' });
  while (paddedDedList.length < maxRows) paddedDedList.push({ name: '', amount: '' });

  // Parse custom dynamic layout blocks if present
  let customBlocks = null;
  if (tmpl.layout_config_json) {
    try {
      customBlocks = typeof tmpl.layout_config_json === 'string' 
        ? JSON.parse(tmpl.layout_config_json) 
        : tmpl.layout_config_json;
    } catch (e) {
      customBlocks = null;
    }
  }

  // RENDER INDIVIDUAL BLOCK
  const renderBlock = (block) => {
    switch (block.type) {
      case 'company_header': {
        const align = block.align || headerStyle;
        const showLogo = block.showLogo ?? tmpl.show_company_logo ?? true;
        const showAddress = block.showAddress ?? true;
        const showContacts = block.showContacts ?? true;

        if (align === 'banner') {
          return (
            <div 
              key={block.id}
              className="p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 shadow-sm rounded-lg"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-4 text-left">
                {showLogo && logoUrl && (
                  <img 
                    src={logoUrl} 
                    crossOrigin="anonymous"
                    alt={comp.name || 'Company Logo'} 
                    className="h-16 max-w-[170px] object-contain rounded bg-white p-1.5 shadow-sm"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    {comp.name || 'Company Name'}
                  </h1>
                  {showAddress && (
                    <p className="text-xs text-white/80 mt-1 max-w-md leading-relaxed">
                      {[comp.address, comp.city, comp.state, comp.zip_code, comp.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="bg-white/20 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-wider block mb-1">
                  OFFICIAL PAYSLIP
                </span>
                <span className="text-sm font-semibold text-white/95">
                  {payslip?.pay_month} {payslip?.pay_year}
                </span>
                {payslip?.payslip_number && (
                  <p className="text-[11px] text-white/70 font-mono">
                    #{payslip.payslip_number}
                  </p>
                )}
              </div>
            </div>
          );
        }

        if (align === 'centered') {
          return (
            <div key={block.id} className="text-center border-b border-slate-200 pb-6 mb-6">
              {showLogo && logoUrl && (
                <img 
                  src={logoUrl} 
                  crossOrigin="anonymous"
                  alt={comp.name || 'Company Logo'} 
                  className="h-16 max-w-[200px] object-contain mx-auto mb-3"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <h1 className="text-2xl font-black tracking-tight" style={{ color: themeColor }}>
                {comp.name || 'Company Name'}
              </h1>
              {showAddress && (
                <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto leading-relaxed">
                  {[comp.address, comp.city, comp.state, comp.zip_code, comp.country].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="mt-3 inline-flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-800">
                <span className="font-bold uppercase tracking-wider" style={{ color: accentColor }}>SALARY SLIP</span>
                <span>•</span>
                <span>Pay Period: {payslip?.pay_month} {payslip?.pay_year}</span>
                {payslip?.payslip_number && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-600">No: {payslip.payslip_number}</span>
                  </>
                )}
              </div>
            </div>
          );
        }

        // Default Split
        return (
          <div key={block.id} className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-4">
            <div className="flex items-start gap-4">
              {showLogo && (
                logoUrl ? (
                  <img 
                    src={logoUrl} 
                    crossOrigin="anonymous"
                    alt={comp.name || 'Company Logo'} 
                    className="h-16 max-w-[180px] object-contain rounded border border-slate-100 p-1"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div 
                    className="h-16 w-16 text-white rounded-lg flex items-center justify-center font-bold text-2xl shadow-sm shrink-0"
                    style={{ backgroundColor: themeColor }}
                  >
                    {comp.name ? comp.name.charAt(0) : 'C'}
                  </div>
                )
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ color: themeColor }}>
                  {comp.name || 'Company Name'}
                </h1>
                {showAddress && (
                  <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                    {[comp.address, comp.city, comp.state, comp.zip_code, comp.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {showContacts && (
                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {comp.phone && <span>Ph: {comp.phone}</span>}
                    {comp.email && <span>Email: {comp.email}</span>}
                    {comp.website && <span>{comp.website}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div 
                className="inline-block text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2"
                style={{ backgroundColor: themeColor }}
              >
                SALARY SLIP
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Pay Period: <span className="font-bold" style={{ color: themeColor }}>{payslip?.pay_month} {payslip?.pay_year}</span>
              </p>
              {payslip?.payslip_number && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Payslip No: <span className="font-mono font-medium text-slate-700">{payslip.payslip_number}</span>
                </p>
              )}
            </div>
          </div>
        );
      }

      case 'statutory_bar': {
        if (!tmpl.show_statutory_ids && !block.forceShow) return null;
        if (!comp.registration_no && !comp.gst_no && !comp.pf_no && !comp.tan_no) return null;
        return (
          <div key={block.id} className="bg-slate-50 border border-slate-200/80 rounded-md p-2.5 mb-6 text-[11px] text-slate-600 flex flex-wrap justify-between gap-2">
            {comp.registration_no && <div><span className="font-semibold text-slate-700">Reg No:</span> {comp.registration_no}</div>}
            {comp.gst_no && <div><span className="font-semibold text-slate-700">GSTIN:</span> {comp.gst_no}</div>}
            {comp.pf_no && <div><span className="font-semibold text-slate-700">PF Reg No:</span> {comp.pf_no}</div>}
            {comp.tan_no && <div><span className="font-semibold text-slate-700">TAN:</span> {comp.tan_no}</div>}
          </div>
        );
      }

      case 'employee_details': {
        return (
          <div key={block.id} className={`border border-slate-200 rounded-lg p-3.5 mb-4 bg-slate-50/50 ${layoutType === 'classic' ? 'border-2 border-slate-400 bg-white' : ''}`}>
            <h3 
              className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1"
              style={{ color: themeColor }}
            >
              {block.title || 'Employee Details'}
            </h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
              <span className="text-slate-500 font-medium">Employee Name:</span>
              <span className="font-bold text-slate-900">{emp.name || '-'}</span>

              <span className="text-slate-500 font-medium">Employee Code/ID:</span>
              <span className="font-mono font-semibold text-slate-800">{emp.employee_code || '-'}</span>

              <span className="text-slate-500 font-medium">Designation:</span>
              <span className="text-slate-800">{emp.designation || '-'}</span>

              <span className="text-slate-500 font-medium">Department:</span>
              <span className="text-slate-800">{emp.department || '-'}</span>

              <span className="text-slate-500 font-medium">Date of Joining:</span>
              <span className="text-slate-800">{formatDate(emp.date_of_joining)}</span>

              <span className="text-slate-500 font-medium">Employment Type:</span>
              <span className="text-slate-800">{emp.employment_type || 'Full-Time'}</span>

              {emp.location && (
                <>
                  <span className="text-slate-500 font-medium">Work Location:</span>
                  <span className="text-slate-800">{emp.location}</span>
                </>
              )}
            </div>
          </div>
        );
      }

      case 'bank_details': {
        if (!tmpl.show_bank_details && !block.forceShow) return null;
        return (
          <div key={block.id} className={`border border-slate-200 rounded-lg p-3.5 mb-4 bg-slate-50/50 ${layoutType === 'classic' ? 'border-2 border-slate-400 bg-white' : ''}`}>
            <h3 
              className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1"
              style={{ color: themeColor }}
            >
              {block.title || 'Bank & Statutory Information'}
            </h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
              <span className="text-slate-500 font-medium">Bank Name:</span>
              <span className="text-slate-800">{emp.bank_name || '-'}</span>

              <span className="text-slate-500 font-medium">Bank Account:</span>
              <span className="font-mono text-slate-800">{maskAccountNumber(emp.account_number)}</span>

              <span className="text-slate-500 font-medium">IFSC Code:</span>
              <span className="font-mono text-slate-800">{emp.ifsc_code || '-'}</span>

              <span className="text-slate-500 font-medium">PAN:</span>
              <span className="font-mono text-slate-800">{emp.pan || '-'}</span>

              <span className="text-slate-500 font-medium">UAN:</span>
              <span className="font-mono text-slate-800">{emp.uan || '-'}</span>

              <span className="text-slate-500 font-medium">PF Number:</span>
              <span className="font-mono text-slate-800">{emp.pf_number || '-'}</span>
            </div>
          </div>
        );
      }

      case 'attendance': {
        if (!tmpl.show_attendance && !block.forceShow) return null;
        return (
          <div key={block.id} className="border border-slate-200 rounded-lg p-3 mb-6 grid grid-cols-3 text-center divide-x divide-slate-200 text-xs bg-slate-50/70">
            <div>
              <span className="font-medium block text-slate-600">Working Days</span>
              <span className="text-base font-bold text-slate-900">{payslip?.working_days ?? 30}</span>
            </div>
            <div>
              <span className="text-emerald-700 font-medium block">Paid Days</span>
              <span className="text-base font-bold text-emerald-900">{payslip?.paid_days ?? 30}</span>
            </div>
            <div>
              <span className="text-rose-700 font-medium block">LOP / Absent Days</span>
              <span className="text-base font-bold text-rose-900">{payslip?.lop_days ?? 0}</span>
            </div>
          </div>
        );
      }

      case 'salary_table': {
        return (
          <div key={block.id} className={`border rounded-lg overflow-hidden mb-6 ${layoutType === 'classic' ? 'border-2 border-slate-400' : 'border-slate-300'}`}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr 
                  className="font-bold text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  <th className="py-2.5 px-3 border-r border-white/20 w-1/4">EARNINGS</th>
                  <th className="py-2.5 px-3 text-right border-r border-white/20 w-1/4">AMOUNT (₹)</th>
                  <th className="py-2.5 px-3 border-r border-white/20 w-1/4">DEDUCTIONS</th>
                  <th className="py-2.5 px-3 text-right w-1/4">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {Array.from({ length: maxRows }).map((_, idx) => {
                  const earn = paddedEarnList[idx];
                  const ded = paddedDedList[idx];
                  return (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-700">
                        {earn?.name || ''}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">
                        {earn?.amount !== '' ? formatCurrency(earn.amount, '').trim() : ''}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-700">
                        {ded?.name || ''}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {ded?.amount !== '' ? formatCurrency(ded.amount, '').trim() : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                  <td className="py-2.5 px-3 border-r border-slate-300 uppercase">Gross Earnings</td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 font-mono text-sm" style={{ color: themeColor }}>
                    {formatCurrency(grossEarnings)}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 uppercase">Total Deductions</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-rose-900">
                    {formatCurrency(totalDeductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      }

      case 'net_pay_banner': {
        return (
          <div 
            key={block.id}
            className="text-white rounded-xl p-5 mb-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            style={{ backgroundColor: themeColor }}
          >
            <div>
              <span className="text-white/80 text-xs font-bold uppercase tracking-wider">NET SALARY PAYABLE</span>
              <p className="text-xs text-white/90 italic mt-1 max-w-xl">
                {netWords || '-'}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0 bg-white/15 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
              <span className="text-xs text-white/80 font-medium block">TOTAL NET AMOUNT</span>
              <span className="text-2xl md:text-3xl font-black tracking-tight font-mono text-white">
                {formatCurrency(netSalary)}
              </span>
            </div>
          </div>
        );
      }

      case 'custom_text': {
        return (
          <div key={block.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 mb-6 text-xs text-slate-700">
            {block.title && (
              <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[11px]" style={{ color: themeColor }}>
                {block.title}
              </h4>
            )}
            <p className="whitespace-pre-line leading-relaxed">{block.content || 'Custom notes or terms block.'}</p>
          </div>
        );
      }

      case 'divider': {
        return (
          <hr 
            key={block.id}
            className="my-6 border-0 h-[2px] rounded" 
            style={{ backgroundColor: block.color || themeColor }} 
          />
        );
      }

      case 'signatures': {
        if (!tmpl.show_signature_block && !block.forceShow) return null;
        return (
          <div key={block.id} className="grid grid-cols-2 gap-8 my-6 pt-6 border-t border-slate-200 text-xs">
            <div className="text-center pt-8 border-t border-dashed border-slate-300">
              <span className="font-semibold text-slate-700 block">Employee Signature</span>
              <span className="text-[11px] text-slate-500">Acknowledged & Accepted</span>
            </div>
            <div className="text-center pt-8 border-t border-dashed border-slate-300">
              <span className="font-semibold text-slate-700 block">Authorized Signatory</span>
              <span className="text-[11px] text-slate-500">{comp.name || 'Company HR & Payroll'}</span>
            </div>
          </div>
        );
      }

      case 'footer_notes': {
        return (
          <div key={block.id} className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{tmpl.footer_notes || 'This is a computer-generated document. No signature is required.'}</span>
            </div>
            <div>
              {payslip?.generation_timestamp && (
                <span>Generated on: {formatDateTime(payslip.generation_timestamp)}</span>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Group blocks that are 50% width into 2-column rows
  const renderBlocksLayout = (blocksToRender) => {
    const renderedElements = [];
    let i = 0;

    while (i < blocksToRender.length) {
      const current = blocksToRender[i];
      const next = blocksToRender[i + 1];

      if (current.width === '50%' && next && next.width === '50%') {
        // Pair two 50% blocks side-by-side
        renderedElements.push(
          <div key={`pair_${current.id}_${next.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>{renderBlock(current)}</div>
            <div>{renderBlock(next)}</div>
          </div>
        );
        i += 2;
      } else {
        renderedElements.push(
          <div key={current.id}>
            {renderBlock(current)}
          </div>
        );
        i += 1;
      }
    }

    return renderedElements;
  };

  const activeBlocks = customBlocks || DEFAULT_BLOCKS;

  return (
    <div 
      id="printable-payslip"
      className={`bg-white text-slate-900 font-sans border printable-content relative overflow-hidden ${
        layoutType === 'classic' 
          ? 'p-8 border-slate-400 rounded-none shadow-sm max-w-4xl mx-auto' 
          : layoutType === 'executive'
          ? 'p-6 md:p-8 border-slate-300 rounded-xl shadow-xl max-w-4xl mx-auto'
          : layoutType === 'minimalist'
          ? 'p-8 border-slate-200 rounded-lg shadow-sm max-w-4xl mx-auto'
          : 'p-6 md:p-8 border-slate-200 rounded-xl shadow-lg max-w-4xl mx-auto'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Optional Watermark */}
      {tmpl.watermark_text && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-5"
          style={{ transform: 'rotate(-30deg)' }}
        >
          <span className="text-8xl font-extrabold uppercase tracking-widest text-slate-900">
            {tmpl.watermark_text}
          </span>
        </div>
      )}

      {/* Render Dynamic Configured Blocks */}
      <div className="relative z-10">
        {renderBlocksLayout(activeBlocks)}
      </div>
    </div>
  );
}
