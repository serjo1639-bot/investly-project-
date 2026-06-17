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
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { adminApi } from '@/lib/api/admin';
import { WalletRecord } from '@/types';
import { formatDate, formatCurrency, extractError } from '@/lib/utils';
import { Wallet, RefreshCw, PlusCircle, History } from 'lucide-react';

const PAGE_SIZE = 15;

// ── Balance range filter options ──────────────────────────────────────────────

const BALANCE_OPTIONS = [
  { value: '', label: 'All Balances' },
  { value: 'zero', label: 'Zero Balance' },
  { value: 'low', label: 'Low (< 1,000)' },
  { value: 'medium', label: 'Medium (1k–10k)' },
  { value: 'high', label: 'High (> 10,000)' },
];

const REASON_OPTIONS = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' },
];


// ── Page component ────────────────────────────────────────────────────────────

export default function WalletsPage() {
  const [wallets, setWallets]               = useState<WalletRecord[]>([]);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [balanceFilter, setBalanceFilter]   = useState('');
  const [error, setError]                   = useState('');

  // Add Funds modal
  const [addFundsTarget, setAddFundsTarget]     = useState<WalletRecord | null>(null);
  const [addAmount, setAddAmount]               = useState('');
  const [addReason, setAddReason]               = useState('deposit');
  const [addLoading, setAddLoading]             = useState(false);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getUserWallets({ page, pageSize: PAGE_SIZE, search: search || undefined });
      setWallets(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setWallets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, balanceFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchWallets, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchWallets, search]);

  const handleAddFunds = async () => {
    if (!addFundsTarget || !addAmount) return;
    setAddLoading(true);
    try {
      await adminApi.addFundsToWallet(addFundsTarget.userId, { amount: Number(addAmount), reason: addReason });
      setWallets((prev) =>
        prev.map((w) =>
          w.userId === addFundsTarget.userId
            ? { ...w, balance: w.balance + Number(addAmount) }
            : w
        )
      );
      setAddFundsTarget(null);
      setAddAmount('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setAddLoading(false);
    }
  };

  // ── Stat cards (computed from real data) ─────────────────────────────────────

  const totalVolume   = wallets.reduce((s, w) => s + w.balance, 0);
  const avgBalance    = wallets.length > 0 ? Math.round(totalVolume / wallets.length) : 0;
  const activeWallets = wallets.filter((w) => w.balance > 0).length;
  const zeroBalance   = wallets.filter((w) => w.balance === 0).length;

  const statCards = [
    { label: 'Total Wallet Volume', value: formatCurrency(totalVolume), color: 'text-teal' },
    { label: 'Average Balance',     value: formatCurrency(avgBalance),  color: 'text-primary' },
    { label: 'Active Wallets',      value: activeWallets.toString(),    color: 'text-success' },
    { label: 'Zero Balance',        value: zeroBalance.toString(),      color: 'text-danger' },
  ];

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (w: WalletRecord) => (
        <div className="flex items-center gap-3">
          <Avatar name={w.userName} size="sm" />
          <div>
            <p className="font-medium text-text-primary text-sm">{w.userName}</p>
            <p className="text-xs text-text-muted">{w.userEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (w: WalletRecord) => (
        <span className="text-sm font-bold text-teal">{formatCurrency(w.balance)}</span>
      ),
    },
    {
      key: 'deposits',
      header: 'Total Deposits',
      render: (w: WalletRecord) => (
        <span className="text-xs text-text-muted">{formatCurrency(w.totalDeposits)}</span>
      ),
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (w: WalletRecord) => (
        <span className="text-xs text-text-muted">{w.lastActivity ? formatDate(w.lastActivity) : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w: WalletRecord) => <StatusBadge status={w.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: '160px',
      render: (w: WalletRecord) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setAddFundsTarget(w); setAddAmount(''); setAddReason('deposit'); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
          >
            <PlusCircle size={12} />
            Add Funds
          </button>
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-text-muted bg-background-dark rounded-lg hover:bg-border transition-colors"
          >
            <History size={12} />
            History
          </button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="Wallets">
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Wallet Management</h1>
            <p className="text-sm text-text-muted mt-1">{total.toLocaleString()} user wallets</p>
          </div>
          <Button icon={<Wallet size={16} />} onClick={fetchWallets}>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {statCards.map((s) => (
            <Card key={s.label} padding="sm">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* ── Table card ── */}
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
              options={BALANCE_OPTIONS}
              value={balanceFilter}
              onChange={(e) => { setBalanceFilter(e.target.value); setPage(1); }}
              className="w-44"
            />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchWallets}>
              Refresh
            </Button>
          </div>

          <Table
            columns={columns}
            data={wallets}
            loading={loading}
            getRowKey={(w) => w.userId}
            emptyMessage="No wallets found matching your filters."
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            onPageChange={setPage}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </Card>

        {/* ── Add Funds Modal ── */}
        <Modal
          isOpen={!!addFundsTarget}
          onClose={() => setAddFundsTarget(null)}
          title={`Add Funds — ${addFundsTarget?.userName ?? ''}`}
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAddFundsTarget(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={addLoading || !addAmount}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50"
              >
                <PlusCircle size={14} />
                {addLoading ? 'Processing...' : 'Confirm Add Funds'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Amount (LYD)
              </label>
              <input
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-teal/20 focus:border-teal px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Reason</label>
              <select
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm outline-none transition-all focus:ring-2 focus:ring-teal/20 focus:border-teal px-3 py-2.5"
              >
                {REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-primary-light rounded-xl text-xs text-primary">
              Current balance: <strong>{formatCurrency(addFundsTarget?.balance ?? 0)}</strong>
              {addAmount ? ` → After: ${formatCurrency((addFundsTarget?.balance ?? 0) + Number(addAmount))}` : ''}
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
