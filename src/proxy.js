import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/update-session';

/** Public product pages. Everything else is hidden from the live site. */
const LIVE = ['/demo-2', '/demo-4', '/compare-firms', '/compare-page-2'];
const ALLOW_PREFIX = ['/api/', '/auth/', '/login', '/account'];

function isAllowed(pathname) {
  if (pathname === '/_not-found' || pathname === '/not-found') return true;
  if (LIVE.some(p => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return ALLOW_PREFIX.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/demo-2';
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
