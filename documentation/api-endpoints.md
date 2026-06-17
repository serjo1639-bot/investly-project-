# API Endpoint Reference

Every backend endpoint consumed by the two frontends, grouped by resource. Paths
are **relative to the API base URL** (which already includes `/api`, e.g.
`http://localhost:5231/api`).

- **Source of truth (mobile):** `myApp/src/api/endpoints.js`
- **Source of truth (admin):** `admin-dashboard/src/lib/api/*.ts`
- **Backend:** ASP.NET controllers in `investly_backendproject` (not in this
  repo; its data model is mirrored by `database/schema.sql`).

All authenticated requests send `Authorization: Bearer <accessToken>`. Most
responses use the envelope `{ success, data, message }` — both clients unwrap
`data` automatically.

Legend for **Client**: 📱 mobile app · 🖥️ admin dashboard.

## Auth — `/auth`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| POST | `/auth/login-email` | 📱 🖥️ | Sign in with email + password |
| POST | `/auth/login` | 📱 🖥️ | Sign in with phone + password |
| POST | `/auth/register` | 📱 | Create an Investor / Project-Manager account |
| POST | `/auth/send-otp` | 📱 | Send a one-time code |
| POST | `/auth/verify-otp` | 📱 | Verify a one-time code |
| POST | `/auth/forgot-password` | 📱 | Request a password-reset code by email |
| POST | `/auth/verify-reset-code` | 📱 | Verify the reset code |
| POST | `/auth/reset-password` | 📱 | Set a new password using the reset code |
| POST | `/auth/refresh-token` | 📱 🖥️ | Exchange a refresh token for a new access token |
| POST | `/auth/logout` | 📱 🖥️ | Invalidate the refresh token |
| POST | `/auth/change-password` | 📱 🖥️ | Change password (current → new) |
| GET | `/auth/profile` | 📱 🖥️ | Current authenticated user |
| PUT | `/auth/profile` | 🖥️ | Update the current user's profile |

## Projects — `/projects`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| GET | `/projects/featured` | 📱 🖥️ | Hand-picked featured projects |
| GET | `/projects` | 📱 | Public list (search / category / status filters) |
| GET | `/projects/categories` | 📱 🖥️ | Project categories |
| GET | `/projects/{id}` | 📱 🖥️ | Project detail |
| POST | `/projects` | 📱 🖥️ | Create a project (owner or admin) |
| PUT | `/projects/{id}` | 📱 🖥️ | Update a project |
| DELETE | `/projects/{id}` | 🖥️ | Delete a project |
| POST | `/projects/{id}/views` | 📱 | Record a project view |
| GET | `/projects/{id}/stats` | 📱 🖥️ | Project funding/engagement stats |

## Owner dashboard — `/owners`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| GET | `/owners/{ownerId}/projects` | 📱 | An owner's projects |
| GET | `/owners/{ownerId}/stats` | 📱 | An owner's aggregate stats |
| GET | `/owners/{ownerId}/dashboard` | 📱 | Owner dashboard metrics |

## Investments & Wallet — `/investments`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| POST | `/investments/checkout` | 📱 🖥️ | Invest in a project |
| GET | `/investments/me` | 📱 | The current user's investments |
| GET | `/investments/history` | 📱 🖥️ | Investment history |
| GET | `/investments/wallet` | 📱 🖥️ | Wallet balance + summary |
| POST | `/investments/wallet/topup` | 📱 | Top up the wallet |
| POST | `/investments/wallet/withdraw` | 📱 | Withdraw from the wallet |
| GET | `/investments/funding-options` | 📱 | Available funding / payment options |
| POST | `/investments/topup/redeem` | 📱 🖥️ | Redeem a prepaid recharge code |
| GET | `/investments/{id}` | 🖥️ | Investment detail |

## Payments — `/payments`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| POST | `/payments/initiate` | 📱 | Start a payment |
| POST | `/payments/verify` | 📱 | Verify/confirm a payment |
| GET | `/payments/methods` | 📱 | Available payment methods |
| GET | `/payments/history` | 📱 | Payment history |
| GET | `/payments/wallet` | 📱 | Wallet-related payments |
| GET | `/payments/{id}` | 📱 | Payment detail |
| GET | `/payments/{id}/status` | 📱 | Payment status |
| POST | `/payments/{id}/refund` | 📱 | Refund a payment |

## Notifications — `/notifications`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| GET | `/notifications` | 📱 🖥️ | List notifications |
| GET | `/notifications/unread-count` | 📱 🖥️ | Unread badge count |
| POST | `/notifications/{id}/read` | 📱 🖥️ | Mark one as read |
| POST | `/notifications/read-all` | 📱 🖥️ | Mark all as read |
| GET | `/notifications/settings` | 📱 🖥️ | Notification preferences |
| PUT | `/notifications/settings` | 📱 | Update notification preferences |

## Users & KYC — `/users`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| GET | `/users/{id}` | 📱 🖥️ | User profile |
| POST | `/users/{id}/kyc` | 📱 🖥️ | Submit KYC (passport/ID) |
| GET | `/users/{id}/documents` | 📱 🖥️ | A user's uploaded documents |
| GET | `/users/{id}/investments` | 📱 🖥️ | A user's investments |
| DELETE | `/users/{id}` | 🖥️ | Delete a user |

## Media — `/media`

| Method | Path | Client | Purpose |
|--------|------|--------|---------|
| POST | `/media/upload` | 📱 🖥️ | Upload a file (multipart/form-data) |
| DELETE | `/media/{id}` | 🖥️ | Delete an uploaded file |

## Admin-only — `/admin`

These are consumed exclusively by the admin dashboard.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/stats` | Dashboard headline stats |
| GET | `/admin/chart-data` | Chart datasets (user growth, revenue, status) |
| GET | `/admin/recent-activity` | Recent activity feed (`?count=`) |
| GET | `/admin/activity-logs` | Admin activity audit log |
| GET | `/admin/projects` | Paginated project management list |
| POST | `/admin/projects/{id}/approve` | Approve a pending project |
| POST | `/admin/projects/{id}/reject` | Reject a project (optional reason) |
| GET | `/admin/users` | Paginated user management list |
| PUT | `/admin/users/{id}` | Update a user |
| POST | `/admin/users/{id}/ban` | Ban a user |
| POST | `/admin/users/{id}/suspend` | Suspend a user (reason) |
| POST | `/admin/users/{id}/unsuspend` | Lift a suspension |
| POST | `/admin/users/{id}/kyc/approve` | Approve a user's KYC |
| POST | `/admin/users/{id}/kyc/reject` | Reject a user's KYC (reason) |
| POST | `/admin/users/{id}/wallet/add` | Credit a user's wallet |
| GET | `/admin/investments` | Paginated investments list |
| GET | `/admin/payments` | Paginated payments list |
| POST | `/admin/payments/{id}/approve` | Approve a payment |
| POST | `/admin/payments/{id}/reject` | Reject a payment (reason) |
| POST | `/admin/payments/{id}/refund` | Refund a payment |
| PUT | `/admin/payments/{id}/status` | Set a payment's status |
| GET | `/admin/wallets` | Paginated wallets list |
| POST | `/admin/wallet/transfer` | Transfer between wallets |
| POST | `/admin/notifications/send` | Broadcast / send a notification |
