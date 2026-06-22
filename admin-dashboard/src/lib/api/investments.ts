import apiClient from './config';
import { Investment, PaginatedResponse } from '@/types';

type ApiObject = Record<string, unknown>;

const asObject = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {};

const normalizeStatus = (status?: string): Investment['status'] => {
  const value = String(status || '').toLowerCase();
  if (value === 'confirmed' || value === 'refunded') return 'completed';
  if (value === 'cancelled' || value === 'canceled') return 'cancelled';
  if (value === 'pending' || value === 'failed' || value === 'completed') return value as Investment['status'];
  return 'pending';
};

const toBackendStatus = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (!value) return undefined;
  if (value === 'completed') return 'Confirmed';
  if (value === 'cancelled') return 'Cancelled';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const normalizeInvestment = (investment: unknown): Investment => {
  const source = asObject(investment);
  const project = asObject(source.project);

  return {
    ...source,
    id: String(source.id ?? source.investmentId ?? source.investment_id ?? ''),
    projectId: String(source.projectId ?? source.project_id ?? ''),
    projectTitle: String(source.projectTitle ?? source.project_title ?? project.title ?? ''),
    reference: String(source.reference ?? `INV-${source.investmentId ?? source.id ?? ''}`),
    amount: Number(source.amount ?? 0),
    fundingPercentage: Number(source.fundingPercentage ?? source.funding_percentage ?? 0),
    equityPercentage: Number(source.equityPercentage ?? source.equity_percentage ?? 0),
    status: normalizeStatus(String(source.status ?? '')),
    investorId: String(source.investorId ?? source.investor_id ?? ''),
    investorName: String(source.investorName ?? source.investor_name ?? ''),
    createdAt: (source.createdAt ?? source.created_at) as string | undefined,
    updatedAt: (source.updatedAt ?? source.updated_at) as string | undefined,
  } as Investment;
};

const normalizePaginatedInvestments = (payload: unknown): PaginatedResponse<Investment> => {
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
    data: safeItems.map(normalizeInvestment),
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
};

export const investmentsApi = {
  getAllInvestments: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    userId?: string;
    projectId?: string;
  }): Promise<PaginatedResponse<Investment>> => {
    const response = await apiClient.get('/admin/investments', {
      params: { ...params, status: toBackendStatus(params?.status) },
    });
    return normalizePaginatedInvestments(response.data);
  },

  getInvestmentById: async (id: string): Promise<Investment> => {
    const response = await apiClient.get(`/investments/${id}`);
    return normalizeInvestment(response.data?.data ?? response.data);
  },

  getUserInvestments: async (userId?: string): Promise<Investment[]> => {
    const response = userId
      ? await apiClient.get('/admin/investments', { params: { userId } })
      : await apiClient.get('/investments/my');
    const data = response.data?.data ?? response.data;
    return (data?.items ?? data ?? []).map(normalizeInvestment);
  },

  getInvestmentHistory: async () => {
    const response = await apiClient.get('/investments/my');
    const data = response.data?.data ?? response.data;
    return data?.items ?? data;
  },

  getWalletBalance: async () => {
    const response = await apiClient.get('/wallet');
    return response.data?.data ?? response.data;
  },

  checkout: async (payload: {
    currency: string;
    contributions: Array<{
      projectId: string;
      reference: string;
      amount: number;
      currency: string;
      paymentMethod: string;
    }>;
  }) => {
    const results = [];
    for (const contribution of payload.contributions) {
      const created = await apiClient.post('/investments', {
        projectId: Number(contribution.projectId),
        amount: contribution.amount,
      });
      const investment = created.data?.data ?? created.data;
      const investmentId = investment.investmentId ?? investment.id;
      const confirmed = await apiClient.post(`/investments/${investmentId}/confirm`);
      results.push(confirmed.data?.data ?? confirmed.data);
    }
    return results;
  },

  redeemCard: async (code: string) => {
    const match = code.match(/-(\d+)-/);
    const amount = match ? Number(match[1]) : 0;
    const response = await apiClient.post('/wallet/deposit', {
      amount,
      referenceNo: code,
      description: 'Top-up card',
    });
    return response.data?.data ?? response.data;
  },
};
