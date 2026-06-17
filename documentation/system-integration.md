# System Integration

How the three parts of Investly fit together, share data, and authenticate.

## The three parts

```
┌─────────────────────┐        ┌─────────────────────┐
│   Mobile app 📱      │        │  Admin dashboard 🖥️  │
│  React Native/Expo  │        │      Next.js        │
│  Investors &        │        │   Web admin panel   │
│  Project Managers   │        │                     │
└──────────┬──────────┘        └──────────┬──────────┘
           │  HTTPS / JSON (Bearer token)  │
           └───────────────┬───────────────┘
                           ▼
                ┌────────────────────┐
                │   Backend API 🛠️    │
                │  ASP.NET / .NET 8  │
                │ investly_backend…  │
                └─────────┬──────────┘
                          ▼
                ┌────────────────────┐
                │   PostgreSQL DB    │
                │  (database/*.sql)  │
                └────────────────────┘
```

Both frontends talk **only** to the backend REST API — they never touch the
database directly. The database schema (`database/schema.sql`) is the shared
source of truth the backend exposes.

## Base URLs & config

| App | Where the base URL is set | Default |
|-----|---------------------------|---------|
| Mobile | `app.json → expo.extra.apiBaseUrl` (read via `src/constants/config.js`) | `http://10.0.2.2:5231/api` (Android emulator) |
| Admin | `NEXT_PUBLIC_API_BASE_URL` env (`src/lib/api/config.ts`) | `http://localhost:5231/api` |
| Backend | `appsettings.json` connection string | `Host=localhost;…;Database=InvestlyDB` |

Both clients support a **mock mode** for running without a backend:
- Mobile: `app.json → expo.extra.useMockApi`.
- Admin: `NEXT_PUBLIC_MOCK_MODE=true` (swaps in `src/lib/api/mock.ts`).

## Response envelope

The backend wraps most responses as:

```json
{ "success": true, "data": { /* … */ }, "message": null }
```

- **Mobile** unwraps `data` in `src/api/client.js` (and normalizes shapes — see
  below).
- **Admin** unwraps `response.data.data ?? response.data` per call.

Paginated lists arrive as `{ items, totalCount, page, pageSize, totalPages }`
and are mapped to a consistent `{ data, total, page, pageSize, totalPages }`.

## Authentication & token flow

Both clients use **JWT access + refresh tokens**.

```
login → { user, accessToken, refreshToken }
   │
   ├── access token attached as `Authorization: Bearer …` on every request
   │
   └── on 401 (expired):
         mobile → client.js refresh queue calls POST /auth/refresh-token,
                  retries the original request; on failure → force logout
         admin  → config.ts clears storage and redirects to /login
```

| Concern | Mobile 📱 | Admin 🖥️ |
|---------|-----------|----------|
| Token storage | `expo-secure-store` (encrypted keystore) | `localStorage` (`admin_token`, `admin_refresh_token`, `admin_user`) |
| Session state | Zustand `authStore` | React Context `AuthContext` |
| Refresh on 401 | Automatic, with a request queue | Redirect to login |
| Auth gate | `RootNavigator` (state-derived) | `ProtectedRoute` wrapper |

Roles: `investor`, `owner` (Project Manager), `admin`. The mobile app serves
investors and owners; the dashboard is admin-only.

## Bilingual data & normalization

The backend stores **bilingual** fields (`titleAr`/`titleEn`,
`messageAr`/`messageEn`, …) and backend-style names (`goal`, `raised`,
`imageUrl`, `isFeatured`).

- **Mobile** flattens this to a single-language, simpler model in
  `src/api/normalizers.js` (e.g. `goal → goalAmount`, `imageUrl → coverUrl`),
  picking the active language via i18n. Screens never see the raw shape.
- **Admin** works with the raw bilingual `Project`/`User`/… types
  (`src/types/index.ts`) and renders the English field directly.

## Example data flow — investing

```
Investor taps "Invest" (ProjectDetail → Checkout)
  → useCheckout() → investmentsApi.checkout()
  → POST /investments/checkout    (Bearer token)
  → backend: debit wallet, create investment + payment, update project.raised
  → response unwrapped + React Query invalidates wallet/investments/project
  → Wallet balance, My Investments and the project funding bar all refresh
```

The same investment then appears to the admin via `GET /admin/investments` and
affects `GET /admin/stats`.

## Database tables (source of truth)

Defined in `database/schema.sql` (+ `views.sql`, `stored_procedures.sql`,
`seed.sql`):

`users` · `wallets` · `categories` · `projects` · `investments` · `payments` ·
`wallet_transactions` · `notifications` · `user_notification_reads` ·
`notification_settings` · `refresh_tokens` · `otp_codes` ·
`password_reset_codes` · `media` · `activity_logs`

Notable design points:
- Notification **read state** is a join table (`user_notification_reads`), so one
  broadcast notification can be read independently per user.
- `refresh_tokens`, `otp_codes` and `password_reset_codes` back the auth flows.
- `media` stores uploaded files (project covers, KYC documents); `activity_logs`
  backs the admin audit trail.

See the [API endpoint reference](api-endpoints.md) for the exact routes each
table is exposed through.
