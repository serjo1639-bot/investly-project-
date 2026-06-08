'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Activity } from 'lucide-react';
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

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'investment', user: 'Ahmad Al-Mansouri', action: 'invested in Tech Platform', amount: 5000, status: 'completed', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '2', type: 'registration', user: 'Fatima Zahra', action: 'registered as investor', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: '3', type: 'project', user: 'Mahmoud Ibrahim', action: 'submitted new project', status: 'pending', timestamp: new Date(Date.now() - 32 * 60000).toISOString() },
  { id: '4', type: 'payment', user: 'Khaled Hassan', action: 'topped up wallet', amount: 10000, status: 'completed', timestamp: new Date(Date.now() - 58 * 60000).toISOString() },
  { id: '5', type: 'investment', user: 'Sara Ali', action: 'invested in Green Energy', amount: 2500, status: 'pending', timestamp: new Date(Date.now() - 80 * 60000).toISOString() },
  { id: '6', type: 'project', user: 'Omar Qaddafi', action: 'project approved', status: 'active', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
];

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
        {MOCK_ACTIVITY.map((item) => (
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
