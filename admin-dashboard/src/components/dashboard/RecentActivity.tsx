'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Activity } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { getRelativeTime } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'investment' | 'registration' | 'project' | 'payment';
  user: string;
  action: string;
  amount?: number;
  status?: string;
  timestamp: string;
}

const typeColors: Record<ActivityItem['type'], string> = {
  investment: 'bg-primary-light text-primary',
  registration: 'bg-success-light text-success',
  project: 'bg-amber-light text-amber',
  payment: 'bg-teal-light text-teal',
};

const typeIcons: Record<ActivityItem['type'], string> = {
  investment: '📈',
  registration: '👤',
  project: '📋',
  payment: '💳',
};

export function RecentActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getActivityLogs({ pageSize: 6 })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        setActivity(items.map((raw, index: number) => {
          const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
          return {
            id: String(item.id ?? index),
            type: (item.type === 'investment' || item.type === 'payment' || item.type === 'project' ? item.type : 'registration') as ActivityItem['type'],
            user: String(item.adminName ?? item.userName ?? 'System'),
            action: String(item.action ?? item.details ?? 'Recorded activity'),
            status: item.status ? String(item.status) : undefined,
            timestamp: String(item.timestamp ?? item.createdAt ?? new Date().toISOString()),
          };
        }));
      })
      .catch(() => setActivity([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card padding="none">
      <div className="px-5 pt-5">
        <CardHeader
          title="Recent Activity"
          subtitle="Latest platform events"
          icon={<Activity size={18} />}
        />
      </div>
      <div className="divide-y divide-border-light">
        {loading ? (
          <div className="px-5 py-8 text-sm text-text-muted">Loading live activity...</div>
        ) : activity.length === 0 ? (
          <div className="px-5 py-8 text-sm text-text-muted">No live activity yet.</div>
        ) : activity.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-background-dark/30 transition-colors">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[item.type]} text-base`}>
              {typeIcons[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{item.user}</p>
              <p className="text-xs text-text-muted truncate">
                {item.action}
                {item.amount && <span className="text-primary font-medium"> — {item.amount.toLocaleString()} LYD</span>}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {item.status && <StatusBadge status={item.status} size="sm" />}
              <span className="text-[10px] text-text-light">{getRelativeTime(item.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
