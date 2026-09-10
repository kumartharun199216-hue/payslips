const { db, logAudit } = require('../db');
const bcrypt = require('bcryptjs');
const { numberToWords } = require('../numberToWords');

console.log('==============================================');
console.log('       STARTING DATABASE SEEDING PROCESS       ');
console.log('==============================================');

// Helper to get or ensure Adecco Enterprise template ID
function getAdeccoTemplateId() {
  const adecco = db.prepare("SELECT id FROM payslip_templates WHERE slug = 'adecco-corporate' OR layout_type = 'adecco'").get();
  if (adecco) return adecco.id;
  const first = db.prepare("SELECT id FROM payslip_templates ORDER BY id ASC LIMIT 1").get();
  return first ? first.id : 1;
}

// 1. CLEAR TRANSACTIONAL & MASTER DATA
console.log('\n[1/6] Cleaning existing transactional and employee records...');
db.prepare('DELETE FROM payslips').run();
db.prepare('DELETE FROM salary_structures').run();
db.prepare('DELETE FROM employees').run();
db.prepare('DELETE FROM company').run();
db.prepare('DELETE FROM audit_logs').run();

try {
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('payslips', 'salary_structures', 'employees', 'company', 'audit_logs')").run();
} catch (e) {
  // sequence reset is best-effort
}

// 2. SEED ADMIN & HR USERS
console.log('\n[2/6] Ensuring users are seeded...');
const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (usersCount === 0) {
  const salt = bcrypt.genSaltSync(10);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
    'Administrator',
    'admin@payslip.com',
    bcrypt.hashSync('admin123', salt),
    'Admin'
  );
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
    'Payroll Specialist',
    'hr@payslip.com',
    bcrypt.hashSync('hr123', salt),
    'HR Manager'
  );
  console.log('   -> Seeded admin@payslip.com and hr@payslip.com');
} else {
  console.log(`   -> Found ${usersCount} existing users.`);
}

// 3. SEED COMPANIES
console.log('\n[3/6] Seeding verified enterprise companies...');
const adeccoTemplateId = getAdeccoTemplateId();

