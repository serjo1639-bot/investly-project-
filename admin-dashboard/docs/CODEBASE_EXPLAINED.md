# Investly Admin Dashboard — Full Code Explanation

---

## Is it React?

**Yes. 100% React.**

This project uses **Next.js 16**, which is a framework built ON TOP of React. Every single page and component in this project is a standard React component. Next.js just adds routing, server-side rendering, and build optimization on top of React.

```
React ← the core UI library
Next.js ← the framework that wraps React (routing, SSR, build)
```

---

## Technologies Used (and Why)

| Technology | What it is | Why we use it |
|-----------|-----------|--------------|
| **React 19** | JavaScript UI library | Build interactive components with state and props |
| **Next.js 16** | React framework | File-based routing, App Router, production-ready build |
| **TypeScript 5** | Typed JavaScript | Catch bugs at compile time, better IDE support |
| **Tailwind CSS 4** | Utility-first CSS framework | Fast styling without writing CSS files |
| **Axios** | HTTP client | Make API requests to the backend |
| **Recharts** | Chart library | Draw area charts, bar charts, pie charts |
| **React Hook Form** | Form management | Handle form state and submission efficiently |
| **Zod** | Schema validation | Validate form inputs (email, password rules) |
| **Lucide React** | Icon library | All icons in the UI (Users, Bell, Settings, etc.) |

---

## Project Structure — Every Folder Explained

```
admin-dashboard/
├── src/
│   ├── app/              ← All the PAGES (Next.js App Router)
│   ├── components/       ← Reusable React components
│   ├── contexts/         ← Global state (React Context)
│   ├── lib/              ← API services + helper functions
│   └── types/            ← TypeScript type definitions
├── .env.local            ← Environment variables (API URL)
├── next.config.ts        ← Next.js configuration
├── tailwind.config       ← Tailwind is configured inside globals.css
└── package.json          ← Dependencies list
```

---

## The `src/app/` Folder — Pages

Next.js uses **file-based routing** — every folder with a `page.tsx` file becomes a URL route.

### `app/page.tsx` — Root Redirect
```
/ → redirects to /dashboard automatically
```
Just one line: `redirect('/dashboard')`. If user is not logged in, the dashboard redirects to `/login`.

---

### `app/login/page.tsx` — Login Page

**What it does:**
- Shows a login form with email + password fields
- Validates input using **React Hook Form + Zod**
- Calls `POST /auth/login-email` on the backend
- Checks that the returned user has `role === 'admin'` (non-admins are rejected)
- Saves the JWT token to `localStorage` via `AuthContext`
- Redirects to `/dashboard` on success

**Key React concepts used:**
- `useState` — controls password visibility toggle
- `useForm` (React Hook Form) — manages form inputs + errors
- `useRouter` — programmatic navigation after login
- `useAuth` — custom hook to access auth context

---

### `app/dashboard/page.tsx` — Main Dashboard

**What it does:**
- Fetches platform statistics from `GET /admin/stats`
- Falls back to mock data if API is unavailable
- Renders 6 stats cards (Users, Projects, Revenue, etc.)
- Renders 4 chart components

**Key React concepts:**
- `useEffect` — fetch data when component mounts
- `useState` — store stats and loading state

---

### `app/users/page.tsx` — User Management

**What it does:**
- Fetches all users from `GET /admin/users` with pagination
- Search users by name/email (debounced 400ms)
- Filter by role (investor, owner, admin) and status
- Ban a user → `POST /admin/users/:id/ban`
- Delete a user → `DELETE /users/:id`
- Click a row → navigates to `/users/[id]`

**Key concepts:**
- `useCallback` — memoizes the fetch function so it doesn't re-create on every render
- Debounced search — waits 400ms before fetching to avoid too many API calls
- `ConfirmDialog` — modal that asks "are you sure?" before destructive actions

---

### `app/users/[id]/page.tsx` — User Detail

**What it does:**
- The `[id]` in the folder name means it's a dynamic route — `/users/abc123` → `id = "abc123"`
- Fetches `GET /users/abc123`
- Shows profile, wallet balance, investment stats, KYC status
- **Edit button** → opens a modal form (name, email, phone, role, status, type, company, bio) → `PUT /users/:id`
- **Suspend/Unsuspend button** → opens a confirmation modal with optional reason textarea → `POST /admin/users/:id/suspend` or `/unsuspend`
- Optimistically updates UI so the status badge changes instantly, even in mock mode

---

### `app/projects/page.tsx` — Project Management

