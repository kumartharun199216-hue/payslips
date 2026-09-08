import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Layout, 
  Palette, 
  FileText, 
  Check,
  Star,
  Layers,
  Columns
} from 'lucide-react';
import { api } from '../../api';
import TemplateBuilderModal from './TemplateBuilderModal';
import VisualCanvasDesigner from './VisualCanvasDesigner';
import PayslipTemplate from '../PayslipTemplate';

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [visualDesignerOpen, setVisualDesignerOpen] = useState(false);
  const [visualDesignerTemplate, setVisualDesignerTemplate] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setBuilderOpen(true);
  };

  const handleEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setBuilderOpen(true);
  };

  const handleOpenVisualDesigner = (tmpl = null) => {
    setVisualDesignerTemplate(tmpl || templates.find(t => t.is_default) || templates[0] || null);
    setVisualDesignerOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingTemplate) {
      await api.updateTemplate(editingTemplate.id, formData);
    } else {
      await api.createTemplate(formData);
    }
    await fetchTemplates();
  };

  const handleSaveVisualLayout = async (layoutData) => {
    if (visualDesignerTemplate) {
      await api.updateTemplate(visualDesignerTemplate.id, layoutData);
    } else {
      await api.createTemplate(layoutData);
    }
    await fetchTemplates();
  };

  const handleSetDefault = async (id, name) => {
    try {
      await api.setDefaultTemplate(id);
      await fetchTemplates();
    } catch (err) {
      alert(`Error setting default template: ${err.message}`);
    }
  };

  const handleDelete = async (id, name, isDefault) => {
    if (isDefault) {
      alert('Cannot delete the default template. Please set another template as default first.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      return;
    }

    try {
      await api.deleteTemplate(id);
      await fetchTemplates();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dynamic Layout & Canvas Designer</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Payslip Templates & Layout Designer
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
              Design, customize, and arrange corporate payslip templates. Use visual drag-and-drop / Excel mode to decide exactly what appears where.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleOpenVisualDesigner(null)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition transform active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>Visual Canvas Designer (Excel Mode)</span>
            </button>

            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Template</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col overflow-hidden ${
                tmpl.is_default ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              {/* Header Visual Bar */}
              <div 
                className="h-20 p-4 flex justify-between items-start text-white relative overflow-hidden"
                style={{ backgroundColor: tmpl.theme_color || '#0f172a' }}
              >
                <div className="relative z-10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/70 block">
                    {tmpl.layout_type}
                  </span>
                  <h3 className="text-base font-black truncate max-w-[170px] text-white">
                    {tmpl.name}
                  </h3>
                </div>

                {tmpl.is_default && (
                  <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-500 min-h-[36px] line-clamp-2 leading-relaxed">
                  {tmpl.description || 'Custom corporate payslip layout with configurable blocks.'}
                </p>

                {/* Specs / Attributes */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Header Style</span>
                    <span className="font-bold text-slate-700 capitalize">{tmpl.header_style}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Brand Palette</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: tmpl.theme_color }}></span>
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: tmpl.accent_color }}></span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Attendance</span>
                    <span className="font-semibold text-slate-700">{tmpl.show_attendance ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Signatures</span>
                    <span className="font-semibold text-slate-700">{tmpl.show_signature_block ? 'Included' : 'Hidden'}</span>
                  </div>
                </div>

                {/* Visual Canvas Designer Launcher Button */}
                <button
                  onClick={() => handleOpenVisualDesigner(tmpl)}
                  className="w-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 hover:border-indigo-300"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customize Visual Layout</span>
                </button>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!tmpl.is_default ? (
                    <button
                      onClick={() => handleSetDefault(tmpl.id, tmpl.name)}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Set Default</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active Default</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tmpl)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                      title="Edit Template Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {templates.length > 1 && !tmpl.is_default && (
                      <button
                        onClick={() => handleDelete(tmpl.id, tmpl.name, tmpl.is_default)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Template Builder Modal */}
      {builderOpen && (
        <TemplateBuilderModal
          template={editingTemplate}
          isOpen={builderOpen}
          onClose={() => setBuilderOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Visual Canvas Designer (Excel/Paint Mode) */}
      {visualDesignerOpen && (
        <VisualCanvasDesigner
          template={visualDesignerTemplate}
          isOpen={visualDesignerOpen}
          onClose={() => setVisualDesignerOpen(false)}
          onSave={handleSaveVisualLayout}
        />
      )}
    </div>
  );
}