const insertCompany = db.prepare(`
  INSERT INTO company (
    name, logo_path, address, city, state, country, zip_code, phone,
    email, website, registration_no, gst_no, pf_no, tan_no, other_info, template_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const comp1Info = insertCompany.run(
  'Acme Global Technologies Pvt. Ltd.',
  null,
  'Block C, 4th Floor, Tech Park, Outer Ring Road, Bellandur',
  'Bengaluru',
  'Karnataka',
  'India',
  '560103',
  '+91 80 4123 4567',
  'contact@acmeglobal.com',
  'https://www.acmeglobal.com',
  'U72200KA2016PTC089421',
  '29AABCA1234F1Z5',
  'KN/BNG/0045678/000',
  'BLRA12345E',
  'Premier Technology & Enterprise Solutions Firm',
  adeccoTemplateId
);
const comp1Id = comp1Info.lastInsertRowid;

const comp2Info = insertCompany.run(
  'Apex Innovations India Ltd.',
  null,
  'Unit 702, Cyber Heights, Phase 2, HITEC City',
  'Hyderabad',
  'Telangana',
  'India',
  '500081',
  '+91 40 6789 0123',
  'payroll@apexinnovations.in',
  'https://www.apexinnovations.in',
  'U74999TG2018PLC098765',
  '36AABCA9876D1Z2',
  'AP/HYD/0078901/000',
  'HYDA98765F',
  'Engineering & Industrial Design Specialists',
  adeccoTemplateId
);
const comp2Id = comp2Info.lastInsertRowid;

console.log(`   -> Created Acme Global Technologies (ID: ${comp1Id})`);
console.log(`   -> Created Apex Innovations India (ID: ${comp2Id})`);

// 4. SEED EMPLOYEES & SALARY STRUCTURES
console.log('\n[4/6] Seeding employees and salary structures...');

const insertEmployee = db.prepare(`
  INSERT INTO employees (
    employee_code, name, dob, gender, email, phone, address,
    designation, department, date_of_joining, employment_type,
    location, reporting_manager, bank_name, account_number,
    ifsc_code, pan, uan, pf_number, esic_number, status, company_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSalaryStructure = db.prepare(`
  INSERT INTO salary_structures (employee_id, earnings_json, deductions_json)
  VALUES (?, ?, ?)
`);

const employeesData = [
  {
    company_id: comp1Id,
    employee_code: 'EMP-101',
    name: 'Aarav Sharma',
    dob: '1994-06-20',
    gender: 'Male',
    email: 'aarav.sharma@acmeglobal.com',
    phone: '+91 98765 43210',
    address: 'Flat 402, Green Meadows, Bellandur, Bengaluru, Karnataka - 560103',
    designation: 'Senior Full Stack Engineer',
    department: 'Engineering',
    date_of_joining: '2022-03-15',
    employment_type: 'Full-Time',
    location: 'Bengaluru, India',
    reporting_manager: 'Sunita Rao',
    bank_name: 'HDFC Bank',
    account_number: '50100432890123',
    ifsc_code: 'HDFC0001234',
    pan: 'ABCPS1234K',
    uan: '100902345678',
    pf_number: 'KN/BNG/0045678/000/101',
    esic_number: '31-00-123456-000-0001',
    status: 'Active',
    earnings: [
      { name: 'Basic Salary', amount: 45000 },
      { name: 'House Rent Allowance (HRA)', amount: 22500 },
      { name: 'Special Allowance', amount: 18500 },
      { name: 'Conveyance Allowance', amount: 3000 },
      { name: 'Medical Allowance', amount: 2500 }
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 5400 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 4500 }
    ]
  },
  {
    company_id: comp1Id,
    employee_code: 'EMP-102',
    name: 'Priyanka Patel',
    dob: '1995-11-14',
    gender: 'Female',
    email: 'priyanka.patel@acmeglobal.com',
    phone: '+91 98123 45678',
    address: 'B-203, Palm Grove, Whitefield, Bengaluru, Karnataka - 560066',
    designation: 'Lead Product Manager',
    department: 'Product Management',
    date_of_joining: '2023-01-10',
    employment_type: 'Full-Time',
    location: 'Bengaluru, India',
    reporting_manager: 'Rahul Verma',
    bank_name: 'ICICI Bank',
    account_number: '001201567890',
    ifsc_code: 'ICIC0000012',
    pan: 'BNKPP5678M',
    uan: '100903456789',
    pf_number: 'KN/BNG/0045678/000/102',
    esic_number: '31-00-123456-000-0002',
    status: 'Active',
    earnings: [
      { name: 'Basic Salary', amount: 55000 },
      { name: 'House Rent Allowance (HRA)', amount: 27500 },
      { name: 'Special Allowance', amount: 22000 },
      { name: 'Performance Bonus', amount: 10000 },
      { name: 'Internet Allowance', amount: 1500 }
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 6600 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 9500 }
    ]
  },
  {
    company_id: comp1Id,
    employee_code: 'EMP-103',
    name: 'Vikram Malhotra',
    dob: '1991-04-18',
    gender: 'Male',
    email: 'vikram.m@acmeglobal.com',
    phone: '+91 99234 56789',
    address: 'Villa 12, Rainbow Vista, Marathahalli, Bengaluru, Karnataka - 560037',
    designation: 'Principal DevOps Architect',
    department: 'Cloud Infrastructure',
    date_of_joining: '2021-08-01',
    employment_type: 'Full-Time',
    location: 'Bengaluru, India',
    reporting_manager: 'Sunita Rao',
    bank_name: 'State Bank of India',
    account_number: '30987654321',
    ifsc_code: 'SBIN0004567',
    pan: 'CPNVM9012F',
    uan: '100904567890',
    pf_number: 'KN/BNG/0045678/000/103',
    esic_number: '31-00-123456-000-0003',
    status: 'Active',
    earnings: [
      { name: 'Basic Salary', amount: 65000 },
      { name: 'House Rent Allowance (HRA)', amount: 32500 },
      { name: 'Special Allowance', amount: 28000 },
      { name: 'Cloud Allowance', amount: 5000 },
      { name: 'Conveyance Allowance', amount: 3500 }
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 7800 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 14000 }
    ]
  },
  {
    company_id: comp2Id,
    employee_code: 'EMP-201',
    name: 'Ananya Deshmukh',
    dob: '1996-08-25',
    gender: 'Female',
    email: 'ananya.d@apexinnovations.in',
    phone: '+91 97654 32109',
    address: 'Flat 501, Lakeview Residency, Gachibowli, Hyderabad, Telangana - 500032',
    designation: 'HR Operations Lead',
    department: 'Human Resources',
    date_of_joining: '2023-04-01',
    employment_type: 'Full-Time',
    location: 'Hyderabad, India',
    reporting_manager: 'Kiran Kumar',
    bank_name: 'Axis Bank',
    account_number: '918020012345678',
    ifsc_code: 'UTIB0000890',
    pan: 'AQZPD3456G',
    uan: '100905678901',
    pf_number: 'AP/HYD/0078901/000/201',
    esic_number: '52-00-987654-000-0001',
    status: 'Active',
    earnings: [
      { name: 'Basic Salary', amount: 32000 },
      { name: 'House Rent Allowance (HRA)', amount: 16000 },
      { name: 'Special Allowance', amount: 10000 },
      { name: 'Communication Allowance', amount: 1500 }
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 3840 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 2000 }
    ]
  },
  {
    company_id: comp2Id,
    employee_code: 'EMP-202',
    name: 'Rohan Mukherjee',
    dob: '1993-12-05',
    gender: 'Male',
    email: 'rohan.m@apexinnovations.in',
    phone: '+91 98345 67890',
    address: 'Road No 36, Jubilee Hills, Hyderabad, Telangana - 500033',
    designation: 'Senior Financial Analyst',
    department: 'Finance & Accounts',
    date_of_joining: '2022-10-15',
    employment_type: 'Full-Time',
    location: 'Hyderabad, India',
    reporting_manager: 'Sanjay Singhania',
    bank_name: 'Kotak Mahindra Bank',
    account_number: '7811223344',
    ifsc_code: 'KKBK0000567',
    pan: 'CKRPM7890R',
    uan: '100906789012',
    pf_number: 'AP/HYD/0078901/000/202',
    esic_number: '52-00-987654-000-0002',
    status: 'Active',
    earnings: [
      { name: 'Basic Salary', amount: 36000 },
      { name: 'House Rent Allowance (HRA)', amount: 18000 },
      { name: 'Special Allowance', amount: 12000 },
      { name: 'Medical Allowance', amount: 2500 }
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 4320 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 3200 }
    ]
  }
];

