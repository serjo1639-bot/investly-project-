/**
 * Admin-only API calls: dashboard stats, payments, wallets, notifications, and media.
 * These endpoints require an admin JWT token (set automatically by apiClient interceptors).
 *
 * Usage: import { adminApi } from '@/lib/api/admin';
 *        const stats = await adminApi.getStats();
 */

import apiClient from './config';
import { ChartData, DashboardStats, RecentActivityItem } from '@/types';

export const adminApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data?.data ?? response.data;
  },

  getChartData: async (): Promise<ChartData> => {
    const response = await apiClient.get('/admin/chart-data');
    return response.data?.data ?? response.data;
  },

  getRecentActivity: async (count = 10): Promise<RecentActivityItem[]> => {
    const response = await apiClient.get('/admin/recent-activity', { params: { count } });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  getAllPayments: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    method?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/payments', { params });
    // Backend: { success, data: [...payments] }
    const envelope = response.data;
    const items = envelope?.data ?? (Array.isArray(envelope) ? envelope : []);
    if (Array.isArray(items)) {
      return { data: items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 };
    }
    return { data: items?.items ?? [], total: items?.totalCount ?? 0, page: 1, pageSize: 20, totalPages: 1 };
  },

  approvePayment: async (paymentId: string) => {
    const response = await apiClient.post(`/admin/payments/${paymentId}/approve`);
    return response.data?.data ?? response.data;
  },

  rejectPayment: async (paymentId: string, reason?: string) => {
    const response = await apiClient.post(`/admin/payments/${paymentId}/reject`, { reason });
    return response.data?.data ?? response.data;
  },

  refundPayment: async (paymentId: string) => {
    const response = await apiClient.post(`/admin/payments/${paymentId}/refund`);
    return response.data?.data ?? response.data;
  },

  changePaymentStatus: async (paymentId: string, status: string) => {
    const response = await apiClient.put(`/admin/payments/${paymentId}/status`, { status });
    return response.data?.data ?? response.data;
  },

  addFundsToWallet: async (userId: string, data: { amount: number; reason: string }) => {
    const response = await apiClient.post(`/admin/users/${userId}/wallet/add`, data);
    return response.data?.data ?? response.data;
  },

  transferFunds: async (data: { fromUserId: string; toUserId: string; amount: number; reason: string }) => {
    const response = await apiClient.post('/admin/wallet/transfer', data);
    return response.data?.data ?? response.data;
  },

  getUserWallets: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    const response = await apiClient.get('/admin/wallets', { params });
    // Backend: { success, data: [...wallets] }
    const envelope = response.data;
    const items = envelope?.data ?? (Array.isArray(envelope) ? envelope : []);
    if (Array.isArray(items)) {
      return { data: items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 };
    }
    return { data: items?.items ?? [], total: items?.totalCount ?? 0, page: 1, pageSize: 20, totalPages: 1 };
  },

  sendNotification: async (payload: {
    targetUserId?: string;
    titleAr: string;
    titleEn: string;
    messageAr: string;
    messageEn: string;
    type: string;
  }) => {
    const response = await apiClient.post('/admin/notifications/send', payload);
    return response.data;
  },

  // Pass adminId to filter logs for a specific admin on the backend
  getActivityLogs: async (params?: { page?: number; pageSize?: number; adminId?: string }) => {
    const response = await apiClient.get('/admin/activity-logs', { params });
    return response.data?.data ?? response.data;
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
