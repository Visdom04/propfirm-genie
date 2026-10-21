function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function page(firm, market, entry) {
  return {
    id: entry.id,
    firm,
    market: market || 'futures',
    plan: entry.plan || null,
    kind: entry.kind || 'pricing',
    url: entry.urls[0],
    urls: entry.urls,
    source: 'page',
  };
}

function plansPage(firm, market, site) {
  return {
    id: `${slug(firm)}-plans`,
    firm,
    market: market || 'futures',
    plan: null,
    kind: 'pricing',
    url: site,
    urls: [site],
    source: 'plans',
  };
}

function define(firm, market, site, extra = []) {
  const home = { id: `${slug(firm)}-home`, kind: 'pricing', urls: [site] };
  return [plansPage(firm, market, site), page(firm, market, home), ...extra.map(entry => page(firm, market, entry))];
}

/**
 * One row per firm we care about. `urls` is a ladder, not a guess pile.
 * Dead help hosts stay out. Vest and My Funded Perps are here because Loop
 * tracks them and our compare sheet does not yet.
 */
export const WATCHED_PAGES = [
  ...define('Apex Trader Funding', 'futures', 'https://apextraderfunding.com/'),
  ...define('Lucid Trading', 'futures', 'https://lucidtrading.com/'),
  ...define('Tradeify', 'futures', 'https://tradeify.co/'),
  ...define('My Funded Futures', 'futures', 'https://myfundedfutures.com/', [
    { id: 'mff-help', kind: 'faq', urls: ['https://help.myfundedfutures.com/'] },
  ]),
  ...define('My Funded Perps', 'crypto', 'https://myfundedperpetuals.com/', [
    {
      id: 'mfp-rules',
      kind: 'rules',
      urls: ['https://docs.myfundedperpetuals.com/guides/challenges-and-rules'],
    },
    {
      id: 'mfp-inactivity',
      kind: 'rules',
      urls: ['https://docs.myfundedperpetuals.com/guides/challenge-lifecycle/breaches-and-next-steps'],
    },
  ]),
  ...define('Vest Markets', 'crypto', 'https://www.vestmarkets.com/'),
  ...define('Take Profit Trader', 'futures', 'https://takeprofittrader.com/'),
  ...define('FundedNext Futures', 'futures', 'https://fundednext.com/', [
    { id: 'fundednext-bolt', kind: 'pricing', urls: ['https://fundednext.com/futures/bolt'] },
  ]),
  ...define('Top One Futures', 'futures', 'https://www.toponefutures.com/'),
  ...define('Purdia', 'futures', 'https://purdia.com/'),
  ...define('Bulenox', 'futures', 'https://bulenox.com/'),
  ...define('Phidias Propfirm', 'futures', 'https://phidiaspropfirm.com/'),
  ...define('Legends Trading', 'futures', 'https://legendstrading.com/'),
  ...define('E8 Futures', 'futures', 'https://e8markets.com/'),
  ...define('Blue Guardian', 'futures', 'https://blueguardian.com/', [
    { id: 'blue-guardian-help', kind: 'faq', urls: ['https://help.blueguardian.com/'] },
  ]),
  ...define('Nexgen ProTrader Funding', 'futures', 'https://nexgenfunding.com/'),
  ...define('DayTraders', 'futures', 'https://daytraders.com/'),
  ...define('IQ Capital', 'futures', 'https://iqcapital.io/'),
  ...define('Topstep', 'futures', 'https://www.topstep.com/', [
    { id: 'topstep-help', kind: 'faq', urls: ['https://help.topstep.com/en/'] },
    {
      id: 'topstep-news-risk',
      kind: 'rules',
      urls: ['https://help.topstep.com/en/articles/13613539-risk-adjustments-high-risk-high-volatility'],
    },
  ]),
  ...define('Traders Launch', 'futures', 'https://traderslaunch.com/', [
    { id: 'traders-launch-rules', kind: 'rules', urls: ['https://www.traderslaunch.com/futures/rules'] },
    { id: 'traders-launch-payouts', kind: 'rules', urls: ['https://traderslaunch.com/payout-rules'] },
  ]),
  ...define('Funded Futures Network', 'futures', 'https://fundedfuturesnetwork.com/'),
  ...define('The Trading Pit', 'futures', 'https://thetradingpit.com/'),
  ...define('FundedSeat', 'futures', 'https://fundedseat.com/'),
  ...define('FTMO', 'forex', 'https://ftmo.com/en/'),
  ...define('BluSky', 'futures', 'https://blusky.pro/'),
  ...define('FXIFY Futures', 'futures', 'https://fxify.com/'),
  ...define('Earn2Trade', 'futures', 'https://www.earn2trade.com/', [
    { id: 'e2t-help', kind: 'faq', urls: ['https://help.earn2trade.com/en/'] },
  ]),
];

export const WATCHED_FIRMS = [...new Set(WATCHED_PAGES.map(item => item.firm))];

export const MARKET_LABEL = {
  futures: 'Futures',
  forex: 'Forex',
  crypto: 'Perps',
};

export const KIND_LABEL = {
  pricing: 'Price',
  rules: 'Rules',
  faq: 'FAQ',
};

export { slug };
