/**
 * Central type definitions for the Investly admin dashboard.
 *
 * TypeScript "types" and "interfaces" describe the shape of data objects.
 * Think of them as contracts — any variable that claims to be a `User` must
 * have at least the fields listed in the User interface below.
 *
 * Fields marked with `?` are optional (may be undefined / missing).
 */

// ─── User Types ────────────────────────────────────────────────────────────────

// A union type: the variable can only hold one of these exact string values.
export type UserRole = 'investor' | 'owner' | 'admin' | 'guest';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';
export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  age?: number | null;
  gender?: Gender | null;
  location?: string | null;
  passportUrl?: string | null;
  status?: UserStatus;
  memberId?: string;
  walletBalance?: number;
  totalTopups?: number;
  contributionTotal?: number;
  contributionsCount?: number;
  projectsCount?: number;
  companyName?: string | null;
  bio?: string | null;
  token?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  avatar?: string | null;
}

// ─── Project Types ──────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'pending' | 'completed' | 'inactive' | 'rejected';
export type ProjectCategory = 'tech' | 'energy' | 'agri' | 'health' | 'edu' | 'realestate';

export interface Project {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  category: ProjectCategory;
  categoryAr?: string;
  categoryEn?: string;
  cityAr?: string;
  cityEn?: string;
  image?: string | null;
  goal: number;
  raised: number;
  minInvestment: number;
  maxInvestment?: number;
  currencyCode?: string;
  status: ProjectStatus;
  reference?: string;
  ownerId?: string;
  ownerName?: string;
  ownerCompanyName?: string | null;
  progress?: number;
  duration?: number;
  startDate?: string;
  endDate?: string;
  teamSize?: number;
  website?: string | null;
  founderName?: string;
  founderEmail?: string;
  founderPhone?: string;
  investorsCount?: number;
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Investment Types ───────────────────────────────────────────────────────────

export type InvestmentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'wallet' | 'credit_card' | 'recharge_card';

export interface Investment {
  id: string;
  projectId: string;
  projectTitle?: string;
  reference?: string;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  status: InvestmentStatus;
  investorId?: string;
  investorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Payment Types ──────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  amount: number;
  currency?: string;
  method?: string;
  status: PaymentStatus;
  userId?: string;
  userName?: string;
  userPhone?: string;
  investmentId?: string | null;
  transactionId?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  notes?: string;
}

// ─── Wallet Types ───────────────────────────────────────────────────────────────

export interface WalletRecord {
  walletId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lastActivity?: string;
  status: 'active' | 'frozen' | 'inactive';
}

export interface WalletTransaction {
  id: string;
  userId: string;
  userName?: string;
  type: 'credit' | 'debit';
  amount: number;
  currency?: string;
  titleAr: string;
  titleEn: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  reference?: string;
  date: string;
  createdAt?: string;
  adminNote?: string;
}

// ─── Category Types ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
}

// ─── Notification Types ─────────────────────────────────────────────────────────

export type NotificationType = 'investment' | 'project' | 'system' | 'user';

export interface Notification {
  id: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  createdAt: string;
  targetUserId?: string | null;
  sentBy?: string | null;
  // isRead is NOT on the notification itself — it comes from user_notification_reads
  isRead?: boolean;
  readAt?: string | null;
}

// Join table: one row per user-notification pair (tracks read state)
export interface UserNotificationRead {
  id: string;
  notificationId: string;
  userId: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalProjects: number;
  activeProjects: number;
  pendingProjects: number;
  completedProjects: number;
  totalInvestments: number;
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
}

// ─── API Types ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

// ─── Chart Data Types ───────────────────────────────────────────────────────────

export interface MonthlyUserPoint {
  month: string;
  investors: number;
  owners: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  investments: number;
}

export interface ProjectStatusBreakdown {
  active: number;
  pending: number;
  completed: number;
  inactive: number;
  rejected: number;
}

export interface ChartData {
  userGrowth: MonthlyUserPoint[];
  revenue: MonthlyRevenuePoint[];
  projectStatus: ProjectStatusBreakdown;
}

export interface RecentActivityItem {
  id: string;
  type: 'investment' | 'registration' | 'project' | 'payment';
  userName: string;
  action: string;
  projectTitle?: string | null;
  amount?: number | null;
  date: string;
  status?: string | null;
}
