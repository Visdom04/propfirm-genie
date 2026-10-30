/**
 * Daily photograph of the starter rules pages.
 * First good copy is stored and publishes nothing.
 * A different copy is held until the next run returns the same text.
 * Cards are the changed paragraphs, and only those.
 *
 *   node scripts/fineprint-starter.mjs
 *
 * GitHub Actions runs this every morning (.github/workflows/fineprint-starter.yml)
 * and commits the saved pages. With SUPABASE_SERVICE_ROLE_KEY set, new cards and
 * each page's result also go to Supabase, which is what the site reads.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateVersion, hashText, htmlToText } from '../src/lib/fineprint/diff.js';
import { delay, fetchFirstOk, robotsAllowsUrl } from '../src/lib/fineprint/fetch.js';
import { pageIsBlocked, pageIsComplete, pageIsMaintenance, paragraphCards } from '../src/lib/fineprint/paragraphs.js';
import { crawlGapMs, readyStarterPages, STARTER_PAGES } from '../src/lib/fineprint/starter.js';
import { serviceClient, toRow, watchRow } from '../src/lib/fineprint/db.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageDir = path.join(root, 'data/fineprint/starter');
const changesPath = path.join(root, 'src/data/fineprint/changes.json');
const watchPath = path.join(root, 'src/data/fineprint/starter-watch.json');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function readText(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return '';
  }
}

async function main() {
  await mkdir(pageDir, { recursive: true });
  const changes = await readJson(changesPath, []);
  const known = new Set(changes.map(change => change.id));
  const detectedAt = new Date().toISOString();
  const report = [];
  const posted = [];

  for (const page of STARTER_PAGES) {
    if (!page.ready || !page.url) {
      report.push({ id: page.id, firm: page.firm, state: 'waiting_for_rules_url' });
      continue;
    }
    if (report.length) await delay(crawlGapMs(page));
    const file = path.join(pageDir, `${page.id}.txt`);
    const metaFile = `${file}.meta.json`;
    const previous = await readText(file);
    const meta = await readJson(metaFile, {});
    // The site's robots.txt is the answer. We do not fetch what it disallows.
    if (!(await robotsAllowsUrl(page.url))) {
      report.push({ id: page.id, firm: page.firm, state: 'robots_disallowed' });
      continue;
    }
    const fetched = await fetchFirstOk([page.url]);
    const text = htmlToText(fetched.body || '');
    if (pageIsMaintenance(text)) {
      report.push({ id: page.id, firm: page.firm, state: 'maintenance', status: fetched.status, source: fetched.source });
      continue;
    }
    if (pageIsBlocked(text) || fetched.status !== 200 || !fetched.body) {
      report.push({ id: page.id, firm: page.firm, state: 'blocked', status: fetched.status, source: fetched.source });
      continue;
    }
    if (!pageIsComplete(text)) {
      report.push({ id: page.id, firm: page.firm, state: 'incomplete', lines: text.split('\n').length, source: fetched.source });
      continue;
    }
    const hash = hashText(text);
    if (!previous) {
      await writeFile(file, text);
      await writeFile(metaFile, JSON.stringify({ url: page.url, hash, state: 'baseline', checkedAt: detectedAt }, null, 2));
      report.push({ id: page.id, firm: page.firm, state: 'baseline' });
      continue;
    }
    const gate = gateVersion({ baseHash: hashText(previous), pendingHash: meta.pendingHash, hash });
    if (gate === 'unchanged') {
      report.push({ id: page.id, firm: page.firm, state: 'unchanged' });
      continue;
    }
    if (gate === 'pending') {
      const versionDir = path.join(pageDir, 'versions', page.id);
      await mkdir(versionDir, { recursive: true });
      await writeFile(path.join(versionDir, `${hash}.txt`), text);
      await writeFile(metaFile, JSON.stringify({ ...meta, pendingHash: hash, pendingSince: detectedAt, state: 'pending', checkedAt: detectedAt }, null, 2));
      report.push({ id: page.id, firm: page.firm, state: 'pending' });
      continue;
    }
    const cards = paragraphCards(previous, text, { ...page, detectedAt: meta.pendingSince || detectedAt });
    await writeFile(file, text);
    await writeFile(metaFile, JSON.stringify({ url: page.url, hash, state: cards.length ? 'changed' : 'noise', checkedAt: detectedAt }, null, 2));
    let count = 0;
    for (const card of cards) {
      if (known.has(card.id)) continue;
      const live = { ...card, origin: 'watcher', status: 'published', publishedAt: detectedAt, trending: false, confirmedAt: detectedAt };
      changes.unshift(live);
      posted.push(live);
      known.add(card.id);
      count += 1;
    }
    report.push({ id: page.id, firm: page.firm, state: count ? 'posted' : 'noise', cards: count });
  }

  const urls = new Map(STARTER_PAGES.map(page => [page.id, page.url]));
  const previousWatch = await readJson(watchPath, { pages: [] });
  const before = new Map((previousWatch.pages || []).map(row => [row.id, { url: row.url, last_ok_at: row.lastOkAt, fail_streak: row.failStreak }]));
  const db = serviceClient();
  if (db) {
    const { data } = await db.from('fineprint_watch').select('page_id, url, last_ok_at, fail_streak');
    for (const row of data || []) before.set(row.page_id, row);
  }
  const rows = report.map(row => watchRow({ ...row, url: urls.get(row.id) }, before.get(row.id), detectedAt));

  await writeFile(changesPath, `${JSON.stringify(changes, null, 2)}\n`);
  await writeFile(
    watchPath,
    `${JSON.stringify(
      {
        checkedAt: detectedAt,
        pages: rows.map(row => ({
          id: row.page_id,
          firm: row.firm,
          url: row.url,
          state: row.state,
          status: row.http_status ?? undefined,
          source: row.source ?? undefined,
          cards: row.cards || undefined,
          lastOkAt: row.last_ok_at,
          failStreak: row.fail_streak,
        })),
      },
      null,
      2,
    )}\n`,
  );

  if (db) {
    // ignoreDuplicates: a card an admin hid stays hidden when the same id comes round again.
    if (posted.length) {
      const { error } = await db.from('fineprint_changes').upsert(posted.map(toRow), { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw new Error(`Saving cards to Supabase failed: ${error.message}`);
    }
    const { error } = await db.from('fineprint_watch').upsert(rows);
    if (error) throw new Error(`Saving the watch report to Supabase failed: ${error.message}`);
  } else {
    console.log('SUPABASE_SERVICE_ROLE_KEY not set: wrote JSON files only.');
  }

  const failing = rows.filter(row => row.fail_streak >= 3);
  if (failing.length) {
    console.log(`::warning::${failing.length} pages have failed 3+ checks in a row: ${failing.map(row => row.page_id).join(', ')}`);
  }
  for (const row of report) {
    console.log(`${row.firm}${row.id ? ` ${row.id}` : ''}: ${row.state}${row.cards ? ` (${row.cards})` : ''}`);
  }
  console.log(`ready now: ${readyStarterPages().map(page => page.id).join(', ')}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
