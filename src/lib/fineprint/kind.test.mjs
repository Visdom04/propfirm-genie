import assert from 'node:assert/strict';
import { classifyKind, factKind, stampFact } from './kind.js';

assert.equal(classifyKind('Payout terms'), 'payouts');
assert.equal(classifyKind('Daily loss limit'), 'rules');
assert.equal(classifyKind('Activation fee'), 'pricing');

assert.equal(factKind({ kind: 'payouts' }, { label: 'Payout cycle' }), 'payouts');
assert.equal(factKind({ kind: 'rules' }, { kind: 'payouts', label: 'Payout terms' }), 'payouts');
assert.equal(factKind({ kind: 'rules' }, { label: 'Profit target' }), 'rules');
assert.equal(
  factKind({ kind: 'faq', title: 'Payout policy', sourceUrl: '/payout-policy' }, { label: 'Payout cycle' }),
  'payouts',
);

assert.equal(stampFact({ label: 'Payout cycle' }).kind, 'payouts');
assert.equal(stampFact({ label: 'Daily loss' }, 'rules').kind, 'rules');

console.log('kind.test.mjs ok');
