import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/update-session';

/** Public product pages. Everything else is hidden from the live site. */
const LIVE = ['/challenges', '/firms', '/overview', '/compare'];
const ALLOW_PREFIX = ['/api/', '/auth/', '/login', '/account'];
const LEGACY = {
  '/': '/challenges',
  '/demo-2': '/challenges',
  '/demo-4': '/firms',
  '/compare-page-2': '/overview',
  '/compare-firms': '/compare',
};

function isAllowed(pathname) {
  if (pathname === '/_not-found' || pathname === '/not-found') return true;
  if (LIVE.some(p => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return ALLOW_PREFIX.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const dest = LEGACY[pathname];

  if (dest) {
    const url = request.nextUrl.clone();
    url.pathname = dest;
    return NextResponse.redirect(url);
  }

  if (!isAllowed(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/_not-found';
    return NextResponse.rewrite(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
