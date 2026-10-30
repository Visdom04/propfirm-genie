'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KIND_LABEL } from '@/lib/fineprint/catalog';
import { coverPages, emptyCover, isCovered } from '@/lib/fineprint/coverage';
import { factKind } from '@/lib/fineprint/kind';
import { deltaLabel, verdictOf } from '@/lib/fineprint/terms';
import FpSelect, { FpDateSelect } from './FpSelect';
import './fineprint.css';

const LOCAL_MARK = {
  'Apex Trader Funding': '/firm/apex-trader-funding.png',
  Tradeify: '/firm/tradeify.png',
};

const PAGE_SIZE = 8;

const MARKETS = [
  { id: 'futures', label: 'Futures' },
  { id: 'crypto', label: 'Perp' },
];

const FACETS = [
  { id: 'all', label: 'All kinds' },
  { id: 'pricing', label: 'Price' },
  { id: 'rules', label: 'Rules' },
  { id: 'payouts', label: 'Payouts' },
];

const RANGES = [
  { id: 'today', label: 'Today', days: 0 },
  { id: '3', label: '3d', days: 3 },
  { id: '7', label: '7d', days: 7 },
  { id: '9', label: '9d', days: 9 },
  { id: '30', label: '30d', days: 30 },
  { id: '90', label: '90d', days: 90 },
  { id: 'all', label: 'All time', days: Infinity },
];

function dayKey(iso) {
  return String(iso).slice(0, 10);
}

function inRange(iso, rangeId, day) {
  if (rangeId === 'all') return true;
  const key = dayKey(iso);
  if (!key) return false;
  if (rangeId === 'day') return key === day;
  if (rangeId === 'today') return key === dayKey(new Date().toISOString());
  const days = RANGES.find(item => item.id === rangeId)?.days;
  if (!Number.isFinite(days)) return true;
  const then = Date.parse(`${key}T00:00:00Z`);
  const now = Date.parse(`${dayKey(new Date().toISOString())}T00:00:00Z`);
  return then >= now - days * 86400000;
}

function utcMonth(date = new Date()) {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() };
}

function shiftMonth(cursor, dir) {
  const next = new Date(Date.UTC(cursor.y, cursor.m + dir, 1));
  return utcMonth(next);
}

