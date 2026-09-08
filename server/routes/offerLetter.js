const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, logAudit } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { parseOfferLetter } = require('../offerLetterParser');
const { numberToWords } = require('../numberToWords');

const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const offerLetterUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function getNextEmployeeCode() {
  const emps = db.prepare('SELECT employee_code FROM employees').all();
  let maxNum = 100;
  for (const emp of emps) {
    const match = emp.employee_code && emp.employee_code.match(/EMP-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `EMP-${maxNum + 1}`;
}

// 1. PARSE ONLY (Preview mode)
router.post('/offer-letter/parse', offerLetterUpload.single('offer_letter'), async (req, res) => {
  try {
    const textContent = req.body?.text_content;
    if (!req.file && !textContent) {
      return res.status(400).json({ error: 'No offer letter file or text content provided.' });
    }

    let parsedResult;
    if (req.file) {
      parsedResult = await parseOfferLetter(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else {
      parsedResult = await parseOfferLetter(Buffer.from(textContent, 'utf-8'), 'text/plain', 'offer_letter.txt');
    }

    logAudit(req.user?.id || 1, req.user?.name || 'Administrator', 'Offer Letter Parsed', 'OfferLetter', '0', `Extracted details for employee: ${parsedResult.employee.name}`);

    res.json({
      message: 'Offer letter parsed successfully.',
      ...parsedResult
    });
  } catch (err) {
    res.status(500).json({ error: `Offer letter parsing failed: ${err.message}` });
  }
});

// 2. UPLOAD & SAVE TO DB & GENERATE OFFICIAL PAYSLIP
router.post('/offer-letter/upload-and-save', authenticateToken, offerLetterUpload.single('offer_letter'), async (req, res) => {
  try {
    const textContent = req.body?.text_content;
    if (!req.file && !textContent) {
      return res.status(400).json({ error: 'No offer letter file or text content provided.' });
    }

    console.log(`[OFFER LETTER] Ingesting file: ${req.file ? req.file.originalname : 'text'} (${req.file ? req.file.size + ' bytes' : ''})`);

    let parsedResult;
    if (req.file) {
      parsedResult = await parseOfferLetter(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else {
      parsedResult = await parseOfferLetter(Buffer.from(textContent, 'utf-8'), 'text/plain', 'offer_letter.txt');
    }

    console.log(`[OFFER LETTER] Extracted company: "${parsedResult.company?.name}", employee: "${parsedResult.employee?.name}", salary: ₹${parsedResult.summary?.net_salary}`);

    const { company, employee, earnings, deductions, summary } = parsedResult;

    // Save company logo
    let relativeLogoPath = null;
    if (company.logoBuffer) {
      const logoExt = (company.logoMime && company.logoMime.includes('jpeg')) ? '.jpg' : '.png';
      const logoFilename = `company_logo_${Date.now()}${logoExt}`;
      fs.writeFileSync(path.join(logosDir, logoFilename), company.logoBuffer);
      relativeLogoPath = `/uploads/logos/${logoFilename}`;
    } else if (company.logoSvg) {
      const logoFilename = `company_logo_${Date.now()}.svg`;
      fs.writeFileSync(path.join(logosDir, logoFilename), company.logoSvg);
      relativeLogoPath = `/uploads/logos/${logoFilename}`;
    }

    // Match or create distinct company profile
    let targetCompany = null;
    if (company.name) {
      targetCompany = db.prepare('SELECT * FROM company WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))').get(company.name);
    }
    
    if (targetCompany) {
      // Update logo and details for this existing company
      db.prepare(`
        UPDATE company SET
          logo_path = COALESCE(?, logo_path),
          address = COALESCE(NULLIF(?, ''), address),
          city = COALESCE(NULLIF(?, ''), city),
          state = COALESCE(NULLIF(?, ''), state),
          zip_code = COALESCE(NULLIF(?, ''), zip_code),
          phone = COALESCE(NULLIF(?, ''), phone),
          email = COALESCE(NULLIF(?, ''), email),
          website = COALESCE(NULLIF(?, ''), website),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        relativeLogoPath,
        company.address || '', company.city || '', company.state || '', company.zip_code || '',
        company.phone || '', company.email || '', company.website || '',
        targetCompany.id
      );
      targetCompany = db.prepare('SELECT * FROM company WHERE id = ?').get(targetCompany.id);
    } else {
      // Create new company profile
      const cInfo = db.prepare(`
        INSERT INTO company (
          name, logo_path, address, city, state, country, zip_code,
          phone, email, website, registration_no, gst_no, pf_no, tan_no, other_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        company.name || 'Organization',
        relativeLogoPath,
        company.address || '', company.city || '', company.state || '', company.country || 'India',
        company.zip_code || '', company.phone || '', company.email || '', company.website || '',
        company.registration_no || '', company.gst_no || '', company.pf_no || '', company.tan_no || '', company.other_info || ''
      );
      targetCompany = db.prepare('SELECT * FROM company WHERE id = ?').get(cInfo.lastInsertRowid);
      logAudit(req.user?.id || 1, req.user?.name || 'Administrator', 'Company Auto-Created', 'Company', targetCompany.id, `Created company "${targetCompany.name}" from offer letter`);
    }

    const savedCompany = targetCompany;

    // Save or update employee
    let employeeCode = employee.employee_code;
    let existingEmployee = null;

    if (employeeCode) {
      existingEmployee = db.prepare('SELECT * FROM employees WHERE employee_code = ?').get(employeeCode);
    }
    if (!existingEmployee && employee.name) {
      existingEmployee = db.prepare('SELECT * FROM employees WHERE LOWER(name) = LOWER(?)').get(employee.name);
    }
    if (!employeeCode) {
      employeeCode = existingEmployee ? existingEmployee.employee_code : getNextEmployeeCode();
    }

    let employeeId;
    if (existingEmployee) {
      employeeId = existingEmployee.id;
      db.prepare(`
        UPDATE employees SET
          name = ?, designation = ?, department = ?, date_of_joining = ?,
          bank_name = COALESCE(NULLIF(?, ''), bank_name),
          account_number = COALESCE(NULLIF(?, ''), account_number),
          ifsc_code = COALESCE(NULLIF(?, ''), ifsc_code),
          pan = COALESCE(NULLIF(?, ''), pan),
          uan = COALESCE(NULLIF(?, ''), uan),
          pf_number = COALESCE(NULLIF(?, ''), pf_number),
          esic_number = COALESCE(NULLIF(?, ''), esic_number),
          company_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        employee.name, employee.designation, employee.department, employee.date_of_joining,
        employee.bank_name || '', employee.account_number || '', employee.ifsc_code || '',
        employee.pan || '', employee.uan || '', employee.pf_number || '', employee.esic_number || '',
        savedCompany.id,
        employeeId
      );
    } else {
      const info = db.prepare(`
        INSERT INTO employees (
          employee_code, name, dob, gender, email, phone, address,
          designation, department, date_of_joining, employment_type,
          location, reporting_manager, bank_name, account_number,
          ifsc_code, pan, uan, pf_number, esic_number, status, company_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
      `).run(
        employeeCode, employee.name, employee.dob || '', employee.gender || '',
        employee.email || '', employee.phone || '', employee.address || '',
        employee.designation || '', employee.department || '', employee.date_of_joining || '',
        employee.employment_type || '', employee.location || '',
        employee.reporting_manager || '', employee.bank_name || '', employee.account_number || '',
        employee.ifsc_code || '', employee.pan || '', employee.uan || '',
        employee.pf_number || '', employee.esic_number || '',
        savedCompany ? savedCompany.id : null
      );
      employeeId = info.lastInsertRowid;
    }

    // Save salary structure
    const existingStruct = db.prepare('SELECT id FROM salary_structures WHERE employee_id = ?').get(employeeId);
    if (existingStruct) {
      db.prepare('UPDATE salary_structures SET earnings_json = ?, deductions_json = ?, updated_at = CURRENT_TIMESTAMP WHERE employee_id = ?')
        .run(JSON.stringify(earnings), JSON.stringify(deductions), employeeId);
    } else {
      db.prepare('INSERT INTO salary_structures (employee_id, earnings_json, deductions_json) VALUES (?, ?, ?)')
        .run(employeeId, JSON.stringify(earnings), JSON.stringify(deductions));
    }

    const savedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

    // Directly generate official payslip for this company & employee
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let payMonth = monthNames[new Date().getMonth()];
    let payYear = new Date().getFullYear();

    if (savedEmployee.date_of_joining) {
      const dojDate = new Date(savedEmployee.date_of_joining);
      if (!isNaN(dojDate.getTime())) {
        payMonth = monthNames[dojDate.getMonth()];
        payYear = dojDate.getFullYear();
      }
    }

    const grossSalary = summary.gross_earnings;
    const totalDeductions = summary.total_deductions;
    const netSalary = summary.net_salary;
    const netSalaryWords = numberToWords(netSalary);

    const monthShort = payMonth.substring(0, 3).toUpperCase();
    const basePayslipNumber = `PAY-${payYear}${monthShort}-${employeeCode.replace(/[^a-zA-Z0-9]/g, '')}`;
    const pdfFilename = `Payslip_${savedEmployee.name.replace(/[^a-zA-Z0-9]/g, '_')}_${payMonth}_${payYear}.pdf`;

    const existingPayslip = db.prepare(`
      SELECT * FROM payslips WHERE (employee_id = ? AND pay_month = ? AND pay_year = ?) OR payslip_number = ?
    `).get(employeeId, payMonth, payYear, basePayslipNumber);

    let payslipId;
    if (existingPayslip) {
      payslipId = existingPayslip.id;
      db.prepare(`
        UPDATE payslips SET
          gross_salary = ?, total_deductions = ?, net_salary = ?, net_salary_words = ?,
          company_id = ?, employee_snapshot_json = ?, company_snapshot_json = ?,
          earnings_snapshot_json = ?, deductions_snapshot_json = ?,
          revision_number = revision_number + 1, status = 'Active', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        grossSalary, totalDeductions, netSalary, netSalaryWords,
        savedCompany.id, JSON.stringify(savedEmployee), JSON.stringify(savedCompany),
        JSON.stringify(earnings), JSON.stringify(deductions),
        payslipId
      );
    } else {
      let uniqueNumber = basePayslipNumber;
      let counter = 1;
      while (db.prepare('SELECT id FROM payslips WHERE payslip_number = ?').get(uniqueNumber)) {
        uniqueNumber = `${basePayslipNumber}-${counter}`;
        counter++;
      }

      const insertPayslipStmt = db.prepare(`
        INSERT INTO payslips (
          payslip_number, employee_id, company_id, pay_month, pay_year,
          generation_timestamp, working_days, paid_days, lop_days,
          gross_salary, total_deductions, net_salary, net_salary_words,
          revision_number, status, employee_snapshot_json, company_snapshot_json,
          earnings_snapshot_json, deductions_snapshot_json, pdf_filename
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 30, 30, 0, ?, ?, ?, ?, 0, 'Active', ?, ?, ?, ?, ?)
      `);

      const pInfo = insertPayslipStmt.run(
        uniqueNumber, employeeId, savedCompany.id, payMonth, payYear,
        grossSalary, totalDeductions, netSalary, netSalaryWords,
        JSON.stringify(savedEmployee), JSON.stringify(savedCompany),
        JSON.stringify(earnings), JSON.stringify(deductions), pdfFilename
      );
      payslipId = pInfo.lastInsertRowid;
    }

    const createdPayslip = db.prepare('SELECT * FROM payslips WHERE id = ?').get(payslipId);

    logAudit(
      req.user?.id || 1, req.user?.name || 'Administrator',
      'Offer Letter Processed & Payslip Generated', 'Payslip', String(payslipId),
      `Imported company "${savedCompany.name}", employee "${savedEmployee.name}", and generated payslip #${createdPayslip.payslip_number}`
    );

    res.status(201).json({
      message: `Offer letter processed successfully! Company details, company logo, employee profile, and official payslip #${createdPayslip.payslip_number} generated.`,
      company: savedCompany,
      employee: savedEmployee,
      payslip: {
        ...createdPayslip,
        employee: JSON.parse(createdPayslip.employee_snapshot_json),
        company: JSON.parse(createdPayslip.company_snapshot_json),
        earnings: JSON.parse(createdPayslip.earnings_snapshot_json),
        deductions: JSON.parse(createdPayslip.deductions_snapshot_json)
      },
      earnings,
      deductions,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: `Offer letter upload and save failed: ${err.message}` });
  }
});

module.exports = router;
