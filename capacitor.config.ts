import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The iOS shell loads the Next.js app from a server, so every feature
 * (Supabase auth, Composio connectors, OpenAI chat, API routes) works
 * exactly as on the web.
 *
 * - iOS Simulator: the default http://localhost:3000 just works while
 *   `npm run dev` runs on your Mac.
 * - Physical iPhone: set TEMPO_SERVER_URL to your Mac's LAN address
 *   (e.g. http://192.168.1.23:3000) and run the dev server with
 *   `npm run dev -- -H 0.0.0.0`, then `npx cap sync ios`.
 * - Production: set TEMPO_SERVER_URL to your deployed Vercel URL.
 */
const config: CapacitorConfig = {
  appId: "com.tempo.health",
  appName: "Tempo",
  webDir: "ios-shell",
  server: {
    url: process.env.TEMPO_SERVER_URL ?? "http://localhost:3000",
    cleartext: true,
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#F5F3E6",
  },
};

export default config;
