/**
 * useOwner — Project Manager dashboard, projects and stats. Driven by the
 * current user's id from authStore.
 */
import { useQuery } from '@tanstack/react-query';
import { ownersApi } from '../api/ownersApi';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../store/authStore';

export function useOwnerDashboard() {
  const ownerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.owner.dashboard(ownerId),
    queryFn: () => ownersApi.getDashboard(ownerId),
    enabled: Boolean(ownerId),
  });
}

export function useOwnerProjects() {
  const ownerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.owner.projects(ownerId),
    queryFn: () => ownersApi.getProjects(ownerId),
    enabled: Boolean(ownerId),
  });
}

export function useOwnerStats() {
  const ownerId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.owner.stats(ownerId),
    queryFn: () => ownersApi.getStats(ownerId),
    enabled: Boolean(ownerId),
  });
}
