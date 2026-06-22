# Investly — Crowdfunding Platform

Bilingual (AR/EN) crowdfunding platform. 3 apps sharing 1 ASP.NET Core backend.

## Project Structure

```
investly-project-/
├── investly_Backend_Complete/   # ASP.NET Core 8 Web API
│   ├── Controllers/             # API endpoints (8 files)
│   ├── Services/                # Business logic (9 files)
│   ├── Interfaces/              # Service contracts (9 files)
│   ├── Models/                  # EF Core entities (20 files)
│   ├── DTOs/                    # Request/response shapes (8 files)
│   ├── Data/AppDbContext.cs     # EF Core DbContext
│   ├── Middleware/              # ExceptionMiddleware
│   ├── Hubs/NotificationHub.cs  # SignalR real-time
│   └── Program.cs               # Startup / DI / pipeline
├── admin-dashboard/             # Next.js 16 (App Router) admin panel
│   └── src/
│       ├── app/                 # Pages (13 route groups)
│       ├── components/          # layout/, auth/, dashboard/, ui/
│       ├── contexts/AuthContext.tsx
│       ├── lib/api/             # config.ts, auth.ts, users.ts, projects.ts, admin.ts, investments.ts, notifications.ts
│       └── types/index.ts
├── myApp/                       # React Native Expo mobile app (SDK 54)
│   ├── Component/               # 27 screens + navigator
│   ├── hooks/                   # useAuth, useCart, useTopPopup
│   ├── services/                # api.js, backendConfig.js, session.js, authEvents.js
│   ├── constants/theme.js       # Design tokens
│   └── i18n/index.js            # AR + EN translations
└── database/
    └── Investly_Schema_Grad_Core.sql  # Full SQL schema + stored procs + views
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | ASP.NET Core 8, EF Core 8, SQL Server, JWT Bearer, SignalR, Swagger, BCrypt |
| Admin UI | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Axios, Recharts, React Hook Form + Zod, Lucide React |
| Mobile | React Native 0.81, Expo SDK 54, JS (ES2022), i18next, Custom Navigation (no React Nav), AsyncStorage, Context API |

## Key Conventions

### Backend (C# / ASP.NET Core)

- **Namespace**: `Investly_Backend.{Controllers|Services|Models|DTOs|Data|Middleware|Hubs}`
- **DI lifetime**: Services are `AddScoped` (1 instance per request). `EmailService` is `AddSingleton`.
- **Controller pattern**: `[ApiController]`, `[Route("api/[controller]")]`, constructor injection of service interface.
- **Service pattern**: Interface in `Interfaces/`, implementation in `Services/`. Method names: async suffix (`GetAllAsync`).
- **DTOs**: Separate from models. Never expose `PasswordHash` or navigation properties to clients.
- **Auth**: JWT with `ClaimTypes.NameIdentifier` for user ID, `ClaimTypes.Role` for roles. Token in `Authorization: Bearer` header.
- **ID extraction**: Each controller has a private `GetUserIdFromClaims()` helper that reads `User.FindFirst(ClaimTypes.NameIdentifier)`.
- **Pagination**: `PaginatedResult<T>` with `Items`, `TotalCount`, `Page`, `PageSize`.
- **API response wrapper**: `ApiResponse<T>` with `Success`, `Message`, `Data`, `Errors`.
- **Error handling**: `ExceptionMiddleware` catches unhandled exceptions → JSON response with status mapping (401, 404, 400, 500).
- **Project lifecycle**: `Draft -> Pending -> Approved -> Funded -> Closed` (+ Rejected). Escrow wallet created on approval.
- **Investment flow**: Create (Pending, wallet deducted + locked) → Confirm (locked removed, project funded) → Cancel (refund).
- **Wallet**: Balance - LockedAmount = AvailableBalance. Withdrawals lock funds, admin must approve/reject to unlock.
- **Soft delete**: User `IsActive` flag. Not actually deleted.
- **DB**: `EnsureCreated()` in dev (not migrations). Full SQL schema in `/database/Investly_Schema_Grad_Core.sql` with SPs for money ops.

### Admin Dashboard (Next.js / TypeScript)

- **Routing**: App Router (`src/app/{route}/page.tsx`). 13 routes: login, dashboard, users (list + [id]), projects (list + pending + [id]), investments, payments, notifications, admins, activity (list + admin/[adminId]), settings.
- **Styling**: Tailwind CSS 4 with CSS-variable `@theme` block in `globals.css`. No CSS modules.
- **API layer**: Axios instance in `config.ts` with JWT interceptor + 401 redirect. Per-resource modules (`users.ts`, `projects.ts`, etc.).
- **Auth**: `AuthContext` reads `localStorage` (`admin_token`, `admin_user`). `ProtectedRoute` redirects to `/login`.
- **Mock mode**: `NEXT_PUBLIC_MOCK_MODE=true` uses `mockAdapter`. Falls back to mock data on API failure.
- **Types**: All interfaces in `src/types/index.ts`. Key types: `User`, `Project`, `Investment`, `Payment`, `Notification`, `DashboardStats`.
- **State**: React Context (`AuthContext`). No Redux/Zustand.
- **Charts**: Recharts (area, bar, pie/donut).
- **Forms**: React Hook Form + Zod for login validation.
- **Login response shape**: `{ data: { token, refreshToken, user: { id, name, email, role } } }`. Must check `role === "admin"`.

### Mobile App (React Native / Expo)

- **Navigation**: Custom navigator in `AppNavigator.js` (no React Navigation). Uses `currentScreen` state + `stack` array for `goBack()`. Three Animated values for transitions: `slideAnim`, `fadeAnim`, `scaleAnim`.
- **State management**: React Context API (`AuthProvider`, `CartProvider`, `TopPopupProvider`).
- **Auth**: `useAuth.js` manages login (OTP, email, password, simple), register, logout, session persistence (AsyncStorage), and 401 handler.
- **API dual mode**: Every function checks `if (shouldUseMock())` — mock returns local data with `delay(400)`, real calls `apiRequest()`. Toggle via `EXPO_PUBLIC_USE_MOCK_API` env var.
- **Data normalization**: `normalizeProject()` handles `camelCase`, `snake_case`, and mixed field names from any server.
- **i18n**: i18next with AR + EN translations. Default language: Arabic. No auto-RTL — components check `i18n.language === 'ar'` and adjust flexDirection/textAlign manually.
- **Design tokens**: `constants/theme.js` — Colors, spacing (xs-xxxl), responsive scaling (`scale`, `verticalScale`, `moderateScale`, `responsiveFont`), shadows, radius.
- **Cart**: In-memory (`useCart.js`). Items clamped to `minInvestment`. Not persisted across restarts.
- **Toast/Popup**: `useTopPopup()` — `success/error/warning/info/confirm` methods. Custom animated overlay (spring slide + fade).
- **Image handling**: `resolveProjectImage()` — accepts number (require()), string (URI), or object. `getDefaultImage(id)` — deterministic pool selection.

### Database Schema Highlights

- **Users**: `user_id` (PK), email (unique), password_hash, names, national_id (unique), phone, `is_active`, `email_confirmed`
- **Roles**: `role_id`, `role_name` (User/Admin). Many-to-many via `UserRoles` join table.
- **Profiles**: `InvestorProfiles` (KYC with occupation, annual_income, id_document_url, kyc_status) and `EntrepreneurProfiles` (bank_account/name/name, company, bio, `is_verified`). A user can be both.
- **Wallets**: `UserWallets` (balance, locked_amount). One per user. `WalletTransactions` (audit ledger: type/direction/amount/status).
- **Projects**: `Projects` (creator_profile, category, funding_goal, min/max_investment, equity_offered, current_amount, start/end_date, status lifecycle). `ProjectEscrowWallets` holds investor funds.
- **Investments**: `Investments` (investor_profile, project, amount, status: Pending→Confirmed→Refunded). `EscrowTransactions` tracks escrow money flow.
- **Profit sharing**: `ProfitRecords` (period, net_profit, investor_share_pct). `DividendPayouts` per-investor distribution from SP `sp_DistributeProfits`.
- **Key SPs**: `sp_Deposit`, `sp_RequestWithdrawal`, `sp_CreateProject`, `sp_MakeInvestment`, `sp_ReleaseFundsToEntrepreneur`, `sp_RefundInvestment`, `sp_DistributeProfits`.
- **Key views**: `vw_InvestorDetails`, `vw_EntrepreneurProjects`, `vw_WalletSummary`, `vw_ProjectFunding`, `vw_MyInvestments`, `vw_ProjectInvestors`, `vw_EscrowSummary`.

### API Endpoints

**Auth** (prefix: `/api/auth`):
- `POST /login` — email + password → JWT
- `POST /register` — create user + wallet + User role
- `POST /change-password` — [Authorize]
- `GET /me` — [Authorize] current user profile

**Projects** (prefix: `/api/projects`):
- `GET /` — public list with pagination/filters
- `GET /featured` — top 10 by funding
- `GET /{id}` — single project detail
- `GET /categories` — category tree
- `POST /` — [Entrepreneur] create
- `PUT /{id}` — [Entrepreneur] update (owner only)
- `DELETE /{id}` — [Entrepreneur] delete (owner only)
- `POST /{id}/submit` — [Entrepreneur] Draft→Pending
- `POST /{id}/approve` — [Admin] Pending→Approved (creates escrow)
- `POST /{id}/reject` — [Admin] Pending→Rejected

**Investments** (prefix: `/api/investments`):
- `GET /my` — [Auth] user's investments
- `GET /{id}` — [Auth] single investment
- `POST /` — [Investor] create (Pending, deduct wallet)
- `POST /{id}/confirm` — [Investor] Pending→Confirmed (funds locked, project updated)
- `POST /{id}/cancel` — [Investor] Pending→Cancelled (refund wallet)
- `GET /portfolio/summary` — [Auth] portfolio stats

**Users** (prefix: `/api/users`):
- `GET /` — [Admin] paginated user list
- `GET /{id}` — [Auth] user detail
- `PUT /{id}` — [Auth] update profile (partial)
- `POST /{id}/deactivate` — [Admin] soft delete
- `POST /{id}/activate` — [Admin] restore
- `GET /{id}/wallet` — [Auth] wallet detail
- `POST /investor-profile` — create KYC profile
- `POST /entrepreneur-profile` — create entrepreneur profile
- `GET /investor-profile` — get own KYC
- `GET /entrepreneur-profile` — get own entrepreneur

**Wallet** (prefix: `/api/wallet`):
- `GET /` — [Auth] own wallet
- `POST /deposit` — add funds
- `POST /withdraw` — request withdrawal (admin approval needed)
- `GET /transactions` — transaction history

**Admin** (prefix: `/api/admin`, all [Admin]):
- `GET /dashboard` — platform stats
- `GET /users` — paginated user management list
- `GET /projects` — paginated project list
- `GET /kyc/pending` — KYC submissions
- `POST /kyc/{id}/approve`
- `POST /kyc/{id}/reject`

**Notifications** (prefix: `/api/notifications`):
- `GET /` — paginated list
- `GET /unread-count`
- `POST /mark-read` — mark specific IDs as read

### Build & Run Commands

```bash
# Backend (ASP.NET)
cd investly_Backend_Complete
dotnet build
dotnet run
# → http://localhost:5000  (swagger: /swagger)