const insertedEmployees = [];

for (const emp of employeesData) {
  const info = insertEmployee.run(
    emp.employee_code, emp.name, emp.dob, emp.gender, emp.email, emp.phone, emp.address,
    emp.designation, emp.department, emp.date_of_joining, emp.employment_type,
    emp.location, emp.reporting_manager, emp.bank_name, emp.account_number,
    emp.ifsc_code, emp.pan, emp.uan, emp.pf_number, emp.esic_number, emp.status, emp.company_id
  );
  const employeeId = info.lastInsertRowid;

  insertSalaryStructure.run(
    employeeId,
    JSON.stringify(emp.earnings),
    JSON.stringify(emp.deductions)
  );

  insertedEmployees.push({
    id: employeeId,
    ...emp
  });
  console.log(`   -> Seeded [${emp.employee_code}] ${emp.name} (${emp.designation})`);
}

// 5. SEED ACTIVE PAYSLIPS
console.log('\n[5/6] Generating realistic payroll records & payslips...');

const insertPayslip = db.prepare(`
  INSERT INTO payslips (
    payslip_number, employee_id, company_id, pay_month, pay_year,
    generation_timestamp, working_days, paid_days, lop_days,
    gross_salary, total_deductions, net_salary, net_salary_words,
    revision_number, status, employee_snapshot_json, company_snapshot_json,
    earnings_snapshot_json, deductions_snapshot_json, pdf_filename, template_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?)
`);

