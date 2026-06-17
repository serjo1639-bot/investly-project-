/**
 * paymentsApi.js — Payment lifecycle endpoints (responses normalized).
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizePayment, normalizePaymentMethod, mapArray } from './normalizers';

export const paymentsApi = {
  initiate: (payload) => api.post(endpoints.payments.initiate, payload),
  verify: (payload) => api.post(endpoints.payments.verify, payload),
  getMethods: () => api.get(endpoints.payments.methods).then((d) => mapArray(d, normalizePaymentMethod)),
  getHistory: () => api.get(endpoints.payments.history).then((d) => mapArray(d, normalizePayment)),
  getWalletInfo: () => api.get(endpoints.payments.wallet),
  getById: (id) => api.get(endpoints.payments.byId(id)).then(normalizePayment),
  getStatus: (id) => api.get(endpoints.payments.status(id)),
  refund: (id) => api.post(endpoints.payments.refund(id)),
};
