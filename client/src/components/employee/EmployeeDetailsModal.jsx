import React from 'react';
import { X } from 'lucide-react';
import { formatDate, maskAccountNumber, maskSensitive } from '../../utils/formatters';

export default function EmployeeDetailsModal({ emp, maskData, onClose }) {
  if (!emp) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">{emp.name}</h3>
            <p className="text-xs font-mono text-blue-900">{emp.employee_code} • {emp.designation}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border">
            <h4 className="font-bold text-slate-700 mb-1 uppercase">Personal & Employment</h4>
            <div className="grid grid-cols-2 gap-1.5 text-slate-600">
              <div>Email: <span className="font-medium text-slate-900">{emp.email || '-'}</span></div>
              <div>Phone: <span className="font-medium text-slate-900">{emp.phone || '-'}</span></div>
              <div>Department: <span className="font-medium text-slate-900">{emp.department}</span></div>
              <div>Date of Joining: <span className="font-medium text-slate-900">{formatDate(emp.date_of_joining)}</span></div>
              <div>Type: <span className="font-medium text-slate-900">{emp.employment_type}</span></div>
              <div>Location: <span className="font-medium text-slate-900">{emp.location}</span></div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border">
            <h4 className="font-bold text-slate-700 mb-1 uppercase">Bank & Statutory Information</h4>
            <div className="grid grid-cols-2 gap-1.5 text-slate-600">
              <div>Bank: <span className="font-medium text-slate-900">{emp.bank_name || '-'}</span></div>
              <div>Account No: <span className="font-mono text-slate-900">{maskData ? maskAccountNumber(emp.account_number) : (emp.account_number || '-')}</span></div>
              <div>IFSC: <span className="font-mono text-slate-900">{emp.ifsc_code || '-'}</span></div>
              <div>PAN: <span className="font-mono text-slate-900">{maskData ? maskSensitive(emp.pan, 4) : (emp.pan || '-')}</span></div>
              <div>UAN: <span className="font-mono text-slate-900">{maskData ? maskSensitive(emp.uan, 4) : (emp.uan || '-')}</span></div>
              <div>PF Number: <span className="font-mono text-slate-900">{emp.pf_number || '-'}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Close Profile</button>
        </div>
      </div>
    </div>
  );
}
