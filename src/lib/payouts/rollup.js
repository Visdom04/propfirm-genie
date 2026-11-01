export const HOUR = 36e5;
export const DAY = 864e5;
export const WINDOWS = ['d1', 'd7', 'd30', 'all'];
export const BUCKETS = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];
export const HIST_LABELS = [
  'Under $100',
  '$100 to 250',
  '$250 to 500',
  '$500 to 1K',
  '$1K to 2.5K',
  '$2.5K to 5K',
  '$5K to 10K',
  '$10K to 25K',
  '$25K and up',
];
export const WIN_MS = { d1: DAY, d7: 7 * DAY, d30: 30 * DAY, d90: 90 * DAY };

export function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function earliest(events) {
  let first = Infinity;
  for (const event of events) if (event.at < first) first = event.at;
  return first;
}

export function hourFloor(ms) {
  return Math.floor(ms / HOUR) * HOUR;
}

export function utcDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function utcMonth(ms) {
  return new Date(ms).toISOString().slice(0, 7);
}

export function keepPayout(event, ownWallets = new Set()) {
  if (!event || !(event.amount > 0)) return false;
  if (event.kind && event.kind !== 'payout') return false;
  if (event.to && ownWallets.has(String(event.to).toLowerCase())) return false;
  return true;
}

export function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : money((sorted[mid - 1] + sorted[mid]) / 2);
}

export function histIndex(amount, buckets = BUCKETS) {
  for (let i = 0; i < buckets.length; i += 1) {
    if (amount < buckets[i]) return i;
  }
  return buckets.length;
}

export function windowFrom(win, now) {
  if (win === 'all') return 0;
  return now - (WIN_MS[win] || WIN_MS.d7);
}

export function inWindow(event, win, now) {
  return event.at > windowFrom(win, now) && event.at <= now;
}

function stats(events, extra) {
  const amounts = events.map(event => event.amount);
  return [amounts.length, money(amounts.reduce((sum, n) => sum + n, 0)), money(amounts.reduce((max, n) => Math.max(max, n), 0)), extra];
}

export function windowTuple(events, win, now) {
  const slice = events.filter(event => inWindow(event, win, now));
  if (win === 'all') {
    const first = events.length ? utcDay(earliest(events)) : null;
    return stats(slice, first);
  }
  return stats(slice, money(median(slice.map(event => event.amount))));
}

export function windowView(tuple) {
  const count = Number(tuple?.[0]) || 0;
  const amount = Number(tuple?.[1]) || 0;
  return { count, amount, largest: Number(tuple?.[2]) || 0, extra: tuple?.[3] ?? null, avg: count ? amount / count : 0 };
}

export function hourBins(events, hour, length = 168) {
  const bins = Array.from({ length }, () => [0, 0]);
  for (const event of events) {
    const i = length - 1 - Math.floor((hour - event.at) / HOUR);
    if (i < 0 || i >= length) continue;
    bins[i][0] = money(bins[i][0] + event.amount);
    bins[i][1] += 1;
  }
  return bins;
}

export function dayBins(events, now, length = 90) {
  const last = utcDay(now);
  const end = Date.parse(`${last}T00:00:00Z`);
  const map = new Map();
  for (const event of events) {
    const key = utcDay(event.at);
    const row = map.get(key) || [key, 0, 0];
    row[1] = money(row[1] + event.amount);
    row[2] += 1;
    map.set(key, row);
  }
  const out = [];
  for (let i = length - 1; i >= 0; i -= 1) {
    const key = utcDay(end - i * DAY);
    out.push(map.get(key) || [key, 0, 0]);
  }
  return out;
}

export function monthBins(events, now) {
  if (!events.length) return [];
  const first = utcMonth(earliest(events));
  const last = utcMonth(now);
  const map = new Map();
  for (const event of events) {
    const key = utcMonth(event.at);
    const row = map.get(key) || [key, 0, 0];
    row[1] = money(row[1] + event.amount);
    row[2] += 1;
    map.set(key, row);
  }
  const [fy, fm] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  const out = [];
  for (let cursor = fy * 12 + (fm - 1); cursor <= ly * 12 + (lm - 1); cursor += 1) {
    const key = `${Math.floor(cursor / 12)}-${String((cursor % 12) + 1).padStart(2, '0')}`;
    out.push(map.get(key) || [key, 0, 0]);
  }
  return out;
}

export function hist30(events, now, buckets = BUCKETS) {
  const counts = Array.from({ length: buckets.length + 1 }, () => 0);
  for (const event of events) {
    if (!inWindow(event, 'd30', now)) continue;
    counts[histIndex(event.amount, buckets)] += 1;
  }
  return counts;
}

export function biggestDay(days) {
  let best = null;
  for (const row of days) {
    if (!best || row[1] > best[1]) best = row;
  }
  return best && best[1] > 0 ? [best[0], best[1]] : null;
}

export function topPayouts(events, n = 10) {
  return events
    .slice()
    .sort((a, b) => b.amount - a.amount || b.at - a.at)
    .slice(0, n)
    .map(event => [utcDay(event.at), event.amount, event.tx || null, event.chain || null]);
}

// Latest payout batches: payouts a firm sends within 15 minutes of each other.
// Each row: [iso of newest, count, amount, [[tx, amount, chain], ...first `per`]].
export function recentBatches(events, n = 8, per = 12, gap = 15 * 60e3) {
  const sorted = events.slice().sort((a, b) => b.at - a.at);
  const out = [];
  let cur = null;
  for (const event of sorted) {
    if (cur && cur.first - event.at <= gap) {
      cur.count += 1;
      cur.amount += event.amount;
      if (cur.items.length < per) cur.items.push([event.tx || null, event.amount, event.chain || null]);
      continue;
    }
    if (out.length === n) break;
    cur = { first: event.at, count: 1, amount: event.amount, items: [[event.tx || null, event.amount, event.chain || null]] };
    out.push(cur);
  }
  return out.map(batch => [new Date(batch.first).toISOString(), batch.count, money(batch.amount), batch.items]);
}

