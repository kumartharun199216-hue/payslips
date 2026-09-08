/**
 * Converts a number into Indian Currency Words format (Rupees ... Only)
 * Handles amounts up to crores cleanly.
 */
export function numberToWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  
  const num = Math.round(Number(amount));
  if (num === 0) return 'Rupees Zero Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n) {
    let str = '';
    if (n >= 100) {
      str += single[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += single[n] + ' ';
    }
    return str.trim();
  }

  let n = num;
  let words = '';

  if (n >= 10000000) { // Crores
    const crores = Math.floor(n / 10000000);
    words += convertLessThanThousand(crores) + ' Crore ';
    n %= 10000000;
  }
  if (n >= 100000) { // Lakhs
    const lakhs = Math.floor(n / 100000);
    words += convertLessThanThousand(lakhs) + ' Lakh ';
    n %= 100000;
  }
  if (n >= 1000) { // Thousands
    const thousands = Math.floor(n / 1000);
    words += convertLessThanThousand(thousands) + ' Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    words += convertLessThanThousand(n);
  }

  return `Rupees ${words.trim()} Only`;
}
