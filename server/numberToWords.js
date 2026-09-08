// Utility to convert Indian Currency numbers to words
function numberToWords(amount) {
  if (!amount || amount === 0) return 'Zero Rupees Only';
  const num = Math.round(Math.abs(amount));

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertThreeDigits(n) {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred';
      if (n % 100 !== 0) str += ' and ';
    }
    if (n % 100 !== 0) {
      str += convertTwoDigits(n % 100);
    }
    return str;
  }

  let words = '';
  let rem = num;

  if (rem >= 10000000) {
    words += convertThreeDigits(Math.floor(rem / 10000000)) + ' Crore ';
    rem %= 10000000;
  }
  if (rem >= 100000) {
    words += convertThreeDigits(Math.floor(rem / 100000)) + ' Lakh ';
    rem %= 100000;
  }
  if (rem >= 1000) {
    words += convertThreeDigits(Math.floor(rem / 1000)) + ' Thousand ';
    rem %= 1000;
  }
  if (rem > 0) {
    words += convertThreeDigits(rem);
  }

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

module.exports = { numberToWords };
