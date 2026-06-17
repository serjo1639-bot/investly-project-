# Build & Deploy

The app is an **Expo** project, so production builds use **EAS Build** (Expo's
cloud build service). You don't need Android Studio/Xcode locally to produce
installable binaries.

## 1. Install EAS CLI & sign in

```bash
npm install -g eas-cli
eas login            # create a free Expo account if needed
```

## 2. Configure the project (first time)

```bash
cd myApp
eas build:configure   # creates eas.json
```

## 3. Build

```bash
# Android APK (easy to sideload for testing/demo)
eas build -p android --profile preview

# Android App Bundle (for Google Play)
eas build -p android --profile production

# iOS (requires an Apple Developer account)
eas build -p ios --profile production
```

EAS uploads the project, builds in the cloud, and gives you a download link for
the `.apk` / `.aab` / `.ipa`.

## 4. Point the build at the production API

Before a production build, set the API URL to your deployed backend (not
localhost). Either:

- edit `app.json` → `expo.extra.apiBaseUrl` to `https://api.yourdomain/api`, or
- set `EXPO_PUBLIC_API_BASE_URL` in your EAS build profile (`eas.json` → `env`).

## 5. Over-the-air updates (optional)

For JS-only changes you can ship updates without a new store build:

```bash
eas update --branch production --message "Fix wallet copy"
```

## Local production bundle (sanity check)

To verify the JS bundle builds (no device needed):

```bash
npx expo export --platform android --output-dir dist
```

## Deploying the backend

The mobile app only needs the backend reachable over HTTPS at a public URL.
Deploy `investly_backendproject` to any .NET host (Azure App Service, IIS, a
Linux VM with Kestrel behind nginx, etc.), provision a PostgreSQL database,
update the connection string, run `dotnet ef database update`, and set the
mobile app's `apiBaseUrl` to that host.
