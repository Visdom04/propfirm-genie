import { createClient } from '@supabase/supabase-js';
import { buildSnapshot } from './snapshot.js';

// The page reads the finished snapshot the hourly job wrote. Public key,
// select-only by row level security. No row yet means an honest empty
// tracker, never invented numbers.
export async function loadSnapshot() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await db.from('payout_snapshot').select('data').eq('id', 'current').maybeSingle();
    if (data?.data?.firms?.length) return data.data;
  }
  return { ...buildSnapshot({ events: [] }), empty: true };
}
