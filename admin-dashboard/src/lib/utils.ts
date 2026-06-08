/**
 * Shared utility (helper) functions used across the entire dashboard.
 * Import what you need: import { formatCurrency, formatDate } from '@/lib/utils';
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Merges Tailwind CSS class names safely.
 * Pass any number of class strings, arrays, or conditionals and get one clean string back.
 * Example: cn('text-sm', isActive && 'font-bold') → 'text-sm font-bold'
 */
export function cn(...inputs: ClassValue[]) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ');
}

/** Formats a number as Libyan Dinar currency (e.g. 5000 → "LYD 5,000"). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-LY', {
    style: 'currency',
    currency: 'LYD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Shortens large numbers for display: 1500 → "1.5K", 2000000 → "2.0M". */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/** Formats an ISO date string to a readable date like "15 Mar 2024". Returns "-" if empty. */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Same as formatDate but also includes the time: "15 Mar 2024, 10:30". */
export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns a human-friendly relative time: "5m ago", "3h ago", "2d ago". Falls back to formatDate for older dates. */
export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/** Extracts up to 2 initials from a full name: "Ahmed Ali" → "AA", "Sara" → "S". */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

/**
 * Converts any caught error value into a plain, readable string.
 * Handles Axios errors (HTTP responses), network errors, and plain Error objects.
 * Use this in catch blocks: setError(extractError(err))
 */
export function extractError(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    // No response means the server is unreachable (not running, wrong URL, CORS preflight failed)
    if (!e.response && (e.message === 'Network Error' || e.code === 'ERR_NETWORK')) {
      return 'Unable to connect to the server. Please make sure the backend is running.';
    }
    if (e.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    const axiosData = (e.response as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    if (axiosData?.message && typeof axiosData.message === 'string') return axiosData.message;
    if (axiosData?.title && typeof axiosData.title === 'string') return axiosData.title;
    if (e.message && typeof e.message === 'string') return e.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Returns the Tailwind CSS colour classes for a given status string.
 * Used by StatusBadge so that every component shows the same colours
 * for "active", "pending", "failed", etc.
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    suspended: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    banned: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    refunded: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  };
  return map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}

/** Converts a short category key to its full display name: 'agri' → 'Agriculture'. */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tech: 'Technology',
    energy: 'Renewable Energy',
    agri: 'Agriculture',
    health: 'Health',
    edu: 'Education',
    realestate: 'Real Estate',
  };
  return labels[category] ?? category;
}