# Admin Dashboard
cd admin-dashboard
npm install
npm run dev     # development → http://localhost:3000
npm run build   # production build
npm run lint    # ESLint

# Mobile App
cd myApp
npm install
npm start       # Expo dev server → scan QR
npm run android # Android emulator
npm run ios     # iOS simulator (Mac only)
```

### Environment Configuration

**Backend** (`appsettings.json`): Connection string (SQL Server), JWT key/issuer/audience, SMTP email settings, upload path.

**Admin Dashboard** (`.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_MOCK_MODE=false
```

**Mobile App** (`.env`):
```
EXPO_PUBLIC_USE_MOCK_API=true   # false to connect real backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
# Android emulator: http://10.0.2.2:5000/api
# Physical device:  http://<LAN-IP>:5000/api
```

### Shared Backend URLs

Both mobile app and admin dashboard connect to same backend. Mobile uses:
- `POST /auth/login` (phone+password) 
- `POST /auth/register`
- `GET /projects/featured`
- `GET /projects`, `GET /projects/{id}`
- `POST /investments/checkout`
- `GET /investments/wallet`
- `GET /users/{id}`, `PUT /users/{id}`
- `GET /notifications`
- `POST /notifications/{id}/read`, `POST /notifications/read-all`

Admin dashboard uses additionally:
- `GET /admin/*` (users, projects, stats, payments, activity-logs, kyc)
- `POST /admin/projects/{id}/approve`, `/reject`
- `POST /admin/users/{id}/ban`, `/suspend`, `/unsuspend`
- `POST /admin/notifications/send`

### Roles & Permissions

- **Roles system**: DB stores `User` (basic) and `Admin`. Services check for `investor`, `entrepreneur`, `admin` via different service methods.
- **Admin dashboard**: Blocks non-admin roles at login (`user.role === "admin"`).
- **Mobile roles**: `guest` (browse), `investor` (invest, cart, wallet), `owner` (create projects, dashboard).
- **RBAC on endpoints**: `[Authorize(Roles = "Admin")]`, `[Authorize(Roles = "Entrepreneur")]`, `[Authorize(Roles = "Investor")]`.

### Coding Guidelines for AI Agent

- Follow existing patterns: same namespaces, same DI registration style, same error handling approach.
- Backend: add DTOs in `DTOs/`, interface in `Interfaces/`, service in `Services/`, controller endpoint in `Controllers/`.
- Admin dashboard: add route page in `src/app/{route}/page.tsx`, API calls in `src/lib/api/{resource}.ts`, types in `src/types/index.ts`, components in `src/components/`.
- Mobile app: add screen in `Component/`, register in `AppNavigator.js` screens map, i18n keys in `i18n/index.js`, API calls in `services/api.js`.
- All mobile API functions must follow the dual mock/real pattern with `shouldUseMock()`.
- All admin dashboard API functions must handle mock fallback and 401 redirect.
- Never hardcode URLs or secrets. Use configuration / environment variables.
- Never expose `PasswordHash` or sensitive model properties in API responses.
- Wallet financial operations must create audit trail entries (`WalletTransaction`).
- All dates should use `DateTime.UtcNow` (not local time).
- All nullable reference types are enabled (`string?` for optional fields).
