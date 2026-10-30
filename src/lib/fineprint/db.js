import { createClient } from '@supabase/supabase-js';

// Server-side only. The service role bypasses row level security, so this
// client must never reach the browser. The daily script and admin API use it.
export function serviceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function toRow(change) {
  return {
    id: change.id,
    page_id: change.pageId || null,
    origin: change.origin || 'watcher',
    status: change.status === 'hidden' ? 'hidden' : 'published',
    firm: change.firm,
    market: change.market || null,
    kind: change.kind || null,
    product: change.product || null,
    plan: change.plan || null,
    title: change.title || null,
    summary: change.summary || null,
    source_url: change.sourceUrl || null,
    facts: change.facts || [],
    hunks: change.hunks || [],
    trending: Boolean(change.trending),
    detected_at: change.detectedAt || new Date().toISOString(),
    published_at: change.publishedAt || null,
    hidden_at: change.hiddenAt || null,
    hidden_by: change.hiddenBy || null,
    updated_at: new Date().toISOString(),
    updated_by: change.updatedBy || null,
  };
}

export function fromRow(row) {
  return {
    id: row.id,
    pageId: row.page_id,
    origin: row.origin,
    status: row.status,
    firm: row.firm,
    market: row.market,
    kind: row.kind,
    product: row.product,
    plan: row.plan,
    title: row.title,
    summary: row.summary,
    sourceUrl: row.source_url,
    facts: row.facts || [],
    hunks: row.hunks || [],
    trending: row.trending,
    detectedAt: row.detected_at,
    publishedAt: row.published_at,
    hiddenAt: row.hidden_at,
    hiddenBy: row.hidden_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function watchRow(page, previous, checkedAt) {
  const ok = ['baseline', 'unchanged', 'pending', 'posted', 'noise'].includes(page.state);
  return {
    page_id: page.id,
    firm: page.firm,
    url: page.url || previous?.url || null,
    state: page.state,
    http_status: page.status ?? null,
    source: page.source || null,
    cards: page.cards || 0,
    checked_at: checkedAt,
    last_ok_at: ok ? checkedAt : previous?.last_ok_at || null,
    fail_streak: ok ? 0 : (previous?.fail_streak || 0) + 1,
  };
}
