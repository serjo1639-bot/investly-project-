import apiClient from './config';
import { AuthSession, User } from '@/types';

type ApiObject = Record<string, unknown>;

const asObject = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {};

const normalizeUser = (user: unknown): User => {
  const source = asObject(user);
  const roles = Array.isArray(source.roles) ? source.roles : [];
  const normalizedRoles = roles.map((role) => String(role).toLowerCase());

  return {
    ...source,
    id: String(source.id ?? source.userId ?? source.user_id ?? ''),
    firstName: String(source.firstName ?? source.first_name ?? ''),
    lastName: String(source.lastName ?? source.last_name ?? ''),
    phone: String(source.phone ?? ''),
    email: String(source.email ?? ''),
    role: String(source.role ?? '').toLowerCase() === 'admin' || normalizedRoles.includes('admin') ? 'admin' : 'guest',
    type: 'individual',
  } as User;
};

const normalizeSession = (payload: unknown): AuthSession => {
  const payloadObject = asObject(payload);
  const source = asObject(payloadObject.data ?? payload);
  return {
    token: String(source.token ?? ''),
    user: normalizeUser(source.user ?? source),
  };
};

export const authApi = {
  loginEmail: async (email: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return normalizeSession(response.data);
  },

  login: async (phone: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login', {
      phone,
      password,
      role: 'admin',
    });
    return normalizeSession(response.data);
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return normalizeUser(response.data?.data ?? response.data);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    // Backend profile edits live under /users/{id}; /auth/me is only a reader.
    const currentUser = await authApi.getProfile();
    const response = await apiClient.put(`/users/${currentUser.id}`, data);
    return normalizeUser(response.data?.data ?? response.data);
  },

  logout: async (): Promise<void> => {
    // JWT logout is client-side only because the backend does not store sessions.
    return Promise.resolve();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { oldPassword: currentPassword, newPassword });
  },
};
