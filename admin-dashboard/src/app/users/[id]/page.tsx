'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types';
import { formatDate, formatCurrency, extractError } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Wallet,
  TrendingUp,
  FolderOpen,
  Shield,
  Edit,
  UserX,
  CheckCircle,
  Save,
  AlertTriangle,
} from 'lucide-react';

// ── Select options ────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'investor', label: 'Investor' },
  { value: 'owner', label: 'Project Owner' },
  { value: 'admin', label: 'Admin' },
];

const TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'organization', label: 'Organization' },
];

// ── Mock fallback used when the API is offline ────────────────────────────────

// ── Reusable label-value row used in info cards ───────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-light last:border-0">
      <div className="text-text-muted mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <div className="text-sm font-medium text-text-primary">{value}</div>
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Suspend/unsuspend modal state
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Fetch user on mount; fall back to mock data if API is unavailable
  useEffect(() => {
    setLoadError('');
    usersApi.getUserById(id)
      .then(setUser)
      .catch((err) => {
        setUser(null);
        setLoadError(extractError(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Populate the edit form with current user values
  const openEdit = () => {
    if (!user) return;
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      type: user.type,
      companyName: user.companyName ?? '',
      bio: user.bio ?? '',
    });
    setEditError('');
    setShowEdit(true);
  };

  // Save edited user — optimistically update local state if API call fails
  const handleEditSave = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await usersApi.updateUser(user.id, editForm);
      setUser(updated);
      setShowEdit(false);
    } catch (err) {
      setEditError(extractError(err));
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle block / unblock — optimistically update status
  const isBlocked = user?.isBlocked === true;

  const handleSuspendToggle = async () => {
    if (!user) return;
    setSuspendLoading(true);
    try {
      if (isBlocked) {
        await usersApi.unsuspendUser(user.id);
        setUser((prev) => prev ? { ...prev, isBlocked: false } : prev);
      } else {
        await usersApi.suspendUser(user.id, suspendReason || undefined);
        setUser((prev) => prev ? { ...prev, isBlocked: true } : prev);
      }
      setShowSuspend(false);
    } catch (err) {
      setEditError(extractError(err));
    } finally {
      setSuspendLoading(false);
      setSuspendReason('');
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-shimmer rounded-xl w-1/3" />
            <div className="h-48 bg-shimmer rounded-2xl" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="User Profile">
          <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            Unable to load live user data: {loadError || 'User not found'}
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="User Profile">
        {/* Page header with back link and action buttons */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Users
          </button>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-text-primary">User Profile</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Edit size={14} />} onClick={openEdit}>
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={isBlocked ? <CheckCircle size={14} /> : <UserX size={14} />}
                onClick={() => setShowSuspend(true)}
              >
                {isBlocked ? 'Unblock' : 'Block'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left column: profile card ─────────────────────────────────── */}
          <div className="lg:col-span-1">
            <Card>
              <div className="flex flex-col items-center text-center">
                <Avatar name={`${user.firstName} ${user.lastName}`} size="xl" />
                <h2 className="text-lg font-bold text-text-primary mt-3">{user.firstName} {user.lastName}</h2>
                <p className="text-sm text-text-muted">{user.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.isBlocked ? 'suspended' : (user.isActive ? 'active' : 'pending')} />
                </div>
                {user.bio && (
                  <p className="text-xs text-text-muted mt-3 text-center leading-relaxed">{user.bio}</p>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-border-light">
                <InfoRow icon={<Mail size={15} />} label="Email" value={user.email} />
                <InfoRow icon={<Phone size={15} />} label="Phone" value={user.phone} />
                {user.companyName && (
                  <InfoRow icon={<Building size={15} />} label="Company" value={user.companyName} />
                )}
                <InfoRow icon={<Calendar size={15} />} label="Member Since" value={formatDate(user.createdAt)} />
              </div>
            </Card>
          </div>

          {/* ── Right column: stats and account details ───────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Financial stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Wallet size={18} />, label: 'Wallet Balance', value: formatCurrency(user.walletBalance ?? 0), color: 'text-primary' },
                { icon: <TrendingUp size={18} />, label: 'Total Invested', value: formatCurrency(user.contributionTotal ?? 0), color: 'text-teal' },
                { icon: <TrendingUp size={18} />, label: 'Investments', value: `${user.contributionsCount ?? 0}`, color: 'text-amber' },
                { icon: <FolderOpen size={18} />, label: 'Projects', value: `${user.projectsCount ?? 0}`, color: 'text-danger' },
              ].map((stat) => (
                <Card key={stat.label} padding="sm">
                  <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                  <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* Account metadata */}
            <Card>
              <CardHeader title="Account Details" />
              <div className="grid grid-cols-2 gap-x-6">
                <InfoRow icon={<Shield size={15} />} label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
                <InfoRow icon={<Shield size={15} />} label="Member ID" value={user.memberId ?? '-'} />
                <InfoRow icon={<Shield size={15} />} label="Account Type" value={<span className="capitalize">{user.type}</span>} />
                <InfoRow icon={<Shield size={15} />} label="Verified" value={user.isVerified ? '✓ Verified' : '✗ Not Verified'} />
                <InfoRow icon={<Shield size={15} />} label="Total Top-ups" value={formatCurrency(user.totalTopups ?? 0)} />
              </div>
            </Card>
          </div>
        </div>

        {/* ── Edit User Modal ───────────────────────────────────────────────── */}
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit User"
          size="md"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          }
        >
          {editError && (
            <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-3 py-2 text-sm text-danger">
              {editError}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={editForm.firstName ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="First name"
              />
              <Input
                label="Last Name"
                value={editForm.lastName ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <Input
              label="Email Address"
              type="email"
              value={editForm.email ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
            />
            <Input
              label="Phone Number"
              value={editForm.phone ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+218 91 1234567"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Role</label>
                <Select
                  options={ROLE_OPTIONS}
                  value={editForm.role ?? 'investor'}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as User['role'] }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Account Type</label>
                <Select
                  options={TYPE_OPTIONS}
                  value={editForm.type ?? 'individual'}
                  onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as User['type'] }))}
                />
              </div>
            </div>
            <Input
              label="Company Name (optional)"
              value={(editForm.companyName as string) ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="Company or organization name"
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Bio</label>
              <textarea
                value={(editForm.bio as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Short bio..."
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5 resize-none"
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showSuspend}
          onClose={() => setShowSuspend(false)}
          title={isBlocked ? 'Unblock User' : 'Block User'}
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSuspend(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendToggle}
                disabled={suspendLoading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 ${
                  isBlocked ? 'bg-primary hover:bg-primary/90' : 'bg-amber hover:bg-amber/90'
                }`}
              >
                {isBlocked ? <CheckCircle size={14} /> : <UserX size={14} />}
                {suspendLoading
                  ? 'Processing...'
                  : isBlocked
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
                {isBlocked
                  ? `Unblocking ${user.firstName} will restore their access to the platform.`
                  : `Blocking ${user.firstName} will temporarily block their access. You can unblock them later.`}
              </p>
            </div>

            {/* Reason textarea — only shown when suspending */}
            {!isBlocked && (
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
