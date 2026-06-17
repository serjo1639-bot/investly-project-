/**
 * investmentsApi.js — Investments + wallet operations.
 * Checkout is mapped to the backend's `{ currency, contributions[] }` shape.
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeInvestment, normalizeWallet, mapArray } from './normalizers';

export const investmentsApi = {
  /** @param {Object} payload { projectId, amount, method } → contributions[] */
  checkout: ({ projectId, amount, method = 'wallet', currency = 'LYD' }) =>
    api.post(endpoints.investments.checkout, {
      currency,
      contributions: [{ projectId, amount: Number(amount), currency, paymentMethod: method }],
    }),

  getMine: () => api.get(endpoints.investments.mine).then((d) => mapArray(d, normalizeInvestment)),
  getHistory: () => api.get(endpoints.investments.history).then((d) => mapArray(d, normalizeInvestment)),
  getFundingOptions: () => api.get(endpoints.investments.fundingOptions),

  getWallet: () => api.get(endpoints.investments.wallet).then(normalizeWallet),
  topup: (payload) => api.post(endpoints.investments.topup, payload), // { amount, method }
  withdraw: (payload) => api.post(endpoints.investments.withdraw, payload), // { amount }
  redeemCode: (code) => api.post(endpoints.investments.redeem, { code }),
};
