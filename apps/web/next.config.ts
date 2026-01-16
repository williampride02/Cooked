import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for all pages (since we use Supabase client-side)
  output: 'standalone',

  // Skip build-time errors for missing env vars (they're runtime-only)
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