**What it does:**
- Lists all projects from `GET /admin/projects`
- For pending projects, shows Approve (✓) and Reject (✗) action buttons
- Approve → `POST /admin/projects/:id/approve`
- Reject → `POST /admin/projects/:id/reject`
- Progress bars show funding percentage for each project
- **New Project** button opens `components/projects/NewProjectModal.tsx` — a
  bilingual create form (title EN/AR, category, city, goal, min investment,
  image URL, description) that submits via `createProject` (`POST /projects`)
  and refreshes the list on success

---

### `components/projects/NewProjectModal.tsx` — Create Project form _(NEW)_

**What it does:**
- Modal form launched from the Projects page "New Project" button
- Validates title, category and a funding goal > 0; Arabic/English fields fall
  back to each other so a single-language entry still saves a valid record
- Submits via `projectsApi.createProject`, with loading + inline error handling

---

### `app/projects/pending/page.tsx` — Pending Review Queue _(NEW)_

**What it does:**
- Shows **only pending projects** — the approval work queue
- Each card displays: title (EN + AR), owner, funding goal, category, submission date
- **Approve button** → confirmation modal → `POST /admin/projects/:id/approve`
- **Reject button** → modal with optional reason textarea → `POST /admin/projects/:id/reject`
- After an action, the project disappears from the list immediately (optimistic update)
- "View Full Detail" link navigates to the project's detail page

---

### `app/investments/page.tsx` — Investments

**What it does:**
- Lists all investment transactions from `GET /admin/investments`
- Filter by status (completed, pending, failed) and payment method
- Shows summary stats at the top (total count, total volume)

---

### `app/payments/page.tsx` — Payments

**What it does:**
- Lists all payment transactions from `GET /admin/payments`
- Shows total volume of completed payments
- Shows count of failed payments

---

### `app/notifications/page.tsx` — Notifications

**What it does:**
- Fetches all platform notifications from `GET /notifications`
- Clicking a notification marks it as read → `POST /notifications/:id/read`
- "Mark All Read" button → `POST /notifications/read-all`
- Stat cards on the right show counts by type (investment, project, user, system)
- **"Send Notification" button** → opens a modal with two send modes:

  **Mode 1 — All Users:**  
  Select "All Users" → fill in title (EN + AR) + message (EN + AR) + type → sends to everyone.  
  `POST /admin/notifications/send` with no `targetUserId`.

  **Mode 2 — Specific User:**  
  Select "Specific User" → type in the search box → live user search results appear (calls `GET /admin/users?search=...`) → click a result to select → fill in the message → sends only to that user.  
  `POST /admin/notifications/send` with `targetUserId: "<selected user id>"`.

**Key concepts:**
- `useRef` + `mousedown` event listener — closes the user-search dropdown when clicking outside
- Debounced search — waits 400 ms after typing before calling the API
- Optimistic success feedback — shows a success banner for 1.5 s then auto-closes the modal

---

### `app/admins/page.tsx` — Admin Users

**What it does:**
- Lists all admin accounts (Super Admin, Admin, Moderator)
- Shows permissions assigned to each admin
- "Invite Admin" button opens a form to add a new admin with role + permissions

---

### `app/activity/page.tsx` — Activity Logs

**What it does:**
- Shows a chronological audit log of every admin action on the platform
- Each entry shows: **who did it** (clickable), what they did, when, and from which IP
- Filter by action type or search by name / action / detail text
- **Clicking an admin's name** navigates to `/activity/admin/:adminId` — their personal history

---

### `app/activity/admin/[adminId]/page.tsx` — Per-Admin History _(NEW)_

**What it does:**
- Shows everything **one specific admin** has ever done on the platform
- Fetches logs filtered by `adminId` → `GET /admin/activity-logs?adminId=...`
- Displays 4 summary stat cards: Total Actions, Approvals, Bans/Suspensions, Last Active
- Full log list with type filter dropdown
- Falls back to filtering the shared mock log data when the API is offline

---

### `app/settings/page.tsx` — Settings

**4 tabs:**
1. **Profile** — Update name, email, bio → `PUT /auth/profile`
2. **Security** — Change password → `POST /auth/change-password`
3. **Notifications** — Toggle which events to receive alerts for
4. **System** — Configure API URL, currency, language

---

## The `src/components/` Folder — Reusable Components

### `components/layout/`

#### `DashboardLayout.tsx`
The main shell that wraps every dashboard page. It contains:
- The `Sidebar` component on the left
- The `Header` component at the top
- A main content area where `children` (the page content) is rendered

```jsx
<DashboardLayout title="Users">
  <YourPageContent />   ← children goes here
</DashboardLayout>
```

#### `Sidebar.tsx`
The left navigation panel. Features:
- All nav links (Dashboard, Users, Projects, etc.) using Next.js `<Link>`
- Highlight the active route using `usePathname()`
- Collapse/expand button (desktop only)
- Mobile drawer version with overlay
- Shows logged-in admin name + avatar at the bottom
- Sign Out button

