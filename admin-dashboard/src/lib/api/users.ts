import apiClient from './config';
import { User, PaginatedResponse } from '@/types';

export interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

type ApiObject = Record<string, unknown>;

const asObject = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {};

const normalizeRole = (roles?: string[] | string): User['role'] => {
  const values = Array.isArray(roles) ? roles : [roles];
  const names = values.filter(Boolean).map((role) => String(role).toLowerCase());
  if (names.includes('admin')) return 'admin';
  if (names.includes('entrepreneur') || names.includes('owner')) return 'owner';
  if (names.includes('investor') || names.includes('user')) return 'investor';
  return 'guest';
};

const normalizeUser = (user: unknown): User => {
  const source = asObject(user);

  return {
    ...source,
    // Backend DTOs use userId and Roles; dashboard tables use id and role.
    id: String(source.id ?? source.userId ?? source.user_id ?? ''),
    firstName: String(source.firstName ?? source.first_name ?? ''),
    lastName: String(source.lastName ?? source.last_name ?? ''),
    phone: String(source.phone ?? ''),
    email: String(source.email ?? ''),
    role: normalizeRole((source.roles ?? source.role) as string[] | string | undefined),
    type: 'individual',
    isActive: Boolean(source.isActive ?? source.is_active ?? true),
    isBlocked: Boolean(source.isBlocked ?? source.is_blocked ?? false),
    walletBalance: Number(source.walletBalance ?? source.wallet_balance ?? 0),
  } as User;
};

const normalizePaginatedUsers = (payload: unknown): PaginatedResponse<User> => {
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
    data: safeItems.map(normalizeUser),
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
};

export const usersApi = {
  getAllUsers: async (params?: UsersQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params });
    return normalizePaginatedUsers(response.data);
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return normalizeUser(response.data?.data ?? response.data);
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return normalizeUser(response.data?.data ?? response.data);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  banUser: async (userId: string): Promise<void> => {
    await apiClient.post('/admin/users/' + userId + '/ban');
  },

  unbanUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/unban`);
  },

  suspendUser: async (userId: string, reason?: string): Promise<void> => {
    void reason;
    await apiClient.post('/admin/users/' + userId + '/suspend');
  },

  unsuspendUser: async (userId: string): Promise<void> => {
    await apiClient.post('/admin/users/' + userId + '/unsuspend');
  },

  getUserInvestments: async (userId: string) => {
    const response = await apiClient.get('/admin/investments', { params: { userId } });
    const data = response.data?.data ?? response.data;
    return data?.items ?? data;
  },

  getUserDocuments: async (userId: string) => {
    // No backend documents endpoint exists yet; keep the UI in live mode with an empty list.
    void userId;
    return [];
  },

  submitKyc: async (userId: string, formData: FormData) => {
    const response = await apiClient.post(`/users/${userId}/kyc`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? response.data;
  },
};





