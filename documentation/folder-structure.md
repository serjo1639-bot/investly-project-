# Folder Structure

```
myApp/
├── App.js                  # Root: provider tree (SafeArea→Query→Theme→Toast→Nav)
├── index.js                # Expo entry point
├── app.json                # Expo config (name, icons, extra.apiBaseUrl)
├── babel.config.js         # babel-preset-expo
├── package.json
├── assets/                 # App icon, splash, adaptive icon + images/ (hero art via constants/images.js)
└── src/
    ├── api/                # ── Networking layer ──
    │   ├── client.js          # axios instance + interceptors + refresh queue
    │   ├── endpoints.js       # every backend path, in one map
    │   ├── authApi.js         # one module per backend controller…
    │   ├── projectsApi.js
    │   ├── investmentsApi.js
    │   ├── paymentsApi.js
    │   ├── notificationsApi.js
    │   ├── ownersApi.js
    │   ├── usersApi.js
    │   ├── mediaApi.js
    │   └── index.js           # barrel export
    │
    ├── components/         # ── Reusable UI kit (presentation only) ──
    │   ├── ui/                # Button, Input, Card, Badge, Avatar, Chip,
    │   │                      # Divider, ProgressBar, IconButton, Logo,
    │   │                      # Text, PressableScale, SectionHeader,
    │   │                      # StatTile, ListRow, HeroBackground
    │   ├── feedback/          # Skeleton, EmptyState, ErrorState, Spinner, Toast
    │   ├── project/           # ProjectCard, FundingProgress
    │   └── index.js           # barrel export for the whole kit
    │
    ├── layouts/            # ScreenContainer (safe area + scroll), AppHeader
    │
    ├── screens/            # ── One folder per audience ──
    │   ├── auth/              # Login, Register, ForgotPassword,
    │   │                      # VerifyCode, ResetPassword, AuthHero (shared header)
    │   ├── investor/          # Home, Projects, ProjectDetail, Checkout,
    │   │                      # Wallet, Topup, Withdraw, Payments,
    │   │                      # MyInvestments, Notifications, NotificationDetail
    │   ├── owner/             # OwnerDashboard, MyProjects, CreateProject,
    │   │                      # ProjectStats
    │   ├── shared/            # Account, EditAccount, Kyc, ChangePassword,
    │   │                      # Settings
    │   └── info/              # About, Contact, Faq, Privacy, Terms (+ layout)
    │
    ├── navigation/         # routes.js, RootNavigator, AuthStack, AppStack, MainTabs,
    │                       # AppDrawer (overlay drawer), navigationRef
    │
    ├── hooks/              # ── Business logic ──
    │   ├── useAuth.js         # login / register / logout mutations + session
    │   ├── useProfile.js      # profile fetch/update, change password
    │   ├── useProjects.js     # list (infinite), featured, categories, detail
    │   ├── useInvestments.js  # portfolio + checkout
    │   ├── useWallet.js       # balance + topup/withdraw/redeem
    │   ├── usePayments.js     # methods + history
    │   ├── useNotifications.js# list, unread badge, mark read (optimistic)
    │   ├── useOwner.js        # owner dashboard/projects/stats
    │   ├── useTheme.js        # read the active theme
    │   └── useDebounce.js     # debounce search input
    │
    ├── store/              # Zustand: authStore (session), uiStore (theme/lang)
    ├── context/            # ThemeProvider, QueryProvider
    ├── services/           # storage (AsyncStorage), secureStore (keychain),
    │                       # tokenManager (token owner), session
    ├── utils/              # format, validation, errors (ApiError), logger
    ├── constants/          # config, enums (mirror backend), queryKeys, roles, images
    ├── theme/              # tokens.js (colors/spacing/radii/typography/shadows)
    ├── types/              # JSDoc @typedef for User, Project, Wallet, …
    └── i18n/               # Arabic (default, RTL) + English resources
```

## Naming conventions

- **Components**: `PascalCase` files exporting a `PascalCase` component
  (`ProjectCard.js` → `ProjectCard`).
- **Hooks**: `useSomething.js` exporting `useSomething`.
- **Screens**: `XxxScreen.js`, default-exported (so the navigator imports them
  with one name).
- **API modules**: `xxxApi.js` exporting an `xxxApi` object whose methods map
  1:1 to backend routes.
- **Barrels**: `index.js` re-exports a folder's public surface so imports stay
  short (`import { Button, Card } from '../../components'`).

## Import depth

Screens import the UI kit through the `components` barrel and hooks directly.
The network layer is only ever reached *through hooks* — screens never import
`api/` directly (except a couple of one-off mutations like KYC upload, which
use the API module inside a local `useMutation`).
