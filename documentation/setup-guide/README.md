# Investly — Setup Guide

Everything you need to install, run, and build the project. Follow the guides in
order the first time.

## The three parts

You must start the **backend first**, then the apps.

1. **Backend** (ASP.NET, .NET 8 + PostgreSQL) → `investly_backendproject`
2. **Mobile app** (React Native / Expo) → `myApp`
3. **Admin dashboard** (Next.js) → `admin-dashboard`

## Guides

1. [Required tools](required-tools.md) — what to install first
2. [Environment setup](environment-setup.md) — configure machine + API URL
3. [Installation](installation.md) — install dependencies
4. [Run the backend](run-backend.md) — database + API server
5. [Run the mobile app](run-mobile-app.md) — Expo dev server
6. [Android / iOS setup](android-ios-setup.md) — emulators & physical devices
7. [Build & deploy](build-deploy.md) — production builds
8. [Troubleshooting](troubleshooting.md) — common errors & fixes

## Quick start (TL;DR)

```bash
# 1) Backend (terminal 1)
cd investly_backendproject
dotnet restore
dotnet ef database update          # create/seed the PostgreSQL schema
dotnet run                          # → http://localhost:5231

# 2) Mobile app (terminal 2)
cd myApp
npm install
npx expo start                      # press 'a' for Android, scan QR for device
```

> If you run the app on a **physical phone**, set the API URL to your computer's
> LAN IP in `myApp/app.json` → `expo.extra.apiBaseUrl`
> (e.g. `http://192.168.1.6:5231/api`). See [environment-setup](environment-setup.md).
