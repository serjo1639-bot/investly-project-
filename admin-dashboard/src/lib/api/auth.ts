import apiClient from './config';
import { AuthSession, User } from '@/types';

export const authApi = {
  loginEmail: async (email: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login-email', {
      email,
      password,
      role: 'admin',
    });
    // Backend: { success, message, data: { token, refreshToken, user } }
    return response.data?.data ?? response.data;
  },

  login: async (phone: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login', {
      phone,
      password,
      role: 'admin',
    });
    return response.data?.data ?? response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data?.data ?? response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data?.data ?? response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data?.data ?? response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    // Backend requires refreshToken in body to revoke the token server-side
    await apiClient.post('/auth/logout', { refreshToken: refreshToken ?? '' });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
