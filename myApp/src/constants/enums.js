/**
 * enums.js — Mirrors the backend enums (Models/Enums/Enums.cs) exactly.
 * Values are the lowercase strings the API serializes/expects.
 * Keeping these in one place avoids magic strings scattered across screens.
 */

export const UserRole = Object.freeze({
  INVESTOR: 'investor',
  OWNER: 'owner',
  ADMIN: 'admin',
  GUEST: 'guest',
});

export const UserStatus = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
});

export const KycStatus = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const Gender = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

export const WalletStatus = Object.freeze({
  ACTIVE: 'active',
  FROZEN: 'frozen',
  INACTIVE: 'inactive',
});

export const WalletTransactionType = Object.freeze({
  CREDIT: 'credit',
  DEBIT: 'debit',
});

export const ProjectStatus = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INACTIVE: 'inactive',
  REJECTED: 'rejected',
});

export const InvestmentStatus = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

export const PaymentMethod = Object.freeze({
  WALLET: 'wallet',
  CREDIT_CARD: 'credit_card',
});

export const PaymentStatus = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

export const NotificationType = Object.freeze({
  INVESTMENT: 'investment',
  PROJECT: 'project',
  SYSTEM: 'system',
  USER: 'user',
});

export const OtpPurpose = Object.freeze({
  LOGIN: 'login',
  REGISTER: 'register',
  RESET: 'reset',
});

/** Semantic color "tone" for a given status — consumed by <Badge tone=...>. */
export const STATUS_TONE = Object.freeze({
  active: 'success',
  completed: 'success',
  approved: 'success',
  pending: 'warning',
  inactive: 'neutral',
  none: 'neutral',
  failed: 'danger',
  rejected: 'danger',
  banned: 'danger',
  suspended: 'danger',
  frozen: 'danger',
  cancelled: 'danger',
  refunded: 'info',
});
