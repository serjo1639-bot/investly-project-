# File Reference

A one-line description of **every source file** in the two frontends, plus how
the backend and database fit in. For deeper admin write-ups see
[`admin-dashboard/docs/CODEBASE_EXPLAINED.md`](../admin-dashboard/docs/CODEBASE_EXPLAINED.md);
for mobile architecture see the other docs in this folder.

---

# 📱 Mobile app (`myApp`)

## Root

| File | Description |
|------|-------------|
| `App.js` | Root component — provider tree: GestureHandler → SafeArea → Query → Theme → Toast → RootNavigator |
| `index.js` | Expo entry point (`registerRootComponent`) |
| `app.json` | Expo config: name, icons, splash, and `extra.apiBaseUrl` / `extra.useMockApi` |
| `babel.config.js` | Babel config (`babel-preset-expo`) |

## `src/api` — networking layer

| File | Description |
|------|-------------|
| `client.js` | Axios instance + interceptors: attaches the token, unwraps the response envelope, and runs the 401 refresh queue |
| `endpoints.js` | Every backend path in one map (1:1 with the controllers) |
| `normalizers.js` | Maps bilingual backend DTOs → the app's flat, single-language model |
| `authApi.js` | Auth calls (login, register, OTP, reset, refresh, profile) |
| `projectsApi.js` | Project calls (list, featured, categories, detail, create/update, views, stats) |
| `investmentsApi.js` | Investments + wallet (checkout, mine, wallet, topup, withdraw, redeem) |
| `paymentsApi.js` | Payments (initiate, verify, methods, history, status, refund) |
| `notificationsApi.js` | Notifications (list, unread count, read, settings) |
| `ownersApi.js` | Owner dashboard (projects, stats, dashboard) |
| `usersApi.js` | Users + KYC (profile, kyc, documents, investments) |
| `mediaApi.js` | Multipart file upload (relabels HEIC/HEIF → JPEG) |
| `index.js` | Barrel export for the API modules |

## `src/components/ui` — UI primitives

| File | Description |
|------|-------------|
| `Text.js` | Themed text (typography `variant` + semantic `color`) |
| `Button.js` | Action button (variants/sizes, loading, icon) |
| `Input.js` | Themed text field (label, icon, error, password toggle) |
| `Card.js` | Elevated surface, optionally pressable |
| `Badge.js` | Status pill (auto-tones from a backend status) |
| `Avatar.js` | Circular image with initials fallback |
| `Chip.js` | Selectable pill (filters, toggles) |
| `Divider.js` | Separator line |
| `ProgressBar.js` | Animated 0–100 progress bar |
| `IconButton.js` | Round icon-only button (optional badge) |
| `Logo.js` | SVG brand mark + optional wordmark |
| `PressableScale.js` | Spring-on-press wrapper |
| `SectionHeader.js` | Row title + optional "See all" action |
| `StatTile.js` | Metric tile (icon, value, label, tone) |
| `ListRow.js` | Settings/menu row (icon, title, value, chevron) |
| `HeroBackground.js` | Branded banner: photo + gradient scrim + content |

## `src/components/feedback`

| File | Description |
|------|-------------|
| `Skeleton.js` | Shimmering loading placeholders (`Skeleton`, `SkeletonText`, `SkeletonCard`) |
| `EmptyState.js` | "Nothing here" placeholder with optional action |
| `ErrorState.js` | Standardized error + retry (reads `ApiError.message`) |
| `Spinner.js` | Centered loading indicator |
| `Toast.js` | Global toast provider + imperative `toast.success/error/info` |

## `src/components/project` & barrel

| File | Description |
|------|-------------|
| `project/ProjectCard.js` | Project tile (`full` / `wide` layouts) |
| `project/FundingProgress.js` | Animated raised/goal/percentage bar |
| `index.js` | Barrel export for the whole UI kit |

## `src/layouts`

| File | Description |
|------|-------------|
| `ScreenContainer.js` | Base screen wrapper: safe area, themed bg, status bar, scroll, keyboard avoidance |
| `AppHeader.js` | Screen header (title/subtitle, back button, right action) |

## `src/navigation`

| File | Description |
|------|-------------|
| `routes.js` | Central registry of route names |
| `RootNavigator.js` | Auth gate: splash → AuthStack or AppStack (+ mounts AppDrawer) |
| `AuthStack.js` | Login · Register · ForgotPassword · VerifyCode · ResetPassword |
| `AppStack.js` | MainTabs + all pushed detail/form/info screens |
| `MainTabs.js` | Role-aware floating bottom-tab bar |
| `AppDrawer.js` | Global animated slide-in side drawer (overlay) |
| `navigationRef.js` | Container-level navigation ref (lets the drawer navigate) |

