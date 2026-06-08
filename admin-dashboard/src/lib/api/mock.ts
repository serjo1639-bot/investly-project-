/**
 * Mock API adapter — used in development when no real backend is running.
 *
 * How it works:
 *  1. Every HTTP request made by apiClient is intercepted by this function.
 *  2. Instead of hitting the network, it matches the URL/method against the
 *     conditions below and returns hard-coded fake data.
 *  3. This lets the frontend be developed and tested without a live server.
 *
 * To switch to the real backend, set NEXT_PUBLIC_USE_MOCK=false in .env.local.
 */

import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const MOCK_ADMIN: Record<string, unknown> = {
  id: 'admin-1',
  name: 'Admin User',
  phone: '+218911000001',
  email: 'admin@investly.ly',
  role: 'admin',
  age: 35,
  gender: 'male',
  location: 'Tripoli, Libya',
  passportUrl: null,
  status: 'active',
  isVerified: true,
  kycStatus: 'approved',
  walletBalance: 0,
  createdAt: '2024-01-01T00:00:00Z',
};

const MOCK_SESSION = {
  token: 'mock-dev-token',
  refreshToken: 'mock-dev-refresh',
  user: MOCK_ADMIN,
};

const MOCK_USERS = [
  { id: 'u1', name: 'Ahmed Ali', phone: '+218911111111', email: 'ahmed@test.ly', role: 'investor', age: 29, gender: 'male', location: 'Tripoli, Libya', passportUrl: null, status: 'active', isVerified: true, kycStatus: 'approved', walletBalance: 5000, contributionTotal: 7500, contributionsCount: 3, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'u2', name: 'Fatima Hassan', phone: '+218922222222', email: 'fatima@test.ly', role: 'owner', age: 34, gender: 'female', location: 'Benghazi, Libya', passportUrl: null, status: 'active', isVerified: true, kycStatus: 'approved', companyName: 'Tech Ventures Ltd', projectsCount: 3, createdAt: '2024-04-20T10:00:00Z' },
  { id: 'u3', name: 'Omar Mansour', phone: '+218933333333', email: 'omar@test.ly', role: 'investor', age: 22, gender: 'male', location: 'Misrata, Libya', passportUrl: null, status: 'pending', isVerified: false, kycStatus: 'pending', walletBalance: 0, createdAt: '2024-05-01T10:00:00Z' },
  { id: 'u4', name: 'Sara Khalil', phone: '+218944444444', email: 'sara@test.ly', role: 'investor', age: 31, gender: 'female', location: 'Zawiya, Libya', passportUrl: null, status: 'suspended', isVerified: true, kycStatus: 'approved', walletBalance: 2500, contributionTotal: 11000, contributionsCount: 2, createdAt: '2024-02-10T10:00:00Z' },
];

const MOCK_PROJECTS = [
  { id: 'p1', titleAr: 'مشروع تقني ناشئ', titleEn: 'Tech Startup', descriptionEn: 'A cutting-edge software platform for fintech.', category: 'tech', status: 'active', goal: 100000, raised: 65000, minInvestment: 500, progress: 65, ownerId: 'u2', ownerName: 'Fatima Hassan', ownerCompanyName: 'Tech Ventures Ltd', investorsCount: 12, viewsCount: 340, duration: 12, startDate: '2024-02-01T00:00:00Z', endDate: '2025-02-01T00:00:00Z', createdAt: '2024-02-01T10:00:00Z' },
  { id: 'p2', titleAr: 'مزرعة طاقة شمسية', titleEn: 'Solar Energy Farm', descriptionEn: 'Renewable solar energy for rural communities.', category: 'energy', status: 'active', goal: 500000, raised: 120000, minInvestment: 1000, progress: 24, ownerId: 'u2', ownerName: 'Fatima Hassan', ownerCompanyName: 'Tech Ventures Ltd', investorsCount: 8, viewsCount: 210, duration: 24, startDate: '2024-03-10T00:00:00Z', endDate: '2026-03-10T00:00:00Z', createdAt: '2024-03-10T10:00:00Z' },
  { id: 'p3', titleAr: 'مزرعة ذكية', titleEn: 'Smart Agriculture', descriptionEn: 'Modern farming using IoT and smart irrigation.', category: 'agri', status: 'pending', goal: 80000, raised: 0, minInvestment: 250, progress: 0, ownerId: 'u2', ownerName: 'Fatima Hassan', investorsCount: 0, viewsCount: 45, createdAt: '2024-05-01T10:00:00Z' },
  { id: 'p4', titleAr: 'عيادة صحية', titleEn: 'Health Clinic', descriptionEn: 'Community health clinic in Tripoli.', category: 'health', status: 'completed', goal: 200000, raised: 200000, minInvestment: 1000, progress: 100, ownerId: 'u2', ownerName: 'Fatima Hassan', investorsCount: 25, viewsCount: 890, duration: 18, createdAt: '2023-11-01T10:00:00Z' },
];

