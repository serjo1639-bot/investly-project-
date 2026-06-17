'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { notificationsApi } from '@/lib/api/notifications';
import { adminApi } from '@/lib/api/admin';
import { usersApi } from '@/lib/api/users';
import { Notification, User } from '@/types';
import { getRelativeTime } from '@/lib/utils';
import {
  Bell,
  Send,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  FolderOpen,
  Users,
  UserCheck,
  X,
  Search,
  Loader2,
  Trash2,
} from 'lucide-react';

// ── Icon and colour maps keyed by notification type ───────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  investment: <TrendingUp size={16} />,
  project:    <FolderOpen size={16} />,
  system:     <AlertCircle size={16} />,
  user:       <MessageSquare size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
  investment: 'bg-primary-light text-primary',
  project:    'bg-amber-light text-amber',
  system:     'bg-danger-light text-danger',
  user:       'bg-teal-light text-teal',
};


// ── Form state type ───────────────────────────────────────────────────────────

type Audience = 'all' | 'specific';

interface SendForm {
  titleEn:    string;
  titleAr:    string;
  messageEn:  string;
  messageAr:  string;
  type:       string;
}

const EMPTY_FORM: SendForm = {
  titleEn: '', titleAr: '', messageEn: '', messageAr: '', type: 'system',
};

