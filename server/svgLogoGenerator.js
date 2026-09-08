// Dynamic SVG Logo Generator for Companies
function generateCompanySvgLogo(companyName = 'Company') {
  const cleanName = (companyName || 'Company').trim();
  const words = cleanName.split(/\s+/).filter(w => !/^(pvt|ltd|limited|private|inc|llc|corp)$/i.test(w));
  let initials = 'CO';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  // Generate consistent color based on company name
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80" width="280" height="80">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue1}, 80%, 45%)" />
      <stop offset="100%" stop-color="hsl(${hue2}, 85%, 35%)" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect x="8" y="10" width="60" height="60" rx="14" fill="url(#grad)" filter="url(#shadow)"/>
  <text x="38" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text>
  <text x="80" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">${cleanName.slice(0, 20)}</text>
  <text x="80" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#64748b" letter-spacing="1">OFFICIAL CORPORATE PAYROLL</text>
</svg>`;
}

module.exports = { generateCompanySvgLogo };
