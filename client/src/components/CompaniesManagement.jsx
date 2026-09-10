import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Upload, 
  X, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../api';
import CompanyFormModal from './company/CompanyFormModal';

export default function CompaniesManagement({ onCompanyUpdated, onSelectCompanyEmployees }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to fetch companies' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id, name, empCount) => {
    let confirmMsg = `Are you sure you want to permanently delete company "${name}"? This action cannot be undone.`;
    if (empCount > 0) {
      confirmMsg = `Company "${name}" has ${empCount} employee(s) assigned. Deleting will clean up its company payslips and unassign its employees. Do you wish to proceed?`;
    }
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await api.deleteCompany(id, true);
      setFeedback({ type: 'success', text: `Company "${name}" deleted successfully.` });
      await fetchCompanies();
      if (onCompanyUpdated) await onCompanyUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete company' });
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.gst_no && c.gst_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-900/10 text-blue-900">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Companies & Organizations</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your registered corporate entities, official brand logos, and statutory information for payslips.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompany(null);
            setModalOpen(true);
          }}
          className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Alert Notice */}
      {feedback.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
          feedback.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company by name, city, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredCompanies.length}</span> of {companies.length} companies
        </div>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2">Loading companies...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No companies found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No company matches your search query.' : 'Add your first company or import an offer letter to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company) => {
            const logoUrl = company.logo_path ? `http://localhost:5000${company.logo_path}` : null;
            return (
              <div 
                key={company.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Header with Logo */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <div className="w-14 h-14 rounded-xl border border-slate-200 p-1 bg-white flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          <img
                            src={logoUrl}
                            alt={company.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                          {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate leading-snug" title={company.name}>
                          {company.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {company.city ? `${company.city}, ${company.state || ''}` : 'Location Unspecified'}
                        </p>
                      </div>
                    </div>

                    <span className="bg-blue-50 text-blue-900 border border-blue-200/50 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0">
                      ID #{company.id}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span>Assigned Employees: <strong className="text-slate-900">{company.employee_count || 0}</strong></span>
                    </div>

                    {company.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}

                    {company.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{company.phone}</span>
                      </div>
                    )}

                    {company.website && (
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-blue-600">{company.website}</span>
                      </div>
                    )}

                    {/* Tax Badges */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {company.gst_no && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          GST: {company.gst_no}
                        </span>
                      )}
                      {company.registration_no && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          REG: {company.registration_no}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  {onSelectCompanyEmployees && (
                    <button
                      onClick={() => onSelectCompanyEmployees(company.id)}
                      className="text-[11px] text-blue-900 font-bold hover:underline flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Employees</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => {
                        setEditingCompany(company);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Company"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id, company.name, company.employee_count || 0)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Company Modal */}
      {modalOpen && (
        <CompanyFormModal
          editingCompany={editingCompany}
          onClose={() => {
            setModalOpen(false);
            setEditingCompany(null);
          }}
          onSuccess={(savedCompany) => {
            setModalOpen(false);
            setEditingCompany(null);
            setFeedback({ 
              type: 'success', 
              text: `Company "${savedCompany.name}" saved successfully!` 
            });
            fetchCompanies();
            if (onCompanyUpdated) onCompanyUpdated(savedCompany);
          }}
        />
      )}
    </div>
  );
}