function monthLabel(cursor) {
  return new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function dayTitle(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function monthCells(cursor) {
  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const pad = (first.getUTCDay() + 6) % 7;
  const last = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= last; day += 1) {
    cells.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

function rowKind(change, fact) {
  return factKind(change, fact);
}

function hitsQuery(change, fact, needle) {
  if (!needle) return true;
  return [change.firm, change.product, change.title, fact?.label, fact?.before, fact?.after]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

function dateParts(iso) {
  const key = dayKey(iso);
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return { mon: '—', day: '—' };
  const date = new Date(Date.UTC(y, m - 1, d));
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return { mon: months[date.getUTCMonth()], day: String(d).padStart(2, '0') };
}

function firmInitials(name) {
  const first = String(name || '?').split(/\s+/).find(Boolean) || '?';
  return first.slice(0, 2).toUpperCase();
}

const VERDICT = {
  better: { label: 'Better for traders', tone: 'is-good' },
  worse: { label: 'Worse for traders', tone: 'is-worse' },
  unscored: { label: 'Changed', tone: 'is-neutral' },
};

function Verdict({ value }) {
  const verdict = VERDICT[verdictOf(value)];
  return <span className={`fp-verdict ${verdict.tone}`}>{verdict.label}</span>;
}

// A judged fact carries a unit. Raw paragraphs are too long to show as a value.
function valueText(raw, unit) {
  if (!raw || raw === '—') return '';
  if (unit === 'days') return `${raw} ${raw === '1' ? 'day' : 'days'}`;
  if (unit === 'contracts') return `${raw} ${raw === '1' ? 'contract' : 'contracts'}`;
  return raw.length > 28 ? '' : raw;
}

function ValueMove({ fact }) {
  const before = valueText(fact?.before, fact?.unit);
  const after = valueText(fact?.after, fact?.unit);
  if (!before || !after) return <span className="fp-move is-wording">Wording changed</span>;
  const delta = fact.unit ? deltaLabel(fact.before, fact.after) : '';
  return (
    <span className="fp-move">
      <s>{before}</s>
      <span aria-hidden>→</span>
      <b>{after}</b>
      {delta ? <small>{delta}</small> : null}
    </span>
  );
}

function FirmMark({ name, logo, className = 'shrink-0' }) {
  const local = LOCAL_MARK[name];
  const incoming = logo;
  const [src, setSrc] = useState(local || incoming || '');
  useEffect(() => {
    setSrc(local || incoming || '');
  }, [local, incoming]);
  if (!src) {
    return (
      <span className={`fp-logo is-fallback grid place-items-center font-bold ${className}`}>
        {firmInitials(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className={`fp-logo ${className}`}
      onError={() => {
        if (local && src !== local) setSrc(local);
        else setSrc('');
      }}
    />
  );
}

function Chip({ pressed, onClick, children, ariaLabel, tabIndex, inert, disabled }) {
  return (
    <button
      type="button"
      className="fp-chip btn-bare"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      aria-hidden={inert || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ChangesCalendar({ changes, logos, day, onPickDay, onOpenChange }) {
  const now = utcMonth();
  const calRef = useRef(null);
  const [cursor, setCursor] = useState(() => {
    const latest = changes[0] && dayKey(changes[0].detectedAt);
    return latest ? { y: Number(latest.slice(0, 4)), m: Number(latest.slice(5, 7)) - 1 } : now;
  });
  const [pop, setPop] = useState(null);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const change of changes) {
      const key = dayKey(change.detectedAt);
      if (!key.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`)) continue;
      const list = map.get(key) || [];
      list.push(change);
      map.set(key, list);
    }
    return map;
  }, [changes, cursor]);

  const canNext = cursor.y < now.y || (cursor.y === now.y && cursor.m < now.m);
  const [today] = useState(() => dayKey(new Date().toISOString()));
  const openList = day ? byDay.get(day) || [] : [];

  useLayoutEffect(() => {
    if (!day || !calRef.current) {
      setPop(null);
      return;
    }
    const btn = calRef.current.querySelector(`[data-day="${day}"]`);
    if (!btn) {
      setPop(null);
      return;
    }
    const cal = calRef.current.getBoundingClientRect();
    const box = btn.getBoundingClientRect();
    const mobile = window.innerWidth < 640;
    const inset = mobile ? 8 : 12;
    const width = mobile ? cal.width - inset * 2 : Math.min(400, cal.width - inset * 2);
    const left = mobile
      ? inset
      : Math.min(Math.max(inset, box.left - cal.left), cal.width - width - inset);
    const needed = (mobile ? 40 : 72) + openList.length * (mobile ? 48 : 84);
    let top = box.bottom - cal.top + 8;
    let maxHeight = window.innerHeight - box.bottom - 16;
    if (mobile || maxHeight < needed) {
      const head = calRef.current.querySelector('.fp-cal-head');
      const headH = head ? head.getBoundingClientRect().height + 6 : 12;
      top = mobile ? headH : 12;
      maxHeight = cal.height - top - inset;
    }
    setPop({
      top,
      left,
      width,
      maxHeight: Math.min(mobile ? 272 : 520, Math.max(160, maxHeight)),
    });
  }, [day, cursor, openList.length]);

  useEffect(() => {
    if (!day) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') onPickDay(null);
    }
    function onPtr(event) {
      if (!calRef.current?.contains(event.target)) onPickDay(null);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPtr);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPtr);
    };
  }, [day, onPickDay]);

  return (
    <section ref={calRef} className="fp-cal" aria-label="Changes by day">
      <div className="fp-cal-head">
        <div>
          <h2 className="fp-h2">{monthLabel(cursor)}</h2>
        </div>
        <div className="fp-cal-navs">
          <IconBtn label="Previous month" dir="prev" onClick={() => setCursor(current => shiftMonth(current, -1))} />
          <IconBtn
            label="Next month"
            dir="next"
            disabled={!canNext}
            onClick={() => canNext && setCursor(current => shiftMonth(current, 1))}
          />
        </div>
      </div>
      <div className="fp-cal-week" aria-hidden>
        {WEEKDAYS.map(name => (
          <span key={name} className="fp-cal-dow">
            {name}
          </span>
        ))}
      </div>
      <div className="fp-cal-grid">
        {monthCells(cursor).map((key, index) => {
          if (!key) return <span key={`e-${index}`} className="fp-cal-blank" />;
          const list = byDay.get(key) || [];
          const firms = [...new Set(list.map(item => item.firm))];
          const shown = firms.slice(0, 2);
          const extra = firms.length - shown.length;
          const num = Number(key.slice(8, 10));
          const selected = day === key;
          const todayClass = key === today ? ' is-today' : '';
          if (!list.length) {
            return (
              <div key={key} className={`fp-cal-day is-empty${todayClass}`}>
                <span className="fp-cal-num">{num}</span>
              </div>
            );
          }
          return (
            <button
              key={key}
              type="button"
              data-day={key}
              className={`fp-cal-day btn-bare${selected ? ' is-on' : ''}${todayClass}`}
              aria-pressed={selected}
              aria-expanded={selected}
              aria-haspopup="dialog"
              aria-label={`${list.length} ${list.length === 1 ? 'change' : 'changes'} on ${key}`}
              onClick={() => onPickDay(selected ? null : key)}
            >
              <span className="fp-cal-num">{num}</span>
              <span className="fp-cal-marks">
                {shown.map(name => (
                  <FirmMark key={name} name={name} logo={logos[name]} className="fp-cal-logo" />
                ))}
                {extra > 0 ? <span className="fp-cal-more">+{extra}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      {day && pop && openList.length ? (
        <div
          className="fp-cal-pop"
          role="dialog"
          aria-label={`${openList.length} changes on ${dayTitle(day)}`}
          style={{ top: pop.top, left: pop.left, width: pop.width, maxHeight: pop.maxHeight }}
        >
          <p className="fp-cal-pop-head">
            {dayTitle(day)} · {openList.length} {openList.length === 1 ? 'change' : 'changes'}
          </p>
          <ul className="fp-cal-pop-list">
            {openList.map(change => (
              <li key={change.id}>
                <button
                  type="button"
                  className="fp-cal-pop-item btn-bare"
                  onClick={() => onOpenChange(change.id)}
                >
                  <FirmMark name={change.firm} logo={logos[change.firm] || change.logo} className="fp-logo shrink-0" />
                  <span>
                    <b>{change.firm}</b>
                    <p>{change.summary || change.title}</p>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

// Decorative: the latest real changes drift behind the title, over a grid.
function HeroBackdrop({ items }) {
  const line = item => {
    const before = valueText(item.fact?.before, item.fact?.unit);
    const after = valueText(item.fact?.after, item.fact?.unit);
    const move = before && after ? ` ${before} → ${after}` : '';
    return { ...item, text: `${item.firm} · ${item.fact?.label || 'Rule change'}${move}` };
  };
  const ticker = items.map(line);
  const rows = ticker.length ? [ticker, [...ticker].reverse()] : [];
  return (
    <div className="fp-hero-bg" aria-hidden>
      <div className="fp-hero-grid" />
      {rows.map((row, index) => (
        <div key={index} className={`fp-hero-tape${index ? ' is-reverse' : ''}`}>
          <div className="fp-hero-track">
            {[...row, ...row].map((item, i) => (
              <span key={`${item.id}-${i}`} className={`fp-hero-tick ${VERDICT[verdictOf(item.fact?.verdict)].tone}`}>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendingNews({ items, logos, onOpen }) {
  return (
    <section className="fp-card fp-trend" aria-label="Trending">
      <h2 className="fp-h2">Trending</h2>
      {items.length ? null : <p className="fp-empty">No trending changes yet.</p>}
      <ol className="fp-trend-list">
        {items.slice(0, 6).map(change => {
          const fact = change.facts?.[0];
          const before = valueText(fact?.before, fact?.unit);
          const after = valueText(fact?.after, fact?.unit);
          return (
            <li key={change.id}>
              <button type="button" className="fp-trend-item btn-bare" onClick={() => onOpen(change.id, fact)}>
                <FirmMark name={change.firm} logo={change.logo || logos[change.firm]} className="fp-logo shrink-0" />
                <span>
                  <b>{change.firm}</b>
                  <small>
                    {fact?.label || change.title}
                    {before && after ? ` · ${before} → ${after}` : ''}
                  </small>
                </span>
                <Verdict value={fact?.verdict} />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Firm chips drift on a loop; hover or focus pauses it. The second copy is hidden from keyboard and screen readers.
function FirmTicker({ names, selected, logos, onPick }) {
  const loop = names.length > 3;
  const chips = loop ? [...names, ...names] : names;
  return (
    <div className="fp-firms" role="group" aria-label="Firms">
      <div className={`fp-firms-track${loop ? ' is-loop' : ''}`} style={{ '--fp-firms-time': `${Math.max(30, names.length * 5)}s` }}>
        {chips.map((name, index) => {
          const clone = index >= names.length;
          return (
            <Chip
              key={`${clone ? 'b' : 'a'}-${name}`}
              pressed={selected === name}
              ariaLabel={name}
              tabIndex={clone ? -1 : undefined}
              inert={clone}
              onClick={() => onPick(name)}
            >
              <FirmMark name={name} logo={logos[name]} />
              {name}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({ label, disabled, onClick, dir = 'next' }) {
  return (
    <button type="button" className="fp-icon-btn btn-bare" aria-label={label} disabled={disabled} onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={dir === 'prev' ? 'M14.5 6 9 12l5.5 6' : 'M9.5 6 15 12l-5.5 6'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

const DIFF_MODES = [
  ['split', 'Before', 'Before / after'],
  ['source', 'Source', 'Page source'],
  ['words', 'Words', 'Changed words'],
];

function DiffView({ hunks }) {
  const [mode, setMode] = useState('split');
  if (!hunks?.length) return null;
  return (
    <div className="fp-diff">
      <div className="fp-diff-inner">
        <div className="fp-diff-head">
          <span className="fp-diff-kicker">Exact wording</span>
          <div className="fp-diff-modes" role="group" aria-label="Diff display">
            {DIFF_MODES.map(([id, short, long]) => (
              <button
                key={id}
                type="button"
                className="fp-diff-mode btn-bare"
                aria-pressed={mode === id}
                aria-label={long}
                onClick={() => setMode(id)}
              >
                <span className="fp-diff-short">{short}</span>
                <span className="fp-diff-long">{long}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          {hunks.map((hunk, index) => (
            <Hunk key={index} hunk={hunk} mode={mode} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Line({ tone, sign, text }) {
  return (
    <div className={`fp-diff-row ${tone === 'add' ? 'fp-add' : 'fp-del'}`}>
      <span aria-hidden>{sign}</span>
      <span>{text}</span>
    </div>
  );
}

function Hunk({ hunk, mode }) {
  if (mode === 'words') {
    return (
      <div className="fp-diff-pair">
        <div>
          {hunk.removed.map(line => (
            <Line key={`r-${line}`} tone="del" sign="−" text={line} />
          ))}
        </div>
        <div>
          {hunk.added.map(line => (
            <Line key={`a-${line}`} tone="add" sign="+" text={line} />
          ))}
        </div>
      </div>
    );
  }
  if (mode === 'source') {
    return (
      <div>
        {hunk.before.map(line => (
          <Line
            key={`b-${line}`}
            tone={hunk.removed.includes(line) ? 'del' : 'add'}
            sign={hunk.removed.includes(line) ? '−' : ' '}
            text={line}
          />
        ))}
        {hunk.after
          .filter(line => !hunk.before.includes(line))
          .map(line => (
            <Line key={`n-${line}`} tone="add" sign="+" text={line} />
          ))}
      </div>
    );
  }
  return (
    <div className="fp-diff-pair fp-diff-split">
      <div>
        <p className="fp-diff-label">Before</p>
        {hunk.before.map(line => (
          <p key={`bf-${line}`} className="fp-diff-line is-before">
            {line}
          </p>
        ))}
      </div>
      <div>
        <p className="fp-diff-label">After</p>
        {hunk.after.map(line => (
          <p key={`af-${line}`} className="fp-diff-line">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function FinePrintBoard({ changes = [], pages, logos = {}, cover = emptyCover() }) {
  const [market, setMarket] = useState('all');
  const [firm, setFirm] = useState('all');
  const [range, setRange] = useState('all');
  const [day, setDay] = useState(null);
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState('all');
  const [inspect, setInspect] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.documentElement.classList.add('fp-thin-root');
    return () => document.documentElement.classList.remove('fp-thin-root');
  }, []);

  function openChange(id, fact) {
    const change = changes.find(item => item.id === id);
    if (!change) return;
    const nextFact = fact || change.facts?.[0] || { label: change.title, before: '', after: '' };
    setInspect({ change, fact: nextFact });
  }

  useEffect(() => {
    if (!inspect) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setInspect(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [inspect]);

  const extraLogos = useMemo(() => {
    return Object.fromEntries((cover.extra || []).filter(item => item.logo).map(item => [item.firm, item.logo]));
  }, [cover.extra]);
  const marks = { ...logos, ...extraLogos };

  const coverList = useMemo(() => coverPages(cover), [cover]);
  const boardPages = useMemo(() => {
    const seen = new Set();
    return [...pages, ...coverList].filter(item => {
      if (!isCovered(item.firm, cover)) return false;
      if (market !== 'all' && item.market !== market) return false;
      if (seen.has(item.firm) && item.source === 'cover') return false;
      seen.add(item.firm);
      return true;
    });
  }, [pages, coverList, cover, market]);

  const firmNames = useMemo(() => {
    return [...new Set(boardPages.map(page => page.firm))];
  }, [boardPages]);

  const needle = query.trim().toLowerCase();
  const visible = changes
    .filter(change => {
      if (change.status !== 'published' || change.firm === 'FundingPips') return false;
      if (!isCovered(change.firm, cover)) return false;
      if (market !== 'all' && change.market !== market) return false;
      if (firm !== 'all' && change.firm !== firm) return false;
      if (!inRange(change.detectedAt, range, day)) return false;
      return true;
    })
    .sort((a, b) => String(b.detectedAt).localeCompare(String(a.detectedAt)));

  const rows = visible.flatMap(change => {
    const facts = change.facts?.length
      ? change.facts
      : [{ label: change.title || 'Change', before: '', after: '' }];
    return facts
      .map((fact, index) => ({ change, fact, index }))
      .filter(row => {
        if (facet !== 'all' && rowKind(row.change, row.fact) !== facet) return false;
        return hitsQuery(row.change, row.fact, needle);
      });
  });

  const calendarChanges = visible.filter(
    change => facet === 'all' || (change.facts || []).some(fact => rowKind(change, fact) === facet),
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [market, firm, range, day, query, facet]);

  function resetFilters() {
    setFirm('all');
    setRange('all');
    setDay(null);
    setQuery('');
    setFacet('all');
    setPage(1);
  }

  const filtered = firm !== 'all' || range !== 'all' || Boolean(day) || Boolean(needle) || facet !== 'all';
  const worse = rows.filter(row => verdictOf(row.fact.verdict) === 'worse').length;
  const better = rows.filter(row => verdictOf(row.fact.verdict) === 'better').length;
  const firmCount = new Set(rows.map(row => row.change.firm)).size;
  const demo = rows.some(row => row.change.demo);

  const tickerItems = changes
    .filter(change => change.status === 'published' && isCovered(change.firm, cover))
    .sort((a, b) => String(b.detectedAt).localeCompare(String(a.detectedAt)))
    .slice(0, 12)
    .map(change => ({ id: change.id, firm: change.firm, fact: change.facts?.[0] }));

  const trendingItems = changes
    .filter(change => change.status === 'published' && change.trending && change.firm !== 'FundingPips')
    .filter(change => isCovered(change.firm, cover))
    .filter(change => market === 'all' || change.market === market)
    .filter(change => firm === 'all' || change.firm === firm)
    .sort((a, b) => String(b.detectedAt).localeCompare(String(a.detectedAt)));

  const pickDay = useCallback(key => {
    setDay(key);
    setRange(key ? 'day' : 'all');
  }, []);

  function pickMarket(id) {
    const next = market === id ? 'all' : id;
    setMarket(next);
    if (next !== 'all' && firm !== 'all') {
      const still = pages.some(page => page.firm === firm && page.market === next);
      if (!still) setFirm('all');
    }
  }

  return (
    <div className="fp">
      <header className="fp-hero">
        <HeroBackdrop items={tickerItems} />
        <div className="fp-hero-in">
          <h1 className="fp-title">Market intelligence</h1>
          <p className="fp-stats" aria-live="polite">
            <span>
              {rows.length} {rows.length === 1 ? 'change' : 'changes'}
            </span>
            {worse ? <span className="is-worse">{worse} worse for traders</span> : null}
            {better ? <span className="is-good">{better} better for traders</span> : null}
            {firmCount ? (
              <span>
                {firmCount} {firmCount === 1 ? 'firm' : 'firms'}
              </span>
            ) : null}
          </p>
          <div className="fp-seg" role="group" aria-label="Market">
            {MARKETS.map(item => (
              <Chip key={item.id} pressed={market === item.id} onClick={() => pickMarket(item.id)}>
                {item.label}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      <div className="fp-overview">
        <ChangesCalendar
          changes={calendarChanges}
          logos={marks}
          day={day}
          onPickDay={pickDay}
          onOpenChange={id => openChange(id)}
        />
        <TrendingNews items={trendingItems} logos={marks} onOpen={openChange} />
      </div>

      <section id="fp-latest" className="fp-ledger" aria-label="Change feed">
        {demo ? <p className="fp-sample">Sample data. Live tracking starts soon.</p> : null}
        <div className="fp-board">
          <div className="fp-line" role="toolbar" aria-label="Filters">
            <label className="fp-search">
              <span className="sr-only">Search firm, rule, or value</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search firm, rule, or value"
                autoComplete="off"
              />
              {query ? (
                <button type="button" className="fp-search-clear btn-bare" aria-label="Clear search" onClick={() => setQuery('')}>
                  ×
                </button>
              ) : null}
            </label>
            <FirmTicker names={firmNames} selected={firm} logos={marks} onPick={name => setFirm(current => (current === name ? 'all' : name))} />
            <FpSelect ariaLabel="Kind" value={facet} options={FACETS} onChange={setFacet} />
            <FpDateSelect
              range={range}
              day={day}
              ranges={RANGES}
              onRange={id => {
                setDay(null);
                setRange(id);
              }}
              onPick={pickDay}
              onClear={() => {
                setDay(null);
                setRange('all');
              }}
            />
            {filtered ? (
              <button type="button" className="fp-reset btn-bare" onClick={resetFilters}>
                Clear
              </button>
            ) : null}
          </div>
          <div className="fp-feed-head" aria-hidden>
            <span>Date</span>
            <span>Firm</span>
            <span>Rule</span>
            <span>Change</span>
            <span>Impact</span>
          </div>
          <ol className="fp-feed">
            {paged.map(row => (
              <li key={`${row.change.id}-${row.index}`}>
                <UpdateRow
                  change={row.change}
                  fact={row.fact}
                  logo={row.change.logo || marks[row.change.firm]}
                  open={inspect?.change.id === row.change.id && inspect?.fact?.label === row.fact.label}
                  anchor={row.index === 0 && safePage === 1}
                  onToggle={() => openChange(row.change.id, row.fact)}
                />
              </li>
            ))}
          </ol>
          {rows.length === 0 ? (
            <p className="fp-empty">
              {day
                ? 'No changes on this day.'
                : firm !== 'all'
                  ? `No changes for ${firm} yet.`
                  : 'No changes match these filters.'}
            </p>
          ) : null}
        </div>
        {pageCount > 1 ? (
          <nav className="fp-pages" aria-label="Change pages">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(num => (
              <button
                key={num}
                type="button"
                className="fp-page btn-bare"
                aria-current={num === safePage ? 'page' : undefined}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
          </nav>
        ) : null}
      </section>
      {inspect ? (
        <ChangeInspector
          change={inspect.change}
          fact={inspect.fact}
          logo={inspect.change.logo || marks[inspect.change.firm]}
          onClose={() => setInspect(null)}
        />
      ) : null}
    </div>
  );
}

function UpdateRow({ change, fact, logo, open, anchor, onToggle }) {
  const parts = dateParts(change.detectedAt);
  const kind = KIND_LABEL[rowKind(change, fact)] || fact?.kind || change.kind;
  return (
    <article id={anchor ? `change-${change.id}` : undefined} className={`fp-row ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="fp-row-btn btn-bare"
        aria-expanded={open}
        onClick={event => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <time className="fp-date" dateTime={change.detectedAt}>
          <span>{parts.mon}</span>
          <strong>{parts.day}</strong>
        </time>
        <span className="fp-cell-firm">
          <FirmMark name={change.firm} logo={logo} className="fp-logo shrink-0" />
          <span className="min-w-0">
            <b>{change.firm}</b>
            {change.product ? <small>{change.product}</small> : null}
          </span>
        </span>
        <span className="fp-cell-field">
          <b>{fact?.label || kind}</b>
          <small>{kind}</small>
        </span>
        <ValueMove fact={fact} />
        <Verdict value={fact?.verdict} />
      </button>
    </article>
  );
}

function ChangeInspector({ change, fact, logo, onClose }) {
  const [ready, setReady] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const kindId = rowKind(change, fact);
  const kind = KIND_LABEL[kindId] || kindId;
  const detected = String(change.detectedAt || '').slice(0, 10);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [ready]);

  if (!ready) return null;

  return createPortal(
    <div className="fp-inspect-layer">
      <button type="button" className="fp-inspect-scrim btn-bare" aria-label="Close inspector" onClick={onClose} />
      <aside className="fp-inspect" role="dialog" aria-modal="true" aria-labelledby="fp-inspect-title">
        <div className="fp-inspect-top">
          <p className="fp-inspect-kicker">Change inspector</p>
          <button type="button" className="fp-inspect-close btn-bare" onClick={onClose}>
            Close
          </button>
        </div>
        <h2 id="fp-inspect-title" className="fp-inspect-title">
          {fact?.label || change.title}
        </h2>
        <div className="fp-inspect-firm">
          <FirmMark name={change.firm} logo={logo} className="fp-logo shrink-0" />
          <span>
            <b>{change.firm}</b>
            {change.product ? <small>{change.product}</small> : null}
          </span>
        </div>
        <div className="fp-inspect-chips">
          <Verdict value={fact?.verdict} />
          <span className={`fp-kind kind-${kindId}`}>{kind}</span>
          {change.trending ? <span className="fp-kind kind-trend">Trending</span> : null}
          {change.demo ? <span className="fp-kind kind-review">Demo</span> : null}
        </div>
        <div className="fp-inspect-pair">
          <div>
            <p>Previous value</p>
            <b>{valueText(fact?.before, fact?.unit) || fact?.before || '—'}</b>
          </div>
          <div>
            <p>New observed value</p>
            <b>{valueText(fact?.after, fact?.unit) || fact?.after || '—'}</b>
          </div>
        </div>
        <dl className="fp-inspect-meta">
          <div>
            <dt>Change category</dt>
            <dd>{kind}</dd>
          </div>
          <div>
            <dt>First detected</dt>
            <dd>{detected || '—'}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              {change.sourceUrl ? (
                <a href={change.sourceUrl} target="_blank" rel="nofollow noopener noreferrer">
                  {change.demo ? 'Demo page' : 'Live page'}
                </a>
              ) : (
                'Not provided'
              )}
            </dd>
          </div>
        </dl>
        <Chip pressed={textOpen} ariaLabel={textOpen ? 'Hide exact text' : 'Exact text'} onClick={() => setTextOpen(value => !value)}>
          {textOpen ? 'Hide exact text' : 'Exact text'}
        </Chip>
        {textOpen ? <DiffView hunks={change.hunks} /> : null}
      </aside>
    </div>,
    document.body,
  );
}
