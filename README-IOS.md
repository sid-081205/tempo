# Tempo on iPhone

This branch wraps the full Tempo app in a native iOS shell (Capacitor + Swift Package Manager, no CocoaPods needed). The shell loads the Next.js app from a server, so **everything works**: Supabase login, the Pulse graphs, real connectors via Composio, Gmail intelligence, calendar booking, and the OpenAI chat.

## Requirements

- A Mac with Xcode 15+ (free Apple ID is enough for running on your own iPhone)
- Node 18+

## Run it in the iOS Simulator (fastest)

```bash
git checkout iphone-production
npm install
cp .env.example .env.local   # fill in your keys (see main README)
npm run dev                  # leave this running
npm run ios:open             # opens the Xcode project
```

In Xcode: pick any iPhone Simulator and press Run. The Simulator shares your Mac's localhost, so the default `http://localhost:3000` just works.

## Run it on your physical iPhone

1. Find your Mac's LAN IP: System Settings → Wi-Fi → Details, e.g. `192.168.1.23`.
2. Start the dev server so the phone can reach it:

```bash
npm run dev:lan
```

3. Point the shell at your Mac and sync:

```bash
TEMPO_SERVER_URL=http://192.168.1.23:3000 npx cap sync ios
npm run ios:open
```

4. In Xcode: select the `App` target → Signing & Capabilities → set your Team (your Apple ID). Plug in your iPhone, select it as the destination, press Run.
5. First launch: on the iPhone go to Settings → General → VPN & Device Management and trust your developer certificate.

Your iPhone and Mac must be on the same Wi-Fi.

## Point it at production later

Once the app is deployed on Vercel:

```bash
TEMPO_SERVER_URL=https://your-tempo.vercel.app npx cap sync ios
```

Rebuild in Xcode and the app no longer needs your Mac at all.

## What's iOS-native here

- Portrait-locked, notch-aware (safe-area insets), paper-colored status bar area
- Tempo app icon and splash screen (ink pebbles on butter paper)
- No pinch zoom or tap highlights; feels like an app, not a page
- `NSAllowsArbitraryLoads` is enabled for local http dev; remove it from
  `ios/App/App/Info.plist` when you ship with an https production URL
