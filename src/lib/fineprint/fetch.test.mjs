import assert from 'node:assert/strict';
import { fetchFirstOk, isRetryable, needsReader, readerMirrors, readerUrl } from './fetch.js';
import { snapshotFirmPlans } from './snapshot.js';
import { WATCHED_FIRMS, WATCHED_PAGES } from './catalog.js';

assert.equal(readerUrl('https://apextraderfunding.com/'), 'https://r.jina.ai/https://apextraderfunding.com/');
assert.deepEqual(readerMirrors('https://apextraderfunding.com/help-center/'), [
  'https://r.jina.ai/http://apextraderfunding.com/help-center/',
  'https://r.jina.ai/https://apextraderfunding.com/help-center/',
]);
assert.equal(isRetryable(429), true);
assert.equal(isRetryable(403), false);
assert.equal(needsReader(403), true);
assert.equal(needsReader(429), true);
assert.equal(needsReader(200), false);

const calls = [];
const fetchFn = async url => {
  calls.push(url);
  if (url.includes('r.jina.ai')) {
    return {
      status: 200,
      url,
      text: async () => 'A'.repeat(500),
    };
  }
  if (url.includes('gone.example')) {
    return { status: 404, url, text: async () => 'not found' };
  }
  if (url.includes('blocked.example')) {
    return { status: 403, url, text: async () => 'denied' };
  }
  return { status: 200, url, text: async () => '<p>Live page $99</p>' };
};

const live = await fetchFirstOk(['https://ok.example/'], { fetchFn, retries: 0, delayMs: 0 });
assert.equal(live.source, 'direct');
assert.match(live.body, /Live page/);

const challengeFn = async url => {
  calls.push(url);
  if (url.includes('r.jina.ai')) {
    return { status: 200, url, text: async () => 'A'.repeat(500) };
  }
  return { status: 200, url, text: async () => '<title>Just a moment...</title><p>Checking your browser</p>' };
};
calls.length = 0;
const challenged = await fetchFirstOk(['https://wall.example/rules'], { fetchFn: challengeFn, retries: 0, delayMs: 0 });
assert.equal(challenged.source, 'reader');
assert.equal(challenged.body.length, 500);

const blocked = await fetchFirstOk(['https://blocked.example/'], { fetchFn, retries: 0, delayMs: 0 });
assert.equal(blocked.source, 'reader');
assert.equal(blocked.body.length, 500);
assert.ok(calls.some(url => url.startsWith('https://r.jina.ai/')));

calls.length = 0;
const gone = await fetchFirstOk(['https://gone.example/'], { fetchFn, retries: 0, delayMs: 0 });
assert.equal(gone.source, 'failed');
assert.equal(gone.status, 404);
assert.ok(!calls.some(url => url.startsWith('https://r.jina.ai/')));

const snap = snapshotFirmPlans({
  name: 'Apex Trader Funding',
  plans: [
    { id: 'b', planType: 'EOD', accountSize: '$50K', price: 90, listPrice: 900, profitTarget: '$3,000' },
    { id: 'a', planType: 'Intraday', accountSize: '$25K', price: 16.7, listPrice: 167, profitTarget: '$1,500' },
  ],
});
assert.match(snap, /^FIRM Apex Trader Funding\nPLANS 2\n/);
assert.ok(snap.indexOf('id=a') < snap.indexOf('id=b'));
assert.match(snap, /price=16.7/);

assert.ok(WATCHED_FIRMS.includes('Vest Markets'));
assert.ok(WATCHED_FIRMS.includes('My Funded Perps'));
assert.ok(!WATCHED_FIRMS.includes('FundingPips'));
const ids = WATCHED_PAGES.map(item => item.id);
assert.equal(ids.length, new Set(ids).size);
assert.ok(WATCHED_PAGES.some(item => item.id === 'my-funded-perps-home'));
assert.ok(WATCHED_PAGES.some(item => item.source === 'plans' && item.firm === 'Apex Trader Funding'));
assert.ok(!WATCHED_PAGES.some(item => item.url.includes('help.takeprofittrader.com')));
assert.ok(!WATCHED_PAGES.some(item => item.url.includes('help.lucidtrading.com')));

console.log('fineprint fetch/catalog ok');
