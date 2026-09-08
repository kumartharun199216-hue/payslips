const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, logAudit } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `company_logo_${Date.now()}${ext}`);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPG, JPEG, and SVG files are allowed.'));
  }
});

// AUTH
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  logAudit(user.id, user.name, 'User Login', 'User', user.id, `User ${user.name} logged in successfully.`);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// MULTI-COMPANY MANAGEMENT
router.get('/companies', (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT c.*, COUNT(e.id) as employee_count
      FROM company c
      LEFT JOIN employees e ON e.company_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/companies/:id', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company WHERE id = ?').get(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found.' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/companies', authenticateToken, logoUpload.single('logo'), (req, res) => {
  try {
    const {
      name, address, city, state, country, zip_code, phone,
      email, website, registration_no, gst_no, pf_no, tan_no, other_info
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Company Name is required.' });
    }

    const relativeLogoPath = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const info = db.prepare(`
      INSERT INTO company (
        name, logo_path, address, city, state, country, zip_code, phone,
        email, website, registration_no, gst_no, pf_no, tan_no, other_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(), relativeLogoPath, address || '', city || '', state || '', country || 'India',
      zip_code || '', phone || '', email || '', website || '', registration_no || '',
      gst_no || '', pf_no || '', tan_no || '', other_info || ''
    );

    const createdCompany = db.prepare('SELECT * FROM company WHERE id = ?').get(info.lastInsertRowid);
    logAudit(req.user.id, req.user.name, 'Company Created', 'Company', info.lastInsertRowid, `Created new company: ${name}`);
    res.status(201).json({ message: 'Company created successfully.', company: createdCompany });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/companies/:id', authenticateToken, logoUpload.single('logo'), (req, res) => {
  try {
    const companyId = req.params.id;
    const existing = db.prepare('SELECT * FROM company WHERE id = ?').get(companyId);
    if (!existing) return res.status(404).json({ error: 'Company not found.' });

    const {
      name, address, city, state, country, zip_code, phone,
      email, website, registration_no, gst_no, pf_no, tan_no, other_info
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Company Name is required.' });
    }

    let logoPath = existing.logo_path;
    if (req.file) {
      // Remove old file if replaced
      if (existing.logo_path) {
        const oldFile = path.join(__dirname, '..', existing.logo_path);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) {}
        }
      }
      logoPath = `/uploads/logos/${req.file.filename}`;
    }

    db.prepare(`
      UPDATE company SET
        name = ?, logo_path = ?, address = ?, city = ?, state = ?, country = ?, zip_code = ?,
        phone = ?, email = ?, website = ?, registration_no = ?, gst_no = ?,
        pf_no = ?, tan_no = ?, other_info = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(), logoPath, address || '', city || '', state || '', country || 'India',
      zip_code || '', phone || '', email || '', website || '', registration_no || '',
      gst_no || '', pf_no || '', tan_no || '', other_info || '', companyId
    );

    const updatedCompany = db.prepare('SELECT * FROM company WHERE id = ?').get(companyId);
    logAudit(req.user.id, req.user.name, 'Company Updated', 'Company', companyId, `Updated company profile: ${name}`);
    res.json({ message: 'Company updated successfully.', company: updatedCompany });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/companies/:id', authenticateToken, (req, res) => {
  try {
    const companyId = req.params.id;
    const existing = db.prepare('SELECT * FROM company WHERE id = ?').get(companyId);
    if (!existing) return res.status(404).json({ error: 'Company not found.' });

    const assignedEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE company_id = ?').get(companyId).count;
    if (assignedEmployees > 0) {
      if (req.query.force === 'true') {
        // Unlink employees from this company
        db.prepare('UPDATE employees SET company_id = NULL WHERE company_id = ?').run(companyId);
      } else {
        return res.status(400).json({
          error: `Company "${existing.name}" has ${assignedEmployees} employee(s) assigned.`,
          assignedEmployees,
          canForce: true
        });
      }
    }

    if (existing.logo_path) {
      const oldFile = path.join(__dirname, '..', existing.logo_path);
      if (fs.existsSync(oldFile)) {
        try { fs.unlinkSync(oldFile); } catch (e) {}
      }
    }

    db.prepare('DELETE FROM company WHERE id = ?').run(companyId);
    logAudit(req.user.id, req.user.name, 'Company Deleted', 'Company', companyId, `Deleted company: ${existing.name}`);
    res.json({ message: `Company "${existing.name}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SINGLE COMPANY PROFILE (Backward-compatible default)
router.get('/company', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company ORDER BY id ASC LIMIT 1').get();
    res.json(company || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/company', authenticateToken, (req, res) => {
  try {
    const {
      name, address, city, state, country, zip_code, phone,
      email, website, registration_no, gst_no, pf_no, tan_no, other_info
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Company Name is required.' });

    db.prepare(`
      UPDATE company SET
        name = ?, address = ?, city = ?, state = ?, country = ?, zip_code = ?,
        phone = ?, email = ?, website = ?, registration_no = ?, gst_no = ?,
        pf_no = ?, tan_no = ?, other_info = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM company ORDER BY id ASC LIMIT 1)
    `).run(
      name, address, city, state, country, zip_code, phone,
      email, website, registration_no, gst_no, pf_no, tan_no, other_info
    );

    logAudit(req.user.id, req.user.name, 'Company Profile Updated', 'Company', '1', `Updated company profile details for ${name}`);
    const updatedCompany = db.prepare('SELECT * FROM company ORDER BY id ASC LIMIT 1').get();
    res.json({ message: 'Company details updated successfully.', company: updatedCompany });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/company/logo', authenticateToken, (req, res) => {
  logoUpload.single('logo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No logo file uploaded.' });

    const relativeLogoPath = `/uploads/logos/${req.file.filename}`;
    const currentCompany = db.prepare('SELECT logo_path FROM company ORDER BY id ASC LIMIT 1').get();
    if (currentCompany?.logo_path) {
      const oldPath = path.join(__dirname, '..', currentCompany.logo_path);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) {}
      }
    }

    db.prepare('UPDATE company SET logo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM company ORDER BY id ASC LIMIT 1)').run(relativeLogoPath);
    logAudit(req.user.id, req.user.name, 'Company Logo Uploaded', 'Company', '1', `Uploaded new company logo: ${req.file.filename}`);
    res.json({ message: 'Logo uploaded successfully.', logo_path: relativeLogoPath });
  });
});

router.delete('/company/logo', authenticateToken, (req, res) => {
  try {
    const currentCompany = db.prepare('SELECT logo_path FROM company ORDER BY id ASC LIMIT 1').get();
    if (currentCompany?.logo_path) {
      const oldPath = path.join(__dirname, '..', currentCompany.logo_path);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) {}
      }
      db.prepare('UPDATE company SET logo_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM company ORDER BY id ASC LIMIT 1)').run();
      logAudit(req.user.id, req.user.name, 'Company Logo Removed', 'Company', '1', 'Removed company logo');
    }
    res.json({ message: 'Logo removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SETTINGS & BACKUP
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settingsMap = {};
    rows.forEach(r => settingsMap[r.key] = r.value);
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(req.body)) {
      stmt.run(key, String(value));
    }
    logAudit(req.user.id, req.user.name, 'Settings Updated', 'Settings', '0', 'Updated global application settings.');
    res.json({ message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backup/export', authenticateToken, (req, res) => {
  try {
    const backupData = {
      export_timestamp: new Date().toISOString(),
      company: db.prepare('SELECT * FROM company LIMIT 1').get(),
      employees: db.prepare('SELECT * FROM employees').all(),
      salaryStructures: db.prepare('SELECT * FROM salary_structures').all(),
      payslips: db.prepare('SELECT * FROM payslips').all(),
      auditLogs: db.prepare('SELECT * FROM audit_logs').all(),
      settings: db.prepare('SELECT * FROM settings').all()
    };
    logAudit(req.user.id, req.user.name, 'Database Backup Exported', 'Backup', '0', 'Exported complete database JSON backup.');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="payslip_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
