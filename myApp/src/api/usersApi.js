/**
 * usersApi.js — User record, KYC and per-user collections.
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeUser, normalizeInvestment, mapArray } from './normalizers';

export const usersApi = {
  getById: (id) => api.get(endpoints.users.byId(id)).then(normalizeUser),
  update: (id, payload) => api.put(endpoints.users.byId(id), payload).then(normalizeUser),
  remove: (id) => api.delete(endpoints.users.byId(id)),

  submitKyc: (id, payload) => api.post(endpoints.users.kyc(id), payload), // { passportUrl, ... }
  getDocuments: (id) => api.get(endpoints.users.documents(id)),
  getInvestments: (id) =>
    api.get(endpoints.users.investments(id)).then((d) => mapArray(d, normalizeInvestment)),
};