#### `Header.tsx`
The top bar. Contains:
- Mobile hamburger menu button
- Search input
- Notification bell with unread count badge
- Admin avatar + name dropdown (links to Settings + Sign Out)

---

### `components/auth/`

#### `ProtectedRoute.tsx`
A wrapper component that guards private pages.

**How it works:**
1. Check `isLoading` — if still checking auth, show a loading spinner
2. Check `isAuthenticated` — if not logged in, redirect to `/login`
3. If authenticated, render the `children` (the actual page)

**Usage:**
```jsx
export default function SomePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        ...page content...
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

### `components/ui/` — Building Blocks

These are generic reusable components used across all pages.

#### `Button.tsx`
A styled button with variants:
- `primary` — blue filled (default)
- `secondary` — light blue
- `danger` — red
- `ghost` — transparent
- `outline` — border only

Also supports: `loading` (shows spinner), `icon`, sizes (`sm`, `md`, `lg`).

#### `Card.tsx`
A white rounded box with shadow. Used to group related content.
`CardHeader` is a sub-component for card titles with optional icons and action buttons.

#### `Input.tsx` / `SearchInput`
Styled text input with label, error message, and optional icon.
`SearchInput` is a pre-built search field with a magnifying glass icon.

#### `Select.tsx`
A styled dropdown `<select>` element with a chevron icon.

#### `Table.tsx`
A fully generic table component. You pass:
- `columns` — array of `{ key, header, render }` objects
- `data` — array of items
- `loading` — shows skeleton rows while loading
- `onRowClick` — optional click handler

`Pagination` sub-component renders page number buttons.

#### `Modal.tsx`
A full-screen overlay with a centered dialog box. Press Escape to close.
`ConfirmDialog` is a pre-built version for "Are you sure?" prompts.

#### `Badge.tsx`
- `StatusBadge` — colored pill badge for status values (active=green, pending=amber, banned=red, etc.)
- `RoleBadge` — colored pill badge for user roles

#### `Avatar.tsx`
Shows a user's initials in a colored circle when there's no profile photo.
The color is deterministic based on the name (same name = same color always).

---

### `components/dashboard/`

#### `StatsCard.tsx`
The metric cards on the dashboard (e.g., "1,842 Total Users").
Shows: icon, value, title, optional % change indicator (trending up/down).

#### `RevenueChart.tsx`
Area chart (Recharts) showing monthly revenue vs investments.
Uses gradient fills under the lines.

#### `UserGrowthChart.tsx`
Grouped bar chart showing new investors vs new project owners per month.

#### `ProjectStatusChart.tsx`
Donut/ring pie chart showing project distribution by status (active, pending, completed, etc.).

#### `RecentActivity.tsx`
A scrollable list of the latest platform events with icons, timestamps, and status badges.

---

## The `src/contexts/` Folder — Global State

### `AuthContext.tsx`

This is a **React Context** — a way to share state across all components without passing props.

**What it stores:**
- `user` — the logged-in admin's data
- `token` — the JWT access token
- `isAuthenticated` — boolean
- `isLoading` — true while checking localStorage on startup

**What it does on startup:**
1. Reads `admin_token` and `admin_user` from `localStorage`
2. If found, restores the session (user stays logged in after page refresh)
3. Sets the token on the Axios client so all API calls are authenticated

**Functions provided:**
- `login(session)` — called after successful login, saves everything
- `logout()` — calls `POST /auth/logout`, clears localStorage
- `refreshUser()` — re-fetches the user profile from the API

---

## The `src/lib/api/` Folder — API Services

### `config.ts` — Axios Setup

Sets up the Axios HTTP client:
- Base URL from `NEXT_PUBLIC_API_BASE_URL` environment variable
- 30 second timeout
- **Request interceptor** — automatically adds `Authorization: Bearer <token>` header to every request
- **Response interceptor** — if any request gets a 401 (Unauthorized), clears the session and redirects to login

### `auth.ts`
```
loginEmail(email, password)   → POST /auth/login-email
getProfile()                  → GET  /auth/profile
updateProfile(data)           → PUT  /auth/profile
logout()                      → POST /auth/logout
changePassword(old, new)      → POST /auth/change-password
```

### `users.ts`
```
getAllUsers(params)            → GET    /admin/users
getUserById(id)               → GET    /users/:id
updateUser(id, data)          → PUT    /users/:id        ← used by Edit User modal
deleteUser(id)                → DELETE /users/:id
banUser(id)                   → POST   /admin/users/:id/ban
suspendUser(id, reason?)      → POST   /admin/users/:id/suspend    ← NEW
unsuspendUser(id)             → POST   /admin/users/:id/unsuspend  ← NEW
getUserInvestments(id)        → GET    /users/:id/investments
```

### `projects.ts`
```
getAllProjects(params)         → GET    /admin/projects
getProjectById(id)            → GET    /projects/:id
approveProject(id)            → POST   /admin/projects/:id/approve
rejectProject(id, reason?)    → POST   /admin/projects/:id/reject   ← reason is optional
deleteProject(id)             → DELETE /projects/:id
createProject(data)           → POST   /projects
updateProject(id, data)       → PUT    /projects/:id
```

### `admin.ts`
```
getStats()                    → GET  /admin/stats
getAllPayments(params)         → GET  /admin/payments
sendNotification(payload)     → POST /admin/notifications/send
  payload: { titleEn, titleAr, messageEn, messageAr, type, targetUserId? }
  targetUserId omitted  → broadcast to ALL users
  targetUserId present  → send to that ONE user only
