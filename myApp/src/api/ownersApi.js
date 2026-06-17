/**
 * ownersApi.js — Project Manager (owner) dashboard & projects.
 * Dashboard nests { owner, projects, stats }; projects are normalized.
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeProject, normalizeUser, mapArray } from './normalizers';

export const ownersApi = {
  getDashboard: (ownerId) =>
    api.get(endpoints.owners.dashboard(ownerId)).then((d) => ({
      ...d,
      owner: normalizeUser(d?.owner),
      projects: mapArray(d?.projects, normalizeProject),
      // stats stays flat camelCase: { totalProjects, activeProjects, totalRaised, totalInvestors }
    })),
  getProjects: (ownerId) =>
    api.get(endpoints.owners.projects(ownerId)).then((d) => mapArray(d, normalizeProject)),
  getStats: (ownerId) => api.get(endpoints.owners.stats(ownerId)),
};
