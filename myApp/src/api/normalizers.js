/**
 * normalizers.js — Maps the backend DTO shapes onto the app's internal model
 * (see src/types). The backend is **bilingual** (TitleAr/TitleEn, …) and uses
 * names like `goal`, `raised`, `imageUrl`, `isFeatured`, `viewsCount`; the app
 * works with a single-language, simpler model (`title`, `goalAmount`,
 * `raisedAmount`, `coverUrl`, `featured`, `views`, …).
 *
 * Centralizing the mapping here means screens/components never deal with the
 * raw API shape, and a backend field rename only needs a change in one place.
 *
 * `pick(obj, 'Title')` returns the field for the active language, e.g.
 * `obj.titleAr` (Arabic) or `obj.titleEn` (English), with sensible fallbacks.
 */
import i18n from '../i18n';

const langSuffix = () => (i18n.language === 'ar' ? 'Ar' : 'En');

/** Pick a localized field: base + 'Ar'|'En', with fallbacks to either or base. */
function pick(obj, base) {
  if (!obj) return undefined;
  const lc = base.charAt(0).toLowerCase() + base.slice(1); // 'Title' → 'title'
  return (
    obj[`${lc}${langSuffix()}`] ??
    obj[`${lc}En`] ??
    obj[`${lc}Ar`] ??
    obj[lc] ??
    obj[base]
  );
}

export function normalizeUser(u) {
  if (!u) return u;
  return { ...u, avatarUrl: u.avatarUrl ?? u.avatar ?? null };
}

export function normalizeCategory(c) {
  if (!c) return c;
  return { id: c.id, name: pick(c, 'Name') ?? c.name, icon: c.icon };
}

export function normalizeProject(p) {
  if (!p) return p;
  return {
    id: p.id,
    title: pick(p, 'Title') ?? p.title,
    description: pick(p, 'Description') ?? p.description,
    summary: undefined, // backend has no summary; cards fall back to description
    coverUrl: p.imageUrl ?? p.coverUrl ?? null,
    categoryId: p.categoryId,
    categoryName: pick(p, 'Category'),
    status: p.status,
    goalAmount: Number(p.goal ?? p.goalAmount ?? 0),
    raisedAmount: Number(p.raised ?? p.raisedAmount ?? 0),
    minInvestment: Number(p.minInvestment ?? 0),
    maxInvestment: p.maxInvestment != null ? Number(p.maxInvestment) : undefined,
    investorsCount: p.investorsCount ?? 0,
    views: p.viewsCount ?? p.views ?? 0,
    featured: p.isFeatured ?? p.featured ?? false,
    progress: p.progress,
    ownerId: p.ownerId,
    ownerName: p.ownerName,
    ownerCompanyName: p.ownerCompanyName,
    deadline: p.endDate ?? p.deadline,
    createdAt: p.createdAt,
  };
}

export function normalizeInvestment(i) {
  if (!i) return i;
  return {
    id: i.id,
    projectId: i.projectId,
    projectTitle: pick(i, 'ProjectTitle') ?? i.projectTitle,
    projectImageUrl: i.projectImageUrl,
    amount: Number(i.amount ?? 0),
    status: i.status,
    method: i.paymentMethod ?? i.method,
    createdAt: i.createdAt,
  };
}

export function normalizeWallet(w) {
  if (!w) return w;
  return {
    id: w.id,
    balance: Number(w.balance ?? 0),
    currency: w.currencyCode ?? 'LYD',
    status: w.status,
    totalDeposits: w.totalDeposits,
    totalWithdrawals: w.totalWithdrawals,
  };
}

export function normalizePayment(p) {
  if (!p) return p;
  return {
    id: p.id,
    amount: Number(p.amount ?? 0),
    method: p.method,
    status: p.status,
    reference: p.transactionId ?? p.reference,
    createdAt: p.createdAt,
  };
}

export function normalizePaymentMethod(m) {
  if (!m) return m;
  return { id: m.id, name: pick(m, 'Name') ?? m.name, isAvailable: m.isAvailable !== false };
}

export function normalizeNotification(n) {
  if (!n) return n;
  return {
    id: n.id,
    type: n.type,
    title: pick(n, 'Title') ?? n.title,
    body: pick(n, 'Message') ?? n.message ?? n.body,
    isRead: n.isRead ?? false,
    createdAt: n.createdAt,
    // Optional metadata used by the notification detail screen — kept only when
    // the backend provides it (sender name, a deep link, or a related project).
    sender: pick(n, 'Sender') ?? n.senderName ?? n.sender ?? n.from ?? null,
    projectId: n.projectId ?? n.relatedProjectId ?? null,
    link: n.link ?? n.actionUrl ?? n.url ?? null,
  };
}

/** Map an array (tolerating null / non-array). */
export const mapArray = (data, fn) => (Array.isArray(data) ? data.map(fn) : []);
