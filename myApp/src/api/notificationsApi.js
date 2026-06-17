/**
 * notificationsApi.js — In-app notifications + preferences (responses normalized).
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeNotification, mapArray } from './normalizers';

export const notificationsApi = {
  getAll: () => api.get(endpoints.notifications.list).then((d) => mapArray(d, normalizeNotification)),
  getUnreadCount: () => api.get(endpoints.notifications.unreadCount),
  markRead: (id) => api.post(endpoints.notifications.read(id)),
  markAllRead: () => api.post(endpoints.notifications.readAll),
  getSettings: () => api.get(endpoints.notifications.settings),
  updateSettings: (payload) => api.put(endpoints.notifications.settings, payload),
};
