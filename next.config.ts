import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Source map warnings from node_modules may appear in dev console.
  // We cannot easily suppress them in Next.js 16 (Turbopack) without complex config.
  // They are harmless and can be ignored.

  // Exclude heavy server-side libraries from bundling
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer', 'puppeteer-core', '@sparticuz/chromium-min'],
  // WARNING: Skips type-checking during production builds
  typescript: {
    ignoreBuildErrors: true,
  },

  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
