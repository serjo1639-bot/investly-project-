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
  ArrowLeft, Mail, Phone, Building, Calendar, Wallet, TrendingUp,
  FolderOpen, Shield, Edit, UserX, CheckCircle, Save, AlertTriangle,
  FileCheck, FileX, ZoomIn, X, MapPin, Users,
} from 'lucide-react';

// ── Select options ────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'investor', label: 'Investor' },
  { value: 'owner',    label: 'Project Manager' },
  { value: 'admin',    label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned',    label: 'Banned' },
];

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Prefer not to say' },
];

// ── KYC status helpers ────────────────────────────────────────────────────────

const KYC_COLOR: Record<string, string> = {
  approved: 'bg-success-light text-success border-success/20',
  rejected: 'bg-danger-light text-danger border-danger/20',
  pending:  'bg-amber-light text-amber border-amber/20',
  none:     'bg-background-dark text-text-muted border-border',
};

const KYC_LABEL: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending:  'Pending Review',
  none:     'Not Submitted',
};

// ── Mock fallback ─────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'mock',
  name: 'Ahmad Al-Mansouri',
  email: 'ahmad@example.com',
  phone: '+218 91 1234567',
  role: 'investor',
  age: 29,
  gender: 'male',
  location: 'Tripoli, Libya',
  passportUrl: null,
  status: 'active',
  walletBalance: 25000,
  totalTopups: 45000,
  contributionTotal: 20000,
  contributionsCount: 4,
  projectsCount: 0,
  companyName: null,
  bio: 'Tech investor based in Tripoli.',
  createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
  isVerified: true,
  kycStatus: 'pending',
};