## `src/screens/auth`

| File | Description |
|------|-------------|
| `LoginScreen.js` | Sign in by email or phone (branded hero) |
| `RegisterScreen.js` | Create an Investor / Project-Manager account |
| `ForgotPasswordScreen.js` | Request a reset code by email |
| `VerifyCodeScreen.js` | Enter the 6-digit reset/OTP code |
| `ResetPasswordScreen.js` | Set a new password |
| `AuthHero.js` | Shared branded header for the secondary auth screens |

## `src/screens/investor`

| File | Description |
|------|-------------|
| `HomeScreen.js` | Greeting, wallet card, categories, featured carousel |
| `ProjectsScreen.js` | Searchable, filterable, infinite project list |
| `ProjectDetailScreen.js` | Project detail + invest CTA |
| `CheckoutScreen.js` | Choose amount + method and confirm an investment |
| `WalletScreen.js` | Balance, quick actions, transaction history |
| `TopupScreen.js` | Top up the wallet / redeem a code |
| `WithdrawScreen.js` | Withdraw from the wallet |
| `MyInvestmentsScreen.js` | The user's portfolio |
| `PaymentsScreen.js` | Payment history |
| `NotificationsScreen.js` | Notification list (read/unread styling) |
| `NotificationDetailScreen.js` | Full notification view; marks read on open |

## `src/screens/owner`

| File | Description |
|------|-------------|
| `OwnerDashboardScreen.js` | Project-Manager metrics, CTA, project preview |
| `MyProjectsScreen.js` | The owner's projects with funding progress |
| `CreateProjectScreen.js` | Create/edit a project (cover upload) |
| `ProjectStatsScreen.js` | A project's stats for its owner |

## `src/screens/shared`

| File | Description |
|------|-------------|
| `AccountScreen.js` | Profile hero (avatar, role, wallet balance), settings menu, drawer trigger |
| `EditAccountScreen.js` | Edit profile fields |
| `KycScreen.js` | Upload an ID document for verification |
| `ChangePasswordScreen.js` | Change the account password |
| `SettingsScreen.js` | Theme mode + language preferences |

## `src/screens/info`

| File | Description |
|------|-------------|
| `InfoScreenLayout.js` | Shared scaffold for static content screens |
| `AboutScreen.js` | Rich About page (org/platform/services/goals; `focus` param) |
| `FaqScreen.js` | Help & FAQ |
| `ContactScreen.js` | Contact channels |
| `PrivacyScreen.js` | Privacy policy summary |
| `TermsScreen.js` | Terms of service summary |

## `src/hooks`, `src/store`, `src/context`

| File | Description |
|------|-------------|
| `hooks/useAuth.js` | Login/register/logout mutations + session helpers |
| `hooks/useProfile.js` | Profile fetch/update, change password |
| `hooks/useProjects.js` | List (infinite), featured, categories, detail, save |
| `hooks/useInvestments.js` | Portfolio + checkout |
| `hooks/useWallet.js` | Balance + topup/withdraw/redeem |
| `hooks/usePayments.js` | Payment methods + history |
| `hooks/useNotifications.js` | List, unread count, mark read (optimistic) |
| `hooks/useOwner.js` | Owner dashboard/projects/stats |
| `hooks/useTheme.js` | Read the active theme from context |
| `hooks/useDebounce.js` | Debounce a value (search input) |
| `store/authStore.js` | Zustand: session, tokens, hydrate, isAuthenticated |
| `store/uiStore.js` | Zustand: theme mode, language, drawer open state |
| `context/ThemeProvider.js` | Resolves + provides the active theme |
| `context/QueryProvider.js` | React Query client provider |

## `src/services`, `src/utils`, `src/constants`, others

| File | Description |
|------|-------------|
| `services/storage.js` | AsyncStorage wrapper (non-secret prefs) |
| `services/secureStore.js` | `expo-secure-store` wrapper (encrypted tokens) |
| `services/tokenManager.js` | Holds/refreshes the active token for the client |
| `utils/format.js` | Currency, numbers, dates, relative time, `formatDateTime` |
| `utils/validation.js` | react-hook-form validation rules |
| `utils/errors.js` | `ApiError` + error normalization |
| `utils/logger.js` | Lightweight dev logger |
| `constants/config.js` | Reads `app.json` extra (base URL, mock flag, storage keys) |
| `constants/enums.js` | Mirrors backend enums (roles, statuses, KYC) |
| `constants/queryKeys.js` | Centralized React Query keys |
| `constants/images.js` | Registry of bundled hero images (`IMAGES.*`) |
| `theme/tokens.js` | Design tokens (colors/spacing/radii/typography/shadows/gradients) |
| `types/index.js` | JSDoc `@typedef`s for the app's data model |
| `i18n/index.js` | i18next setup — Arabic (default, RTL) + English |

