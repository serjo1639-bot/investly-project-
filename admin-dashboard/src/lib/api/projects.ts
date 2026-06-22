import apiClient from './config';
import { Project, PaginatedResponse } from '@/types';

export interface ProjectsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
}

type ApiObject = Record<string, unknown>;

const asObject = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {};

const CATEGORY_ID_BY_KEY: Record<string, number> = {
  tech: 1,
  energy: 2,
  agri: 3,
  health: 4,
  edu: 5,
  realestate: 6,
};

const CATEGORY_BY_ID: Record<number, Project['category']> = {
  1: 'tech',
  2: 'energy',
  3: 'agri',
  4: 'health',
  5: 'edu',
  6: 'realestate',
};

const normalizeStatus = (status?: string): Project['status'] => {
  const value = String(status || '').toLowerCase();
  if (value === 'approved') return 'active';
  if (value === 'funded' || value === 'closed') return 'completed';
  if (value === 'draft') return 'inactive';
  if (value === 'pending' || value === 'rejected' || value === 'active' || value === 'completed' || value === 'inactive') {
    return value as Project['status'];
  }
  return 'pending';
};

const toBackendStatus = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (!value) return undefined;
  if (value === 'active') return 'Approved';
  if (value === 'completed') return 'Funded';
  if (value === 'inactive') return 'Draft';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const normalizeProject = (project: unknown): Project => {
  const source = asObject(project);
  const fundingGoal = Number(source.fundingGoal ?? source.funding_goal ?? 0);
  const currentAmount = Number(source.currentAmount ?? source.current_amount ?? 0);
  const categoryId = Number(source.categoryId ?? source.category_id ?? 0);

  return {
    ...source,
    // Backend DTOs use projectId/categoryId; dashboard cards use id/category.
    id: String(source.id ?? source.projectId ?? source.project_id ?? ''),
    title: String(source.title ?? ''),
    description: String(source.description ?? ''),
    category: (source.category as Project['category']) ?? CATEGORY_BY_ID[categoryId] ?? 'tech',
    categoryName: String(source.categoryName ?? source.category_name ?? ''),
    city: String(source.city ?? ''),
    imageUrl: (source.imageUrl ?? source.image_url ?? null) as string | null,
    fundingGoal,
    currentAmount,
    minInvestment: Number(source.minInvestment ?? source.min_investment ?? 0),
    maxInvestment: Number(source.maxInvestment ?? source.max_investment ?? 0),
    status: normalizeStatus(String(source.status ?? '')),
    reference: String(source.reference ?? ''),
    ownerId: String(source.ownerId ?? source.creatorUserId ?? source.creator_user_id ?? ''),
    ownerName: String(source.ownerName ?? source.owner_name ?? ''),
    ownerCompanyName: (source.ownerCompanyName ?? source.companyName ?? null) as string | null,
    progress: Number(source.progress ?? source.percentFunded ?? (fundingGoal > 0 ? (currentAmount / fundingGoal) * 100 : 0)),
    duration: Number(source.duration ?? source.durationDays ?? 0),
    startDate: (source.startDate ?? source.start_date) as string | undefined,
    endDate: (source.endDate ?? source.end_date) as string | undefined,
    teamSize: Number(source.teamSize ?? source.team_size ?? 0),
    investorsCount: Number(source.investorsCount ?? source.investors_count ?? 0),
    viewsCount: Number(source.viewsCount ?? source.views_count ?? 0),
    createdAt: (source.createdAt ?? source.created_at) as string | undefined,
    updatedAt: (source.updatedAt ?? source.updated_at) as string | undefined,
  } as Project;
};

const normalizePaginatedProjects = (payload: unknown): PaginatedResponse<Project> => {
  const payloadObject = asObject(payload);
  const source = payloadObject.data ?? payload ?? {};
  const sourceObject = asObject(source);
  const items = Array.isArray(source)
    ? source
    : sourceObject.items ?? sourceObject.data ?? [];
  const safeItems = Array.isArray(items) ? items : [];
  const total = Number(sourceObject.totalCount ?? sourceObject.total ?? safeItems.length);
  const page = Number(sourceObject.page ?? 1);
  const pageSize = Number(sourceObject.pageSize ?? safeItems.length);

  return {
    data: safeItems.map(normalizeProject),
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
};

export const projectsApi = {
  getAllProjects: async (params?: ProjectsQueryParams): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get('/admin/projects', {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        categoryId: params?.category ? CATEGORY_ID_BY_KEY[params.category] : undefined,
        // Backend status values are PascalCase lifecycle names.
        status: toBackendStatus(params?.status),
      },
    });
    return normalizePaginatedProjects(response.data);
  },

  getFeaturedProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects/featured');
    const data = response.data?.data ?? response.data;
    return (data?.items ?? data ?? []).map(normalizeProject);
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return normalizeProject(response.data?.data ?? response.data);
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return normalizeProject(response.data?.data ?? response.data);
  },

  updateProject: async (projectId: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put(`/projects/${projectId}`, data);
    return normalizeProject(response.data?.data ?? response.data);
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/admin/projects/${projectId}`);
  },

  approveProject: async (projectId: string): Promise<void> => {
    await apiClient.post(`/admin/projects/${projectId}/approve`);
  },

  rejectProject: async (projectId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/projects/${projectId}/reject`, { reason });
  },

  getProjectStats: async (projectId: string) => {
    // Backend does not expose per-project stats yet; derive the values the detail UI needs.
    const project = await projectsApi.getProjectById(projectId);
    return {
      fundingGoal: project.fundingGoal,
      currentAmount: project.currentAmount,
      progress: project.progress ?? (project.fundingGoal > 0 ? (project.currentAmount / project.fundingGoal) * 100 : 0),
      investorsCount: project.investorsCount ?? 0,
      viewsCount: project.viewsCount ?? 0,
    };
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/projects/categories');
    const data = response.data?.data ?? response.data;
    const dataObject = asObject(data);
    const categories = Array.isArray(dataObject.items) ? dataObject.items : Array.isArray(data) ? data : [];
    return categories.map((category) => {
      const source = asObject(category);
      return String(source.techCode || source.name || category);
    });
  },
};


