'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KIND_LABEL } from '@/lib/fineprint/catalog';
import { coverPages, emptyCover, isCovered, loadCoverage, subscribeCoverage } from '@/lib/fineprint/coverage';
import { deskToChange, loadDesk, subscribeDesk } from '@/lib/fineprint/desk';
import { factKind } from '@/lib/fineprint/kind';
import FpSelect, { FpDateSelect } from './FpSelect';
import './fineprint.css';

const LOCAL_MARK = {
  'Apex Trader Funding': '/firm/apex-trader-funding.png',
  Tradeify: '/firm/tradeify.png',
};

const PAGE_SIZE = 8;

const VERDICT = {
  good: { label: 'Good for traders', className: 'bg-[#3FB185]/18 text-[#b7efd3]' },
  worse: { label: 'Worse for traders', className: 'bg-[oklch(0.45_0.12_25_/_0.35)] text-[oklch(0.86_0.08_25)]' },
};

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

  const monthCount = [...byDay.values()].reduce((sum, list) => sum + list.length, 0);
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
          <h2 className="fp-h2">Changes by day</h2>
          <p className="fp-sub">
            {monthCount} {monthCount === 1 ? 'change' : 'changes'} in {monthLabel(cursor)}
          </p>
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
          const extra = list.length > shown.length ? list.length - shown.length : 0;
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
                {extra ? <span className="fp-cal-more">+{extra}</span> : null}
              </span>
              <span className="fp-cal-count">{list.length}</span>
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

function attentionLine(change) {
  const fact = change.facts?.[0];
  const bits = [fact?.label || KIND_LABEL[rowKind(change, fact)] || change.kind];
  if (change.product) bits.push(change.product);
  if (change.demo) bits.push('demo');
  return bits.join(' · ');
}

function attentionRank(change) {
  if (change.facts?.some(fact => fact.verdict === 'worse')) return 0;
  if (change.demo || change.status === 'needs_review') return 1;
  return 2;
}

function impactLabel(change) {
  if (change.facts?.some(fact => fact.verdict === 'worse')) return 'High impact';
  if (change.facts?.some(fact => fact.verdict === 'good')) return 'Good';
  return 'Update';
}

