# API Integration

All networking goes through **one** axios instance defined in
`src/api/client.js`. Screens and hooks never call `fetch`/axios directly — they
call **API modules**, which call the client.

## The HTTP client (`src/api/client.js`)

```
api.get/post/put/patch/delete  →  axios instance "http"
                                   ├─ request interceptor
                                   │    attach `Authorization: Bearer <token>`
                                   │    (skipped for auth-free endpoints)
                                   └─ response interceptor
                                        ├─ unwrap ApiResponse → return `.data`
                                        ├─ success:false      → throw ApiError
                                        └─ 401                → refresh & replay
```

### Unwrapping the envelope

The backend wraps every response as:

```json
{ "success": true, "message": null, "data": { ... }, "errors": null }
```

The response interceptor returns `body.data` directly, so an API call resolves
to the **payload only**:

```js
const wallet = await investmentsApi.getWallet(); // wallet === data, not the envelope
```

If `success` is `false`, it throws an `ApiError` carrying `message` + `errors`.

### Error normalization (`src/utils/errors.js`)

Anything that fails (network down, timeout, HTTP 4xx/5xx, `success:false`) is
converted into a single `ApiError { message, status, code, errors }`. The UI
only ever has to read `error.message`, which makes `ErrorState` and toast
messages trivial and consistent.

### Token refresh (single-flight)

On a `401`, the interceptor:

1. Calls `POST /auth/refresh-token` **once** (a module-level `refreshPromise`
   coalesces concurrent 401s so we don't fire N refreshes).
2. Saves the new token pair via `tokenManager`.
3. Replays the original request with the fresh token.
4. If refresh fails, it calls `tokenManager.triggerUnauthorized()`, which clears
   the session — `RootNavigator` then automatically shows the login flow.

The refresh call uses a **bare** axios call (not the intercepted instance) to
avoid infinite recursion.

## API modules (one per controller)

| Module | Backend controller | Sample methods |
|--------|--------------------|----------------|
| `authApi` | AuthController | `loginEmail`, `register`, `refresh`, `getProfile` |
| `projectsApi` | ProjectsController | `getAll`, `getFeatured`, `getById`, `create` |
| `investmentsApi` | InvestmentsController | `checkout`, `getWallet`, `topup`, `withdraw` |
| `paymentsApi` | PaymentsController | `getMethods`, `getHistory`, `refund` |
| `notificationsApi` | NotificationsController | `getAll`, `markRead`, `getSettings` |
| `ownersApi` | OwnersController | `getDashboard`, `getProjects`, `getStats` |
| `usersApi` | UsersController | `getById`, `submitKyc`, `getInvestments` |
| `mediaApi` | MediaController | `upload` (multipart), `remove` |

Each method is a thin wrapper:

```js
// src/api/projectsApi.js
export const projectsApi = {
  getFeatured: () => api.get(endpoints.projects.featured),
  getById: (id) => api.get(endpoints.projects.byId(id)),
  create: (payload) => api.post(endpoints.projects.create, payload),
};
```

## File uploads

`mediaApi.upload(asset)` builds a `FormData` with the React-Native file shape
`{ uri, name, type }` and sets `Content-Type: multipart/form-data`. It is used
by the KYC screen and the project cover upload. The returned URL is then sent to
the relevant endpoint (e.g. `usersApi.submitKyc`, or saved on the project).

## Adding a new endpoint

1. Add the path to `src/api/endpoints.js`.
2. Add a method to the matching `*Api.js` module.
3. Add (or extend) a hook in `src/hooks/` that calls it via React Query.
4. Use the hook in a screen.
