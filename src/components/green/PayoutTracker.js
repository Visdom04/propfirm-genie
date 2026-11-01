'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { PAYOUT_FIRMS, RAIL_LABEL, railChip } from '@/lib/payouts/catalog';
import { HIST_LABELS, mixCols, rankFirms, spark, windowView } from '@/lib/payouts/rollup';
import { PAYOUT_WALLETS } from '@/lib/payouts/wallets';
import { firmLogo } from '@/lib/firmLogos';
import PayoutBackdrop from './PayoutBackdrop';
import DotLogo from './DotLogo';
import './payouts.css';

const WINS = [
  { id: 'd1', short: '24h', long: 'in the last 24 hours' },
  { id: 'd7', short: '7d', long: 'in the last 7 days' },
  { id: 'd30', short: '30d', long: 'in the last 30 days' },
  { id: 'all', short: 'All', long: 'all time' },
];
const WIN_KEY = 'pfg-po-win';
const FRESH_MS = 3600000;
const STALE_MS = 3 * 3600000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BATCH_MS = 15 * 60000;
const QUIET_FLOOR = 24 * 3600000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HIST_SHORT = ['<$100', '$100', '$250', '$500', '$1K', '$2.5K', '$5K', '$10K', '$25K+'];
const ACCENT = '#3FB185';
const STEPS = ['#cfe3da', '#a9c4b8', '#87a598', '#6b897d', '#557064', '#445a51', '#374a42', '#2d3d37'];
const BAR = '#4a6b5e';
const EXPLORER = {
  arbitrum: { name: 'Arbiscan', base: 'https://arbiscan.io' },
  ethereum: { name: 'Etherscan', base: 'https://etherscan.io' },
  base: { name: 'Basescan', base: 'https://basescan.org' },
};
const SORTS = [
  { key: 'amount', label: 'Paid out' },
  { key: 'count', label: 'Payouts' },
  { key: 'avg', label: 'Average' },
  { key: 'largest', label: 'Largest' },
  { key: 'last', label: 'Latest' },
];

function subscribeClock(onTick) {
  const id = setInterval(onTick, 30000);
  return () => clearInterval(id);
}

function readClock() {
  return Math.floor(Date.now() / 30000) * 30000;
}

function readClockServer() {
  return null;
}

const WIN_IDS = ['d1', 'd7', 'd30', 'all'];
const winListeners = new Set();
let memoryWin = null;

function subscribeWin(onChange) {
  winListeners.add(onChange);
  return () => winListeners.delete(onChange);
}

function readWin() {
  if (memoryWin) return memoryWin;
  try {
    const saved = localStorage.getItem(WIN_KEY);
    return WIN_IDS.includes(saved) ? saved : 'd7';
  } catch {
    return 'd7';
  }
}

function readWinServer() {
  return 'd7';
}

function writeWin(id) {
  memoryWin = id;
  try {
    localStorage.setItem(WIN_KEY, id);
  } catch {}
  winListeners.forEach(onChange => onChange());
}

function commas(n) {
  const v = Math.round(Number(n) || 0);
  const neg = v < 0 ? '-' : '';
  return neg + String(Math.abs(v)).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function money(n) {
  const v = Number(n) || 0;
  if (v > 0 && v < 10) return `$${v.toFixed(2)}`;
  return `$${commas(v)}`;
}

function trim(n, digits) {
  return String(parseFloat(n.toFixed(digits)));
}

function compact(n) {
  const v = Math.abs(Number(n) || 0);
  if (v >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (v >= 1e4) return `$${trim(n / 1e3, 1)}K`;
  return money(n);
}

function axis(n) {
  if (n >= 1e6) return `$${trim(n / 1e6, 2)}M`;
  if (n >= 1e3) return `$${trim(n / 1e3, 1)}K`;
  return `$${trim(n, 0)}`;
}

function niceMax(max) {
  if (!(max > 0)) return 1;
  const exp = Math.floor(Math.log10(max));
  const f = max / 10 ** exp;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(s => f <= s + 1e-9) || 10;
  return step * 10 ** exp;
}

function ago(iso, now) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t) || now == null) return '-';
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function dayLabel(key) {
  const [, m, d] = String(key).split('-').map(Number);
  return m && d ? `${MONTHS[m - 1]} ${d}` : '';
}