function AttentionQueue({ changes, logos, onOpen, onReviewAll }) {
  const items = [...changes]
    .filter(change => change.status === 'published' || change.status === 'needs_review')
    .sort((a, b) => attentionRank(a) - attentionRank(b) || String(b.detectedAt).localeCompare(String(a.detectedAt)))
    .slice(0, 7);

  return (
    <section className="fp-alert" aria-label="Attention required">
      <div className="fp-alert-head">
        <h2 className="fp-h2">Attention required</h2>
        <button type="button" className="fp-alert-all btn-bare" onClick={onReviewAll}>
          Review all
          <span aria-hidden>↗</span>
        </button>
      </div>
      <p className="fp-sub">Unreviewed updates, highest impact first</p>
      {items.length ? (
        <ul className="fp-alert-list">
          {items.map(change => {
            const impact = impactLabel(change);
            return (
              <li key={change.id}>
                <button type="button" className="fp-alert-item btn-bare" onClick={() => onOpen(change.id)}>
                  <FirmMark name={change.firm} logo={change.logo || logos[change.firm]} className="fp-alert-logo" />
                  <span className="fp-alert-copy">
                    <b>{change.firm}</b>
                    <small>{attentionLine(change)}</small>
                  </span>
                  <span className={`fp-alert-impact is-${impact === 'High impact' ? 'high' : 'note'}`}>
                    <span className="fp-alert-impact-copy">{impact}</span>
                    <span aria-hidden>↗</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="fp-empty fp-alert-empty">No unreviewed updates in this filter.</p>
      )}
    </section>
  );
}

function FirmCarousel({ names, selected, logos, onPick }) {
  const track = useRef(null);
  const shift = useRef(0);
  const loop = names.length > 6;
  const chips = loop ? [...names, ...names] : names;
  const seconds = Math.max(28, names.length * 1.6);

  function nudge(dir) {
    shift.current += dir * 280;
    if (track.current) track.current.style.setProperty('--fp-shift', `${shift.current}px`);
  }

  return (
    <div className="fp-carousel">
      <IconBtn label="Previous firms" dir="prev" onClick={() => nudge(1)} />
      <div className="fp-carousel-mask">
        <div
          ref={track}
          className={`fp-carousel-track${loop ? ' fp-carousel-track--loop' : ''}`}
          style={{ '--fp-marquee': `${seconds}s` }}
          role="listbox"
          aria-label="Firms"
        >
          {chips.map((name, index) => {
            const clone = loop && index >= names.length;
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
      <IconBtn label="Next firms" dir="next" onClick={() => nudge(-1)} />
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

export default function FinePrintBoard({ changes: seed = [], pages, logos = {} }) {
  const [desk, setDesk] = useState([]);
  const [cover, setCover] = useState(emptyCover);
  const [market, setMarket] = useState('all');
  const [firm, setFirm] = useState('all');
  const [range, setRange] = useState('all');
  const [day, setDay] = useState(null);
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState('all');
  const [inspect, setInspect] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setDesk(loadDesk());
    return subscribeDesk(setDesk);
  }, []);

  useEffect(() => {
    setCover(loadCoverage());
    return subscribeCoverage(setCover);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('fp-thin-root');
    return () => document.documentElement.classList.remove('fp-thin-root');
  }, []);

  const changes = useMemo(() => {
    const extras = desk.filter(item => item.status === 'published').map(deskToChange);
    const seen = new Set(seed.map(item => item.id));
    return [...seed, ...extras.filter(item => !seen.has(item.id))];
  }, [seed, desk]);

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
      .filter(row => (facet === 'all' || rowKind(row.change, row.fact) === facet) && hitsQuery(row.change, row.fact, needle));
  });

  const attentionChanges = [];
  const seenAttention = new Set();
  for (const row of rows) {
    if (seenAttention.has(row.change.id)) continue;
    seenAttention.add(row.change.id);
    attentionChanges.push(row.change);
  }

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
    setMarket('all');
    setFirm('all');
    setRange('all');
    setDay(null);
    setQuery('');
    setFacet('all');
    setPage(1);
  }

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
      <div className="fp-filters" role="toolbar" aria-label="Market filters">
        {MARKETS.map(item => (
          <Chip key={item.id} pressed={market === item.id} onClick={() => pickMarket(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>

      <FirmCarousel
        names={firmNames}
        selected={firm}
        logos={marks}
        onPick={name => setFirm(current => (current === name ? 'all' : name))}
      />

      <div className="fp-top">
        <ChangesCalendar
          changes={calendarChanges}
          logos={marks}
          day={day}
          onPickDay={pickDay}
          onOpenChange={id => openChange(id)}
        />
        <AttentionQueue
          changes={attentionChanges}
          logos={marks}
          onOpen={id => {
            const hit = rows.find(row => row.change.id === id);
            openChange(id, hit?.fact);
          }}
          onReviewAll={() => {
            setDay(null);
            setRange('all');
            window.requestAnimationFrame(() => {
              document.getElementById('fp-latest')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }}
        />
      </div>

      <div className="fp-ledger-grid">
        <section id="fp-latest" className="fp-ledger" aria-label="Change feed">
          <div className="fp-pane-head">
            <div>
              <h2 className="fp-h2">Latest updates</h2>
              <p className="fp-sub">
                {rows.length} {rows.length === 1 ? 'change' : 'changes'}
              </p>
            </div>
          </div>
          <div className="fp-search-tools">
            <label className="fp-search fp-ledger-search">
              <span className="sr-only">Search firm, field, or value</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search firm, field, or value"
                autoComplete="off"
              />
              {query ? (
                <button type="button" className="fp-search-clear btn-bare" aria-label="Clear search" onClick={() => setQuery('')}>
                  ×
                </button>
              ) : null}
            </label>
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
            <FpSelect
              ariaLabel="Firms"
              logo
              value={firm}
              options={[
                { id: 'all', label: 'All firms' },
                ...firmNames.map(name => ({ id: name, label: name, logo: marks[name] })),
              ]}
              onChange={setFirm}
            />
            <FpSelect ariaLabel="Kind" value={facet} options={FACETS} onChange={setFacet} />
            <button type="button" className="fp-reset btn-bare" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
          <div className="fp-feed-wrap">
            <div className="fp-feed-head">
              <span>Date</span>
              <span>Firm</span>
              <span>Changed</span>
              <span>Previous</span>
              <span>Current</span>
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
          </div>
          {rows.length === 0 ? (
            <p className="fp-empty">
              {day
                ? 'No facts on this day.'
                : facet === 'pricing'
                  ? 'No price facts in this window.'
                  : facet === 'payouts'
                    ? 'No payout facts in this window.'
                    : facet === 'rules'
                      ? 'No rule facts in this window.'
                      : firm !== 'all'
                        ? `No published facts for ${firm} yet.`
                        : 'No facts in this window.'}
            </p>
          ) : pageCount > 1 ? (
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
          <a className="fp-admin-gate" href="/updates/admin">
            Check admin access
          </a>
        </section>
      </div>
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
  const tone = fact?.verdict === 'worse' ? 'is-worse' : fact?.verdict === 'good' ? 'is-good' : '';
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
            <small>
              {[change.product, change.demo ? 'demo' : null].filter(Boolean).join(' · ')}
            </small>
          </span>
        </span>
        <span className="fp-cell-field">
          <b>{fact?.label || kind}</b>
          <small>
            {kind}
            {change.demo ? ' · Demo' : ''}
          </small>
        </span>
        <span className="fp-cell-prev">{fact?.before || '—'}</span>
        <span className={`fp-cell-now ${tone}`}>{fact?.after || '—'}</span>
        <span className="fp-cell-delta">
          {fact?.before || '—'} → {fact?.after || '—'}
        </span>
      </button>
    </article>
  );
}

function ChangeInspector({ change, fact, logo, onClose }) {
  const [ready, setReady] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const kindId = rowKind(change, fact);
  const kind = KIND_LABEL[kindId] || kindId;
  const verdict = VERDICT[fact?.verdict];
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
            <small>{[change.product, change.demo ? 'demo' : null].filter(Boolean).join(' · ')}</small>
          </span>
        </div>
        <div className="fp-inspect-chips">
          <span className={`fp-kind kind-${kindId}`}>{kind}</span>
          {verdict ? <span className={`fp-verdict ${verdict.className}`}>{verdict.label}</span> : null}
          {change.demo ? <span className="fp-kind kind-review">Demo</span> : null}
        </div>
        <div className="fp-inspect-pair">
          <div>
            <p>Previous value</p>
            <b>{fact?.before || '—'}</b>
          </div>
          <div className={fact?.verdict === 'worse' ? 'is-worse' : 'is-good'}>
            <p>New observed value</p>
            <b>{fact?.after || '—'}</b>
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
