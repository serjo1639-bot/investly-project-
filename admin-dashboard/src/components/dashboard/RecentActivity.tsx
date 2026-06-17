'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Activity } from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';
import { adminApi } from '@/lib/api/admin';
import { RecentActivityItem } from '@/types';

const TYPE_COLORS: Record<RecentActivityItem['type'], string> = {
  investment:   'bg-primary-light text-primary',
  registration: 'bg-success-light text-success',
  project:      'bg-amber-light text-amber',
  payment:      'bg-teal-light text-teal',
};

const TYPE_ICONS: Record<RecentActivityItem['type'], string> = {
  investment:   '📈',
  registration: '👤',
  project:      '📋',
  payment:      '💳',
};

export function RecentActivity() {
  const [items, setItems]     = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getRecentActivity(10)
      .then(setItems)
      .catch(() => setItems([]))
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

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-text-muted text-sm gap-2">
          <Activity size={32} className="opacity-30" />
          <span>No recent activity</span>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="divide-y divide-border-light">
          {items.map((item) => {
            const type = item.type in TYPE_COLORS ? item.type : 'payment';
            const actionText = item.projectTitle
              ? `${item.action} ${item.projectTitle}`
              : item.action;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-background-dark/30 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[type]} text-base`}>
                  {TYPE_ICONS[type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.userName}</p>
                  <p className="text-xs text-text-muted truncate">
                    {actionText}
                    {item.amount != null && item.amount > 0 && (
                      <span className="text-primary font-medium"> — {item.amount.toLocaleString()} LYD</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {item.status && <StatusBadge status={item.status} size="sm" />}
                  <span className="text-[10px] text-text-light">{getRelativeTime(item.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
