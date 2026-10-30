import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

// Admins are the signed-in Supabase users whose email is in ADMIN_EMAILS
// (comma separated). Local development without ADMIN_EMAILS stays open so the
// desk works on localhost; production without it lets nobody in.
function allowList() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function currentAdmin() {
  const emails = allowList();
  if (!emails.length) {
    return process.env.NODE_ENV === 'development' ? { email: 'local-dev' } : null;
  }
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return email && emails.includes(email) ? { email } : null;
}
