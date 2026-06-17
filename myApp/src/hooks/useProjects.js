/**
 * useProjects — project queries (list with filters + infinite scroll, featured,
 * categories, detail, stats) and the create/update mutations for owners.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { queryKeys } from '../constants/queryKeys';

const PAGE_SIZE = 10;

/** Normalize a backend list response into { items, nextPage }. */
function normalizePage(res, page) {
  // Tolerates: array, { items, total }, { data, totalPages }, { results }.
  const items = Array.isArray(res) ? res : res?.items ?? res?.results ?? res?.data ?? [];
  const total = res?.total ?? res?.totalCount;
  const totalPages = res?.totalPages ?? (total != null ? Math.ceil(total / PAGE_SIZE) : null);
  const hasMore =
    totalPages != null ? page < totalPages : items.length === PAGE_SIZE;
  return { items, nextPage: hasMore ? page + 1 : undefined };
}

export function useFeaturedProjects() {
  return useQuery({
    queryKey: queryKeys.projects.featured,
    queryFn: () => projectsApi.getFeatured(),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.projects.categories,
    queryFn: () => projectsApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useProjectsList(filters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      projectsApi
        .getAll({ ...filters, page: pageParam, pageSize: PAGE_SIZE })
        .then((res) => normalizePage(res, pageParam)),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage,
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useProjectStats(id) {
  return useQuery({
    queryKey: queryKeys.projects.stats(id),
    queryFn: () => projectsApi.getStats(id),
    enabled: Boolean(id),
  });
}

export function useRecordView() {
  return useMutation({ mutationFn: (id) => projectsApi.recordView(id) });
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? projectsApi.update(id, payload) : projectsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
