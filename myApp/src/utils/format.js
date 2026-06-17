/**
 * format.js — Presentation helpers (currency, numbers, dates, percentages).
 * Pure functions, no side effects — easy to unit test and reuse.
 */

/** Format an amount as Libyan Dinar (default) currency. */
export function formatCurrency(amount, currency = 'LYD', locale = 'en-US') {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale)} ${currency}`;
  }
}

/** Compact number formatting: 12500 -> "12.5K". */
export function formatCompact(num, locale = 'en-US') {
  const value = Number(num) || 0;
  try {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
      value
    );
  } catch {
    return String(value);
  }
}

export function formatNumber(num, locale = 'en-US') {
  return (Number(num) || 0).toLocaleString(locale);
}

/** Clamp a 0..1 (or 0..100) ratio into a percentage integer. */
export function toPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((Number(value) / Number(total)) * 100)));
}

/** Human date: "12 May 2026". */
export function formatDate(value, locale = 'en-US') {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Full date + time: "12 May 2026, 3:45 PM". */
export function formatDateTime(value, locale = 'en-US') {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return formatDate(value, locale);
  }
}

/** Relative time: "2h ago", "3d ago". Falls back to a date for old items. */
export function formatRelative(value, locale = 'en-US') {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return formatDate(value, locale);
}

/** Initials for avatars: "Seraj Sheleg" -> "SS". */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Capitalize an enum-ish status for display: "in_progress" -> "In progress". */
export function humanize(value = '') {
  if (!value) return '';
  const s = String(value).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
