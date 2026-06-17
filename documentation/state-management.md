# State Management

The app uses **two complementary tools**, each for what it's best at:

| Kind of state | Tool | Where |
|---------------|------|-------|
| **Server state** (projects, wallet, notifications, profile…) | TanStack **React Query** | `src/hooks/*` |
| **Client state** (auth session, theme mode, language) | **Zustand** | `src/store/*` |

> Rule of thumb: *if it comes from the backend, it's React Query. If it's a
> device/app preference or the logged-in user, it's Zustand.*

## React Query (server state)

Configured in `src/context/QueryProvider.js`:

- `staleTime: 30s` — snappy but fresh.
- `refetchOnWindowFocus: false` — avoids noisy refetches on mobile.
- Smart `retry` — never retries 4xx (a 401/404 won't succeed by retrying).

Query keys live in **one place** (`src/constants/queryKeys.js`) so cache
invalidation is consistent:

```js
queryKeys.projects.detail(id)   // ['projects','detail', id]
queryKeys.wallet                // ['wallet']
```

### Patterns used

- **Infinite scroll** — `useProjectsList` uses `useInfiniteQuery` with a
  `normalizePage` helper that tolerates several backend list shapes
  (`array`, `{items,total}`, `{data,totalPages}`).
- **Optimistic updates** — `useMarkRead` flips a notification to read instantly,
  then rolls back if the request fails.
- **Cache invalidation** — mutations invalidate the queries they affect, e.g.
  `useCheckout` invalidates `wallet`, `investments.mine`, and `projects`.

## Zustand (client state)

### `authStore` (`src/store/authStore.js`)
Holds the current `user`, an `isAuthenticated` flag, and a `status`
(`idle` → `hydrating` → `ready`). Tokens themselves are **not** kept here —
they live in `tokenManager` (encrypted store). Key actions:

- `hydrate()` — on boot, restore tokens + cached user.
- `setSession({ user, accessToken, refreshToken })` — after login.
- `clearSession()` — logout or forced 401.

### `uiStore` (`src/store/uiStore.js`)
Holds `themeMode` (`light`/`dark`/`system`) and `language` (`ar`/`en`), both
persisted to AsyncStorage and restored on boot.

## How they connect

```
Login screen
  └─ useAuth().loginEmail.mutate()      (React Query mutation)
        └─ authApi.loginEmail()         (API module)
why →   └─ on success: authStore.setSession()   (Zustand + secure tokens)
                 └─ RootNavigator sees isAuthenticated = true → AppStack
```

The `RootNavigator` subscribes to `authStore`, so any session change (login,
logout, expired refresh) instantly swaps between the auth and app navigators —
no manual navigation needed.
