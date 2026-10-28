/**
 * Compare public sitemaps (and optional local XML dumps) with the cameras we watch.
 * Never adds a URL. Prints keep / unknown / skip so a human can pin the next camera.
 *
 *   node scripts/fineprint-sitemap.mjs
 *   node scripts/fineprint-sitemap.mjs --file data/fineprint/sitemaps/tradeify.xml
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITEMAP_FEEDS, reviewSitemap } from '../src/lib/fineprint/cameras.js';
import { fetchOnce } from '../src/lib/fineprint/fetch.js';
import { STARTER_PAGES } from '../src/lib/fineprint/starter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const known = STARTER_PAGES.map(page => page.url);
const localDir = path.join(root, 'data/fineprint/sitemaps');

function printGroup(title, rows, limit = 20) {
  console.log(`\n${title} (${rows.length})`);
  for (const row of rows.slice(0, limit)) {
    console.log(`  ${row.reason.padEnd(16)} ${row.url}`);
  }
  if (rows.length > limit) console.log(`  … ${rows.length - limit} more`);
}

async function reviewOne(label, xml) {
  const report = reviewSitemap(xml, known);
  console.log(`\n=== ${label} ===`);
  printGroup('not watching, looks like a rule/price page', report.keep);
  printGroup('not watching, unknown — paste these if they state a trader rule', report.unknown, 30);
  printGroup('skipped on purpose', report.skip, 8);
  console.log(`already watching: ${report.already.length}`);
}

async function main() {
  const fileFlag = process.argv.indexOf('--file');
  if (fileFlag !== -1) {
    const file = path.resolve(root, process.argv[fileFlag + 1]);
    await reviewOne(file, await readFile(file, 'utf8'));
    return;
  }

  try {
    const dumped = await readdir(localDir);
    for (const name of dumped.filter(item => item.endsWith('.xml'))) {
      await reviewOne(name, await readFile(path.join(localDir, name), 'utf8'));
    }
  } catch {
    // No local dumps yet.
  }

  for (const feed of SITEMAP_FEEDS) {
    const fetched = await fetchOnce(feed.url, { timeoutMs: 15000 });
    if (fetched.status !== 200 || !fetched.body) {
      console.log(`\n=== ${feed.firm} ===\n  sitemap ${fetched.status} at ${feed.url}`);
      continue;
    }
    await reviewOne(feed.firm, fetched.body);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
