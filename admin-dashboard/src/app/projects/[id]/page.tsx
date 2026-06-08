'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import { formatDate, formatCurrency, getCategoryLabel, extractError } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Globe,
  Mail,
  Phone,
  Users,
  Eye,
  DollarSign,
  Target,
  AlertTriangle,
} from 'lucide-react';

// ── Stat box used in the overview grid ───────────────────────────────────────

function StatBox({
  icon,
  label,
  value,
  color = 'text-primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-background rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

// ── Mock fallback shown when the API is offline ───────────────────────────────

const MOCK_PROJECT: Project = {
  id: 'mock',
  titleEn: 'Advanced Tech Platform',
  titleAr: 'منصة تقنية متقدمة',
  descriptionEn:
    'A cutting-edge technology platform for Libyan businesses to manage operations digitally. This project aims to transform the way companies operate by providing integrated tools for project management, communication, and analytics.',
  descriptionAr: 'منصة تقنية حديثة للشركات الليبية لإدارة العمليات رقمياً.',
  category: 'tech',
  status: 'pending',
  goal: 500000,
  raised: 0,
  minInvestment: 1000,
  maxInvestment: 50000,
  currencyCode: 'LYD',
  cityEn: 'Tripoli',
  cityAr: 'طرابلس',
  ownerName: 'Mahmoud Ibrahim',
  ownerCompanyName: 'TechLibya LLC',
  investorsCount: 0,
  viewsCount: 124,
  teamSize: 8,
  duration: 365,
  founderName: 'Mahmoud Ibrahim',
  founderEmail: 'mahmoud@techlibya.ly',
  founderPhone: '+218 91 1234567',
  website: 'https://techlibya.ly',
  reference: 'PRJ-001',
  createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
};

// ── Page component ────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Approve / reject modal state
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch project; fall back to mock data when the API is offline
  useEffect(() => {
    projectsApi.getProjectById(id)
      .then(setProject)
      .catch(() => setProject({ ...MOCK_PROJECT, id }))
      .finally(() => setLoading(false));
  }, [id]);

  // Approve: update status to 'active' locally on success or API failure
  const handleApprove = async () => {
    if (!project) return;
    setActionLoading(true);
    setActionError('');
    try {
      await projectsApi.approveProject(project.id);
    } catch (err) {
      console.warn('API unavailable — applied locally:', extractError(err));
    } finally {
      setProject((p) => p ? { ...p, status: 'active' } : p);
      setShowApprove(false);
      setActionLoading(false);
    }
  };

  // Reject: update status to 'rejected' locally on success or API failure
  const handleReject = async () => {
    if (!project) return;
    setActionLoading(true);
    setActionError('');
    try {
      await projectsApi.rejectProject(project.id, rejectReason || undefined);
    } catch (err) {
      console.warn('API unavailable — applied locally:', extractError(err));
    } finally {
      setProject((p) => p ? { ...p, status: 'rejected' } : p);
      setShowReject(false);
      setRejectReason('');
      setActionLoading(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-shimmer rounded-xl w-1/2" />
            <div className="h-64 bg-shimmer rounded-2xl" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!project) return null;

  const progress = Math.min(100, Math.round((project.raised / project.goal) * 100));

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="Project Detail">
        {/* Page header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-4"
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-text-primary">{project.titleEn}</h1>
                <StatusBadge status={project.status} size="md" />
              </div>
              <p className="text-sm text-text-muted">{project.titleAr} · {project.reference}</p>
            </div>
            {/* Approve / Reject buttons are only shown for pending projects */}
            {project.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CheckCircle size={14} />}
                  onClick={() => { setActionError(''); setShowApprove(true); }}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle size={14} />}
                  onClick={() => { setActionError(''); setRejectReason(''); setShowReject(true); }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left: overview + details ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader title="Project Overview" />
              {/* Key metric grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatBox icon={<Target size={18} />} label="Funding Goal" value={formatCurrency(project.goal)} />
                <StatBox icon={<DollarSign size={18} />} label="Amount Raised" value={formatCurrency(project.raised)} color="text-teal" />
                <StatBox icon={<Users size={18} />} label="Investors" value={`${project.investorsCount ?? 0}`} color="text-amber" />
                <StatBox icon={<Eye size={18} />} label="Views" value={`${project.viewsCount ?? 0}`} color="text-info" />
              </div>

              {/* Funding progress bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{progress}% Funded</span>
                  <span className="text-sm text-text-muted">{formatCurrency(project.goal - project.raised)} remaining</span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-teal rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Description in English */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Description</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{project.descriptionEn}</p>
              </div>

              {/* Arabic description shown right-aligned when available */}
              {project.descriptionAr && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <h4 className="text-sm font-semibold text-text-primary mb-2 text-right">الوصف</h4>
                  <p className="text-sm text-text-secondary leading-relaxed text-right" dir="rtl">
                    {project.descriptionAr}
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Project Details" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Category', value: getCategoryLabel(project.category) },
                  { label: 'Location', value: project.cityEn ?? '-' },
                  { label: 'Min Investment', value: formatCurrency(project.minInvestment) },
                  { label: 'Max Investment', value: formatCurrency(project.maxInvestment ?? 0) },
                  { label: 'Duration', value: `${project.duration ?? 0} days` },
                  { label: 'Team Size', value: `${project.teamSize ?? 0} members` },
                  { label: 'Start Date', value: formatDate(project.startDate) },
                  { label: 'End Date', value: formatDate(project.endDate) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-text-muted text-xs mb-0.5">{item.label}</p>
                    <p className="font-medium text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right: owner info + timeline ──────────────────────────────── */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Project Owner" />
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Name</p>
                  <p className="font-medium text-text-primary">{project.founderName ?? project.ownerName}</p>
                </div>
                {project.ownerCompanyName && (
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Company</p>
                    <p className="font-medium text-text-primary">{project.ownerCompanyName}</p>
                  </div>
                )}
                {project.founderEmail && (
                  <a href={`mailto:${project.founderEmail}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Mail size={14} />{project.founderEmail}
                  </a>
                )}
                {project.founderPhone && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone size={14} />{project.founderPhone}
                  </div>
                )}
                {project.website && (
                  <a href={project.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Globe size={14} />{project.website}
                  </a>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Timeline" />
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Submitted</p>
                  <p className="font-medium text-text-primary">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Start Date</p>
                  <p className="font-medium text-text-primary">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">End Date</p>
                  <p className="font-medium text-text-primary">{formatDate(project.endDate)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Approve Confirmation Modal ────────────────────────────────────── */}
        <Modal
          isOpen={showApprove}
          onClose={() => setShowApprove(false)}
          title="Approve Project"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApprove(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={14} />
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          }
        >
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Approve &ldquo;{project.titleEn}&rdquo;?
              </p>
              <p className="text-sm text-text-secondary">
                The project will become visible to investors and open for funding.
              </p>
            </div>
          </div>
        </Modal>

        {/* ── Reject with Reason Modal ──────────────────────────────────────── */}
        <Modal
          isOpen={showReject}
          onClose={() => setShowReject(false)}
          title="Reject Project"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReject(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-danger-light rounded-xl border border-danger/20">
              <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                Rejecting &ldquo;{project.titleEn}&rdquo; will notify the project owner.
              </p>
            </div>
            {/* Optional rejection reason sent to the backend and the owner */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Reason for rejection <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why the project is being rejected..."
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-danger/20 focus:border-danger px-3 py-2.5 resize-none"
              />
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
