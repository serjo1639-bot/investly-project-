# Investly — Project Documentation

This folder explains how the **Investly mobile application** is built: its
architecture, folder layout, and every major subsystem. It is written to be
beginner-friendly — if you are new to the codebase, read the documents in order.

## What is Investly?

Investly is a crowdfunding / micro-investment platform with three parts:

| Part | Tech | Folder | Purpose |
|------|------|--------|---------|
| **Backend** | ASP.NET (C#) | `investly_backendproject` | REST API, auth, database |
| **Mobile app** | React Native (Expo) | `myApp` | Investor & Project-Manager app |
| **Admin dashboard** | Next.js | `admin-dashboard` | Web admin panel |

The numbered guides below focus on the **mobile app**; the *Whole-system
reference* section covers all three parts (mobile, admin dashboard, backend).
For how to install and run everything, see the
[`/setup-guide`](../setup-guide/README.md) folder.

## Reading order

1. [Architecture](architecture.md) — the big picture & data flow
2. [Folder structure](folder-structure.md) — where everything lives
3. [Theme system](theme-system.md) — design tokens, light/dark mode
4. [Components](components.md) — the reusable UI kit
5. [Navigation](navigation.md) — screens, stacks, tabs, role-based routing
6. [State management](state-management.md) — React Query + Zustand
7. [API integration](api-integration.md) — the HTTP layer & API modules
8. [Backend connection](backend-connection.md) — endpoints & config
9. [Authentication flow](auth-flow.md) — login, tokens, refresh, persistence
10. [Clean-code guidelines](clean-code-guidelines.md) — conventions we follow

## Whole-system reference

These cover **all three parts** (mobile, admin dashboard, backend):

- [System integration](system-integration.md) — how the three parts connect, auth/token flow, data flow, database tables
- [API endpoint reference](api-endpoints.md) — every backend endpoint, grouped by resource, and which client calls it
- [File reference](file-reference.md) — a one-line description of every source file in both frontends (+ backend/DB notes)
- [Changelog](CHANGELOG.md) — recent UI/UX & functionality enhancements

## Tech stack at a glance

- **Expo SDK 54** · React Native 0.81 · React 19 (JavaScript)
- **React Navigation** (native-stack + bottom-tabs)
- **TanStack React Query** — server state (caching, loading/error)
- **Zustand** — global client state (auth session, theme/language)
- **Axios** — HTTP client with interceptors (token + refresh + error normalize)
- **react-hook-form** — forms & validation
- **i18next** — Arabic (default, RTL) + English
- **expo-secure-store** — encrypted token storage
- **react-native-svg / expo-image / @expo/vector-icons** — visuals
