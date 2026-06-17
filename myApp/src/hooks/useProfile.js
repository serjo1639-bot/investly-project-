/**
 * useProfile — fetch the authenticated profile and update it. Keeps the cached
 * user in authStore in sync after a successful fetch/update.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../store/authStore';

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const user = await authApi.getProfile();
      if (user) setUser(user);
      return user;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload) => authApi.updateProfile(payload),
    onSuccess: (user) => {
      if (user) setUser(user);
      qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      authApi.changePassword(currentPassword, newPassword),
  });
}
