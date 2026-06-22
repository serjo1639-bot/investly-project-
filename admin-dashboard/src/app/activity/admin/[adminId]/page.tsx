'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { adminApi } from '@/lib/api/admin';
import type { ActivityLog } from '@/app/activity/page';
import { extractError, getRelativeTime, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  LogIn,
  UserCheck,
  FolderOpen,
  TrendingUp,
  CreditCard,
  Settings,
  Trash2,
  Ban,
  CheckCircle,
  Activity,
  Clock,
  Shield,
} from 'lucide-react';

// ── Icon and colour maps (same as the main activity page) ─────────────────────

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

// ── Stat card shown in the summary row ───────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-background rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const { adminId } = useParams<{ adminId: string }>();
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch activity logs for this specific admin from the backend only.
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.getActivityLogs({ adminId } as { page?: number; pageSize?: number; adminId?: string });
        setLogs(Array.isArray(data?.data) ? data.data as ActivityLog[] : []);
      } catch (err) {
        setLogs([]);
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [adminId]);

  // Derive admin name from the first log entry (no separate admin endpoint needed)
  const adminName = logs[0]?.adminName ?? 'Admin';

  // Client-side type filter
  const filtered = typeFilter ? logs.filter((l) => l.type === typeFilter) : logs;

  // ── Summary statistics ────────────────────────────────────────────────────

  const totalActions   = logs.length;
  const approvals      = logs.filter((l) => l.type === 'approve').length;
  const suspensionsBans = logs.filter((l) => l.type === 'ban').length;
  const deletions      = logs.filter((l) => l.type === 'delete').length;

  // Most recent action timestamp
  const lastActive = logs.length > 0
    ? getRelativeTime(logs.reduce((a, b) => a.timestamp > b.timestamp ? a : b).timestamp)
    : '—';

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-shimmer rounded-xl w-1/3" />
            <div className="h-32 bg-shimmer rounded-2xl" />
            <div className="h-64 bg-shimmer rounded-2xl" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="Admin Activity">
        {/* Page header with back link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back to Activity Logs
          </button>
          <div className="flex items-center gap-3">
            {/* Admin avatar placeholder */}
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{adminName}</h1>
              <p className="text-sm text-text-muted">Complete action history · Admin ID: {adminId}</p>
            </div>
          </div>
        </div>

        {/* ── Summary stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<Activity size={18} />}
            label="Total Actions"
            value={totalActions}
            color="bg-primary-light text-primary"
          />
          <StatCard
            icon={<CheckCircle size={18} />}
            label="Approvals"
            value={approvals}
            color="bg-success-light text-success"
          />
          <StatCard
            icon={<Ban size={18} />}
            label="Bans / Suspensions"
            value={suspensionsBans}
            color="bg-danger-light text-danger"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Last Active"
            value={lastActive}
            color="bg-amber-light text-amber"
          />
        </div>

        {/* ── Full action log table ─────────────────────────────────────── */}
        <Card padding="none">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border-light">
            <h2 className="text-sm font-semibold text-text-primary flex-1">
              All Actions by {adminName}
            </h2>
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-44"
            />
            <span className="text-xs text-text-muted">{filtered.length} entries</span>
          </div>

          {error && (
            <div className="m-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
              Unable to load live activity data: {error}
            </div>
          )}

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

                {/* Log entry content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-text-primary">{log.action}</span>
                      {log.entity && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-background rounded-lg text-text-muted capitalize">
                          {log.entity}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-text-muted">{getRelativeTime(log.timestamp)}</p>
                      {log.ip && <p className="text-[10px] text-text-light mt-0.5">{log.ip}</p>}
                    </div>
                  </div>
                  {log.details && (
                    <p className="text-xs text-text-muted mt-0.5">{log.details}</p>
                  )}
                  <p className="text-[10px] text-text-light mt-1">{formatDateTime(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">
              No actions found{typeFilter ? ' for this filter' : ''}.
            </div>
          )}
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
