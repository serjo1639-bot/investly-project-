'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { investmentsApi } from '@/lib/api/investments';
import { Investment } from '@/types';
import { extractError, formatDate, formatCurrency } from '@/lib/utils';
import { RefreshCw, Download } from 'lucide-react';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// payment methods removed as they are no longer in the Investment type

// Method labels removed

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await investmentsApi.getAllInvestments({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
      });
      setInvestments(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setInvestments([]);
      setTotal(0);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetch, search]);

  const totalAmount = investments.reduce((sum, inv) => inv.status === 'completed' ? sum + inv.amount : sum, 0);
  const completedCount = investments.filter(i => i.status === 'completed').length;
  const pendingCount = investments.filter(i => i.status === 'pending').length;

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (inv: Investment) => (
        <span className="font-mono text-xs text-text-secondary">{inv.reference}</span>
      ),
    },
    {
      key: 'investor',
      header: 'Investor',
      render: (inv: Investment) => (
        <span className="text-sm font-medium text-text-primary">{inv.investorName}</span>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (inv: Investment) => (
        <span className="text-sm text-text-secondary">{inv.projectTitle}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (inv: Investment) => (
        <span className="text-sm font-semibold text-text-primary">{formatCurrency(inv.amount, 'LYD')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv: Investment) => <StatusBadge status={inv.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (inv: Investment) => (
        <span className="text-xs text-text-muted">{formatDate(inv.createdAt)}</span>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Investments">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Investments</h1>
              <p className="text-sm text-text-muted mt-1">{total} total investments</p>
            </div>
            <Button variant="outline" size="sm" icon={<Download size={14} />}>Export CSV</Button>
          </div>
        </div>

        {/* Summary cards */}
        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            Unable to load live investment data: {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Investments', value: total.toString(), color: 'text-primary' },
            { label: 'Completed', value: completedCount.toString(), color: 'text-success' },
            { label: 'Pending', value: pendingCount.toString(), color: 'text-amber' },
            { label: 'Total Volume', value: formatCurrency(totalAmount), color: 'text-teal' },
          ].map((s) => (
            <Card key={s.label} padding="sm">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card padding="none">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border-light">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by investor, project, reference..." className="w-80" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-36" />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetch}>Refresh</Button>
          </div>
          <Table columns={columns} data={investments} loading={loading} getRowKey={(i) => i.id} emptyMessage="No investments found." />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} total={total} pageSize={PAGE_SIZE} />
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
