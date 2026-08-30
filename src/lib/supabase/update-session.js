import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getSupabasePublicEnv } from './env';

/**
 * Refresh the auth cookie. Do not lock the public site.
 * Only /account requires a session.
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabasePublicEnv();

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([headerName, headerValue]) => {
            response.headers.set(headerName, headerValue);
          });
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims || null;
  const path = request.nextUrl.pathname;

  if (!user && path.startsWith('/account')) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && path.startsWith('/login')) {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = '/account';
    accountUrl.search = '';
    return NextResponse.redirect(accountUrl);
  }

  return response;
}
