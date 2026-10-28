/**
 * Which public URLs may be cameras.
 * Homepages, setup, coupons, and dead help hosts are not Fine Print sources.
 * Sitemap hits that are neither keep nor skip stay as "unknown" for a human.
 */

const DEAD_HELP = /support\.apextraderfunding\.com|help\.lucidtrading\.com/i;

const SKIP = [
  /\/post\//i,
  /\/product\//i,
  /\/shop\//i,
  /\/blog/i,
  /\/legacy-/i,
  /\/tradovate\//i,
  /bundle|5-pack|legacy-evaluation/i,
  /coupon/i,
  /restricted-countries/i,
  /rithmic/i,
  /connection-guide|wealthcharts|webinar|testimonial/i,
  /platform-connection|troubleshooting|charting|order-entry|hotkey/i,
  /creating-your-account|how-to-contact|background-and-history|user-accounts|choosing-the-right-platform|setting-up-two-factor|whitelist-apex|knowledge-base-guidance/i,
  /how-do-i-start|welcome-to/i,
  /privacy|cookie|terms-of-service|refund-policy|terms-of-use/i,
  /affiliate|competition|grand-cup|world-cup|premier-trading/i,
  /payout-method/i,
  /invoice|checkout-error|payment-methods/i,
  /supported-trading-products|cme-contracts/i,
  /tradovate-platform|tradovate-charting/i,
  /custom-scripts|trading-journal|api-reference|\/settings\//i,
  /incident-reports|exchange-notices|audits/i,
  /cross-margin|deposits|withdrawals|funding$/i,
];

const KEEP = [
  {
    kind: 'pricing',
    pattern:
      /pricing|account-tiers|eval(?:uation)?-plan-fees|activation|elite-accounts|commissions-and-fees|commissions-on-test|account-sizes-and-their-prices|test-subscriptions|navigating-your-subscriptions|fees-after-qualifying|accounts-pricing|help-center\/fast-track|help-center\/momentum/i,
  },
  { kind: 'payouts', pattern: /payout|claiming-profit|profit-split|reward-share|performance-reward|help-center\/master/i },
  {
    kind: 'rules',
    pattern:
      /evaluat|drawdown|daily-loss|dll|consistency|loss-limit|challenges-and-rules|trailing|lightning-funded|select-eval|growth-eval|select-vs-growth|hedging|permitted-times|performance-accounts|funded-account|payout-policy|payout-objectives|essential-trading-rules|scaling-levels|position-sizing|no-activation-fee|how-to-request-a-payout|inactivity-policy|prohibited-activities|futures-trading-times|lucidflex|luciddaily|luciddirect|lucidpro|lucidmaxx|rule-\d-|pro-account-rules|multiple-accounts|maximum-loss|benchmark-days|contract-limits|prohibited-trading|help-center\/qualification|help-center\/funded|apprentice-plan-update|master-account-rules|fundednext-account-all-rules/i,
  },
];

export const SITEMAP_FEEDS = [
  { firm: 'Apex Trader Funding', url: 'https://apextraderfunding.com/help-center-sitemap.xml' },
  { firm: 'Apex Trader Funding', url: 'https://apextraderfunding.com/hc-category-sitemap.xml' },
  { firm: 'Tradeify', url: 'https://help.tradeify.co/sitemap.xml' },
  { firm: 'Tradeify shop', url: 'https://tradeify.co/sitemap.xml' },
  { firm: 'Lucid Trading', url: 'https://support.lucidtrading.com/sitemap.xml' },
  { firm: 'My Funded Perps', url: 'https://docs.myfundedperpetuals.com/sitemap.xml' },
  { firm: 'Vest Markets', url: 'https://docs.vestmarkets.com/sitemap.xml' },
];

export function normalizeCameraUrl(url) {
  try {
    const parsed = new URL(String(url || ''));
    parsed.hash = '';
    parsed.search = '';
    let path = parsed.pathname.replace(/\/+$/, '') || '/';
    parsed.pathname = path;
    return parsed.toString();
  } catch {
    return '';
  }
}

export function isHomepage(url) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '') || '/';
    return path === '/';
  } catch {
    return true;
  }
}

export function classifyCameraUrl(url) {
  const normalized = normalizeCameraUrl(url);
  if (!normalized) return { keep: false, reason: 'bad_url', kind: null };
  if (DEAD_HELP.test(normalized)) return { keep: false, reason: 'dead_help_host', kind: null };
  if (isHomepage(normalized)) return { keep: false, reason: 'homepage', kind: null };
  if (SKIP.some(pattern => pattern.test(normalized))) return { keep: false, reason: 'noise_page', kind: null };
  const hit = KEEP.find(item => item.pattern.test(normalized));
  if (hit) return { keep: true, reason: 'rule_or_price', kind: hit.kind };
  return { keep: false, reason: 'unknown', kind: null };
}

export function isAllowedCameraUrl(url) {
  return classifyCameraUrl(url).keep;
}

export function extractSitemapLocs(xml) {
  return [...String(xml || '').matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(match => match[1].trim()).filter(Boolean);
}

export function reviewSitemap(xml, knownUrls = []) {
  const known = new Set((knownUrls || []).map(normalizeCameraUrl).filter(Boolean));
  const rows = [];
  const seen = new Set();
  for (const loc of extractSitemapLocs(xml)) {
    const url = normalizeCameraUrl(loc);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const verdict = classifyCameraUrl(url);
    rows.push({
      url,
      ...verdict,
      watching: known.has(url),
    });
  }
  return {
    keep: rows.filter(row => row.keep && !row.watching),
    unknown: rows.filter(row => row.reason === 'unknown' && !row.watching),
    skip: rows.filter(row => !row.keep && row.reason !== 'unknown'),
    already: rows.filter(row => row.watching),
  };
}
