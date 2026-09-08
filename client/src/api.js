const API_BASE = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('payslip_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() }
    });
    return res.json();
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Multi-Company Management
  getCompanies: async () => {
    const res = await fetch(`${API_BASE}/companies`);
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  },

  getCompanyById: async (id) => {
    const res = await fetch(`${API_BASE}/companies/${id}`);
    if (!res.ok) throw new Error('Failed to fetch company details');
    return res.json();
  },

  createCompany: async (formData) => {
    // Accepts FormData (for multipart with logo) or regular object
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: isFormData ? { ...getAuthHeaders() } : { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: isFormData ? formData : JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create company');
    return data;
  },

  updateCompanyById: async (id, formData) => {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'PUT',
      headers: isFormData ? { ...getAuthHeaders() } : { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: isFormData ? formData : JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update company');
    return data;
  },

  deleteCompany: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/companies/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to delete company');
      err.canForce = data.canForce;
      err.assignedEmployees = data.assignedEmployees;
      throw err;
    }
    return data;
  },

  // Company Profile (Active/Default company)
  getCompany: async () => {
    const res = await fetch(`${API_BASE}/company`);
    if (!res.ok) throw new Error('Failed to fetch company profile');
    return res.json();
  },

  updateCompany: async (companyData) => {
    const res = await fetch(`${API_BASE}/company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(companyData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update company');
    return data;
  },

  uploadCompanyLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${API_BASE}/company/logo`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload logo');
    return data;
  },

  removeCompanyLogo: async () => {
    const res = await fetch(`${API_BASE}/company/logo`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove logo');
    return data;
  },

  // Employees
  getEmployees: async () => {
    const res = await fetch(`${API_BASE}/employees`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  getEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`);
    if (!res.ok) throw new Error('Failed to fetch employee');
    return res.json();
  },

  createEmployee: async (empData) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(empData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create employee');
    return data;
  },

  updateEmployee: async (id, empData) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(empData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update employee');
    return data;
  },

  deleteEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete employee');
    return data;
  },

  // Salary Structures
  getSalaryStructure: async (employeeId) => {
    const res = await fetch(`${API_BASE}/salary-structures/${employeeId}`);
    if (!res.ok) throw new Error('Failed to fetch salary structure');
    return res.json();
  },

  updateSalaryStructure: async (employeeId, structureData) => {
    const res = await fetch(`${API_BASE}/salary-structures/${employeeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(structureData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save salary structure');
    return data;
  },

  // Payslips
  checkDuplicatePayslip: async (employee_id, pay_month, pay_year) => {
    const res = await fetch(`${API_BASE}/payslips/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id, pay_month, pay_year })
    });
    if (!res.ok) throw new Error('Failed to check payslip existence');
    return res.json();
  },

  generatePayslip: async (payslipData) => {
    const res = await fetch(`${API_BASE}/payslips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payslipData)
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to generate payslip');
      err.existingPayslip = data.existingPayslip;
      throw err;
    }
    return data;
  },

  getPayslips: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/payslips?${query}`);
    if (!res.ok) throw new Error('Failed to fetch payslips');
    return res.json();
  },

  getPayslip: async (id) => {
    const res = await fetch(`${API_BASE}/payslips/${id}`);
    if (!res.ok) throw new Error('Failed to fetch payslip details');
    return res.json();
  },

  voidPayslip: async (id) => {
    const res = await fetch(`${API_BASE}/payslips/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to void payslip');
    return data;
  },

  // Audit Logs & Settings
  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data;
  },

  getBackupExportUrl: () => {
    return `${API_BASE}/backup/export`;
  },

  // Offer Letter Extractor & Ingestion
  parseOfferLetter: async (file, textContent) => {
    const formData = new FormData();
    if (file) formData.append('offer_letter', file);
    if (textContent) formData.append('text_content', textContent);

    const res = await fetch(`${API_BASE}/offer-letter/parse`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to parse offer letter');
    return data;
  },

  uploadAndSaveOfferLetter: async (file, textContent) => {
    const formData = new FormData();
    if (file) formData.append('offer_letter', file);
    if (textContent) formData.append('text_content', textContent);

    const res = await fetch(`${API_BASE}/offer-letter/upload-and-save`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process offer letter and save employee');
    return data;
  },

  // Dynamic Payslip Templates
  getTemplates: async () => {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Failed to fetch payslip templates');
    return res.json();
  },

  getTemplate: async (id) => {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch template');
    return res.json();
  },

  createTemplate: async (templateData) => {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(templateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create template');
    return data;
  },

  updateTemplate: async (id, templateData) => {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(templateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update template');
    return data;
  },

  deleteTemplate: async (id) => {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete template');
    return data;
  },

  setDefaultTemplate: async (id) => {
    const res = await fetch(`${API_BASE}/templates/${id}/set-default`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to set default template');
    return data;
  }
};
