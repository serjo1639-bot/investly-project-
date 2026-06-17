# Troubleshooting

Common problems and how to fix them.

## App can't reach the backend / "Cannot reach the server"

This is the #1 issue and is almost always the **API URL**.

- **Android emulator** must use `http://10.0.2.2:5231/api` (not `localhost`).
- **iOS simulator** uses `http://localhost:5231/api`.
- **Physical phone** must use your PC's **LAN IP** (`http://192.168.1.x:5231/api`)
  and be on the **same Wi-Fi**.
- Confirm the backend is actually running: `curl http://localhost:5231/api/projects/featured`.
- Windows firewall: allow inbound TCP on port **5231**.
- Bind the backend to all interfaces for LAN access:
  `dotnet run --urls "http://0.0.0.0:5231"`.

## `npm install` fails with peer-dependency / ERESOLVE errors

A native package resolved to a version newer than Expo SDK 54 supports
(e.g. `react-native-screens` requiring RN ≥ 0.82). Fix the versions:

```bash
cd myApp
npx expo install --fix
```

## "Cannot find module 'babel-preset-expo'"

Install it (it's required by `babel.config.js`):

```bash
npx expo install babel-preset-expo
```

## Metro bundler shows stale code / weird errors

Clear the cache and restart:

```bash
npx expo start -c
```

## White screen / app stuck on splash

- Check the Metro terminal for a red error — usually a bad import.
- Verify the JS bundles: `npx expo export --platform android`.
- Make sure the device clock is correct (JWT validation can fail otherwise).

## 401 / "Your session has expired"

The access token expired and the refresh failed. Sign in again. If it happens
immediately after login, the backend's token/refresh configuration or the device
clock may be off.

## Images don't load

Project/cover images come from the backend Media API. If they 404, the upload
URL returned by the backend may be relative — ensure the backend serves uploaded
files (it exposes `wwwroot/uploads` via `app.UseStaticFiles()`), and that the
URL is absolute and reachable from the device.

## Photo upload rejected ("image type not allowed")

iPhones save photos as **HEIC/HEIF**, which many backends reject. The app now
relabels picked HEIC/HEIF images as JPEG before upload (`src/api/mediaApi.js`),
so any captured photo is accepted. If a phone photo still fails, the restriction
is server-side — widen the allowed extensions/MIME types in the backend's upload
endpoint.

## Database errors on backend start

- Ensure PostgreSQL is running and `InvestlyDB` exists.
- Verify the connection string in `appsettings.json` matches your Postgres
  username/password.
- Run `dotnet ef database update` to create the schema.

## Expo Go shows "incompatible SDK"

Update the Expo Go app on your phone to the latest version, which supports
SDK 54.

## Android emulator not detected

Add `platform-tools` to PATH
(`%LOCALAPPDATA%\Android\Sdk\platform-tools`) and confirm with `adb devices`.
