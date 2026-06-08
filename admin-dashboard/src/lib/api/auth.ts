import apiClient from './config';
import { AuthSession, User } from '@/types';

export const authApi = {
  loginEmail: async (email: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login-email', {
      email,
      password,
      role: 'admin',
    });
    return response.data;
  },

  login: async (phone: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login', {
      phone,
      password,
      role: 'admin',
    });
    return response.data;
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
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
