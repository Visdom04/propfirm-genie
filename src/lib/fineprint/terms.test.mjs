import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deltaLabel, judgeChange, suggestVerdict, verdictOf } from './terms.js';

const verdict = (a, b) => judgeChange(a, b)?.verdict ?? null;

// Real sentences from the starter snapshots, with one number moved.
const golden = [
  ['$50,000 accounts have a $1,200 Daily Loss Limit.', '$50,000 accounts have a $1,000 Daily Loss Limit.', 'worse'],
  ['**Daily Loss Limit**$500$1,000$1,500$2,000', '**Daily Loss Limit**$500$1,000$1,250$2,000', 'worse'],
  ['Profit Target$1,500$3,000$6,000$9,000', 'Profit Target$1,500$2,500$6,000$9,000', 'better'],
  ['Starting Balance: $50,000Maximum Drawdown: $2,000', 'Starting Balance: $50,000Maximum Drawdown: $2,500', 'better'],
  ['* Minimum 5 trading days that meet the required minimum daily profit', '* Minimum 3 trading days that meet the required minimum daily profit', 'better'],
  ['* Minimum payout amount: $500', '* Minimum payout amount: $250', 'better'],
  ['The 50% Consistency ensures that no single trading day accounts for more than 50% of your total accumulated profit.', 'The 40% Consistency ensures that no single trading day accounts for more than 50% of your total accumulated profit.', 'worse'],
  ['- Your largest single-day profit must be no more than 20% of your total profit during the payout cycle.', '- Your largest single-day profit must be no more than 30% of your total profit during the payout cycle.', 'unscored'],
  ['Max position size: 2 contracts', 'Max position size: 4 contracts', 'better'],
  ['Payout cycle 14 days', 'Payout cycle 7 days', 'better'],
  ['* Up to weekly payouts with 90% payout split', '* Up to weekly payouts with 80% payout split', 'worse'],
  ['The evaluation fee for the $25,000 account is $167 and it is charged once.', 'The evaluation fee for the $25,000 account is $149 and it is charged once.', 'better'],
  ['Vest daily loss 4%', 'Vest daily loss 3%', 'worse'],
];
for (const [a, b, want] of golden) assert.equal(verdict(a, b), want, a);

// Traps. Each must refuse to judge, never guess.
const traps = [
  // Two numbers moved: list price beside sale price.
  ['One Time Fee $123 $90.60', 'One Time Fee $108 $64.80'],
  // Both sides of a split moved.
  ['- All funded account payouts are split 90% to the trader and 10% to Lucid Trading.', '- All funded account payouts are split 80% to the trader and 20% to Lucid Trading.'],
  // Sentence reworded as well as renumbered.
  ['Daily loss limit is $1,000.', 'The daily loss limit is now $900.'],
  // No term near the number.
  ['You may hold up to 20 PAs active at the same time.', 'You may hold up to 10 PAs active at the same time.'],
  // Same numbers, different words.
  ['The maximum loss limit is $2,000 and trails the end-of-day balance.', 'The maximum loss limit is $2,000 and trails the intraday high.'],
];
for (const [a, b] of traps) assert.equal(judgeChange(a, b), null, a);

// Known term, wrong unit: minutes beside "profit target" is not a target.
assert.equal(
  verdict('- Real-time activation, upgrade to funded account within 5-30 minutes of hitting profit target', '- Real-time activation, upgrade to funded account within 5-60 minutes of hitting profit target'),
  'unscored',
);
// Payout wording without a direction stays neutral.
assert.equal(verdict('Payout review takes 5 days', 'Payout review takes 10 days'), 'unscored');
// Unit swap is not comparable.
assert.equal(judgeChange('Daily loss limit $3', 'Daily loss limit 3%'), null);

// Hand-written demo facts must agree with the judge, or the demo teaches traders the wrong thing.
const demo = JSON.parse(readFileSync(new URL('../../data/fineprint/demo-changes.json', import.meta.url), 'utf8'));
for (const change of demo) {
  for (const fact of change.facts) {
    const judged = judgeChange(fact.beforeLine, fact.afterLine);
    assert.ok(judged, `${change.id}: demo sentence must be judgeable`);
    assert.deepEqual([fact.label, fact.before, fact.after, fact.verdict], [judged.label, judged.before, judged.after, judged.verdict], change.id);
  }
}

assert.equal(deltaLabel('$1,200', '$1,000'), '−16.7%');
assert.equal(deltaLabel('14', '7'), '−50%');
assert.equal(deltaLabel('50%', '40%'), '−10 pts');
assert.equal(deltaLabel('4%', '3%'), '−1 pt');
assert.equal(deltaLabel('$2,000', '$2,500'), '+25%');
assert.equal(deltaLabel('5-day trading minimum', '3 trading days'), '');

// Old records said good / neutral.
assert.equal(verdictOf('good'), 'better');
assert.equal(verdictOf('neutral'), 'unscored');
assert.equal(verdictOf(undefined), 'unscored');

assert.equal(suggestVerdict('Daily loss limit', '$1,200', '$1,000'), 'worse');
assert.equal(suggestVerdict('Profit target', '$3,000', '$2,500'), 'better');
assert.equal(suggestVerdict('News trading', 'allowed', 'banned'), 'unscored');

console.log('terms.test.mjs ok');
