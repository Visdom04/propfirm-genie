import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { emptyCover, STOCK_COVER } from './coverage.js';
import { fromRow, serviceClient, toRow } from './db.js';

// Supabase when the service key is set and the tables exist (see
// supabase/migrations). Otherwise the JSON files in the repo, which is how
// local development runs without secrets. Demo cards always come from JSON.
const liveFile = path.join(process.cwd(), 'src/data/fineprint/changes.json');
const demoFile = path.join(process.cwd(), 'src/data/fineprint/demo-changes.json');
const watchFile = path.join(process.cwd(), 'src/data/fineprint/starter-watch.json');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  return writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

let warned = false;
function database() {
  return serviceClient();
}

function fallBack(error) {
  if (!warned) {
    console.warn(`[fineprint] database unavailable, using JSON files: ${error.message}`);
    warned = true;
  }
  return null;
}

async function readDemo() {
  const demo = await readJson(demoFile, []);
  return (Array.isArray(demo) ? demo : []).map(item => ({ ...item, demo: true, origin: 'demo' }));
}

async function readLive({ includeHidden }) {
  const db = database();
  if (db) {
    let query = db.from('fineprint_changes').select('*').order('detected_at', { ascending: false });
    if (!includeHidden) query = query.eq('status', 'published');
    const { data, error } = await query;
    if (!error) return { rows: data.map(fromRow), mode: 'database' };
    fallBack(error);
  }
  const live = await readJson(liveFile, []);
  const rows = (Array.isArray(live) ? live : []).filter(item => includeHidden || item.status === 'published');
  return { rows, mode: 'files' };
}

export async function readChangeLog({ includeHidden = false } = {}) {
  const [demo, live] = await Promise.all([readDemo(), readLive({ includeHidden })]);
  return [...demo, ...live.rows];
}

export async function storeMode() {
  return (await readLive({ includeHidden: false })).mode;
}

async function patchFile(id, patch) {
  const live = await readJson(liveFile, []);
  const index = live.findIndex(item => item.id === id);
  if (index >= 0) live[index] = { ...live[index], ...patch, id };
  else live.unshift({ id, ...patch });
  await writeJson(liveFile, live);
  return index >= 0 ? live[index] : live[0];
}

/** Create or replace one change. Admin edits and manual entries land here. */
export async function saveChange(change, by) {
  const next = { ...change, updatedBy: by, updatedAt: new Date().toISOString() };
  const db = database();
  if (db) {
    const { data, error } = await db.from('fineprint_changes').upsert(toRow(next)).select().single();
    if (!error) return fromRow(data);
    fallBack(error);
  }
  return patchFile(next.id, next);
}

/** Hide or restore. Hidden rows stay stored, and the daily job never re-publishes them. */
export async function setChangeStatus(id, status, by) {
  const hidden = status === 'hidden';
  const patch = {
    status: hidden ? 'hidden' : 'published',
    hidden_at: hidden ? new Date().toISOString() : null,
    hidden_by: hidden ? by : null,
    updated_at: new Date().toISOString(),
    updated_by: by,
  };
  const db = database();
  if (db) {
    const { data, error } = await db.from('fineprint_changes').update(patch).eq('id', id).select().single();
    if (!error) return fromRow(data);
    fallBack(error);
  }
  return patchFile(id, { status: patch.status, hiddenAt: patch.hidden_at, hiddenBy: patch.hidden_by, updatedBy: by });
}

/** Permanent delete. The API only allows it for manual entries. */
export async function removeChange(id) {
  const db = database();
  if (db) {
    const { error } = await db.from('fineprint_changes').delete().eq('id', id);
    if (!error) return;
    fallBack(error);
  }
  const live = await readJson(liveFile, []);
  await writeJson(liveFile, live.filter(item => item.id !== id));
}

export async function readOneChange(id) {
  const all = await readChangeLog({ includeHidden: true });
  return all.find(item => item.id === id) || null;
}

/** Board coverage in the { shown, extra } shape the board already reads. */
export async function readCoverage() {
  const db = database();
  if (db) {
    const { data, error } = await db.from('fineprint_coverage').select('*');
    if (!error) {
      if (!data.length) return emptyCover();
      const stock = new Set(STOCK_COVER.map(item => item.firm));
      const byFirm = new Map(data.map(row => [row.firm, row]));
      return {
        shown: [...STOCK_COVER.map(item => item.firm).filter(firm => byFirm.get(firm)?.shown !== false), ...data.filter(row => !stock.has(row.firm) && row.shown).map(row => row.firm)],
        extra: data.filter(row => !stock.has(row.firm)).map(row => ({ id: `cover-${row.firm}`, firm: row.firm, market: row.market, logo: row.logo || '' })),
      };
    }
    fallBack(error);
  }
  return emptyCover();
}

export async function saveCoverage({ firm, market = 'futures', shown = true, logo = null }) {
  const db = database();
  if (!db) throw new Error('Coverage needs the database. Run the Supabase migration and set SUPABASE_SERVICE_ROLE_KEY.');
  const { error } = await db
    .from('fineprint_coverage')
    .upsert({ firm, market, shown, logo, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function dropCoverage(firm) {
  const db = database();
  if (!db) throw new Error('Coverage needs the database.');
  const { error } = await db.from('fineprint_coverage').delete().eq('firm', firm);
  if (error) throw error;
}

/** What the last daily check saw, page by page. */
export async function readWatch() {
  const db = database();
  if (db) {
    const { data, error } = await db.from('fineprint_watch').select('*').order('firm');
    if (!error && data.length) {
      return {
        mode: 'database',
        checkedAt: data.reduce((latest, row) => (row.checked_at > latest ? row.checked_at : latest), ''),
        pages: data.map(row => ({
          id: row.page_id,
          firm: row.firm,
          url: row.url,
          state: row.state,
          status: row.http_status,
          source: row.source,
          cards: row.cards,
          checkedAt: row.checked_at,
          lastOkAt: row.last_ok_at,
          failStreak: row.fail_streak,
        })),
      };
    }
    if (error) fallBack(error);
  }
  const file = await readJson(watchFile, { checkedAt: null, pages: [] });
  return { mode: 'files', checkedAt: file.checkedAt, pages: file.pages || [] };
}
