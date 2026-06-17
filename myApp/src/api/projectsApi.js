/**
 * projectsApi.js — Public + authenticated project endpoints.
 * Responses are normalized to the app's model (see normalizers.js); the
 * create/update requests are mapped to the backend's bilingual shape.
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeProject, normalizeCategory, mapArray } from './normalizers';

export const projectsApi = {
  getFeatured: () => api.get(endpoints.projects.featured).then((d) => mapArray(d, normalizeProject)),

  /** @param {Object} params e.g. { search, categoryId, status, sort, page, pageSize } */
  getAll: (params = {}) =>
    api.get(endpoints.projects.list, { params }).then((res) => ({
      ...res,
      items: mapArray(res?.items ?? res, normalizeProject),
    })),

  getCategories: () =>
    api.get(endpoints.projects.categories).then((d) => mapArray(d, normalizeCategory)),

  getById: (id) => api.get(endpoints.projects.byId(id)).then(normalizeProject),
  getStats: (id) => api.get(endpoints.projects.stats(id)),

  /** Map the app's flat project form to the backend CreateProjectRequest. */
  create: (p) =>
    api
      .post(endpoints.projects.create, {
        titleAr: p.title,
        titleEn: p.title,
        descriptionAr: p.description,
        descriptionEn: p.description,
        category: p.categoryId,
        imageUrl: p.coverUrl,
        goal: Number(p.goalAmount),
        minInvestment: Number(p.minInvestment) || 1,
        currencyCode: 'LYD',
      })
      .then(normalizeProject),

  update: (id, p) =>
    api
      .put(endpoints.projects.update(id), {
        titleAr: p.title,
        titleEn: p.title,
        descriptionAr: p.description,
        descriptionEn: p.description,
        imageUrl: p.coverUrl,
      })
      .then(normalizeProject),

  recordView: (id) => api.post(endpoints.projects.recordView(id)),
};
