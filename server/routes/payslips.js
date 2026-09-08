const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// DASHBOARD STATS
router.get('/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const totalEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'").get().count;
    const totalPayslips = db.prepare("SELECT COUNT(*) as count FROM payslips WHERE status = 'Active'").get().count;

    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[currentDate.getMonth()];
    const currentYearNum = currentDate.getFullYear();

    const payslipsThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM payslips
      WHERE pay_month = ? AND pay_year = ? AND status = 'Active'
    `).get(currentMonthName, currentYearNum).count;

    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(gross_salary), 0) as total_gross,
        COALESCE(SUM(total_deductions), 0) as total_deductions,
        COALESCE(SUM(net_salary), 0) as total_net
      FROM payslips
      WHERE status = 'Active'
    `).get();

    const recentPayslips = db.prepare(`
      SELECT p.*, e.name as employee_name, e.employee_code
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      ORDER BY p.id DESC
      LIMIT 5
    `).all();

    res.json({
      totalEmployees,
      totalPayslips,
      payslipsThisMonth,
      currentPayrollMonth: `${currentMonthName} ${currentYearNum}`,
      totalGrossSalary: totals.total_gross,
      totalDeductions: totals.total_deductions,
      totalNetSalary: totals.total_net,
      recentPayslips
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AUDIT LOGS
router.get('/audit-logs', authenticateToken, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200').all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PAYSLIPS
router.post('/payslips/check-duplicate', (req, res) => {
  try {
    const { employee_id, pay_month, pay_year } = req.body;
    if (!employee_id || !pay_month || !pay_year) {
      return res.status(400).json({ error: 'Employee ID, Pay Month, and Pay Year are required.' });
    }

    const existingPayslip = db.prepare(`
      SELECT * FROM payslips
      WHERE employee_id = ? AND pay_month = ? AND pay_year = ? AND status != 'Void'
      ORDER BY revision_number DESC LIMIT 1
    `).get(employee_id, pay_month, pay_year);

    if (existingPayslip) {
      return res.json({
        exists: true,
        payslip: existingPayslip,
        message: `A payslip already exists for this employee for ${pay_month} ${pay_year}.`
      });
    }

    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payslips', authenticateToken, (req, res) => {
  try {
    const {
      employee_id, pay_month, pay_year, generation_timestamp,
      working_days, paid_days, lop_days, gross_salary,
      total_deductions, net_salary, net_salary_words,
      earnings, deductions, is_revision
    } = req.body;

    if (!employee_id || !pay_month || !pay_year || gross_salary === undefined || net_salary === undefined) {
      return res.status(400).json({ error: 'Missing required payslip parameters.' });
    }

    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    let company = null;
    if (employee.company_id) {
      company = db.prepare('SELECT * FROM company WHERE id = ?').get(employee.company_id);
    }
    if (!company) {
      company = db.prepare('SELECT * FROM company ORDER BY id ASC LIMIT 1').get();
    }
    if (!company) return res.status(400).json({ error: 'Company profile not set up.' });

    const existingPayslips = db.prepare(`
      SELECT * FROM payslips
      WHERE employee_id = ? AND pay_month = ? AND pay_year = ? AND status != 'Void'
      ORDER BY revision_number DESC
    `).all(employee_id, pay_month, pay_year);

    let revisionNumber = 0;
    if (existingPayslips.length > 0) {
      if (!is_revision) {
        return res.status(409).json({
          error: `A payslip already exists for ${employee.name} for ${pay_month} ${pay_year}.`,
          existingPayslip: existingPayslips[0]
        });
      }
      revisionNumber = existingPayslips[0].revision_number + 1;
    }

    const monthShort = pay_month.substring(0, 3).toUpperCase();
    const revPrefix = revisionNumber > 0 ? `REV${revisionNumber}-` : '';
    const payslipNumber = `${revPrefix}PAY-${pay_year}${monthShort}-${employee.employee_code.replace(/[^a-zA-Z0-9]/g, '')}`;

    const timestampStr = generation_timestamp || new Date().toISOString();
    const pdfFilename = `Payslip_${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}_${pay_month}_${pay_year}.pdf`;

    const stmt = db.prepare(`
      INSERT INTO payslips (
        payslip_number, employee_id, company_id, pay_month, pay_year,
        generation_timestamp, working_days, paid_days, lop_days,
        gross_salary, total_deductions, net_salary, net_salary_words,
        revision_number, status, employee_snapshot_json, company_snapshot_json,
        earnings_snapshot_json, deductions_snapshot_json, pdf_filename
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      payslipNumber, employee_id, company.id, pay_month, pay_year,
      timestampStr, working_days || 30, paid_days || 30, lop_days || 0,
      gross_salary, total_deductions, net_salary, net_salary_words || '',
      revisionNumber, JSON.stringify(employee), JSON.stringify(company),
      JSON.stringify(earnings || []), JSON.stringify(deductions || []), pdfFilename
    );

    const payslipId = result.lastInsertRowid;

    logAudit(
      req.user.id, req.user.name,
      revisionNumber > 0 ? 'Payslip Revised' : 'Payslip Generated',
      'Payslip', String(payslipId),
      `Generated payslip #${payslipNumber} for ${employee.name} (${pay_month} ${pay_year}, Net: ₹${net_salary})`
    );

    const createdPayslip = db.prepare('SELECT * FROM payslips WHERE id = ?').get(payslipId);

    res.status(201).json({
      message: revisionNumber > 0 ? 'Replacement payslip revision created successfully.' : 'Payslip generated successfully.',
      payslip: {
        ...createdPayslip,
        employee: JSON.parse(createdPayslip.employee_snapshot_json),
        company: JSON.parse(createdPayslip.company_snapshot_json),
        earnings: JSON.parse(createdPayslip.earnings_snapshot_json),
        deductions: JSON.parse(createdPayslip.deductions_snapshot_json)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/payslips', (req, res) => {
  try {
    const { search, employee_id, pay_month, pay_year, department, status } = req.query;

    let query = `
      SELECT p.*, e.name as employee_name, e.employee_code, e.department
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (e.name LIKE ? OR e.employee_code LIKE ? OR p.payslip_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (employee_id) {
      query += ` AND p.employee_id = ?`;
      params.push(employee_id);
    }
    if (pay_month) {
      query += ` AND p.pay_month = ?`;
      params.push(pay_month);
    }
    if (pay_year) {
      query += ` AND p.pay_year = ?`;
      params.push(pay_year);
    }
    if (department) {
      query += ` AND e.department = ?`;
      params.push(department);
    }
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.id DESC`;

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/payslips/:id', (req, res) => {
  try {
    const payslip = db.prepare('SELECT * FROM payslips WHERE id = ?').get(req.params.id);
    if (!payslip) return res.status(404).json({ error: 'Payslip record not found.' });

    res.json({
      ...payslip,
      employee: JSON.parse(payslip.employee_snapshot_json || '{}'),
      company: JSON.parse(payslip.company_snapshot_json || '{}'),
      earnings: JSON.parse(payslip.earnings_snapshot_json || '[]'),
      deductions: JSON.parse(payslip.deductions_snapshot_json || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/payslips/:id', authenticateToken, (req, res) => {
  try {
    const payslip = db.prepare('SELECT * FROM payslips WHERE id = ?').get(req.params.id);
    if (!payslip) return res.status(404).json({ error: 'Payslip not found.' });

    db.prepare("UPDATE payslips SET status = 'Void', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    logAudit(req.user.id, req.user.name, 'Payslip Voided', 'Payslip', String(req.params.id), `Voided payslip #${payslip.payslip_number}`);

    res.json({ message: 'Payslip marked as void.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
