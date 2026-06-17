import apiClient from './config';

/** Remote settings the mobile app reads on launch. */
export interface AppSettings {
  maintenanceMode: boolean;
  maintenanceMessageAr: string;
  maintenanceMessageEn: string;
  announcementActive: boolean;
  announcementAr: string;
  announcementEn: string;
  allowRegistration: boolean;
  allowInvestments: boolean;
  minSupportedVersion: string;
  updatedAt: string;
}

export type AppSettingsUpdate = Partial<Omit<AppSettings, 'updatedAt'>>;

export const appSettingsApi = {
  get: async (): Promise<AppSettings> => {
    const response = await apiClient.get('/app-settings');
    return response.data?.data ?? response.data;
  },

  update: async (payload: AppSettingsUpdate): Promise<AppSettings> => {
    const response = await apiClient.put('/app-settings', payload);
    return response.data?.data ?? response.data;
  },
};
