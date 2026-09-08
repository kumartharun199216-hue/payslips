const { PDFParse } = require('pdf-parse');
const { generateCompanySvgLogo } = require('./svgLogoGenerator');

/**
 * Extracts raw JPEG binary streams directly from PDF buffer.
 * Preserves 100% of original image dimensions, compression, and RGB color channels.
 */
function extractEmbeddedJpegs(buffer) {
  const jpegs = [];
  let offset = 0;
  while ((offset = buffer.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), offset)) !== -1) {
    const end = buffer.indexOf(Buffer.from([0xFF, 0xD9]), offset + 3);
    if (end !== -1) {
      const img = buffer.slice(offset, end + 2);
      // Logos are typically between 500 bytes and 5MB
      if (img.length > 500 && img.length < 5000000) {
        jpegs.push(img);
      }
      offset = end + 2;
    } else {
      break;
    }
  }
  return jpegs;
}

/**
 * Parses raw text, image, or PDF buffer of an Offer Letter / Appointment Letter
 * and extracts Company details, Logo, Employee details, and Salary structure.
 */
async function parseOfferLetter(fileBuffer, mimeType = '', originalName = '') {
  let text = '';
  let logoBuffer = null;
  let logoMime = 'image/png';

  const isPdf = (mimeType && mimeType.includes('pdf')) || 
                (originalName && originalName.toLowerCase().endsWith('.pdf')) ||
                (fileBuffer && fileBuffer.length >= 5 && fileBuffer.slice(0, 5).toString() === '%PDF-');
  const isImage = (mimeType && mimeType.startsWith('image/')) || /\.(png|jpg|jpeg|svg)$/i.test(originalName);

  if (isPdf) {
    let parser = null;
    try {
      parser = new PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();
      text = textResult.text || '';

      // Fallback if getText returned empty stream
      if (!text || text.trim().length < 30) {
        const rawStr = fileBuffer.toString('latin1');
        const matches = rawStr.match(/[A-Za-z0-9\s,\.\-:\/]{4,}/g) || [];
        text = matches.join(' ');
      }

      // Engine 1: Direct pristine JPEG stream extraction (exact original colors)
      try {
        const jpegs = extractEmbeddedJpegs(fileBuffer);
        if (jpegs.length > 0) {
          logoBuffer = jpegs[0];
          logoMime = 'image/jpeg';
        }
      } catch (e) {
        console.warn('Direct JPEG extraction note:', e.message);
      }

      // Engine 2: High-resolution Page 1 Canvas Extraction if no JPEG was found
      if (!logoBuffer) {
        try {
          const imgPromise = parser.getImage({
            first: 1,
            last: 1,
            imageBuffer: true,
            imageDataUrl: true,
            imageThreshold: 5
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image extraction timeout')), 3000)
          );
          const imgResult = await Promise.race([imgPromise, timeoutPromise]);
          if (imgResult && imgResult.pages && imgResult.pages.length > 0) {
            const candidates = [];
            for (const page of imgResult.pages) {
              if (page.images && page.images.length > 0) {
                for (const img of page.images) {
                  let buf = null;
                  if (img.data && img.data.length > 0) {
                    buf = Buffer.from(img.data);
                  } else if (img.dataUrl && img.dataUrl.startsWith('data:image/')) {
                    const base64Data = img.dataUrl.split(',')[1];
                    buf = Buffer.from(base64Data, 'base64');
                  }
                  if (buf && buf.length > 200) {
                    candidates.push({
                      buffer: buf,
                      size: buf.length,
                      width: img.width || 0,
                      height: img.height || 0
                    });
                  }
                }
              }
            }
            if (candidates.length > 0) {
              // Rank candidates: primary brand logos have higher byte size / color contrast
              // than semi-transparent or low-opacity watermarks
              candidates.sort((a, b) => b.size - a.size);
              logoBuffer = candidates[0].buffer;
              logoMime = 'image/png';
            }
          }
        } catch (imgErr) {
          console.warn('PDF canvas image extraction note:', imgErr.message);
        }
      }
    } catch (e) {
      console.warn('PDFParse error:', e.message);
      text = fileBuffer.toString('utf-8');
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try { await parser.destroy(); } catch (e) {}
      }
    }
  } else if (isImage) {
    logoBuffer = fileBuffer;
    logoMime = mimeType || 'image/png';
    text = fileBuffer.toString('utf-8');
  } else {
    text = fileBuffer.toString('utf-8');
  }

  const cleanText = text.replace(/\r\n/g, '\n');
  const company = extractCompanyFromText(cleanText, logoBuffer, logoMime);
  const employeeData = extractEmployeeDataFromText(cleanText, originalName);

  return {
    raw_text: text,
    company,
    ...employeeData
  };
}

