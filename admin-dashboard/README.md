# Investly Admin Dashboard

A **Next.js 16** web application that gives platform administrators full control over the Investly crowdfunding platform — users, projects, investments, payments, notifications, and audit logs.

Both this dashboard and the **myApp** mobile application connect to the same ASP.NET Core backend. All `/admin/*` endpoints are restricted to users with `role === "admin"`.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [All Routes](#all-routes)
5. [How to Run](#how-to-run)
6. [Environment Variables](#environment-variables)
7. [API Integration](#api-integration)
8. [Authentication Flow](#authentication-flow)
9. [Mock Data Mode](#mock-data-mode)
10. [Design System](#design-system)
11. [Connecting to the ASP.NET Backend](#connecting-to-the-aspnet-backend)
12. [Documentation](#documentation)

---

## What It Does

| Section | What admins can do |
|---|---|
| **Dashboard** | View platform KPIs: total users, revenue, active projects, success rate. 4 interactive charts. |
| **Users** | List, search, filter, view profile, edit details, suspend (temporary), ban (permanent), delete. |
| **Projects** | List all projects, **create new projects** (New Project modal), approve or reject pending submissions with optional rejection reason. |
| **Pending Review** | Dedicated screen showing only pending projects — quick approve or reject with reason. |
| **Project Detail** | Full project view — funding progress, owner contact, EN + AR descriptions. Approve/Reject buttons. |
| **Investments** | Browse all investment transactions with filters and totals. |
| **Payments** | Browse all payment transactions. |
| **Notifications** | View all platform notifications. Send push to **all users** or **one specific user** (bilingual EN + AR). |
| **Admin Users** | Manage admin accounts, assign roles and permissions, invite new admins. |
| **Activity Logs** | Full audit trail of every admin action. Click an admin's name to see their complete personal history. |
| **Settings** | Update profile, change password, configure notification preferences and system settings. |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI component library |
| **Next.js 16 (App Router)** | File-based routing, SSR/SSG, production build |
| **TypeScript 5** | Type safety across the whole codebase |
| **Tailwind CSS 4** | Utility-first styling with CSS-variable theming (`@theme`) |
| **Axios** | HTTP client — all API calls with JWT interceptor |
| **Recharts** | Charts (area, bar, pie/donut) on the dashboard |
| **React Hook Form + Zod** | Login form validation |
| **Lucide React** | Icon set used throughout the UI |
| **date-fns** | Date formatting helpers |

---

## Project Structure

```
admin-dashboard/
│
├── src/
│   ├── app/                        ← Pages (Next.js App Router — 1 folder = 1 route)
│   │   ├── login/                  → /login
│   │   ├── dashboard/              → /dashboard
│   │   ├── users/
│   │   │   ├── page.tsx            → /users          (list + suspend/ban/delete)
│   │   │   └── [id]/page.tsx       → /users/:id      (profile + edit modal + suspend modal)
│   │   ├── projects/
│   │   │   ├── page.tsx            → /projects       (list + inline approve/reject)
│   │   │   ├── pending/page.tsx    → /projects/pending (pending-only review queue)
│   │   │   └── [id]/page.tsx       → /projects/:id   (detail + approve/reject modals)
│   │   ├── investments/            → /investments
│   │   ├── payments/               → /payments
│   │   ├── notifications/          → /notifications   (view + send all/specific)
│   │   ├── admins/                 → /admins
│   │   ├── activity/
│   │   │   ├── page.tsx            → /activity        (full audit log, admin names clickable)
│   │   │   └── admin/[adminId]/    → /activity/admin/:id (per-admin history + stats)
│   │   └── settings/               → /settings
│   │
│   ├── components/
│   │   ├── layout/                 ← DashboardLayout, Sidebar, Header
│   │   ├── auth/                   ← ProtectedRoute (redirects to /login if not authenticated)
│   │   ├── dashboard/              ← StatsCard, RecentActivity, RevenueChart, UserGrowthChart, ProjectStatusChart
│   │   ├── projects/               ← NewProjectModal (create-project form)
│   │   └── ui/                     ← Button, Card, Input, Select, Table, Modal, Badge, Avatar
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         ← Global auth state (user, token, login, logout)
│   │
│   ├── lib/
│   │   ├── utils.ts                ← formatCurrency, formatDate, getRelativeTime, extractError
│   │   └── api/
│   │       ├── config.ts           ← Axios instance + JWT interceptor + 401 redirect
│   │       ├── auth.ts             ← login, profile, changePassword endpoints
│   │       ├── users.ts            ← getAllUsers, getUserById, updateUser, banUser, suspendUser, unsuspendUser, deleteUser
│   │       ├── projects.ts         ← getAllProjects, getProjectById, approveProject, rejectProject, deleteProject
│   │       ├── admin.ts            ← getStats, getAllPayments, sendNotification, getActivityLogs
│   │       ├── investments.ts      ← getAllInvestments
│   │       └── notifications.ts   ← getAll, markAsRead, markAllAsRead, getUnreadCount
│   │
│   └── types/index.ts              ← TypeScript interfaces: User, Project, Investment, Payment, Notification…
│
├── docs/
│   ├── README.md                   ← Admin docs index
│   └── CODEBASE_EXPLAINED.md       ← Deep-dive explanation of every file
├── .env.local                      ← API URL (not committed to git — see below)
├── README.md                       ← This file
├── next.config.ts
└── package.json
```

---

## All Routes

| URL | Description |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/login` | Admin login (email + password, role check) |
| `/dashboard` | KPI cards + 4 charts |
| `/users` | User list — search, filter, suspend, ban, delete |
| `/users/:id` | User profile — edit modal, suspend/unsuspend modal |
| `/projects` | All projects — approve/reject pending from the list |
| `/projects/pending` | **Pending-only review queue** — approve or reject with reason |
| `/projects/:id` | Full project detail — approve or reject with reason modal |
| `/investments` | Investment transaction list |
| `/payments` | Payment transaction list |
| `/notifications` | View notifications + send to **all users** or **specific user** |
| `/admins` | Admin account management |
| `/activity` | Full audit log — click any admin name to drill in |
| `/activity/admin/:id` | **Per-admin action history** with summary stats |
| `/settings` | Profile, password, notification preferences, system config |

---

## How to Run

```bash
# 1. Enter the folder
cd admin-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Edit .env.local — set your API base URL (see below)

# 4. Start the development server
npm run dev
# → http://localhost:3000
```

**Login:** Your backend must have an account with `role === "admin"`. The dashboard blocks any other role.

---

## Environment Variables

`.env.local` (never commit this file):

```env
# Backend URL — the ASP.NET API runs on port 5231 by default
NEXT_PUBLIC_API_BASE_URL=http://localhost:5231/api

# Production backend:
# NEXT_PUBLIC_API_BASE_URL=https://api.investly.ly/api

# Set to "true" to route all calls through the built-in mock adapter
NEXT_PUBLIC_MOCK_MODE=false
```

> If `NEXT_PUBLIC_API_BASE_URL` is unset, the code falls back to
> `http://localhost:5000/api` (`src/lib/api/config.ts`) — always set it
> explicitly to match your backend (5231).

---

## API Integration

All HTTP calls go through `src/lib/api/config.ts` — an Axios instance that:
- Attaches `Authorization: Bearer <token>` to every request automatically
- On a **401 response**: clears localStorage and redirects to `/login`
- Times out after **30 seconds**

### Endpoint reference

A curated subset is below; the **complete** cross-project reference (every route,
and which client calls it) lives in
[`/documentation/api-endpoints.md`](../documentation/api-endpoints.md).

| Action | Method | Endpoint |
|---|---|---|
| Login | POST | `/auth/login-email` |
| Get profile | GET | `/auth/profile` |
| List users (paginated) | GET | `/admin/users` |
| Get user | GET | `/users/:id` |
| Update user | PUT | `/users/:id` |
| Delete user | DELETE | `/users/:id` |
| Ban user | POST | `/admin/users/:id/ban` |
| **Suspend user** | POST | `/admin/users/:id/suspend` |
| **Unsuspend user** | POST | `/admin/users/:id/unsuspend` |
| List projects | GET | `/admin/projects` |
| Get project | GET | `/projects/:id` |
| **Create project** | POST | `/projects` |
| Approve project | POST | `/admin/projects/:id/approve` |
| Reject project | POST | `/admin/projects/:id/reject` |
| Platform stats | GET | `/admin/stats` |
| List payments | GET | `/admin/payments` |
| Get notifications | GET | `/notifications` |
| Unread count | GET | `/notifications/unread-count` |
| Mark one read | POST | `/notifications/:id/read` |
| Mark all read | POST | `/notifications/read-all` |
| **Send notification** | POST | `/admin/notifications/send` |
| Activity logs | GET | `/admin/activity-logs` |

### Send Notification — request body

```jsonc
// To ALL users — omit targetUserId
{
  "titleEn":   "Platform Update",
  "titleAr":   "تحديث المنصة",
  "messageEn": "New features are now available.",
  "messageAr": "ميزات جديدة متاحة الآن.",
  "type":      "system"   // "system" | "investment" | "project" | "user"
}

// To ONE specific user — include targetUserId
{
  "titleEn":      "Your project was approved",
  "titleAr":      "تم قبول مشروعك",
  "messageEn":    "Congratulations! Your project is now live.",
  "messageAr":    "تهانينا! مشروعك الآن متاح للمستثمرين.",
  "type":         "project",
  "targetUserId": "user-uuid-here"
}
```

---

## Authentication Flow

```
App loads
  └─ AuthContext reads localStorage (admin_token, admin_user)
       ├─ Found → restore session, render dashboard
       └─ Not found → show /login

Admin submits login form
  └─ POST /auth/login-email { email, password }
       ├─ Success → check user.role === "admin"
       │     ├─ Yes → save token to localStorage → redirect /dashboard
       │     └─ No  → show "Access denied — admin credentials required"
       └─ Failure → show error message from the server

Every subsequent API call
  └─ Axios adds Authorization: Bearer <token>
       └─ 401 response → clear localStorage → redirect /login
```

---

## Mock Data Mode

Set `NEXT_PUBLIC_MOCK_MODE=true` to run the dashboard **without a backend**. The
Axios client (`src/lib/api/config.ts`) then swaps in a **mock adapter**
(`src/lib/api/mock.ts`) that resolves requests with built-in sample data, so the
UI looks and behaves identically offline. With mock mode off, pages call the real
backend and degrade gracefully (empty lists + inline error messages) if it is
unreachable.

---

## Design System

Theme tokens live in `src/app/globals.css` inside a Tailwind v4 `@theme` block:

| Token | Value | Used for |
|---|---|---|
| `--color-primary` | `#4361EE` | Buttons, links, active nav |
| `--color-background` | `#EFF1FF` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, modals, header |
| `--color-text-primary` | `#0D1B4B` | Headings, body text |
| `--color-text-muted` | `#9EA5C4` | Labels, timestamps, hints |
| `--color-teal` | `#00B4A0` | Investment amounts, success states |
| `--color-amber` | `#F59E0B` | Warnings, suspend action |
| `--color-danger` | `#EF4444` | Delete, ban, reject, errors |

---

## Connecting to the ASP.NET Backend

**1. `Program.cs` — JSON camelCase + CORS:**
```csharp
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
app.UseCors();
```

**2. JWT:**
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* your settings */ });
app.UseAuthentication();
app.UseAuthorization();
```

**3. Expected login response shape:**
```json
{
  "data": {
    "token": "eyJ...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "name": "Super Admin",
      "email": "admin@investly.ly",
      "role": "admin"
    }
  }
}
```

**4. Set your server URL in `.env.local`:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5231/api
```

---

## Documentation

| Doc | What's inside |
|---|---|
| [`docs/`](docs/README.md) | Admin documentation hub (index) |
| [`docs/CODEBASE_EXPLAINED.md`](docs/CODEBASE_EXPLAINED.md) | File-by-file deep dive of the whole dashboard |
| [`/documentation/system-integration.md`](../documentation/system-integration.md) | How the dashboard, mobile app and backend connect |
| [`/documentation/api-endpoints.md`](../documentation/api-endpoints.md) | Every backend endpoint and which client calls it |
| [`/documentation/file-reference.md`](../documentation/file-reference.md) | One-line description of every source file (both frontends) |

Install/run guides for the whole project live in
[`/setup-guide`](../setup-guide/README.md).
