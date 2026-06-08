# Investly — Bilingual Crowdfunding Mobile App

A **React Native (Expo)** investment platform for the Libyan market.  
Full Arabic RTL + English LTR support, dual mock/real API mode, and role-based navigation.

---

## Table of Contents

1. [What the App Does](#what-the-app-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How to Run](#how-to-run)
5. [Environment Configuration](#environment-configuration)
6. [How Everything Connects](#how-everything-connects)
7. [Navigation System](#navigation-system)
8. [Authentication Flow](#authentication-flow)
9. [API Layer — Dual Mode](#api-layer--dual-mode)
10. [Shopping Cart](#shopping-cart)
11. [Toast / Confirm Popups](#toast--confirm-popups)
12. [Design System](#design-system)
13. [Internationalisation (Arabic / English)](#internationalisation-arabic--english)
14. [Screen Reference](#screen-reference)
15. [Connecting to the ASP.NET Backend](#connecting-to-the-aspnet-backend)

---

## What the App Does

Investly lets Libyan users:

| Role | Can do |
|---|---|
| **Guest** | Browse projects, read about platform, view FAQ / Terms |
| **Investor** | Everything above + invest in projects, manage a cart, top up wallet |
| **Owner** | Everything above + submit projects, view owner dashboard |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | JavaScript (ES2022) |
| Navigation | Custom (no React Navigation) |
| State | React Context API |
| Persistence | AsyncStorage |
| HTTP | `fetch` with custom wrapper |
| i18n | i18next + react-i18next |
| Icons | @expo/vector-icons (Ionicons) |
| Animations | React Native `Animated` API |
| Gradients | expo-linear-gradient |
| Image picker | expo-image-picker |
| Backend (when connected) | ASP.NET Core C# |

---

## Project Structure

```
myApp/
│
├── App.js                   # Root: wraps all providers in the correct order
├── index.js                 # Expo entry point — calls registerRootComponent
├── app.json                 # Expo config (name, icon, splash, extra config)
├── package.json             # Dependencies + npm scripts
├── .env.example             # Template for environment variables
│
├── Component/               # Every screen and shared UI component
│   ├── AppNavigator.js      # Custom navigation: stack, drawer, tab bar
│   ├── HomeScreen.js        # Featured projects carousel + announcements
│   ├── ProjectsScreen.js    # Full project list with filtering
│   ├── ProjectDetailScreen.js
│   ├── ContributionScreen.js  # Amount selector before investing
│   ├── CartScreen.js        # Investment cart + checkout
│   ├── AccountScreen.js     # Profile, wallet balance, stats
│   ├── EditAccountScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── AddProjectScreen.js  # Multi-step project submission form
│   ├── OwnerDashboard.js
│   ├── RechargeWalletScreen.js
│   ├── NotificationsScreen.js
│   ├── AboutScreen.js       # ─┐
│   ├── AboutEntityScreen.js #  │ Info screens — all built with
│   ├── FAQScreen.js         #  │ InfoScreenLayout.js
│   ├── ContactScreen.js     #  │
│   ├── TermsScreen.js       #  │
│   ├── PrivacyScreen.js     # ─┘
│   ├── InfoScreenLayout.js  # Reusable layout for all info screens
│   ├── AppHeader.js         # Top header bar (menu button + notifications)
│   ├── DrawerContent.js     # Side drawer menu items
│   └── BrandLogo.js         # Investly logo component
│
├── hooks/                   # React Context providers + consumer hooks
│   ├── useAuth.js           # Auth state: user, role, login, logout, register
│   ├── useCart.js           # Cart state: items, add/remove/update, totals
│   └── useTopPopup.js       # Global toast + confirm popup overlay
│
├── services/                # Backend communication and session management
│   ├── api.js               # All API calls (dual mock/real mode)
│   ├── backendConfig.js     # Base URL, all endpoint paths, apiRequest, apiUpload
│   ├── session.js           # AsyncStorage: save/load/clear token + user
│   ├── authEvents.js        # 401 event bridge (backendConfig → useAuth)
│   └── ownerApi.js          # Re-export shim for backward compatibility
│
├── constants/
│   └── theme.js             # Colors, fonts, spacing, radius, shadows, responsive scaling
│
├── i18n/
│   └── index.js             # i18next setup with AR + EN translations
│
└── assets/                  # Images, icons, splash screen
```

---

## How to Run

### Prerequisites

- **Node.js** 18+
- **Expo CLI**: `npm install -g expo-cli`
- **iOS**: Xcode (Mac only) or Expo Go app on your iPhone
- **Android**: Android Studio emulator or Expo Go app on your Android phone

### Steps

```bash
# 1. Clone the repo and enter the folder
cd myApp

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env
# Then edit .env to set your API URL (or leave as-is for mock mode)

# 4. Start the development server
npm start

# In a second terminal (optional — choose your platform):
npm run android   # Android emulator
npm run ios       # iOS simulator (Mac only)
npm run web       # Web browser (limited native features)
```

After running `npm start`, scan the QR code with **Expo Go** on your phone, or press `a` (Android) / `i` (iOS) in the terminal.

---

## Environment Configuration

Copy `.env.example` to `.env` and set these variables:

```env
# true  = use built-in mock data (no server needed — default for development)
# false = connect to the real ASP.NET backend
EXPO_PUBLIC_USE_MOCK_API=true

# URL of your ASP.NET C# server
# iOS simulator  : http://localhost:5000/api
# Android emu    : http://10.0.2.2:5000/api   (Android uses 10.0.2.2 to reach the host PC)
# Physical device: http://<YOUR-LAN-IP>:5000/api
# Production     : https://api.investly.ly/api
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

You can also set these in `app.json` under the `extra` key:

```json
"extra": {
  "useMockApi": true,
  "apiBaseUrl": "http://localhost:5000/api"
}
```

> **Tip:** Start with `EXPO_PUBLIC_USE_MOCK_API=true`. The app ships with 8 realistic mock projects so you can see every screen fully populated without running a server.

---

## How Everything Connects

```
index.js
  └── registerRootComponent(App)
        └── App.js
              ├── I18nextProvider      ← makes t() and i18n available everywhere
              ├── SafeAreaProvider     ← provides safe-area insets (notch, home bar)
              ├── AuthProvider         ← user, role, login/logout/register
              │     └── useAuth.js
              ├── CartProvider         ← cart items, addToCart, totals
              │     └── useCart.js
              ├── TopPopupProvider     ← toast/confirm overlay
              │     └── useTopPopup.js
              └── AppNavigator         ← renders the active screen + tab bar + drawer
                    └── Component/AppNavigator.js
```

**Data flow for a typical action (e.g. "Invest Now"):**

```
User taps "Invest Now" on ProjectDetailScreen
  → navigate('Contribution') sets project in global.currentProject
      → ContributionScreen reads project from global.currentProject
          → user taps "Add to Cart"
              → useCart.addToCart(project, amount)
                  → CartProvider updates items state
                      → CartScreen shows the item
                          → user taps "Confirm Payment"
                              → investmentAPI.confirmInvestment(payload)
                                  ├─ mock mode: returns { success: true } after 400 ms
                                  └─ real mode: POST /investments/checkout → ASP.NET
```

---

## Navigation System

The app uses a **custom navigator** (no React Navigation) to keep dependencies minimal.

### Core State

```
currentScreen  — name of the screen currently rendered (e.g. 'Home', 'Cart')
stack          — array of previous screen names used for goBack()
```

### Navigation Methods

| Method | What it does |
|---|---|
| `navigate('Cart')` | Push currentScreen onto history stack, show Cart |
| `goBack()` | Pop from stack, return to previous screen |
| `replaceScreen('Home')` | Clear stack and jump (used after login so Back can't return to Login) |
| `openDrawer()` | Animate the side drawer open |
| `closeDrawer()` | Animate the side drawer closed |

### Screen Transitions

Three `Animated` values run in parallel on every screen change:

- `slideAnim` — `translateX`: slides the old screen out and new screen in
- `fadeAnim` — `opacity`: cross-fade from 0 → 1
- `scaleAnim` — `scale`: subtle zoom from 0.9 → 1 for depth

### Tab Bar

Tabs change based on user role:

| Role | Tabs |
|---|---|
| guest / investor | Home · Projects · Cart · Account |
| owner | Home · Explore · My Projects · Settings |

The Cart tab shows a red badge when there are items in the cart.

### Drawer

- Opens from the **right** in Arabic (RTL), from the **left** in English (LTR)
- Swipe from the screen edge to open (invisible 24 pt touch zone)
- Swipe the open drawer back to close
- Tap the dark overlay behind the drawer to close

---

## Authentication Flow

### Startup (cold launch)

```
App mounts
  → AuthProvider useEffect fires
      → sessionManager.loadSession() reads AsyncStorage
          ├─ token + user found → set user state, set role, isLoading = false
          └─ nothing found     → isLoading = false (user sees Login)
```

`isLoading` is `true` during this check so the app shows a spinner instead of flashing the Login screen.

### Login (password method)

```
LoginScreen → loginWithPassword({ phone, password, role })
  → authAPI.login({ phone, password, role })
      ├─ mock: returns mock user + 'mock-token'
      └─ real: POST /auth/login → ASP.NET → JWT token
  → buildUser(response.user)       normalize user shape
  → setUser(resolvedUser)          update React state
  → setActiveRole(resolvedRole)    guest / investor / owner
  → sessionManager.saveSession()   persist to AsyncStorage
  → replaceScreen('Home')          clear nav stack, go to Home
```

### Session Expiry (401 from any API call)

```
apiRequest receives 401 response
  → notifyUnauthorized()          fire event through authEvents.js
      → useAuth registered handler runs:
          → clearSession()        wipe AsyncStorage
          → setUser(null)         clear React state
          → setSessionExpiredAt(Date.now())   bump timestamp
              → AppNavigator useEffect fires:
                  → show warning popup
                  → replaceScreen('Login')
```

### Logout

```
AccountScreen → logout()
  → authAPI.logout()        tell server (non-fatal if it fails)
  → clearSession()          wipe AsyncStorage + in-memory token
  → setUser(null)           clear state
  → setActiveRole('guest')
```

---

## API Layer — Dual Mode

Every API function follows this pattern:

```javascript
export const projectsAPI = {
  getFeatured: async () => {
    if (shouldUseMock()) {
      await delay(400);          // simulate network latency
      return mockProjects;       // return local data
    }
    // else: hit the real server
    return apiRequest({ path: '/projects/featured' });
  },
};
```

**To switch from mock to real:** set `EXPO_PUBLIC_USE_MOCK_API=false` in `.env`.

The UI, hooks, and components never know which mode is active — they always call the same function and get the same data shape back.

### `normalizeProject` — why it matters

The backend may send different field names (`titleAr`, `title_ar`, `title`).  
`normalizeProject()` in `api.js` always converts any server shape into one consistent object that the rest of the app can rely on:

```javascript
// Server might send any of these — normalizeProject handles all of them
{ _id: '1', title_ar: 'مشروع' }
{ id: '1', titleAr: 'مشروع' }
{ id: '1', title: 'مشروع' }

// All become:
{ id: '1', titleAr: 'مشروع', titleEn: '', ... }
```

### apiRequest (backendConfig.js)

All real HTTP calls go through `apiRequest()`:

- Attaches `Authorization: Bearer <token>` header automatically
- 30-second timeout with `AbortController`
- On 401 → fires `notifyUnauthorized()` → triggers session expiry flow
- Extracts human-readable error messages from ASP.NET `ProblemDetails` format

---

## Shopping Cart

The cart lives in `CartProvider` (memory only — resets on app restart, intentionally).  
Investment amounts are time-sensitive: the user should consciously re-choose them each session.

```
useCart() returns:
  items               — array of { project, amount, currency, minAmount }
  addToCart(p, amt)   — add or update a project (amount clamped to minAmount)
  removeFromCart(id)  — remove by project id
  updateAmount(id, n) — change amount for one item
  clearCart()         — empty everything
  totalAmount         — sum of all item amounts
  totalCount          — number of items
  isInCart(id)        — boolean
  getItemByProjectId  — find one item
```

Amount is always enforced to be **≥ project's `minInvestment`** — the cart rejects lower values silently by clamping.

---

## Toast / Confirm Popups

Any component can call `useTopPopup()` to show a toast or ask for confirmation:

```javascript
const popup = useTopPopup();

// Simple toasts (auto-dismiss after ~3 seconds)
popup.success('Investment added to cart');
popup.error('Insufficient wallet balance');
popup.warning('Session about to expire');
popup.info('New projects available');

// Confirm dialog (waits for user tap — no auto-dismiss)
popup.confirm({
  title:       'Confirm Investment',
  message:     'Are you sure you want to invest 500 LYD?',
  confirmText: 'Yes, invest',
  cancelText:  'Cancel',
  onConfirm:   () => proceedWithPayment(),
  onCancel:    () => {},
});
```

The popup slides in from the top of the screen using a spring animation and respects safe-area insets (notch, Dynamic Island).

---

## Design System

All visual constants are in `constants/theme.js`. Import what you need:

```javascript
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
```

### Responsive Scaling

The design was created for an iPhone 14 (390 × 844 pt).  
Use these helpers instead of raw numbers so layouts look right on all screen sizes:

| Helper | Use for |
|---|---|
| `scale(n)` | Horizontal dimensions (widths) |
| `verticalScale(n)` | Vertical dimensions (heights) |
| `moderateScale(n)` | Spacing and radius (less aggressive — default) |
| `responsiveFont(n)` | Font sizes (also compensates for accessibility text size) |
| `responsiveHeight(n)` | Card/hero heights (clamped min/max) |

### Key Colors

| Token | Hex | Used for |
|---|---|---|
| `COLORS.primary` | `#4361EE` | CTA buttons, active icons |
| `COLORS.primaryDark` | `#1A237E` | Header backgrounds, gradients |
| `COLORS.teal` | `#00B4A0` | Wallet balance, success states |
| `COLORS.background` | `#EFF1FF` | App background (lavender tint) |
| `COLORS.surface` | `#FFFFFF` | Cards, modals, tab bar |
| `COLORS.danger` | `#EF4444` | Errors, cart badge |

### Spacing Scale

```
xs=4  sm=8  md=12  base=16  lg=20  xl=24  xxl=32  xxxl=48
```

All spacing values are passed through `moderateScale()` so they grow slightly on larger screens.

---

## Internationalisation (Arabic / English)

The app uses **i18next**. Default language is Arabic.

### Using translations in a component

```javascript
import { useTranslation } from 'react-i18next';

const MyScreen = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';   // true when Arabic is active

  return (
    <View style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}>
      <Text>{t('home')}</Text>  {/* 'الرئيسية' or 'Home' */}
    </View>
  );
};
```

### Switching language

```javascript
import { changeLanguage } from '../i18n';

await changeLanguage('en');  // switch to English (LTR)
await changeLanguage('ar');  // switch to Arabic (RTL)
```

### RTL Layout

There is **no automatic RTL flip** — each component checks `i18n.language === 'ar'` and adjusts:

- `flexDirection: isAr ? 'row-reverse' : 'row'`
- `textAlign: isAr ? 'right' : 'left'`
- Drawer slides from right (AR) or left (EN)
- Navigation slide animations reverse direction for RTL

---

## Screen Reference

| Screen | File | Who can access |
|---|---|---|
| Home | `HomeScreen.js` | Everyone |
| Projects | `ProjectsScreen.js` | Everyone |
| Project Detail | `ProjectDetailScreen.js` | Everyone (invest button hidden for owners) |
| Contribution | `ContributionScreen.js` | Investors only |
| Cart | `CartScreen.js` | Investors only |
| Account | `AccountScreen.js` | Everyone (logged-out view shows login prompt) |
| Edit Account | `EditAccountScreen.js` | Logged-in users |
| Login | `LoginScreen.js` | Everyone |
| Register | `RegisterScreen.js` | Everyone |
| Owner Dashboard | `OwnerDashboard.js` | Owners only |
| Add Project | `AddProjectScreen.js` | Owners only |
| Recharge Wallet | `RechargeWalletScreen.js` | Investors only |
| Notifications | `NotificationsScreen.js` | Logged-in users |
| About | `AboutScreen.js` | Everyone |
| About Entity | `AboutEntityScreen.js` | Everyone |
| FAQ | `FAQScreen.js` | Everyone |
| Contact | `ContactScreen.js` | Everyone |
| Terms | `TermsScreen.js` | Everyone |
| Privacy | `PrivacyScreen.js` | Everyone |

---

## Connecting to the ASP.NET Backend

When you're ready to connect a real server:

### 1. Configure your ASP.NET project

In `Program.cs` (or `Startup.cs`):

```csharp
// Camel-case JSON — matches what the mobile app expects
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

// CORS — allow Expo dev server and the app
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
app.UseCors();
```

### 2. Set the API URL

In `.env`:

```env
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api   # Android emulator example
```

### 3. Implement the endpoints

All endpoints are declared in `services/backendConfig.js` under `API_CONFIG.endpoints`. The app expects:

**Auth:**  
`POST /auth/login` → `{ token, refreshToken, user }`  
`POST /auth/register` → `{ token, refreshToken, user }`  
`POST /auth/logout` → `{ success: true }`

**Projects:**  
`GET /projects/featured` → `{ data: [...projects] }`  
`GET /projects` → `{ data: [...projects] }`  
`GET /projects/categories` → `[{ id, labelAr, labelEn }]`

**Investments:**  
`POST /investments/checkout` → `{ success: true, paymentId }`  
`GET /investments/wallet` → `{ data: { balance, totalTopups } }`  
`POST /investments/topup/redeem` → `{ success: true, data: { balance } }`

**Users:**  
`GET /users/:id` → `{ data: { ...user } }`  
`PUT /users/:id` → `{ data: { ...user } }`

**Notifications:**  
`GET /notifications` → `{ data: [...notifications], unreadCount }`

### 4. User object shape

The server must return a user object with at least:

```json
{
  "id": "string",
  "name": "string",
  "phone": "string",
  "email": "string",
  "role": "investor | owner | admin",
  "type": "individual | organization",
  "walletBalance": 0,
  "companyName": "string | null"
}
```

---

## Admin Dashboard Integration

This mobile app shares the **same ASP.NET backend** as the **Investly Admin Dashboard** (a Next.js 16 web app in the `admin-dashboard/` folder). Here is how the two systems interact:

### Shared endpoints

Both apps call these endpoints (same URL, same auth token format):

| Endpoint | Mobile App (myApp) | Admin Dashboard |
|---|---|---|
| `POST /auth/login-email` | ✓ Login screen | ✓ Admin login |
| `GET /auth/profile` | ✓ Account screen | ✓ Settings |
| `PUT /auth/profile` | ✓ Edit account | ✓ Settings |
| `GET /projects` | ✓ Browse projects | — |
| `GET /projects/featured` | ✓ Home screen carousel | — |
| `GET /projects/:id` | ✓ Project detail | ✓ Admin detail view |
| `PUT /projects/:id` | ✓ Edit (owner) | ✓ Admin edit |
| `GET /users/:id` | ✓ Own profile | ✓ User detail |
| `PUT /users/:id` | ✓ Own profile | ✓ Admin edit user |
| `GET /notifications` | ✓ Notifications screen | ✓ Notification center |
| `POST /notifications/:id/read` | ✓ Mark read | ✓ Mark read |
| `POST /notifications/read-all` | ✓ Mark all read | ✓ Mark all read |
| `GET /notifications/unread-count` | ✓ Header badge | ✓ Header badge |
| `GET /investments/wallet` | ✓ Wallet screen | — |

### Admin-only endpoints (dashboard only)

These require `role === "admin"` in the JWT and are never called from the mobile app:

| Endpoint | Purpose |
|---|---|
| `GET /admin/users` | Paginated user list with filters |
| `GET /admin/projects` | Paginated project list with filters |
| `GET /admin/stats` | Platform KPI statistics |
| `GET /admin/payments` | Payment transaction list |
| `GET /admin/activity-logs` | Admin audit log (filterable by adminId) |
| `POST /admin/users/:id/ban` | Permanently ban a user |
| `POST /admin/users/:id/suspend` | Temporarily suspend a user |
| `POST /admin/users/:id/unsuspend` | Lift a suspension |
| `POST /admin/projects/:id/approve` | Approve a pending project |
| `POST /admin/projects/:id/reject` | Reject a pending project (with optional reason) |
| `POST /admin/notifications/send` | Send push notification to all users or one specific user |

### Notification flow: admin → mobile user

1. Admin opens `/notifications` in the web dashboard
2. Clicks **"Send Notification"**
3. Chooses **"All Users"** or **"Specific User"** (live search to find the user)
4. Fills in title + message in both English and Arabic
5. Clicks **"Send Notification"** → `POST /admin/notifications/send`
6. The backend stores the notification and (optionally) sends a push via FCM/APNs
7. The mobile user sees it in `NotificationsScreen.js` → `GET /notifications`
8. The notification includes both `titleEn`/`titleAr` and `messageEn`/`messageAr` so the app shows it in the user's active language

### Running both together (development)

```bash
# Terminal 1 — ASP.NET backend
dotnet run --project YourBackend.csproj
# → listening on http://localhost:5000

# Terminal 2 — Admin Dashboard (web)
cd admin-dashboard
npm run dev
# → http://localhost:3000  (set NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api)

# Terminal 3 — Mobile App
cd myApp
npm start
# → scan QR with Expo Go  (set EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api for Android)
```

`mapAuthSession()` in `api.js` handles any variation in field names — the app is tolerant of both camelCase and snake_case.

---

## Common Questions

**Q: How do I add a new screen?**

1. Create `Component/MyScreen.js`
2. Add it to the `screens` map in `AppNavigator.js`:  
   ```javascript
   const screens = { ..., MyScreen: MyScreenComponent };
   ```
3. Call `navigation.navigate('MyScreen')` from any component.

**Q: How do I add a new translation key?**

Open `i18n/index.js` and add the key to both `ar.translation` and `en.translation`. Then use `t('myKey')` in any component.

**Q: How do I add a new API endpoint?**

1. Declare the path in `services/backendConfig.js` under `API_CONFIG.endpoints`.
2. Add a function to the relevant API object in `services/api.js` with the dual mock/real pattern.

**Q: What is `global.currentProject`?**

It's a deliberate shortcut to pass a project object from a list screen to a detail screen without prop-drilling through the navigator. It's set immediately before `navigate('ProjectDetail')` and read on mount inside `ProjectDetailScreen`. It's not shared state — it's a one-time handoff.
