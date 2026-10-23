/**
 * Daily photograph of the starter rules pages.
 * First good copy is stored and publishes nothing.
 * A different copy is held until the next run returns the same text.
 * Cards are the changed paragraphs, and only those.
 *
 *   node scripts/fineprint-starter.mjs
 *
 * GitHub Actions runs this every morning (.github/workflows/fineprint-starter.yml)
 * and commits the saved pages. That commit is what Vercel deploys.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateVersion, hashText, htmlToText } from '../src/lib/fineprint/diff.js';
import { fetchFirstOk, fetchWithRetry, readerMirrors } from '../src/lib/fineprint/fetch.js';
import { pageIsBlocked, pageIsComplete, pageIsMaintenance, paragraphCards } from '../src/lib/fineprint/paragraphs.js';
import { readyStarterPages, STARTER_PAGES } from '../src/lib/fineprint/starter.js';

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

  for (const page of STARTER_PAGES) {
    if (!page.ready || !page.url) {
      report.push({ id: page.id, firm: page.firm, state: 'waiting_for_rules_url' });
      continue;
    }
    const file = path.join(pageDir, `${page.id}.txt`);
    const metaFile = `${file}.meta.json`;
    const previous = await readText(file);
    const meta = await readJson(metaFile, {});
    let fetched = await fetchFirstOk([page.url]);
    let text = htmlToText(fetched.body || '');
    if (pageIsMaintenance(text) || pageIsBlocked(text) || !pageIsComplete(text) || fetched.status !== 200) {
      for (const viaUrl of readerMirrors(page.url)) {
        const via = await fetchWithRetry(viaUrl, { retries: 1 });
        const readerText = htmlToText(via.body || '');
        if (via.status === 200 && via.body && !pageIsMaintenance(readerText) && !pageIsBlocked(readerText) && pageIsComplete(readerText)) {
          fetched = { ...via, source: 'reader', watchedUrl: page.url };
          text = readerText;
          break;
        }
      }
    }
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
    let queued = 0;
    for (const card of cards) {
      if (known.has(card.id)) continue;
      changes.unshift({ ...card, publishedAt: detectedAt, confirmedAt: detectedAt });
      known.add(card.id);
      queued += 1;
    }
    report.push({ id: page.id, firm: page.firm, state: queued ? 'published' : 'noise', cards: queued });
  }

  await writeFile(changesPath, `${JSON.stringify(changes, null, 2)}\n`);
  await writeFile(watchPath, `${JSON.stringify({ checkedAt: detectedAt, pages: report }, null, 2)}\n`);
  for (const row of report) {
    console.log(`${row.firm}${row.id ? ` ${row.id}` : ''}: ${row.state}${row.cards ? ` (${row.cards})` : ''}`);
  }
  console.log(`ready now: ${readyStarterPages().map(page => page.id).join(', ')}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
