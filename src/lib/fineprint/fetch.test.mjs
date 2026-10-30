import assert from 'node:assert/strict';
import { BOT_UA, FETCH_HEADERS, fetchFirstOk, isBlockedStatus, isChallengePage, isRetryable, robotsAllows, robotsRules } from './fetch.js';
import { snapshotFirmPlans } from './snapshot.js';
import { WATCHED_FIRMS, WATCHED_PAGES } from './catalog.js';

// Honest identity, no browser disguise.
assert.equal(FETCH_HEADERS['user-agent'], BOT_UA);
assert.match(BOT_UA, /^PropFirmGenieBot\//);
assert.ok(!Object.keys(FETCH_HEADERS).some(key => key.startsWith('sec-fetch')));

assert.equal(isRetryable(503), true);
assert.equal(isRetryable(429), false);
assert.equal(isBlockedStatus(403), true);
assert.equal(isBlockedStatus(404), false);

const calls = [];
const fetchFn = async url => {
  calls.push(url);
  if (url.includes('gone.example')) return { status: 404, url, text: async () => 'not found' };
  if (url.includes('blocked.example')) return { status: 403, url, text: async () => 'denied' };
  if (url.includes('wall.example')) {
    return { status: 200, url, text: async () => '<title>Just a moment...</title><p>Checking your browser</p>' };
  }
  return { status: 200, url, text: async () => '<p>Live page $99</p>' };
};

const live = await fetchFirstOk(['https://ok.example/'], { fetchFn, retries: 0, delayMs: 0 });
assert.equal(live.source, 'direct');
assert.match(live.body, /Live page/);

// A bot wall is reported, never routed around through a third party.
assert.equal((await fetchFirstOk(['https://wall.example/rules'], { fetchFn, retries: 0, delayMs: 0 })).source, 'blocked');
assert.equal((await fetchFirstOk(['https://blocked.example/'], { fetchFn, retries: 0, delayMs: 0 })).source, 'blocked');
const gone = await fetchFirstOk(['https://gone.example/'], { fetchFn, retries: 0, delayMs: 0 });
assert.equal(gone.source, 'failed');
assert.equal(gone.status, 404);
assert.ok(calls.every(url => !url.includes('r.jina.ai')));

// GitBook ships "Just a moment…" as a chat string. That is not a wall.
assert.equal(isChallengePage('<title>Loss Limits | Vest</title><script>{"hold":"Just a moment…"}</script>'), false);
assert.equal(isChallengePage('<title>Just a moment...</title>'), true);
assert.equal(isChallengePage('<script src="/cdn-cgi/challenge-platform/h/b/orchestrate"></script>'), true);

const robots = robotsRules(`User-agent: *
Disallow: /help-center/
Allow: /help-center/public/

User-agent: GPTBot
Disallow: /`);
assert.equal(robotsAllows(robots, 'https://x.com/help-center/rules'), false);
assert.equal(robotsAllows(robots, 'https://x.com/help-center/public/rules'), true);
assert.equal(robotsAllows(robots, 'https://x.com/pricing'), true);
assert.equal(robotsAllows(robotsRules('User-agent: PropFirmGenieBot\nDisallow: /'), 'https://x.com/a'), false);
assert.equal(robotsAllows(robotsRules('User-agent: *\nDisallow:'), 'https://x.com/a'), true);
assert.equal(robotsAllows(robotsRules(''), 'https://x.com/a'), true);

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