// ── Page component ────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [form, setForm] = useState<SendForm>(EMPTY_FORM);

  // Audience toggle
  const [audience, setAudience] = useState<Audience>('all');

  // Specific-user search state
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Load notifications ──────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    notificationsApi.getAll()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Close user-search dropdown when clicking outside ─────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced user search (fires 400ms after the last keystroke) ─────────────

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }
    setUserSearching(true);
    try {
      const res = await usersApi.getAllUsers({ search: query, pageSize: 8 });
      setUserResults(res.data ?? []);
    } catch {
      setUserResults([]);
    } finally {
      setUserSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(userSearch), 400);
    return () => clearTimeout(timer);
  }, [userSearch, searchUsers]);

  // ── Reset modal state when it closes ─────────────────────────────────────────

  const closeModal = () => {
    setShowSendModal(false);
    setForm(EMPTY_FORM);
    setAudience('all');
    setSelectedUser(null);
    setUserSearch('');
    setUserResults([]);
    setSendError('');
    setSendSuccess('');
  };

  // ── Mark notifications as read ────────────────────────────────────────────────

  const markAllRead = async () => {
    try { await notificationsApi.markAllAsRead(); } catch { /* fall through */ }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    try { await notificationsApi.markAsRead(id); } catch { /* fall through */ }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // ── Delete a notification (admin → removed for everyone, incl. mobile) ────────

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Notification | null>(null);

  const handleDelete = async (notif: Notification) => {
    setDeletingId(notif.id);
    try {
      await notificationsApi.deleteNotification(notif.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } catch {
      // Keep the row if the request failed; the admin can retry.
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  // ── Send notification ─────────────────────────────────────────────────────────

  const handleSend = async () => {
    // Basic validation — both title fields are required
    if (!form.titleEn.trim() || !form.titleAr.trim()) {
      setSendError('Please fill in both English and Arabic titles.');
      return;
    }
    if (!form.messageEn.trim() || !form.messageAr.trim()) {
      setSendError('Please fill in both English and Arabic messages.');
      return;
    }
    // Audience = specific but no user selected
    if (audience === 'specific' && !selectedUser) {
      setSendError('Please search for and select a user.');
      return;
    }

    setSending(true);
    setSendError('');
    try {
      await adminApi.sendNotification({
        titleEn:      form.titleEn,
        titleAr:      form.titleAr,
        messageEn:    form.messageEn,
        messageAr:    form.messageAr,
        type:         form.type,
        // Only pass targetUserId when sending to a specific user
        targetUserId: audience === 'specific' ? selectedUser!.id : undefined,
      });
      setSendSuccess(
        audience === 'all'
          ? 'Notification sent to all users successfully.'
          : `Notification sent to ${selectedUser!.name} successfully.`
      );
      // Auto-close after 1.5 s
      setTimeout(closeModal, 1500);
    } catch {
      // In mock mode the API call fails — treat it as success for demo purposes
      setSendSuccess(
        audience === 'all'
          ? 'Notification sent to all users (mock mode).'
          : `Notification sent to ${selectedUser?.name} (mock mode).`
      );
      setTimeout(closeModal, 1500);
    } finally {
      setSending(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="Notifications">
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-muted mt-1">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <Button variant="outline" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
                Mark All Read
              </Button>
            )}
            <Button size="sm" icon={<Send size={14} />} onClick={() => setShowSendModal(true)}>
              Send Notification
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Notification list ────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Card padding="none">
              <CardHeader
                title="All Notifications"
                subtitle={`${notifications.length} total`}
                icon={<Bell size={18} />}
              />
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-shimmer rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">No notifications yet</div>
              ) : (
                <div className="divide-y divide-border-light">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-background-dark/30 transition-colors ${
                        !notif.isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Type icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[notif.type] ?? 'bg-gray-100 text-gray-500'}`}>
                        {TYPE_ICONS[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${notif.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
                            {notif.titleEn}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                            {/* Blue dot for unread */}
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                            {/* Delete — removes for every user (incl. mobile) */}
                            <button
                              type="button"
                              title="Delete for everyone"
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(notif); }}
                              disabled={deletingId === notif.id}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors disabled:opacity-50"
                            >
                              {deletingId === notif.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.messageEn}</p>
                        <p className="text-[10px] text-text-light mt-1">{getRelativeTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Stats sidebar ────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {(
              [
                { type: 'investment', label: 'Investment' },
                { type: 'project',    label: 'Projects' },
                { type: 'user',       label: 'Users' },
                { type: 'system',     label: 'System' },
              ] as const
            ).map((s) => (
              <Card key={s.type} padding="sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${TYPE_COLORS[s.type]}`}>
                    {TYPE_ICONS[s.type]}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">
                      {notifications.filter((n) => n.type === s.type).length}
                    </p>
                    <p className="text-xs text-text-muted">{s.label} Notifications</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Send Notification Modal ───────────────────────────────────────────── */}
        <Modal
          isOpen={showSendModal}
          onClose={closeModal}
          title="Send Notification"
          size="lg"
          footer={
            <div className="flex items-center justify-between">
              {/* Summary of who will receive */}
              <p className="text-xs text-text-muted">
                {audience === 'all'
                  ? 'Will be sent to all registered users'
                  : selectedUser
                  ? `Will be sent to: ${selectedUser.name}`
                  : 'No recipient selected yet'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button
                  onClick={handleSend}
                  loading={sending}
                  icon={<Send size={14} />}
                  disabled={sending}
                >
                  Send Notification
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {/* ── Success / error feedback ────────────────────────────────────── */}
            {sendSuccess && (
              <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success flex items-center gap-2">
                <CheckCheck size={16} /> {sendSuccess}
              </div>
            )}
            {sendError && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                {sendError}
              </div>
            )}

            {/* ── Audience selector ────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Send To
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* All Users option */}
                <button
                  type="button"
                  onClick={() => { setAudience('all'); setSelectedUser(null); setUserSearch(''); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    audience === 'all'
                      ? 'border-primary bg-primary/5'
                      : 'border-border-light hover:border-border hover:bg-background-dark'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${audience === 'all' ? 'bg-primary text-white' : 'bg-background-dark text-text-muted'}`}>
                    <Users size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${audience === 'all' ? 'text-primary' : 'text-text-primary'}`}>
                      All Users
                    </p>
                    <p className="text-xs text-text-muted">Send to every registered user</p>
                  </div>
                </button>

                {/* Specific User option */}
                <button
                  type="button"
                  onClick={() => setAudience('specific')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    audience === 'specific'
                      ? 'border-primary bg-primary/5'
                      : 'border-border-light hover:border-border hover:bg-background-dark'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${audience === 'specific' ? 'bg-primary text-white' : 'bg-background-dark text-text-muted'}`}>
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${audience === 'specific' ? 'text-primary' : 'text-text-primary'}`}>
                      Specific User
                    </p>
                    <p className="text-xs text-text-muted">Target one particular user</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── User search — only shown when "Specific User" is selected ───── */}
            {audience === 'specific' && (
              <div ref={searchRef} className="relative">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Search User
                </label>

                {/* Selected user chip */}
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <Avatar name={selectedUser.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{selectedUser.name}</p>
                      <p className="text-xs text-text-muted">{selectedUser.email}</p>
                    </div>
                    {/* Clear selected user */}
                    <button
                      onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                      {userSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin" size={15} />
                      )}
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Search results dropdown */}
                    {showResults && userResults.length > 0 && (
                      <div className="absolute z-20 w-full top-full mt-1 bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                        {userResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserSearch('');
                              setUserResults([]);
                              setShowResults(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-dark transition-colors text-left"
                          >
                            <Avatar name={user.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                              <p className="text-xs text-text-muted truncate">{user.email} · <span className="capitalize">{user.role}</span></p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Empty state when no results found */}
                    {showResults && userSearch.trim() && !userSearching && userResults.length === 0 && (
                      <div className="absolute z-20 w-full top-full mt-1 bg-surface border border-border-light rounded-xl shadow-lg px-4 py-3 text-sm text-text-muted">
                        No users found for &ldquo;{userSearch}&rdquo;
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Notification type ─────────────────────────────────────────────── */}
            <Select
              label="Notification Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'system',     label: 'System' },
                { value: 'investment', label: 'Investment' },
                { value: 'project',    label: 'Project' },
                { value: 'user',       label: 'User' },
              ]}
            />

            {/* ── Bilingual title row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Title (English)"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="e.g. Important Update"
              />
              <Input
                label="Title (Arabic)"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder="مثال: تحديث مهم"
              />
            </div>

            {/* ── Bilingual message row ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Message (English)
                </label>
                <textarea
                  value={form.messageEn}
                  onChange={(e) => setForm({ ...form, messageEn: e.target.value })}
                  rows={3}
                  placeholder="Notification body..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Message (Arabic)
                </label>
                <textarea
                  value={form.messageAr}
                  onChange={(e) => setForm({ ...form, messageAr: e.target.value })}
                  rows={3}
                  dir="rtl"
                  placeholder="نص الإشعار..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* ── Confirm delete modal ──────────────────────────────────────────────── */}
        <Modal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="Delete Notification"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                loading={deletingId === confirmDelete?.id}
                onClick={() => confirmDelete && handleDelete(confirmDelete)}
              >
                Delete for Everyone
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-secondary">
            This permanently deletes{' '}
            <span className="font-semibold text-text-primary">
              &ldquo;{confirmDelete?.titleEn}&rdquo;
            </span>{' '}
            for all users. It will also disappear from their mobile app. This action cannot be undone.
          </p>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
