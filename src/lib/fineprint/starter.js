/**
 * Fine Print cameras. Homepages are not allowed.
 * Apex is live first. Other firms stay waiting until their rules URL is pinned.
 */
export const STARTER_PAGES = [
  {
    id: 'apex-eod-evaluations',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'rules',
    ready: true,
    url: 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-evaluations/',
  },
  {
    id: 'apex-eod-drawdown',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'rules',
    ready: true,
    url: 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-drawdown-explained/',
  },
  {
    id: 'apex-dll',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'rules',
    ready: true,
    url: 'https://apextraderfunding.com/help-center/additional-helpful-items/daily-loss-limit-explained/',
  },
  {
    id: 'apex-eod-payouts',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'rules',
    ready: true,
    url: 'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-payouts/',
  },
  {
    id: 'apex-consistency',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'rules',
    ready: true,
    url: 'https://apextraderfunding.com/help-center/additional-helpful-items/50-consistency-requirement/',
  },
  {
    id: 'apex-eval-fees',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'pricing',
    ready: true,
    url: 'https://apextraderfunding.com/help-center/billing/evaluation-plan-fees-and-access-explained/',
  },
  {
    id: 'mfp-rules',
    firm: 'My Funded Perps',
    market: 'crypto',
    kind: 'rules',
    ready: false,
    url: '',
  },
  {
    id: 'tradeify-rules',
    firm: 'Tradeify',
    market: 'futures',
    kind: 'rules',
    ready: false,
    url: '',
  },
  {
    id: 'lucid-rules',
    firm: 'Lucid Trading',
    market: 'futures',
    kind: 'rules',
    ready: false,
    url: '',
  },
  {
    id: 'vest-rules',
    firm: 'Vest Markets',
    market: 'crypto',
    kind: 'rules',
    ready: false,
    url: '',
  },
];

export function readyStarterPages() {
  return STARTER_PAGES.filter(page => page.ready && page.url);
}
