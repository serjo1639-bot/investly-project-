import apiClient from './config';
import { Notification } from '@/types';

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications');
    return response.data?.data ?? response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data?.data?.count ?? response.data?.count ?? 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  getSettings: async () => {
    const response = await apiClient.get('/notifications/settings');
    return response.data?.data ?? response.data;
  },
};
