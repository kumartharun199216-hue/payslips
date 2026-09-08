import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function SalaryReviewCard({
  loadingSalary,
  earnings,
  deductions,
  grossEarnings,
  totalDeductions,
  onEarningChange,
  onAddEarning,
  onRemoveEarning,
  onDeductionChange,
  onAddDeduction,
  onRemoveDeduction
}) {
  if (loadingSalary) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Earnings Table */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="font-bold text-slate-800 text-xs uppercase">Earnings</h4>
          <button onClick={onAddEarning} className="text-[11px] text-blue-600 font-bold flex items-center gap-1">+ Add</button>
        </div>
        {earnings.map((e, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <input
              type="text"
              value={e.name}
              onChange={(evt) => onEarningChange(idx, 'name', evt.target.value)}
              className="flex-1 border rounded p-1.5 bg-white font-medium"
            />
            <div className="w-28 relative">
              <span className="absolute left-2 top-1.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={e.amount}
                onChange={(evt) => onEarningChange(idx, 'amount', Number(evt.target.value))}
                className="w-full border rounded pl-5 pr-2 py-1.5 bg-white font-mono text-right font-bold"
              />
            </div>
            <button onClick={() => onRemoveEarning(idx)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <div className="pt-2 border-t flex justify-between font-bold text-xs">
          <span>Gross Earnings:</span>
          <span className="font-mono text-emerald-700">{formatCurrency(grossEarnings)}</span>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="font-bold text-slate-800 text-xs uppercase">Deductions</h4>
          <button onClick={onAddDeduction} className="text-[11px] text-blue-600 font-bold flex items-center gap-1">+ Add</button>
        </div>
        {deductions.map((d, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <input
              type="text"
              value={d.name}
              onChange={(evt) => onDeductionChange(idx, 'name', evt.target.value)}
              className="flex-1 border rounded p-1.5 bg-white font-medium"
            />
            <div className="w-28 relative">
              <span className="absolute left-2 top-1.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={d.amount}
                onChange={(evt) => onDeductionChange(idx, 'amount', Number(evt.target.value))}
                className="w-full border rounded pl-5 pr-2 py-1.5 bg-white font-mono text-right font-bold"
              />
            </div>
            <button onClick={() => onRemoveDeduction(idx)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <div className="pt-2 border-t flex justify-between font-bold text-xs">
          <span>Total Deductions:</span>
          <span className="font-mono text-rose-700">{formatCurrency(totalDeductions)}</span>
        </div>
      </div>
    </div>
  );
}
