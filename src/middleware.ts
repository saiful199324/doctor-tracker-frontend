import { NextResponse, type NextRequest } from 'next/server';
// Subpath import keeps jose's unused JWE/compression code out of the Edge bundle.
import { jwtVerify } from 'jose/jwt/verify';

const AUTH_COOKIE = 'dt_token';
const PUBLIC_PATHS = ['/login'];

// Same secret the API signs tokens with (server/.env JWT_SECRET).
const secret = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

/**
 * Verifies the session JWT's signature, algorithm and expiry, the same checks the API runs.
 * Fails closed: no secret configured, a tampered or expired token all count as signed out.
 */
async function isAuthenticated(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  if (!secret) {
    console.error('JWT_SECRET is not set for the Next.js app; treating every request as signed out.');
    return false;
  }
  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Route guard: unauthenticated visitors are redirected to /login before any protected
 * page renders (no flash of private UI). Signed-in users skip the login page.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const authenticated = await isAuthenticated(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!authenticated && !isPublic) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    const res = NextResponse.redirect(url);
    // Drop an invalid or expired cookie so it is not re-sent on every request.
    if (token) res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  if (authenticated && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const res = NextResponse.next();
  if (!authenticated && token) res.cookies.delete(AUTH_COOKIE);
  return res;
}

export const config = {
  // Skip API proxy, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)'],
};
