# Android / iOS Setup

You can run the app on an **emulator/simulator** or a **physical device**.

## Physical device (easiest) — Expo Go

1. Install **Expo Go** from the App Store / Google Play.
2. Connect the phone to the **same Wi-Fi** as your computer.
3. Set `myApp/app.json` → `expo.extra.apiBaseUrl` to your PC's LAN IP
   (`http://192.168.1.x:5231/api`) — see [environment-setup](environment-setup.md).
4. `npx expo start`, then **scan the QR code** with Expo Go (Android) or the
   Camera app (iOS).

## Android emulator

1. Install **Android Studio**.
2. Open **Device Manager** → create a virtual device (e.g. Pixel 6, a recent
   API level) → start it.
3. With the emulator running: `npx expo start`, then press **a**.
4. The default API URL `http://10.0.2.2:5231/api` already maps to your PC's
   `localhost` — no change needed.

### Ensure `adb` is on your PATH
Android Studio installs `adb` under
`%LOCALAPPDATA%\Android\Sdk\platform-tools`. Add that folder to your PATH so
Expo can detect the emulator.

## iOS simulator (macOS only)

1. Install **Xcode** from the App Store.
2. Open Xcode once to install the command-line tools and a simulator.
3. `npx expo start`, then press **i**.
4. The default `http://localhost:5231/api` works in the simulator.

## Tips

- An **emulator** sees your PC's localhost differently than a phone does — use
  the table in [environment-setup](environment-setup.md) to pick the right URL.
- If the app loads but data doesn't, it's almost always the **API URL** or a
  **firewall** blocking port 5231.
