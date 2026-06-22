import apiClient from './config';
import { DashboardStats, Payment } from '@/types';

type ApiObject = Record<string, unknown>;

const asObject = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {};

const normalizePaginated = <T>(payload: unknown) => {
  const payloadObject = asObject(payload);
  const source = payloadObject.data ?? payload ?? {};
  const sourceObject = asObject(source);
  const items = Array.isArray(source)
    ? source
    : sourceObject.items ?? sourceObject.data ?? [];
  const safeItems = Array.isArray(items) ? items : [];
  const total = Number(sourceObject.totalCount ?? sourceObject.total ?? safeItems.length);
  const page = Number(sourceObject.page ?? 1);
  const pageSize = Number(sourceObject.pageSize ?? safeItems.length);

  return {
    data: safeItems as T[],
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
};

const normalizeStats = (payload: unknown): DashboardStats => {
  const source = asObject(asObject(payload).data ?? payload);
  const totalProjects = Number(source.totalProjects ?? 0);
  const pendingProjects = Number(source.pendingProjects ?? 0);

  return {
    totalUsers: Number(source.totalUsers ?? 0),
    totalProjects,
    totalInvestments: Number(source.totalInvestments ?? 0),
    totalRevenue: Number(source.totalRevenue ?? source.totalFunding ?? 0),
    activeProjects: Number(source.activeProjects ?? Math.max(totalProjects - pendingProjects, 0)),
    pendingProjects,
    newUsersToday: Number(source.newUsersToday ?? 0),
    newUsersThisWeek: Number(source.newUsersThisWeek ?? 0),
    totalTransactions: Number(source.totalTransactions ?? source.totalInvestments ?? 0),
    successRate: Number(source.successRate ?? 0),
  };
};

const normalizeActivityType = (value: unknown): 'payment' | 'user' | 'project' | 'system' => {
  const text = String(value || '').toLowerCase();
  if (text.includes('project')) return 'project';
  if (text.includes('user')) return 'user';
  if (text.includes('wallet') || text.includes('payment') || text.includes('deposit') || text.includes('withdraw')) return 'payment';
  return 'system';
};

const normalizeActivityLog = (log: unknown) => {
  const source = asObject(log);
  const rawType = source.type ?? source.action ?? source.status ?? '';
  const type = normalizeActivityType(rawType);
  const id = String(source.id ?? source.transactionId ?? source.projectId ?? source.investmentId ?? `${type}-${source.createdAt ?? source.timestamp ?? ''}`);

  return {
    id,
    adminId: String(source.adminId ?? 'system'),
    adminName: String(source.adminName ?? 'System'),
    action: String(source.action ?? source.type ?? 'Activity'),
    entity: String(source.entity ?? type),
    entityId: source.entityId ? String(source.entityId) : undefined,
    details: source.details ? String(source.details) : undefined,
    type,
    timestamp: String(source.timestamp ?? source.createdAt ?? new Date().toISOString()),
    ip: source.ip ? String(source.ip) : undefined,
  };
};
const normalizePaymentStatus = (status: unknown): Payment['status'] => {
  const value = String(status || '').toLowerCase();
  if (value === 'completed' || value === 'pending' || value === 'failed' || value === 'refunded') {
    return value as Payment['status'];
  }
  return 'pending';
};

const normalizePayment = (payment: unknown): Payment => {
  const source = asObject(payment);
  return {
    id: String(source.id ?? source.transactionId ?? ''),
    amount: Number(source.amount ?? 0),
    currency: String(source.currency ?? 'LYD'),
    method: String(source.method ?? ''),
    status: normalizePaymentStatus(source.status),
    userId: source.userId ? String(source.userId) : undefined,
    userName: source.userName ? String(source.userName) : undefined,
    transactionId: source.transactionId ? String(source.transactionId) : undefined,
    createdAt: source.createdAt ? String(source.createdAt) : undefined,
    updatedAt: source.updatedAt ? String(source.updatedAt) : undefined,
  };
};

export const adminApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/admin/stats');
    return normalizeStats(response.data);
  },

  getAllPayments: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/payments', { params });
    const result = normalizePaginated<Payment>(response.data);
    return { ...result, data: result.data.map(normalizePayment) };
  },

  sendNotification: async (payload: {
    targetUserId?: string;
    title: string;
    message: string;
    type: string;
  }) => {
    // Manual admin notification sending is intentionally disabled.
    // Investly notifications are created automatically by backend business events.
    void payload;
    throw new Error('Manual admin notifications are disabled. Notifications are created automatically by backend events.');
  },

  // Pass adminId to filter logs for a specific admin on the backend
  getActivityLogs: async (params?: { page?: number; pageSize?: number; adminId?: string }) => {
    const response = await apiClient.get('/admin/activity-logs', { params });
    return normalizePaginated(response.data);
  },

  uploadMedia: async (file: File): Promise<{ url: string; mediaId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/media/upload', formData);
    return response.data?.data ?? response.data;
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    await apiClient.delete(`/media/${mediaId}`);
  },
};


