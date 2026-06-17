# Run the Mobile App

> Make sure the [backend is running](run-backend.md) first, and that
> `apiBaseUrl` points to it ([environment-setup](environment-setup.md)).

## Start the Expo dev server

```bash
cd myApp
npx expo start
```

A QR code and a menu appear. Then choose how to run:

| Key / action | Runs on |
|--------------|---------|
| press **a** | Android emulator (must be running) |
| press **i** | iOS simulator (macOS only) |
| **scan the QR** with Expo Go | your physical phone |
| press **w** | web browser (limited; for quick checks) |

If something seems cached/stale, restart with a clean cache:

```bash
npx expo start -c
```

## First-time sign-in

1. The app opens on the **Login** screen.
2. Tap **Create account**, register as an **Investor** or **Project Manager**,
   filling name, email, phone, age, gender, location and a password.
3. Sign in — you'll land on the Home screen (investor) or Dashboard (owner).

If login fails with a network error, the app can't reach the backend — recheck
`apiBaseUrl` and that the backend is listening (see
[troubleshooting](troubleshooting.md)).

## Useful scripts (`package.json`)

```bash
npm start        # expo start
npm run android  # expo start --android
npm run ios      # expo start --ios
npm run clear    # expo start -c  (clear cache)
```

## What to expect

- **Light/Dark mode** follows your system setting; change it in
  Account → Settings.
- **Arabic / English** toggle in Account → Settings (Arabic is default, RTL).
- Pull to refresh on Home, Wallet, and the dashboards.
