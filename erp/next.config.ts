import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Turbopack scans from git root and finds proxy.ts (ubudget file). Pin @supabase/ssr
  // and next/server to erp/node_modules so proxy.ts compiles without errors.
  turbopack: {
    resolveAlias: {
      "@supabase/ssr": path.resolve(__dirname, "node_modules/@supabase/ssr"),
      "next/server": path.resolve(__dirname, "node_modules/next/server"),
    },
  },
  env: {
    NEXT_PUBLIC_BUILD_SHA:   process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    NEXT_PUBLIC_BUILD_TIME:  new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "0.1.0",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
