import assert from 'node:assert/strict';
import { PAYOUT_FIRMS } from './catalog.js';
import {
  BUCKETS,
  HIST_LABELS,
  keepPayout,
  median,
  mixCols,
  rankFirms,
  recentBatches,
  rollFirm,
  windowTuple,
  windowView,
} from './rollup.js';
import { seedEvents } from './seed.js';
import { buildSnapshot } from './snapshot.js';

assert.equal(HIST_LABELS.length, BUCKETS.length + 1);
assert.equal(median([1, 2, 3]), 2);
assert.equal(median([2, 4]), 3);
assert.equal(keepPayout({ amount: 10, kind: 'internal' }), false);
assert.equal(keepPayout({ amount: 10, to: '0xabc', kind: 'payout' }, new Set(['0xabc'])), false);
assert.equal(keepPayout({ amount: 10, kind: 'payout' }), true);

const now = Date.parse('2026-10-29T22:00:00Z');
const firm = PAYOUT_FIRMS[0];
const events = [
  { firmId: firm.id, amount: 100, at: now - 2 * 3600000, kind: 'payout' },
  { firmId: firm.id, amount: 250, at: now - 26 * 3600000, kind: 'payout' },
  { firmId: firm.id, amount: 400, at: now - 10 * 86400000, kind: 'payout' },
];
const d1 = windowView(windowTuple(events, 'd1', now));
assert.equal(d1.count, 1);
assert.equal(d1.amount, 100);
const d7 = windowView(windowTuple(events, 'd7', now));
assert.equal(d7.count, 2);
const rolled = rollFirm(firm, events, now, now);
assert.equal(rolled.hours.length, 168);
assert.equal(rolled.days.length, 90);
assert.equal(rolled.hist30.reduce((sum, n) => sum + n, 0), 3);
assert.equal(rolled.recent[0][1], 100);

const snap = buildSnapshot({ now, events: seedEvents(now) });
assert.equal(snap.v, 1);
assert.equal(snap.firms.length, PAYOUT_FIRMS.length);
assert.ok(snap.firms.every(item => item.hours.length === 168));
const ranked = rankFirms(snap.firms, 'd7');
assert.ok(windowView(ranked[0].d7).amount >= windowView(ranked[1].d7).amount);
const mix = mixCols(snap.firms, 'd7', snap.hour);
assert.equal(mix.length, 42);
assert.ok(mix.some(col => col.total > 0));

// A firm with hundreds of thousands of payouts must still roll up (spread args used to overflow the stack).
const big = Array.from({ length: 250000 }, (_, i) => ({ firmId: firm.id, amount: 10 + (i % 90), at: now - (i % 5000) * 6e4, kind: 'payout' }));
const bigRoll = rollFirm(firm, big, now, Math.floor(now / 36e5) * 36e5);
assert.equal(bigRoll.all[0], 250000);
assert.ok(bigRoll.months.length >= 1);

console.log('rollup.test.mjs ok');

const burst = [
  { firmId: 'x', amount: 100, at: now - 1000, tx: '0xa', chain: 'arbitrum' },
  { firmId: 'x', amount: 50, at: now - 2000, tx: '0xb', chain: 'arbitrum' },
  { firmId: 'x', amount: 25, at: now - 3 * 36e5, tx: '0xc', chain: 'arbitrum' },
];
const groups = recentBatches(burst);
assert.equal(groups.length, 2);
assert.equal(groups[0][1], 2);
assert.equal(groups[0][2], 150);
assert.deepEqual(groups[0][3][0], ['0xa', 100, 'arbitrum']);
assert.equal(groups[1][1], 1);
console.log('recentBatches ok');
