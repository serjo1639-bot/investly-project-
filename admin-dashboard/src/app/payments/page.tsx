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
import { adminApi } from '@/lib/api/admin';
import { Payment } from '@/types';
import { extractError, formatDate, formatCurrency } from '@/lib/utils';
import { RefreshCw, Download } from 'lucide-react';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
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
      const res = await adminApi.getAllPayments({ page, pageSize: PAGE_SIZE, status: statusFilter || undefined, search: search || undefined });
      setPayments(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setPayments([]);
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

  const completedTotal = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const failedCount = payments.filter(p => p.status === 'failed').length;
  const refundedTotal = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  const columns = [
    {
      key: 'transactionId',
      header: 'Transaction ID',
      render: (p: Payment) => (
        <span className="font-mono text-xs text-text-secondary">{p.transactionId}</span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (p: Payment) => (
        <span className="text-sm font-medium text-text-primary">{p.userName}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p: Payment) => (
        <span className="text-sm font-semibold text-text-primary">{formatCurrency(p.amount, p.currency)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (p: Payment) => (
        <span className="text-xs capitalize text-text-muted">{(p.method ?? '').replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Payment) => <StatusBadge status={p.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (p: Payment) => (
        <span className="text-xs text-text-muted">{formatDate(p.createdAt)}</span>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Payments">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Payment Transactions</h1>
              <p className="text-sm text-text-muted mt-1">{total} total transactions</p>
            </div>
            <Button variant="outline" size="sm" icon={<Download size={14} />}>Export</Button>
          </div>
        </div>

        {/* Summary */}
        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            Unable to load live payment data: {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Transactions', value: total.toString(), color: 'text-primary' },
            { label: 'Total Volume', value: formatCurrency(completedTotal), color: 'text-teal' },
            { label: 'Failed', value: failedCount.toString(), color: 'text-danger' },
            { label: 'Refunded', value: formatCurrency(refundedTotal), color: 'text-amber' },
          ].map((s) => (
            <Card key={s.label} padding="sm">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card padding="none">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border-light">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by user or transaction ID..." className="w-80" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-36" />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetch}>Refresh</Button>
          </div>
          <Table columns={columns} data={payments} loading={loading} getRowKey={(p) => p.id} emptyMessage="No transactions found." />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} total={total} pageSize={PAGE_SIZE} />
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

