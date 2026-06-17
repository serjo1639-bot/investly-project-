# Backend Connection

The mobile app talks to the **ASP.NET** backend
(`investly_backendproject`) over REST/JSON.

## Base URL & configuration

Resolved in `src/constants/config.js` in this order:

1. `EXPO_PUBLIC_API_BASE_URL` (environment variable) — highest priority
2. `app.json` → `expo.extra.apiBaseUrl`
3. Platform default:
   - Android emulator → `http://10.0.2.2:5231/api`
   - iOS simulator / web → `http://localhost:5231/api`

> **Physical device?** Set `expo.extra.apiBaseUrl` to your computer's LAN IP,
> e.g. `http://192.168.1.6:5231/api`, and make sure the phone is on the same
> Wi-Fi. (This is the value currently committed in `app.json`.)

## JSON conventions

- The backend serializes **camelCase** (`AddJsonOptions … CamelCase`), which the
  app expects everywhere.
- Every response is wrapped in `ApiResponse`:
  ```json
  { "success": true, "message": null, "data": <payload>, "errors": null }
  ```
  The HTTP client unwraps `.data` automatically (see
  [api-integration.md](api-integration.md)).

## Endpoint map (`src/api/endpoints.js`)

| Group | Base path | Notable routes |
|-------|-----------|----------------|
| auth | `/auth` | `login-email`, `login`, `register`, `send-otp`, `verify-otp`, `forgot-password`, `verify-reset-code`, `reset-password`, `refresh-token`, `logout`, `change-password`, `profile` |
| projects | `/projects` | `featured`, `/`, `categories`, `{id}`, `{id}/views`, `{id}/stats` |
| investments | `/investments` | `checkout`, `me`, `history`, `wallet`, `wallet/topup`, `wallet/withdraw`, `funding-options`, `topup/redeem` |
| payments | `/payments` | `initiate`, `verify`, `methods`, `history`, `wallet`, `{id}/status`, `{id}/refund` |
| notifications | `/notifications` | `/`, `unread-count`, `{id}/read`, `read-all`, `settings` |
| owners | `/owners` | `{id}/projects`, `{id}/stats`, `{id}/dashboard` |
| users | `/users` | `{id}`, `{id}/kyc`, `{id}/documents`, `{id}/investments` |
| media | `/media` | `upload` (multipart), `{id}` |

> `admin/*` endpoints exist on the backend but are used by the **web dashboard**,
> not the mobile app.

## Auth headers

Authenticated requests carry `Authorization: Bearer <accessToken>`, attached by
the request interceptor. Auth-free endpoints (login/register/refresh/etc.) are
excluded so a stale token never blocks them.

## CORS

The backend's `Program.cs` enables a CORS policy (`AllowFrontends`). For local
development from Expo, the platform defaults above work out of the box. If you
change the dev host, update `expo.extra.apiBaseUrl`.

## Keeping the three apps in sync

The mobile app, admin dashboard and backend share the **same data model and
enums**. The app mirrors the backend enums in `src/constants/enums.js`
(roles, statuses, payment methods, etc.). If the backend enums change, update
that file to match.
