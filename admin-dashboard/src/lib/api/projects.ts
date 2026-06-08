import apiClient from './config';
import { Project, PaginatedResponse } from '@/types';

export interface ProjectsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
}

export const projectsApi = {
  getAllProjects: async (params?: ProjectsQueryParams): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get('/admin/projects', { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }
    return data?.data ?? data;
  },

  getFeaturedProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects/featured');
    return response.data?.data ?? response.data;
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data?.data ?? response.data;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data?.data ?? response.data;
  },

  updateProject: async (projectId: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put(`/projects/${projectId}`, data);
    return response.data?.data ?? response.data;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`);
  },

  approveProject: async (projectId: string): Promise<void> => {
    await apiClient.post(`/admin/projects/${projectId}/approve`);
  },

  rejectProject: async (projectId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/projects/${projectId}/reject`, { reason });
  },

  getProjectStats: async (projectId: string) => {
    const response = await apiClient.get(`/projects/${projectId}/stats`);
    return response.data?.data ?? response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/projects/categories');
    return response.data?.data ?? response.data;
  },
};
