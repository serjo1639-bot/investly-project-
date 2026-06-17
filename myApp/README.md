# Investly — Mobile App

A premium React Native (Expo) app for the Investly micro-investment platform.
Investors discover and fund projects; Project Managers create and track funding
campaigns. Built with a clean, layered architecture and a polished design system
(light/dark, animations, skeletons, full empty/error handling).

## Tech stack

- **Expo SDK 54** · React Native 0.81 · React 19 (JavaScript)
- **React Navigation** (native-stack + bottom-tabs)
- **TanStack React Query** (server state) + **Zustand** (session/theme)
- **Axios** client with token injection, ApiResponse unwrapping & 401 refresh
- **react-hook-form** validation · **i18next** (Arabic default + English)
- **expo-secure-store** (encrypted tokens) · **expo-image** · **expo-linear-gradient** · **react-native-svg**

## Highlights

- Role-aware navigation (Investor vs Project-Manager) with a **floating** bottom bar
- A modern **side drawer** (Profile, Settings, About, Help, Contact, Privacy, Terms)
- Branded auth screens, profile hero with **wallet balance**, and a full **notification detail** view (auto-marks read on open)
- Token-based **light/dark** design system with gradient hero surfaces
- Full **loading / empty / error** states on every data screen

## Quick start

```bash
npm install
npx expo start      # press 'a' for Android, or scan the QR with Expo Go
```

> The backend must be running first (see `../setup-guide/run-backend.md`) and
> `app.json → expo.extra.apiBaseUrl` must point to it. On a physical phone use
> your PC's LAN IP, e.g. `http://192.168.1.6:5231/api`.

## Project layout

```
src/
  api/         axios client + one module per backend controller
  components/  reusable UI kit (ui/ feedback/ project/)
  layouts/     ScreenContainer, AppHeader
  screens/     auth/ investor/ owner/ shared/ info/
  navigation/  RootNavigator, AuthStack, AppStack, MainTabs, AppDrawer, navigationRef, routes
  hooks/       React Query data hooks + useAuth
  store/       Zustand: authStore, uiStore
  context/     ThemeProvider, QueryProvider
  services/    storage, secureStore, tokenManager
  utils/       format, validation, errors, logger
  constants/   config, enums, queryKeys, images
  theme/       design tokens (colors/spacing/radii/typography/shadows/gradients)
  i18n/        Arabic + English
```

## Documentation

Full architecture docs live in [`../documentation`](../documentation/README.md);
install/run/build guides live in [`../setup-guide`](../setup-guide/README.md).

- [System integration](../documentation/system-integration.md) — how the app, dashboard and backend connect
- [API endpoint reference](../documentation/api-endpoints.md) — every backend route
- [File reference](../documentation/file-reference.md) — every source file, described
- [Changelog](../documentation/CHANGELOG.md) — recent enhancements

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Open on Android emulator |
| `npm run ios` | Open on iOS simulator (macOS) |
| `npm run clear` | Start with a cleared cache |
