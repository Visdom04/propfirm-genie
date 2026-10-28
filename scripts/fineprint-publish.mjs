/**
 * Auto-publish grounded trading-term diffs. Manual flags are a fallback.
 *
 *   node scripts/fineprint-publish.mjs --auto
 *   node scripts/fineprint-publish.mjs
 *   node scripts/fineprint-publish.mjs --publish <id>
 *   node scripts/fineprint-publish.mjs --dismiss <id>
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyPublication, canPublish, decidePublication } from '../src/lib/fineprint/diff.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changesPath = path.join(root, 'src/data/fineprint/changes.json');
const pageDir = path.join(root, 'data/fineprint/pages');

function arg(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? '' : process.argv[index + 1] || '';
}

async function readText(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return '';
  }
}

async function snapshotFor(change, which) {
  const hash = which === 'before' ? change.beforeHash : change.afterHash;
  if (!hash) return '';
  const pageId = change.pageId || String(change.id || '').replace(/-[0-9a-f]{12}$/i, '');
  return readText(path.join(pageDir, 'versions', pageId, `${hash}.txt`));
}

/** Stored snapshots only. Rebuilding sides from the change's own quotes would ground it against itself. */
async function loadSides(change) {
  const before = await snapshotFor(change, 'before');
  const after = await snapshotFor(change, 'after');
  return before && after ? { before, after } : null;
}

const changes = JSON.parse(await readFile(changesPath, 'utf8'));
const publishId = arg('--publish');
const dismissId = arg('--dismiss');
const auto = process.argv.includes('--auto');

if (auto) {
  let published = 0;
  let dismissed = 0;
  for (const change of changes) {
    if (change.status !== 'needs_review') continue;
    const sides = await loadSides(change);
    if (!sides) {
      console.log(`skipped\tno_snapshot\t${change.id}`);
      continue;
    }
    const decision = decidePublication(change, { beforeText: sides.before, afterText: sides.after, liveText: sides.after });
    // Auto never clears the human queue it created.
    if (decision.status === 'needs_review') continue;
    applyPublication(change, decision);
    if (decision.status === 'published') published += 1;
    else dismissed += 1;
    console.log(`${decision.status}\t${decision.reason}\t${change.id}`);
  }
  await writeFile(changesPath, `${JSON.stringify(changes, null, 2)}\n`);
  console.log(`auto published ${published}, dismissed ${dismissed}`);
  process.exit(0);
}

if (!publishId && !dismissId) {
  const queue = changes.filter(change => change.status === 'needs_review');
  console.log(`${queue.length} in review`);
  for (const change of queue) {
    console.log(`${change.id}\t${change.firm}\t${change.title}`);
  }
  process.exit(0);
}

if (dismissId) {
  const change = changes.find(item => item.id === dismissId);
  if (!change) {
    console.error(`unknown ${dismissId}`);
    process.exit(1);
  }
  change.status = 'dismissed';
  await writeFile(changesPath, `${JSON.stringify(changes, null, 2)}\n`);
  console.log(`dismissed ${dismissId}`);
  process.exit(0);
}

const change = changes.find(item => item.id === publishId);
if (!change) {
  console.error(`unknown ${publishId}`);
  process.exit(1);
}

const sides = await loadSides(change);
if (!sides) {
  console.error(`refused ${publishId}: stored snapshots missing`);
  process.exit(1);
}
if (!canPublish(change, sides.before, sides.after)) {
  console.error(`refused ${publishId}: quotes are not grounded in stored text`);
  process.exit(1);
}

change.status = 'published';
change.publishedAt = new Date().toISOString();
await writeFile(changesPath, `${JSON.stringify(changes, null, 2)}\n`);
console.log(`published ${publishId}`);
