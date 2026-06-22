'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = {
  active: '#10B981',
  pending: '#F59E0B',
  completed: '#4361EE',
  inactive: '#BDC5DC',
  rejected: '#EF4444',
};

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface ProjectStatusChartProps {
  data?: StatusData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: StatusData }>;
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

export function ProjectStatusChart({ data = [] }: ProjectStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader
        title="Projects by Status"
        subtitle={`${total} total projects`}
        icon={<PieIcon size={18} />}
      />
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-text-muted">
          No live project status data available.
        </div>
      ) : (
      <div className="flex items-center gap-4">
        <div className="h-48 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 min-w-[120px]">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-text-muted">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </Card>
  );
}
