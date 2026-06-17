# Navigation

Built with **React Navigation v7** using a native-stack + bottom-tabs
combination. Route names are centralized in `src/navigation/routes.js` (no magic
strings).

## Navigator tree

```
RootNavigator                      (auth gate; reads authStore)
│
├── status !== 'ready'  → Splash (branded loading)
│
├── NOT authenticated   → AuthStack          (native-stack)
│        Login · Register · ForgotPassword · VerifyCode · ResetPassword
│
└── authenticated       → AppStack           (native-stack)
         │
         ├── MainTabs                          (bottom-tabs, role-aware)
         │     INVESTOR:  Home · Projects · Wallet · Notifications · Account
         │     OWNER:     Dashboard · MyProjects · Wallet · Notifications · Account
         │
         └── Pushed screens (shared by both roles):
               ProjectDetail · Checkout · Topup · Withdraw · Payments ·
               MyInvestments · Notifications · NotificationDetail · EditAccount ·
               Kyc · ChangePassword · Settings · CreateProject · ProjectStats ·
               About · Contact · Faq · Privacy · Terms

(plus AppDrawer — a global overlay rendered alongside AppStack, see below)
```

## Side drawer (overlay)

`AppDrawer` (`src/navigation/AppDrawer.js`) is a modern slide-in drawer rendered
as a **global overlay** — not a `@react-navigation/drawer` navigator, so the
navigator tree above is unchanged and no extra dependency is needed.

- **State**: `uiStore.drawerOpen` + `openDrawer()/closeDrawer()`.
- **Mounted once** inside `<NavigationContainer>` in `RootNavigator`, next to
  `AppStack`.
- **Navigation**: uses `src/navigation/navigationRef.js` (a
  `createNavigationContainerRef`) so the overlay can jump to routes without
  sitting inside a screen's navigation context.
- **Opened** by a `menu` button in the Home, Owner Dashboard, Account and
  Notifications headers.
- **Shortcuts**: Profile · Notifications · Settings · About Investly · About the
  platform · Help Center · Contact Us · Privacy · Terms.

## Floating tab bar

`MainTabs` renders a **floating** bottom bar: `tabBarStyle` uses
`position: 'absolute'` with a margin on all sides (bottom respects the safe-area
inset), rounded corners and a shadow. Active icons animate into a "pill". Tab
screens use a larger bottom `contentContainerStyle` padding so content clears
the floating bar.

## Role-based routing

`MainTabs` reads `useAuth().isOwner` and renders a different first two tabs:

- **Investor** → `HomeScreen` + `ProjectsScreen` (explore/invest)
- **Owner** → `OwnerDashboardScreen` + `MyProjectsScreen` (manage/raise)

Both share Wallet, Notifications and Account. The Notifications tab shows a live
unread **badge** from `useUnreadCount()`.

## Why this shape

- A **single AppStack** wrapping the tabs lets any tab push detail screens
  (e.g. Home → ProjectDetail → Checkout) while keeping the tab bar for top-level
  destinations.
- **native-stack** uses the platform's native screen transitions
  (`slide_from_right`) for a smooth, native feel without extra animation deps.
- `headerShown: false` everywhere — each screen renders its own `AppHeader`
  (`src/layouts/AppHeader.js`) so headers are themed and consistent.

## The auth gate

`RootNavigator` subscribes to `authStore.isAuthenticated`. Because navigation is
**derived from state**, there are no imperative redirects: logging in, logging
out, or a failed token refresh simply re-renders the correct stack.

## Navigating with params

```js
navigation.navigate(ROUTES.PROJECT_DETAIL, { id: project.id });
navigation.navigate(ROUTES.CHECKOUT, { project });
navigation.navigate(ROUTES.PROJECTS_TAB, { categoryId }); // jump to a sibling tab
```
