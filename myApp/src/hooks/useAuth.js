/**
 * useAuth — the single hook screens use for authentication.
 *
 * Wraps authApi calls in React Query mutations and writes the resulting
 * session into authStore (which persists tokens via tokenManager). Exposes
 * the current user + auth status read from the store.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { normalizeUser } from '../api/normalizers';
import { useAuthStore } from '../store/authStore';
import { tokenManager } from '../services/tokenManager';
import { logger } from '../utils/logger';

/**
 * The backend returns an auth payload shaped like
 * { user, accessToken, refreshToken } (camelCase). Some deployments nest the
 * tokens under `tokens` — normalize both.
 */
function extractSession(data) {
  const accessToken = data?.accessToken ?? data?.tokens?.accessToken ?? data?.token;
  const refreshToken = data?.refreshToken ?? data?.tokens?.refreshToken;
  const user = normalizeUser(data?.user ?? data);
  return { user, accessToken, refreshToken };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, status, setSession, setUser, clearSession } = useAuthStore();

  const onAuthSuccess = async (data) => {
    const session = extractSession(data);
    await setSession(session);
  };

  const loginEmail = useMutation({
    mutationFn: ({ email, password }) => authApi.loginEmail(email, password),
    onSuccess: onAuthSuccess,
  });

  const loginPhone = useMutation({
    mutationFn: ({ phone, password }) => authApi.loginPhone(phone, password),
    onSuccess: onAuthSuccess,
  });

  const register = useMutation({
    mutationFn: (payload) => authApi.register(payload),
    onSuccess: (data) => {
      // Register may or may not return tokens depending on OTP flow.
      const session = extractSession(data);
      if (session.accessToken) return setSession(session);
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const rt = tokenManager.getRefreshToken();
      try {
        if (rt) await authApi.logout(rt);
      } catch (e) {
        logger.warn('server logout failed (clearing locally anyway)', e);
      }
    },
    onSettled: async () => {
      await clearSession();
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    status,
    isOwner: user?.role === 'owner',
    loginEmail,
    loginPhone,
    register,
    logout,
    setUser,
  };
}
