const fs = require('fs');
const path = require('path');
const { db } = require('../db');

console.log('--- Starting Complete Data Wipe ---');

// Clear application data
db.prepare('DELETE FROM payslips').run();
db.prepare('DELETE FROM salary_structures').run();
db.prepare('DELETE FROM employees').run();
db.prepare('DELETE FROM company').run();
db.prepare('DELETE FROM audit_logs').run();

// Reset sqlite auto-increment sequence counters
try {
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('payslips', 'salary_structures', 'employees', 'company', 'audit_logs')").run();
} catch (e) {
  console.log('Note on sqlite_sequence:', e.message);
}

// Clean up logo uploads
const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
if (fs.existsSync(logosDir)) {
  const files = fs.readdirSync(logosDir);
  for (const f of files) {
    try {
      fs.unlinkSync(path.join(logosDir, f));
    } catch (e) {}
  }
}

// Ensure clean vacuum
try {
  db.exec('VACUUM');
} catch (e) {}

const summary = {
  companies: db.prepare('SELECT COUNT(*) as c FROM company').get().c,
  employees: db.prepare('SELECT COUNT(*) as c FROM employees').get().c,
  salary_structures: db.prepare('SELECT COUNT(*) as c FROM salary_structures').get().c,
  payslips: db.prepare('SELECT COUNT(*) as c FROM payslips').get().c,
  audit_logs: db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c,
  users: db.prepare('SELECT COUNT(*) as c FROM users').get().c
};

console.log('Data Wipe Successful!');
console.log('Database Status:', summary);
