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
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import { formatDate, formatCurrency, getCategoryLabel, extractError, exportToCsv } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  Download,
} from 'lucide-react';

const PAGE_SIZE = 15;

// Platform policy: Technology is the only category.
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'tech', label: 'Technology' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'rejected', label: 'Rejected' },
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
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
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
    } catch {
      setProjects([]);
      setTotal(0);
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

  const handleExport = () => {
    exportToCsv<Project>('projects', [
      { header: 'Title (EN)', value: (p) => p.titleEn },
      { header: 'Title (AR)', value: (p) => p.titleAr },
      { header: 'Category', value: (p) => getCategoryLabel(p.category) },
      { header: 'Status', value: (p) => p.status },
      { header: 'Goal', value: (p) => p.goal },
      { header: 'Raised', value: (p) => p.raised },
      { header: 'Investors', value: (p) => p.investorsCount ?? 0 },
      { header: 'Owner', value: (p) => p.ownerName ?? '' },
      { header: 'City', value: (p) => p.cityEn ?? '' },
      { header: 'Submitted', value: (p) => formatDate(p.createdAt) },
    ], projects);
  };

  const columns = [
    {
      key: 'title',
      header: 'Project',
      render: (p: Project) => (
        <div>
          <p className="font-medium text-text-primary text-sm">{p.titleEn}</p>
          <p className="text-xs text-text-muted">{p.cityEn} · {getCategoryLabel(p.category)}</p>
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
        const pct = Math.min(100, Math.round((p.raised / p.goal) * 100));
        return (
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-primary">{pct}%</span>
              <span className="text-xs text-text-muted">{formatCurrency(p.raised)}</span>
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
      key: 'goal',
      header: 'Goal',
      render: (p: Project) => (
        <span className="text-sm font-medium text-text-primary">{formatCurrency(p.goal)}</span>
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
            <div className="flex gap-2">
              <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} disabled={projects.length === 0}>Export CSV</Button>
              <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>New Project</Button>
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

        <ConfirmDialog isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} title="Approve Project" message={`Approve "${approveTarget?.titleEn}" and make it visible to investors?`} confirmLabel="Approve" confirmVariant="primary" loading={actionLoading} />
        <ConfirmDialog isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} title="Reject Project" message={`Reject "${rejectTarget?.titleEn}"? The owner will be notified.`} confirmLabel="Reject" loading={actionLoading} />
        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Project" message={`Permanently delete "${deleteTarget?.titleEn}"? This cannot be undone.`} confirmLabel="Delete" loading={actionLoading} />

        <NewProjectModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            setPage(1);
            fetchProjects();
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
