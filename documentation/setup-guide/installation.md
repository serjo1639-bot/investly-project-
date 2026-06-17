# Installation

Clone the repository, then install dependencies for each part you need.

## Backend (.NET)

```bash
cd investly_backendproject
dotnet restore
```

If you use the Entity Framework CLI for migrations, install it once globally:

```bash
dotnet tool install --global dotnet-ef
```

## Mobile app (Expo / React Native)

```bash
cd myApp
npm install
```

This installs Expo SDK 54, React Navigation, React Query, Zustand, axios,
react-hook-form, i18next and the native modules (secure-store, svg, image, …).

> If `npm install` reports peer-dependency conflicts, it usually means a native
> package resolved to a version newer than SDK 54 supports. Run
> `npx expo install --fix` to realign versions.

## Admin dashboard (Next.js) — optional

```bash
cd admin-dashboard
npm install
```

## Verify

- Backend: `dotnet build` succeeds.
- Mobile: `npx expo export --platform android` bundles without errors
  (a quick way to confirm the JS graph is healthy).

Next: [Run the backend](run-backend.md).
