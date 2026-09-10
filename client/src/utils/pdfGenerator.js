import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function generatePayslipPdf(payslipElement, filename = 'Payslip.pdf') {
  if (!payslipElement) {
    throw new Error('Payslip element not found for PDF generation.');
  }

  // Pre-load all images inside the element before capturing
  const images = Array.from(payslipElement.getElementsByTagName('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 2000); // 2s timeout
      });
    })
  );

  let canvas;
  try {
    canvas = await html2canvas(payslipElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 15000,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, element) => {
        element.style.maxHeight = 'none';
        element.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.transform = 'none';
        element.style.margin = '0 auto';
      }
    });
  } catch (err) {
    console.warn('Initial html2canvas capture failed, attempting safe fallback:', err);
    canvas = await html2canvas(payslipElement, {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, element) => {
        element.style.maxHeight = 'none';
        element.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.transform = 'none';
        // Hide images in case of CORS security blocking
        const imgs = element.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].style.display = 'none';
        }
      }
    });
  }

  let imgData;
  try {
    imgData = canvas.toDataURL('image/png');
  } catch (taintErr) {
    console.warn('Canvas tainted by external assets, re-rendering with sanitized assets:', taintErr);
    const safeCanvas = await html2canvas(payslipElement, {
      scale: 2,
      useCORS: false,
      allowTaint: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, element) => {
        element.style.maxHeight = 'none';
        element.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.transform = 'none';
        const imgs = element.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].style.display = 'none';
        }
      }
    });
    imgData = safeCanvas.toDataURL('image/png');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 8;
  const availableWidth = 210 - (margin * 2);
  const availableHeight = 297 - (margin * 2);

  const canvasW = canvas.width || 1;
  const canvasH = canvas.height || 1;
  let imgWidth = availableWidth;
  let imgHeight = (canvasH * availableWidth) / canvasW;

  let xOffset = margin;
  let yOffset = margin;

  if (imgHeight > availableHeight) {
    const scaleFactor = availableHeight / imgHeight;
    imgHeight = availableHeight;
    imgWidth = imgWidth * scaleFactor;
    xOffset = margin + (availableWidth - imgWidth) / 2;
  }

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');

  const cleanFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  pdf.save(cleanFilename);
}
