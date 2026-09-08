import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  X, 
  FileText,
  CreditCard
} from 'lucide-react';
import { api } from '../api';
import { formatDate, maskAccountNumber, maskSensitive } from '../utils/formatters';
import EmployeeFormModal from './employee/EmployeeFormModal';
import EmployeeDetailsModal from './employee/EmployeeDetailsModal';
import ImportedOfferLetterModal from './employee/ImportedOfferLetterModal';

export default function EmployeeManagement({ 
  companies = [],
  initialCompanyFilter = 'All',
  onSelectEmployeeToSalary, 
  onSelectEmployeeToGenerate, 
  onEmployeeAdded,
  onEmployeeDeleted,
  onCompanyUpdated,
  onPayslipGenerated,
  onDownloadPdf
}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState(initialCompanyFilter || 'All');
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);

  // Offer Letter Import
  const [parsingOfferLetter, setParsingOfferLetter] = useState(false);
  const [importedOfferLetterData, setImportedOfferLetterData] = useState(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [viewingEmp, setViewingEmp] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch employee records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmp(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmp(emp);
    setIsFormOpen(true);
  };

  const handleDelete = async (emp) => {
    if (!confirm(`Are you sure you want to permanently delete ${emp.name}?`)) return;
    try {
      const res = await api.deleteEmployee(emp.id);
      setMessage({ type: 'success', text: res.message });
      await fetchEmployees();
      if (onEmployeeDeleted) await onEmployeeDeleted(emp);
      if (onCompanyUpdated) await onCompanyUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleImportOfferLetter = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsingOfferLetter(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await api.uploadAndSaveOfferLetter(file);
      await fetchEmployees();
      if (onCompanyUpdated) await onCompanyUpdated(data.company);
      if (onEmployeeAdded) await onEmployeeAdded(data.employee);
      setImportedOfferLetterData(data);
      setMessage({
        type: 'success',
        text: `Offer Letter successfully parsed! Company "${data.company?.name}" and Employee ${data.employee.name} added to database.`
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to process offer letter: ' + err.message });
    } finally {
      setParsingOfferLetter(false);
      if (e.target) e.target.value = '';
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
    const matchesCompany = companyFilter === 'All' || String(emp.company_id) === String(companyFilter);

    return matchesSearch && matchesStatus && matchesDept && matchesCompany;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Employee Directory</h2>
            <p className="text-xs text-slate-500">Manage employee personal, employment, company, bank, and statutory information</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition">
            <FileText className="w-4 h-4" />
            <span>{parsingOfferLetter ? 'Extracting & Saving...' : 'Upload Offer Letter'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx,.png,.jpg"
              onChange={handleImportOfferLetter}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenAddModal}
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Message Feedback */}
      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
          message.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee by name, ID, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* Dept Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Mask Sensitive Data Toggle */}
          <button
            onClick={() => setMaskSensitiveData(!maskSensitiveData)}
            className={`px-3 py-2 rounded-lg font-semibold border flex items-center gap-1.5 transition ${
              maskSensitiveData
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
            title="Toggle sensitive bank and tax details visibility"
          >
            {maskSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{maskSensitiveData ? 'Sensitive Data Masked' : 'Sensitive Data Exposed'}</span>
          </button>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-xs text-slate-700">No matching employees found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Code / ID</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Designation & Dept</th>
                  <th className="py-3 px-4">Bank Account</th>
                  <th className="py-3 px-4">PAN / UAN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500">{emp.email || emp.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {emp.employee_code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded text-[11px] truncate max-w-[160px] inline-block">
                        {emp.company_name || 'Acme Solutions'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{emp.designation}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {maskSensitiveData ? maskAccountNumber(emp.account_number) : (emp.account_number || '-')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>PAN: {maskSensitiveData ? maskSensitive(emp.pan, 4) : (emp.pan || '-')}</div>
                      <div className="text-slate-500">UAN: {maskSensitiveData ? maskSensitive(emp.uan, 4) : (emp.uan || '-')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingEmp(emp)}
                          title="View Details"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          title="Edit Employee"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectEmployeeToSalary(emp.id)}
                          title="Configure Salary Structure"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          title="Delete / Deactivate"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <EmployeeFormModal
          editingEmp={editingEmp}
          companies={companies}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchEmployees();
            setMessage({ type: 'success', text: editingEmp ? 'Employee updated.' : 'Employee created.' });
          }}
        />
      )}

      {/* Details View Modal */}
      {viewingEmp && (
        <EmployeeDetailsModal
          emp={viewingEmp}
          maskData={maskSensitiveData}
          onClose={() => setViewingEmp(null)}
        />
      )}

      {/* Offer Letter Import Success Modal */}
      {importedOfferLetterData && (
        <ImportedOfferLetterModal
          data={importedOfferLetterData}
          onDownloadPdf={onDownloadPdf}
          onPayslipGenerated={onPayslipGenerated}
          onGeneratePayslip={(empId) => {
            setImportedOfferLetterData(null);
            if (onSelectEmployeeToGenerate) {
              onSelectEmployeeToGenerate(empId);
            }
          }}
          onClose={() => setImportedOfferLetterData(null)}
        />
      )}
    </div>
  );
}
