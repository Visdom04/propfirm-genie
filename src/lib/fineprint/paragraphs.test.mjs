import assert from 'node:assert/strict';
import { pageIsBlocked, pageIsComplete, pageIsMaintenance, paragraphCards, usableParagraph } from './paragraphs.js';
import { readyStarterPages, STARTER_PAGES } from './starter.js';

const filler = Array.from({ length: 10 }, (_, i) => `Unchanged rule number ${i} stays on the page for the whole month.`).join('\n');

const before = `${filler}
The evaluation fee for the $25,000 account is $167 and it is charged once.
The maximum loss limit is $2,000 and trails the end-of-day balance.
High-frequency trading is allowed on funded accounts in this program.`;

const after = `${filler}
The evaluation fee for the $25,000 account is $149 and it is charged once.
The maximum loss limit is $2,000 and trails the intraday high.
High-frequency trading is not permitted on funded accounts in this program.`;

const cards = paragraphCards(before, after, {
  id: 'apex-eval-rules',
  firm: 'Apex Trader Funding',
  market: 'futures',
  kind: 'rules',
  url: 'https://support.apextraderfunding.com/hc/en-us/articles/31519769997083-Evaluation-Rules',
  detectedAt: '2026-10-22T00:00:00.000Z',
});

assert.equal(cards.length, 3);
assert.ok(cards.every(card => before.includes(card.facts[0].beforeLine)));
assert.ok(cards.every(card => after.includes(card.facts[0].afterLine)));
assert.equal(cards[0].status, 'published');
assert.match(cards[0].summary, /\$167/);
assert.match(cards[0].summary, /\$149/);

const coupon = paragraphCards(
  `${before}\nLimited time — use code SAVE for 20% off the fee today only.`,
  `${after}\nLimited time — use code SAVE for 30% off the fee today only.`,
  { id: 'lucid', firm: 'Lucid Trading', market: 'futures', kind: 'rules', url: 'https://example.com', detectedAt: '2026-10-22' },
);
assert.ok(coupon.every(card => !/use code/i.test(card.summary)));

assert.equal(paragraphCards('too short', after, { id: 'x', firm: 'X', url: 'https://example.com' }).length, 0);
assert.equal(pageIsBlocked('Title: Just a moment...\nWarning: Target URL returned error 403: Forbidden'), true);
assert.equal(pageIsMaintenance("We'll Be Right Back! Scheduled maintenance in progress. Site temporarily offline."), true);
assert.equal(pageIsComplete(before), true);
assert.equal(pageIsComplete(''), false);
assert.equal(usableParagraph('Limited time — use code SAVE for 20% off the fee today only.'), false);

const inserted = paragraphCards(
  before,
  `${before}\nNews trading is forbidden during high-impact events on this evaluation account.`,
  { id: 'insert', firm: 'Apex Trader Funding', market: 'futures', kind: 'rules', url: 'https://example.com', detectedAt: '2026-10-22' },
);
assert.equal(inserted.length, 1);
assert.equal(inserted[0].facts[0].beforeLine, '');
assert.match(inserted[0].summary, /News trading is forbidden/);
assert.ok(!inserted.some(card => /\$167/.test(card.summary) && /News trading/.test(card.summary)));

assert.deepEqual(
  [...new Set(readyStarterPages().map(page => page.firm))].sort(),
  [
    'Apex Trader Funding',
    'Bulenox',
    'FundedNext Futures',
    'Legends Trading',
    'Lucid Trading',
    'My Funded Perps',
    'Take Profit Trader',
    'Tradeify',
    'Vest Markets',
  ],
);
assert.ok(readyStarterPages().every(page => page.url));
assert.ok(!STARTER_PAGES.some(page => /support\.apextraderfunding\.com|help\.lucidtrading\.com/.test(page.url)));
const starterIds = readyStarterPages().map(page => page.id);
assert.equal(starterIds.length, new Set(starterIds).size);
assert.ok(starterIds.includes('apex-pa-activation'));
assert.ok(starterIds.includes('apex-intraday-payouts'));
assert.ok(starterIds.includes('tradeify-select-payouts'));
assert.ok(starterIds.includes('tradeify-trailing'));
assert.ok(starterIds.includes('lucid-flex-eval'));
assert.ok(starterIds.includes('lucid-daily-payouts'));
assert.ok(starterIds.includes('lucid-direct-payouts'));
assert.ok(starterIds.includes('mfp-elite'));
assert.ok(starterIds.includes('tpt-rule-5'));
assert.ok(starterIds.includes('fnf-flex-rules'));
assert.ok(starterIds.includes('legends-payouts'));
assert.ok(starterIds.includes('bulenox-qualification'));

console.log('paragraphs.test.mjs ok');
