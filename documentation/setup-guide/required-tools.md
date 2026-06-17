# Required Tools

Install these before doing anything else.

| Tool | Version | Why | Download |
|------|---------|-----|----------|
| **Node.js** | 18 LTS or newer | Runs the mobile app & dashboard | https://nodejs.org |
| **.NET SDK** | 8.0 | Builds & runs the backend | https://dotnet.microsoft.com/download |
| **PostgreSQL** | 14+ | Backend database | https://www.postgresql.org/download |
| **Git** | latest | Version control | https://git-scm.com |
| **Expo Go** (phone app) | latest | Run the app on a real device | App Store / Google Play |

## Recommended

- **Visual Studio 2022** *or* **VS Code** with the C# Dev Kit — to run the
  backend. (The backend can also run from the CLI with `dotnet run`.)
- **Android Studio** — for the Android emulator
  ([android-ios-setup](android-ios-setup.md)).
- **Xcode** (macOS only) — for the iOS simulator.

## Verify your install

```bash
node -v        # v18+  (or newer)
npm -v
dotnet --version   # 8.x
psql --version     # 14+
git --version
```

## Expo CLI

You do **not** need a global Expo CLI — the project uses the bundled
`npx expo`. If you prefer a global tool you can `npm install -g expo`, but it's
optional.
