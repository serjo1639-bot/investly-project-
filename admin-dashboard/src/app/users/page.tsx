'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/Modal';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types';
import { formatDate, formatCurrency, extractError } from '@/lib/utils';
import { Ban, Trash2, Eye, RefreshCw, UserX, AlertTriangle } from 'lucide-react';

const PAGE_SIZE = 15;

// â”€â”€ Filter options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'investor', label: 'Investor' },
  { value: 'owner', label: 'Project Owner' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Blocked' },
];

// â”€â”€ Users are loaded from the backend only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Page component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Suspend modal state
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Ban / delete confirmation state
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users from the real API. Do not fall back to fake rows in real mode,
  // because fake data hides backend/auth/CORS problems.
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.getAllUsers({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setUsers([]);
      setTotal(0);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  // Re-fetch whenever filters or page changes (debounced for search)
  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  // â”€â”€ Action handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setActionLoading(true);
    const isBlocked = suspendTarget.isBlocked === true;
    try {
      if (isBlocked) {
        await usersApi.unsuspendUser(suspendTarget.id);
      } else {
        await usersApi.suspendUser(suspendTarget.id, suspendReason || undefined);
      }
      // Optimistically toggle status in the table
      setUsers((prev) =>
        prev.map((u) =>
          u.id === suspendTarget.id
            ? { ...u, isBlocked: !isBlocked }
            : u
        )
      );
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
      setSuspendTarget(null);
      setSuspendReason('');
    }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    setActionLoading(true);
    try {
      await usersApi.banUser(banTarget.id);
      setBanTarget(null);
      fetchUsers();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await usersApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  // â”€â”€ Table columns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
          <div>
            <p className="font-medium text-text-primary text-sm">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => <RoleBadge role={user.role} />,
    },
    {
      key: 'type',
      header: 'Type',
      render: (user: User) => (
        <span className="text-xs text-text-muted capitalize">{user.type}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => <StatusBadge status={user.isBlocked ? 'suspended' : (user.isActive ? 'active' : 'pending')} />,
    },
    {
      key: 'walletBalance',
      header: 'Wallet',
      render: (user: User) => (
        <span className="text-sm font-medium text-teal">{formatCurrency(user.walletBalance ?? 0)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (user: User) => (
        <span className="text-xs text-text-muted">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '130px',
      render: (user: User) => (
        // stopPropagation prevents the row click from firing when buttons are pressed
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/users/${user.id}`)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
            title="View profile"
          >
            <Eye size={14} />
          </button>
          {/* Suspend toggles between suspend and unsuspend based on current status */}
          <button
            onClick={() => { setSuspendReason(''); setSuspendTarget(user); }}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              user.isBlocked
                ? 'text-text-muted hover:text-primary hover:bg-primary-light'
                : 'text-text-muted hover:text-amber hover:bg-amber-light'
            }`}
            title={user.isBlocked ? 'Unblock user' : 'Block user'}
          >
            <UserX size={14} />
          </button>
          <button
            onClick={() => setBanTarget(user)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
            title="Ban user permanently"
          >
            <Ban size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(user)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
            title="Delete user"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <ProtectedRoute>
      <DashboardLayout title="Users">
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-sm text-text-muted mt-1">{total.toLocaleString()} registered users</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Card padding="none">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border-light">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email..."
              className="w-72"
            />
            <Select
              options={ROLE_OPTIONS}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-36"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-36"
            />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchUsers}>
              Refresh
            </Button>
          </div>

          <Table
            columns={columns}
            data={users}
            loading={loading}
            getRowKey={(u) => u.id}
            emptyMessage="No users found matching your filters."
            onRowClick={(u) => router.push(`/users/${u.id}`)}
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            onPageChange={setPage}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </Card>

        {/* â”€â”€ Suspend / Unsuspend modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Modal
          isOpen={!!suspendTarget}
          onClose={() => { setSuspendTarget(null); setSuspendReason(''); }}
          title={suspendTarget?.isBlocked ? 'Unblock User' : 'Block User'}
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setSuspendTarget(null); setSuspendReason(''); }}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber rounded-xl hover:bg-amber/90 transition-colors disabled:opacity-50"
              >
                <UserX size={14} />
                {actionLoading
                  ? 'Processing...'
                  : suspendTarget?.isBlocked
                  ? 'Confirm Unblock'
                  : 'Confirm Block'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-light rounded-xl border border-amber/20">
              <AlertTriangle size={18} className="text-amber flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                {suspendTarget?.isBlocked
                  ? `Unblocking ${suspendTarget?.firstName} will restore their platform access.`
                  : `Blocking ${suspendTarget?.firstName} will temporarily block their access. You can unblock them later.`}
              </p>
            </div>
            {/* Reason field only appears when suspending, not unsuspending */}
            {suspendTarget && !suspendTarget.isBlocked && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Reason <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for suspension..."
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-amber/20 focus:border-amber px-3 py-2.5 resize-none"
                />
              </div>
            )}
          </div>
        </Modal>

        {/* â”€â”€ Ban confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <ConfirmDialog
          isOpen={!!banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={handleBan}
          title="Ban User"
          message={`Are you sure you want to permanently ban ${banTarget?.firstName}? They will lose all access to the platform.`}
          confirmLabel="Ban User"
          loading={actionLoading}
        />

        {/* â”€â”€ Delete confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete User"
          message={`Permanently delete ${deleteTarget?.firstName}? This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          loading={actionLoading}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

