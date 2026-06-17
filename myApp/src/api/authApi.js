/**
 * authApi.js — Authentication & profile endpoints.
 * Every method resolves to the already-unwrapped `data` payload.
 */
import { api } from './client';
import { endpoints } from './endpoints';
import { normalizeUser } from './normalizers';

export const authApi = {
  loginEmail: (email, password) => api.post(endpoints.auth.loginEmail, { email, password }),
  loginPhone: (phone, password) => api.post(endpoints.auth.loginPhone, { phone, password }),

  /** @param {Object} payload name, email|phone, password, role, age, gender, location, passportUrl */
  register: (payload) => api.post(endpoints.auth.register, payload),

  sendOtp: (payload) => api.post(endpoints.auth.sendOtp, payload), // { phone|email, purpose }
  verifyOtp: (payload) => api.post(endpoints.auth.verifyOtp, payload), // { phone|email, otp, purpose }

  forgotPassword: (payload) => api.post(endpoints.auth.forgotPassword, payload), // { email|phone }
  verifyResetCode: (payload) => api.post(endpoints.auth.verifyResetCode, payload),
  resetPassword: (payload) => api.post(endpoints.auth.resetPassword, payload),

  changePassword: (currentPassword, newPassword) =>
    api.post(endpoints.auth.changePassword, { currentPassword, newPassword }),

  logout: (refreshToken) => api.post(endpoints.auth.logout, { refreshToken }),

  getProfile: () => api.get(endpoints.auth.profile).then(normalizeUser),
  updateProfile: (payload) => api.put(endpoints.auth.profile, payload).then(normalizeUser),
};
