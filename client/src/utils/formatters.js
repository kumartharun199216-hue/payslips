export const formatCurrency = (amount, symbol = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) return `${symbol}0.00`;
  const formatted = Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

export const maskAccountNumber = (accNo) => {
  if (!accNo || accNo.length < 4) return accNo || '-';
  const visible = accNo.slice(-4);
  const masked = '*'.repeat(Math.max(4, accNo.length - 4));
  return `${masked}${visible}`;
};

export const maskSensitive = (str, visibleChars = 4) => {
  if (!str) return '-';
  if (str.length <= visibleChars) return str;
  const visible = str.slice(-visibleChars);
  return '*'.repeat(str.length - visibleChars) + visible;
};
