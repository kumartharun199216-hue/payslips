import React, { useState } from 'react';
import { Building2, Upload, X, AlertCircle } from 'lucide-react';
import { api } from '../../api';

export default function CompanyFormModal({ editingCompany, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: editingCompany?.name || '',
    address: editingCompany?.address || '',
    city: editingCompany?.city || '',
    state: editingCompany?.state || '',
    country: editingCompany?.country || 'India',
    zip_code: editingCompany?.zip_code || '',
    phone: editingCompany?.phone || '',
    email: editingCompany?.email || '',
    website: editingCompany?.website || '',
    registration_no: editingCompany?.registration_no || '',
    gst_no: editingCompany?.gst_no || '',
    pf_no: editingCompany?.pf_no || '',
    tan_no: editingCompany?.tan_no || '',
    other_info: editingCompany?.other_info || ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(
    editingCompany?.logo_path ? `http://localhost:5000${editingCompany.logo_path}` : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key] || '');
      });
      if (logoFile) {
        data.append('logo', logoFile);
      }

      let res;
      if (editingCompany) {
        res = await api.updateCompanyById(editingCompany.id, data);
      } else {
        res = await api.createCompany(data);
      }
      onSuccess(res.company);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-900" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {editingCompany ? `Edit Company: ${editingCompany.name}` : 'Add New Company'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Logo Uploader */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-300" />
              )}
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <label className="block font-bold text-slate-800 text-xs">Company Logo</label>
              <p className="text-[11px] text-slate-500">
                Upload your exact corporate logo (PNG, JPG, or SVG). Will appear in full original colors on all payslips.
              </p>
              <input
                type="file"
                id="company-logo-input"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="company-logo-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-xs cursor-pointer mt-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{logoPreview ? 'Change Logo Image' : 'Choose Logo File'}</span>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">1. Organization Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Acme Technologies Private Limited"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Registration / CIN</label>
                <input
                  type="text"
                  name="registration_no"
                  placeholder="e.g. U72200KA2020PTC123456"
                  value={formData.registration_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  name="gst_no"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={formData.gst_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">2. Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="payroll@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 80 4123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Website URL</label>
                <input
                  type="text"
                  name="website"
                  placeholder="https://company.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">3. Corporate Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Building, Plot, Tech Park, Street"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Bengaluru"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  placeholder="Karnataka"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Postal Code (PIN)</label>
                <input
                  type="text"
                  name="zip_code"
                  placeholder="560103"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Statutory */}
          <div>
            <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 border-b pb-1">4. Payroll Statutory IDs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">PF Establishment Code</label>
                <input
                  type="text"
                  name="pf_no"
                  placeholder="e.g. BG/BAN/0012345/000"
                  value={formData.pf_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">TAN Number</label>
                <input
                  type="text"
                  name="tan_no"
                  placeholder="e.g. BLRA12345E"
                  value={formData.tan_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingCompany ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
