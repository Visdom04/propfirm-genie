import assert from 'node:assert/strict';
import {
  canPublish,
  decidePublication,
  detectChange,
  diffTexts,
  gateVersion,
  htmlToText,
  isNoiseLine,
  quotesAreGrounded,
} from './diff.js';

const meta = {
  id: 'sample',
  firm: 'Sample Firm',
  market: 'futures',
  plan: 'Select',
  kind: 'pricing',
  url: 'https://example.com/rules',
  detectedAt: '2026-10-20T00:00:00.000Z',
};

const same = detectChange('Price is $44\nMonthly', 'Price is $44\nMonthly', meta);
assert.equal(same, null);

const promo = detectChange('Use code SAVE: 10% OFF', 'Use code SAVE: 20% OFF', meta);
assert.equal(promo, null);

const price = detectChange('Evaluation fee $44\nReward cycle Monthly', 'Evaluation fee $39\nReward cycle On demand', meta);
assert.ok(price);
assert.equal(price.status, 'needs_review');
assert.equal(price.facts[0].before, '$44');
assert.equal(price.facts[0].after, '$39');
assert.equal(price.facts[0].verdict, 'good');
assert.ok(price.hunks.some(hunk => hunk.removed.includes('Reward cycle Monthly')));
assert.ok(price.hunks.some(hunk => hunk.added.includes('Reward cycle On demand')));

const html = htmlToText('<style>body{}</style><p>Daily loss <b>$1,000</b></p><script>alert(1)</script>');
assert.equal(html, 'Daily loss $1,000');
assert.match(
  htmlToText('<p>Daily loss $1,000</p><p>This Font Software is licensed under the SIL Open Font License, Version 1.1. Copyright (c) 2023, Intercom, Inc.</p>'),
  /^Daily loss \$1,000$/,
);
assert.equal(
  htmlToText(`<p>Daily loss $1,000</p><p>${JSON.stringify({ docsConfig: { collectionId: 'abc' } })}${'x'.repeat(700)}</p>`),
  'Daily loss $1,000',
);
assert.equal(isNoiseLine('12,401 reviews'), true);
assert.equal(isNoiseLine('this.classList.remove(\'copied\') data-cf-modified-abc="" data-code="X"'), true);
assert.equal(
  detectChange(
    'this.classList.remove(\'copied\') data-cf-modified-aaa=""',
    'this.classList.remove(\'copied\') data-cf-modified-bbb=""',
    meta,
  ),
  null,
);
assert.equal(diffTexts('A\nB', 'A\nC')[0].removed[0], 'B');

assert.equal(quotesAreGrounded(price, 'Evaluation fee $44\nReward cycle Monthly', 'Evaluation fee $39\nReward cycle On demand'), true);
assert.equal(quotesAreGrounded(price, 'Evaluation fee $10', 'Evaluation fee $39\nReward cycle On demand'), false);
assert.equal(canPublish({ ...price, status: 'needs_review' }, 'Evaluation fee $44\nReward cycle Monthly', 'Evaluation fee $39\nReward cycle On demand'), true);
assert.equal(canPublish({ ...price, summary: '' }, 'Evaluation fee $44\nReward cycle Monthly', 'Evaluation fee $39\nReward cycle On demand'), false);
assert.equal(
  canPublish(
    { ...price, facts: [{ label: 'Listed price', before: '$99', after: '$39' }] },
    'Evaluation fee $44\nReward cycle Monthly',
    'Evaluation fee $39\nReward cycle On demand',
  ),
  false,
);

const before = 'Evaluation fee $44\nReward cycle Monthly';
const after = 'Evaluation fee $39\nReward cycle On demand';
assert.equal(decidePublication(price, { beforeText: before, afterText: after, liveText: after }).status, 'published');
assert.equal(decidePublication(price, { beforeText: before, afterText: after, liveText: 'Welcome to the firm' }).status, 'dismissed');

const headline = detectChange(
  'For Traders Who Want Simple Rules\nProfit Target $1,500\nMax Drawdown $500, fixed',
  'Rated 10/10 on PropScore',
  meta,
);
assert.ok(headline);
assert.equal(
  decidePublication(headline, {
    beforeText: 'For Traders Who Want Simple Rules\nProfit Target $1,500\nMax Drawdown $500, fixed',
    afterText: 'Rated 10/10 on PropScore',
    liveText: 'Rated 10/10 on PropScore',
  }).reason,
  'no_trade_signal',
);

