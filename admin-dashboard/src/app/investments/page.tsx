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
import { formatDate, formatCurrency } from '@/lib/utils';
import { RefreshCw, Download } from 'lucide-react';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'recharge_card', label: 'Recharge Card' },
];

// Mock data
const MOCK_INVESTMENTS: Investment[] = Array.from({ length: 50 }, (_, i) => ({
  id: `inv-${i + 1}`,
  projectId: `p${(i % 8) + 1}`,
  projectTitle: ['Tech Platform', 'AI Intelligence', 'Smart Education', 'Supply Chain', 'Digital Health', 'E-Commerce', 'Green Energy', 'Agri Innovation'][i % 8],
  reference: `INV-${String(1000 + i).padStart(4, '0')}`,
  amount: [1000, 2500, 5000, 10000, 500, 15000, 3000, 7500][i % 8],
  currency: 'LYD',
  paymentMethod: (['wallet', 'credit_card', 'recharge_card'] as Investment['paymentMethod'][])[i % 3],
  status: (['completed', 'completed', 'pending', 'completed', 'failed'] as Investment['status'][])[i % 5],
  investorId: `user-${(i % 10) + 1}`,
  investorName: ['Ahmad Al-Mansouri', 'Fatima Zahra', 'Khaled Hassan', 'Sara Ali', 'Omar Said'][i % 5],
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

const METHOD_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  credit_card: 'Credit Card',
  recharge_card: 'Recharge Card',
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await investmentsApi.getAllInvestments({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
      });
      setInvestments(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      let filtered = MOCK_INVESTMENTS;
      if (search) filtered = filtered.filter((i) =>
        i.investorName?.toLowerCase().includes(search.toLowerCase()) ||
        i.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
        i.reference?.toLowerCase().includes(search.toLowerCase())
      );
      if (statusFilter) filtered = filtered.filter((i) => i.status === statusFilter);
      if (methodFilter) filtered = filtered.filter((i) => i.paymentMethod === methodFilter);
      setTotal(filtered.length);
      setInvestments(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, methodFilter]);

  useEffect(() => {
    const t = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetch, search]);

  const totalAmount = investments.reduce((sum, inv) => inv.status === 'completed' ? sum + inv.amount : sum, 0);

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
        <span className="text-sm font-semibold text-text-primary">{formatCurrency(inv.amount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (inv: Investment) => (
        <span className="text-xs text-text-muted">{METHOD_LABELS[inv.paymentMethod ?? ''] ?? inv.paymentMethod}</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Investments', value: total.toString(), color: 'text-primary' },
            { label: 'Completed', value: MOCK_INVESTMENTS.filter(i => i.status === 'completed').length.toString(), color: 'text-success' },
            { label: 'Pending', value: MOCK_INVESTMENTS.filter(i => i.status === 'pending').length.toString(), color: 'text-amber' },
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
            <Select options={METHOD_OPTIONS} value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }} className="w-40" />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetch}>Refresh</Button>
          </div>
          <Table columns={columns} data={investments} loading={loading} getRowKey={(i) => i.id} emptyMessage="No investments found." />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} total={total} pageSize={PAGE_SIZE} />
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
