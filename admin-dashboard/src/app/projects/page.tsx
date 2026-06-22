'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import { formatDate, formatCurrency, getCategoryLabel, extractError } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const PAGE_SIZE = 15;

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'tech', label: 'Technology' },
  { value: 'energy', label: 'Renewable Energy' },
  { value: 'agri', label: 'Agriculture' },
  { value: 'health', label: 'Health' },
  { value: 'edu', label: 'Education' },
  { value: 'realestate', label: 'Real Estate' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'rejected', label: 'Rejected' },
];

// Mock data fallback
const MOCK_PROJECTS: Project[] = [
  { id: 'p1', title: 'منصة تقنية متقدمة', category: 'tech', status: 'active', fundingGoal: 500000, currentAmount: 320000, minInvestment: 1000, ownerName: 'Mahmoud Ibrahim', city: 'طرابلس', investorsCount: 64, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'p2', title: 'ذكاء اصطناعي للأعمال', category: 'tech', status: 'pending', fundingGoal: 750000, currentAmount: 0, minInvestment: 2000, ownerName: 'Sara Ali', city: 'بنغازي', investorsCount: 0, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'p3', title: 'منصة تعليمية ذكية', category: 'edu', status: 'active', fundingGoal: 300000, currentAmount: 285000, minInvestment: 500, ownerName: 'Khaled Hassan', city: 'مصراتة', investorsCount: 130, createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'p4', title: 'إدارة سلسلة التوريد', category: 'tech', status: 'completed', fundingGoal: 200000, currentAmount: 200000, minInvestment: 1000, ownerName: 'Ahmad Al-Mansouri', city: 'الزاوية', investorsCount: 45, createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'p5', title: 'تطبيق صحة رقمية', category: 'health', status: 'active', fundingGoal: 400000, currentAmount: 180000, minInvestment: 500, ownerName: 'Fatima Zahra', city: 'سبها', investorsCount: 72, createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: 'p6', title: 'منصة تجارة إلكترونية', category: 'tech', status: 'pending', fundingGoal: 600000, currentAmount: 0, minInvestment: 1500, ownerName: 'Omar Said', city: 'طرابلس', investorsCount: 0, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'p7', title: 'مشروع طاقة خضراء', category: 'energy', status: 'active', fundingGoal: 1000000, currentAmount: 650000, minInvestment: 5000, ownerName: 'Ali Hassan', city: 'طرابلس', investorsCount: 28, createdAt: new Date(Date.now() - 120 * 86400000).toISOString() },
  { id: 'p8', title: 'ابتكار زراعي', category: 'agri', status: 'rejected', fundingGoal: 250000, currentAmount: 0, minInvestment: 1000, ownerName: 'Nadia Ibrahim', city: 'سبها', investorsCount: 0, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approveTarget, setApproveTarget] = useState<Project | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.getAllProjects({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setProjects(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setProjects([]);
      setTotal(0);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProjects, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchProjects, search]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await projectsApi.approveProject(approveTarget.id);
      setApproveTarget(null);
      fetchProjects();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await projectsApi.rejectProject(rejectTarget.id);
      setRejectTarget(null);
      fetchProjects();
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
      await projectsApi.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Project',
      render: (p: Project) => (
        <div>
          <p className="font-medium text-text-primary text-sm">{p.title}</p>
          <p className="text-xs text-text-muted">{p.city} · {getCategoryLabel(p.category)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Project) => <StatusBadge status={p.status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (p: Project) => {
        const pct = Math.min(100, Math.round((p.currentAmount / p.fundingGoal) * 100));
        return (
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-primary">{pct}%</span>
              <span className="text-xs text-text-muted">{formatCurrency(p.currentAmount)}</span>
            </div>
            <div className="h-1.5 bg-background-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'fundingGoal',
      header: 'Goal',
      render: (p: Project) => (
        <span className="text-sm font-medium text-text-primary">{formatCurrency(p.fundingGoal)}</span>
      ),
    },
    {
      key: 'investors',
      header: 'Investors',
      render: (p: Project) => (
        <span className="text-sm text-text-secondary">{p.investorsCount ?? 0}</span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (p: Project) => (
        <span className="text-sm text-text-secondary">{p.ownerName ?? '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (p: Project) => (
        <span className="text-xs text-text-muted">{formatDate(p.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (p: Project) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/projects/${p.id}`)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
            title="View"
          >
            <Eye size={14} />
          </button>
          {p.status === 'pending' && (
            <>
              <button
                onClick={() => setApproveTarget(p)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-success hover:bg-success-light transition-colors"
                title="Approve"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={() => setRejectTarget(p)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                title="Reject"
              >
                <XCircle size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => setDeleteTarget(p)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Projects">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Project Management</h1>
              <p className="text-sm text-text-muted mt-1">{total} total projects</p>
            </div>

          </div>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <Card padding="none">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border-light">
            <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="w-72" />
            <Select options={CATEGORY_OPTIONS} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="w-44" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40" />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchProjects}>Refresh</Button>
          </div>

          <Table
            columns={columns}
            data={projects}
            loading={loading}
            getRowKey={(p) => p.id}
            emptyMessage="No projects found."
            onRowClick={(p) => router.push(`/projects/${p.id}`)}
          />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} total={total} pageSize={PAGE_SIZE} />
        </Card>

        <ConfirmDialog isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} title="Approve Project" message={`Approve "${approveTarget?.title}" and make it visible to investors?`} confirmLabel="Approve" confirmVariant="primary" loading={actionLoading} />
        <ConfirmDialog isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} title="Reject Project" message={`Reject "${rejectTarget?.title}"? The owner will be notified.`} confirmLabel="Reject" loading={actionLoading} />
        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Project" message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" loading={actionLoading} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

