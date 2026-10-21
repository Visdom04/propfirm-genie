/**
 * The five firms we photograph first.
 * A firm with ready:false has no rules URL yet, so the daily run skips it.
 * Homepages are not allowed on this list.
 */
export const STARTER_PAGES = [
  {
    id: 'apex-eval-rules',
    firm: 'Apex Trader Funding',
    market: 'futures',
    kind: 'rules',
    ready: true,
    url: 'https://support.apextraderfunding.com/hc/en-us/articles/31519769997083-Evaluation-Rules',
  },
  {
    id: 'mfp-rules',
    firm: 'My Funded Perps',
    market: 'crypto',
    kind: 'rules',
    ready: true,
    url: 'https://docs.myfundedperpetuals.com/guides/challenges-and-rules',
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
