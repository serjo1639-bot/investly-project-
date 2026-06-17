'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getRelativeTime, formatDateTime } from '@/lib/utils';
import {
  LogIn,
  UserCheck,
  FolderOpen,
  TrendingUp,
  CreditCard,
  Settings,
  Trash2,
  Ban,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

// ── ActivityLog type ──────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  adminId: string;       // used to build the per-admin route
  adminName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  type: string;
  timestamp: string;
  ip?: string;
}

// ── Icon and colour maps keyed by action type ─────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  login:      <LogIn size={15} />,
  user:       <UserCheck size={15} />,
  project:    <FolderOpen size={15} />,
  investment: <TrendingUp size={15} />,
  payment:    <CreditCard size={15} />,
  settings:   <Settings size={15} />,
  delete:     <Trash2 size={15} />,
  ban:        <Ban size={15} />,
  approve:    <CheckCircle size={15} />,
};

const COLOR_MAP: Record<string, string> = {
  login:      'bg-primary-light text-primary',
  user:       'bg-teal-light text-teal',
  project:    'bg-amber-light text-amber',
  investment: 'bg-success-light text-success',
  payment:    'bg-info-light text-info',
  settings:   'bg-purple-100 text-purple-600',
  delete:     'bg-danger-light text-danger',
  ban:        'bg-orange-100 text-orange-600',
  approve:    'bg-success-light text-success',
};


// ── Filter options ────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Logins' },
  { value: 'user', label: 'User Actions' },
  { value: 'project', label: 'Project Actions' },
  { value: 'approve', label: 'Approvals' },
  { value: 'ban', label: 'Bans / Suspensions' },
  { value: 'delete', label: 'Deletions' },
  { value: 'settings', label: 'Settings' },
];

// ── Page component ────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    adminApi.getActivityLogs().then((data) => {
      if (Array.isArray(data)) setLogs(data);
    }).catch(() => setLogs([]));
  }, []);

  const filtered = logs.filter((log) => {
    if (typeFilter && log.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.adminName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.details ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <DashboardLayout title="Activity Logs">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Activity Logs</h1>
          <p className="text-sm text-text-muted mt-1">All admin actions and platform events</p>
        </div>

        <Card padding="none">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border-light">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by admin, action or details..."
              className="w-72"
            />
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-44"
            />
            <span className="text-xs text-text-muted ml-auto">{filtered.length} entries</span>
          </div>

          {/* Log list */}
          <div className="divide-y divide-border-light">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-background-dark/20 transition-colors"
              >
                {/* Action type icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[log.type] ?? 'bg-gray-100 text-gray-500'}`}>
                  {ICON_MAP[log.type] ?? <Settings size={15} />}
                </div>

                {/* Log content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/*
                        Clicking the admin name navigates to their personal activity log page.
                        Using a button styled as a link keeps the layout intact.
                      */}
                      <button
                        onClick={() => router.push(`/activity/admin/${log.adminId}`)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {log.adminName}
                      </button>
                      <span className="text-sm text-text-secondary"> — {log.action}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-text-muted">{getRelativeTime(log.timestamp)}</p>
                      {log.ip && <p className="text-[10px] text-text-light mt-0.5">{log.ip}</p>}
                    </div>
                  </div>
                  {log.details && (
                    <p className="text-xs text-text-muted mt-0.5">{log.details}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-text-light">{formatDateTime(log.timestamp)}</p>
                    {/* Quick link to the admin's full history */}
                    <button
                      onClick={() => router.push(`/activity/admin/${log.adminId}`)}
                      className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-primary transition-colors"
                    >
                      View all by {log.adminName} <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">No activity logs found</div>
          )}
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
