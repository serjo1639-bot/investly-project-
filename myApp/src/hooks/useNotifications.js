/**
 * useNotifications — list, unread badge count, and read mutations with
 * optimistic updates so the UI feels instant.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { queryKeys } from '../constants/queryKeys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.getAll(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    // The backend may return a number or { count }. Normalize to a number.
    select: (d) => (typeof d === 'number' ? d : d?.count ?? d?.unread ?? 0),
    refetchInterval: 60 * 1000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = qc.getQueryData(queryKeys.notifications.all);
      qc.setQueryData(queryKeys.notifications.all, (old) =>
        Array.isArray(old) ? old.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : old
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}
