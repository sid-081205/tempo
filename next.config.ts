import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow the iPhone Capacitor WebView (LAN IP / Cloudflare tunnel) to
  // fetch /_next/* assets from the Next.js dev server.
  allowedDevOrigins: [
    "10.1.0.54",
    "*.trycloudflare.com",
  ],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
