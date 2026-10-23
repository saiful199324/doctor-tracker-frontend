import type { NextRequest } from 'next/server';

/**
 * Same-origin proxy to the Express API (`API_URL`).
 *
 * The browser only ever calls this site's own `/api/*`, so the httpOnly session cookie stays
 * first-party (cross-site cookies are blocked by Safari and private windows) and no CORS is needed.
 * The visitor's IP is forwarded with a shared secret so the API's login rate limiter counts real
 * visitors instead of this server, and nobody can fake an IP by calling the API directly.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const PROXY_SECRET = process.env.PROXY_SECRET;

export const dynamic = 'force-dynamic';

// Hop-by-hop / transport headers that must not be copied between the two connections.
const STRIP_REQUEST = ['host', 'connection', 'content-length', 'accept-encoding', 'x-proxy-secret', 'x-client-ip'];
const STRIP_RESPONSE = ['connection', 'content-encoding', 'content-length', 'transfer-encoding', 'keep-alive'];

function clientIp(req: NextRequest): string | undefined {
  // Vercel (and most hosts) set x-forwarded-for to the real visitor IP; x-real-ip as a fallback.
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0].trim();
  return forwarded || req.headers.get('x-real-ip') || undefined;
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = new URL(`/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`, API_URL);

  const headers = new Headers(req.headers);
  for (const name of STRIP_REQUEST) headers.delete(name);
  const ip = clientIp(req);
  if (PROXY_SECRET && ip) {
    headers.set('x-client-ip', ip);
    headers.set('x-proxy-secret', PROXY_SECRET);
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json({ success: false, message: 'The API is unreachable. Please try again shortly.' }, { status: 502 });
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const name of STRIP_RESPONSE) responseHeaders.delete(name);

  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
