import React from 'react';
import { formatDate, formatDateTime, formatCurrency, maskAccountNumber } from '../../utils/formatters';
import { ShieldCheck, Building2 } from 'lucide-react';

export default function AdeccoPayslipLayout({
  payslip,
  company,
  employee,
  earnings,
  deductions,
  template = null
}) {
  // Safe parser for possible stringified JSON snapshots
  const safeParse = (val, fallback) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  const comp = safeParse(payslip?.company || payslip?.company_snapshot_json, company || {});
  const emp = safeParse(payslip?.employee || payslip?.employee_snapshot_json, employee || {});
  const rawEarn = safeParse(payslip?.earnings || payslip?.earnings_snapshot_json, earnings || []);
  const rawDed = safeParse(payslip?.deductions || payslip?.deductions_snapshot_json, deductions || []);
  const earnList = Array.isArray(rawEarn) ? rawEarn : [];
  const dedList = Array.isArray(rawDed) ? rawDed : [];

  const logoUrl = comp.logo_path ? `http://localhost:5000${comp.logo_path}` : null;

  const grossEarnings = Number(payslip?.gross_salary ?? earnList.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)) || 0;
  const totalDeductions = Number(payslip?.total_deductions ?? dedList.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)) || 0;
  const netSalary = Number(payslip?.net_salary ?? (grossEarnings - totalDeductions)) || 0;
  const netWords = payslip?.net_salary_words || '';

  const formatAmount = (val) => {
    if (val === undefined || val === null || val === '' || isNaN(val)) return '';
    return Number(val).toFixed(2);
  };

  // Balance rows to at least 4 rows so table structure remains crisp
  const rowCount = Math.max(earnList.length, dedList.length, 4);
  const paddedEarnList = [...earnList];
  const paddedDedList = [...dedList];
  while (paddedEarnList.length < rowCount) paddedEarnList.push({ name: '', amount: '' });
  while (paddedDedList.length < rowCount) paddedDedList.push({ name: '', amount: '' });

  // Paid and LOP days
  const paidDays = Number(payslip?.paid_days ?? 30) || 30;
  const lopDays = Number(payslip?.lop_days ?? 0) || 0;

  // YTD estimates or snapshot data
  const ytdMultiplier = 1;
  const grossYtd = grossEarnings * ytdMultiplier;
  const dedYtd = totalDeductions * ytdMultiplier;
  const netYtd = grossYtd - dedYtd;

  const empCode = emp.employee_code || payslip?.employee_code || payslip?.employee_id || '-';
  const payMonth = payslip?.pay_month || '';
  const payYear = payslip?.pay_year || '';
  const companyName = comp.name || 'Company Name';

  return (
    <div 
      id="printable-payslip"
      className="bg-white text-black font-sans text-[11px] leading-tight printable-content mx-auto max-w-4xl relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Outer framing border */}
      <div className="border-2 border-black p-4 md:p-6 bg-white shadow-sm">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-3 gap-3 border-b border-black">
          {/* Logo on Left */}
          <div className="w-44 shrink-0 flex items-center justify-start">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                crossOrigin="anonymous"
                alt={companyName} 
                className="max-h-14 max-w-[170px] object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="flex items-center gap-2 border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50">
                <Building2 className="w-5 h-5 text-slate-700 shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 truncate max-w-[110px]">
                  {companyName}
                </span>
              </div>
            )}
          </div>

          {/* Centered Company Title & Pay Month */}
          <div className="flex-1 text-center pr-0 sm:pr-20">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-black">
              {companyName}
            </h1>
            <p className="text-xs md:text-sm font-semibold text-slate-800 mt-1">
              Payslip {payMonth || payYear ? `for the month of ${payMonth} ${payYear}`.trim() : 'Document'}
            </p>
          </div>
        </div>

        {/* DETAILS SECTION: Two-column layout (Employee Meta Left, Leave Details Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 pt-2 pb-1 text-[11px]">
          
          {/* LEFT: Employee Identity & Bank Details (7 cols) */}
          <div className="lg:col-span-7 pr-2">
            <div className="grid grid-cols-12 gap-x-2 gap-y-1">
              
              {/* Row 1 */}
              <div className="col-span-3 font-semibold text-slate-800">EMP.No</div>
              <div className="col-span-3 font-mono font-medium truncate">{empCode}</div>
              <div className="col-span-3 font-semibold text-slate-800">PF No</div>
              <div className="col-span-3 font-mono text-[10px] truncate" title={emp.pf_number || '-'}>
                {emp.pf_number || '-'}
              </div>

              {/* Row 2 */}
              <div className="col-span-3 font-semibold text-slate-800">NAME</div>
              <div className="col-span-3 font-bold uppercase truncate" title={emp.name || '-'}>
                {emp.name || '-'}
              </div>
              <div className="col-span-3 font-semibold text-slate-800">UAN No</div>
              <div className="col-span-3 font-mono truncate">{emp.uan || '-'}</div>

              {/* Row 3 */}
              <div className="col-span-3 font-semibold text-slate-800">DESIGNATION</div>
              <div className="col-span-3 font-medium uppercase text-[10px] leading-tight truncate" title={emp.designation || '-'}>
                {emp.designation || '-'}
              </div>
              <div className="col-span-3 font-semibold text-slate-800">ESI No</div>
              <div className="col-span-3 font-mono truncate">{emp.esic_number || '-'}</div>

              {/* Row 4 */}
              <div className="col-span-3 font-semibold text-slate-800">DATE OF BIRTH</div>
              <div className="col-span-3 truncate">{emp.dob ? formatDate(emp.dob) : '-'}</div>
              <div className="col-span-3 font-semibold text-slate-800">LOCATION</div>
              <div className="col-span-3 uppercase truncate">{emp.location || '-'}</div>

              {/* Row 5 */}
              <div className="col-span-3 font-semibold text-slate-800">CLIENT</div>
              <div className="col-span-3 uppercase font-medium truncate">{emp.department || comp.name || '-'}</div>
              <div className="col-span-3 font-semibold text-slate-800">DATE OF JOINING</div>
              <div className="col-span-3 truncate">{emp.date_of_joining ? formatDate(emp.date_of_joining) : '-'}</div>

              {/* Row 6 */}
              <div className="col-span-3"></div>
              <div className="col-span-3"></div>
              <div className="col-span-3 font-semibold text-slate-800">PAYMENT MODE</div>
              <div className="col-span-3 uppercase">{emp.payment_mode || 'NEFT'}</div>

              {/* Row 7 */}
              <div className="col-span-3 font-semibold text-slate-800">BANK</div>
              <div className="col-span-3 uppercase font-medium text-[10px] truncate" title={emp.bank_name || '-'}>
                {emp.bank_name || '-'}
              </div>
              <div className="col-span-3 font-semibold text-slate-800">A/c No.</div>
              <div className="col-span-3 font-mono font-medium truncate">
                {emp.account_number ? maskAccountNumber(emp.account_number) : '-'}
              </div>

              {/* Row 8 */}
              <div className="col-span-3 font-semibold text-slate-800">DATE OF LEAVING</div>
              <div className="col-span-3">{emp.date_of_leaving ? formatDate(emp.date_of_leaving) : '-'}</div>
              <div className="col-span-6"></div>

              {/* Row 9: Net Salary in Words */}
              <div className="col-span-3 font-bold text-slate-900 leading-tight">
                NET SALARY (In Words)
              </div>
              <div className="col-span-9 font-semibold text-slate-950 text-[11px] leading-tight flex items-center">
                {netWords || (netSalary > 0 ? `${formatCurrency(netSalary)} Only` : '-')}
              </div>
            </div>
          </div>

          {/* RIGHT: Dedicated Leave Details Table (5 cols) */}
          <div className="lg:col-span-5 mt-2 lg:mt-0">
            <div className="font-bold text-xs uppercase tracking-tight text-slate-900 mb-1">
              Leave Details
            </div>
            <table className="w-full border-collapse border border-black text-[10px] text-center">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th className="border-r border-black p-1 bg-slate-50 w-1/5 truncate">{empCode}</th>
                  <th className="border-r border-black p-1 bg-slate-50 w-1/5 uppercase">Entitlement</th>
                  <th className="border-r border-black p-1 bg-slate-50 w-1/5 uppercase">Opening Balance</th>
                  <th className="border-r border-black p-1 bg-slate-50 w-1/5 uppercase">Claimed</th>
                  <th className="p-1 bg-slate-50 w-1/5 uppercase">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black font-medium">
                  <td className="border-r border-black p-1 text-left font-semibold">Sick Leave</td>
                  <td className="border-r border-black p-1">0.00</td>
                  <td className="border-r border-black p-1">0.00</td>
                  <td className="border-r border-black p-1">0.00</td>
                  <td className="p-1">0.00</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-semibold text-left">Arrear LOP</td>
                  <td className="border-r border-black p-1"></td>
                  <td colSpan={2} className="border-r border-black p-1 font-semibold text-left pl-2">Total Arrear Days</td>
                  <td className="p-1"></td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={2} className="border-r border-black p-1 text-left">
                    LOP: <span className="font-mono font-medium ml-1">{formatAmount(lopDays)}</span>
                  </td>
                  <td colSpan={3} className="p-1 text-left pl-3">
                    No. Of Days Paid: <span className="font-mono font-medium ml-1">{formatAmount(paidDays)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* EARNINGS & DEDUCTIONS TABLE (6 Columns with YTD) */}
        <div className="mt-3 border-t-2 border-b-2 border-black">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black font-bold text-slate-950">
                <th className="py-1.5 px-2 text-left uppercase w-[28%] border-r border-black">EARNINGS</th>
                <th className="py-1.5 px-2 text-right uppercase w-[11%] border-r border-black">
                  AMOUNT<br />Rs.
                </th>
                <th className="py-1.5 px-2 text-right uppercase w-[11%] border-r-2 border-black">
                  YTD<br />Rs.
                </th>
                <th className="py-1.5 px-2 text-left uppercase w-[28%] border-r border-black">DEDUCTIONS</th>
                <th className="py-1.5 px-2 text-right uppercase w-[11%] border-r border-black">
                  AMOUNT<br />Rs.
                </th>
                <th className="py-1.5 px-2 text-right uppercase w-[11%]">
                  YTD<br />Rs.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent font-medium">
              {Array.from({ length: rowCount }).map((_, idx) => {
                const earn = paddedEarnList[idx];
                const ded = paddedDedList[idx];
                const earnAmt = (earn?.amount !== '' && earn?.amount !== undefined && earn?.amount !== null) ? Number(earn.amount) : null;
                const dedAmt = (ded?.amount !== '' && ded?.amount !== undefined && ded?.amount !== null) ? Number(ded.amount) : null;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    {/* Earnings Name */}
                    <td className="py-1 px-2 border-r border-black uppercase text-[10.5px]">
                      {earn?.name || ''}
                    </td>
                    {/* Earnings Amount */}
                    <td className="py-1 px-2 text-right border-r border-black font-mono">
                      {earnAmt !== null ? formatAmount(earnAmt) : ''}
                    </td>
                    {/* Earnings YTD */}
                    <td className="py-1 px-2 text-right border-r-2 border-black font-mono text-slate-700">
                      {earnAmt !== null ? formatAmount(earnAmt) : ''}
                    </td>

                    {/* Deductions Name */}
                    <td className="py-1 px-2 border-r border-black text-[10.5px]">
                      {ded?.name || ''}
                    </td>
                    {/* Deductions Amount */}
                    <td className="py-1 px-2 text-right border-r border-black font-mono">
                      {dedAmt !== null ? formatAmount(dedAmt) : ''}
                    </td>
                    {/* Deductions YTD */}
                    <td className="py-1 px-2 text-right font-mono text-slate-700">
                      {dedAmt !== null ? formatAmount(dedAmt) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* TOTALS & NET SALARY ROWS */}
            <tfoot>
              {/* Total Earnings & Total Deductions */}
              <tr className="border-t-2 border-b border-black font-bold bg-white text-slate-950">
                <td className="py-1.5 px-2 border-r border-black uppercase">
                  TOTAL EARNINGS (A)
                </td>
                <td className="py-1.5 px-2 text-right border-r border-black font-mono">
                  {formatAmount(grossEarnings)}
                </td>
                <td className="py-1.5 px-2 text-right border-r-2 border-black font-mono">
                  {formatAmount(grossYtd)}
                </td>
                <td className="py-1.5 px-2 border-r border-black uppercase">
                  TOTAL DEDUCTIONS
                </td>
                <td className="py-1.5 px-2 text-right border-r border-black font-mono">
                  {formatAmount(totalDeductions)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono">
                  {formatAmount(dedYtd)}
                </td>
              </tr>

              {/* NET SALARY ROW */}
              <tr className="border-b-2 border-black font-bold bg-white text-slate-950">
                <td className="py-1.5 px-2 border-r border-black uppercase">
                  NET SALARY
                </td>
                <td className="py-1.5 px-2 text-right border-r border-black font-mono text-[12px]">
                  {formatAmount(netSalary)}
                </td>
                <td className="py-1.5 px-2 text-right border-r-2 border-black font-mono text-[12px]">
                  {formatAmount(netYtd)}
                </td>
                <td className="py-1.5 px-2 border-r border-black"></td>
                <td className="py-1.5 px-2 border-r border-black"></td>
                <td className="py-1.5 px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOTTOM SECTION: Income Tax Calculation & Statutory Disclaimer */}
        <div className="mt-3 text-[10px] text-slate-700">
          <div className="font-bold text-xs uppercase text-slate-900 mb-1 border-b border-slate-300 pb-1 flex justify-between items-center">
            <span>Income Tax Calculation</span>
            <span className="text-[10px] font-normal text-slate-500">
              {payYear ? `(Provisional FY ${payYear})` : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/70 p-2 border border-slate-200 rounded-sm mb-3">
            <div>
              <span className="text-slate-500 block">Annual Projected Gross:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{(grossEarnings * 12).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Standard Deduction:</span>
              <span className="font-mono font-bold text-slate-900">₹50,000.00</span>
            </div>
            <div>
              <span className="text-slate-500 block">Estimated Taxable Income:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{Math.max(0, (grossEarnings * 12) - 50000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Tax Slabs Applicable:</span>
              <span className="font-bold text-slate-900">Standard Tax Regime</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-1 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{template?.footer_notes || 'This is a computer-generated payslip and does not require a physical signature.'}</span>
            </div>
            {payslip?.generation_timestamp && (
              <div>Generated on: {formatDateTime(payslip.generation_timestamp)}</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
