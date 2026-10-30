const KEY = 'pfg-fineprint-coverage';
const EVENT = 'pfg-fineprint-coverage';

export const STOCK_COVER = [
  { firm: 'Apex Trader Funding', market: 'futures' },
  { firm: 'Tradeify', market: 'futures' },
  { firm: 'Lucid Trading', market: 'futures' },
  { firm: 'My Funded Perps', market: 'crypto' },
  { firm: 'Vest Markets', market: 'crypto' },
  { firm: 'Take Profit Trader', market: 'futures' },
  { firm: 'FundedNext Futures', market: 'futures' },
  { firm: 'Legends Trading', market: 'futures' },
  { firm: 'Bulenox', market: 'futures' },
  { firm: 'My Funded Futures', market: 'futures' },
  { firm: 'Top One Futures', market: 'futures' },
  { firm: 'Phidias Propfirm', market: 'futures' },
  { firm: 'Topstep', market: 'futures' },
  { firm: 'Blue Guardian', market: 'futures' },
  { firm: 'DayTraders', market: 'futures' },
  { firm: 'IQ Capital', market: 'futures' },
  { firm: 'Traders Launch', market: 'futures' },
  { firm: 'The Trading Pit', market: 'futures' },
  { firm: 'FTMO', market: 'futures' },
  { firm: 'BluSky', market: 'futures' },
  { firm: 'FXIFY Futures', market: 'futures' },
  { firm: 'Earn2Trade', market: 'futures' },
];

export function defaultShown() {
  return STOCK_COVER.map(item => item.firm);
}

export function emptyCover() {
  return { shown: defaultShown(), extra: [] };
}

export function loadCoverage() {
  if (typeof window === 'undefined') return emptyCover();
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return emptyCover();
    const extra = Array.isArray(raw.extra) ? raw.extra : [];
    const shown = Array.isArray(raw.shown) ? raw.shown : defaultShown();
    return { shown, extra };
  } catch {
    return emptyCover();
  }
}

export function saveCoverage(next) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCoverage(onChange) {
  const ping = () => onChange(loadCoverage());
  window.addEventListener(EVENT, ping);
  window.addEventListener('storage', ping);
  return () => {
    window.removeEventListener(EVENT, ping);
    window.removeEventListener('storage', ping);
  };
}

export function coverPages(cover) {
  const extra = (cover?.extra || []).map(item => ({
    id: item.id || `cover-${item.firm}`,
    firm: item.firm,
    market: item.market || 'futures',
    kind: 'rules',
    ready: false,
    url: '',
    logo: item.logo || '',
    source: 'cover',
  }));
  const stock = STOCK_COVER.map(item => ({
    id: `cover-${item.firm}`,
    firm: item.firm,
    market: item.market,
    kind: 'rules',
    ready: false,
    url: '',
    source: 'cover',
  }));
  const seen = new Set();
  return [...stock, ...extra].filter(item => {
    if (seen.has(item.firm)) return false;
    seen.add(item.firm);
    return true;
  });
}

export function isCovered(firm, cover) {
  const shown = cover?.shown;
  if (!Array.isArray(shown)) return true;
  return shown.includes(firm);
}
