import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export default async function AuthNav() {
  let email = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getClaims();
      email = data?.claims?.email || null;
    } catch {
      email = null;
    }
  }

  if (email) {
    return (
      <>
        <Link href="/account" className="btn btn-secondary auth-nav-email">
          {email}
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-primary">
            Log out
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="btn btn-secondary">
        Log in
      </Link>
      <Link href="/login?mode=signup" className="btn btn-primary">
        Sign Up
      </Link>
    </>
  );
}
