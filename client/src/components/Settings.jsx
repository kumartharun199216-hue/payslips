import React, { useState, useEffect } from 'react';
import { Settings, Shield, Download, Save, CheckCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { api } from '../api';
import { formatDateTime } from '../utils/formatters';

export default function SettingsComponent() {
  const [settings, setSettings] = useState({
    currency_symbol: '₹',
    currency_code: 'INR',
    default_working_days: '30',
    auto_pf_rate: '12',
    auto_esi_rate: '0.75'
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sets, logs] = await Promise.all([
        api.getSettings(),
        api.getAuditLogs()
      ]);
      if (sets && Object.keys(sets).length > 0) {
        setSettings((prev) => ({ ...prev, ...sets }));
      }
      setAuditLogs(logs || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.updateSettings(settings);
      setMessage({ type: 'success', text: 'System settings saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = () => {
    window.location.href = api.getBackupExportUrl();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">System Settings & Audit Log</h2>
            <p className="text-xs text-slate-500">Configure global application parameters, statutory defaults, backup database, and track audit events</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Application Defaults</h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Currency Symbol</label>
                <input
                  type="text"
                  name="currency_symbol"
                  value={settings.currency_symbol}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Currency Code</label>
                <input
                  type="text"
                  name="currency_code"
                  value={settings.currency_code}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Default Working Days Per Month</label>
                <input
                  type="number"
                  name="default_working_days"
                  value={settings.default_working_days}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Auto PF Statutory Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="auto_pf_rate"
                  value={settings.auto_pf_rate}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2.5 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backup & Reliable Export */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Backup & Reliability</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Download a full JSON database snapshot containing company records, employees, salary structures, payslips, and audit logs.
          </p>

          <button
            onClick={handleExportBackup}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Database Backup</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>System Audit Trail & Event Logs</span>
          </h3>
          <button
            onClick={fetchData}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700 font-sans">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{log.user_name || 'System'}</td>
                    <td className="py-2 px-3 font-bold text-blue-900">{log.action}</td>
                    <td className="py-2 px-3 text-slate-500">{log.entity} #{log.entity_id}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
