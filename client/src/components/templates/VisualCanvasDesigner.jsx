import React, { useState } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Columns, 
  Palette, 
  Save, 
  RotateCcw, 
  Eye, 
  Sparkles,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  Layers,
  FileCheck2
} from 'lucide-react';
import PayslipTemplate, { DEFAULT_BLOCKS } from '../PayslipTemplate';

const BLOCK_DEFINITIONS = [
  { type: 'company_header', title: 'Company Header & Logo', icon: '🏢', defaultWidth: '100%' },
  { type: 'statutory_bar', title: 'CIN / GSTIN / TAN Bar', icon: '📋', defaultWidth: '100%' },
  { type: 'employee_details', title: 'Employee Information', icon: '👤', defaultWidth: '50%' },
  { type: 'bank_details', title: 'Bank & Statutory Details', icon: '🏦', defaultWidth: '50%' },
  { type: 'attendance', title: 'Attendance & Leave Card', icon: '📅', defaultWidth: '100%' },
  { type: 'salary_table', title: 'Earnings & Deductions Table', icon: '💰', defaultWidth: '100%' },
  { type: 'net_pay_banner', title: 'Net Pay Highlight Card', icon: '💵', defaultWidth: '100%' },
  { type: 'signatures', title: 'Signatures & Acceptance', icon: '✍️', defaultWidth: '100%' },
  { type: 'custom_text', title: 'Custom Freeform Text Box', icon: '📝', defaultWidth: '100%' },
  { type: 'divider', title: 'Accent Rule Divider', icon: '➖', defaultWidth: '100%' },
  { type: 'footer_notes', title: 'Footer Disclaimer & Timestamp', icon: '🛡️', defaultWidth: '100%' }
];

