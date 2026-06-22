import apiClient from './config';
import { Notification } from '@/types';

let cachedNotificationIds: string[] = [];

type ApiObject = Record<string, unknown>;

const asObject = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {};

const normalizeNotification = (notification: unknown): Notification => {
  const source = asObject(notification);

  return {
    id: String(source.id ?? source.notificationId ?? source.notification_id ?? ''),
    type: (source.type ?? source.notificationType ?? 'system') as Notification['type'],
    title: String(source.title ?? source.titleEn ?? source.titleAr ?? ''),
    message: String(source.message ?? source.messageEn ?? source.messageAr ?? ''),
    isRead: Boolean(source.isRead ?? source.is_read),
    createdAt: String(source.createdAt ?? source.created_at ?? ''),
    targetUserId: (source.targetUserId ?? source.target_user_id) as string | undefined,
  };
};

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications');
    const data = response.data?.data ?? response.data;
    const dataObject = asObject(data);
    const rawNotifications = Array.isArray(dataObject.notifications)
      ? dataObject.notifications
      : Array.isArray(dataObject.items)
        ? dataObject.items
        : Array.isArray(data)
          ? data
          : [];
    const notifications = rawNotifications.map(normalizeNotification);
    cachedNotificationIds = notifications.map((notification) => notification.id);
    return notifications;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data?.data?.unreadCount ?? response.data?.unreadCount ?? response.data?.count ?? 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post('/notifications/mark-read', { notificationIds: [Number(id)] });
  },

  markAllAsRead: async (ids: string[] = cachedNotificationIds): Promise<void> => {
    const notificationIds = ids.map(Number).filter(Number.isFinite);
    if (!notificationIds.length) return;
    await apiClient.post('/notifications/mark-read', { notificationIds });
  },

  getSettings: async () => {
    // Notification preferences do not have a backend table yet.
    // Return a stable local default instead of calling a missing endpoint.
    return {};
  },
};
