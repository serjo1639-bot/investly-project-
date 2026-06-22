'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthSession } from '@/types';
import { setAuthToken } from '@/lib/api/config';
import { authApi } from '@/lib/api/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEYS = {
  token: 'admin_token',
  user: 'admin_user',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(SESSION_KEYS.token);
    const savedUser = localStorage.getItem(SESSION_KEYS.user);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setToken(savedToken);
        setUser(parsedUser);
        setAuthToken(savedToken);
      } catch {
        localStorage.removeItem(SESSION_KEYS.token);
        localStorage.removeItem(SESSION_KEYS.user);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((session: AuthSession) => {
    const { token: newToken, user: newUser } = session;
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    localStorage.setItem(SESSION_KEYS.token, newToken);
    localStorage.setItem(SESSION_KEYS.user, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEYS.token);
    localStorage.removeItem(SESSION_KEYS.user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authApi.getProfile();
      setUser(updatedUser);
      localStorage.setItem(SESSION_KEYS.user, JSON.stringify(updatedUser));
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
