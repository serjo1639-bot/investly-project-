'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/Input';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import { formatDate, formatCurrency, getCategoryLabel, extractError } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  AlertTriangle,
  FolderOpen,
  Target,
  User,
  Calendar,
} from 'lucide-react';

// ── Mock pending projects shown when the API is offline ───────────────────────

const MOCK_PENDING: Project[] = [
  {
    id: 'pp1',
    titleEn: 'AI Business Intelligence Platform',
    titleAr: 'منصة ذكاء اصطناعي للأعمال',
    descriptionEn:
      'A comprehensive AI-powered analytics platform that helps Libyan businesses make data-driven decisions. Includes real-time dashboards, predictive analytics, and automated reporting.',
    category: 'tech',
    status: 'pending',
    goal: 750000,
    raised: 0,
    minInvestment: 2000,
    ownerName: 'Sara Ali',
    cityEn: 'Benghazi',
    investorsCount: 0,
    viewsCount: 45,
    teamSize: 6,
    duration: 365,
    founderName: 'Sara Ali',
    founderEmail: 'sara@aibiz.ly',
    founderPhone: '+218 92 1234567',
    reference: 'PRJ-045',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'pp2',
    titleEn: 'Local E-Commerce Platform',
    titleAr: 'منصة تجارة إلكترونية محلية',
    descriptionEn:
      'A dedicated e-commerce platform for Libyan small and medium businesses, with payment integration, delivery tracking, and seller analytics.',
    category: 'tech',
    status: 'pending',
    goal: 600000,
    raised: 0,
    minInvestment: 1500,
    ownerName: 'Omar Said',
    cityEn: 'Tripoli',
    investorsCount: 0,
    viewsCount: 23,
    teamSize: 4,
    duration: 280,
    founderName: 'Omar Said',
    founderEmail: 'omar@shoplib.ly',
    founderPhone: '+218 91 9876543',
    reference: 'PRJ-046',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'pp3',
    titleEn: 'Desert Solar Farm Initiative',
    titleAr: 'مبادرة مزرعة الطاقة الشمسية الصحراوية',
    descriptionEn:
      'A large-scale solar energy project to generate clean electricity for southern Libyan cities, reducing dependence on fossil fuels.',
    category: 'energy',
    status: 'pending',
    goal: 2000000,
    raised: 0,
    minInvestment: 10000,
    ownerName: 'Ali Hassan',
    cityEn: 'Sabha',
    investorsCount: 0,
    viewsCount: 102,
    teamSize: 12,
    duration: 730,
    founderName: 'Ali Hassan',
    founderEmail: 'ali@solarlib.ly',
    founderPhone: '+218 91 5551234',
    reference: 'PRJ-047',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

// ── Page component ────────────────────────────────────────────────────────────

export default function PendingProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Which project the admin is currently reviewing
  const [selected, setSelected] = useState<Project | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load all pending projects from the API
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.getAllProjects({ status: 'pending', pageSize: 100 });
      setProjects(res.data ?? []);
    } catch {
      setProjects(MOCK_PENDING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Client-side search across title (EN/AR) and owner name
  const filtered = search
    ? projects.filter(
        (p) =>
          p.titleEn.toLowerCase().includes(search.toLowerCase()) ||
          p.titleAr.includes(search) ||
          (p.ownerName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await projectsApi.approveProject(selected.id);
    } catch (err) {
      console.warn('API unavailable — applied locally:', extractError(err));
    } finally {
      // Remove the approved project from the pending list
      setProjects((prev) => prev.filter((p) => p.id !== selected.id));
      setShowApprove(false);
      setSelected(null);
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await projectsApi.rejectProject(selected.id, rejectReason || undefined);
    } catch (err) {
      console.warn('API unavailable — applied locally:', extractError(err));
    } finally {
      // Remove the rejected project from the pending list
      setProjects((prev) => prev.filter((p) => p.id !== selected.id));
      setShowReject(false);
      setRejectReason('');
      setSelected(null);
      setActionLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="Pending Review">
        {/* Page heading */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Clock size={22} className="text-amber" />
              <h1 className="text-2xl font-bold text-text-primary">Pending Project Review</h1>
            </div>
            <p className="text-sm text-text-muted">
              {filtered.length} project{filtered.length !== 1 ? 's' : ''} awaiting your review and approval.
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchPending}>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search pending projects..."
            className="w-80"
          />
        </div>

        {/* ── Loading skeleton ────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-shimmer rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen size={48} className="text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No pending projects</h3>
              <p className="text-sm text-text-muted max-w-xs">
                {search
                  ? 'No pending projects match your search.'
                  : 'All projects have been reviewed. Check back later.'}
              </p>
            </div>
          </Card>
        ) : (
          /* ── Project cards ───────────────────────────────────────────── */
          <div className="space-y-4">
            {filtered.map((project) => (
              <Card key={project.id} padding="none">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status="pending" />
                        <span className="text-xs text-text-muted">{project.reference}</span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary">{project.titleEn}</h3>
                      <p className="text-sm text-text-muted mb-3" dir="rtl">{project.titleAr}</p>
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                        {project.descriptionEn}
                      </p>
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1.5">
                          <User size={12} />{project.founderName ?? project.ownerName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Target size={12} />Goal: {formatCurrency(project.goal)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FolderOpen size={12} />{getCategoryLabel(project.category)} · {project.cityEn}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />Submitted: {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary border border-border-light rounded-xl hover:bg-background-dark hover:text-text-primary transition-colors"
                      >
                        <Eye size={13} /> View Full Detail
                      </button>
                      <button
                        onClick={() => { setSelected(project); setShowApprove(true); }}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        onClick={() => { setSelected(project); setRejectReason(''); setShowReject(true); }}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

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
                Approve &ldquo;{selected?.titleEn}&rdquo;?
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
                Rejecting &ldquo;{selected?.titleEn}&rdquo; will notify the project owner.
              </p>
            </div>
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
