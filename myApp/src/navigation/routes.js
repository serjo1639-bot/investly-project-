/** routes.js — Central registry of route names (no magic strings in screens). */
export const ROUTES = {
  // Auth stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  VERIFY_CODE: 'VerifyCode',
  RESET_PASSWORD: 'ResetPassword',

  // Tabs
  HOME_TAB: 'HomeTab',
  PROJECTS_TAB: 'ProjectsTab',
  WALLET_TAB: 'WalletTab',
  NOTIFICATIONS_TAB: 'NotificationsTab',
  ACCOUNT_TAB: 'AccountTab',
  DASHBOARD_TAB: 'DashboardTab',

  // Shared stack screens
  HOME: 'Home',
  PROJECTS: 'Projects',
  PROJECT_DETAIL: 'ProjectDetail',
  CHECKOUT: 'Checkout',
  WALLET: 'Wallet',
  TOPUP: 'Topup',
  WITHDRAW: 'Withdraw',
  PAYMENTS: 'Payments',
  MY_INVESTMENTS: 'MyInvestments',
  NOTIFICATIONS: 'Notifications',
  NOTIFICATION_DETAIL: 'NotificationDetail',
  ACCOUNT: 'Account',
  EDIT_ACCOUNT: 'EditAccount',
  KYC: 'Kyc',
  CHANGE_PASSWORD: 'ChangePassword',
  SETTINGS: 'Settings',

  // Owner
  OWNER_DASHBOARD: 'OwnerDashboard',
  MY_PROJECTS: 'MyProjects',
  CREATE_PROJECT: 'CreateProject',
  PROJECT_STATS: 'ProjectStats',

  // Info
  ABOUT: 'About',
  CONTACT: 'Contact',
  FAQ: 'Faq',
  PRIVACY: 'Privacy',
  TERMS: 'Terms',
};
