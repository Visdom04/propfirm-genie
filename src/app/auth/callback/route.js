import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

function safeNextPath(value) {
  if (!value || typeof value !== 'string') return '/account';
  if (!value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=Could not sign in`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=Could not sign in`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
