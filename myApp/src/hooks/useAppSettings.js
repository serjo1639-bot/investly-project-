/**
 * useAppSettings — fetches the admin-controlled remote settings. Polls
 * periodically and on app focus so changes (e.g. maintenance mode) take effect
 * without the user restarting the app.
 */
import { useQuery } from '@tanstack/react-query';
import { appSettingsApi } from '../api/appSettingsApi';

export function useAppSettings() {
  return useQuery({
    queryKey: ['appSettings'],
    queryFn: () => appSettingsApi.get(),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // re-check every 5 min
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
