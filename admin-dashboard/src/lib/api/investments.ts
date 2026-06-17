import apiClient from './config';
import { Investment, PaginatedResponse } from '@/types';

export const investmentsApi = {
  getAllInvestments: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    userId?: string;
    projectId?: string;
  }): Promise<PaginatedResponse<Investment>> => {
    const response = await apiClient.get('/admin/investments', { params });
    // Backend: { success, data: [...investments] }
    const envelope = response.data;
    const items = envelope?.data ?? (Array.isArray(envelope) ? envelope : []);
    if (Array.isArray(items)) {
      return { data: items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 };
    }
    return { data: items?.items ?? [], total: items?.totalCount ?? 0, page: 1, pageSize: 20, totalPages: 1 };
  },

  getInvestmentById: async (id: string): Promise<Investment> => {
    const response = await apiClient.get(`/investments/${id}`);
    return response.data?.data ?? response.data;
  },

  getUserInvestments: async (userId?: string): Promise<Investment[]> => {
    const endpoint = userId ? `/users/${userId}/investments` : '/investments/me';
    const response = await apiClient.get(endpoint);
    return response.data?.data ?? response.data;
  },

  getInvestmentHistory: async () => {
    const response = await apiClient.get('/investments/history');
    return response.data?.data ?? response.data;
  },

  getWalletBalance: async () => {
    const response = await apiClient.get('/investments/wallet');
    return response.data?.data ?? response.data;
  },

  checkout: async (payload: {
    currency: string;
    contributions: Array<{
      projectId: string;
      reference: string;
      amount: number;
      currency: string;
      paymentMethod: string;
    }>;
  }) => {
    const response = await apiClient.post('/investments/checkout', payload);
    return response.data?.data ?? response.data;
  },

  redeemCard: async (code: string) => {
    const response = await apiClient.post('/investments/topup/redeem', { code });
    return response.data?.data ?? response.data;
  },
};
