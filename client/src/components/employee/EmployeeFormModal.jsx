import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

export default function EmployeeFormModal({ editingEmp, companies = [], onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employee_code: editingEmp?.employee_code || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    name: editingEmp?.name || '',
    company_id: editingEmp?.company_id || (companies[0]?.id || 1),
    dob: editingEmp?.dob || '',
    gender: editingEmp?.gender || 'Male',
    email: editingEmp?.email || '',
    phone: editingEmp?.phone || '',
    address: editingEmp?.address || '',
    designation: editingEmp?.designation || '',
    department: editingEmp?.department || 'Engineering',
    date_of_joining: editingEmp?.date_of_joining || new Date().toISOString().split('T')[0],
    employment_type: editingEmp?.employment_type || 'Full-Time',
    location: editingEmp?.location || 'Head Office',
    reporting_manager: editingEmp?.reporting_manager || '',
    bank_name: editingEmp?.bank_name || '',
    account_number: editingEmp?.account_number || '',
    ifsc_code: editingEmp?.ifsc_code || '',
    pan: editingEmp?.pan || '',
    uan: editingEmp?.uan || '',
    pf_number: editingEmp?.pf_number || '',
    esic_number: editingEmp?.esic_number || '',
    status: editingEmp?.status || 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, formData);
      } else {
        await api.createEmployee(formData);
      }
      onSuccess();
    } catch (error) {
      setErr(error.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">
            {editingEmp ? `Edit Employee: ${editingEmp.name}` : 'Add New Employee'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {err && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Personal Info */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">1. Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Employee Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Employee ID / Code *</label>
                <input type="text" name="employee_code" required value={formData.employee_code} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono font-bold" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border rounded-lg p-2">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div className="md:col-span-3">
                <label className="block font-semibold mb-1">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">2. Employment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block font-semibold mb-1">Company / Organization *</label>
                <select
                  name="company_id"
                  required
                  value={formData.company_id}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-medium bg-white"
                >
                  {companies && companies.length > 0 ? (
                    companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value={1}>Default Organization</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Designation *</label>
                <input type="text" name="designation" required value={formData.designation} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Department *</label>
                <input type="text" name="department" required value={formData.department} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Date of Joining *</label>
                <input type="date" name="date_of_joining" required value={formData.date_of_joining} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Employment Type</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full border rounded-lg p-2">
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reporting Manager</label>
                <input type="text" name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">3. Bank Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Bank Name</label>
                <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Account Number</label>
                <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">IFSC Code</label>
                <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono uppercase" />
              </div>
            </div>
          </div>

          {/* Statutory Info */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">4. Statutory Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1">PAN</label>
                <input type="text" name="pan" value={formData.pan} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono uppercase" />
              </div>
              <div>
                <label className="block font-semibold mb-1">UAN</label>
                <input type="text" name="uan" value={formData.uan} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">PF Number</label>
                <input type="text" name="pf_number" value={formData.pf_number} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">ESIC Number</label>
                <input type="text" name="esic_number" value={formData.esic_number} onChange={handleChange} className="w-full border rounded-lg p-2 font-mono" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold shadow-md disabled:opacity-50">
              {loading ? 'Saving...' : editingEmp ? 'Update Employee' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