// ── Reusable label-value row ──────────────────────────────────────────────────

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
  const router  = useRouter();

  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [showEdit,   setShowEdit]   = useState(false);
  const [editForm,   setEditForm]   = useState<Partial<User>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState('');

  // Suspend modal
  const [showSuspend,   setShowSuspend]   = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Passport lightbox
  const [passportOpen, setPassportOpen] = useState(false);

  // KYC actions
  const [kycAction,  setKycAction]  = useState<'approve' | 'reject' | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError,   setKycError]   = useState('');

  useEffect(() => {
    usersApi.getUserById(id)
      .then(setUser)
      .catch(() => setUser({ ...MOCK_USER, id }))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Edit helpers ──────────────────────────────────────────────────────────

  const openEdit = () => {
    if (!user) return;
    setEditForm({
      name:        user.name,
      email:       user.email,
      phone:       user.phone,
      role:        user.role,
      age:         user.age ?? undefined,
      gender:      user.gender ?? undefined,
      location:    user.location ?? '',
      status:      user.status,
      companyName: user.companyName ?? '',
      bio:         user.bio ?? '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await usersApi.updateUser(user.id, editForm);
      setUser(updated);
    } catch (err) {
      setUser((prev) => prev ? { ...prev, ...editForm } : prev);
      console.warn('API unavailable — applied locally:', extractError(err));
    } finally {
      setEditLoading(false);
      setShowEdit(false);
    }
  };

  // ── Suspend helpers ───────────────────────────────────────────────────────

  const isSuspended = user?.status === 'suspended';

  const handleSuspendToggle = async () => {
    if (!user) return;
    setSuspendLoading(true);
    try {
      if (isSuspended) {
        await usersApi.unsuspendUser(user.id);
        setUser((prev) => prev ? { ...prev, status: 'active' } : prev);
      } else {
        await usersApi.suspendUser(user.id, suspendReason || undefined);
        setUser((prev) => prev ? { ...prev, status: 'suspended' } : prev);
      }
    } catch {
      setUser((prev) => prev ? { ...prev, status: isSuspended ? 'active' : 'suspended' } : prev);
    } finally {
      setSuspendLoading(false);
      setShowSuspend(false);
      setSuspendReason('');
    }
  };

  // ── KYC helpers ───────────────────────────────────────────────────────────

  const handleKycAction = async () => {
    if (!user || !kycAction) return;
    setKycLoading(true);
    setKycError('');
    try {
      if (kycAction === 'approve') {
        await usersApi.approveKyc(user.id);
        setUser((prev) => prev ? { ...prev, kycStatus: 'approved', isVerified: true } : prev);
      } else {
        await usersApi.rejectKyc(user.id, rejectNote || undefined);
        setUser((prev) => prev ? { ...prev, kycStatus: 'rejected' } : prev);
      }
    } catch (err) {
      // Apply locally in mock mode
      const next = kycAction === 'approve' ? 'approved' : 'rejected';
      setUser((prev) => prev ? { ...prev, kycStatus: next, isVerified: kycAction === 'approve' } : prev);
      console.warn('KYC API unavailable — applied locally:', extractError(err));
    } finally {
      setKycLoading(false);
      setKycAction(null);
      setRejectNote('');
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

  if (!user) return null;

  const kycStatus = user.kycStatus ?? 'none';

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="User Profile">

        {/* Back + actions header */}
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
                icon={isSuspended ? <CheckCircle size={14} /> : <UserX size={14} />}
                onClick={() => setShowSuspend(true)}
              >
                {isSuspended ? 'Unsuspend' : 'Suspend'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Left column: profile card ─────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <div className="flex flex-col items-center text-center">
                <Avatar name={user.name} size="xl" />
                <h2 className="text-lg font-bold text-text-primary mt-3">{user.name}</h2>
                <p className="text-sm text-text-muted">{user.email}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status ?? 'active'} />
                </div>
                {user.bio && (
                  <p className="text-xs text-text-muted mt-3 text-center leading-relaxed">{user.bio}</p>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-border-light">
                <InfoRow icon={<Mail size={15} />}     label="Email"        value={user.email} />
                <InfoRow icon={<Phone size={15} />}    label="Phone"        value={user.phone} />
                {user.age && (
                  <InfoRow icon={<Calendar size={15} />} label="Age"        value={`${user.age} years old`} />
                )}
                {user.gender && (
                  <InfoRow icon={<Users size={15} />}   label="Gender"      value={<span className="capitalize">{user.gender === 'other' ? 'Prefer not to say' : user.gender}</span>} />
                )}
                {user.location && (
                  <InfoRow icon={<MapPin size={15} />}  label="Location"    value={user.location} />
                )}
                {user.companyName && (
                  <InfoRow icon={<Building size={15} />} label="Company"    value={user.companyName} />
                )}
                <InfoRow icon={<Calendar size={15} />} label="Member Since" value={formatDate(user.createdAt)} />
              </div>
            </Card>

            {/* ── Account Details ──────────────────────────────────────────── */}
            <Card>
              <CardHeader title="Account Details" />
              <InfoRow icon={<Shield size={15} />} label="User ID"    value={<span className="font-mono text-xs">{user.id}</span>} />
              <InfoRow icon={<Shield size={15} />} label="Member ID"  value={user.memberId ?? '—'} />
              <InfoRow icon={<Shield size={15} />} label="Verified"   value={user.isVerified ? '✓ Verified' : '✗ Not Verified'} />
              <InfoRow icon={<Shield size={15} />} label="Top-ups"    value={formatCurrency(user.totalTopups ?? 0)} />
            </Card>
          </div>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Financial stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Wallet size={18} />,    label: 'Wallet Balance', value: formatCurrency(user.walletBalance ?? 0),    color: 'text-primary' },
                { icon: <TrendingUp size={18} />, label: 'Total Invested', value: formatCurrency(user.contributionTotal ?? 0), color: 'text-teal'    },
                { icon: <TrendingUp size={18} />, label: 'Investments',    value: `${user.contributionsCount ?? 0}`,           color: 'text-amber'   },
                { icon: <FolderOpen size={18} />, label: 'Projects',       value: `${user.projectsCount ?? 0}`,                color: 'text-danger'  },
              ].map((stat) => (
                <Card key={stat.label} padding="sm">
                  <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                  <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* ── KYC / Identity Verification card ─────────────────────────── */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <CardHeader title="Identity Verification (KYC)" />
                {/* KYC status pill */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${KYC_COLOR[kycStatus]}`}>
                  {kycStatus === 'approved' && <CheckCircle size={12} />}
                  {kycStatus === 'rejected' && <X size={12} />}
                  {KYC_LABEL[kycStatus]}
                </span>
              </div>

              {user.passportUrl ? (
                <>
                  {/* Passport image preview */}
                  <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-border-light mb-4"
                    onClick={() => setPassportOpen(true)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.passportUrl}
                      alt="Passport"
                      className="w-full h-56 object-cover"
                    />
                    {/* Zoom overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-medium text-sm">
                        <ZoomIn size={20} />
                        Click to enlarge
                      </div>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="flex items-start gap-3 p-3 bg-background-dark rounded-xl border border-border-light mb-4">
                    <Shield size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                      The image above is the user&apos;s passport. Verify the photo matches the user&apos;s name, and that the document appears genuine before approving.
                    </p>
                  </div>

                  {/* Approve / Reject actions — only shown when not already decided */}
                  {kycStatus !== 'approved' && kycStatus !== 'rejected' ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setKycAction('approve')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-success hover:bg-success/90 transition-colors"
                      >
                        <FileCheck size={16} />
                        Approve Identity
                      </button>
                      <button
                        onClick={() => setKycAction('reject')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-colors"
                      >
                        <FileX size={16} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    /* Already decided — show re-review option */
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted">
                        {kycStatus === 'approved'
                          ? 'Identity verified — user is approved to use the platform.'
                          : 'Identity rejected — user cannot invest or submit projects.'}
                      </p>
                      <button
                        onClick={() => setKycAction(kycStatus === 'approved' ? 'reject' : 'approve')}
                        className="text-xs text-primary underline hover:no-underline ml-3 flex-shrink-0"
                      >
                        {kycStatus === 'approved' ? 'Revoke' : 'Approve instead'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* No passport uploaded yet */
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-background-dark flex items-center justify-center mb-3">
                    <Shield size={28} className="text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">No passport uploaded</p>
                  <p className="text-xs text-text-muted">
                    This user has not submitted a passport yet. They must upload one via the app before KYC can be reviewed.
                  </p>
                </div>
              )}
            </Card>

          </div>
        </div>

        {/* ── Passport lightbox (full-size viewer) ─────────────────────────── */}
        {passportOpen && user.passportUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setPassportOpen(false)}
          >
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPassportOpen(false)}
                className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm"
              >
                <X size={18} /> Close
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.passportUrl}
                alt="Passport full view"
                className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]"
              />
              <p className="text-center text-xs text-white/60 mt-3">
                Passport — {user.name}
              </p>
            </div>
          </div>
        )}

        {/* ── KYC Approve / Reject confirmation modal ───────────────────────── */}
        <Modal
          isOpen={!!kycAction}
          onClose={() => { setKycAction(null); setRejectNote(''); setKycError(''); }}
          title={kycAction === 'approve' ? 'Approve Identity' : 'Reject Identity'}
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setKycAction(null); setRejectNote(''); }}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleKycAction}
                disabled={kycLoading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
                  kycAction === 'approve'
                    ? 'bg-success hover:bg-success/90'
                    : 'bg-danger hover:bg-danger/90'
                }`}
              >
                {kycAction === 'approve' ? <FileCheck size={14} /> : <FileX size={14} />}
                {kycLoading
                  ? 'Processing...'
                  : kycAction === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {kycError && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-3 py-2 text-sm text-danger">
                {kycError}
              </div>
            )}

            {/* Passport thumbnail in the modal */}
            {user.passportUrl && (
              <div className="rounded-xl overflow-hidden border border-border-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.passportUrl}
                  alt="Passport"
                  className="w-full h-36 object-cover"
                />
              </div>
            )}

            <div className={`flex items-start gap-3 p-3 rounded-xl border ${
              kycAction === 'approve'
                ? 'bg-success-light border-success/20'
                : 'bg-danger-light border-danger/20'
            }`}>
              <AlertTriangle size={17} className={`flex-shrink-0 mt-0.5 ${kycAction === 'approve' ? 'text-success' : 'text-danger'}`} />
              <p className="text-sm text-text-secondary">
                {kycAction === 'approve'
                  ? `Approving ${user.name}'s identity will mark them as verified and allow full platform access.`
                  : `Rejecting ${user.name}'s identity will block them from investing or submitting projects.`}
              </p>
            </div>

            {/* Rejection reason — only shown when rejecting */}
            {kycAction === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Reason for rejection <span className="text-text-muted font-normal">(shown to user)</span>
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Passport image is blurry, document expired, name does not match..."
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-danger/20 focus:border-danger px-3 py-2.5 resize-none"
                />
              </div>
            )}
          </div>
        </Modal>

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
            <Input
              label="Full Name"
              value={editForm.name ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter full name"
            />
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
              <Input
                label="Age"
                type="number"
                value={editForm.age != null ? String(editForm.age) : ''}
                onChange={(e) => setEditForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="18–100"
              />
              <Input
                label="Location / Country"
                value={(editForm.location as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>
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
                <label className="block text-sm font-medium text-text-primary mb-1.5">Gender</label>
                <Select
                  options={GENDER_OPTIONS}
                  value={(editForm.gender as string) ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value as User['gender'] }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Status</label>
              <Select
                options={STATUS_OPTIONS}
                value={editForm.status ?? 'active'}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as User['status'] }))}
              />
            </div>
            <Input
              label="Company Name (optional)"
              value={(editForm.companyName as string) ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="Company or project name"
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

        {/* ── Suspend / Unsuspend Modal ─────────────────────────────────────── */}
        <Modal
          isOpen={showSuspend}
          onClose={() => setShowSuspend(false)}
          title={isSuspended ? 'Unsuspend User' : 'Suspend User'}
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
                  isSuspended ? 'bg-primary hover:bg-primary/90' : 'bg-amber hover:bg-amber/90'
                }`}
              >
                {isSuspended ? <CheckCircle size={14} /> : <UserX size={14} />}
                {suspendLoading ? 'Processing...' : isSuspended ? 'Confirm Unsuspend' : 'Confirm Suspend'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-light rounded-xl border border-amber/20">
              <AlertTriangle size={18} className="text-amber flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                {isSuspended
                  ? `Unsuspending ${user.name} will restore their platform access.`
                  : `Suspending ${user.name} will temporarily block their access. You can unsuspend them later.`}
              </p>
            </div>
            {!isSuspended && (
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
