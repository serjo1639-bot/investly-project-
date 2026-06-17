/**
 * endpoints.js — Every backend path in one place (relative to CONFIG.apiBaseUrl,
 * which already includes the "/api" segment). Mapped 1:1 to the ASP.NET
 * controllers so the API surface is auditable at a glance.
 */
export const endpoints = {
  auth: {
    loginEmail: '/auth/login-email',
    loginPhone: '/auth/login',
    register: '/auth/register',
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    forgotPassword: '/auth/forgot-password',
    verifyResetCode: '/auth/verify-reset-code',
    resetPassword: '/auth/reset-password',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    profile: '/auth/profile',
  },
  projects: {
    featured: '/projects/featured',
    list: '/projects',
    categories: '/projects/categories',
    byId: (id) => `/projects/${id}`,
    create: '/projects',
    update: (id) => `/projects/${id}`,
    recordView: (id) => `/projects/${id}/views`,
    stats: (id) => `/projects/${id}/stats`,
  },
  investments: {
    checkout: '/investments/checkout',
    mine: '/investments/me',
    history: '/investments/history',
    wallet: '/investments/wallet',
    topup: '/investments/wallet/topup',
    withdraw: '/investments/wallet/withdraw',
    fundingOptions: '/investments/funding-options',
    redeem: '/investments/topup/redeem',
  },
  payments: {
    initiate: '/payments/initiate',
    verify: '/payments/verify',
    methods: '/payments/methods',
    history: '/payments/history',
    wallet: '/payments/wallet',
    byId: (id) => `/payments/${id}`,
    status: (id) => `/payments/${id}/status`,
    refund: (id) => `/payments/${id}/refund`,
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    read: (id) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
    settings: '/notifications/settings',
  },
  owners: {
    projects: (ownerId) => `/owners/${ownerId}/projects`,
    stats: (ownerId) => `/owners/${ownerId}/stats`,
    dashboard: (ownerId) => `/owners/${ownerId}/dashboard`,
  },
  users: {
    byId: (id) => `/users/${id}`,
    kyc: (id) => `/users/${id}/kyc`,
    documents: (id) => `/users/${id}/documents`,
    investments: (id) => `/users/${id}/investments`,
  },
  media: {
    upload: '/media/upload',
    byId: (id) => `/media/${id}`,
  },
  appSettings: {
    get: '/app-settings', // public — admin-controlled remote settings
  },
};
