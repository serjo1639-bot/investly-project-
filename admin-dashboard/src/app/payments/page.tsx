'use client';

/**
 * Payments management page.
 *
 * What this page does:
 *  - Lists all payment transactions with search and filter controls.
 *  - Lets the admin approve, reject, or refund individual payments.
 *  - Provides an "Add Funds" modal to manually credit a user's wallet.
 *
 * State is split into logical groups below (filters, modals, action flags).
 * When the API is unavailable, the page falls back to MOCK_PAYMENTS data.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { adminApi } from '@/lib/api/admin';
import { Payment } from '@/types';
import { formatDate, formatCurrency, extractError } from '@/lib/utils';
import { RefreshCw, Download, Eye, CheckCircle, XCircle, RotateCcw, PlusCircle } from 'lucide-react';

const PAGE_SIZE = 15;

// ── Filter options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'recharge_card', label: 'Recharge Card' },
];

const DATE_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const REASON_OPTIONS = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' },
];


// ── Date filter helper ────────────────────────────────────────────────────────

const isWithinRange = (dateStr: string | undefined, range: string) => {
  if (!range || !dateStr) return true;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  if (range === 'today')  return d >= now - 86400000;
  if (range === 'week')   return d >= now - 7 * 86400000;
  if (range === 'month')  return d >= now - 30 * 86400000;
  return true;
};


// ── Page component ────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [payments, setPayments]             = useState<Payment[]>([]);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [methodFilter, setMethodFilter]     = useState('');
  const [dateFilter, setDateFilter]         = useState('');
  const [error, setError]                   = useState('');

  // Detail modal
  const [detailTarget, setDetailTarget]     = useState<Payment | null>(null);
  const [adminNote, setAdminNote]           = useState('');

  // Approve / Reject confirms
  const [approveTarget, setApproveTarget]   = useState<Payment | null>(null);
  const [rejectTarget, setRejectTarget]     = useState<Payment | null>(null);
  const [rejectReason, setRejectReason]     = useState('');
  const [refundTarget, setRefundTarget]     = useState<Payment | null>(null);
  const [actionLoading, setActionLoading]   = useState(false);

  // Add Funds modal — state for the form fields inside the "Add Funds" dialog
  const [showAddFunds, setShowAddFunds]             = useState(false);
  const [addFundsUserId, setAddFundsUserId]         = useState('');
  const [addFundsAmount, setAddFundsAmount]         = useState('');
  const [addFundsReason, setAddFundsReason]         = useState('deposit');
  const [addFundsLoading, setAddFundsLoading]       = useState(false);

  /**
   * Loads the payment list from the API.
   * If the API call fails (e.g. backend not running), it falls back to MOCK_PAYMENTS
   * and applies the same search/filter logic in the browser so the UI still works.
   *
   * useCallback prevents this function from being recreated on every render —
   * it only updates when one of the listed dependencies actually changes.
   */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getAllPayments({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        search: search || undefined,
      });
      setPayments(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, methodFilter, dateFilter]);

  useEffect(() => {
    // Debounce: when the user is typing in the search box, wait 400 ms before
    // sending the request so we don't fire one request per keystroke.
    const debounceTimer = setTimeout(fetchPayments, search ? 400 : 0);
    return () => clearTimeout(debounceTimer); // cancel the timer if the user types again
  }, [fetchPayments, search]);

  // ── Action handlers ───────────────────────────────────────────────────────

  const applyStatusUpdate = (id: string, status: Payment['status']) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await adminApi.approvePayment(approveTarget.id);
      applyStatusUpdate(approveTarget.id, 'completed');
      setApproveTarget(null);
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
      await adminApi.rejectPayment(rejectTarget.id, rejectReason || undefined);
      applyStatusUpdate(rejectTarget.id, 'failed');
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setActionLoading(true);
    try {
      await adminApi.refundPayment(refundTarget.id);
      applyStatusUpdate(refundTarget.id, 'refunded');
      setRefundTarget(null);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      await adminApi.changePaymentStatus(paymentId, newStatus);
      applyStatusUpdate(paymentId, newStatus as Payment['status']);
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsUserId || !addFundsAmount) return;
    setAddFundsLoading(true);
    try {
      await adminApi.addFundsToWallet(addFundsUserId, {
        amount: Number(addFundsAmount),
        reason: addFundsReason,
      });
      setShowAddFunds(false);
      setAddFundsUserId('');
      setAddFundsAmount('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setAddFundsLoading(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-2">
          <Avatar name={p.userName ?? '?'} size="xs" />
          <span className="text-sm font-medium text-text-primary">{p.userName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p: Payment) => (
        <span className="text-sm font-semibold text-text-primary">{formatCurrency(p.amount)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (p: Payment) => (
        <span className="text-xs capitalize text-text-muted">{(p.method ?? '').replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Payment) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={p.status} />
          <select
            value={p.status}
            onChange={(e) => handleStatusChange(p.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs border border-border rounded-lg px-1.5 py-1 bg-surface text-text-secondary outline-none focus:ring-1 focus:ring-primary/20"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (p: Payment) => (
        <span className="text-xs text-text-muted">{formatDate(p.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (p: Payment) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Eye — detail modal */}
          <button
            onClick={() => { setDetailTarget(p); setAdminNote(p.notes ?? ''); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
            title="View details"
          >
            <Eye size={14} />
          </button>

          {/* Approve / Reject for pending */}
          {p.status === 'pending' && (
            <>
              <button
                onClick={() => setApproveTarget(p)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal/90 transition-colors"
                title="Approve payment"
              >
                <CheckCircle size={12} />
                Approve
              </button>
              <button
                onClick={() => { setRejectTarget(p); setRejectReason(''); }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-danger rounded-lg hover:bg-danger/90 transition-colors"
                title="Reject payment"
              >
                <XCircle size={12} />
                Reject
              </button>
            </>
          )}

          {/* Refund for completed */}
          {p.status === 'completed' && (
            <button
              onClick={() => setRefundTarget(p)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber bg-amber-light rounded-lg hover:bg-amber/20 transition-colors"
              title="Refund payment"
            >
              <RotateCcw size={12} />
              Refund
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout title="Payments">
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Payment Management</h1>
            <p className="text-sm text-text-muted mt-1">{total.toLocaleString()} total transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<PlusCircle size={14} />}
              onClick={() => { setShowAddFunds(true); setAddFundsUserId(''); setAddFundsAmount(''); setAddFundsReason('deposit'); }}
            >
              Add Funds
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={14} />}>Export</Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Volume (Completed)', value: formatCurrency(payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0)), color: 'text-teal' },
            { label: 'Pending Amount',           value: formatCurrency(payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)),   color: 'text-amber' },
            { label: 'Failed Count',             value: payments.filter((p) => p.status === 'failed').length.toString(),                                     color: 'text-danger' },
            { label: 'Refunded Amount',          value: formatCurrency(payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)),  color: 'text-primary' },
          ].map((s) => (
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
              placeholder="Search user or transaction ID..."
              className="w-80"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-36"
            />
            <Select
              options={METHOD_OPTIONS}
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="w-40"
            />
            <Select
              options={DATE_OPTIONS}
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="w-36"
            />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchPayments}>
              Refresh
            </Button>
          </div>

          <Table
            columns={columns}
            data={payments}
            loading={loading}
            getRowKey={(p) => p.id}
            emptyMessage="No transactions found matching your filters."
            onRowClick={(p) => { setDetailTarget(p); setAdminNote(p.notes ?? ''); }}
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            onPageChange={setPage}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </Card>

        {/* ── Detail Modal ── */}
        <Modal
          isOpen={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          title="Transaction Details"
          size="md"
          footer={
            <div className="flex justify-end">
              <button
                onClick={() => setDetailTarget(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Close
              </button>
            </div>
          }
        >
          {detailTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Transaction ID</p>
                  <p className="font-mono font-medium text-text-primary">{detailTarget.transactionId}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">User</p>
                  <p className="font-medium text-text-primary">{detailTarget.userName}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Amount</p>
                  <p className="text-xl font-bold text-teal">{formatCurrency(detailTarget.amount)}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Method</p>
                  <p className="capitalize text-text-primary">{(detailTarget.method ?? '').replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Status</p>
                  <StatusBadge status={detailTarget.status} />
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Date</p>
                  <p className="text-text-primary">{formatDate(detailTarget.createdAt)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Admin Note</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Add an internal note about this transaction..."
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5 resize-none"
                />
              </div>
            </div>
          )}
        </Modal>

        {/* ── Approve Confirm ── */}
        <ConfirmDialog
          isOpen={!!approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          title="Approve Payment"
          message={`Approve payment ${approveTarget?.transactionId} of ${formatCurrency(approveTarget?.amount ?? 0)} from ${approveTarget?.userName}?`}
          confirmLabel="Approve"
          loading={actionLoading}
        />

        {/* ── Reject Modal ── */}
        <Modal
          isOpen={!!rejectTarget}
          onClose={() => { setRejectTarget(null); setRejectReason(''); }}
          title="Reject Payment"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
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
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Reject payment <strong>{rejectTarget?.transactionId}</strong> from <strong>{rejectTarget?.userName}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Reason <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection..."
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-danger/20 focus:border-danger px-3 py-2.5 resize-none"
              />
            </div>
          </div>
        </Modal>

        {/* ── Refund Confirm ── */}
        <ConfirmDialog
          isOpen={!!refundTarget}
          onClose={() => setRefundTarget(null)}
          onConfirm={handleRefund}
          title="Refund Payment"
          message={`Issue a refund of ${formatCurrency(refundTarget?.amount ?? 0)} for transaction ${refundTarget?.transactionId}?`}
          confirmLabel="Issue Refund"
          loading={actionLoading}
        />

        {/* ── Add Funds Modal ── */}
        <Modal
          isOpen={showAddFunds}
          onClose={() => setShowAddFunds(false)}
          title="Add Funds to Wallet"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddFunds(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-dark rounded-xl hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={addFundsLoading || !addFundsUserId || !addFundsAmount}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50"
              >
                <PlusCircle size={14} />
                {addFundsLoading ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">User</label>
              <select
                value={addFundsUserId}
                onChange={(e) => setAddFundsUserId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5"
              >
                <option value="">Enter user ID manually below...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Amount (LYD)</label>
              <input
                type="number"
                min="1"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Reason</label>
              <select
                value={addFundsReason}
                onChange={(e) => setAddFundsReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5"
              >
                {REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
