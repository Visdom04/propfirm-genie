import { createHash } from 'node:crypto';
import { NUMBER, judgeChange, maskNumbers } from './terms.js';

// Promo and markup. Always noise, even next to a trading word.
const NOISE = [
  /\buse code\b/i,
  /\b%\s*off\b/i,
  /\bfree trial\b/i,
  /\blimited time\b/i,
  /\bcoupon\b/i,
  /\bsavings total\b/i,
  /\bcookie\b/i,
  /\baccept all\b/i,
  /data-cf-modified/i,
  /\bthis\.classList\b/,
  /data-code="/i,
  /^[[{]/,
  /^!\[/,
  /SIL Open Font License/i,
  /Reserved Font Name/i,
  /Intercom, Inc/i,
];

// Hydration JSON and minified blobs, not sentences a trader reads.
const MAX_LINE = 600;

// Nav and social chrome. Noise only when the line names no trading term,
// so "Payout review takes 5 days" survives.
const SOFT_NOISE = [/\breviews?\b/i, /\bsubscribe\b/i, /\bsign up\b/i, /\blog in\b/i, /\bprivacy policy\b/i];

const TRADE_SIGNAL =
  /\b(price|fee|cost|drawdown|daily loss|max(?:imum)? loss|loss limit|profit target|profit split|payout|consistency|activation|trailing|static|min(?:imum)? trad(?:ing)? days|news trad)\b/i;

export function hashText(text) {
  return createHash('sha256').update(String(text)).digest('hex');
}

/**
 * A new page version must be fetched twice in a row before we diff it.
 * unchanged: same as baseline. pending: first sighting, hold it. confirmed: seen again.
 */
export function gateVersion({ baseHash, pendingHash, hash }) {
  if (hash === baseHash) return 'unchanged';
  return hash === pendingHash ? 'confirmed' : 'pending';
}

export function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/** Help-center and pricing HTML to comparable lines. */
export function htmlToText(html) {
  const stripped = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '\n')
    .replace(/\son\w+="[^"]*"/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped)
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => {
      if (!line || line.length > MAX_LINE) return false;
      if (/^[[{]/.test(line)) return false;
      if (/SIL Open Font License|Reserved Font Name|Intercom, Inc/i.test(line)) return false;
      if (/^\{"@context"/i.test(line)) return false;
      return true;
    })
    .join('\n');
}

export function isNoiseLine(line) {
  const text = String(line || '').trim();
  if (!text || text.length > MAX_LINE) return true;
  if (NOISE.some(pattern => pattern.test(text))) return true;
  return !TRADE_SIGNAL.test(text) && SOFT_NOISE.some(pattern => pattern.test(text));
}

function linesOf(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function lcsOps(a, b) {
  if (a.length * b.length > 4000000) {
    return [
      ...a.map(line => ({ t: 'del', line })),
      ...b.map(line => ({ t: 'ins', line })),
    ];
  }
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ t: 'eq', line: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ t: 'del', line: a[i] });
      i += 1;
    } else {
      ops.push({ t: 'ins', line: b[j] });
      j += 1;
    }
  }
  while (i < n) ops.push({ t: 'del', line: a[i++] });
  while (j < m) ops.push({ t: 'ins', line: b[j++] });
  return ops;
}

function hunkFromRun(run, elidedBefore, elidedAfter) {
  const before = [];
  const after = [];
  const removed = [];
  const added = [];
  for (const op of run) {
    if (op.t === 'eq') {
      before.push(op.line);
      after.push(op.line);
    } else if (op.t === 'del') {
      before.push(op.line);
      if (!isNoiseLine(op.line)) removed.push(op.line);
    } else {
      after.push(op.line);
      if (!isNoiseLine(op.line)) added.push(op.line);
    }
  }
  if (!removed.length && !added.length) return null;
  return {
    before: before.slice(0, 8),
    after: after.slice(0, 8),
    removed: removed.slice(0, 8),
    added: added.slice(0, 8),
    elidedBefore,
    elidedAfter,
  };
}

/** Line diff. Noise-only edits drop out. */
export function diffTexts(before, after) {
  const a = linesOf(before);
  const b = linesOf(after);
  if (a.join('\n') === b.join('\n')) return [];
  // Trim the shared head and tail so a one-line edit on a long page stays cheap.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
  const eq = line => ({ t: 'eq', line });
  const ops = [
    ...a.slice(0, head).map(eq),
    ...lcsOps(a.slice(head, a.length - tail), b.slice(head, b.length - tail)),
    ...a.slice(a.length - tail).map(eq),
  ];
  const hunks = [];
  let index = 0;
  while (index < ops.length) {
    if (ops[index].t === 'eq') {
      index += 1;
      continue;
    }
    const start = index;
    while (index < ops.length && ops[index].t !== 'eq') index += 1;
    const contextBefore = start > 0 && ops[start - 1].t === 'eq' ? [ops[start - 1]] : [];
    const contextAfter = index < ops.length && ops[index].t === 'eq' ? [ops[index]] : [];
    const hunk = hunkFromRun(
      [...contextBefore, ...ops.slice(start, index), ...contextAfter],
      start > 0,
      index < ops.length,
    );
    if (hunk) hunks.push(hunk);
    if (hunks.length >= 8) break;
  }
  return hunks;
}

/** Same sentence, one number moved. Pairing across lines is how unrelated values got matched. */
function numericFact(before, after) {
  const judged = judgeChange(before, after);
  if (!judged) return null;
  return {
    label: judged.label,
    stage: 'published page',
    verdict: judged.verdict,
    before: judged.before,
    after: judged.after,
    unit: judged.unit,
    beforeLine: before,
    afterLine: after,
  };
}

function signalLines(lines) {
  return lines.filter(line => TRADE_SIGNAL.test(line) && !isNoiseLine(line));
}

export function factsFromHunks(hunks) {
  const removed = signalLines(hunks.flatMap(hunk => hunk.removed));
  const added = signalLines(hunks.flatMap(hunk => hunk.added));
  const facts = [];
  const used = new Set();
  for (const line of removed) {
    const match = added.findIndex((candidate, i) => !used.has(i) && maskNumbers(candidate) === maskNumbers(line));
    if (match === -1) continue;
    const fact = numericFact(line, added[match]);
    if (!fact) continue;
    used.add(match);
    facts.push(fact);
  }
  const oneNumber = line => (line.match(NUMBER) || []).length <= 1;
  if (
    !facts.length &&
    removed.length === 1 &&
    added.length === 1 &&
    removed[0] !== added[0] &&
    oneNumber(removed[0]) &&
    oneNumber(added[0])
  ) {
    facts.push({
      label: 'Rule wording',
      stage: 'published page',
      verdict: 'unscored',
      before: removed[0],
      after: added[0],
      beforeLine: removed[0],
      afterLine: added[0],
    });
  }
  return facts;
}

export function hasTradeSignal(change) {
  return (change.facts || []).length > 0;
}

export function liveQuotesHold(change, liveText) {
  for (const fact of change.facts || []) {
    if (fact.after && !textHas(liveText, fact.after)) return false;
  }
  const added = (change.hunks || []).flatMap(hunk => hunk.added || []);
  const removed = (change.hunks || []).flatMap(hunk => hunk.removed || []);
  if (added.length) return added.every(line => textHas(liveText, line));
  if (removed.length) return removed.some(line => !textHas(liveText, line));
  return false;
}

function titleFor(meta, facts) {
  const fact = facts[0];
  if (!fact) return `${meta.firm} ${meta.kind} page changed`;
  if (fact.label === 'Rule wording') return `${meta.firm} ${meta.kind} terms changed`;
  return `${meta.firm} ${fact.label.toLowerCase()} moved from ${fact.before} to ${fact.after}`;
}

function summaryFor(meta, facts, hunks) {
  const fact = facts[0];
  if (fact?.beforeLine && fact?.afterLine) {
    return `Was “${clip(fact.beforeLine)}”. Now “${clip(fact.afterLine)}”.`;
  }
  if (fact) {
    return `${meta.plan ? `${meta.plan}: ` : ''}${fact.label} is now ${fact.after}, was ${fact.before}.`;
  }
  const added = hunks[0]?.added?.[0];
  const removed = hunks[0]?.removed?.[0];
  if (removed && added) return `Was “${clip(removed)}”. Now “${clip(added)}”.`;
  if (added) return `Added “${clip(added)}”.`;
  if (removed) return `Removed “${clip(removed)}”.`;
  return 'Watched page text changed.';
}

function clip(line) {
  return line.length > 140 ? `${line.slice(0, 137)}...` : line;
}

function textHas(haystack, needle) {
  const piece = String(needle || '').trim();
  if (!piece) return false;
  return String(haystack || '').includes(piece);
}

/**
 * Traders must only see quotes that exist in stored snapshots.
 * An LLM can draft a summary. It cannot invent before/after.
 */
export function quotesAreGrounded(change, beforeText, afterText) {
  for (const fact of change.facts || []) {
    if (fact.before && !textHas(beforeText, fact.before)) return false;
    if (fact.after && !textHas(afterText, fact.after)) return false;
    if (fact.beforeLine && !textHas(beforeText, fact.beforeLine)) return false;
    if (fact.afterLine && !textHas(afterText, fact.afterLine)) return false;
  }
  for (const hunk of change.hunks || []) {
    for (const line of hunk.removed || []) {
      if (!textHas(beforeText, line)) return false;
    }
    for (const line of hunk.added || []) {
      if (!textHas(afterText, line)) return false;
    }
    for (const line of hunk.before || []) {
      if (!textHas(beforeText, line) && !textHas(afterText, line)) return false;
    }
    for (const line of hunk.after || []) {
      if (!textHas(afterText, line) && !textHas(beforeText, line)) return false;
    }
  }
  return true;
}

export function canPublish(change, beforeText, afterText) {
  if (!change || change.status === 'dismissed') return false;
  if (!quotesAreGrounded(change, beforeText, afterText)) return false;
  if (!String(change.summary || '').trim()) return false;
  const facts = change.facts || [];
  if (facts.some(fact => !fact.beforeLine || !fact.afterLine)) return false;
  return true;
}

/**
 * Software 1.0 publisher. No LLM in this path.
 * Publish only when quotes sit in stored text, still match a second fetch,
 * and the edit is a trading term, not a headline swap. Wording-only edits on
 * marketing pages churn too much to trust, so they wait for a human.
 */
export function decidePublication(change, { beforeText, afterText, liveText } = {}) {
  if (!canPublish(change, beforeText, afterText)) {
    return { status: 'dismissed', reason: 'ungrounded' };
  }
  if (!hasTradeSignal(change)) {
    return { status: 'dismissed', reason: 'no_trade_signal' };
  }
  if (liveText != null && !liveQuotesHold(change, liveText)) {
    return { status: 'dismissed', reason: 'live_mismatch' };
  }
  if (change.kind === 'pricing' && change.facts.every(fact => fact.label === 'Rule wording')) {
    return { status: 'needs_review', reason: 'wording_on_marketing_page' };
  }
  return { status: 'published', reason: 'auto' };
}

export function applyPublication(change, decision, at) {
  change.status = decision.status;
  change.publishReason = decision.reason;
  if (decision.status === 'published') change.publishedAt = at || new Date().toISOString();
  return change;
}

/**
 * Compare two stored page texts.
 * Returns null when identical or only promo/nav noise.
 */
export function detectChange(before, after, meta) {
  const hunks = diffTexts(before, after);
  if (!hunks.length) return null;
  const facts = factsFromHunks(hunks);
  return {
    id: `${meta.id}-${hashText(after).slice(0, 12)}`,
    pageId: meta.id,
    detectedAt: meta.detectedAt,
    firm: meta.firm,
    market: meta.market,
    plan: meta.plan,
    kind: meta.kind,
    title: titleFor(meta, facts),
    summary: summaryFor(meta, facts, hunks),
    sourceUrl: meta.url,
    facts,
    hunks,
    status: 'needs_review',
  };
}
