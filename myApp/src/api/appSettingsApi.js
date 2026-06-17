/**
 * appSettingsApi.js — public remote app settings controlled by the admin
 * dashboard (maintenance mode, announcement banner, feature flags). Read on
 * launch; no auth required.
 */
import { api } from './client';
import { endpoints } from './endpoints';

export const appSettingsApi = {
  get: () => api.get(endpoints.appSettings.get),
};
