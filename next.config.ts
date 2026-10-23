import type { NextConfig } from 'next';

// `/api/*` is proxied to the Express API by the route handler in src/app/api/[...path]/route.ts.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the tracing root to this app (a parent folder may contain another lockfile).
  outputFileTracingRoot: __dirname,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
