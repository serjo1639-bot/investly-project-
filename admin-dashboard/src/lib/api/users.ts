/**
 * All API calls related to users.
 * Each function sends an HTTP request to the backend (or the mock adapter in dev)
 * and returns the data portion of the response.
 *
 * Usage: import { usersApi } from '@/lib/api/users';
 *        const users = await usersApi.getAllUsers({ page: 1 });
 */

import apiClient from './config';
import { User, PaginatedResponse } from '@/types';

export interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const usersApi = {
  getAllUsers: async (params?: UsersQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params });
    // Backend: { success, data: [...users] } (plain array, not paged)
    const envelope = response.data;
    const items = envelope?.data ?? (Array.isArray(envelope) ? envelope : []);
    if (Array.isArray(items)) {
      return { data: items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 };
    }
    // Handle paged shape if backend ever returns { items, totalCount, ... }
    return {
      data: items?.items ?? [],
      total: items?.totalCount ?? 0,
      page: items?.page ?? 1,
      pageSize: items?.pageSize ?? 20,
      totalPages: items?.totalPages ?? 1,
    };
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data?.data ?? response.data;
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${userId}`, data);
    return response.data?.data ?? response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  banUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/ban`);
  },
  // NOTE: there is no "unban" — a ban is permanent (use suspendUser/unsuspendUser for temporary restrictions)

  suspendUser: async (userId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/suspend`, { reason });
  },

  unsuspendUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/unsuspend`);
  },

  getUserInvestments: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/investments`);
    return response.data?.data ?? response.data;
  },

  getUserDocuments: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/documents`);
    return response.data?.data ?? response.data;
  },

  submitKyc: async (userId: string, formData: FormData) => {
    const response = await apiClient.post(`/users/${userId}/kyc`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? response.data;
  },

  approveKyc: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/kyc/approve`);
  },

  rejectKyc: async (userId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/kyc/reject`, { reason });
  },
};