export default function VisualCanvasDesigner({ 
  template, 
  isOpen, 
  onClose, 
  onSave 
}) {
  if (!isOpen) return null;

  let initialBlocks = DEFAULT_BLOCKS;
  if (template?.layout_config_json) {
    try {
      const parsed = typeof template.layout_config_json === 'string' 
        ? JSON.parse(template.layout_config_json) 
        : template.layout_config_json;
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialBlocks = parsed;
      }
    } catch (e) {
      initialBlocks = DEFAULT_BLOCKS;
    }
  }

  const [blocks, setBlocks] = useState(initialBlocks);
  const [templateName, setTemplateName] = useState(template?.name || 'Custom Visual Layout');
  const [themeColor, setThemeColor] = useState(template?.theme_color || '#0f172a');
  const [accentColor, setAccentColor] = useState(template?.accent_color || '#2563eb');
  const [watermark, setWatermark] = useState(template?.watermark_text || '');
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'palette'
  const [submitting, setSubmitting] = useState(false);

  // Mock preview data
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
    name: 'Boda Buchi Babu',
    employee_code: 'REF-NY-EM14297',
    designation: 'Software Engineer',
    department: 'Engineering',
    date_of_joining: '2026-06-29',
    employment_type: 'Full-Time',
    bank_name: 'HDFC Bank',
    account_number: '5010049281920',
    ifsc_code: 'HDFC0001234',
    pan: 'ABCDE1234F',
    uan: '100928374619'
  };

  const sampleEarnings = [
    { name: 'Basic Salary', amount: 16667 },
    { name: 'House Rent Allowance (HRA)', amount: 8333 },
    { name: 'Special Allowance', amount: 8333 }
  ];

  const sampleDeductions = [
    { name: 'Employee PF', amount: 1800 },
    { name: 'Professional Tax', amount: 200 }
  ];

  const samplePayslip = {
    payslip_number: 'PAY-2026JUN-NY14297',
    pay_month: 'June',
    pay_year: 2026,
    gross_salary: 33333,
    total_deductions: 2000,
    net_salary: 31333,
    net_salary_words: 'Thirty One Thousand Three Hundred and Thirty Three Rupees Only',
    working_days: 30,
    paid_days: 30,
    lop_days: 0,
    generation_timestamp: new Date().toISOString()
  };

  // Move Block Up
  const moveUp = (index) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index - 1];
    newBlocks[index - 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
  };

  // Move Block Down
  const moveDown = (index) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index + 1];
    newBlocks[index + 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
  };

  // Toggle Block Width (100% <-> 50%)
  const toggleWidth = (index) => {
    const newBlocks = [...blocks];
    const current = newBlocks[index];
    newBlocks[index] = {
      ...current,
      width: current.width === '50%' ? '100%' : '50%'
    };
    setBlocks(newBlocks);
  };

  // Delete Block
  const deleteBlock = (index) => {
    if (blocks.length <= 1) {
      alert('Must keep at least 1 section on the payslip.');
      return;
    }
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    setBlocks(newBlocks);
  };

  // Add New Block from Definition
  const addBlock = (def) => {
    const newId = `b_${def.type}_${Date.now()}`;
    const newBlock = {
      id: newId,
      type: def.type,
      title: def.title,
      width: def.defaultWidth,
      align: 'split',
      showLogo: true,
      showAddress: true,
      showContacts: true,
      content: def.type === 'custom_text' ? 'Enter corporate policy, performance remarks, or employee terms here...' : '',
      color: themeColor
    };
    setBlocks([...blocks, newBlock]);
  };

  // Update Block property
  const updateBlockProp = (index, prop, value) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], [prop]: value };
    setBlocks(newBlocks);
  };

  // Reset to Standard Excel Layout
  const handleReset = () => {
    if (window.confirm('Reset this layout back to the standard corporate structure?')) {
      setBlocks(DEFAULT_BLOCKS);
    }
  };

  // Save Layout
  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSave({
        name: templateName,
        theme_color: themeColor,
        accent_color: accentColor,
        watermark_text: watermark,
        layout_config_json: blocks
      });
      onClose();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const previewTemplateConfig = {
    name: templateName,
    theme_color: themeColor,
    accent_color: accentColor,
    watermark_text: watermark,
    layout_config_json: blocks
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[260px]"
                placeholder="Template Name"
              />
              <span className="text-[11px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/20">
                Visual Excel/Paint Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Drag, reorder, resize, and position any block anywhere on the A4 page sheet.
            </p>
          </div>
        </div>

        {/* Brand Theme Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">Theme:</span>
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-6 w-8 rounded border-0 cursor-pointer p-0 bg-transparent"
              title="Change Theme Color"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="font-semibold text-slate-300">Accent:</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-6 w-8 rounded border-0 cursor-pointer p-0 bg-transparent"
              title="Change Accent Color"
            />
          </div>

          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1"
            title="Reset to default grid layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Visual Layout'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Split Layout: Toolbox/Structure Left (4 cols) & Visual A4 Canvas Right (8 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950">
        
        {/* Left Sidebar: Toolbox & Block Ordering Controller (5 cols) */}
        <div className="lg:col-span-5 p-5 border-r border-slate-800 bg-slate-900/90 overflow-y-auto flex flex-col space-y-4">
          
          {/* Add Section Toolbox Dropdown / Pills */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Toolbox: Add Block Anywhere</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BLOCK_DEFINITIONS.map((def) => (
                <button
                  key={def.type}
                  onClick={() => addBlock(def)}
                  className="bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-slate-600 hover:border-blue-500 shadow-sm"
                >
                  <span>{def.icon}</span>
                  <span>{def.title.split(' ')[0]}</span>
                  <Plus className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Canvas Blocks (Interactive Reordering List) */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              <span>Canvas Structure ({blocks.length} Sections)</span>
              <span className="text-[10px] text-slate-500 font-mono">Top to Bottom Order</span>
            </div>

            <div className="space-y-2">
              {blocks.map((block, idx) => (
                <div 
                  key={block.id || idx}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-blue-500/50 transition group space-y-2"
                >
                  {/* Top Bar: Title & Move Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-white truncate">
                        {block.title || block.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        block.width === '50%' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {block.width === '50%' ? '50% Half' : '100% Full'}
                      </span>
                    </div>

                    {/* Actions: Up, Down, Width, Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700"
                        title="Move Section Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === blocks.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700"
                        title="Move Section Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleWidth(idx)}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded border transition ${
                          block.width === '50%' 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white'
                        }`}
                        title="Toggle Width between 100% and 50% (side-by-side)"
                      >
                        <Columns className="w-3 h-3 inline mr-1" />
                        {block.width === '50%' ? '50%' : '100%'}
                      </button>

                      <button
                        onClick={() => deleteBlock(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/30 transition"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Block Configuration Options */}
                  {block.type === 'company_header' && (
                    <div className="pt-2 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-[11px]">
                      <select
                        value={block.align || 'split'}
                        onChange={(e) => updateBlockProp(idx, 'align', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-semibold focus:outline-none"
                      >
                        <option value="split">Split Header</option>
                        <option value="centered">Centered</option>
                        <option value="banner">Full Banner</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={block.showLogo ?? true}
                          onChange={(e) => updateBlockProp(idx, 'showLogo', e.target.checked)}
                          className="rounded border-slate-600 text-blue-600"
                        />
                        <span>Logo</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={block.showAddress ?? true}
                          onChange={(e) => updateBlockProp(idx, 'showAddress', e.target.checked)}
                          className="rounded border-slate-600 text-blue-600"
                        />
                        <span>Address</span>
                      </label>
                    </div>
                  )}

                  {block.type === 'custom_text' && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlockProp(idx, 'title', e.target.value)}
                        placeholder="Block Title (e.g. Terms, Bonus Details, Performance Notes)"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <textarea
                        rows={2}
                        value={block.content || ''}
                        onChange={(e) => updateBlockProp(idx, 'content', e.target.value)}
                        placeholder="Type custom text to appear directly in this section on the payslip..."
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Interactive WYSIWYG A4 Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/50 p-4 md:p-6 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-4xl flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              WYSIWYG A4 Canvas Sheet (Real-Time Render)
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              Width: 210mm (A4 Portrait)
            </span>
          </div>

          {/* Render Actual Payslip Template in Configured Order */}
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/80 transform scale-[0.92] origin-top">
            <PayslipTemplate
              payslip={samplePayslip}
              company={sampleCompany}
              employee={sampleEmployee}
              earnings={sampleEarnings}
              deductions={sampleDeductions}
              template={previewTemplateConfig}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
