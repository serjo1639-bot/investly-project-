'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';

const LIVE_DATA: Array<{ month: string; revenue: number; investments: number }> = [];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border-light rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted capitalize">{entry.name}:</span>
          <span className="font-medium text-text-primary">
            {(entry.value / 1000).toFixed(0)}K LYD
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  return (
    <Card>
      <CardHeader
        title="Revenue Overview"
        subtitle="Monthly revenue and investments"
        icon={<TrendingUp size={18} />}
        action={
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-primary inline-block" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-teal inline-block" />
              Investments
            </span>
          </div>
        }
      />
      {LIVE_DATA.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-text-muted">
          No live monthly revenue data available yet.
        </div>
      ) : (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={LIVE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4361EE" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00B4A0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00B4A0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EBFF" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#8892AD' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8892AD' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4361EE"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="investments"
              stroke="#00B4A0"
              strokeWidth={2}
              fill="url(#colorInvestments)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </Card>
  );
}
