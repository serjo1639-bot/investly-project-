import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  MOCK_ADMIN as ASSET_MOCK_ADMIN,
  MOCK_BLOCKED_ENTREPRENEURS as ASSET_MOCK_BLOCKED_ENTREPRENEURS,
  MOCK_INVESTMENTS as ASSET_MOCK_INVESTMENTS,
  MOCK_NOTIFICATIONS as ASSET_MOCK_NOTIFICATIONS,
  MOCK_PAYMENTS as ASSET_MOCK_PAYMENTS,
  MOCK_PROJECTS as ASSET_MOCK_PROJECTS,
  MOCK_SESSION as ASSET_MOCK_SESSION,
  MOCK_STATS as ASSET_MOCK_STATS,
  MOCK_USERS as ASSET_MOCK_USERS,
} from '../../assets/mockData';

const paginate = <T>(items: T[]) => ({
  data: items,
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
});

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
    return { ...ok(null, config), data: ASSET_MOCK_SESSION };
  }
  if (method === 'get' && url.includes('/auth/profile')) {
    return ok(ASSET_MOCK_ADMIN, config);
  }
  if (method === 'post' && url.includes('/auth/logout')) {
    return ok({ success: true }, config);
  }
  if (method === 'put' && url.includes('/auth/profile')) {
    return ok(ASSET_MOCK_ADMIN, config);
  }
  if (method === 'post' && url.includes('/auth/change-password')) {
    return ok({ success: true }, config);
  }

  // ── Admin stats ───────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/stats')) {
    return ok(ASSET_MOCK_STATS, config);
  }
  if (method === 'get' && url.includes('/admin/blacklist/entrepreneurs')) {
    return ok(paginate(ASSET_MOCK_BLOCKED_ENTREPRENEURS), config);
  }
  if (method === 'post' && url.includes('/admin/blacklist/entrepreneurs') && url.includes('/unblock')) {
    return ok({ success: true, message: 'Entrepreneur unblocked' }, config);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/users')) {
    return ok(paginate(ASSET_MOCK_USERS), config);
  }
  if (method === 'get' && /\/users\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    return ok(ASSET_MOCK_USERS.find((u) => u.id === id) ?? ASSET_MOCK_USERS[0], config);
  }
  if ((method === 'put' || method === 'patch') && url.includes('/users/')) {
    return ok(ASSET_MOCK_USERS[0], config);
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
    return ok(ASSET_MOCK_INVESTMENTS.slice(0, 2), config);
  }
  if (method === 'get' && url.includes('/documents')) {
    return ok([], config);
  }
  if (method === 'post' && url.includes('/kyc')) {
    return ok({ success: true }, config);
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/projects')) {
    return ok(paginate(ASSET_MOCK_PROJECTS), config);
  }
  if (method === 'get' && url.includes('/projects/featured')) {
    return ok(ASSET_MOCK_PROJECTS.slice(0, 2), config);
  }
  if (method === 'get' && url.includes('/projects/categories')) {
    return ok(['tech', 'energy', 'agri', 'health', 'edu', 'realestate'], config);
  }
  if (method === 'get' && /\/projects\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    return ok(ASSET_MOCK_PROJECTS.find((p) => p.id === id) ?? ASSET_MOCK_PROJECTS[0], config);
  }
  if (method === 'get' && url.includes('/stats') && url.includes('/projects/')) {
    return ok({ investorsCount: 12, totalRaised: 65000, viewsCount: 340 }, config);
  }
  if (method === 'post' && url.includes('/projects')) {
    return ok(ASSET_MOCK_PROJECTS[0], config);
  }
  if (method === 'put' && url.includes('/projects/')) {
    return ok(ASSET_MOCK_PROJECTS[0], config);
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
    return ok(paginate(ASSET_MOCK_INVESTMENTS), config);
  }
  if (method === 'get' && /\/investments\/[^/]+$/.test(url)) {
    const id = url.split('/').pop();
    return ok(ASSET_MOCK_INVESTMENTS.find((i) => i.id === id) ?? ASSET_MOCK_INVESTMENTS[0], config);
  }

  // ── Payments ──────────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/admin/payments')) {
    return ok(paginate(ASSET_MOCK_PAYMENTS), config);
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  if (method === 'get' && url.includes('/notifications/unread-count')) {
    return ok({ count: ASSET_MOCK_NOTIFICATIONS.filter((notification) => !notification.isRead).length }, config);
  }
  if (method === 'get' && url.includes('/notifications/settings')) {
    return ok({}, config);
  }
  if (method === 'get' && url.includes('/notifications')) {
    return ok(ASSET_MOCK_NOTIFICATIONS, config);
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
