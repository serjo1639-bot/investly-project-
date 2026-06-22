'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Users } from 'lucide-react';

const LIVE_DATA: Array<{ month: string; investors: number; owners: number }> = [];

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
          <span className="font-medium text-text-primary">{entry.value} users</span>
        </div>
      ))}
    </div>
  );
}

export function UserGrowthChart() {
  return (
    <Card>
      <CardHeader
        title="User Growth"
        subtitle="New registrations per month"
        icon={<Users size={18} />}
        action={
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-primary inline-block" />
              Investors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-teal inline-block" />
              Owners
            </span>
          </div>
        }
      />
      {LIVE_DATA.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-text-muted">
          No live monthly user growth data available yet.
        </div>
      ) : (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={LIVE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EBFF" vertical={false} />
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
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EFF1FF' }} />
            <Bar dataKey="investors" fill="#4361EE" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="owners" fill="#00B4A0" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </Card>
  );
}
