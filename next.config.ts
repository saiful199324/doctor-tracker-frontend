import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The repo root has its own lockfile (dev scripts); this app's root is client/.
  outputFileTracingRoot: __dirname,
  // The browser only ever talks to this Next.js origin. `/api/*` is proxied to the standalone
  // Express server, so the httpOnly auth cookie is first-party and no CORS preflights are needed.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
