'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { PieChart as PieIcon } from 'lucide-react';
import { ProjectStatusBreakdown } from '@/types';

const STATUS_COLORS = {
  Active:    '#10B981',
  Pending:   '#F59E0B',
  Completed: '#4361EE',
  Inactive:  '#BDC5DC',
  Rejected:  '#EF4444',
};

interface SliceItem { name: string; value: number; color: string; }

function toSlices(breakdown: ProjectStatusBreakdown): SliceItem[] {
  return [
    { name: 'Active',    value: breakdown.active,    color: STATUS_COLORS.Active },
    { name: 'Pending',   value: breakdown.pending,   color: STATUS_COLORS.Pending },
    { name: 'Completed', value: breakdown.completed, color: STATUS_COLORS.Completed },
    { name: 'Inactive',  value: breakdown.inactive,  color: STATUS_COLORS.Inactive },
    { name: 'Rejected',  value: breakdown.rejected,  color: STATUS_COLORS.Rejected },
  ].filter(s => s.value > 0);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: SliceItem }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-surface border border-border-light rounded-xl p-3 shadow-lg text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="font-medium text-text-primary">{item.name}</span>
        <span className="text-text-muted">— {item.value} projects</span>
      </div>
    </div>
  );
}

interface ProjectStatusChartProps {
  data?: ProjectStatusBreakdown;
  loading?: boolean;
}

export function ProjectStatusChart({ data, loading }: ProjectStatusChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const slices = data ? toSlices(data) : [];
  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader
        title="Projects by Status"
        subtitle={total > 0 ? `${total} total projects` : 'Loading...'}
        icon={<PieIcon size={18} />}
      />
      <div className="flex items-center gap-4">
        <div className="h-48 flex-1">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {slices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!loading && !mounted && <div className="h-full" />}
        </div>
        <div className="flex flex-col gap-2 min-w-[120px]">
          {Object.entries(STATUS_COLORS).map(([name, color]) => {
            const slice = slices.find(s => s.name === name);
            return (
              <div key={name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-text-muted">{name}</span>
                </div>
                <span className="text-xs font-semibold text-text-primary">
                  {loading ? '—' : (slice?.value ?? 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
