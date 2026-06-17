/**
 * QueryProvider.js — Configures and provides the React Query client.
 *
 * Defaults tuned for a mobile app: a short stale window for snappy-but-fresh
 * data, no refetch-on-window-focus (noisy on mobile), and a single retry that
 * skips 4xx client errors (retrying a 401/403/404 is pointless).
 */
import React, { useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '../utils/errors';

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = error instanceof ApiError ? error.status : 0;
          if (status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

export function QueryProvider({ children }) {
  const clientRef = useRef();
  if (!clientRef.current) clientRef.current = createClient();
  return <QueryClientProvider client={clientRef.current}>{children}</QueryClientProvider>;
}
