'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { notificationsApi } from '@/lib/api/notifications';
import { Notification } from '@/types';
import { extractError, getRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, MessageSquare, AlertCircle, TrendingUp, FolderOpen } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  investment: <TrendingUp size={16} />,
  project: <FolderOpen size={16} />,
  system: <AlertCircle size={16} />,
  user: <MessageSquare size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
  investment: 'bg-primary-light text-primary',
  project: 'bg-amber-light text-amber',
  system: 'bg-danger-light text-danger',
  user: 'bg-teal-light text-teal',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    notificationsApi.getAll()
      .then(setNotifications)
      .catch((err) => {
        setNotifications([]);
        setLoadError(extractError(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try { await notificationsApi.markAllAsRead(); } catch { }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    try { await notificationsApi.markAsRead(id); } catch { }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <ProtectedRoute>
      <DashboardLayout title="Notifications">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-muted mt-1">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
              Mark All Read
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {loadError && (
              <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                Unable to load live notification data: {loadError}
              </div>
            )}
            <Card padding="none">
              <CardHeader title="All Notifications" subtitle={`${notifications.length} total`} icon={<Bell size={18} />} />
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-shimmer rounded-xl animate-pulse" />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">No notifications yet</div>
              ) : (
                <div className="divide-y divide-border-light">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-background-dark/30 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[notif.type] ?? 'bg-gray-100 text-gray-500'}`}>
                        {TYPE_ICONS[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${notif.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>{notif.title}</p>
                          {!notif.isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-text-light mt-1">{getRelativeTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-3">
            {([
              { type: 'investment', label: 'Investment' },
              { type: 'project', label: 'Projects' },
              { type: 'user', label: 'Users' },
              { type: 'system', label: 'System' },
            ] as const).map((s) => (
              <Card key={s.type} padding="sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${TYPE_COLORS[s.type]}`}>{TYPE_ICONS[s.type]}</div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">{notifications.filter((n) => n.type === s.type).length}</p>
                    <p className="text-xs text-text-muted">{s.label} Notifications</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