const payout = detectChange('Payout cycle Monthly', 'Payout cycle On demand', { ...meta, kind: 'rules' });
assert.equal(
  decidePublication(payout, {
    beforeText: 'Payout cycle Monthly',
    afterText: 'Payout cycle On demand',
    liveText: 'Payout cycle On demand',
  }).status,
  'published',
);

const publish = (a, b) => {
  const change = detectChange(a, b, meta);
  return change && { change, decision: decidePublication(change, { beforeText: a, afterText: b, liveText: b }) };
};

// More drawdown helps the trader, and it is not a price.
const drawdown = publish('Max drawdown $2,000', 'Max drawdown $2,500').change.facts[0];
assert.deepEqual([drawdown.label, drawdown.verdict], ['Drawdown', 'good']);

// Numbers pair inside one sentence only.
const split = publish('Profit split 80%\nDaily loss 5%', 'Profit split 80%\nDaily loss 4%\nConsistency 40%').change.facts;
assert.equal(split.length, 1);
assert.deepEqual([split[0].label, split[0].before, split[0].after, split[0].verdict], ['Drawdown', '5%', '4%', 'worse']);
assert.equal(publish('Profit target $3,000', 'Profit target $2,500').change.facts[0].verdict, 'good');
assert.equal(publish('Consistency rule 40%', 'Consistency rule 30%').change.facts[0].verdict, 'neutral');

// A trading term keeps the line even when it says "review".
const review = publish('Payout review takes 5 days', 'Payout review takes 10 days');
assert.equal(review.decision.status, 'published');
assert.equal(review.change.facts[0].label, 'Payout terms');
assert.equal(isNoiseLine('12,401 reviews'), true);
assert.equal(isNoiseLine('Evaluation price $79, 20% off'), true);
assert.equal(publish('One Time Fee $123 $90.60', 'One Time Fee $108 $64.80').change.facts.length, 0);
assert.equal(publish('Limited time — Savings total $20', 'w/ coupon at checkout'), null);

// One edit on a long page still produces a fact.
const long = Array.from({ length: 2600 }, (_, i) => `line ${i}`);
const longBefore = [...long];
longBefore[1300] = 'Profit target $2,500';
const longAfter = [...long];
longAfter[1300] = 'Profit target $3,000';
const longChange = publish(longBefore.join('\n'), longAfter.join('\n'));
assert.equal(longChange.decision.status, 'published');
assert.equal(longChange.change.facts[0].after, '$3,000');

assert.equal(gateVersion({ baseHash: 'a', pendingHash: undefined, hash: 'a' }), 'unchanged');
assert.equal(gateVersion({ baseHash: 'a', pendingHash: undefined, hash: 'b' }), 'pending');
assert.equal(gateVersion({ baseHash: 'a', pendingHash: 'b', hash: 'b' }), 'confirmed');
assert.equal(gateVersion({ baseHash: 'a', pendingHash: 'b', hash: 'c' }), 'pending');
assert.equal(gateVersion({ baseHash: 'a', pendingHash: 'b', hash: 'a' }), 'unchanged');
assert.equal(publish('x', 'x'), null);

assert.equal(isNoiseLine('{"docsConfig":{"theme":"mint"}}'), true);
assert.equal(isNoiseLine('![Image 42](https://t.co/i/adsct?payout=1)'), true);
assert.equal(isNoiseLine(`Payout ${'x'.repeat(700)}`), true);
assert.equal(isNoiseLine('This Font Software is licensed under the SIL Open Font License, Version 1.1. Copyright (c) 2023, Intercom, Inc.'), true);

const wording = ['Payout cycle Monthly', 'Payout cycle On demand'];
const homepage = detectChange(...wording, { ...meta, kind: 'pricing' });
assert.equal(decidePublication(homepage, { beforeText: wording[0], afterText: wording[1], liveText: wording[1] }).status, 'needs_review');
const homeFee = detectChange('Activation fee $140', 'Activation fee $120', { ...meta, kind: 'pricing' });
assert.equal(decidePublication(homeFee, { beforeText: 'Activation fee $140', afterText: 'Activation fee $120', liveText: 'Activation fee $120' }).status, 'published');

console.log('fineprint diff ok');
