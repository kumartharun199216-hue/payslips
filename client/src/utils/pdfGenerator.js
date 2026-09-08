import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function generatePayslipPdf(payslipElement, filename = 'Payslip.pdf') {
  if (!payslipElement) {
    throw new Error('Payslip element not found for PDF generation.');
  }

  // Generate crisp canvas with CORS enabled and tainting prevented
  const canvas = await html2canvas(payslipElement, {
    scale: 2, // High DPI resolution for crisp typography and logos
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 dimensions: 210mm x 297mm
  const margin = 8; // 8mm border margins
  const availableWidth = 210 - (margin * 2);
  const availableHeight = 297 - (margin * 2);

  let imgWidth = availableWidth;
  let imgHeight = (canvas.height * availableWidth) / canvas.width;

  // If height exceeds single A4 page, scale proportionally so everything fits on 1 page
  let xOffset = margin;
  let yOffset = margin;

  if (imgHeight > availableHeight) {
    const scaleFactor = availableHeight / imgHeight;
    imgHeight = availableHeight;
    imgWidth = imgWidth * scaleFactor;
    xOffset = margin + (availableWidth - imgWidth) / 2;
  }

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');

  // Sanitize filename
  const cleanFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  pdf.save(cleanFilename);
}
