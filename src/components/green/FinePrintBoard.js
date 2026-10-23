'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { KIND_LABEL } from '@/lib/fineprint/catalog';
import './fineprint.css';

const VERDICT = {
  good: { label: 'Good for traders', className: 'bg-[#3FB185]/18 text-[#b7efd3]' },
  worse: { label: 'Worse for traders', className: 'bg-[oklch(0.45_0.12_25_/_0.35)] text-[oklch(0.86_0.08_25)]' },
};

const MARKETS = [
  { id: 'futures', label: 'Futures' },
  { id: 'crypto', label: 'Perp' },
];

const RANGES = [
  { id: 'today', label: 'Today', days: 0 },
  { id: '7', label: '7d', days: 7 },
  { id: '14', label: '14d', days: 14 },
  { id: '30', label: '30d', days: 30 },
  { id: '90', label: '90d', days: 90 },
  { id: 'all', label: 'All', days: Infinity },
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

function dateParts(iso) {
  const date = new Date(iso);
  return {
    mon: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    day: String(date.getUTCDate()).padStart(2, '0'),
  };
}

function FirmMark({ name, logo, className = 'size-5' }) {
  if (logo) {
    return <img src={logo} alt="" width={20} height={20} className={`fp-logo ${className}`} />;
  }
  return (
    <span className={`fp-logo grid place-items-center text-[10px] font-bold text-[#9ddec4] ${className}`}>
      {String(name || '?').slice(0, 1)}
    </span>
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

function Chevron({ open = false }) {
  return (
    <svg className={`fp-chevron ${open ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function starterStatus(firmPages) {
  const states = firmPages.map(item => item.state).filter(Boolean);
  if (states.includes('pending')) return 'Checking a change';
  if (states.some(state => state === 'baseline' || state === 'unchanged' || state === 'changed' || state === 'noise')) {
    if (states.some(state => state === 'blocked' || state === 'incomplete')) return 'Watching. Some pages blocked.';
    return 'Watching';
  }
  if (states.includes('waiting_for_rules_url')) return 'Rules page not set';
  if (states.includes('maintenance')) return 'Firm site is down. Still watching.';
  if (states.some(state => state === 'blocked' || state === 'incomplete')) return 'Page blocked';
  return 'Not checked yet';
}

export default function FinePrintBoard({ changes, pages, logos = {} }) {
  const [market, setMarket] = useState('all');
  const [firm, setFirm] = useState('all');
  const [range, setRange] = useState('all');
  const [day, setDay] = useState(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const firmNames = useMemo(() => {
    return [...new Set(pages.filter(page => market === 'all' || page.market === market).map(page => page.firm))];
  }, [market, pages]);

  const visible = changes
    .filter(change => {
      if (change.status !== 'published' || change.firm === 'FundingPips') return false;
      if (market !== 'all' && change.market !== market) return false;
      if (firm !== 'all' && change.firm !== firm) return false;
      if (!inRange(change.detectedAt, range, day)) return false;
      return true;
    })
    .sort((a, b) => String(b.detectedAt).localeCompare(String(a.detectedAt)));

  const watchByFirm = useMemo(() => {
    const groups = new Map();
    for (const page of pages) {
      if (market !== 'all' && page.market !== market) continue;
      const list = groups.get(page.firm) || [];
      list.push(page);
      groups.set(page.firm, list);
    }
    const needle = query.trim().toLowerCase();
    return [...groups.entries()]
      .filter(([name]) => !needle || name.toLowerCase().includes(needle))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [pages, market, query]);

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
      <div className="fp-filters" role="toolbar" aria-label="Fine Print filters">
        {MARKETS.map(item => (
          <Chip key={item.id} pressed={market === item.id} onClick={() => pickMarket(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>

      <FirmCarousel
        names={firmNames}
        selected={firm}
        logos={logos}
        onPick={name => setFirm(current => (current === name ? 'all' : name))}
      />

      <ChangesCalendar
        changes={changes.filter(change => {
          if (change.status !== 'published' || change.firm === 'FundingPips') return false;
          if (market !== 'all' && change.market !== market) return false;
          if (firm !== 'all' && change.firm !== firm) return false;
          return true;
        })}
        logos={logos}
        day={day}
        onPickDay={pickDay}
        onOpenChange={id => {
          setOpenId(id);
          window.requestAnimationFrame(() => {
            document.getElementById(`change-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }}
      />

      <section className="fp-split" aria-label="Updates and tracked firms">
        <div>
          <div className="fp-pane-head">
            <div>
              <h2 className="fp-h2">Latest updates</h2>
              <p className="fp-sub">Newest first. Open a row for the exact wording.</p>
            </div>
            <div className="fp-range fp-range-time" role="group" aria-label="Time range">
              {RANGES.map(item => (
                <Chip
                  key={item.id}
                  pressed={range === item.id}
                  onClick={() => {
                    setDay(null);
                    setRange(item.id);
                  }}
                >
                  {item.label}
                </Chip>
              ))}
            </div>
          </div>

          <ol className="fp-feed">
            {visible.map(change => (
              <li key={change.id}>
                <UpdateRow
                  change={change}
                  logo={change.logo || logos[change.firm]}
                  open={openId === change.id}
                  onToggle={() => setOpenId(current => (current === change.id ? null : change.id))}
                />
              </li>
            ))}
          </ol>
          {visible.length === 0 ? (
            <p className="fp-empty">
              {range === 'day' ? 'Nothing on this day.' : 'Nothing in this window. Try All, or clear a firm.'}
            </p>
          ) : null}
        </div>

        <aside className="fp-side" aria-label="Tracked firms">
          <div className="fp-pane-head">
            <div>
              <h2 className="fp-h2">Tracked firms</h2>
              <p className="fp-sub">
                {watchByFirm.length} {watchByFirm.length === 1 ? 'firm' : 'firms'} we watch. Click one to filter.
              </p>
            </div>
            <div className="fp-range">
              <Chip
                pressed={false}
                disabled={firm === 'all' && !query}
                ariaLabel="Clear firm filter and search"
                onClick={() => {
                  setFirm('all');
                  setQuery('');
                }}
              >
                Clear
              </Chip>
            </div>
          </div>
          <label className="fp-search">
            <span className="sr-only">Search firms</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search firms…"
              autoComplete="off"
            />
            {query ? (
              <button type="button" className="fp-search-clear btn-bare" aria-label="Clear search" onClick={() => setQuery('')}>
                ×
              </button>
            ) : null}
          </label>
          <ul className="fp-watch">
            {watchByFirm.map(([name, firmPages]) => {
              const plans = firmPages.find(item => item.source === 'plans');
              const starter = firmPages.every(item => item.source === 'starter');
              const live = firmPages.some(item =>
                ['baseline', 'unchanged', 'pending', 'changed', 'noise', 'rebaseline'].includes(item.state),
              );
              return (
                <li key={name}>
                  <button
                    type="button"
                    className="fp-watch-item btn-bare"
                    aria-pressed={firm === name}
                    aria-label={`Filter changelog to ${name}`}
                    onClick={() => setFirm(current => (current === name ? 'all' : name))}
                  >
                    <span className={`fp-dot ${live ? 'on' : ''}`} aria-hidden />
                    <FirmMark name={name} logo={logos[name]} className="size-7 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <b>{name}</b>
                      <small>{starter ? starterStatus(firmPages) : `${plans?.planCount || 0} plans${live ? '' : ' · blocked'}`}</small>
                    </span>
                    <Chevron />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </section>
    </div>
  );
}

function UpdateRow({ change, logo, open, onToggle }) {
  const parts = dateParts(change.detectedAt);
  const kind = KIND_LABEL[change.kind] || change.kind;
  return (
    <article id={`change-${change.id}`} className={`fp-row ${open ? 'open' : ''}`}>
      <button type="button" className="fp-row-btn btn-bare" aria-expanded={open} onClick={onToggle}>
        <time className="fp-date" dateTime={change.detectedAt}>
          <span>{parts.mon}</span>
          <strong>{parts.day}</strong>
        </time>
        <FirmMark name={change.firm} logo={logo} className="fp-logo shrink-0" />
        <span className="fp-row-copy">
          <span className="fp-row-meta">
            <b>{change.firm}</b>
            <span className={`fp-kind kind-${change.kind}`}>{kind}</span>
            {change.status === 'needs_review' ? <span className="fp-kind kind-review">Review</span> : null}
          </span>
          <span className="fp-row-sum">{change.summary || change.title}</span>
        </span>
        <Chevron open={open} />
      </button>
      {open ? <UpdateDetail change={change} /> : null}
    </article>
  );
}

function UpdateDetail({ change }) {
  const [textOpen, setTextOpen] = useState(false);
  return (
    <div className="fp-detail">
      {change.facts?.length ? (
        <ul className="fp-facts">
          {change.facts.map(fact => {
            const verdict = VERDICT[fact.verdict];
            return (
              <li key={`${fact.label}-${fact.before}`}>
                <p>
                  <span className="font-medium">{fact.label}</span>
                  {verdict ? <span className={`fp-verdict ${verdict.className}`}>{verdict.label}</span> : null}
                </p>
                <p className="fp-ba">
                  {fact.before} → {fact.after}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="fp-detail-actions">
        {change.sourceUrl ? (
          <a
            className="fp-chip"
            href={change.sourceUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            Live page
          </a>
        ) : null}
        <Chip pressed={textOpen} ariaLabel={textOpen ? 'Hide exact text' : 'Exact text'} onClick={() => setTextOpen(value => !value)}>
          {textOpen ? 'Hide exact text' : 'Exact text'}
        </Chip>
      </div>
      {textOpen ? <DiffView hunks={change.hunks} /> : null}
    </div>
  );
}
