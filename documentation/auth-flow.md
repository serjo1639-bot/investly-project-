# Authentication Flow

## Overview

Auth uses **JWT access tokens + refresh tokens**. Tokens are stored encrypted
(`expo-secure-store`); the user object is cached in AsyncStorage. The session is
restored on every app launch, and expired access tokens are refreshed
transparently.

## Pieces involved

| File | Role |
|------|------|
| `screens/auth/*` | Login, Register, ForgotPassword, VerifyCode, ResetPassword |
| `hooks/useAuth.js` | login/register/logout mutations → write session |
| `store/authStore.js` | holds user + `isAuthenticated`; persists user |
| `services/tokenManager.js` | the single owner of access/refresh tokens |
| `services/secureStore.js` | encrypted key/value (keychain/keystore) |
| `api/client.js` | injects token, refreshes on 401 |
| `navigation/RootNavigator.js` | gates AuthStack vs AppStack |

## Login

```
LoginScreen (email or phone + password)
  → useAuth().loginEmail.mutate({ email, password })
      → authApi.loginEmail()                → POST /auth/login-email
      → onSuccess: authStore.setSession()   → tokenManager.setTokens() (secure)
                                            → store user, isAuthenticated = true
  → RootNavigator renders AppStack
```

`extractSession()` in `useAuth` normalizes the backend payload, accepting either
`{ user, accessToken, refreshToken }` or a nested `{ user, tokens:{…} }` shape.

## Registration

`RegisterScreen` collects the fields the backend expects: `name`, `email`,
`phone`, `password`, `role` (`investor` | `owner`), `age`, `gender`, `location`.
If the backend returns tokens, the user is logged in immediately; otherwise they
are routed to the login screen.

## Password recovery

```
ForgotPassword  → POST /auth/forgot-password { email }   (sends a code)
   ↓ navigate(identifier)
VerifyCode      → POST /auth/verify-reset-code { email, code }
   ↓ navigate(identifier, code)
ResetPassword   → POST /auth/reset-password { email, code, newPassword }
   ↓ reset navigator → Login
```

The verify screen shows a 6-box segmented code input backed by a hidden field.

## Session persistence (app launch)

```
App starts
  → RootNavigator: authStore.hydrate()
       → tokenManager.load()  (read tokens from secure store into memory)
       → read cached user from AsyncStorage
       → isAuthenticated = (token && user) ?
  → while status !== 'ready' : show branded splash
  → ready: AppStack (authenticated) or AuthStack (not)
```

## Transparent token refresh

When any request returns **401**, `api/client.js`:

1. Coalesces concurrent 401s into one refresh call (`refreshPromise`).
2. `POST /auth/refresh-token { refreshToken }` (bare axios, no recursion).
3. Stores the new pair and **replays** the original request.
4. On refresh failure → `tokenManager.triggerUnauthorized()` →
   `authStore.clearSession()` → user lands back on Login.

## Logout

`useAuth().logout` calls `POST /auth/logout` (best-effort), then always clears
the local session and the React Query cache, regardless of the server response.

## Roles

`investor` and `owner` (Project Manager) use the app; `admin` is the web
dashboard only. The role drives navigation (see [navigation.md](navigation.md)).