---

# 🖥️ Admin dashboard (`admin-dashboard`)

Next.js App Router. Each `app/**/page.tsx` is a route.

## `src/app` — routes

| File | Route | Description |
|------|-------|-------------|
| `layout.tsx` | — | Root layout (fonts, AuthProvider, global CSS) |
| `page.tsx` | `/` | Entry — redirects to dashboard or login |
| `login/page.tsx` | `/login` | Admin sign-in |
| `dashboard/page.tsx` | `/dashboard` | Stats cards, charts, recent activity |
| `projects/page.tsx` | `/projects` | Project management list + New Project modal |
| `projects/[id]/page.tsx` | `/projects/:id` | Project detail / approve / reject |
| `projects/pending/page.tsx` | `/projects/pending` | Pending-review approval queue |
| `users/page.tsx` | `/users` | User management list |
| `users/[id]/page.tsx` | `/users/:id` | User detail / ban / suspend / KYC |
| `investments/page.tsx` | `/investments` | Investments list |
| `payments/page.tsx` | `/payments` | Payments list / approve / reject / refund |
| `wallets/page.tsx` | `/wallets` | Wallets overview + credit/transfer |
| `notifications/page.tsx` | `/notifications` | Notifications + broadcast sender |
| `activity/page.tsx` | `/activity` | Admin activity log |
| `activity/admin/[adminId]/page.tsx` | `/activity/admin/:id` | One admin's activity |
| `admins/page.tsx` | `/admins` | Admin accounts |
| `settings/page.tsx` | `/settings` | Dashboard settings |

## `src/components`

| File | Description |
|------|-------------|
| `auth/ProtectedRoute.tsx` | Redirects unauthenticated users to `/login` |
| `layout/DashboardLayout.tsx` | Page shell (Sidebar + Header + content) |
| `layout/Sidebar.tsx` | Left navigation |
| `layout/Header.tsx` | Top bar (title, profile, actions) |
| `dashboard/StatsCard.tsx` | Headline metric card |
| `dashboard/RecentActivity.tsx` | Recent activity feed |
| `dashboard/UserGrowthChart.tsx` | Investors vs owners per month (bar) |
| `dashboard/RevenueChart.tsx` | Revenue / investments per month |
| `dashboard/ProjectStatusChart.tsx` | Project status distribution (donut) |
| `projects/NewProjectModal.tsx` | Create-project form modal |
| `ui/Button.tsx` | Button (variants, sizes, loading, icon) |
| `ui/Input.tsx` | Input + `SearchInput` |
| `ui/Select.tsx` | Styled select |
| `ui/Card.tsx` | Surface container |
| `ui/Badge.tsx` | `StatusBadge` status pill |
| `ui/Avatar.tsx` | User avatar |
| `ui/Table.tsx` | `Table` + `Pagination` |
| `ui/Modal.tsx` | `Modal` + `ConfirmDialog` |

## `src/lib`, `src/contexts`, `src/types`

| File | Description |
|------|-------------|
| `lib/api/config.ts` | Axios client, token injection, 401 → redirect, mock toggle |
| `lib/api/auth.ts` | Login, profile, refresh, logout, change password |
| `lib/api/projects.ts` | Project CRUD + approve/reject + stats/categories |
| `lib/api/users.ts` | User list/detail, ban/suspend, KYC approve/reject |
| `lib/api/investments.ts` | Investments list/detail, checkout, redeem |
| `lib/api/admin.ts` | Stats, charts, activity, payments, wallets, broadcast, media |
| `lib/api/notifications.ts` | Notifications list/read/settings |
| `lib/api/mock.ts` | Mock adapter for offline/demo mode |
| `lib/utils.ts` | Formatters + `extractError` + label helpers |
| `contexts/AuthContext.tsx` | Auth session/state for the dashboard |
| `types/index.ts` | All TypeScript interfaces (User, Project, …) |

---

# 🛠️ Backend (`investly_backendproject`) & database

The ASP.NET backend code is **not part of this repository** — it lives in the
`investly_backendproject` solution. Its API surface is fully documented in
[api-endpoints.md](api-endpoints.md), and its data model is mirrored by the SQL
in `database/`:

| File | Description |
|------|-------------|
| `database/schema.sql` | All table definitions (15 tables — see [system-integration.md](system-integration.md)) |
| `database/views.sql` | Reporting/aggregation views |
| `database/stored_procedures.sql` | Stored procedures used by the backend |
| `database/seed.sql` | Seed data (test accounts, categories, sample projects) |
| `database/explain_database/` | Human-readable explanation of the schema & relations |