const MOCK_INVESTMENTS = [
  { id: 'inv1', projectId: 'p1', projectTitle: 'Tech Startup', reference: 'INV-2024-001', amount: 2500, currency: 'LYD', paymentMethod: 'wallet', status: 'completed', investorId: 'u1', investorName: 'Ahmed Ali', createdAt: '2024-04-01T10:00:00Z' },
  { id: 'inv2', projectId: 'p2', projectTitle: 'Solar Energy Farm', reference: 'INV-2024-002', amount: 5000, currency: 'LYD', paymentMethod: 'credit_card', status: 'completed', investorId: 'u1', investorName: 'Ahmed Ali', createdAt: '2024-04-15T10:00:00Z' },
  { id: 'inv3', projectId: 'p1', projectTitle: 'Tech Startup', reference: 'INV-2024-003', amount: 1000, currency: 'LYD', paymentMethod: 'wallet', status: 'pending', investorId: 'u4', investorName: 'Sara Khalil', createdAt: '2024-05-01T10:00:00Z' },
  { id: 'inv4', projectId: 'p4', projectTitle: 'Health Clinic', reference: 'INV-2024-004', amount: 10000, currency: 'LYD', paymentMethod: 'credit_card', status: 'completed', investorId: 'u4', investorName: 'Sara Khalil', createdAt: '2024-01-10T10:00:00Z' },
];

const MOCK_PAYMENTS = [
  { id: 'pay1', amount: 2500, currency: 'LYD', method: 'wallet', status: 'completed', userId: 'u1', userName: 'Ahmed Ali', transactionId: 'TXN-2024-001', createdAt: '2024-04-01T10:00:00Z' },
  { id: 'pay2', amount: 5000, currency: 'LYD', method: 'credit_card', status: 'completed', userId: 'u1', userName: 'Ahmed Ali', transactionId: 'TXN-2024-002', createdAt: '2024-04-15T10:00:00Z' },
  { id: 'pay3', amount: 1000, currency: 'LYD', method: 'wallet', status: 'pending', userId: 'u4', userName: 'Sara Khalil', transactionId: 'TXN-2024-003', createdAt: '2024-05-01T10:00:00Z' },
];

const MOCK_STATS = {
  totalUsers: 4,
  totalProjects: 4,
  totalInvestments: 4,
  totalRevenue: 18500,
  activeProjects: 2,
  pendingProjects: 1,
  newUsersToday: 1,
  newUsersThisWeek: 2,
  totalTransactions: 3,
  successRate: 75,
};

/**
 * Wraps an array in the same pagination envelope the real API returns.
 * The generic <T> means it works with any item type (users, payments, etc.).
 */
const paginate = <T>(items: T[]) => ({
  data: items,
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
});

/**
 * Builds a successful Axios response object with HTTP status 200.
 * Every mock handler returns this so callers see a consistent response shape.
 */
const ok = (data: unknown, config: InternalAxiosRequestConfig): AxiosResponse => ({
  data: { data },
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
  request: {},
});

