'use client';

/**
 * Badge components for showing status and role labels.
 *
 * StatusBadge — coloured pill for statuses like "active", "pending", "failed".
 * RoleBadge   — coloured pill for user roles like "Investor", "Project Manager".
 */

import React from 'react';
import { getStatusColor } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, showDot = true, size = 'sm' }: BadgeProps) {
  const colors = getStatusColor(status);
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${colors.bg} ${colors.text} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
      {displayLabel}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin:    'Admin',
  investor: 'Investor',
  owner:    'Project Manager',
  guest:    'Guest',
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const map: Record<string, { bg: string; text: string }> = {
    admin:    { bg: 'bg-purple-100', text: 'text-purple-700' },
    investor: { bg: 'bg-blue-100',   text: 'text-blue-700'   },
    owner:    { bg: 'bg-teal-100',   text: 'text-teal-700'   },
    guest:    { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  };
  const colors = map[role] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  const label  = ROLE_LABELS[role] ?? (role.charAt(0).toUpperCase() + role.slice(1));

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}
