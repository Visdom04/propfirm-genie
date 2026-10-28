/**
 * Fine Print cameras. Homepages are not allowed.
 * One official help/docs URL per product surface.
 */
import { isAllowedCameraUrl } from './cameras.js';

const APEX = 'Apex Trader Funding';
const TRADEIFY = 'Tradeify';
const LUCID = 'Lucid Trading';
const MFP = 'My Funded Perps';
const VEST = 'Vest Markets';
const TPT = 'Take Profit Trader';
const FNF = 'FundedNext Futures';
const LEGENDS = 'Legends Trading';
const BULENOX = 'Bulenox';

function page(id, firm, market, kind, url) {
  return { id, firm, market, kind, ready: true, url };
}

export const STARTER_PAGES = [
  page('apex-eod-evaluations', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-evaluations/'),
  page('apex-eod-drawdown', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-drawdown-explained/'),
  page('apex-eod-pa', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-performance-accounts-pa/'),
  page('apex-eod-payouts', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-payouts/'),
  page('apex-intraday-evaluations', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-evaluations/'),
  page('apex-intraday-evaluations-index', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/evaluation-accounts-ea/intraday-trailing-drawdown-evaluations/'),
  page('apex-intraday-drawdown', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-explained/'),
  page('apex-intraday-pa', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-performance-accounts-pa/'),
  page('apex-intraday-payouts', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-payouts/'),
  page('apex-dll', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/additional-helpful-items/daily-loss-limit-explained/'),
  page('apex-consistency', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/additional-helpful-items/50-consistency-requirement/'),
  page('apex-eval-fees', APEX, 'futures', 'pricing', 'https://apextraderfunding.com/help-center/billing/evaluation-plan-fees-and-access-explained/'),
  page('apex-pa-activation', APEX, 'futures', 'pricing', 'https://apextraderfunding.com/help-center/billing/pa-activation-process-deadline-explained/'),
  page('apex-no-activation-eval', APEX, 'futures', 'pricing', 'https://apextraderfunding.com/help-center/uncategorized/no-activation-fee-evaluations/'),
  page('apex-scaling-pa', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/additional-helpful-items/scaling-levels-pa-explained/'),
  page('apex-eval-contracts', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/additional-helpful-items/position-sizing-evaluation/'),
  page('apex-request-payout', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/additional-helpful-items/how-to-request-a-payout/'),
  page('apex-inactivity', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/billing/inactivity-policy-on-performance-accounts-pa/'),
  page('apex-prohibited', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/getting-started/prohibited-activities/'),
  page('apex-hours', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/getting-started/futures-trading-times/'),
  page('apex-pa-cap', APEX, 'futures', 'rules', 'https://apextraderfunding.com/help-center/performance-accounts-pa/how-many-paid-funded-accounts-am-i-allowed-to-have/'),

  page('mfp-rules', MFP, 'crypto', 'rules', 'https://docs.myfundedperpetuals.com/guides/challenges-and-rules'),
  page('mfp-elite', MFP, 'crypto', 'pricing', 'https://docs.myfundedperpetuals.com/guides/elite-accounts'),
  page('mfp-payouts', MFP, 'crypto', 'rules', 'https://docs.myfundedperpetuals.com/guides/challenge-lifecycle/payouts'),
  page('mfp-fees', MFP, 'crypto', 'pricing', 'https://docs.myfundedperpetuals.com/guides/commissions-and-fees'),

  page('tradeify-rules', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/12268167-essential-trading-rules-overview'),
  page('tradeify-pricing', TRADEIFY, 'futures', 'pricing', 'https://help.tradeify.co/en/articles/14369021-tradeify-pricing-reference'),
  page('tradeify-select-vs-growth', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/13252431-select-vs-growth-choosing-your-evaluation-type'),
  page('tradeify-growth-eval', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts'),
  page('tradeify-select-eval', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts'),
  page('tradeify-lightning', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10495938-lightning-funded-accounts'),
  page('tradeify-dll', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10468321-rules-daily-loss-limit'),
  page('tradeify-trailing', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10495897-rules-trailing-max-drawdowns'),
  page('tradeify-consistency', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10468320-rules-consistency-rule'),
  page('tradeify-hours', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10495876-rules-permitted-times-to-trade'),
  page('tradeify-growth-payouts', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/11083796-growth-funded-account-payout-policy'),
  page('tradeify-select-payouts', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/12853966-select-flex-and-select-daily-payout-policies'),
  page('tradeify-lightning-payouts', TRADEIFY, 'futures', 'rules', 'https://help.tradeify.co/en/articles/10495932-lightning-funded-account-payout-policy'),

  page('lucid-eval', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890029-lucidpro-evaluation-account'),
  page('lucid-drawdown', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890136-lucidpro-drawdown'),
  page('lucid-dll', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890122-lucidpro-daily-loss-limit'),
  page('lucid-payouts', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890092-lucidpro-payouts'),
  page('lucid-pro-consistency', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890109-lucidpro-consistency-percentage'),
  page('lucid-flex-eval', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12945790-lucidflex-evaluation-account'),
  page('lucid-flex-drawdown', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12945815-lucidflex-drawdown'),
  page('lucid-flex-payouts', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12945796-lucidflex-payouts'),
  page('lucid-flex-consistency', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12945805-lucidflex-consistency-percentage'),
  page('lucid-daily-eval', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/15996664-luciddaily-evaluation'),
  page('lucid-daily-funded', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/15997244-luciddaily-funded-account'),
  page('lucid-daily-payouts', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/15997266-luciddaily-payouts'),
  page('lucid-direct-funded', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890148-luciddirect-funded-account'),
  page('lucid-direct-payouts', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/12890164-luciddirect-payout-objectives'),
  page('lucid-hedging', LUCID, 'futures', 'rules', 'https://support.lucidtrading.com/en/articles/11404734-prohibited-hedging'),

  page('vest-account-tiers', VEST, 'crypto', 'pricing', 'https://docs.vestmarkets.com/vest-capital/account-tiers'),
  page('vest-loss-limits', VEST, 'crypto', 'rules', 'https://docs.vestmarkets.com/vest-capital/loss-limits'),
  page('vest-claiming-profit', VEST, 'crypto', 'rules', 'https://docs.vestmarkets.com/vest-capital/claiming-profit'),

  page('tpt-rule-1', TPT, 'futures', 'rules', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15169070804125-Rule-1-Hit-Your-Profit-Target'),
  page('tpt-rule-3', TPT, 'futures', 'rules', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15170265979165-Rule-3-Do-Not-Hit-End-Of-Day-EOD-Maximum-Trailing-Drawdown'),
  page('tpt-rule-5', TPT, 'futures', 'rules', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15170316538013-Rule-5-Be-Consistent'),
  page('tpt-pro-rules', TPT, 'futures', 'rules', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15171769361053-PRO-Account-Rules'),
  page('tpt-multi-accounts', TPT, 'futures', 'rules', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15172695563933-Rules-for-Multiple-Accounts'),
  page('tpt-payout-system', TPT, 'futures', 'payouts', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15172296875165-Payout-System'),
  page('tpt-profit-split', TPT, 'futures', 'payouts', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15172219527581-PRO-Account-Profit-Split-Withdrawal-Rules'),
  page('tpt-subscriptions', TPT, 'futures', 'pricing', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15141145057053-Test-Subscriptions'),
  page('tpt-sub-nav', TPT, 'futures', 'pricing', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15170412478749-Navigating-Your-Subscriptions'),
  page('tpt-commissions', TPT, 'futures', 'pricing', 'https://takeprofittraderhelp.zendesk.com/hc/en-us/articles/15172548967069-Commissions-on-Test-and-PRO-accounts'),

  page('fnf-dll', FNF, 'futures', 'rules', 'https://helpfutures.fundednext.com/en/articles/17230292-daily-loss-limit-and-maximum-loss-limit-at-fundednext-futures'),
  page('fnf-consistency', FNF, 'futures', 'rules', 'https://helpfutures.fundednext.com/en/articles/17230245-is-there-any-consistency-rule-to-be-followed-in-the-fundednext-futures-challenge-fundednext-account'),
  page('fnf-flex-rules', FNF, 'futures', 'rules', 'https://helpfutures.fundednext.com/en/articles/17229848-fundednext-futures-flex-fundednext-account-all-rules'),
  page('fnf-prohibited', FNF, 'futures', 'rules', 'https://helpfutures.fundednext.com/en/articles/14298337-what-are-the-prohibited-trading-strategies-of-fundednext-futures'),
  page('fnf-prices', FNF, 'futures', 'pricing', 'https://helpfutures.fundednext.com/en/articles/17228899-what-are-the-available-account-sizes-and-their-prices-in-fundednext-futures'),
  page('fnf-reward-share', FNF, 'futures', 'payouts', 'https://helpfutures.fundednext.com/en/articles/17242096-what-will-be-my-reward-share-from-the-futures-fundednext-account'),
  page('fnf-withdraw', FNF, 'futures', 'payouts', 'https://helpfutures.fundednext.com/en/articles/17242064-how-can-i-withdraw-my-performance-reward'),
  page('fnf-flex-reward', FNF, 'futures', 'payouts', 'https://helpfutures.fundednext.com/en/articles/14878865-what-are-the-performance-reward-eligibility-criteria-for-flex-fundednext-account'),

  page('legends-eval', LEGENDS, 'futures', 'rules', 'https://knowledge.thelegendstrading.com/en/articles/12099518-apprentice-evaluation-guidelines'),
  page('legends-eod-update', LEGENDS, 'futures', 'rules', 'https://knowledge.thelegendstrading.com/en/articles/13512545-apprentice-plan-update-eod-tracking-one-day-pass-no-scaling-effective-now'),
  page('legends-master-rules', LEGENDS, 'futures', 'rules', 'https://knowledge.thelegendstrading.com/en/articles/12099648-master-account-rules-guidelines'),
  page('legends-payouts', LEGENDS, 'futures', 'payouts', 'https://knowledge.thelegendstrading.com/en/articles/12099683-payout-process-payout-policy'),
  page('legends-master-fees', LEGENDS, 'futures', 'pricing', 'https://knowledge.thelegendstrading.com/en/articles/12099628-fees-after-qualifying-for-a-master-account'),

  page('bulenox-qualification', BULENOX, 'futures', 'rules', 'https://bulenox.com/help-center/qualification'),
  page('bulenox-master', BULENOX, 'futures', 'payouts', 'https://bulenox.com/help-center/master'),
  page('bulenox-fast-track', BULENOX, 'futures', 'pricing', 'https://bulenox.com/help-center/fast-track'),
  page('bulenox-momentum', BULENOX, 'futures', 'pricing', 'https://bulenox.com/help-center/momentum'),
  page('bulenox-pricing', BULENOX, 'futures', 'pricing', 'https://bulenox.com/accounts-pricing'),
];

if (STARTER_PAGES.some(item => !isAllowedCameraUrl(item.url))) {
  throw new Error('A starter camera points at a homepage, coupon page, or dead help host.');
}

export function readyStarterPages() {
  return STARTER_PAGES.filter(item => item.ready && item.url);
}

export function crawlGapMs(page) {
  if (page?.firm === APEX || page?.firm === TRADEIFY || page?.firm === TPT || page?.firm === LEGENDS || page?.firm === BULENOX) return 1200;
  return 400;
}
