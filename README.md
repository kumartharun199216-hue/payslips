# Payslip Generator & Management Application

A production-ready, full-stack corporate **Payslip Generator** application for creating, storing, viewing, downloading, and printing official employee payslips. Includes automated **AI Offer Letter Parsing**, **Duplicate Protection**, **Revision Tracking**, **Historical Snapshot Integrity**, and **A4 PDF Export**.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

---

### Step 1: Start the Backend API Server

The backend runs on **Express** with **SQLite** (`better-sqlite3`) database on port `5000`.

```bash
# Navigate to the server folder
cd server

# Install dependencies (if not already installed)
npm install

# Start the server
npm start
```

> **Backend URL**: `http://localhost:5000`  
> Database file `database.sqlite` will be automatically initialized and seeded with default company, sample employees, and salary structures.

---

### Step 2: Start the Frontend Application

The frontend is built with **React**, **Vite**, and **Tailwind CSS**, running on port `5173`.

```bash
# In a new terminal window, navigate to the client folder
cd client

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```

> **Frontend Application URL**: `http://localhost:5173`

---

## 🔐 Default Demo Login Credentials

You can use the quick login buttons on the sign-in screen or enter the following credentials:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@payslip.com` | `admin123` |
| **Payroll Manager** | `hr@payslip.com` | `hr123` |

---

## 📄 Feature Focus: Offer Letter Auto-Extraction & Instant Payslip Generation

The application includes an **Offer Letter Extractor**:

### How it works:
1. Go to the **Generate Payslip** page or **Employees** page.
2. Click **"📄 Auto-Fill from Employee Offer Letter"** / **"Upload Offer Letter"**.
3. Select an Offer Letter document (PDF or Text format).
4. The system automatically parses:
   - **Employee Personal Info**: Name, Designation, Department, Date of Joining, PAN, UAN, PF Number.
   - **Earnings Components**: Basic Salary, HRA, Conveyance Allowance, Special Allowance, Performance Bonus.
   - **Deductions**: Employee PF, Professional Tax, TDS (Income Tax).
5. All fields across the 4-step wizard are automatically populated, allowing you to preview and generate the payslip in one click!

> 💡 A sample offer letter file is provided at: `server/sample_offer_letters/sample_offer_letter.txt`

---

## Key Features & Highlights

### 1. Company Profile Management
- Configurable company name, address, tax IDs (GSTIN, CIN, TAN, PF Reg No, ESIC Reg No).
- Drag-and-drop **Company Logo upload** (supports PNG, JPG, JPEG, SVG up to 5MB) with instant preview, replace, and remove.
- Company logo automatically renders on generated payslips and exported PDFs.

### 2. Employee Management
- Complete personal, employment, bank account, and statutory information tracking.
- Search and filter by name, employee code, department, and active/inactive status.
- **Sensitive Data Masking Toggle**: Easily mask bank account numbers, PAN, and UAN for client presentation safety.

### 3. Flexible Salary Structure Manager
- Customizable earnings (Basic, HRA, Conveyance, Special Allowance, Custom items).
- Deductions (Employee PF, Professional Tax, TDS, ESIC, Custom deductions).
- Manual exact entry + automatic statutory rule helpers (e.g. 12% PF cap, PT slabs).

### 4. Step-by-Step Payslip Generator
- **Step 1 — Select Employee**: Auto-populates all employee attributes.
- **Step 2 — Pay Period & Attendance**: Month/Year selection, Working days, Paid days, LOP days.
- **Step 3 — Timestamp**: Configurable generation date & time with "Use Current Time" option.
- **Step 4 — Salary Adjustment & Calculation**: Live Gross Earnings, Total Deductions, Net Salary, and **Net Salary in Words** converter (e.g. *Rupees Forty-Five Thousand Two Hundred Fifty Only*).

### 5. Duplicate Protection & Revision Control
- Automatically checks whether a payslip already exists for `(Employee + Pay Month + Pay Year)`.
- Prevents accidental overwrites by prompting the user to either:
  1. **View Existing Payslip**
  2. **Generate Replacement / Revision** (e.g., *Revision 1*, *Revision 2*).

### 6. Post-Generation Success Screen (UX Requirement #27)
- Post generation, displays a clean summary card with celebration feedback.
- Provides immediate actions: **View Payslip**, **Download PDF**, **Generate Another Payslip**, **Go to Payslip History**.

### 7. Historical Snapshot Preservation Rule
- Payslips are stored as frozen JSON snapshots of company info, employee details, earnings, deductions, and totals at the moment of generation.
- Future changes to employee salary structures or company info will **never** alter past payslips.

### 8. A4 Corporate PDF Download & Printing
- High-definition A4 PDF export using `html2canvas` and `jsPDF`.
- Filename format: `Payslip_EmployeeName_September_2026.pdf`.
- Optimized `@media print` CSS for clean browser printing without navigation or buttons.

### 9. Backup Export & Audit Trail
- Export complete database backups in JSON format.
- Real-time audit log tracking employee creation, salary changes, payslip generations, revisions, and void events.

---

## 🛠️ Tech Stack & Directory Structure

```text
payslip_Generator/
├── README.md                       # Documentation & setup guide
├── server/                         # Backend Express API & Database
│   ├── server.js                   # Express server & API routes
│   ├── db.js                       # SQLite schema & seed database
│   ├── offerLetterParser.js        # Offer letter PDF/Text extractor
│   ├── database.sqlite             # Persistent SQLite database file
│   └── sample_offer_letters/       # Sample offer letter test files
│
└── client/                         # Frontend React + Vite SPA
    ├── src/
    │   ├── api.js                  # Centralized backend API client
    │   ├── App.jsx                 # Master application layout
    │   ├── components/             # UI Components
    │   │   ├── Dashboard.jsx       # Overview statistics & recent payslips
    │   │   ├── CompanyProfile.jsx  # Company details & logo manager
    │   │   ├── EmployeeManagement.jsx # Employee directory & modal form
    │   │   ├── SalaryStructure.jsx # Earnings & deductions builder
    │   │   ├── PayslipGenerator.jsx# 4-step payslip workflow & offer letter parser
    │   │   ├── PayslipSuccess.jsx  # Post-generation success screen
    │   │   ├── PayslipHistory.jsx  # Searchable & filterable history archive
    │   │   ├── PayslipTemplate.jsx # Corporate A4 printable template
    │   │   ├── Settings.jsx       # System settings, audit logs & DB backup
    │   │   ├── Header.jsx          # Top bar with role & payroll month
    │   │   ├── Sidebar.jsx         # Navigation sidebar
    │   │   └── Login.jsx           # Sign-in modal with quick demo logins
    │   └── utils/                  # Helper utilities
    │       ├── formatters.js       # Currency, date, and account masking
    │       ├── numberToWords.js    # Currency to words converter
    │       └── pdfGenerator.js     # High-DPI A4 PDF exporter
    ├── vite.config.js              # Vite configuration
    └── package.json                # Frontend dependencies
```

---

## 📜 License & Author

Built with Google Antigravity AI Coding Assistant. Production-ready Payroll & Payslip Management System.