const payslipSpecs = [
  { empCode: 'EMP-101', month: 'August', year: 2026, workingDays: 31, paidDays: 31, lopDays: 0 },
  { empCode: 'EMP-101', month: 'July', year: 2026, workingDays: 31, paidDays: 31, lopDays: 0 },
  { empCode: 'EMP-102', month: 'August', year: 2026, workingDays: 31, paidDays: 31, lopDays: 0 },
  { empCode: 'EMP-103', month: 'August', year: 2026, workingDays: 31, paidDays: 30, lopDays: 1 },
  { empCode: 'EMP-201', month: 'August', year: 2026, workingDays: 31, paidDays: 31, lopDays: 0 },
  { empCode: 'EMP-202', month: 'August', year: 2026, workingDays: 31, paidDays: 31, lopDays: 0 }
];

const companyCache = {
  [comp1Id]: db.prepare('SELECT * FROM company WHERE id = ?').get(comp1Id),
  [comp2Id]: db.prepare('SELECT * FROM company WHERE id = ?').get(comp2Id)
};

for (const spec of payslipSpecs) {
  const emp = insertedEmployees.find(e => e.employee_code === spec.empCode);
  if (!emp) continue;

  const comp = companyCache[emp.company_id];
  const grossSalary = emp.earnings.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDeductions = emp.deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netSalary = grossSalary - totalDeductions;
  const netWords = numberToWords(netSalary);

  const monthShort = spec.month.substring(0, 3).toUpperCase();
  const payslipNumber = `PAY-${spec.year}${monthShort}-${emp.employee_code.replace(/[^a-zA-Z0-9]/g, '')}`;
  const timestampStr = new Date(spec.year, spec.month === 'August' ? 7 : 6, 28, 17, 30, 0).toISOString();
  const pdfFilename = `Payslip_${emp.name.replace(/[^a-zA-Z0-9]/g, '_')}_${spec.month}_${spec.year}.pdf`;

  // Employee snapshot without bulky nested structures
  const empSnapshot = { ...emp };
  delete empSnapshot.earnings;
  delete empSnapshot.deductions;

  insertPayslip.run(
    payslipNumber, emp.id, comp.id, spec.month, spec.year,
    timestampStr, spec.workingDays, spec.paidDays, spec.lopDays,
    grossSalary, totalDeductions, netSalary, netWords,
    0,
    JSON.stringify(empSnapshot),
    JSON.stringify(comp),
    JSON.stringify(emp.earnings),
    JSON.stringify(emp.deductions),
    pdfFilename,
    adeccoTemplateId
  );

  console.log(`   -> Generated #${payslipNumber} for ${emp.name} (Net: ₹${netSalary.toLocaleString('en-IN')})`);
}

// 6. RECORD AUDIT LOGS
console.log('\n[6/6] Creating initial audit entries...');
logAudit(1, 'Administrator', 'Database Seeded', 'System', '0', 'Database successfully populated with clean demo companies, employees, and payroll records.');

// Final Verification Summary
const summary = {
  companies: db.prepare('SELECT COUNT(*) as c FROM company').get().c,
  employees: db.prepare('SELECT COUNT(*) as c FROM employees').get().c,
  salary_structures: db.prepare('SELECT COUNT(*) as c FROM salary_structures').get().c,
  payslips: db.prepare('SELECT COUNT(*) as c FROM payslips').get().c,
  templates: db.prepare('SELECT COUNT(*) as c FROM payslip_templates').get().c,
  users: db.prepare('SELECT COUNT(*) as c FROM users').get().c
};

console.log('\n==============================================');
console.log('       DATABASE SEEDING COMPLETED SUCCESS     ');
console.log('==============================================');
console.log('Final Database Counts:', summary);
