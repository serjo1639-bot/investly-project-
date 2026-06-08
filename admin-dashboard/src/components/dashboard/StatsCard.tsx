'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color?: 'primary' | 'teal' | 'amber' | 'danger' | 'success';
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

const colorMap = {
  primary: { icon: 'bg-primary-light text-primary', glow: 'shadow-primary/10' },
  teal: { icon: 'bg-teal-light text-teal', glow: 'shadow-teal/10' },
  amber: { icon: 'bg-amber-light text-amber', glow: 'shadow-amber/10' },
  danger: { icon: 'bg-danger-light text-danger', glow: 'shadow-danger/10' },
  success: { icon: 'bg-success-light text-success', glow: 'shadow-success/10' },
};

export function StatsCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  color = 'primary',
  prefix = '',
  suffix = '',
  loading = false,
}: StatsCardProps) {
  const colors = colorMap[color];
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className={`bg-surface rounded-2xl border border-border-light p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              change >= 0 ? 'text-success bg-success-light' : 'text-danger bg-danger-light'
            }`}
          >
            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="h-7 bg-shimmer rounded-lg animate-pulse mb-2 w-2/3" />
          <div className="h-4 bg-shimmer rounded animate-pulse w-1/2" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-text-primary">
            {prefix}{displayValue}{suffix}
          </p>
          <p className="text-sm text-text-muted mt-1">{title}</p>
          {changeLabel && (
            <p className="text-xs text-text-light mt-0.5">{changeLabel}</p>
          )}
        </>
      )}
    </div>
  );
}