getActivityLogs(params)       → GET  /admin/activity-logs   ← params can include adminId
uploadMedia(file)             → POST /media/upload
```

### `notifications.ts`
```
getAll()                      → GET  /notifications
getUnreadCount()              → GET  /notifications/unread-count
markAsRead(id)                → POST /notifications/:id/read
markAllAsRead()               → POST /notifications/read-all
```

---

## The `src/types/index.ts` — TypeScript Types

Defines the shape of every data object:

```typescript
User          { id, name, email, phone, role, status, walletBalance, ... }
Project       { id, titleEn, titleAr, category, status, goal, raised, ... }
Investment    { id, projectId, amount, paymentMethod, status, ... }
Payment       { id, amount, method, status, transactionId, ... }
Notification  { id, type, titleEn, titleAr, messageEn, isRead, ... }
DashboardStats{ totalUsers, totalProjects, totalRevenue, successRate, ... }
AuthSession   { token, refreshToken, user }
```

---

## The `src/lib/utils.ts` — Helper Functions

| Function | What it does |
|----------|-------------|
| `formatCurrency(amount)` | `25000` → `"25,000 LYD"` |
| `formatNumber(num)` | `1500000` → `"1.5M"` |
| `formatDate(str)` | ISO string → `"14 May 2026"` |
| `formatDateTime(str)` | ISO string → `"14 May 2026, 15:30"` |
| `getRelativeTime(str)` | ISO string → `"5m ago"` or `"2h ago"` |
| `getInitials(name)` | `"Ahmad Ali"` → `"AA"` |
| `extractError(err)` | Pulls readable message from any Axios/API error |
| `getStatusColor(status)` | Returns Tailwind color classes for a status string |
| `getCategoryLabel(cat)` | `"tech"` → `"Technology"` |

---

## How Authentication Works (Flow)

```
1. User opens /dashboard
   └→ ProtectedRoute checks isAuthenticated
      └→ Not authenticated → redirect to /login

2. User enters email + password on /login
   └→ React Hook Form validates with Zod schema
      └→ Calls authApi.loginEmail()
         └→ POST /auth/login-email to backend
            └→ Backend returns { token, refreshToken, user }
               └→ Check user.role === 'admin'
                  └→ Call login(session) in AuthContext
                     └→ Save token to localStorage
                     └→ Set token on Axios client
                     └→ Redirect to /dashboard

3. On every page load
   └→ AuthContext reads localStorage on mount
      └→ Restores session if token exists
         └→ User stays logged in across page refreshes

4. Every API request
   └→ Axios request interceptor adds: Authorization: Bearer <token>

5. If API returns 401
   └→ Axios response interceptor clears session
      └→ Redirect to /login
```

---

## How the Design System Works (Tailwind CSS v4)

Tailwind v4 uses **CSS variables** instead of a `tailwind.config.js` file.

In `src/app/globals.css`:
```css
@theme {
  --color-primary: #4361EE;
  --color-teal: #00B4A0;
  --color-background: #EFF1FF;
  --color-text-primary: #0D1B4B;
  /* ...etc */
}
```

These become Tailwind utility classes automatically:
```html
<div class="bg-primary text-text-primary border-border">
```

All colors exactly match the `myApp` mobile app's `theme.js` file.

---

## Mock Data Strategy

Every page tries the real API first. If it fails (backend not running), it falls back to realistic mock data:

```typescript
try {
  const res = await usersApi.getAllUsers(params);
  setUsers(res.data);
} catch {
  // Use mock data instead — dashboard still works!
  setUsers(MOCK_USERS);
}
```

This means you can run and test the full dashboard UI without the backend server running.

---

## To Run the Project

```bash
# Install packages
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

Make sure your backend is running (default `http://localhost:5231/api`) and that
`NEXT_PUBLIC_API_BASE_URL` in `.env.local` points to it.

**Login with:** Your admin credentials from the backend database.
