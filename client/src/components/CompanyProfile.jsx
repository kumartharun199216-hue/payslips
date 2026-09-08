import React, { useState, useEffect } from 'react';
import { Building2, Upload, Trash2, RefreshCw, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';

export default function CompanyProfile({ company, onCompanyUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    registration_no: '',
    gst_no: '',
    pf_no: '',
    tan_no: '',
    other_info: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || 'India',
        zip_code: company.zip_code || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        registration_no: company.registration_no || '',
        gst_no: company.gst_no || '',
        pf_no: company.pf_no || '',
        tan_no: company.tan_no || '',
        other_info: company.other_info || ''
      });
      if (company.logo_path) {
        setLogoPreview(`http://localhost:5000${company.logo_path}`);
      } else {
        setLogoPreview(null);
      }
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side file type check
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid logo file format. Please upload PNG, JPG, JPEG, or SVG format.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo file size exceeds 5MB limit.' });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setMessage({ type: '', text: '' });
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.uploadCompanyLogo(logoFile);
      setLogoFile(null);
      setMessage({ type: 'success', text: 'Company logo uploaded and saved successfully.' });
      onCompanyUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload logo.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the company logo?')) return;
    setUploadingLogo(true);
    try {
      await api.removeCompanyLogo();
      setLogoFile(null);
      setLogoPreview(null);
      setMessage({ type: 'success', text: 'Company logo removed successfully.' });
      onCompanyUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove logo.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.updateCompany(formData);
      if (logoFile) {
        await handleUploadLogo();
      }
      setMessage({ type: 'success', text: 'Company information saved successfully.' });
      onCompanyUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save company profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Company Profile Management</h2>
            <p className="text-xs text-slate-500">Configure organization details, statutory IDs, and official company logo</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Logo Management Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
          Company Logo & Branding
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Logo Preview Box */}
          <div className="w-44 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2 bg-slate-50 relative shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-60" />
                <span className="text-[11px] block">No Logo Uploaded</span>
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1 text-xs">
            <p className="text-slate-600">
              Upload your official company logo. This logo will automatically appear on all generated corporate payslips and PDF exports.
            </p>
            <p className="text-slate-400 text-[11px]">
              Supported Formats: <span className="font-semibold text-slate-600">PNG, JPG, JPEG, SVG</span> (Max size: 5MB)
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-3.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{company?.logo_path ? 'Replace Logo' : 'Upload Logo'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
              </label>

              {logoFile && (
                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={uploadingLogo}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3.5 rounded-lg inline-flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${uploadingLogo ? 'animate-spin' : ''}`} />
                  <span>Save Upload</span>
                </button>
              )}

              {company?.logo_path && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold py-2 px-3.5 rounded-lg inline-flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Company Details Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
          Company Information & Registration Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 font-bold text-slate-900"
              placeholder="e.g. Acme Enterprise Solutions Pvt Ltd"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Company Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 text-slate-800"
              placeholder="Building, Street, Area"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="e.g. Bengaluru"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="e.g. Karnataka"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="e.g. India"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">PIN / ZIP Code</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="560103"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="+91 80 4123 4567"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="payroll@acmesolutions.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="https://acmesolutions.com"
            />
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 pt-2">
          Statutory Registration Numbers & Identifiers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Registration / CIN</label>
            <input
              type="text"
              name="registration_no"
              value={formData.registration_no}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 font-mono"
              placeholder="U72200KA2020PTC123456"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">GST Number (GSTIN)</label>
            <input
              type="text"
              name="gst_no"
              value={formData.gst_no}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 font-mono"
              placeholder="29AAAAA0000A1Z5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">PF Registration Number</label>
            <input
              type="text"
              name="pf_no"
              value={formData.pf_no}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 font-mono"
              placeholder="BG/BAN/0012345/000"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">TAN Number</label>
            <input
              type="text"
              name="tan_no"
              value={formData.tan_no}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 font-mono"
              placeholder="BLRA12345E"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Other Identifiers (ESIC, Lin, etc.)</label>
            <input
              type="text"
              name="other_info"
              value={formData.other_info}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
              placeholder="ESI Reg No: 31000123450000101"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Company Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
