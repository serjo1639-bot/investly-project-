# Architecture

The mobile app follows a **layered, clean architecture**. Each layer has one
job and depends only on the layers below it. This keeps the UI dumb, the logic
testable, and the network code in exactly one place.

## The layers

```
┌─────────────────────────────────────────────────────────────┐
│  SCREENS  (src/screens)                                       │
│  Compose UI components + call hooks. No fetch, no business    │
│  rules beyond "what to render".                               │
└───────────────┬───────────────────────────────┬──────────────┘
                │ uses                            │ uses
                ▼                                 ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  COMPONENTS (src/components)│   │  HOOKS (src/hooks)            │
│  Reusable, theme-driven UI  │   │  React Query hooks own server │
│  (Button, Card, ProjectCard)│   │  state; useAuth owns session  │
└───────────────────────────┘   └───────────────┬───────────────┘
                                                 │ calls
                                                 ▼
                                 ┌───────────────────────────────┐
                                 │  API MODULES (src/api/*Api.js) │
                                 │  Thin wrappers, 1 per controller│
                                 └───────────────┬───────────────┘
                                                 │ via
                                                 ▼
                                 ┌───────────────────────────────┐
                                 │  HTTP CLIENT (src/api/client)  │
                                 │  axios + interceptors:          │
                                 │  token inject · unwrap · refresh│
                                 └───────────────┬───────────────┘
                                                 │ HTTP (JSON)
                                                 ▼
                                 ┌───────────────────────────────┐
                                 │  ASP.NET BACKEND  (:5231/api)  │
                                 └───────────────────────────────┘

  Cross-cutting (used by all layers):
  • store/    Zustand: authStore, uiStore (theme/language)
  • theme/    design tokens + ThemeProvider
  • services/ storage, secureStore, tokenManager, session
  • utils/    format, validation, errors, logger
  • constants/ config, enums, queryKeys, roles
  • i18n/     Arabic + English
```

## Data flow (example: opening the Home screen)

1. `HomeScreen` calls `useFeaturedProjects()`, `useWallet()`, `useUnreadCount()`.
2. Each hook is a **React Query** query that calls an **API module**
   (`projectsApi.getFeatured()`, …).
3. The API module calls the **HTTP client** (`api.get(endpoints…)`).
4. The client's **request interceptor** attaches the JWT access token.
5. The backend responds with the `ApiResponse` envelope
   `{ success, message, data }`.
6. The client's **response interceptor** unwraps `.data` (or throws a
   normalized `ApiError`).
7. React Query caches the result and returns `{ data, isLoading, isError }`.
8. The screen renders a **skeleton** while loading, an **ErrorState** on
   failure, an **EmptyState** when empty, or the data when ready.

## Why these choices

- **React Query for server state** removes hand-written loading/error/caching
  code and makes every list refetchable and consistent.
- **Zustand for client state** keeps the auth session and theme in a tiny,
  fast store without Redux boilerplate.
- **A single axios client** means token handling, refresh, and error shaping
  live in *one* file — no screen ever talks to the network directly.
- **Design tokens + ThemeProvider** make light/dark and consistent styling
  automatic.

## Key principles

- **Separation of concerns** — UI, logic and networking never mix.
- **Single source of truth** — endpoints, enums, query keys, config are each
  declared once under `src/constants` / `src/api`.
- **Fail gracefully** — every async surface has loading, empty and error UI.
- **Reuse over repetition** — shared primitives (`Button`, `Card`, `ListRow`,
  `ScreenContainer`) compose every screen.