export function recentPayouts(events, n = 10) {
  return events
    .slice()
    .sort((a, b) => b.at - a.at)
    .slice(0, n)
    .map(event => [new Date(event.at).toISOString(), event.amount, event.tx || null, event.chain || null]);
}

// Same-length window just before the current one, for "vs previous" deltas.
export function prevTuple(events, win, now) {
  const span = WIN_MS[win];
  if (!span) return null;
  const [count, amount] = windowTuple(events, win, now - span);
  return [count, amount];
}

// Typical wait between payout batches over the last 30 days, in ms (90th percentile).
// Payouts closer than 15 minutes count as one batch.
export function usualGap(events, now, batch = 15 * 60e3) {
  const times = events.filter(event => event.at > now - WIN_MS.d30 && event.at <= now).map(event => event.at).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < times.length; i += 1) {
    const gap = times[i] - times[i - 1];
    if (gap > batch) gaps.push(gap);
  }
  if (gaps.length < 3) return null;
  gaps.sort((a, b) => a - b);
  return gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * 0.9))];
}

export function spark(firm, win) {
  const hours = firm.hours || [];
  if (win === 'd1' && hours.length >= 24) return hours.slice(-24).map(bin => bin[0] || 0);
  if (win === 'd7' && hours.length >= 168) {
    const out = [];
    const slice = hours.slice(-168);
    for (let i = 0; i < slice.length; i += 4) {
      out.push(slice.slice(i, i + 4).reduce((sum, bin) => sum + (bin[0] || 0), 0));
    }
    return out;
  }
  if (win === 'all') return (firm.months || []).map(row => row[1] || 0);
  return (firm.days || []).slice(-30).map(row => row[1] || 0);
}

export function mixCols(firms, win, hour) {
  const live = firms.filter(firm => Array.isArray(firm.hours) && firm.hours.length >= 168);
      const hourMs = Date.parse(hour) || 0;
  if ((win === 'd1' || win === 'd7') && live.length === firms.length && firms.length) {
    const step = win === 'd1' ? 1 : 4;
    const cols = win === 'd1' ? 24 : 42;
    return Array.from({ length: cols }, (_, i) => {
      const start = hourMs - ((cols - 1 - i) * step + (step - 1)) * HOUR;
      const parts = firms.map(firm => {
        const chunk = firm.hours.slice(-cols * step).slice(i * step, i * step + step);
        const amount = chunk.reduce((sum, bin) => sum + (bin[0] || 0), 0);
        const count = chunk.reduce((sum, bin) => sum + (bin[1] || 0), 0);
        return [firm.id, money(amount), count];
      });
      return { start, parts, total: money(parts.reduce((sum, part) => sum + part[1], 0)), n: parts.reduce((sum, part) => sum + part[2], 0) };
    });
  }
  if (win === 'all') {
    const keys = [...new Set(firms.flatMap(firm => (firm.months || []).map(row => row[0])))].sort();
    return keys.map(key => {
      const parts = firms.map(firm => {
        const row = (firm.months || []).find(item => item[0] === key);
        return [firm.id, row ? row[1] : 0, row ? row[2] : 0];
      });
      return { start: key, parts, total: money(parts.reduce((sum, part) => sum + part[1], 0)), n: parts.reduce((sum, part) => sum + part[2], 0) };
    });
  }
  const length = win === 'd30' ? 30 : win === 'd7' ? 7 : 2;
  return Array.from({ length }, (_, i) => {
    const parts = firms.map(firm => {
      const row = (firm.days || []).slice(-length)[i];
      return [firm.id, row ? row[1] : 0, row ? row[2] : 0];
    });
    const day = (firms[0]?.days || []).slice(-length)[i]?.[0] || '';
    return { start: day, parts, total: money(parts.reduce((sum, part) => sum + part[1], 0)), n: parts.reduce((sum, part) => sum + part[2], 0) };
  });
}

export function rankFirms(firms, win) {
  return firms.slice().sort((a, b) => {
    const da = windowView(win === 'all' ? a.all : a[win]).amount;
    const db = windowView(win === 'all' ? b.all : b[win]).amount;
    return db - da || (a.sort || 0) - (b.sort || 0);
  });
}

export function rollFirm(firm, events, now, hour) {
  const payouts = events.filter(event => event.firmId === firm.id).sort((a, b) => a.at - b.at);
  const last = payouts[payouts.length - 1] || null;
  const days = dayBins(payouts, now);
  return {
    id: firm.id,
    name: firm.name,
    rail: firm.rail,
    sort: firm.sort,
    live: true,
    d1: windowTuple(payouts, 'd1', now),
    d7: windowTuple(payouts, 'd7', now),
    d30: windowTuple(payouts, 'd30', now),
    d90: windowTuple(payouts, 'd90', now),
    all: windowTuple(payouts, 'all', now),
    prev: { d1: prevTuple(payouts, 'd1', now), d7: prevTuple(payouts, 'd7', now), d30: prevTuple(payouts, 'd30', now) },
    gap: usualGap(payouts, now),
    hours: hourBins(payouts, hour),
    days,
    months: monthBins(payouts, now),
    hist30: hist30(payouts, now),
    top: topPayouts(payouts),
    recent: recentPayouts(payouts),
    batches: recentBatches(payouts),
    best: biggestDay(days),
    last: last ? new Date(last.at).toISOString() : null,
    lastAmt: last ? last.amount : null,
    synced: new Date(now).toISOString(),
  };
}
