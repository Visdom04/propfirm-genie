const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const FETCH_HEADERS = {
  'user-agent': UA,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'upgrade-insecure-requests': '1',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
};

export function readerUrl(url) {
  return `https://r.jina.ai/${url}`;
}

/** https://r.jina.ai/https://… often 403s. The http:// form can still return the article. */
export function readerMirrors(url) {
  const httpsForm = readerUrl(url);
  const httpForm = `https://r.jina.ai/${String(url).replace(/^https:\/\//i, 'http://')}`;
  return httpsForm === httpForm ? [httpsForm] : [httpForm, httpsForm];
}

export function isRetryable(status) {
  return status === 0 || status === 429 || status === 502 || status === 503;
}

export function needsReader(status) {
  return status === 0 || status === 403 || status === 429 || status === 503;
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

/**
 * Walk a URL ladder. Direct 200 wins. Cloudflare 403/DNS miss falls back to
 * the public reader so the firm still gets a text snapshot. A 404 does not:
 * a dead page should show as blocked, not be papered over by the reader.
 */
export async function fetchFirstOk(urls, { useReader = true, fetchFn = fetch, retries = 2, delayMs = 400 } = {}) {
  const list = (urls || []).filter(Boolean);
  let last = { status: 0, finalUrl: list[0] || '', body: '', source: 'failed' };
  let blocked = false;
  for (const url of list) {
    last = { ...(await fetchWithRetry(url, { fetchFn, retries, delayMs })), source: 'direct' };
    if (last.status === 200 && last.body) {
      // Cloudflare often answers 200 with a challenge shell. That is not the article.
      if (/just a moment|attention required|cf-browser-verification|checking your browser/i.test(last.body)) {
        blocked = true;
      } else {
        return last;
      }
    } else if (needsReader(last.status)) {
      blocked = true;
    }
  }
  if (useReader && blocked) {
    for (const url of list) {
      for (const viaUrl of readerMirrors(url)) {
        const via = await fetchWithRetry(viaUrl, { fetchFn, retries: 1, delayMs });
        const shell = /just a moment|attention required|enable javascript and cookies/i.test(via.body || '');
        if (via.status === 200 && via.body && via.body.length > 400 && !shell) {
          return { ...via, source: 'reader', watchedUrl: url };
        }
        last = { ...via, source: 'reader', watchedUrl: url };
      }
    }
  }
  return { ...last, source: 'failed' };
}
