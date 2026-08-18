import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionValue } from './session';

/**
 * Gates the whole app behind a signed session cookie.
 *
 * This deliberately covers the API routes as well as the UI. /api/analyze spends
 * Anthropic credits on every call, so protecting only the page would let anyone
 * who finds the URL POST to the endpoint directly and run up the bill.
 *
 * Set EDDIE_USER and EDDIE_PASSWORD in Vercel → Settings → Environment Variables
 * (tick Production, Preview, and Development). EDDIE_SECRET is optional.
 */

// Reachable without a session, or login would be impossible.
const PUBLIC_PATHS = ['/login', '/api/login', '/api/logout'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api/');

  // Fail closed. If credentials aren't configured, deny rather than expose the
  // app — a locked-out deploy is a far cheaper mistake than an open one.
  if (!process.env.EDDIE_USER || !process.env.EDDIE_PASSWORD) {
    return isApi
      ? NextResponse.json({ error: 'Auth not configured.' }, { status: 503 })
      : new NextResponse(
          'Auth not configured. Set EDDIE_USER and EDDIE_PASSWORD in Vercel, then redeploy.',
          { status: 503, headers: { 'Content-Type': 'text/plain' } }
        );
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (await verifySessionValue(cookie)) {
    return NextResponse.next();
  }

  // Unauthenticated API calls get a clean JSON 401 rather than a redirect,
  // so fetch() in the client fails predictably instead of parsing HTML.
  if (isApi) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next's static output and the logo (the login page needs
  // the dice mark to load before a session exists).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|omfgco-dice.svg).*)'],
};
