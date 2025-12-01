import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Source map warnings from node_modules may appear in dev console.
  // We cannot easily suppress them in Next.js 16 (Turbopack) without complex config.
  // They are harmless and can be ignored.
};

export default nextConfig;
