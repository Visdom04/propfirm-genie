/**
 * Two sensors per firm:
 *   1. Our plan table (same idea as Prop Firm Loop's auto-diff)
 *   2. Public pages, with a URL ladder and a reader fallback when WAF/DNS blocks
 *
 * First sight is a baseline. A new version is held as pending until a later
 * run fetches the same hash, so one odd fetch (A/B test, geo price, reader
 * glitch) never reaches the feed. Confirmed cards auto-publish only when
 * quotes are grounded and look like a trading term.
 *
 *   node scripts/fineprint-sync.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WATCHED_PAGES } from '../src/lib/fineprint/catalog.js';
import { delay, fetchFirstOk } from '../src/lib/fineprint/fetch.js';
import { applyPublication, decidePublication, detectChange, gateVersion, hashText, htmlToText } from '../src/lib/fineprint/diff.js';
import { snapshotFirmPlans } from '../src/lib/fineprint/snapshot.js';
import { firms } from '../src/data/firms.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageDir = path.join(root, 'data/fineprint/pages');
const changesPath = path.join(root, 'src/data/fineprint/changes.json');
const watchPath = path.join(root, 'src/data/fineprint/watch.json');

const firmsByName = new Map(firms.map(firm => [firm.name, firm]));

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

function recordOf(page, extra) {
  return {
    id: page.id,
    firm: page.firm,
    market: page.market,
    plan: page.plan,
    kind: page.kind,
    url: page.url,
    source: page.source,
    ...extra,
  };
}

async function writeVersion(page, text) {
  const hash = hashText(text);
  const versionDir = path.join(pageDir, 'versions', page.id);
  await mkdir(versionDir, { recursive: true });
  await writeFile(path.join(versionDir, `${hash}.txt`), text);
  return hash;
}

async function writeMeta(page, meta) {
  await writeFile(path.join(pageDir, `${page.id}.txt.meta.json`), JSON.stringify(meta, null, 2));
}

async function writeSnapshot(page, text, extraMeta) {
  const hash = await writeVersion(page, text);
  await writeFile(path.join(pageDir, `${page.id}.txt`), text);
  await writeMeta(page, { source: page.source || 'direct', url: page.url, hash, ...extraMeta });
  return hash;
}

async function applyText(page, text, { previous, previousMeta, detectedAt, changes, known }) {
  const hash = hashText(text);
  const source = page.source || 'direct';
  const row = extra => ({ row: recordOf(page, { hash, checkedAt: detectedAt, ...extra }), queued: 0 });

  if (!previous || (previousMeta.source || 'direct') !== source) {
    const state = previous ? 'rebaseline' : 'baseline';
    await writeSnapshot({ ...page, source }, text, { state });
    return row({ state, lines: text.split('\n').length });
  }

  const gate = gateVersion({ baseHash: hashText(previous), pendingHash: previousMeta.pendingHash, hash });
  if (gate === 'unchanged') {
    // Back to the baseline: whatever was pending was a one-off.
    if (previousMeta.pendingHash) {
      const { pendingHash, pendingSince, ...rest } = previousMeta;
      await writeMeta(page, rest);
    }
    return row({ state: 'unchanged' });
  }

  if (gate === 'pending') {
    await writeVersion(page, text);
    await writeMeta(page, { ...previousMeta, pendingHash: hash, pendingSince: detectedAt });
    return row({ state: 'pending' });
  }

  // Two separate fetches returned this exact text. Diff it against the baseline.
  const firstSeen = previousMeta.pendingSince || detectedAt;
  const change = detectChange(previous, text, { ...page, detectedAt: firstSeen });
  await writeVersion(page, previous);
  await writeSnapshot({ ...page, source }, text, { state: change ? 'changed' : 'noise' });
  if (!change) return row({ state: 'noise' });
  // Plan table is our sheet, not the firm's page. Do not put it on the feed.
  if (source === 'plans') return row({ state: 'changed', note: 'plan table drift' });

  change.beforeHash = hashText(previous);
  change.afterHash = hash;
  change.confirmedAt = detectedAt;
  applyPublication(change, decidePublication(change, { beforeText: previous, afterText: text, liveText: text }), detectedAt);
  const result = row({
    state: change.status === 'dismissed' ? 'noise' : 'changed',
    changeId: change.id,
    publishReason: change.publishReason,
  });
  if (!known.has(change.id) && change.status !== 'dismissed') {
    changes.unshift(change);
    known.add(change.id);
    result.queued = 1;
  }
  return result;
}

async function syncPlans(page, ctx) {
  const firm = firmsByName.get(page.firm);
  const text = snapshotFirmPlans(firm || { name: page.firm, plans: [] });
  const file = path.join(pageDir, `${page.id}.txt`);
  const previous = await readText(file);
  const previousMeta = await readJson(`${file}.meta.json`, { source: 'plans' });
  const result = await applyText({ ...page, source: 'plans' }, text, { ...ctx, previous, previousMeta });
  result.row.planCount = firm?.plans?.length || 0;
  if (!firm) result.row.note = 'not in plan table yet';
  return result;
}

async function syncPage(page, ctx) {
  const file = path.join(pageDir, `${page.id}.txt`);
  const previous = await readText(file);
  const previousMeta = await readJson(`${file}.meta.json`, {});
  const fetched = await fetchFirstOk(page.urls || [page.url]);
  if (fetched.status !== 200 || !fetched.body) {
    return {
      row: recordOf(page, {
        state: fetched.status === 0 ? 'error' : 'blocked',
        httpStatus: fetched.status,
        error: fetched.error,
        checkedAt: ctx.detectedAt,
        hash: previous ? hashText(previous) : null,
      }),
      queued: 0,
    };
  }
  const text = htmlToText(fetched.body);
  const result = await applyText(
    { ...page, source: fetched.source, url: fetched.watchedUrl || fetched.finalUrl || page.url },
    text,
    { ...ctx, previous, previousMeta },
  );
  result.row.fetchSource = fetched.source;
  result.row.httpStatus = fetched.status;
  return result;
}

async function main() {
  await mkdir(pageDir, { recursive: true });
  const changes = await readJson(changesPath, []);
  const known = new Set(changes.map(change => change.id));
  const pages = [];
  const detectedAt = new Date().toISOString();
  const ctx = { detectedAt, changes, known };
  let queued = 0;

  for (const page of WATCHED_PAGES) {
    const result = page.source === 'plans' ? await syncPlans(page, ctx) : await syncPage(page, ctx);
    pages.push(result.row);
    queued += result.queued;
    const tag = result.row.state.toUpperCase().padEnd(10);
    console.log(`${tag} ${page.id}${result.row.httpStatus ? `  ${result.row.httpStatus}` : ''}${result.row.fetchSource ? `  ${result.row.fetchSource}` : ''}`);
    if (page.source !== 'plans') await delay(350);
  }

  await writeFile(changesPath, `${JSON.stringify(changes, null, 2)}\n`);
  await writeFile(
    watchPath,
    `${JSON.stringify(
      {
        updatedAt: detectedAt,
        pages,
        firms: summarizeFirms(pages),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`queued ${queued}`);
}

function summarizeFirms(pages) {
  const groups = new Map();
  for (const page of pages) {
    const list = groups.get(page.firm) || [];
    list.push(page);
    groups.set(page.firm, list);
  }
  return [...groups.entries()].map(([firm, list]) => {
    const live = list.some(item => item.source !== 'plans' && !['blocked', 'error'].includes(item.state));
    const plans = list.find(item => item.source === 'plans');
    const blocked = list.filter(item => item.state === 'blocked' || item.state === 'error');
    return {
      firm,
      market: list[0].market,
      state: live || (plans && plans.planCount > 0) ? 'watching' : blocked.length ? 'blocked' : 'waiting',
      pages: list.length,
      live,
      plans: plans?.planCount || 0,
    };
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
