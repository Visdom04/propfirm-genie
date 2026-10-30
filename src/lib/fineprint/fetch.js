// The checker says who it is. Sites that block bots stay blocked: we report
// them on Watch health and never route around the block.
export const BOT_UA = 'PropFirmGenieBot/1.0 (+https://propfirm-genie.vercel.app/updates; rules-change monitor)';

export const FETCH_HEADERS = {
  'user-agent': BOT_UA,
  accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
};

// A real bot wall says so in its <title> or carries the challenge script.
// Plain body text is not enough: help-center widgets ship strings like "Just a moment…".
const CHALLENGE_TITLE = /<title[^>]*>[^<]*(just a moment|attention required|checking your browser)/i;
const CHALLENGE_MARK = /cf-browser-verification|cf_chl_|\/cdn-cgi\/challenge-platform/i;

export function isChallengePage(body) {
  return CHALLENGE_TITLE.test(body || '') || CHALLENGE_MARK.test(body || '');
}

export function isRetryable(status) {
  return status === 0 || status === 502 || status === 503;
}

/** A bot wall, not a missing page. */
export function isBlockedStatus(status) {
  return status === 401 || status === 403 || status === 429;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchOnce(url, { timeoutMs = 20000, fetchFn = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(url, {
      redirect: 'follow',
      headers: FETCH_HEADERS,
      signal: controller.signal,
    });
    const body = await response.text();
    return { status: response.status, finalUrl: response.url || url, body };
  } catch (error) {
    return { status: 0, finalUrl: url, body: '', error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWithRetry(url, { retries = 2, delayMs = 400, fetchFn = fetch, timeoutMs = 20000 } = {}) {
  let last = { status: 0, finalUrl: url, body: '' };
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    last = await fetchOnce(url, { fetchFn, timeoutMs });
    if (last.status === 200 && last.body) return last;
    if (!isRetryable(last.status)) break;
    await delay(delayMs * (attempt + 1));
  }
  return last;
}

/** Disallow rules for our bot (or *) from one robots.txt body. */
export function robotsRules(text) {
  const groups = [];
  let current = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const match = line.match(/^(user-agent|disallow|allow)\s*:\s*(.*)$/i);
    if (!match) continue;
    const [, key, value] = match;
    if (key.toLowerCase() === 'user-agent') {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current) {
      current.rules.push({ allow: key.toLowerCase() === 'allow', path: value });
    }
  }
  const ours = groups.find(group => group.agents.some(agent => agent && 'propfirmgeniebot'.startsWith(agent)));
  const any = groups.find(group => group.agents.includes('*'));
  return (ours || any)?.rules || [];
}

/** Longest matching rule wins; an empty Disallow allows everything. */
export function robotsAllows(rules, url) {
  let path;
  try {
    const parsed = new URL(url);
    path = parsed.pathname + parsed.search;
  } catch {
    return false;
  }
  let best = null;
  for (const rule of rules) {
    if (!rule.path) continue;
    const pattern = new RegExp(`^${rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')}`);
    if (pattern.test(path) && (!best || rule.path.length > best.path.length)) best = rule;
  }
  return !best || best.allow;
}

const robotsCache = new Map();

export async function robotsAllowsUrl(url, { fetchFn = fetch } = {}) {
  let origin;
  try {
    origin = new URL(url).origin;
  } catch {
    return false;
  }
  if (!robotsCache.has(origin)) {
    const res = await fetchOnce(`${origin}/robots.txt`, { fetchFn, timeoutMs: 10000 });
    // No robots.txt, or one we cannot read, means no stated restriction.
    robotsCache.set(origin, res.status === 200 ? robotsRules(res.body) : []);
  }
  return robotsAllows(robotsCache.get(origin), url);
}

/**
 * Walk a URL ladder. Direct 200 with real content wins. A bot wall (challenge
 * page, 401/403/429) comes back as source 'blocked'; anything else 'failed'.
 */
export async function fetchFirstOk(urls, { fetchFn = fetch, retries = 2, delayMs = 400 } = {}) {
  const list = (urls || []).filter(Boolean);
  let last = { status: 0, finalUrl: list[0] || '', body: '', source: 'failed' };
  let blocked = false;
  for (const url of list) {
    last = await fetchWithRetry(url, { fetchFn, retries, delayMs });
    if (last.status === 200 && last.body && !isChallengePage(last.body)) return { ...last, source: 'direct' };
    if (isBlockedStatus(last.status) || (last.status === 200 && isChallengePage(last.body))) blocked = true;
  }
  return { ...last, source: blocked ? 'blocked' : 'failed' };
}