export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  // simulate a brief network delay so loading states are visible
  await new Promise((r) => setTimeout(r, 350));

  const url = config.url ?? '';
  const method = (config.method ?? 'get').toLowerCase();

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (method === 'post' && url.includes('/auth/login')) {
    return { ...ok(null, config), data: MOCK_SESSION };
  }
  if (method === 'get' && url.includes('/auth/profile')) {
    return ok(MOCK_ADMIN, config);
  }
  if (method === 'post' && url.includes('/auth/logout')) {
    return ok({ success: true }, config);
  }
  if (method === 'post' && url.includes('/auth/refresh-token')) {
    return { ...ok(null, config), data: { token: 'mock-dev-token', refreshToken: 'mock-dev-refresh' } };
  }
  if (method === 'put' && url.includes('/auth/profile')) {
    return ok(MOCK_ADMIN, config);
  }
  if (method === 'post' && url.includes('/auth/change-password')) {
    return ok({ success: true }, config);
  }

  // ── Admin stats ───────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/stats')) {
    return ok(MOCK_STATS, config);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/users')) {
    return ok(paginate(MOCK_USERS), config);
  }
  if (method === 'get' && /\/users\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    return ok(MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[0], config);
  }
  if ((method === 'put' || method === 'patch') && url.includes('/users/')) {
    return ok(MOCK_USERS[0], config);
  }
  if (method === 'delete' && url.includes('/users/')) {
    return ok({ success: true }, config);
  }
  if (method === 'post' && url.includes('/ban')) {
    return ok({ success: true }, config);
  }
  if (method === 'post' && url.includes('/unban')) {
    return ok({ success: true }, config);
  }
  if (method === 'get' && url.includes('/investments') && url.includes('/users/')) {
    return ok(MOCK_INVESTMENTS.slice(0, 2), config);
  }
  if (method === 'get' && url.includes('/documents')) {
    return ok([], config);
  }
  if (method === 'post' && url.includes('/kyc/approve')) {
    return ok({ success: true, kycStatus: 'approved' }, config);
  }
  if (method === 'post' && url.includes('/kyc/reject')) {
    return ok({ success: true, kycStatus: 'rejected' }, config);
  }
  if (method === 'post' && url.includes('/kyc')) {
    return ok({ success: true }, config);
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/projects')) {
    return ok(paginate(MOCK_PROJECTS), config);
  }
  if (method === 'get' && url.includes('/projects/featured')) {
    return ok(MOCK_PROJECTS.slice(0, 2), config);
  }
  if (method === 'get' && url.includes('/projects/categories')) {
    return ok(['tech', 'energy', 'agri', 'health', 'edu', 'realestate'], config);
  }
  if (method === 'get' && /\/projects\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    return ok(MOCK_PROJECTS.find((p) => p.id === id) ?? MOCK_PROJECTS[0], config);
  }
  if (method === 'get' && url.includes('/stats') && url.includes('/projects/')) {
    return ok({ investorsCount: 12, totalRaised: 65000, viewsCount: 340 }, config);
  }
  if (method === 'post' && url.includes('/projects')) {
    return ok(MOCK_PROJECTS[0], config);
  }
  if (method === 'put' && url.includes('/projects/')) {
    return ok(MOCK_PROJECTS[0], config);
  }
  if (method === 'delete' && url.includes('/projects/')) {
    return ok({ success: true }, config);
  }
  if (method === 'post' && url.includes('/approve')) {
    return ok({ success: true }, config);
  }
  if (method === 'post' && url.includes('/reject')) {
    return ok({ success: true }, config);
  }

  // ── Investments ───────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/investments')) {
    return ok(paginate(MOCK_INVESTMENTS), config);
  }
  if (method === 'get' && /\/investments\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    return ok(MOCK_INVESTMENTS.find((i) => i.id === id) ?? MOCK_INVESTMENTS[0], config);
  }

  // ── Payments ──────────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/payments')) {
    return ok(paginate(MOCK_PAYMENTS), config);
  }
  if (method === 'post' && url.includes('/approve') && url.includes('payments')) {
    return ok({ success: true, status: 'completed' }, config);
  }
  if (method === 'post' && url.includes('/reject') && url.includes('payments')) {
    return ok({ success: true, status: 'failed' }, config);
  }
  if (method === 'post' && url.includes('/refund')) {
    return ok({ success: true, status: 'refunded' }, config);
  }
  if (method === 'put' && url.includes('/status') && url.includes('payments')) {
    return ok({ success: true }, config);
  }
  if (method === 'post' && url.includes('/wallet/add')) {
    return ok({ success: true, newBalance: 15000 }, config);
  }
  if (method === 'post' && url.includes('/wallet/transfer')) {
    return ok({ success: true }, config);
  }
  if (method === 'get' && url.includes('/admin/wallets')) {
    const BALANCE_POOL = [5000, 12500, 0, 2500, 45000, 1000];
    const STATUS_POOL = ['active', 'active', 'active', 'frozen', 'inactive'] as const;
    const wallets = MOCK_USERS.map((u, i) => ({
      userId:           u.id,
      userName:         u.name,
      userEmail:        u.email,
      balance:          BALANCE_POOL[i % BALANCE_POOL.length],
      totalDeposits:    BALANCE_POOL[i % BALANCE_POOL.length] * 2,
      totalWithdrawals: BALANCE_POOL[i % BALANCE_POOL.length],
      lastActivity:     new Date(Date.now() - i * 86400000).toISOString(),
      status:           STATUS_POOL[i % STATUS_POOL.length],
    }));
    return ok(paginate(wallets), config);
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/notifications/unread-count')) {
    return ok({ count: 2 }, config);
  }
  if (method === 'get' && url.includes('/notifications/settings')) {
    return ok({}, config);
  }
  if (method === 'get' && url.includes('/notifications')) {
    return ok([], config);
  }
  if (method === 'post' && url.includes('/notifications')) {
    return ok({ success: true }, config);
  }

  // ── Activity logs ─────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/activity-logs')) {
    return ok([], config);
  }

  // ── Media ─────────────────────────────────────────────────────────────────
  if (method === 'post' && url.includes('/media/upload')) {
    return ok({ url: 'https://placehold.co/400x300', mediaId: 'mock-media-1' }, config);
  }
  if (method === 'delete' && url.includes('/media/')) {
    return ok({ success: true }, config);
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return ok(null, config);
}
