import { parseMoney, parsePercent, isNoneValue } from '@/lib/compareHighlights';

export function parseAccountDollars(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).replace(/,/g, '').trim();
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  let n = Number(m[0]);
  if (/[mM]\b/.test(s)) n *= 1_000_000;
  else if (/[kK]\b/.test(s)) n *= 1000;
  return n;
}

export function parseMaxLots(value, kind = 'micro') {
  if (value == null || value === '') return null;
  const parts = String(value)
    .split(/[|/]/)
    .map(p => parseMoney(p))
    .filter(n => n != null);
  if (!parts.length) return null;
  if (kind === 'mini') return parts[0];
  const micro = parts[1] ?? parts[0];
  if (kind === 'perp') return micro == null ? null : micro * 2;
  return micro;
}

export function parseConsistencyRatio(value) {
  if (isNoneValue(value)) return null;
  const n = parsePercent(value);
  if (n == null) return null;
  return n > 1 ? n / 100 : n;
}

export function parseFeeDollars(value) {
  if (isNoneValue(value)) return 0;
  return parseMoney(value) ?? 0;
}

export function drawdownKind(maxLossType) {
  const t = String(maxLossType || '').toLowerCase();
  if (t.includes('intraday')) return 'intraday';
  if (t.includes('trail')) return 'trailing';
  if (t.includes('eod')) return 'eod';
  if (t.includes('static')) return 'static';
  return t || 'static';
}
