import assert from 'node:assert/strict';
import { classifyCameraUrl, extractSitemapLocs, isAllowedCameraUrl, reviewSitemap } from './cameras.js';
import { STARTER_PAGES } from './starter.js';

assert.equal(classifyCameraUrl('https://apextraderfunding.com/').reason, 'homepage');
assert.equal(isAllowedCameraUrl('https://apextraderfunding.com/'), false);
assert.equal(classifyCameraUrl('https://help.lucidtrading.com/en/articles/1').reason, 'dead_help_host');
assert.equal(classifyCameraUrl('https://apextraderfunding.com/help-center/billing/coupon-codes/').reason, 'noise_page');
assert.equal(classifyCameraUrl('https://apextraderfunding.com/help-center/billing/pa-activation-process-deadline-explained/').keep, true);
assert.equal(classifyCameraUrl('https://help.tradeify.co/en/articles/11083796-growth-funded-account-payout-policy').keep, true);
assert.equal(classifyCameraUrl('https://help.tradeify.co/en/articles/11083796-growth-funded-account-payout-policy').kind, 'payouts');
assert.equal(classifyCameraUrl('https://support.lucidtrading.com/en/articles/12945790-lucidflex-evaluation-account').keep, true);
assert.equal(classifyCameraUrl('https://tradeify.co/post/payout-policy-explained/').reason, 'noise_page');
assert.equal(classifyCameraUrl('https://lucidtrading.com/product/50k-eval/').reason, 'noise_page');
assert.equal(classifyCameraUrl('https://apextraderfunding.com/help-center/legacy-payouts/legacy-pa-payout-parameters/').reason, 'noise_page');
assert.equal(classifyCameraUrl('https://apextraderfunding.com/help-center/additional-helpful-items/scaling-levels-pa-explained/').keep, true);
assert.equal(classifyCameraUrl('https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15170316538013-Rule-5-Be-Consistent').keep, true);
assert.equal(classifyCameraUrl('https://helpfutures.fundednext.com/en/articles/17230292-daily-loss-limit-and-maximum-loss-limit-at-fundednext-futures').keep, true);
assert.equal(classifyCameraUrl('https://helpfutures.fundednext.com/en/articles/17229848-fundednext-futures-flex-fundednext-account-all-rules').keep, true);
assert.equal(classifyCameraUrl('https://knowledge.thelegendstrading.com/en/articles/12099683-payout-process-payout-policy').kind, 'payouts');
assert.equal(classifyCameraUrl('https://bulenox.com/help-center/qualification').keep, true);
assert.equal(classifyCameraUrl('https://takeprofittrader.com/').reason, 'homepage');

const xml = `<?xml version="1.0"?>
<urlset>
  <loc>https://apextraderfunding.com/</loc>
  <loc>https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-evaluations/</loc>
  <loc>https://apextraderfunding.com/blog/new-offer</loc>
</urlset>`;
assert.deepEqual(extractSitemapLocs(xml), [
  'https://apextraderfunding.com/',
  'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-evaluations/',
  'https://apextraderfunding.com/blog/new-offer',
]);
const reviewed = reviewSitemap(xml, STARTER_PAGES.map(page => page.url));
assert.equal(reviewed.keep.length, 0);
assert.equal(reviewed.already.length, 1);
assert.equal(reviewed.skip.some(row => /blog/.test(row.url)), true);

assert.ok(STARTER_PAGES.every(page => isAllowedCameraUrl(page.url)));
const ids = STARTER_PAGES.map(page => page.id);
assert.equal(ids.length, new Set(ids).size);
assert.equal(STARTER_PAGES.map(page => page.url).length, new Set(STARTER_PAGES.map(page => page.url)).size);

console.log('cameras.test.mjs ok');
