/**
 * queryKeys.js — Centralized React Query keys.
 * Functions return stable arrays so invalidation is consistent and typo-proof.
 */
export const queryKeys = {
  profile: ['profile'],

  projects: {
    all: ['projects'],
    list: (filters) => ['projects', 'list', filters ?? {}],
    featured: ['projects', 'featured'],
    categories: ['projects', 'categories'],
    detail: (id) => ['projects', 'detail', id],
    stats: (id) => ['projects', 'stats', id],
  },

  investments: {
    mine: ['investments', 'mine'],
    history: ['investments', 'history'],
    fundingOptions: ['investments', 'funding-options'],
  },

  wallet: ['wallet'],

  payments: {
    methods: ['payments', 'methods'],
    history: ['payments', 'history'],
    detail: (id) => ['payments', 'detail', id],
  },

  notifications: {
    all: ['notifications'],
    unreadCount: ['notifications', 'unread-count'],
    settings: ['notifications', 'settings'],
  },

  owner: {
    dashboard: (ownerId) => ['owner', ownerId, 'dashboard'],
    projects: (ownerId) => ['owner', ownerId, 'projects'],
    stats: (ownerId) => ['owner', ownerId, 'stats'],
  },
};
