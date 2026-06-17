# Changelog — UI/UX & Functionality Enhancements

A summary of the enhancement pass applied to the **mobile app** (`myApp`) and the
**admin dashboard** (`admin-dashboard`). All changes are additive — existing
workflow, business logic, navigation structure and design identity were
preserved.

## Mobile app (`myApp`)

### Design system & assets
- **Image assets** — on-brand abstract art added under `assets/images/` and
  registered once in `src/constants/images.js` as `IMAGES.*` (Metro requires
  static `require()`s). Used behind the brand gradient on hero surfaces.
- **Gradient tokens** — `theme.gradients` added to `src/theme/tokens.js`
  (`brand`, `brandDeep`, `night`, `heroScrim`).
- **`HeroBackground`** (`components/ui/HeroBackground.js`) — reusable banner that
  layers a photo + brand gradient scrim + content. Shared by auth screens, the
  profile header, the drawer header and the About pages.

### Authentication screens
- **Login** redesigned with a branded hero (logo + wordmark + welcome) over a
  rising content sheet; form logic unchanged.
- **`AuthHero`** (`screens/auth/AuthHero.js`) — compact branded header reused by
  Register, Forgot Password, Verify Code and Reset Password (replaced the plain
  `AppHeader` on those screens).

### Side navigation drawer (new)
- **`AppDrawer`** (`navigation/AppDrawer.js`) — a modern animated slide-in
  drawer rendered as a global overlay. No new dependencies and no change to the
  navigator tree.
- Driven by `uiStore.drawerOpen` + `openDrawer()/closeDrawer()`; navigates via
  `navigation/navigationRef.js` (a container-level ref).
- Opened by a `menu` button in the Home, Owner Dashboard, Account and
  Notifications headers.
- Shortcuts: Profile · Notifications · Settings · About Investly · About the
  platform · Help Center · Contact Us · Privacy · Terms.

### Notifications
- **Detail page** — new `NotificationDetailScreen` (route `NotificationDetail`).
  Every list card is now fully tappable and opens it, showing title, message,
  date/time, type and (when present) sender and a related action (open the
  linked project or external link).
- **Auto-read on open** — opening a notification marks it read via an optimistic
  `useMarkRead`; no separate tap needed.
- Clear unread vs. read styling (accent bar, tinted icon, unread dot) and a live
  header unread count.
- `normalizeNotification` now preserves `sender`, `projectId` and `link`;
  `formatDateTime` helper added to `utils/format.js`.

### Profile (Account)
- Branded gradient hero header with avatar, role pill and KYC badge.
- **Wallet balance** — the user's total money is shown in the hero as a tappable
  strip (opens the Wallet tab), sourced from `useWallet()`.

### Bottom navigation
- Converted to a **floating bar**: detached with a margin on all sides, rounded
  corners and a soft shadow; hides on keyboard. Active icons sit in an animated
  "pill". Tab screens’ bottom padding raised so content clears the floating bar.

### About pages
- `AboutScreen` rebuilt into a rich page (hero + Who we are / The platform /
  Services / Goals / Security). The drawer passes a `focus: 'org' | 'system'`
  param to tailor the hero.

### Fixes
- **HEIC/HEIF uploads** — `mediaApi.upload` relabels iPhone HEIC/HEIF photos as
  JPEG so any captured image is accepted. `ImagePicker.MediaTypeOptions` (now
  deprecated) replaced with `mediaTypes: ['images']` in Kyc & CreateProject.
- **Broken link** — Owner Dashboard "See all" pointed at an unregistered route
  (`MyProjects`); now navigates to the `ProjectsTab`. Added a dashboard error
  banner when owner metrics fail to load.

## Admin dashboard (`admin-dashboard`)

- **New Project** — the button on `/projects` had no handler. It now opens
  `components/projects/NewProjectModal.tsx`, a bilingual create form (title
  EN/AR, category, city, funding goal, min investment, image URL, description)
  that submits via `projectsApi.createProject` and refreshes the list on
  success.