function extractCompanyFromText(cleanText, logoBuffer = null, logoMime = 'image/png') {
  // 1. Company Name
  let companyName = '';
  const companyRegexes = [
    // 1. Explicit clause: "for the position of Software Engineer at NAYAGARA TECHNOLOGIES LIMITED"
    /(?:for the position of|role of|employment at)\s+[^\n\r.]+?\s+(?:at|with)\s+([A-Z0-9][A-Za-z0-9\s,\.&]{2,80}?(?:\s+(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Inc\.?|LLC|Corporation|Corp\.?))\b)/i,
    // 2. Standard corporate entity with legal suffix
    /(?:at|with|welcome you to|for)\s+([A-Z0-9][A-Za-z0-9\s,\.&]{2,80}?(?:\s+(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Inc\.?|LLC|Corporation|Corp\.?))\b)/i,
    // 3. Corporate sign-off: "Manager, Human Resources\nNayagara Technologies Limited"
    /(?:Manager[,\s]+Human Resources|HR Department|Authorized Signatory)[\r\n\s]+([A-Z0-9][^\r\n]{2,80}?)(?:\r?\n|$)/i,
    // 4. "For <Company Name>" signature line
    /(?:For|for)\s+([A-Z0-9][A-Za-z0-9\s,\.&]{2,80}?(?:\s+(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Inc\.?|LLC|Corporation|Corp\.?))\b)/,
    // 5. Industry-specific corporate entity
    /(?:at|with|welcome you to|for)\s+([A-Z0-9][A-Za-z0-9\s,\.&]{2,60}?(?:Solutions|Technologies|Software|Infotech|Enterprises|Systems|Services|Consulting|Labs|Analytics|Digital|Group)(?:\s+(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?))?)/i,
    // 6. Explicit label: "Company Name: ..." or "Employer: ..."
    /(?:Company Name|Company|Employer|Organization)\s*:\s*([A-Za-z0-9\s,\.&]+)(?:\n|,|$)/i,
    // 7. Letterhead top line with legal suffix
    /^([A-Z0-9][A-Za-z0-9\s,\.&]{2,60}?(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Inc\.?|LLC|Corporation|Corp\.?))\b/m,
    // 8. Letterhead top line with company keyword
    /^([A-Z0-9][A-Za-z0-9\s\.&]{2,60}?(?:Technologies|Solutions|Software|Infotech|Enterprises|Systems|Services|Consulting|Labs|Analytics|Digital|Media|Ventures|Industries|Holdings|Capital|Global|Health|Fintech)(?:\s+(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?))?)/im
  ];

  for (const reg of companyRegexes) {
    const match = cleanText.match(reg);
    if (match && match[1] && match[1].trim().length > 2) {
      let cName = match[1].trim().replace(/[,\.]$/, '').replace(/\r?\n/g, ' ').trim();
      if (/\sat\s/i.test(cName)) {
        const parts = cName.split(/\sat\s+/i);
        cName = parts[parts.length - 1].trim();
      }
      cName = cName.replace(/^(?:the\s+)?(?:position|role|post)\s+of\s+[^]+?\s+at\s+/i, '')
                   .replace(/^(?:the\s+)?(?:employment|job)\s+at\s+/i, '')
                   .trim();
      if (cName.length > 2 && !/^(the company|company|employer|sincerely|manager)$/i.test(cName)) {
        companyName = cName;
        break;
      }
    }
  }

  // Fallback: Check first 3 lines of page 1 for header title if still not found
  if (!companyName) {
    const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(4, lines.length); i++) {
      const line = lines[i];
      if (!/(?:date|ref|dear|offer|appointment|page|confidential)/i.test(line) && line.length >= 3 && line.length <= 70) {
        if (/^[A-Z0-9]/.test(line) && !line.includes(':')) {
          companyName = line.replace(/[,\.]$/, '').trim();
          break;
        }
      }
    }
  }

  // 2. Company Address
  let address = '';
  const addrMatch = cleanText.match(/(?:Address|Registered Office|Corporate Office|Office|Regd\.?\s*Office)\s*:\s*([A-Za-z0-9\s,\.\-\/#]+?)(?:\n\n|\n[A-Z][a-z]+:|\nCIN|\nGST|\nPhone|\nEmail|$)/i);
  if (addrMatch && addrMatch[1]) {
    address = addrMatch[1].trim();
  } else {
    // Structural pattern: Street / Floor / Block / Building in header lines
    const headerAddrMatch = cleanText.match(/(?:[0-9]+(?:st|nd|rd|th)[^\S\r\n]+(?:floor|block|stage|cross|main)|Plot[^\S\r\n]+No\.?|Building[^\S\r\n]+No\.?|Suite[^\S\r\n]+[0-9]+|No\.?[^\S\r\n]*[0-9]+,?[^\S\r\n]+[A-Za-z0-9,\.\-\/#]+?(?:Road|Rd|Street|St|Lane|Nagar|Layout|Phase|Sector|Enclave|Rajajinagar|Whitefield|HSR|Koramangala|Indiranagar|HITEC|Gachibowli|Andheri|BKC|Cyber|Tower))[^\r\n]*/i);
    if (headerAddrMatch) {
      address = headerAddrMatch[0].trim().replace(/^[,\s]+|[,\s]+$/g, '');
    }
  }

  // 3. City, State, Country, Zip
  let city = '';
  const cities = ['Bengaluru', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Lucknow', 'Indore', 'Kochi', 'Bhubaneswar', 'Visakhapatnam', 'Coimbatore'];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(cleanText)) {
      city = c === 'Bangalore' ? 'Bengaluru' : c;
      break;
    }
  }

  let state = '';
  const states = ['Karnataka', 'Maharashtra', 'Telangana', 'Tamil Nadu', 'Delhi', 'Uttar Pradesh', 'Haryana', 'West Bengal', 'Gujarat', 'Rajasthan', 'Punjab', 'Madhya Pradesh', 'Kerala', 'Odisha', 'Andhra Pradesh'];
  for (const s of states) {
    if (new RegExp(`\\b${s}\\b`, 'i').test(cleanText)) {
      state = s;
      break;
    }
  }

  const pinMatch = cleanText.match(/\b([1-9][0-9]{5})\b/);
  const zip_code = pinMatch ? pinMatch[1] : '';

  // 4. Contact & Web (Only if present in text)
  const webMatch = cleanText.match(/(?:Website|Web)\s*:\s*(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|in|net|co|io))/i);
  const website = webMatch ? (webMatch[1].startsWith('http') ? webMatch[1] : `https://${webMatch[1]}`) : '';

  const emailMatch = cleanText.match(/(?:Company Email|Corporate Email)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
                     cleanText.match(/(?:info|hr|careers|contact|support)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? (emailMatch[1] || emailMatch[0]) : '';

  const phoneMatch = cleanText.match(/(?:Company Phone|Phone|Tel|Contact No\.?|Office Phone)\s*:\s*([+\d\s\-()]{8,20})/i);
  const phone = phoneMatch ? phoneMatch[1].trim() : '';

  // 5. Statutory Numbers (Only if present in text)
  const cinMatch = cleanText.match(/(?:CIN|Registration No\.?|Reg No\.?)\s*:\s*([A-Za-z0-9\-]+)/i) || cleanText.match(/\b([LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b/);
  const registration_no = cinMatch ? (cinMatch[1] || cinMatch[0]) : '';

  const gstMatch = cleanText.match(/(?:GSTIN|GST No\.?|GST)\s*:\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i) || cleanText.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
  const gst_no = gstMatch ? (gstMatch[1] || gstMatch[0]) : '';

  const pfRegMatch = cleanText.match(/(?:Company PF No\.?|PF Establishment Code|PF Reg No\.?)\s*:\s*([A-Za-z0-9\/\-]+)/i);
  const pf_no = pfRegMatch ? pfRegMatch[1] : '';

  const tanMatch = cleanText.match(/(?:TAN|TAN No\.?)\s*:\s*([A-Z]{4}[0-9]{5}[A-Z]{1})/i) || cleanText.match(/\b([A-Z]{4}[0-9]{5}[A-Z]{1})\b/);
  const tan_no = tanMatch ? (tanMatch[1] || tanMatch[0]) : '';

  const esiMatch = cleanText.match(/(?:ESI Reg No\.?|ESI Number|ESIC No\.?)\s*:\s*([A-Za-z0-9\/\-]+)/i);
  const other_info = esiMatch ? `ESI Reg No: ${esiMatch[1].trim()}` : '';

  // Generate SVG logo if no embedded logoBuffer was found and company name exists
  let logoSvg = null;
  if (!logoBuffer && companyName) {
    logoSvg = generateCompanySvgLogo(companyName);
  }

  return {
    name: companyName,
    address,
    city,
    state,
    country: (address || city || state) ? 'India' : '',
    zip_code,
    phone,
    email,
    website,
    registration_no,
    gst_no,
    pf_no,
    tan_no,
    other_info,
    logoBuffer,
    logoMime,
    logoSvg
  };
}

function parseDateToIso(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const clean = dateStr.trim();

  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const monthMap = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  // Match DD Month YYYY (e.g. 01 March 2026, 1 March 2026, 15 January 2026)
  const dmyMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = monthMap[dmyMatch[2].toLowerCase().substring(0, 3)] || '01';
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match Month DD, YYYY (e.g. March 01, 2026 or March 1, 2026)
  const mdyMatch = clean.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const month = monthMap[mdyMatch[1].toLowerCase().substring(0, 3)] || '01';
    const day = mdyMatch[2].padStart(2, '0');
    const year = mdyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function extractEmployeeDataFromText(cleanText, originalName = '') {
  // 1. Candidate / Employee Name
  let name = '';
  const nameRegexes = [
    /(?:Dear|To)\s+([A-Za-z\s\.]+?)(?:\s*,|\s*\n)/i,
    /(?:Offer of Employment|Appointment Letter|Offer Letter)\s*[-–:]\s*([A-Za-z\s\.]+?)(?:\n|\r|,|$)/i,
    /Offer of Employment to\s+([A-Za-z\s\.]+?)(?:\n|\r|,|$)/i,
    /welcome\s+([A-Za-z\s\.]+?)\s+to/i,
    /I,\s*([A-Za-z\s\.]+?),?\s+have read and understood/i,
    /(?:Name|Candidate Name|Employee Name)\s*:\s*([A-Za-z\s\.]+?)(?:\n|\r|,|$)/i
  ];
  for (const reg of nameRegexes) {
    const match = cleanText.match(reg);
    if (match && match[1] && match[1].trim().length > 2) {
      name = match[1].trim().replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '').replace(/[,\.]$/, '').trim();
      break;
    }
  }

  // Fallback to filename if not detected in text
  if ((!name || name === 'Sample Employee') && originalName) {
    const fnClean = originalName
      .replace(/\.(pdf|txt|docx?|png|jpe?g)$/i, '')
      .replace(/^(?:offer[_\-\s]*letter|appointment[_\-\s]*letter|offer|job[_\-\s]*offer)[_\-\s]*/i, '')
      .replace(/[_\-]+/g, ' ')
      .trim();
    if (fnClean.length >= 3 && !/^(sample|test|document|doc|letter|unnamed)$/i.test(fnClean)) {
      name = fnClean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  if (!name) name = '';

  // 2. Designation / Role (Handles cross-line wraps)
  let designation = '';
  const desigRegexes = [
    /(?:position of|role of|title of)\s+([A-Za-z0-9\s\-\/\&]+?)(?:\s+at\s+|\s+in\s+|,|\.|$)/i,
    /(?:appointed as|accept the appointment,\s*as)\s+a?\s*([A-Za-z0-9\s\-\/\&]+?)(?:\s+(?:in the|in|at)\s+|,\s*|\.\s*|\n|$)/i,
    /(?:Designation|Role|Position|Title)\s*:\s*([A-Za-z0-9\s\-\/\&]+)(?:\n|,|$)/i
  ];
  for (const reg of desigRegexes) {
    const match = cleanText.match(reg);
    if (match && match[1] && match[1].trim().length > 2) {
      designation = match[1].replace(/\r?\n/g, ' ').replace(/[,\.]$/, '').trim();
      break;
    }
  }

  // 3. Department (Leave blank if missing)
  let department = '';
  const deptRegexes = [
    /(?:in the|in)\s+([A-Za-z0-9\s\-\/\&]+?)\s+Department(?:\s+at|\s+in|,|\.|\n|$)/i,
    /(?:Department|Dept)\s*:\s*([A-Za-z0-9\s\-\/\&]+)(?:\n|,|$)/i
  ];
  for (const reg of deptRegexes) {
    const match = cleanText.match(reg);
    if (match && match[1] && match[1].trim().length > 1) {
      department = match[1].trim().replace(/[,\.]$/, '').trim();
      break;
    }
  }

  // 4. Date of Joining
  let rawDateOfJoining = '';
  const dojRegexes = [
    /(?:join our team on|join us on|report to work on|commencing from|effective from|commence on)\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}|[0-9]{1,2}\s+[A-Za-z]+,?\s+[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})/i,
    /(?:Date of Joining|Joining Date|DOJ|effective date)\s*(?:will be|is|:)\s*([0-9]{1,2}\s+[A-Za-z]+,?\s+[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}|[0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})/i,
    /join us on or before\s+([0-9]{1,2}\s+[A-Za-z]+,?\s+[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}|[0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})/i
  ];
  for (const reg of dojRegexes) {
    const match = cleanText.match(reg);
    if (match && match[1]) {
      rawDateOfJoining = match[1].trim();
      break;
    }
  }
  const dateOfJoining = rawDateOfJoining ? parseDateToIso(rawDateOfJoining) : '';

  // Candidate Details (Only if present in text)
  const candEmailMatch = cleanText.match(/(?:Candidate Email|Email ID|Email|E-mail)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  const candEmail = candEmailMatch ? candEmailMatch[1] : '';

  const candPhoneMatch = cleanText.match(/(?:Mobile|Phone|Contact Number|Cell)\s*:\s*([+\d\s\-()]{10,15})/i);
  const candPhone = candPhoneMatch ? candPhoneMatch[1].trim() : '';

  const candAddrMatch = cleanText.match(/(?:Residential Address|Permanent Address|Candidate Address)\s*:\s*([A-Za-z0-9\s,\.\-\/#]+?)(?:\n\n|\n[A-Z][a-z]+:|$)/i);
  const candAddress = candAddrMatch ? candAddrMatch[1].trim() : '';

  const dobMatch = cleanText.match(/(?:Date of Birth|DOB|Birth Date)\s*:\s*([A-Za-z0-9\s,\/\-]+?)(?:\n|\.|$)/i);
  const dob = dobMatch ? parseDateToIso(dobMatch[1]) : '';

  const genderMatch = cleanText.match(/(?:Gender|Sex)\s*:\s*(Male|Female|Other)/i);
  const gender = genderMatch ? genderMatch[1] : '';

  const locMatch = cleanText.match(/(?:current place of work is|place of work is|work location is|Location|Work Location|Place of Posting|Base Location|Posting)\s*[:\s]*([A-Za-z0-9\s,\.\-]+?)(?:\n|,|\.|$)/i);
  const location = locMatch ? locMatch[1].trim() : '';

  const mgrMatch = cleanText.match(/(?:Reporting To|Reports To|Reporting Manager|Manager)\s*:\s*([A-Za-z0-9\s\.\-]+?)(?:\n|,|\.|$)/i);
  const reporting_manager = mgrMatch ? mgrMatch[1].trim() : '';

  const empTypeMatch = cleanText.match(/(?:Employment Type|Nature of Employment|Type)\s*:\s*([A-Za-z0-9\s\-]+?)(?:\n|,|$)/i);
  const employment_type = empTypeMatch ? empTypeMatch[1].trim() : '';

  // 5. Dual-Mode Tabular Amount Parser
  // Handles columnated Annexure tables (e.g., "Basic Salary (50% of Fixed) 16,667 2,00,000")
  // as well as labeled key-values (e.g., "Basic Salary: ₹16,667")
  const parseTableAmount = (compNamePattern) => {
    // 1. Columnated row regex (Component name followed by optional notes in parens, then monthly and annual amounts)
    const tableRegex = new RegExp('(?:' + compNamePattern + ')(?:\\s*\\([^)]*\\))?[^\\d\\n\\r]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,})(?:\\s+([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,}))?', 'i');
    const tableMatch = cleanText.match(tableRegex);
    if (tableMatch && tableMatch[1]) {
      const num1 = parseFloat(tableMatch[1].replace(/,/g, ''));
      const num2 = tableMatch[2] ? parseFloat(tableMatch[2].replace(/,/g, '')) : null;
      // If two numbers present, num1 is Monthly (smaller) and num2 is Annual (larger)
      if (num2 && num2 > num1 && num2 >= num1 * 5) return num1;
      // If single number is an annual amount (> 100,000), convert to monthly
      if (num1 > 100000 && !num2) return Math.round(num1 / 12);
      return num1;
    }

    // 2. Fallback to standard colon pattern: "Basic: 16,667"
    const colonRegex = new RegExp('(?:' + compNamePattern + ')\\s*:\\s*(?:₹|Rs\\.?|INR)?\\s*([0-9,]+)', 'i');
    const colonMatch = cleanText.match(colonRegex);
    if (colonMatch && colonMatch[1]) {
      const val = parseFloat(colonMatch[1].replace(/,/g, ''));
      return isNaN(val) ? 0 : val;
    }
    return 0;
  };

  let basic = parseTableAmount('Basic Salary|Basic Pay|Basic');
  let hra = parseTableAmount('House Rent Allowance|HRA');
  let conveyance = parseTableAmount('Conveyance Allowance|Conveyance');
  let special = parseTableAmount('Special Allowance|Special');
  let bonus = parseTableAmount('Performance Bonus|Bonus|Target Performance Incentive');
  let medical = parseTableAmount('Medical Allowance|Medical');
  let lta = parseTableAmount('Leave Travel Allowance|LTA');

  let monthlyGross = parseTableAmount('Gross Fixed Salary|Gross Salary|Monthly Gross|Total Fixed Cost');
  let ctc = parseTableAmount('Total CTC|Annual CTC|Gross CTC|TOTAL COST TO COMPANY|Total Fixed Cost to Company|CTC');

  // If annual CTC is extracted instead of monthly components, convert to monthly breakdown
  if (ctc > 0 && monthlyGross === 0 && basic === 0) {
    monthlyGross = Math.round(ctc > 200000 ? ctc / 12 : ctc);
  }

  if (monthlyGross > 0 && basic === 0) {
    basic = Math.round(monthlyGross * 0.5); // 50% Basic
    hra = Math.round(basic * 0.4); // 40% HRA
    conveyance = 1600;
    special = Math.max(0, monthlyGross - (basic + hra + conveyance));
  }

  const earnings = [];
  if (basic > 0) earnings.push({ name: 'Basic Salary', amount: basic, type: 'Fixed', taxable: true, pf_calc: true });
  if (hra > 0) earnings.push({ name: 'HRA', amount: hra, type: 'Fixed', taxable: true, pf_calc: false });
  if (conveyance > 0) earnings.push({ name: 'Conveyance Allowance', amount: conveyance, type: 'Fixed', taxable: false, pf_calc: false });
  if (special > 0) earnings.push({ name: 'Special Allowance', amount: special, type: 'Fixed', taxable: true, pf_calc: false });
  if (bonus > 0 && bonus !== '—') {
    const bVal = parseFloat(bonus);
    if (!isNaN(bVal) && bVal > 0) earnings.push({ name: 'Performance Bonus', amount: bVal, type: 'Fixed', taxable: true, pf_calc: false });
  }
  if (medical > 0) earnings.push({ name: 'Medical Allowance', amount: medical, type: 'Fixed', taxable: false, pf_calc: false });
  if (lta > 0) earnings.push({ name: 'LTA', amount: lta, type: 'Fixed', taxable: false, pf_calc: false });

  // Deductions from tables or explicit clauses
  let pf = parseTableAmount('Provident Fund|Employee PF|PF|EPF');
  let pt = parseTableAmount('Professional Tax|PT');
  let tds = parseTableAmount('Income Tax|TDS');
  let esic = parseTableAmount('ESIC|ESI');

  // If clauses mention statutory deductions (EPF / Professional Tax) but table doesn't list exact monthly rows:
  const mentionsEPF = /(?:Employee Provident Fund|EPF|Provident Fund|PF)\b/i.test(cleanText);
  const mentionsPT = /(?:Professional Tax|PT)\b/i.test(cleanText);

  if (pf === 0 && mentionsEPF && basic > 0) {
    // Standard Indian EPF: 12% of basic capped at statutory ₹1,800
    pf = Math.min(1800, Math.round(basic * 0.12));
  }

  if (pt === 0 && mentionsPT && (monthlyGross > 15000 || basic > 10000)) {
    // Standard Professional Tax: ₹200/month
    pt = 200;
  }

  const deductions = [];
  if (pf > 0) deductions.push({ name: 'Employee PF', amount: pf, type: 'Fixed', auto: true });
  if (pt > 0) deductions.push({ name: 'Professional Tax', amount: pt, type: 'Fixed', auto: true });
  if (tds > 0) deductions.push({ name: 'TDS (Income Tax)', amount: tds, type: 'Fixed', auto: false });
  if (esic > 0) deductions.push({ name: 'ESIC', amount: esic, type: 'Fixed', auto: true });

  // Statutory Details (Leave blank if not in text)
  const panMatch = cleanText.match(/(?:PAN|Permanent Account Number)\s*:\s*([A-Z0-9]{10})/i) || cleanText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/);
  const uanMatch = cleanText.match(/(?:UAN|Universal Account Number)\s*:\s*([0-9]{12})/i) || cleanText.match(/\b(10[0-9]{10})\b/);
  const pfMatch = cleanText.match(/(?:PF Number|PF No\.?|Provident Fund Number)\s*:\s*([A-Za-z0-9\/\-]+)/i);
  const esicMatch = cleanText.match(/(?:ESIC Number|ESIC No\.?|ESI Number)\s*:\s*([0-9]+)/i);

  // Bank Details (Leave blank if not in text)
  const bankMatch = cleanText.match(/(?:Bank Name|Bank)\s*:\s*([A-Za-z0-9\s]+?)(?:\n|,|\.|$)/i);
  const acctMatch = cleanText.match(/(?:Account Number|Account No\.?|A\/C No\.?)\s*:\s*([0-9]{9,18})/i);
  const ifscMatch = cleanText.match(/(?:IFSC Code|IFSC)\s*:\s*([A-Z]{4}0[A-Z0-9]{6})/i);

  // Employee Code / Reference Number
  const empCodeMatch = cleanText.match(/\b(REF[-–_A-Za-z0-9]+|EMP[-–_0-9]+|ID[-–_0-9]+)\b/i) ||
                       cleanText.match(/(?:Employee Code|Employee ID|Emp ID|Ref No\.?|Reference No\.?)\s*:\s*([A-Za-z0-9\-_]+)/i);

  return {
    employee: {
      employee_code: empCodeMatch ? (empCodeMatch[1] || empCodeMatch[0]).trim() : '',
      name,
      designation,
      department,
      date_of_joining: dateOfJoining,
      dob,
      gender,
      email: candEmail,
      phone: candPhone,
      address: candAddress,
      employment_type,
      location,
      reporting_manager,
      bank_name: bankMatch ? bankMatch[1].trim() : '',
      account_number: acctMatch ? acctMatch[1].trim() : '',
      ifsc_code: ifscMatch ? ifscMatch[1].trim() : '',
      pan: panMatch ? (panMatch[1] || panMatch[0]) : '',
      uan: uanMatch ? (uanMatch[1] || uanMatch[0]) : '',
      pf_number: pfMatch ? pfMatch[1].trim() : '',
      esic_number: esicMatch ? esicMatch[1].trim() : ''
    },
    earnings,
    deductions,
    summary: {
      gross_earnings: earnings.reduce((acc, c) => acc + c.amount, 0),
      total_deductions: deductions.reduce((acc, c) => acc + c.amount, 0),
      net_salary: earnings.reduce((acc, c) => acc + c.amount, 0) - deductions.reduce((acc, c) => acc + c.amount, 0)
    }
  };
}

module.exports = {
  parseOfferLetter,
  generateCompanySvgLogo,
  parseDateToIso,
  extractCompanyFromText,
  extractEmployeeDataFromText
};
