const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. EMPLOYEES CRUD
router.get('/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT e.*, c.name as company_name, c.logo_path as company_logo
      FROM employees e
      LEFT JOIN company c ON e.company_id = c.id
      ORDER BY e.name ASC
    `).all();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/employees/:id', (req, res) => {
  try {
    const employee = db.prepare(`
      SELECT e.*, c.name as company_name, c.logo_path as company_logo
      FROM employees e
      LEFT JOIN company c ON e.company_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    const salaryStructure = db.prepare('SELECT * FROM salary_structures WHERE employee_id = ?').get(req.params.id);
    let earnings = [];
    let deductions = [];
    if (salaryStructure) {
      try { earnings = JSON.parse(salaryStructure.earnings_json); } catch (e) {}
      try { deductions = JSON.parse(salaryStructure.deductions_json); } catch (e) {}
    }

    res.json({ ...employee, earnings, deductions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', authenticateToken, (req, res) => {
  try {
    const {
      employee_code, name, dob, gender, email, phone, address,
      designation, department, date_of_joining, employment_type,
      location, reporting_manager, bank_name, account_number,
      ifsc_code, pan, uan, pf_number, esic_number, status,
      company_id, earnings, deductions
    } = req.body;

    if (!employee_code || !name || !designation || !department || !date_of_joining) {
      return res.status(400).json({ error: 'Employee Code, Name, Designation, Department, and Date of Joining are required.' });
    }

    const existingCode = db.prepare('SELECT id FROM employees WHERE employee_code = ?').get(employee_code);
    if (existingCode) {
      return res.status(400).json({ error: `Employee Code ${employee_code} already exists.` });
    }

    // Default company_id if not selected
    let targetCompanyId = company_id;
    if (!targetCompanyId) {
      const defaultCompany = db.prepare('SELECT id FROM company ORDER BY id ASC LIMIT 1').get();
      targetCompanyId = defaultCompany ? defaultCompany.id : null;
    }

    const stmt = db.prepare(`
      INSERT INTO employees (
        employee_code, name, dob, gender, email, phone, address,
        designation, department, date_of_joining, employment_type,
        location, reporting_manager, bank_name, account_number,
        ifsc_code, pan, uan, pf_number, esic_number, status, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      employee_code, name, dob || '', gender || '', email || '', phone || '', address || '',
      designation, department, date_of_joining, employment_type || 'Full-Time',
      location || 'Head Office', reporting_manager || '', bank_name || '', account_number || '',
      ifsc_code || '', pan || '', uan || '', pf_number || '', esic_number || '', status || 'Active',
      targetCompanyId
    );

    const employeeId = info.lastInsertRowid;

    const defaultEarnings = earnings || [
      { name: 'Basic Salary', amount: 30000, type: 'Fixed', taxable: true, pf_calc: true },
      { name: 'HRA', amount: 12000, type: 'Fixed', taxable: true, pf_calc: false },
      { name: 'Special Allowance', amount: 8000, type: 'Fixed', taxable: true, pf_calc: false }
    ];
    const defaultDeductions = deductions || [
      { name: 'Employee PF', amount: 1800, type: 'Fixed', auto: true },
      { name: 'Professional Tax', amount: 200, type: 'Fixed', auto: true }
    ];

    db.prepare(`
      INSERT INTO salary_structures (employee_id, earnings_json, deductions_json)
      VALUES (?, ?, ?)
    `).run(employeeId, JSON.stringify(defaultEarnings), JSON.stringify(defaultDeductions));

    logAudit(req.user.id, req.user.name, 'Employee Created', 'Employee', String(employeeId), `Created employee profile: ${name} (${employee_code})`);

    const newEmp = db.prepare(`
      SELECT e.*, c.name as company_name, c.logo_path as company_logo
      FROM employees e
      LEFT JOIN company c ON e.company_id = c.id
      WHERE e.id = ?
    `).get(employeeId);
    res.status(201).json(newEmp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/employees/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_code, name, dob, gender, email, phone, address,
      designation, department, date_of_joining, employment_type,
      location, reporting_manager, bank_name, account_number,
      ifsc_code, pan, uan, pf_number, esic_number, status, company_id
    } = req.body;

    const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Employee not found.' });

    if (employee_code !== existing.employee_code) {
      const codeCheck = db.prepare('SELECT id FROM employees WHERE employee_code = ? AND id != ?').get(employee_code, id);
      if (codeCheck) {
        return res.status(400).json({ error: `Employee Code ${employee_code} is already used by another employee.` });
      }
    }

    const targetCompanyId = company_id !== undefined ? company_id : existing.company_id;

    db.prepare(`
      UPDATE employees SET
        employee_code = ?, name = ?, dob = ?, gender = ?, email = ?, phone = ?, address = ?,
        designation = ?, department = ?, date_of_joining = ?, employment_type = ?,
        location = ?, reporting_manager = ?, bank_name = ?, account_number = ?,
        ifsc_code = ?, pan = ?, uan = ?, pf_number = ?, esic_number = ?, status = ?,
        company_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      employee_code, name, dob || '', gender || '', email || '', phone || '', address || '',
      designation, department, date_of_joining, employment_type || 'Full-Time',
      location || 'Head Office', reporting_manager || '', bank_name || '', account_number || '',
      ifsc_code || '', pan || '', uan || '', pf_number || '', esic_number || '', status || 'Active',
      targetCompanyId, id
    );

    logAudit(req.user.id, req.user.name, 'Employee Updated', 'Employee', String(id), `Updated employee profile for ${name} (${employee_code})`);
    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/employees/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    // Cascade delete employee's payslips and salary structure, then permanently delete employee
    db.prepare('DELETE FROM payslips WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM salary_structures WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);

    logAudit(req.user.id, req.user.name, 'Employee Deleted', 'Employee', String(id), `Permanently deleted employee ${employee.name}`);
    res.json({ message: `Employee "${employee.name}" and associated records deleted permanently.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SALARY STRUCTURES
router.get('/salary-structures/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const structure = db.prepare('SELECT * FROM salary_structures WHERE employee_id = ?').get(employeeId);
    if (!structure) return res.json({ earnings: [], deductions: [] });

    res.json({
      id: structure.id,
      employee_id: structure.employee_id,
      earnings: JSON.parse(structure.earnings_json || '[]'),
      deductions: JSON.parse(structure.deductions_json || '[]'),
      updated_at: structure.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/salary-structures/:employeeId', authenticateToken, (req, res) => {
  try {
    const { employeeId } = req.params;
    const { earnings, deductions } = req.body;

    const emp = db.prepare('SELECT name, employee_code FROM employees WHERE id = ?').get(employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    const earningsJson = JSON.stringify(earnings || []);
    const deductionsJson = JSON.stringify(deductions || []);

    const existing = db.prepare('SELECT id FROM salary_structures WHERE employee_id = ?').get(employeeId);
    if (existing) {
      db.prepare('UPDATE salary_structures SET earnings_json = ?, deductions_json = ?, updated_at = CURRENT_TIMESTAMP WHERE employee_id = ?')
        .run(earningsJson, deductionsJson, employeeId);
    } else {
      db.prepare('INSERT INTO salary_structures (employee_id, earnings_json, deductions_json) VALUES (?, ?, ?)')
        .run(employeeId, earningsJson, deductionsJson);
    }

    logAudit(req.user.id, req.user.name, 'Salary Structure Updated', 'SalaryStructure', String(employeeId), `Updated salary components for ${emp.name}`);
    res.json({ message: 'Salary structure updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
