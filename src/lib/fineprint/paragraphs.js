import { diffTexts, hashText, isNoiseLine } from './diff.js';

const MIN_PARAGRAPH = 40;
const MIN_LINES = 8;

const LABELS = [
  { pattern: /\bprofit target\b/i, label: 'Profit target', kind: 'rules' },
  { pattern: /\bprofit split\b/i, label: 'Profit split', kind: 'rules' },
  { pattern: /\b(drawdown|daily loss|max(?:imum)? loss|loss limit)\b/i, label: 'Drawdown', kind: 'rules' },
  { pattern: /\bmin(?:imum)? trad(?:ing)? days\b/i, label: 'Minimum trading days', kind: 'rules' },
  { pattern: /\bconsistency\b/i, label: 'Consistency rule', kind: 'rules' },
  { pattern: /\bpayout\b/i, label: 'Payout terms', kind: 'rules' },
  { pattern: /\b(price|fee|cost|activation)\b/i, label: 'Fee', kind: 'pricing' },
];

function clip(line) {
  const text = String(line || '').trim();
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

export function usableParagraph(line) {
  const text = String(line || '').trim();
  if (text.length < MIN_PARAGRAPH) return false;
  return !isNoiseLine(text);
}

/** The firm's own outage page. Still watched. Not a rules baseline. */
export function pageIsMaintenance(text) {
  return /we'll be right back|site temporarily offline|scheduled maintenance|undergoing maintenance/i.test(String(text || ''));
}

/** A challenge page or a cut-off download must not replace the stored copy. */
export function pageIsBlocked(text) {
  return /just a moment|attention required|returned error 403|cf-browser-verification|checking your browser|enable javascript and cookies|cf-challenge/i.test(
    String(text || ''),
  );
}

/** A short or empty download must not replace the stored copy. */
export function pageIsComplete(text) {
  const lines = String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  return lines.length >= MIN_LINES && String(text || '').length >= 800;
}

function maskForPair(line) {
  return String(line)
    .toLowerCase()
    .replace(/[\d$€£,%]+/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarParagraph(left, right) {
  if (!left || !right) return false;
  if (maskForPair(left) === maskForPair(right)) return true;
  const words = line => new Set(line.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 3));
  const a = words(left);
  const b = words(right);
  if (a.size < 4 || b.size < 4) return false;
  let hit = 0;
  for (const word of a) if (b.has(word)) hit += 1;
  return hit / Math.min(a.size, b.size) >= 0.75;
}

function pairParagraphs(removed, added) {
  const used = new Set();
  const pairs = [];
  const leftoverRemoved = [];
  for (const before of removed) {
    const index = added.findIndex((after, i) => !used.has(i) && similarParagraph(before, after));
    if (index === -1) leftoverRemoved.push(before);
    else {
      used.add(index);
      pairs.push([before, added[index]]);
    }
  }
  return { pairs, leftoverRemoved, leftoverAdded: added.filter((_, i) => !used.has(i)) };
}

function labelFor(before, after) {
  const text = `${before} ${after}`;
  return LABELS.find(item => item.pattern.test(text)) || null;
}

function cardFrom(before, after, meta, beforeText, afterText) {
  if (before && !beforeText.includes(before)) return null;
  if (after && !afterText.includes(after)) return null;
  if (!before && !after) return null;
  const named = labelFor(before, after);
  const summary = before && after
    ? `Was “${clip(before)}”. Now “${clip(after)}”.`
    : after
      ? `Now “${clip(after)}”.`
      : `Was “${clip(before)}”.`;
  return {
    id: `${meta.id}-${hashText(`${before}\n${after}`).slice(0, 12)}`,
    pageId: meta.id,
    detectedAt: meta.detectedAt,
    firm: meta.firm,
    market: meta.market,
    plan: meta.plan || null,
    kind: named?.kind || meta.kind || 'rules',
    title: named ? `${meta.firm} ${named.label.toLowerCase()}` : `${meta.firm} rules`,
    summary,
    sourceUrl: meta.url,
    facts: [
      {
        label: named?.label || 'Rule wording',
        stage: 'published page',
        verdict: 'neutral',
        before: before || '—',
        after: after || '—',
        beforeLine: before,
        afterLine: after,
      },
    ],
    hunks: [
      {
        before: before ? [before] : [],
        after: after ? [after] : [],
        removed: before ? [before] : [],
        added: after ? [after] : [],
      },
    ],
    status: 'published',
    publishReason: 'paragraph_confirmed',
  };
}

/**
 * One card per changed paragraph. Both sides must be substrings of the
 * copies we stored. Promo lines never become cards.
 */
export function paragraphCards(beforeText, afterText, meta) {
  if (!pageIsComplete(beforeText) || !pageIsComplete(afterText)) return [];
  const hunks = diffTexts(beforeText, afterText);
  const cards = [];
  const seen = new Set();
  for (const hunk of hunks) {
    const removed = hunk.removed.filter(usableParagraph);
    const added = hunk.added.filter(usableParagraph);
    const { pairs, leftoverRemoved, leftoverAdded } = pairParagraphs(removed, added);
    const drafts = [
      ...pairs,
      ...leftoverRemoved.map(line => [line, '']),
      ...leftoverAdded.map(line => ['', line]),
    ];
    for (const [before, after] of drafts) {
      const card = cardFrom(before, after, meta, beforeText, afterText);
      if (!card || seen.has(card.id)) continue;
      seen.add(card.id);
      cards.push(card);
    }
  }
  return cards;
}
