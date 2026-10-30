// One list of trading terms for both pipelines (keyword facts and paragraph cards).
// better: which direction helps the trader. null means we do not judge.
// units: what the changed number must measure for the verdict to count.
// First match wins for labels, so specific terms sit above generic ones.
export const TERMS = [
  { pattern: /\b(?:profit|payout) split\b|\bsplit\b/i, label: 'Profit split', kind: 'payouts', better: 'higher', units: ['%'] },
  { pattern: /\bprofit target\b/i, label: 'Profit target', kind: 'rules', better: 'lower', units: ['$'] },
  { pattern: /\bdaily loss(?: limit)?\b/i, label: 'Daily loss limit', kind: 'rules', better: 'higher', units: ['$', '%'] },
  { pattern: /\b(?:drawdown|max(?:imum)? loss|loss limit)\b/i, label: 'Drawdown', kind: 'rules', better: 'higher', units: ['$', '%'] },
  { pattern: /\btrading days\b/i, label: 'Minimum trading days', kind: 'rules', better: 'lower', units: ['days'] },
  { pattern: /\bconsistency\b/i, label: 'Consistency rule', kind: 'rules', better: 'higher', units: ['%'] },
  { pattern: /\b(?:max(?:imum)? payout|payout cap)\b/i, label: 'Maximum payout', kind: 'payouts', better: 'higher', units: ['$'] },
  { pattern: /\bmin(?:imum)? payout\b/i, label: 'Minimum payout', kind: 'payouts', better: 'lower', units: ['$'] },
  { pattern: /\bpayout (?:cycle|window|frequency)\b/i, label: 'Payout cycle', kind: 'payouts', better: 'lower', units: ['days'] },
  { pattern: /\bpayout\b/i, label: 'Payout terms', kind: 'payouts', better: null, units: [] },
  { pattern: /\b(?:contracts?|position size)\b/i, label: 'Position size', kind: 'rules', better: 'higher', units: ['contracts'] },
  { pattern: /\b(?:price|fee|cost|activation)\b/i, label: 'Fee', kind: 'pricing', better: 'lower', units: ['$'] },
];

// The changed number and its term must sit in the same clause.
const MAX_GAP = 48;

export const NUMBER = /\$?\d[\d,]*(?:\.\d+)?[kK]?%?/g;

export function maskNumbers(line) {
  return String(line).replace(NUMBER, '#');
}

export function labelFor(text) {
  return TERMS.find(term => term.pattern.test(text)) || null;
}

function toNumber(token) {
  const raw = String(token).replace(/[$,%]/g, '');
  return /k$/i.test(raw) ? Number(raw.slice(0, -1)) * 1000 : Number(raw);
}

function unitOf(token, rest) {
  if (token.startsWith('$')) return '$';
  if (token.endsWith('%')) return '%';
  const next = rest.slice(0, 24).toLowerCase();
  if (/^\s*(?:trading |business |calendar )?days?\b/.test(next)) return 'days';
  if (/^\s*(?:micro |mini )?contracts?\b/.test(next)) return 'contracts';
  if (/^\s*(?:minutes?|hours?|weeks?|months?)\b/.test(next)) return 'time';
  return 'count';
}

function tokensOf(line) {
  return [...String(line).matchAll(NUMBER)].map(match => ({ text: match[0], start: match.index, end: match.index + match[0].length }));
}

// Nearest term to the number wins, so "5-30 minutes of hitting profit target" never reads as a target.
function nearestTerm(line, start, end) {
  let best = null;
  for (const term of TERMS) {
    const global = new RegExp(term.pattern.source, 'gi');
    for (const match of line.matchAll(global)) {
      const termEnd = match.index + match[0].length;
      const gap = termEnd <= start ? start - termEnd : match.index >= end ? match.index - end : 0;
      if (gap <= MAX_GAP && (!best || gap < best.gap)) best = { term, gap };
    }
  }
  return best?.term || null;
}

/**
 * Same sentence, exactly one number moved, a known term next to it, and the
 * number measures what the term measures. Anything less returns null, and the
 * card stays a plain "changed" paragraph. A missing verdict beats a wrong one.
 */
export function judgeChange(before, after) {
  const a = String(before || '');
  const b = String(after || '');
  if (!a || !b || maskNumbers(a) !== maskNumbers(b)) return null;
  const from = tokensOf(a);
  const to = tokensOf(b);
  const moved = from.map((token, i) => i).filter(i => from[i].text !== to[i].text);
  if (moved.length !== 1) return null;
  const index = moved[0];
  const term = nearestTerm(a, from[index].start, from[index].end);
  if (!term) return null;
  const unit = unitOf(from[index].text, a.slice(from[index].end));
  if (unit !== unitOf(to[index].text, b.slice(to[index].end))) return null;
  const fromValue = toNumber(from[index].text);
  const toValue = toNumber(to[index].text);
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || fromValue === toValue) return null;
  const judged = term.better && term.units.includes(unit);
  return {
    label: term.label,
    kind: term.kind,
    before: from[index].text,
    after: to[index].text,
    unit,
    verdict: !judged ? 'unscored' : (toValue > fromValue) === (term.better === 'higher') ? 'better' : 'worse',
  };
}

/** Starting verdict for a hand-written entry. The admin can override it. */
export function suggestVerdict(label, before, after) {
  const term = labelFor(label);
  const from = toNumber(String(before || '').match(NUMBER)?.[0] || '');
  const to = toNumber(String(after || '').match(NUMBER)?.[0] || '');
  if (!term?.better || !Number.isFinite(from) || !Number.isFinite(to) || from === to) return 'unscored';
  return (to > from) === (term.better === 'higher') ? 'better' : 'worse';
}

/** better or worse for the trader, or unscored. Records written before the rename say good / neutral. */
export function verdictOf(value) {
  if (value === 'better' || value === 'good') return 'better';
  if (value === 'worse') return 'worse';
  return 'unscored';
}

/** "−16.7%" for amounts, "−10 pts" for percentages. Empty when not numeric. */
export function deltaLabel(before, after) {
  const from = toNumber(before);
  const to = toNumber(after);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return '';
  const sign = to > from ? '+' : '−';
  if (String(before).endsWith('%') && String(after).endsWith('%')) {
    const pts = Math.abs(to - from);
    return `${sign}${Number(pts.toFixed(1))} ${pts === 1 ? 'pt' : 'pts'}`;
  }
  if (from === 0) return '';
  return `${sign}${Number(Math.abs(((to - from) / from) * 100).toFixed(1))}%`;
}
