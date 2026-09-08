const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Company Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_path TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      zip_code TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      registration_no TEXT,
      gst_no TEXT,
      pf_no TEXT,
      tan_no TEXT,
      other_info TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Employees Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      date_of_joining TEXT NOT NULL,
      employment_type TEXT DEFAULT 'Full-Time',
      location TEXT DEFAULT 'Head Office',
      reporting_manager TEXT,
      bank_name TEXT,
      account_number TEXT,
      ifsc_code TEXT,
      pan TEXT,
      uan TEXT,
      pf_number TEXT,
      esic_number TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Salary Structures Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS salary_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER UNIQUE NOT NULL,
      earnings_json TEXT NOT NULL,
      deductions_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  // 5. Payslips Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payslips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payslip_number TEXT UNIQUE NOT NULL,
      employee_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      pay_month TEXT NOT NULL,
      pay_year INTEGER NOT NULL,
      generation_timestamp TEXT NOT NULL,
      working_days INTEGER DEFAULT 30,
      paid_days INTEGER DEFAULT 30,
      lop_days INTEGER DEFAULT 0,
      gross_salary REAL NOT NULL,
      total_deductions REAL NOT NULL,
      net_salary REAL NOT NULL,
      net_salary_words TEXT NOT NULL,
      revision_number INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      employee_snapshot_json TEXT NOT NULL,
      company_snapshot_json TEXT NOT NULL,
      earnings_snapshot_json TEXT NOT NULL,
      deductions_snapshot_json TEXT NOT NULL,
      pdf_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  // 6. Audit Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    )
  `);

  // 7. System Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Seed default settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('currency_symbol', '₹');
    insertSetting.run('currency_code', 'INR');
    insertSetting.run('default_working_days', '30');
    insertSetting.run('auto_pf_rate', '12');
    insertSetting.run('auto_esi_rate', '0.75');
  }

  // Seed initial Admin user if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync('admin123', salt);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'Administrator',
      'admin@payslip.com',
      passHash,
      'Admin'
    );
    const hrPassHash = bcrypt.hashSync('hr123', salt);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'Payroll Manager',
      'hr@payslip.com',
      hrPassHash,
      'HR Manager'
    );
  }

  // Initial database schema ready. No dummy employee or dummy company data will be auto-seeded.

  // Migration: Ensure employees table has company_id
  try {
    db.exec('ALTER TABLE employees ADD COLUMN company_id INTEGER REFERENCES company(id)');
  } catch (e) {
    // Column already exists
  }

  // Backfill company_id for any existing employees with NULL company_id
  try {
    const firstCompany = db.prepare('SELECT id FROM company ORDER BY id ASC LIMIT 1').get();
    if (firstCompany) {
      db.prepare('UPDATE employees SET company_id = ? WHERE company_id IS NULL').run(firstCompany.id);
    }
  } catch (e) {
    // Ignore
  }

  // 8. Payslip Templates Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payslip_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      theme_color TEXT DEFAULT '#1e3a8a',
      accent_color TEXT DEFAULT '#3b82f6',
      layout_type TEXT DEFAULT 'modern',
      header_style TEXT DEFAULT 'split',
      show_company_logo INTEGER DEFAULT 1,
      show_bank_details INTEGER DEFAULT 1,
      show_statutory_ids INTEGER DEFAULT 1,
      show_attendance INTEGER DEFAULT 1,
      show_signature_block INTEGER DEFAULT 1,
      watermark_text TEXT DEFAULT '',
      footer_notes TEXT DEFAULT 'This is a computer-generated payslip and does not require a physical signature.',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrations for template_id in company and payslips
  try {
    db.prepare("ALTER TABLE company ADD COLUMN template_id INTEGER DEFAULT 1").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE payslips ADD COLUMN template_id INTEGER DEFAULT 1").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE payslip_templates ADD COLUMN layout_config_json TEXT").run();
  } catch (e) {}

  // Seed default templates if empty
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM payslip_templates').get().count;
  if (templateCount === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO payslip_templates (
        name, slug, description, is_default, theme_color, accent_color,
        layout_type, header_style, show_company_logo, show_bank_details,
        show_statutory_ids, show_attendance, show_signature_block, footer_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTemplate.run(
      'Modern Corporate', 'modern-corporate',
      'Contemporary corporate layout with dual-column salary breakdown and crisp badges.',
      1, '#0f172a', '#2563eb', 'modern', 'split', 1, 1, 1, 1, 1,
      'This is a computer-generated payslip and does not require a physical signature.'
    );

    insertTemplate.run(
      'Executive Navy', 'executive-navy',
      'Distinguished executive design with full-width corporate banner band and navy accents.',
      0, '#1e3a8a', '#3b82f6', 'executive', 'banner', 1, 1, 1, 1, 1,
      'Confidential salary documentation. Authorized for banking and official purposes.'
    );

    insertTemplate.run(
      'Classic Formal', 'classic-formal',
      'Traditional accounting ledger design with structured bordered cells and formal seals.',
      0, '#334155', '#475569', 'classic', 'split', 1, 1, 1, 1, 1,
      'Certified authentic payroll voucher issued under statutory corporate payroll guidelines.'
    );

    insertTemplate.run(
      'Tech Emerald', 'tech-emerald',
      'Vibrant modern tech startup aesthetic with emerald highlights and high-contrast typography.',
      0, '#065f46', '#059669', 'minimalist', 'split', 1, 1, 1, 1, 1,
      'Generated via automated enterprise payroll system.'
    );
  }

  // Seed sample initial audit log
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  if (auditCount === 0) {
    logAudit(1, 'Administrator', 'System Initialized', 'System', '0', 'Initial database schema and default company structure created.');
  }
}

function logAudit(userId, userName, action, entity, entityId, details) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId || 1, userName || 'System', action, entity, String(entityId || ''), details || '');
  } catch (err) {
    console.error('Failed to log audit event:', err.message);
  }
}

initDb();

module.exports = {
  db,
  logAudit
};
