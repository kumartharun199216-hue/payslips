require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Modular Routers
const companyRoutes = require('./routes/company');
const employeeRoutes = require('./routes/employees');
const payslipRoutes = require('./routes/payslips');
const offerLetterRoutes = require('./routes/offerLetter');
const templateRoutes = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const logosDir = path.join(__dirname, 'uploads', 'logos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Mount API Routers
app.use('/api', companyRoutes);
app.use('/api', employeeRoutes);
app.use('/api', payslipRoutes);
app.use('/api', offerLetterRoutes);
app.use('/api', templateRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Payslip Generator Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use by another process!`);
    console.error(`Please stop any other running instance or run: npx kill-port ${PORT}\n`);
  } else {
    console.error(`\n[ERROR] Server failed to start:`, err.message);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

module.exports = app;