function bucketLabel(start, win, long) {
  if (typeof start === 'number') {
    const d = new Date(start);
    if (win === 'd1') return long ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${pad(d.getUTCHours())}:00 UTC` : `${pad(d.getUTCHours())}:00`;
    return long ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${pad(d.getUTCHours())}:00 UTC` : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }
  if (/^\d{4}-\d{2}$/.test(start || '')) {
    const [y, m] = start.split('-').map(Number);
    return long ? `${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} '${String(y).slice(2)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(start || '')) return dayLabel(start);
  return '';
}

function tuple(firm, win) {
  return windowView(win === 'all' ? firm.all : firm[win]);
}

function metaOf(firm) {
  const hit = PAYOUT_FIRMS.find(item => item.id === firm.id);
  return hit || { id: firm.id, name: firm.name || firm.id, short: firm.name || firm.id, catalog: firm.name || firm.id, rail: firm.rail };
}

function explorerLink(chain, kind, value) {
  const e = EXPLORER[chain];
  return e && value ? `${e.base}/${kind}/${value}` : null;
}

function walletsOf(firm) {
  return PAYOUT_WALLETS.filter(wallet => wallet.firmId === firm?.id).map(wallet => ({ chain: wallet.chain, address: wallet.address, label: wallet.label }));
}

function prevOf(scope, win) {
  if (win === 'all') return null;
  let amount = 0;
  let count = 0;
  for (const firm of scope) {
    const row = firm.prev?.[win];
    if (!row) return null;
    count += Number(row[0]) || 0;
    amount += Number(row[1]) || 0;
  }
  return { count, amount };
}

function hoursLabel(ms) {
  const h = ms / 3600000;
  if (h < 1.5) return 'every hour';
  if (h < 36) return `every ${Math.round(h)}h`;
  return `every ${Math.round(h / 24)}d`;
}

// A firm is quiet when its last payout is well past its usual wait between batches.
function quietOf(firm, now) {
  const last = Date.parse(firm?.last || '');
  if (!Number.isFinite(last) || now == null) return null;
  const since = now - last;
  const limit = Math.max(QUIET_FLOOR, firm.gap ? firm.gap * 3 : 0);
  return since > limit ? { since, usual: firm.gap || null } : null;
}

function daysPaid(firm) {
  const days = (firm?.days || []).slice(-30);
  return { paid: days.filter(row => row[2] > 0).length, of: days.length };
}

// Groups payouts sent within minutes of each other by one firm into one batch.
function batchesOf(scope) {
  if (scope.length && scope.every(firm => Array.isArray(firm.batches))) {
    const out = [];
    for (const firm of scope) {
      const fallback = walletsOf(firm)[0]?.chain;
      for (const [at, count, amount, list] of firm.batches) {
        const items = (list || []).map(([tx, value, chain]) => ({ at, tx, amount: value, href: tx ? explorerLink(chain || fallback, 'tx', tx) : null }));
        out.push({ firm, at, first: Date.parse(at), amount, count, items });
      }
    }
    return out.sort((a, b) => b.first - a.first);
  }
  const items = [];
  for (const firm of scope) {
    const fallback = walletsOf(firm)[0];
    for (const row of firm.recent || []) {
      const chain = row[3] || fallback?.chain;
      items.push({ firm, at: row[0], t: Date.parse(row[0]), amount: row[1], tx: row[2] || null, href: row[2] ? explorerLink(chain, 'tx', row[2]) : null });
    }
  }
  items.sort((a, b) => b.t - a.t);
  const out = [];
  for (const item of items) {
    const open = out.find(group => group.firm.id === item.firm.id && group.first - item.t <= BATCH_MS);
    if (open) {
      open.items.push(item);
      open.amount += item.amount;
    } else {
      out.push({ firm: item.firm, at: item.at, first: item.t, amount: item.amount, items: [item] });
    }
  }
  for (const group of out) group.count = group.items.length;
  return out.sort((a, b) => b.first - a.first);
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Ext() {
  return <ArrowUpRight className="po-ext" size={16} strokeWidth={1.5} aria-hidden />;
}

const FAQ = [
  ['Where does this data come from?', 'Public blockchains. We read token transfers out of each firm’s payout wallets, and every payout links to its transaction.'],
  ['What counts as a payout?', 'A transfer of $10 or more out of a firm’s payout wallet. Rise firms pay by burning RiseUSD. Vest and similar firms pay in USDC.'],
  ['How often does it update?', 'Every hour. The stamp at the top shows when the last update ran.'],
  ['Why is a firm missing?', 'Firms that pay by bank transfer, Wise or card leave no public record, so they cannot appear here. Firms are added as their payout wallets are confirmed.'],
  ['Are the amounts in dollars?', 'Yes. RiseUSD and USDC are dollar-pegged, so each transfer is counted at face value.'],
];

function PayoutFaq() {
  return (
    <section className="po-faq" aria-labelledby="po-faq-title">
      <h2 id="po-faq-title">FAQ</h2>
      {FAQ.map(([question, answer]) => (
        <details key={question}>
          <summary>
            {question}
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}

function FirmMark({ name, size }) {
  const src = firmLogo(name);
  return src ? (
    <img src={src} alt="" width={36} height={36} loading="lazy" className="po-mark" data-size={size} />
  ) : (
    <span className="po-mark" data-size={size}>
      {name.slice(0, 2)}
    </span>
  );
}

function Delta({ now: cur, prev, win }) {
  if (!prev || !(prev > 0) || win === 'all') return null;
  // A 3x swing is almost always a gap in last period's tracking, not real growth.
  if (cur / prev >= 3 || cur / prev <= 1 / 3) return null;
  const change = (cur - prev) / prev;
  const pct = Math.abs(change) * 100;
  const dir = pct < 0.5 ? 'flat' : change > 0 ? 'up' : 'down';
  const label = WINS.find(item => item.id === win)?.short;
  return (
    <span className="po-delta" data-dir={dir}>
      {dir === 'up' ? <ArrowUp size={12} strokeWidth={2} aria-hidden /> : dir === 'down' ? <ArrowDown size={12} strokeWidth={2} aria-hidden /> : null}
      {dir === 'flat' ? 'Flat' : `${pct >= 10 ? Math.round(pct) : pct.toFixed(1)}%`}
      <span> vs previous {label}</span>
    </span>
  );
}

function Rhythm({ firm, hour }) {
  const week = Array.from({ length: 7 }, () => 0);
  for (const row of (firm.days || []).slice(0, -1)) {
    const d = new Date(`${row[0]}T00:00:00Z`).getUTCDay();
    week[(d + 6) % 7] += row[1] || 0;
  }
  const day = Array.from({ length: 24 }, () => 0);
  const hourMs = Date.parse(hour || '') || 0;
  const bins = firm.hours || [];
  bins.forEach((bin, i) => {
    const h = new Date(hourMs - (bins.length - 1 - i) * 3600000).getUTCHours();
    day[h] += bin[0] || 0;
  });
  const wMax = Math.max(0, ...week);
  const dMax = Math.max(0, ...day);
  if (!wMax && !dMax) return <p className="po-empty">Not enough payouts yet.</p>;
  const wPeak = week.indexOf(wMax);
  let best = 0;
  for (let h = 0; h < 24; h += 1) if (day[h] + day[(h + 1) % 24] > day[best] + day[(best + 1) % 24]) best = h;
  return (
    <div className="po-rhythm">
      <div>
        <p className="po-rhythm-head">
          Busiest day <b>{wMax ? WEEKDAYS[wPeak] : '-'}</b>
          <span>90 days</span>
        </p>
        <div className="po-rbars" data-n="7" role="img" aria-label={WEEKDAYS.map((w, i) => `${w}: ${compact(week[i])}`).join(', ')}>
          {week.map((v, i) => (
            <div key={i} data-peak={v && i === wPeak ? '' : undefined}>
              <i style={{ height: `${wMax ? Math.max(3, (v / wMax) * 100) : 0}%` }} />
              <span>{WEEKDAYS[i].slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="po-rhythm-head">
          Busiest hours <b>{dMax ? `${pad(best)}:00 to ${pad((best + 2) % 24)}:00 UTC` : '-'}</b>
          <span>7 days</span>
        </p>
        <div className="po-rbars" data-n="24" role="img" aria-label={day.map((v, h) => `${pad(h)}:00 ${compact(v)}`).join(', ')}>
          {day.map((v, h) => (
            <div key={h} data-peak={v && (h === best || h === (best + 1) % 24) ? '' : undefined}>
              <i style={{ height: `${dMax ? Math.max(3, (v / dMax) * 100) : 0}%` }} />
              <span>{h % 6 === 0 ? pad(h) : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function useTween(value, ms = 700) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return undefined;
    const span = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
    const t0 = performance.now();
    let raf = 0;
    const tick = t => {
      const p = span ? Math.min(1, (t - t0) / span) : 1;
      const v = from + (value - from) * (1 - (1 - p) ** 3);
      fromRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

function CountUp({ value, format = compact }) {
  return format(useTween(value));
}

function latestRecent(snap) {
  let max = 0;
  for (const firm of snap?.firms || []) {
    const t = Date.parse(firm.recent?.[0]?.[0] || '');
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max || null;
}

function Trend({ values, color }) {
  const n = values.length;
  if (n < 2) return null;
  const max = Math.max(0, ...values);
  const pts = values.map((v, i) => [(i / (n - 1)) * 100, max ? 26 - (v / max) * 24 : 26]);
  const line = `M${pts.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}`;
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="po-trend" style={{ color: max ? color : 'rgb(237 237 237 / 0.2)' }} aria-hidden>
      <path className="po-trend-line" d={line} />
    </svg>
  );
}

function HowButton({ open, onToggle }) {
  return (
    <button type="button" className="po-pill" aria-expanded={open} aria-controls="po-how" onClick={onToggle}>
      How we count
    </button>
  );
}

function Stamp({ data, now, quiet }) {
  const demo = data?.source === 'seed';
  const t = Date.parse(data?.updated || '');
  const stale = !demo && now != null && Number.isFinite(t) && now - t > STALE_MS;
  const state = demo ? 'demo' : stale ? 'stale' : quiet ? 'quiet' : 'live';
  if (quiet && !demo && !stale) {
    return (
      <p className="po-stamp" data-state={state}>
        <i className="po-dot" aria-hidden />
        <b>No payout in {ago(new Date(now - quiet.since).toISOString(), now).replace(' ago', '')}</b>
        {quiet.usual ? <span>Usually pays {hoursLabel(quiet.usual)}</span> : null}
      </p>
    );
  }
  return (
    <p className="po-stamp" data-state={state}>
      <i className="po-dot" aria-hidden />
      {demo ? (
        <b>Demo data, not real payouts</b>
      ) : (
        <>
          <b>{stale ? 'Stale' : 'Verified on-chain'}</b>
          <span>Updated {ago(data?.updated, now)}</span>
        </>
      )}
    </p>
  );
}

function MixChart({ firms, win, hour, colors }) {
  const cols = useMemo(() => mixCols(firms, win, hour), [firms, win, hour]);
  const [tip, setTip] = useState(null);
  const order = useMemo(() => rankFirms(firms, win).map(firm => firm.id), [firms, win]);
  const peak = Math.max(0, ...cols.map(col => col.total));
  if (!cols.length || !peak) return <p className="po-empty">No payouts in this window.</p>;
  const top = niceMax(peak);
  const ticks = [0, 0.5, 1].map(f => f * top);
  const marks = [...new Set([0, 0.25, 0.5, 0.75, 1].map(f => Math.round((cols.length - 1) * f)))];
  const active = tip != null ? cols[tip] : null;
  return (
    <>
      <div
        className="po-plot"
        role="img"
        aria-label={`Paid out per ${win === 'd1' ? 'hour' : win === 'd7' ? '4 hours' : win === 'd30' ? 'day' : 'month'}, peak ${compact(peak)}`}
        onPointerLeave={e => {
          if (e.pointerType === 'mouse') setTip(null);
        }}
      >
        <div className="po-yax" aria-hidden>
          {ticks.map(v => (
            <span key={v} style={{ bottom: `${(v / top) * 100}%` }}>
              {v ? axis(v) : '0'}
            </span>
          ))}
        </div>
        <div className="po-grid">
          {ticks.slice(1).map(v => (
            <i key={v} style={{ bottom: `${(v / top) * 100}%` }} aria-hidden />
          ))}
          <div className="po-bars" key={win}>
            {cols.map((col, i) => (
              <div key={i} className="po-col" data-on={tip === i ? '' : undefined} onPointerEnter={() => setTip(i)} onPointerDown={() => setTip(i)}>
                <div className="po-stack" style={{ height: `${(col.total / top) * 100}%`, '--i': i }}>
                  {order.map(id => {
                    const part = col.parts.find(item => item[0] === id);
                    return part?.[1] ? <i key={id} className="po-seg-bar" style={{ flexGrow: part[1], background: colors[id] }} /> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
          {active ? (
            <div className="po-tip" data-flip={tip / cols.length > 0.55 ? '' : undefined} style={{ left: `${((tip + 0.5) / cols.length) * 100}%` }}>
              <p>{bucketLabel(active.start, win, true)}</p>
              <b>{money(active.total)}</b>
              <p>{commas(active.n)} payouts</p>
              {active.parts
                .filter(part => part[1] > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(part => (
                  <p key={part[0]} className="po-tip-row" style={{ color: 'var(--po-ink)' }}>
                    <span>
                      <i className="po-swatch" style={{ '--c': colors[part[0]] }} />
                      {firms.find(f => f.id === part[0]) ? metaOf(firms.find(f => f.id === part[0])).short : part[0]}
                    </span>
                    <span>{money(part[1])}</span>
                  </p>
                ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="po-xax" aria-hidden>
        {marks.map((i, k) => (
          <span key={i} data-edge={k === 0 ? 'first' : k === marks.length - 1 ? 'last' : undefined} style={k === 0 ? { left: 0 } : k === marks.length - 1 ? { left: '100%' } : { left: `${((i + 0.5) / cols.length) * 100}%` }}>
            {bucketLabel(cols[i].start, win, false)}
          </span>
        ))}
      </div>
    </>
  );
}

export default function PayoutTracker({ initial, firmId = null }) {
  const [data, setData] = useState(initial);
  const [since, setSince] = useState(null);
  const dataRef = useRef(initial);
  const win = useSyncExternalStore(subscribeWin, readWin, readWinServer);
  const now = useSyncExternalStore(subscribeClock, readClock, readClockServer);
  const [sort, setSort] = useState({ key: 'amount', dir: 'desc' });
  const [how, setHow] = useState(false);

  useEffect(() => {
    let on = true;
    const pull = () => {
      fetch('/api/payouts/tracker')
        .then(res => (res.ok ? res.json() : null))
        .then(next => {
          if (!on || !next?.firms) return;
          setSince(latestRecent(dataRef.current));
          dataRef.current = next;
          setData(next);
        })
        .catch(() => {});
    };
    const id = setInterval(pull, 120000);
    const vis = () => {
      if (!document.hidden) pull();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      on = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  const firms = useMemo(() => data?.firms || [], [data]);
  const ranked = useMemo(() => rankFirms(firms, win), [firms, win]);
  const colors = useMemo(() => {
    const out = {};
    ranked.forEach((firm, i) => {
      out[firm.id] = i === 0 ? ACCENT : STEPS[Math.min(i - 1, STEPS.length - 1)];
    });
    if (firmId) out[firmId] = ACCENT;
    return out;
  }, [ranked, firmId]);
  const focus = firmId ? firms.find(firm => firm.id === firmId) || null : null;
  const scope = useMemo(() => (firmId ? (focus ? [focus] : []) : firms), [firmId, focus, firms]);
  const focusMeta = focus ? metaOf(focus) : PAYOUT_FIRMS.find(firm => firm.id === firmId);
  const demo = data?.source === 'seed';
  const winInfo = WINS.find(item => item.id === win);

  const total = useMemo(() => {
    const rows = scope.map(firm => tuple(firm, win));
    const count = rows.reduce((sum, row) => sum + row.count, 0);
    const amount = rows.reduce((sum, row) => sum + row.amount, 0);
    return {
      count,
      amount,
      largest: rows.reduce((max, row) => Math.max(max, row.largest), 0),
      avg: count ? amount / count : 0,
      paying: rows.filter(row => row.count > 0).length,
      prev: prevOf(scope, win),
    };
  }, [scope, win]);

  const heroTrend = useMemo(() => {
    const series = scope.map(firm => spark(firm, win));
    const len = Math.max(0, ...series.map(item => item.length));
    return Array.from({ length: len }, (_, i) => series.reduce((sum, item) => sum + (item[i] || 0), 0));
  }, [scope, win]);

  const lastIso = useMemo(() => {
    const times = scope.map(firm => Date.parse(firm.last || '')).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)).toISOString() : null;
  }, [scope]);

  const rows = useMemo(() => {
    const rank = new Map(ranked.map((firm, i) => [firm.id, i + 1]));
    const value = firm => {
      const row = tuple(firm, win);
      if (sort.key === 'last') return Date.parse(firm.last || '') || 0;
      return row[sort.key] || 0;
    };
    const dir = sort.dir === 'asc' ? 1 : -1;
    return firms
      .slice()
      .sort((a, b) => (value(a) - value(b)) * dir || (rank.get(a.id) || 0) - (rank.get(b.id) || 0))
      .map(firm => ({ firm, rank: rank.get(firm.id), row: tuple(firm, win) }));
  }, [firms, ranked, win, sort]);
  const maxAmount = Math.max(0, ...rows.map(item => item.row.amount));
  // The podium already shows the top three, so the default view starts the table at 4.
  const podium = !firmId && ranked.length > 3 && sort.key === 'amount' && sort.dir === 'desc';
  const tableRows = podium ? rows.filter(item => item.rank > 3) : rows;

  const feed = useMemo(() => batchesOf(scope).slice(0, 8), [scope]);

  const largest = useMemo(() => {
    const out = [];
    for (const firm of scope) {
      const chain = walletsOf(firm)[0]?.chain;
      for (const row of firm.top || []) out.push({ firm, day: row[0], amount: row[1], href: row[2] ? explorerLink(row[3] || chain, 'tx', row[2]) : null });
    }
    return out.sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [scope]);
  const quiet = focus ? quietOf(focus, now) : null;
  const paid = focus ? daysPaid(focus) : null;

  const hist = useMemo(() => {
    const out = Array.from({ length: HIST_LABELS.length }, () => 0);
    for (const firm of scope) (firm.hist30 || []).forEach((n, i) => (out[i] += n || 0));
    return out;
  }, [scope]);
  const histMax = Math.max(0, ...hist);
  const wallets = focus ? walletsOf(focus) : [];

  function pickSort(key) {
    setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  }

  const missing = Boolean(firmId) && !focus;

  return (
    <main className="po">
      <PayoutBackdrop />
      <div className="po-stage">
        <header className="po-head">
          {firmId ? (
            <Link href="/payouts" className="po-back">
              All firms
            </Link>
          ) : null}
          {focus ? (
            <DotLogo
              src={firmLogo(focusMeta.catalog)}
              initials={(focusMeta.short || focusMeta.name).slice(0, 2)}
              seed={focus.id}
              count={tuple(focus, win).count}
              when={winInfo.long}
            />
          ) : null}
          <Stamp data={data} now={now} quiet={quiet} />
          <h1 className="po-title">{firmId && focusMeta ? `${focusMeta.short} payouts` : 'Payout tracker'}</h1>
          <p className="po-sub">
            {firmId && focusMeta
              ? `Every payout leaving ${focusMeta.name}’s wallets, read straight from the blockchain`
              : 'Prop firm payouts read straight from public blockchains, updated every hour'}
          </p>
        </header>

        {missing ? (
          <section className="po-card">
            <p className="po-empty">No payout data for this firm yet.</p>
          </section>
        ) : (
          <section className="po-hero" aria-label="Total paid out">
            <div className="po-hero-top">
              {focus ? (
                <div className="po-who">
                  <span className="po-chip">{RAIL_LABEL[focus.rail] || focus.rail}</span>
                </div>
              ) : (
                <p className="po-hero-label">
                  Paid out {winInfo.long}
                  {demo ? null : <HowButton open={how} onToggle={() => setHow(v => !v)} />}
                </p>
              )}
              <div className="po-seg" role="tablist" aria-label="Window">
                {WINS.map(item => (
                  <button key={item.id} type="button" role="tab" aria-selected={win === item.id} onClick={() => writeWin(item.id)}>
                    {item.short}
                  </button>
                ))}
              </div>
            </div>
            {focus ? (
              <p className="po-hero-label" style={{ marginTop: 16 }}>
                Paid out {winInfo.long}
                {demo ? null : <HowButton open={how} onToggle={() => setHow(v => !v)} />}
              </p>
            ) : null}
            {how ? (
              <div className="po-how" id="po-how">
                <p>
                  Payouts read straight from the blockchain, each linked to its transaction. See which firms pay, how much and how often before you buy a challenge.
                </p>
              </div>
            ) : null}
            <div className="po-hero-main" style={focus ? { marginTop: 4 } : undefined}>
              <div>
                <p className="po-big" title={money(total.amount)} style={{ marginTop: 0 }}>
                  <CountUp value={total.amount} />
                </p>
                <Delta now={total.amount} prev={total.prev?.amount} win={win} />
              </div>
              {heroTrend.some(v => v > 0) ? (
                <div className="po-hero-trend">
                  <Trend values={heroTrend} color={ACCENT} />
                </div>
              ) : null}
            </div>
            <dl className="po-stats">
              <div className="po-stat">
                <dt>Payouts</dt>
                <dd>
                  {commas(total.count)}
                  <Delta now={total.count} prev={total.prev?.count} win={win} />
                </dd>
              </div>
              <div className="po-stat">
                <dt>Average</dt>
                <dd>{total.count ? money(total.avg) : '-'}</dd>
              </div>
              {focus ? (
                <div className="po-stat">
                  <dt>Days paid</dt>
                  <dd>
                    {paid.paid}
                    <small>of last {paid.of}</small>
                  </dd>
                </div>
              ) : (
                <div className="po-stat">
                  <dt>Largest</dt>
                  <dd>{total.largest ? money(total.largest) : '-'}</dd>
                </div>
              )}
              {focus ? (
                <div className="po-stat">
                  <dt>Best day</dt>
                  <dd>
                    {focus.best ? money(focus.best[1]) : '-'}
                    {focus.best ? <small>{dayLabel(focus.best[0])}</small> : null}
                  </dd>
                </div>
              ) : (
                <div className="po-stat">
                  <dt>Firms paying</dt>
                  <dd>
                    {total.paying}
                    <small>of {firms.length}</small>
                  </dd>
                </div>
              )}
              <div className="po-stat">
                <dt>Last payout</dt>
                <dd>{ago(lastIso, now)}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>

      {missing ? null : (
        <>
          {!firmId && ranked.length ? (
            <>
              <div className="po-strip" style={{ '--n': ranked.length }}>
                {[0, 1].map(copy => (
                  <ul key={copy} className="po-strip-row" aria-label={copy ? undefined : 'Tracked firms'} aria-hidden={copy ? true : undefined}>
                    {ranked.map(firm => (
                      <li key={firm.id}>
                        <Link href={`/payouts/${firm.id}`} tabIndex={copy ? -1 : undefined}>
                          <FirmMark name={metaOf(firm).catalog} size="sm" />
                          <span>{metaOf(firm).short}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>

              <section className="po-podium" aria-label={`Top paying firms ${winInfo.long}`}>
                {ranked.slice(0, 3).map((firm, i) => {
                  const row = tuple(firm, win);
                  const info = metaOf(firm);
                  return (
                    <Link key={firm.id} href={`/payouts/${firm.id}`} className="po-pod" data-place={i + 1}>
                      <span className="po-pod-num" aria-hidden>
                        {i + 1}
                      </span>
                      <span className="po-sr">Rank {i + 1}: </span>
                      <span className="po-pod-firm">
                        <FirmMark name={info.catalog} />
                        <b>{info.name}</b>
                      </span>
                      <span className="po-pod-amt">
                        <CountUp value={row.amount} />
                      </span>
                      <Delta now={row.amount} prev={firm.prev?.[win]?.[1]} win={win} />
                      <dl className="po-pod-meta">
                        <div>
                          <dt>Payouts</dt>
                          <dd>{commas(row.count)}</dd>
                        </div>
                        <div>
                          <dt>Average</dt>
                          <dd>{row.count ? money(row.avg) : '-'}</dd>
                        </div>
                        <div>
                          <dt>Last</dt>
                          <dd>{ago(firm.last, now)}</dd>
                        </div>
                      </dl>
                    </Link>
                  );
                })}
              </section>

            </>
          ) : null}

          {!firmId ? (
            <section className="po-card po-board" aria-labelledby="po-board-h">
              <div className="po-card-head">
                <h2 id="po-board-h">Firms</h2>
              </div>
              {rows.length ? (
                <>
                  <div className="po-th">
                    <span>#</span>
                    <span>Firm</span>
                    {SORTS.slice(0, 4).map(item => (
                      <button
                        key={item.key}
                        type="button"
                        data-on={sort.key === item.key ? '' : undefined}
                        title={`Sort by ${item.label.toLowerCase()}`}
                        onClick={() => pickSort(item.key)}
                      >
                        {item.label}
                        {sort.key === item.key ? (sort.dir === 'desc' ? <ArrowDown size={12} strokeWidth={1.5} aria-hidden /> : <ArrowUp size={12} strokeWidth={1.5} aria-hidden />) : null}
                      </button>
                    ))}
                    <button type="button" data-on={sort.key === 'last' ? '' : undefined} title="Sort by latest" onClick={() => pickSort('last')}>
                      Latest
                      {sort.key === 'last' ? (sort.dir === 'desc' ? <ArrowDown size={12} strokeWidth={1.5} aria-hidden /> : <ArrowUp size={12} strokeWidth={1.5} aria-hidden />) : null}
                    </button>
                    <span />
                  </div>
                  <ol>
                    {tableRows.map(({ firm, rank, row }) => {
                      const info = metaOf(firm);
                      const fresh = now != null && Date.parse(firm.last || '') > now - FRESH_MS;
                      const still = quietOf(firm, now);
                      return (
                        <li key={firm.id}>
                          <Link href={`/payouts/${firm.id}`} className="po-row" data-idle={row.count ? undefined : ''}>
                            <span className="po-rank">{rank}</span>
                            <span className="po-firm">
                              <FirmMark name={info.catalog} />
                              <span className="po-firm-text">
                                <b>{info.name}</b>
                                <span className="po-chip">{railChip(firm.rail)}</span>
                              </span>
                            </span>
                            <span className="po-amt">
                              <b>
                                {money(row.amount)}
                                <Delta now={row.amount} prev={firm.prev?.[win]?.[1]} win={win} />
                              </b>
                              <span className="po-share" aria-hidden>
                                <i style={{ '--w': `${maxAmount ? (row.amount / maxAmount) * 100 : 0}%`, '--c': rank === 1 ? ACCENT : BAR }} />
                              </span>
                            </span>
                            <span className="po-c">{commas(row.count)}</span>
                            <span className="po-c">{row.count ? money(row.avg) : '-'}</span>
                            <span className="po-c">{row.largest ? money(row.largest) : '-'}</span>
                            <span className="po-last" data-quiet={still ? '' : undefined} title={still?.usual ? `Usually pays ${hoursLabel(still.usual)}` : undefined}>
                              {fresh ? <i className="po-fresh" aria-hidden /> : null}
                              {ago(firm.last, now)}
                              <small>{firm.lastAmt != null ? money(firm.lastAmt) : ''}</small>
                            </span>
                            <ChevronRight className="po-go" size={16} strokeWidth={1.5} aria-hidden />
                            <span className="po-mini">
                              {commas(row.count)} payouts · avg {row.count ? money(row.avg) : '-'} · {ago(firm.last, now)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <p className="po-empty">No firms tracked yet.</p>
              )}
            </section>
          ) : null}

          <section className="po-card" aria-labelledby="po-mix-h">
            <div className="po-card-head">
              <h2 id="po-mix-h">Paid out over time</h2>
              <span>{win === 'd1' ? 'Hourly, UTC' : win === 'd7' ? 'Every 4 hours, UTC' : win === 'd30' ? 'Daily' : 'Monthly'}</span>
            </div>
            <div className="po-chart-body">
              <MixChart firms={scope} win={win} hour={data?.hour} colors={colors} />
              {!firmId && ranked.length ? (
                <ul className="po-legend">
                  {ranked.map(firm => (
                    <li key={firm.id}>
                      <Link href={`/payouts/${firm.id}`}>
                        <i className="po-swatch" style={{ '--c': colors[firm.id] }} />
                        {metaOf(firm).short}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <div className="po-grid3">
            <section className="po-card" aria-labelledby="po-feed-h">
              <div className="po-card-head">
                <h2 id="po-feed-h">Latest payouts</h2>
              </div>
              {feed.length ? (
                <ol className="po-list">
                  {feed.map(group => {
                    const info = metaOf(group.firm);
                    const fresh = since && group.first > since;
                    const one = group.count === 1 ? group.items[0] : null;
                    const head = (
                      <>
                        <FirmMark name={info.catalog} size="sm" />
                        <span className="po-item-main">
                          <b>{info.short}</b>
                          <small>
                            {one ? ago(group.at, now) : `${commas(group.count)} payouts · ${ago(group.at, now)}`}
                          </small>
                        </span>
                        <strong>{money(group.amount)}</strong>
                      </>
                    );
                    return (
                      <li key={`${group.firm.id}-${group.first}`} data-new={fresh ? '' : undefined}>
                        {one ? (
                          one.href ? (
                            <a className="po-item" href={one.href} target="_blank" rel="noreferrer noopener" aria-label={`${info.short} ${money(one.amount)}, view transaction`}>
                              {head}
                              <Ext />
                            </a>
                          ) : (
                            <div className="po-item">{head}</div>
                          )
                        ) : (
                          <details className="po-batch">
                            <summary className="po-item">
                              {head}
                              <ChevronDown className="po-ext po-batch-icon" size={16} strokeWidth={1.5} aria-hidden />
                            </summary>
                            <ol>
                              {group.items.map((item, k) => (
                                <li key={k}>
                                  {item.href ? (
                                    <a href={item.href} target="_blank" rel="noreferrer noopener">
                                      <span className="po-mono">{shortAddress(item.tx)}</span>
                                      <b>{money(item.amount)}</b>
                                      <Ext />
                                    </a>
                                  ) : (
                                    <span>
                                      <span className="po-mono">{ago(item.at, now)}</span>
                                      <b>{money(item.amount)}</b>
                                    </span>
                                  )}
                                </li>
                              ))}
                              {group.count > group.items.length ? (
                                <li className="po-batch-more">+{commas(group.count - group.items.length)} more in this batch</li>
                              ) : null}
                            </ol>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="po-empty">No payouts yet.</p>
              )}
            </section>

            <section className="po-card" aria-labelledby="po-top-h">
              <div className="po-card-head">
                <h2 id="po-top-h">Largest</h2>
                <span>All time</span>
              </div>
              {largest.length ? (
                <ol className="po-list">
                  {largest.map((item, i) => (
                    <li key={`${item.firm.id}-${item.day}-${i}`}>
                      {item.href ? (
                        <a className="po-item" href={item.href} target="_blank" rel="noreferrer noopener">
                          <FirmMark name={metaOf(item.firm).catalog} size="sm" />
                          <span className="po-item-main">
                            <b>{metaOf(item.firm).short}</b>
                            <small>{dayLabel(item.day) || item.day}</small>
                          </span>
                          <strong>{money(item.amount)}</strong>
                          <Ext />
                        </a>
                      ) : (
                        <div className="po-item">
                          <FirmMark name={metaOf(item.firm).catalog} size="sm" />
                          <span className="po-item-main">
                            <b>{metaOf(item.firm).short}</b>
                            <small>{dayLabel(item.day) || item.day}</small>
                          </span>
                          <strong>{money(item.amount)}</strong>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="po-empty">No payouts yet.</p>
              )}
            </section>

            <section className="po-card" aria-labelledby="po-size-h">
              <div className="po-card-head">
                <h2 id="po-size-h">Payout sizes</h2>
                <span>30 days</span>
              </div>
              {histMax ? (
                <>
                  <div className="po-hist" role="img" aria-label={HIST_LABELS.map((label, i) => `${label}: ${hist[i]}`).join(', ')}>
                    {hist.map((n, i) => (
                      <div key={i} className="po-hist-col" data-zero={n ? undefined : ''} data-peak={n && n === histMax ? '' : undefined}>
                        {n ? commas(n) : ''}
                        <i style={{ height: `${n ? Math.max(3, (n / histMax) * 82) : 0}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="po-hist-x" aria-hidden>
                    {HIST_SHORT.map(label => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="po-empty">No payouts in 30 days.</p>
              )}
            </section>
          </div>

          {focus ? (
            <section className="po-card" aria-labelledby="po-when-h">
              <div className="po-card-head">
                <h2 id="po-when-h">When it pays</h2>
              </div>
              <Rhythm firm={focus} hour={data?.hour} />
            </section>
          ) : null}

          {focus && wallets.length ? (
            <section className="po-card" aria-labelledby="po-wal-h">
              <div className="po-card-head">
                <h2 id="po-wal-h">Tracked wallets</h2>
              </div>
              <ul className="po-list">
                {wallets.map(wallet => {
                  const href = explorerLink(wallet.chain, 'address', wallet.address);
                  const inner = (
                    <>
                      <span className="po-wallet-chain">{wallet.chain}</span>
                      <span className="po-item-main">
                        <b className="po-mono">{shortAddress(wallet.address)}</b>
                        <small>{wallet.label}</small>
                      </span>
                      {href ? (
                        <>
                          <small>{EXPLORER[wallet.chain].name}</small>
                          <Ext />
                        </>
                      ) : null}
                    </>
                  );
                  return (
                    <li key={`${wallet.chain}-${wallet.address}`}>
                      {href ? (
                        <a className="po-item" href={href} target="_blank" rel="noreferrer noopener">
                          {inner}
                        </a>
                      ) : (
                        <div className="po-item">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {focus ? (
        <nav className="po-next" aria-label={`More on ${focusMeta.short}`}>
          <Link href="/challenges">
            Compare {focusMeta.short} challenges
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
          <Link href="/updates">
            Rule changes
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
          <Link href="/compare">
            Head to head
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
        </nav>
      ) : null}

      {demo ? <p className="po-note">Figures are simulated while on-chain tracking is connected.</p> : <PayoutFaq />}
    </main>
  );
}
