/**
 * useAuth.js — Authentication context and hook
 *
 * Architecture
 * ────────────
 * AuthProvider wraps the whole app (in App.js) and:
 *   • Loads the persisted session from AsyncStorage on mount
 *   • Exposes the current user, role, loading state, and auth actions
 *   • Registers a global handler for 401 "session expired" events
 *
 * useAuth() is the consumer hook.  Components call it to read auth state
 * or trigger login/logout/register actions.
 *
 * Null-context fallback
 * ─────────────────────
 * If useAuth() is called outside AuthProvider (e.g. in a standalone test),
 * it returns a safe no-op object instead of throwing.  This keeps
 * development from crashing on accidental mis-use.
 *
 * Session expiry flow
 * ───────────────────
 * 1. apiRequest() receives a 401 → calls notifyUnauthorized()
 * 2. authEvents.js fires the registered handler
 * 3. The handler here clears the session and bumps sessionExpiredAt
 * 4. AppNavigator watches sessionExpiredAt → shows a popup + redirects to Login
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, mapAuthSession, resolveUserRole } from '../services/api';
import { sessionManager } from '../services/session';
import { setUnauthorizedHandler } from '../services/authEvents';

const AuthContext = createContext();

/**
 * Ensure the user object always has the required shape.
 * Derives a numeric memberId from the last 8 digits of the phone number
 * when the server doesn't supply one.
 */
const buildUser = (data = {}) => {
  const normalized = mapAuthSession(data);
  const digits     = (normalized.phone || '').replace(/\D/g, '');
  const memberId   = digits.slice(-8) || '127663157';  // fallback for mock/demo accounts

  return {
    ...normalized,
    id:       normalized.id       || '1',
    name:     normalized.name     || 'مستخدم',
    memberId: normalized.memberId || memberId,
  };
};

// ─── useAuth hook ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Safe fallback — avoids crashes when used outside the provider
  if (!context) {
    return {
      user:              null,
      isLoggedIn:        false,
      activeRole:        'guest',
      isLoading:         false,
      login:             async () => {},
      loginSimple:       async () => {},
      loginWithPassword: async () => {},
      loginWithEmail:    async () => {},
      register:          async () => {},
      updateUser:        async () => {},
      setActiveRole:     () => {},
      logout:            () => {},
      sessionExpiredAt:  0,
    };
  }

  return context;
};

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,             setUser]             = useState(null);
  const [activeRole,       setActiveRole]       = useState('guest');
  const [isLoading,        setIsLoading]        = useState(true);  // true until session load completes
  const [sessionExpiredAt, setSessionExpiredAt] = useState(0);     // timestamp — bumped on 401

  // ── Load persisted session on mount ────────────────────────────────────────
  // isLoading stays true until the session check completes so AppNavigator
  // doesn't flash the Login screen before knowing the user is already logged in.
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await sessionManager.loadSession();
        if (session.user && session.token) {
          setUser(session.user);
          setActiveRole(resolveUserRole(session.user.role));
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
      setIsLoading(false);
    };
    loadSession();
  }, []);

  // ── Register 401 handler ───────────────────────────────────────────────────
  // Keeps backendConfig free of React dependencies — it fires a plain event,
  // and this hook owns the state update and navigation redirect.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      authAPI.clearSession();
      await sessionManager.clearSession();
      setUser(null);
      setActiveRole('guest');
      setSessionExpiredAt(Date.now());
    });

    // Remove handler when provider unmounts (prevents stale closure leaks)
    return () => setUnauthorizedHandler(null);
  }, []);

  // ── Auth actions ───────────────────────────────────────────────────────────

  /**
   * OTP-based login: send phone + OTP + role to verifyOTP.
   * Used by LoginScreen when the user completes OTP verification.
   */
  const login = async (phone, otp, options = {}) => {
    const selectedRole   = resolveUserRole(options.role);
    const response       = await authAPI.verifyOTP({ phone, otp, role: selectedRole });
    const resolvedUser   = buildUser(response?.user || { phone, role: selectedRole, name: 'مستخدم' });
    setUser(resolvedUser);
    setActiveRole(resolveUserRole(resolvedUser.role || selectedRole));
    await sessionManager.saveSession(response.token, response.refreshToken, resolvedUser);
    return resolvedUser;
  };

  /** Phone-only login (no OTP, no password) — for demo / quick-access. */
  const loginSimple = async (phone) => {
    const response     = await authAPI.loginSimple(phone);
    const resolvedUser = buildUser(response?.user || { phone, role: 'investor', name: 'مستخدم' });
    setUser(resolvedUser);
    setActiveRole(resolveUserRole(resolvedUser.role));
    await sessionManager.saveSession(response.token, response.refreshToken, resolvedUser);
    return resolvedUser;
  };

  /** Email + password login. */
  const loginWithEmail = async ({ email, password, role }) => {
    const response     = await authAPI.loginWithEmail({ email, password, role });
    const resolvedUser = buildUser(response?.user || { email, role, name: 'مستخدم' });
    setUser(resolvedUser);
    setActiveRole(resolveUserRole(resolvedUser.role || role));
    await sessionManager.saveSession(response.token, response.refreshToken, resolvedUser);
    return resolvedUser;
  };

  /** Password-based login — traditional phone + password flow. */
  const loginWithPassword = async ({ phone, password, role }) => {
    const response     = await authAPI.login({ phone, password, role });
    const resolvedUser = buildUser(response?.user || { phone, role, name: 'مستخدم' });
    setUser(resolvedUser);
    setActiveRole(resolveUserRole(resolvedUser.role || role));
    await sessionManager.saveSession(response.token, response.refreshToken, resolvedUser);
    return resolvedUser;
  };

  const register = async (data) => {
    const response     = await authAPI.register(data);
    const resolvedUser = buildUser(response?.user || data);
    setUser(resolvedUser);
    setActiveRole(resolveUserRole(resolvedUser.role));
    await sessionManager.saveSession(response.token, response.refreshToken, resolvedUser);
    return resolvedUser;
  };

  /**
   * Partially update the user in state and storage without a full logout/login.
   * Used by EditAccountScreen to reflect profile changes immediately.
   */
  const updateUser = async (partialUser = {}) => {
    const nextUser = buildUser({ ...(user || {}), ...partialUser });
    setUser(nextUser);
    setActiveRole(resolveUserRole(nextUser.role || activeRole));
    // Re-use the existing tokens — only the user data changes
    const session = await sessionManager.loadSession();
    await sessionManager.saveSession(session.token, session.refreshToken, nextUser);
    return nextUser;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);  // non-fatal — still clear locally
    }
    authAPI.clearSession();
    await sessionManager.clearSession();
    setUser(null);
    setActiveRole('guest');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        activeRole,
        isLoading,
        login,
        loginSimple,
        loginWithPassword,
        loginWithEmail,
        register,
        updateUser,
        setActiveRole,
        logout,
        sessionExpiredAt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
