import React, { useState } from 'react';
import { X, Sparkles, Palette, Layout, Sliders, Check, FileText } from 'lucide-react';
import PayslipTemplate from '../PayslipTemplate';

const PRESET_PALETTES = [
  { name: 'Corporate Navy', theme: '#0f172a', accent: '#2563eb' },
  { name: 'Royal Blue', theme: '#1e3a8a', accent: '#3b82f6' },
  { name: 'Tech Emerald', theme: '#065f46', accent: '#059669' },
  { name: 'Executive Crimson', theme: '#881337', accent: '#e11d48' },
  { name: 'Modern Violet', theme: '#581c87', accent: '#9333ea' },
  { name: 'Graphite Dark', theme: '#18181b', accent: '#71717a' },
  { name: 'Warm Amber', theme: '#78350f', accent: '#d97706' }
];

export default function TemplateBuilderModal({ 
  template = null, 
  isOpen, 
  onClose, 
  onSave 
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    theme_color: template?.theme_color || '#0f172a',
    accent_color: template?.accent_color || '#2563eb',
    layout_type: template?.layout_type || 'modern',
    header_style: template?.header_style || 'split',
    show_company_logo: template ? Boolean(template.show_company_logo) : true,
    show_bank_details: template ? Boolean(template.show_bank_details) : true,
    show_statutory_ids: template ? Boolean(template.show_statutory_ids) : true,
    show_attendance: template ? Boolean(template.show_attendance) : true,
    show_signature_block: template ? Boolean(template.show_signature_block) : true,
    watermark_text: template?.watermark_text || '',
    footer_notes: template?.footer_notes || 'This is a computer-generated payslip and does not require a physical signature.',
    is_default: template ? Boolean(template.is_default) : false
  });

  const [activeTab, setActiveTab] = useState('style'); // 'style' | 'layout' | 'sections'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sample mock data for live interactive preview
  const sampleCompany = {
    name: 'ACME TECHNOLOGIES PVT LTD',
    address: 'Plot 42, Outer Ring Road, Cyber City',
    city: 'Bengaluru',
    state: 'Karnataka',
    zip_code: '560103',
    country: 'India',
    phone: '+91 80 4123 4567',
    email: 'payroll@acmetech.com',
    registration_no: 'U72200KA2024PTC123456',
    gst_no: '29ABCDE1234F1Z5'
  };

  const sampleEmployee = {
    name: 'Rahul Sharma',
    employee_code: 'EMP-1082',
    designation: 'Senior Software Engineer',
    department: 'Engineering',
    date_of_joining: '2025-01-15',
    employment_type: 'Full-Time',
    bank_name: 'HDFC Bank',
    account_number: '5010049281920',
    ifsc_code: 'HDFC0001234',
    pan: 'ABCDE1234F',
    uan: '100928374619'
  };

  const sampleEarnings = [
    { name: 'Basic Salary', amount: 50000 },
    { name: 'House Rent Allowance (HRA)', amount: 25000 },
    { name: 'Special Allowance', amount: 15000 }
  ];

  const sampleDeductions = [
    { name: 'Employee PF', amount: 1800 },
    { name: 'Professional Tax', amount: 200 }
  ];

  const samplePayslip = {
    payslip_number: 'PAY-2026-DEMO',
    pay_month: 'June',
    pay_year: 2026,
    gross_salary: 90000,
    total_deductions: 2000,
    net_salary: 88000,
    net_salary_words: 'Eighty Eight Thousand Rupees Only',
    working_days: 30,
    paid_days: 30,
    lop_days: 0,
    generation_timestamp: new Date().toISOString()
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Template name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save template.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {template ? 'Edit Payslip Template' : 'Create Dynamic Payslip Template'}
              </h2>
              <p className="text-xs text-slate-500">
                Customize branding colors, structural layout, and section toggles with real-time preview.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two-Column Editor & Live Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Form Controls (5 cols) */}
          <div className="lg:col-span-5 p-6 border-r border-slate-200 overflow-y-auto space-y-5 bg-white">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            {/* Template Identity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Modern Corporate Blue, Tech Emerald"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description of this design..."
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`flex-1 py-2 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'style' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colors</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`flex-1 py-2 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'layout' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Layout</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`flex-1 py-2 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'sections' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Toggles</span>
              </button>
            </div>

            {/* Tab 1: Color Themes */}
            {activeTab === 'style' && (
              <div className="space-y-4 pt-1">
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-2">Preset Corporate Palettes</span>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_PALETTES.map((pal) => (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme_color: pal.theme, accent_color: pal.accent })}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 text-xs transition ${
                          formData.theme_color === pal.theme ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: pal.theme }}>
                          {formData.theme_color === pal.theme && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-semibold text-slate-800 truncate">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Theme Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.theme_color}
                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                        className="h-8 w-10 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.theme_color}
                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                        className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Accent Highlight</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                        className="h-8 w-10 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                        className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Optional Watermark Text</label>
                  <input
                    type="text"
                    value={formData.watermark_text}
                    onChange={(e) => setFormData({ ...formData, watermark_text: e.target.value })}
                    placeholder="e.g. CONFIDENTIAL, OFFICIAL, DRAFT"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Layout Type & Header */}
            {activeTab === 'layout' && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Base Structural Layout</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'modern', label: 'Modern Corporate', desc: 'Soft cards & pill badges' },
                      { id: 'executive', label: 'Executive Sleek', desc: 'Bold banner & executive frame' },
                      { id: 'classic', label: 'Classic Formal', desc: 'Traditional accounting ledger' },
                      { id: 'minimalist', label: 'Minimalist Slate', desc: 'Clean high-density typography' }
                    ].map((lay) => (
                      <button
                        key={lay.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, layout_type: lay.id })}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          formData.layout_type === lay.id ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900 block">{lay.label}</span>
                        <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{lay.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Header Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'split', label: 'Split (Left/Right)' },
                      { id: 'centered', label: 'Centered' },
                      { id: 'banner', label: 'Full Banner' }
                    ].map((hdr) => (
                      <button
                        key={hdr.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, header_style: hdr.id })}
                        className={`p-2 rounded-lg border text-center text-xs font-semibold transition ${
                          formData.header_style === hdr.id ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 text-blue-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {hdr.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Footer Disclaimer Note</label>
                  <textarea
                    rows={2}
                    value={formData.footer_notes}
                    onChange={(e) => setFormData({ ...formData, footer_notes: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Section Visibility Toggles */}
            {activeTab === 'sections' && (
              <div className="space-y-3 pt-1">
                {[
                  { key: 'show_company_logo', label: 'Show Company Logo', desc: 'Render corporate emblem or logo on header' },
                  { key: 'show_bank_details', label: 'Show Bank & Statutory Details', desc: 'Display Account No, IFSC, PAN, UAN grid' },
                  { key: 'show_statutory_ids', label: 'Show Company Reg & GST Numbers', desc: 'Display CIN, GSTIN, and TAN banner' },
                  { key: 'show_attendance', label: 'Show Attendance & Leave Summary', desc: 'Display Working Days, Paid Days, LOP' },
                  { key: 'show_signature_block', label: 'Show Signatures & Acceptance', desc: 'Authorized Signatory and Employee Signature lines' }
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={formData[toggle.key]}
                      onChange={(e) => setFormData({ ...formData, [toggle.key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{toggle.label}</span>
                      <span className="text-[11px] text-slate-500 block leading-tight">{toggle.desc}</span>
                    </div>
                  </label>
                ))}

                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-900">Set as Organization Default Template</span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Live Preview (7 cols) */}
          <div className="lg:col-span-7 bg-slate-100 p-4 md:p-6 overflow-y-auto flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Template Preview
              </span>
              <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                A4 Scaled View
              </span>
            </div>

            {/* Scaled Preview Frame */}
            <div className="w-full bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden transform scale-[0.85] origin-top">
              <PayslipTemplate
                payslip={samplePayslip}
                company={sampleCompany}
                employee={sampleEmployee}
                earnings={sampleEarnings}
                deductions={sampleDeductions}
                template={formData}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
