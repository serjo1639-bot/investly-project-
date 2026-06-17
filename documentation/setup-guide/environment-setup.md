# Environment Setup

## 1. Database (PostgreSQL)

The backend expects a PostgreSQL database named **`InvestlyDB`**. The default
connection string (in `investly_backendproject/appsettings.json`) is:

```
Host=localhost;Port=5432;Database=InvestlyDB;Username=postgres;Password=123456
```

If your PostgreSQL username/password differ, edit that connection string (and
`appsettings.Development.json`) to match your local setup.

Create the database (the EF migration will create the tables):

```sql
-- in psql or pgAdmin
CREATE DATABASE "InvestlyDB";
```

## 2. Backend API host

The API listens on (see `Properties/launchSettings.json`):

- HTTP  → `http://localhost:5231`
- HTTPS → `https://localhost:7201`

The mobile app talks to the **HTTP** endpoint on `:5231` by default.

## 3. Mobile app → API URL

The app picks its API base URL from (in priority order):

1. `EXPO_PUBLIC_API_BASE_URL` env var
2. `myApp/app.json` → `expo.extra.apiBaseUrl`
3. Platform default (`10.0.2.2` on Android emulator, `localhost` otherwise)

Choose based on **where the app runs**:

| Running on | Set `apiBaseUrl` to |
|------------|---------------------|
| Android **emulator** | `http://10.0.2.2:5231/api` (the default already works) |
| iOS **simulator** | `http://localhost:5231/api` |
| **Physical phone** (Expo Go) | `http://<YOUR-PC-LAN-IP>:5231/api` |

Find your PC's LAN IP:

```bash
# Windows
ipconfig          # look for IPv4 Address, e.g. 192.168.1.6
```

Then edit `myApp/app.json`:

```json
"extra": {
  "useMockApi": false,
  "apiBaseUrl": "http://192.168.1.6:5231/api"
}
```

> The phone and PC must be on the **same Wi-Fi network**, and your firewall must
> allow inbound connections on port 5231.

## 4. Make the backend reachable over LAN (physical device)

By default the dev server may bind to localhost. To accept LAN connections,
run the backend bound to all interfaces:

```bash
cd investly_backendproject
dotnet run --urls "http://0.0.0.0:5231"
```

(The `http` launch profile already uses `0.0.0.0:5231`.)
