import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CompanyProfile from './components/CompanyProfile';
import CompaniesManagement from './components/CompaniesManagement';
import EmployeeManagement from './components/EmployeeManagement';
import SalaryStructure from './components/SalaryStructure';
import PayslipGenerator from './components/PayslipGenerator';
import PayslipSuccess from './components/PayslipSuccess';
import PayslipHistory from './components/PayslipHistory';
import SettingsComponent from './components/Settings';
import TemplateManager from './components/templates/TemplateManager';
import PayslipTemplate from './components/PayslipTemplate';
import { api } from './api';
import { generatePayslipPdf } from './utils/pdfGenerator';
import { X, Download, Printer, ArrowLeft, Palette } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared Data
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Navigation targets & Modals
  const [salaryEmpId, setSalaryEmpId] = useState(null);
  const [generateEmpId, setGenerateEmpId] = useState(null);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');
  const [successPayslip, setSuccessPayslip] = useState(null);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCompanyAndEmployees();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('payslip_auth_token');
    if (!token) {
      setAuthChecked(true);
      return;
    }
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      localStorage.removeItem('payslip_auth_token');
    } finally {
      setAuthChecked(true);
    }
  };

  const fetchCompanyAndEmployees = async () => {
    try {
      const [comp, emps, comps, tmpls] = await Promise.all([
        api.getCompany(),
        api.getEmployees(),
        api.getCompanies(),
        api.getTemplates()
      ]);
      setCompany(comp);
      setEmployees(emps);
      setCompanies(comps);
      setTemplates(tmpls || []);
      if (!selectedTemplate && tmpls && tmpls.length > 0) {
        const defaultTmpl = tmpls.find(t => t.is_default) || tmpls[0];
        setSelectedTemplate(defaultTmpl);
      }
    } catch (e) {
      console.error('Failed to fetch application data:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('payslip_auth_token');
    setUser(null);
  };

  // Nav Handlers
  const handleSelectEmployeeToSalary = (empId) => {
    setSalaryEmpId(empId);
    setActiveTab('salary-structure');
  };

  const handleSelectEmployeeToGenerate = (empId) => {
    setGenerateEmpId(empId);
    setActiveTab('generate');
  };

  const handlePayslipGenerated = (payslip) => {
    setSuccessPayslip(payslip);
    setActiveTab('generate-success');
    fetchCompanyAndEmployees(); // Refresh stats
  };

  const handleSelectPayslipToView = async (id) => {
    try {
      const payslip = await api.getPayslip(id);
      setViewingPayslip(payslip);
    } catch (err) {
      alert(err.message || 'Failed to fetch payslip details.');
    }
  };

  const handleDownloadPdf = async (payslip) => {
    setDownloading(true);
    try {
      let payslipObj = payslip;
      if (!payslip.employee && payslip.id) {
        payslipObj = await api.getPayslip(payslip.id);
      }
      setViewingPayslip(payslipObj);

      const empName = (payslipObj.employee?.name || payslipObj.employee_snapshot?.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const month = payslipObj.pay_month || 'Month';
      const year = payslipObj.pay_year || 'Year';
      const filename = `Payslip_${empName}_${month}_${year}.pdf`;

      // Wait for printable element to be ready in DOM
      const elem = await new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          const el = document.getElementById('printable-payslip');
          if (el || attempts > 25) {
            clearInterval(interval);
            resolve(el);
          }
          attempts++;
        }, 50);
      });

      if (elem) {
        await generatePayslipPdf(elem, filename);
      } else {
        alert('Could not render payslip element for PDF download.');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation error: ' + (err.message || 'Failed to export PDF'));
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPayslip = async (id) => {
    try {
      const payslip = await api.getPayslip(id);
      setViewingPayslip(payslip);
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err) {
      alert('Print error: ' + err.message);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => { setUser(u); fetchCompanyAndEmployees(); }} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab === 'generate-success' ? 'generate' : activeTab}
        setActiveTab={(tab) => {
          setSuccessPayslip(null);
          setActiveTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
        company={company}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSuccessPayslip(null);
            setActiveTab(tab);
          }}
          user={user}
          company={company}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onSelectPayslipToView={handleSelectPayslipToView}
            />
          )}

          {(activeTab === 'companies' || activeTab === 'company') && (
            <CompaniesManagement
              onCompanyUpdated={fetchCompanyAndEmployees}
              onSelectCompanyEmployees={(companyId) => {
                setSelectedCompanyFilter(companyId);
                setActiveTab('employees');
              }}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement
              companies={companies}
              initialCompanyFilter={selectedCompanyFilter}
              onSelectEmployeeToSalary={handleSelectEmployeeToSalary}
              onSelectEmployeeToGenerate={handleSelectEmployeeToGenerate}
              onEmployeeAdded={fetchCompanyAndEmployees}
              onEmployeeDeleted={fetchCompanyAndEmployees}
              onCompanyUpdated={fetchCompanyAndEmployees}
              onPayslipGenerated={handlePayslipGenerated}
              onDownloadPdf={handleDownloadPdf}
              onViewPayslip={(p) => setViewingPayslip(p)}
            />
          )}

          {activeTab === 'salary-structure' && (
            <SalaryStructure
              initialEmployeeId={salaryEmpId}
              employees={employees}
              onStructureSaved={fetchCompanyAndEmployees}
            />
          )}

          {activeTab === 'generate' && (
            <PayslipGenerator
              employees={employees}
              company={company}
              companies={companies}
              initialEmployeeId={generateEmpId}
              onCompanyUpdated={fetchCompanyAndEmployees}
              onEmployeeAdded={fetchCompanyAndEmployees}
              onPayslipGenerated={handlePayslipGenerated}
              onNavigateToHistory={() => setActiveTab('history')}
              onSelectPayslipToView={handleSelectPayslipToView}
              onDownloadPdf={handleDownloadPdf}
            />
          )}

          {activeTab === 'generate-success' && successPayslip && (
            <PayslipSuccess
              payslip={successPayslip}
              onViewPayslip={(p) => setViewingPayslip(p)}
              onDownloadPdf={handleDownloadPdf}
              onGenerateAnother={() => setActiveTab('generate')}
              onGoToHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'history' && (
            <PayslipHistory
              employees={employees}
              onSelectPayslipToView={handleSelectPayslipToView}
              onDownloadPdf={handleDownloadPdf}
              onPrintPayslip={handlePrintPayslip}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateManager />
          )}

          {activeTab === 'settings' && (
            <SettingsComponent />
          )}
        </main>
      </div>

      {/* Full-Screen View Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 md:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto relative">
            {/* Modal Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 no-print shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Payslip #{viewingPayslip.payslip_number}
                </span>

                {/* Template Dynamic Switcher */}
                {templates.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg ml-2">
                    <Palette className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline">Layout:</span>
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const t = templates.find(item => String(item.id) === e.target.value);
                        if (t) setSelectedTemplate(t);
                      }}
                      className="text-xs bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.is_default ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleDownloadPdf(viewingPayslip)}
                  disabled={downloading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => setViewingPayslip(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Document with Selected Dynamic Template */}
            <PayslipTemplate 
              payslip={viewingPayslip} 
              template={selectedTemplate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
