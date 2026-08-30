'use client';

import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useMemo, useState, useCallback, useEffect, useRef, useId } from 'react';
import { Bookmark, Star } from 'lucide-react';
import {
  firms,
  ACCOUNT_SIZE_OPTIONS,
  STEP_OPTIONS,
  PRICE_OPTIONS,
} from '@/data/firms';
import './FirmCompareDemoGreen.css';

const MAX_FAVORITES = 5;
const PAGE_SIZE = 10;
const COLS_STORAGE_KEY = 'cmp-green-visible-cols-v2';

/** Default table order when no column sort is active */
const DEFAULT_FIRM_ORDER = [
  'Apex Trader Funding',
  'Lucid Trading',
  'Tradeify',
  'My Funded Futures',
  'Take Profit Trader',
  'FundedNext Futures',
  'Top One Futures',
  'Earn2Trade',
  'Purdia',
  'YRM Prop',
  'Bulenox',
  'Phidias Propfirm',
  'Legends Trading',
  'TradeDay',
  'E8 Futures',
  'Blue Guardian',
];

const firmOrderIndex = name => {
  const i = DEFAULT_FIRM_ORDER.indexOf(name);
  return i === -1 ? DEFAULT_FIRM_ORDER.length + 1 : i;
};

/** Prefer common retail sizes when discount/price are close */
const PREFERRED_SIZES = ['$50K', '$100K', '$25K', '$150K', '$75K'];

function discountPct(plan) {
  const was = Number(plan.priceWas) || 0;
  const now = Number(plan.price) || 0;
  if (was <= 0 || now >= was) return 0;
  return (was - now) / was;
}

/** Higher = better “featured” pick (discount first, then price, then size) */
function planHighlightScore(plan) {
  const disc = discountPct(plan);
  const price = Number(plan.price);
  const cheap = Number.isFinite(price) ? 1 / (1 + Math.max(price, 0)) : 0;
  const sizeIdx = PREFERRED_SIZES.indexOf(plan.accountSize);
  const sizeBoost = sizeIdx === -1 ? 0 : (PREFERRED_SIZES.length - sizeIdx) * 0.015;
  return disc * 10 + cheap + sizeBoost;
}

function pickHighlightPlans(plans) {
  const ranked = [...plans].sort((a, b) => planHighlightScore(b) - planHighlightScore(a));
  const primary = ranked[0] || null;
  const secondary = ranked.find(p => p.id !== primary?.id) || null;
  return { primary, secondary };
}

/**
 * Default browse order:
 *  1) one best plan per firm (firm order)  → fills page 1 + start of page 2
 *  2) one second plan per firm (best remaining deal)
 *  3) every other plan / size
 */
function buildCuratedDefaultRows(rows) {
  const byFirm = new Map();
  rows.forEach(r => {
    const list = byFirm.get(r.firm.name);
    if (list) list.push(r);
    else byFirm.set(r.firm.name, [r]);
  });

  const firmNames = [...byFirm.keys()].sort(
    (a, b) => firmOrderIndex(a) - firmOrderIndex(b)
  );

  const primaries = [];
  const secondaries = [];
  const used = new Set();

  firmNames.forEach(name => {
    const firmRows = byFirm.get(name);
    const { primary, secondary } = pickHighlightPlans(firmRows.map(r => r.plan));
    if (primary) {
      const row = firmRows.find(r => r.plan.id === primary.id);
      if (row) {
        primaries.push(row);
        used.add(primary.id);
      }
    }
    if (secondary) {
      const row = firmRows.find(r => r.plan.id === secondary.id);
      if (row) {
        secondaries.push(row);
        used.add(secondary.id);
      }
    }
  });

  const rest = rows
    .filter(r => !used.has(r.plan.id))
    .sort((a, b) => {
      const byFirmCmp = firmOrderIndex(a.firm.name) - firmOrderIndex(b.firm.name);
      if (byFirmCmp !== 0) return byFirmCmp;
      return sortValue('accountSize', b.plan, b.firm) - sortValue('accountSize', a.plan, a.firm);
    });

  return [...primaries, ...secondaries, ...rest];
}

const INFO_COPY = {
  steps:
    'How many evaluation phases you must pass before funding. Instant means no challenge phase.',
  activationFee:
    'One-time fee charged when you move from evaluation to a funded account. “None” means no activation fee.',
  maxPayout:
    'Highest amount you can withdraw in a payout cycle (or overall), based on the firm’s rules for this plan.',
  minPayout:
    'Minimum profit you need before you can request a payout on this plan.',
};

/** Mid-column track widths — keep header + body cells in lockstep */
const MID_COLS = [
  { key: 'accountSize', label: 'Account size', sort: true, min: 120 },
  { key: 'steps', label: 'Steps', sort: true, min: 110 },
  { key: 'activationFee', label: 'Activation fee', sort: false, min: 140 },
  { key: 'maxLots', label: 'Max contract size', sub: 'Minis / Micros', sort: false, min: 158 },
  { key: 'profitTarget', label: 'Profit target', sort: true, min: 120 },
  { key: 'maxLoss', label: 'Max loss', sort: true, min: 110 },
  { key: 'maxLossType', label: 'Max loss type', sort: true, min: 140 },
  { key: 'ptDd', label: 'PT:DD', sort: true, min: 90 },
  { key: 'profitSplit', label: 'Profit split', sort: true, min: 130 },
  { key: 'maxPayout', label: 'Max payout amount', sort: true, min: 160 },
  { key: 'minPayout', label: 'Min payout threshold', sort: true, min: 160 },
  { key: 'consistency', label: 'Consistency rule', sub: 'Eval / Funded', sort: false, min: 168 },
  { key: 'payoutFreq', label: 'Payout freq.', sort: true, min: 200 },
];

const ALL_COL_KEYS = MID_COLS.map(c => c.key);

function loadVisibleCols() {
  if (typeof window === 'undefined') return new Set(ALL_COL_KEYS);
  try {
    const raw = window.localStorage.getItem(COLS_STORAGE_KEY);
    if (!raw) return new Set(ALL_COL_KEYS);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return new Set(ALL_COL_KEYS);
    const next = new Set(parsed.filter(k => ALL_COL_KEYS.includes(k)));
    return next.size ? next : new Set(ALL_COL_KEYS);
  } catch {
    return new Set(ALL_COL_KEYS);
  }
}

/** Parse "$75K", "$1,500", "1:0.67" into sortable numbers when possible */
function sortValue(key, plan, firm) {
  if (key === 'profitSplit' || key === 'price' || key === 'rating') {
    const v = key === 'rating' ? firm.rating : plan[key];
    return typeof v === 'number' ? v : Number(v) || 0;
  }
  if (key === 'accountSize') {
    const m = String(plan.accountSize || '').match(/([\d.]+)/);
    return m ? Number(m[1]) * (String(plan.accountSize).includes('K') ? 1000 : 1) : 0;
  }
  if (key === 'profitTarget' || key === 'maxLoss' || key === 'activationFee') {
    const raw = String(plan[key] ?? '');
    if (/none/i.test(raw)) return -1;
    const m = raw.replace(/,/g, '').match(/-?[\d.]+/);
    return m ? Number(m[0]) : 0;
  }
  if (key === 'ptDd') {
    const parts = String(plan.ptDd || '').split(':');
    if (parts.length === 2) return Number(parts[1]) || 0;
    return 0;
  }
  return plan[key] ?? firm[key] ?? '';
}

/** Windowed page list: 1, 2, …, last (Match-style) */
function buildPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [];
  const push = n => {
    if (items[items.length - 1] !== n) items.push(n);
  };
  push(1);
  if (current > 3) push('…');
  for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n += 1) {
    push(n);
  }
  if (current < total - 2) push('…');
  push(total);
  return items;
}

const EMPTY_FACET = {
  assets: [],
  sizes: [],
  steps: [],
  prices: [],
  country: null,
  platform: null,
  programType: null,
};

function flagEmoji(code) {
  if (!code || code.length !== 2) return '';
  const A = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map(c => A + (c.charCodeAt(0) - 65))
  );
}

function formatMultiLabel(selected, fallback) {
  if (!selected?.length) return fallback;
  if (selected.length === 1) return selected[0];
  return 'Multiple';
}

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function SortArrows({ active, direction }) {
  const upStrong = active && direction === 'asc';
  const downStrong = active && direction === 'desc';
  return (
    <span className="cmp-th__sort" aria-hidden>
      <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
        <path
          d="M3.5 0L6.5 4H0.5L3.5 0Z"
          fill="currentColor"
          opacity={upStrong ? 1 : 0.3}
        />
        <path
          d="M3.5 10L0.5 6H6.5L3.5 10Z"
          fill="currentColor"
          opacity={downStrong ? 1 : 0.3}
        />
      </svg>
    </span>
  );
}

function firmWebsiteUrl(website) {
  if (!website || typeof website !== 'string') return null;
  const t = website.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

const STAR_PATH =
  'M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27 6.2 20.37l1.11-6.47-4.7-4.58 6.49-.94L12 2.5z';

function VerifiedBadge() {
  return (
    <span className="cmp-firm__verified" title="Verified firm" aria-label="Verified">
      <Star size={9} strokeWidth={0} fill="#fff" aria-hidden />
    </span>
  );
}

/** Stars rounded to nearest half so 4.2→4, 4.6→4.5 — stable & readable */
function RatingStars({ rating, idPrefix = 'star' }) {
  const rounded = Math.round(Math.min(5, Math.max(0, Number(rating) || 0)) * 2) / 2;
  return (
    <span className="cmp-stars" aria-hidden>
      {[1, 2, 3, 4, 5].map(n => {
        const state = rounded >= n ? 'full' : rounded >= n - 0.5 ? 'half' : 'empty';
        const clipId = `${idPrefix}-half-${n}`;
        return (
          <span key={n} className={`cmp-stars__s cmp-stars__s--${state}`}>
            <svg viewBox="0 0 24 24" width="11" height="11">
              <path d={STAR_PATH} className="cmp-stars__track" />
              {state === 'full' && <path d={STAR_PATH} className="cmp-stars__fill" />}
              {state === 'half' && (
                <>
                  <defs>
                    <clipPath id={clipId}>
                      <rect x="0" y="0" width="12" height="24" />
                    </clipPath>
                  </defs>
                  <path d={STAR_PATH} className="cmp-stars__fill" clipPath={`url(#${clipId})`} />
                </>
              )}
            </svg>
          </span>
        );
      })}
    </span>
  );
}

function ProfitSplitBar({ pct }) {
  const fill = Math.min(100, Math.max(0, Number(pct) || 0));
  const segs = 10;
  const lit = Math.round((fill / 100) * segs);
  return (
    <div className="cmp-split">
      <span className="cmp-split__val">{pct}%</span>
      <div className="cmp-split__segments" role="presentation" aria-hidden>
        {Array.from({ length: segs }, (_, i) => (
          <span
            key={i}
            className={`cmp-split__seg${i < lit ? ' cmp-split__seg--on' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

function InfoTip({ tipKey }) {
  const text = INFO_COPY[tipKey];
  const tipId = useId();
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, place: 'above' });

  const placeTip = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const place = r.top < 140 ? 'below' : 'above';
    setPos({
      top: place === 'above' ? r.top - 10 : r.bottom + 10,
      left: Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120),
      place,
    });
  }, []);

  const show = useCallback(() => {
    placeTip();
    setOpen(true);
  }, [placeTip]);

  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onReposition = () => placeTip();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open, placeTip]);

  if (!text) return null;

  return (
    <span className="cmp-tip">
      <button
        ref={btnRef}
        type="button"
        className="cmp-tip__btn"
        aria-label="More info"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <ToolbarIcon name="info" />
      </button>
      {open &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            className={`cmp-tip__panel cmp-tip__panel--portal cmp-tip__panel--${pos.place}`}
            style={{ top: pos.top, left: pos.left }}
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
}

function renderMidCell(col, p) {
  const style = { flex: `0 0 ${col.min}px`, minWidth: col.min };
  switch (col.key) {
    case 'accountSize':
      return (
        <div key={col.key} className="cmp-td cmp-td--num cmp-mid__cell" style={style}>
          {String(p.accountSize).replace('$', '')}
        </div>
      );
    case 'steps':
      return (
        <div key={col.key} className="cmp-td cmp-mid__cell" style={style}>
          <span className="cmp-cell-with-info">
            {p.steps}
            <InfoTip tipKey="steps" />
          </span>
        </div>
      );
    case 'activationFee':
      return (
        <div key={col.key} className="cmp-td cmp-td--muted cmp-mid__cell" style={style}>
          <span className="cmp-cell-with-info">
            {p.activationFee}
            <InfoTip tipKey="activationFee" />
          </span>
        </div>
      );
    case 'maxLots':
      return (
        <div key={col.key} className="cmp-td cmp-td--num cmp-mid__cell" style={style}>
          {String(p.maxLots).includes('|') ? (
            <>
              {p.maxLots.split('|')[0].trim()} <span className="cmp-pipe">|</span>{' '}
              {p.maxLots.split('|')[1].trim()}
            </>
          ) : (
            p.maxLots
          )}
        </div>
      );
    case 'profitTarget':
    case 'maxLoss':
    case 'ptDd':
      return (
        <div key={col.key} className="cmp-td cmp-td--num cmp-mid__cell" style={style}>
          {p[col.key]}
        </div>
      );
    case 'maxLossType':
      return (
        <div key={col.key} className="cmp-td cmp-mid__cell" style={style}>
          {p.maxLossType}
        </div>
      );
    case 'profitSplit':
      return (
        <div key={col.key} className="cmp-td cmp-mid__cell" style={style}>
          <ProfitSplitBar pct={p.profitSplit} />
        </div>
      );
    case 'maxPayout':
      return (
        <div key={col.key} className="cmp-td cmp-td--wrap cmp-mid__cell" style={style}>
          <span className="cmp-cell-with-info">
            {p.maxPayout}
            <InfoTip tipKey="maxPayout" />
          </span>
        </div>
      );
    case 'minPayout':
      return (
        <div key={col.key} className="cmp-td cmp-td--wrap cmp-mid__cell" style={style}>
          <span className="cmp-cell-with-info">
            {p.minPayout}
            <InfoTip tipKey="minPayout" />
          </span>
        </div>
      );
    case 'consistency':
      return (
        <div key={col.key} className="cmp-td cmp-td--num cmp-mid__cell" style={style}>
          <span className={p.consistencyEval === 'None' ? 'cmp-muted' : undefined}>
            {p.consistencyEval}
          </span>{' '}
          <span className="cmp-pipe">|</span>{' '}
          <span className={p.consistencyFunded === 'None' ? 'cmp-muted' : undefined}>
            {p.consistencyFunded}
          </span>
        </div>
      );
    case 'payoutFreq':
      return (
        <div key={col.key} className="cmp-td cmp-td--wrap cmp-mid__cell" style={style}>
          {p.payoutFreq}
        </div>
      );
    default:
      return null;
  }
}

function ToolbarIcon({ name }) {
  const s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
  const stroke = 'currentColor';
  switch (name) {
    case 'filter':
      return (
        <svg {...s}>
          <path
            d="M4 5h16l-5.5 7v6.5L10 17v-5L4 5z"
            stroke={stroke}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'bookmark':
      return (
        <svg {...s}>
          <path
            d="M7 4h10v17l-5-3.2L7 21V4z"
            stroke={stroke}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'chevron':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'info':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1" fill="currentColor" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...s}>
          <rect x="4" y="4" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.65" />
          <rect x="14" y="4" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.65" />
          <rect x="4" y="14" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.65" />
          <rect x="14" y="14" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.65" />
        </svg>
      );
    default:
      return null;
  }
}

function FilterDropdown({ id, label, valueLabel, open, onToggle, options, selected, onToggleOption }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') onToggle(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onToggle]);

  return (
    <div className={`cmp-dd${open ? ' cmp-dd--open' : ''}`}>
      <button
        type="button"
        className={`cmp-dd__btn${selected.length ? ' cmp-dd__btn--active' : ''}`}
        onClick={() => onToggle(open ? null : id)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="cmp-dd__label">{label}:</span>
        <span className="cmp-dd__value">{valueLabel}</span>
        <ToolbarIcon name="chevron" />
      </button>
      {open && (
        <div className="cmp-dd__panel" role="listbox" aria-label={`${label} options`}>
          <p className="cmp-dd__hint">Select one or multiple options</p>
          <div className="cmp-dd__options">
            {options.map(opt => {
              const on = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={`cmp-chip ${on ? 'cmp-chip--on' : ''}`}
                  onClick={() => onToggleOption(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ label, checked, onChange }) {
  return (
    <label className="cmp-toggle">
      <button
        type="button"
        className={`cmp-toggle__track${checked ? ' cmp-toggle__track--on' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      >
        <span className="cmp-toggle__thumb" />
      </button>
      <span className="cmp-toggle__label">{label}</span>
    </label>
  );
}

function SortHead({ label, sortKey, sort, onSort, className = '', sub, style }) {
  return (
    <div
      role="columnheader"
      className={`cmp-th${sub ? ' cmp-th--stacked' : ''} ${className}`.trim()}
      style={style}
      aria-sort={
        sort.key === sortKey ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'
      }
    >
      <button type="button" className="cmp-th__btn" onClick={() => onSort(sortKey)}>
        <span className="cmp-th__label">{label}</span>
        <SortArrows active={sort.key === sortKey} direction={sort.dir} />
      </button>
      {sub ? <span className="cmp-th__sub">{sub}</span> : null}
    </div>
  );
}

function StaticHead({ label, sub, className = '', style }) {
  return (
    <div
      role="columnheader"
      className={`cmp-th${sub ? ' cmp-th--stacked' : ''} ${className}`.trim()}
      style={style}
    >
      <span className="cmp-th__label">{label}</span>
      {sub ? <span className="cmp-th__sub">{sub}</span> : null}
    </div>
  );
}

/** One horizontal scrollbar driving every mid pane via shared scrollLeft */
function TableScrollSlider({ getMidPanes, masterRef }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const [metrics, setMetrics] = useState({ thumbPct: 40, leftPct: 0, needed: false });

  const measure = useCallback(() => {
    const el = masterRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const needed = scrollWidth > clientWidth + 2;
    const thumbPct = needed ? Math.max(12, (clientWidth / scrollWidth) * 100) : 100;
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const leftPct = needed ? (scrollLeft / maxScroll) * (100 - thumbPct) : 0;
    setMetrics({ thumbPct, leftPct, needed });
  }, [masterRef]);

  useEffect(() => {
    const el = masterRef.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [masterRef, measure]);

  const setAllScroll = useCallback(
    left => {
      getMidPanes().forEach(pane => {
        if (pane) pane.scrollLeft = left;
      });
      measure();
    },
    [getMidPanes, measure]
  );

  const scrollFromClientX = useCallback(
    clientX => {
      const el = masterRef.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const rect = track.getBoundingClientRect();
      const thumbW = (metrics.thumbPct / 100) * rect.width;
      const usable = Math.max(1, rect.width - thumbW);
      const x = Math.min(Math.max(clientX - rect.left - thumbW / 2, 0), usable);
      const ratio = x / usable;
      const maxScroll = el.scrollWidth - el.clientWidth;
      setAllScroll(ratio * maxScroll);
    },
    [masterRef, metrics.thumbPct, setAllScroll]
  );

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return;
      scrollFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [scrollFromClientX]);

  if (!metrics.needed) return null;

  return (
    <div
      className="cmp-hscroll"
      ref={trackRef}
      role="scrollbar"
      aria-orientation="horizontal"
      aria-controls="cmp-mid-scroller"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(metrics.leftPct)}
      onPointerDown={e => {
        dragging.current = true;
        scrollFromClientX(e.clientX);
      }}
    >
      <div className="cmp-hscroll__track" aria-hidden />
      <div
        className="cmp-hscroll__thumb"
        style={{ width: `${metrics.thumbPct}%`, left: `${metrics.leftPct}%` }}
      />
    </div>
  );
}

export default function FirmCompareDemo() {
  const [topMode, setTopMode] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const [facet, setFacet] = useState(EMPTY_FACET);
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [search, setSearch] = useState('');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => new Set(ALL_COL_KEYS));
  const [colsHydrated, setColsHydrated] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sort, setSort] = useState({ key: 'default', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(null);
  const toolbarRef = useRef(null);
  const boardRef = useRef(null);
  const masterMidRef = useRef(null);
  const midScrollLeft = useRef(0);
  const syncingScroll = useRef(false);

  const visibleMidCols = useMemo(
    () => MID_COLS.filter(c => visibleCols.has(c.key)),
    [visibleCols]
  );

  useEffect(() => {
    setVisibleCols(loadVisibleCols());
    setColsHydrated(true);
  }, []);

  useEffect(() => {
    if (!colsHydrated) return;
    try {
      window.localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify([...visibleCols]));
    } catch {
      /* ignore */
    }
  }, [visibleCols, colsHydrated]);

  const toggleCol = useCallback(key => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 3) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const getMidPanes = useCallback(() => {
    const root = boardRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll('.cmp-mid'));
  }, []);

  const setMasterMidRef = useCallback(el => {
    masterMidRef.current = el;
  }, []);

  const applyMidScroll = useCallback(
    (left, source) => {
      midScrollLeft.current = left;
      getMidPanes().forEach(pane => {
        if (pane !== source && pane.scrollLeft !== left) pane.scrollLeft = left;
      });
    },
    [getMidPanes]
  );

  const onMidScroll = useCallback(
    e => {
      if (syncingScroll.current) return;
      syncingScroll.current = true;
      applyMidScroll(e.currentTarget.scrollLeft, e.currentTarget);
      requestAnimationFrame(() => {
        syncingScroll.current = false;
      });
    },
    [applyMidScroll]
  );

  const uniqueCountries = useMemo(
    () => [...new Set(firms.map(f => f.countryCode))].sort(),
    []
  );
  const uniqueAssets = useMemo(() => {
    const s = new Set();
    firms.forEach(f => f.assets.forEach(a => s.add(a)));
    return [...s].sort();
  }, []);
  const uniquePlatforms = useMemo(() => {
    const s = new Set();
    firms.forEach(f => f.platforms.forEach(p => s.add(p)));
    return [...s].sort();
  }, []);

  useEffect(() => {
    if (!openDropdown && !customizeOpen) return undefined;
    const onPointer = e => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setCustomizeOpen(false);
      }
    };
    const onKey = e => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setCustomizeOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [openDropdown, customizeOpen]);

  const toggleFavorite = useCallback(name => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (next.size < MAX_FAVORITES) next.add(name);
      return next;
    });
  }, []);

  const resetFacets = useCallback(() => {
    setFacet(EMPTY_FACET);
    setSearch('');
    setOpenDropdown(null);
    setSort({ key: 'default', dir: 'asc' });
  }, []);

  const toggleMulti = useCallback((key, value) => {
    setFacet(prev => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const cycleSort = useCallback(key => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'desc' };
      return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' };
    });
  }, []);

  const filtered = useMemo(() => {
    let rows = [];
    firms.forEach(f => {
      (f.plans || []).forEach(p => {
        rows.push({ firm: f, plan: p });
      });
    });

    if (topMode === 'favorites') {
      rows = rows.filter(r => favorites.has(r.firm.name));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(r => {
        const name = r.firm.name.toLowerCase();
        const planType = String(r.plan.planType || '').toLowerCase();
        return name.includes(q) || planType.includes(q) || `${name} ${planType}`.includes(q);
      });
    }

    if (facet.assets.length) {
      rows = rows.filter(r => facet.assets.some(a => r.firm.assets.includes(a)));
    }
    if (facet.sizes.length) {
      rows = rows.filter(r => facet.sizes.includes(r.plan.accountSize));
    }
    if (facet.steps.length) {
      rows = rows.filter(r => facet.steps.includes(r.plan.steps));
    }
    if (facet.prices.length) {
      rows = rows.filter(r => facet.prices.includes(r.plan.priceType));
    }
    if (facet.country) rows = rows.filter(r => r.firm.countryCode === facet.country);
    if (facet.platform) {
      rows = rows.filter(r => r.firm.platforms.includes(facet.platform));
    }
    if (facet.programType) rows = rows.filter(r => r.firm.type === facet.programType);

    const mul = sort.dir === 'desc' ? -1 : 1;
    const isDefaultSort = !sort.key || sort.key === 'default';
    const hasBrowseFilters =
      topMode === 'favorites' ||
      Boolean(search.trim()) ||
      facet.assets.length > 0 ||
      facet.sizes.length > 0 ||
      facet.steps.length > 0 ||
      facet.prices.length > 0 ||
      Boolean(facet.country) ||
      Boolean(facet.platform) ||
      Boolean(facet.programType);

    /* Unfiltered default: 1 best plan/firm → 1 second deal/firm → full catalog */
    if (isDefaultSort && !hasBrowseFilters) {
      return buildCuratedDefaultRows(rows);
    }

    rows = [...rows].sort((a, b) => {
      if (isDefaultSort) {
        const byFirm = firmOrderIndex(a.firm.name) - firmOrderIndex(b.firm.name);
        if (byFirm !== 0) return byFirm;
        return sortValue('accountSize', b.plan, b.firm) - sortValue('accountSize', a.plan, a.firm);
      }

      const av = sortValue(sort.key, a.plan, a.firm);
      const bv = sortValue(sort.key, b.plan, b.firm);
      let primary = 0;
      if (typeof av === 'number' && typeof bv === 'number') primary = (av - bv) * mul;
      else primary = String(av ?? '').localeCompare(String(bv ?? '')) * mul;
      if (primary !== 0) return primary;
      return firmOrderIndex(a.firm.name) - firmOrderIndex(b.firm.name);
    });

    return rows;
  }, [topMode, favorites, facet, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => buildPageItems(page, totalPages), [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [topMode, facet, sort, search]);

  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  /* Keep every mid pane locked to the shared horizontal offset after page/filter changes */
  useEffect(() => {
    const left = midScrollLeft.current;
    const id = requestAnimationFrame(() => applyMidScroll(left, null));
    return () => cancelAnimationFrame(id);
  }, [pageRows, visibleMidCols, applyMidScroll]);

  /* Native scroll + wheel — keep every mid pane locked together */
  useEffect(() => {
    const root = boardRef.current;
    if (!root) return undefined;

    const panes = () => Array.from(root.querySelectorAll('.cmp-mid'));

    const lockFrom = (left, source) => {
      if (syncingScroll.current) return;
      syncingScroll.current = true;
      applyMidScroll(left, source);
      requestAnimationFrame(() => {
        syncingScroll.current = false;
      });
    };

    const onScroll = e => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !t.classList.contains('cmp-mid')) return;
      lockFrom(t.scrollLeft, t);
    };

    const onWheel = e => {
      const mid = e.target instanceof Element ? e.target.closest('.cmp-mid') : null;
      if (!mid || !root.contains(mid)) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const shiftVertical = e.shiftKey && Math.abs(e.deltaY) > 0;
      if (!horizontal && !shiftVertical) return;
      const delta = horizontal ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      const max = Math.max(0, mid.scrollWidth - mid.clientWidth);
      const next = Math.min(Math.max(mid.scrollLeft + delta, 0), max);
      syncingScroll.current = true;
      midScrollLeft.current = next;
      panes().forEach(pane => {
        pane.scrollLeft = next;
      });
      requestAnimationFrame(() => {
        syncingScroll.current = false;
      });
    };

    const bind = () => {
      panes().forEach(pane => {
        pane.removeEventListener('scroll', onScroll);
        pane.addEventListener('scroll', onScroll, { passive: true });
      });
    };

    bind();
    root.addEventListener('wheel', onWheel, { passive: false });
    const mo = new MutationObserver(bind);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      root.removeEventListener('wheel', onWheel);
      panes().forEach(pane => pane.removeEventListener('scroll', onScroll));
    };
  }, [applyMidScroll, pageRows.length]);

  const copyCode = async code => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const favCount = favorites.size;
  const activeQuickFilters =
    facet.assets.length + facet.sizes.length + facet.steps.length + facet.prices.length;

  return (
    <div className="cmp">
      {sidebarOpen && (
        <button
          type="button"
          className="cmp-sidebar__backdrop"
          aria-label="Close filters"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="cmp-layout">
        <aside
          className={`cmp-sidebar${sidebarOpen ? ' cmp-sidebar--open' : ''}`}
          id="cmp-filters"
          aria-hidden={!sidebarOpen}
        >
          <div className="cmp-sidebar__head">
            <span className="cmp-sidebar__title">Advanced filters</span>
            <button
              type="button"
              className="cmp-sidebar__close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close filter panel"
            >
              ×
            </button>
          </div>

          {activeQuickFilters > 0 && (
            <div className="cmp-sidebar__active">
              {facet.assets.map(a => (
                <span key={`a-${a}`} className="cmp-sidebar__chip">Assets: {a}</span>
              ))}
              {facet.sizes.map(s => (
                <span key={`s-${s}`} className="cmp-sidebar__chip">Size: {s}</span>
              ))}
              {facet.steps.map(s => (
                <span key={`st-${s}`} className="cmp-sidebar__chip">Steps: {s}</span>
              ))}
              {facet.prices.map(p => (
                <span key={`p-${p}`} className="cmp-sidebar__chip">Price: {p}</span>
              ))}
            </div>
          )}

          <details className="cmp-acc" open>
            <summary className="cmp-acc__summary">Instruments</summary>
            <div className="cmp-acc__body">
              {uniqueAssets.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`cmp-chip ${facet.assets.includes(a) ? 'cmp-chip--on' : ''}`}
                  onClick={() => toggleMulti('assets', a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </details>

          <details className="cmp-acc" open>
            <summary className="cmp-acc__summary">Account size</summary>
            <div className="cmp-acc__body">
              {ACCOUNT_SIZE_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`cmp-chip ${facet.sizes.includes(s) ? 'cmp-chip--on' : ''}`}
                  onClick={() => toggleMulti('sizes', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </details>

          <details className="cmp-acc">
            <summary className="cmp-acc__summary">Steps</summary>
            <div className="cmp-acc__body">
              {STEP_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`cmp-chip ${facet.steps.includes(s) ? 'cmp-chip--on' : ''}`}
                  onClick={() => toggleMulti('steps', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </details>

          <details className="cmp-acc">
            <summary className="cmp-acc__summary">Price</summary>
            <div className="cmp-acc__body">
              {PRICE_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`cmp-chip ${facet.prices.includes(p) ? 'cmp-chip--on' : ''}`}
                  onClick={() => toggleMulti('prices', p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </details>

          <details className="cmp-acc">
            <summary className="cmp-acc__summary">Countries</summary>
            <div className="cmp-acc__body">
              {uniqueCountries.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`cmp-chip ${facet.country === c ? 'cmp-chip--on' : ''}`}
                  onClick={() => setFacet(p => ({ ...p, country: p.country === c ? null : c }))}
                >
                  {flagEmoji(c)} {c}
                </button>
              ))}
            </div>
          </details>

          <details className="cmp-acc">
            <summary className="cmp-acc__summary">Platforms</summary>
            <div className="cmp-acc__body">
              {uniquePlatforms.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`cmp-chip ${facet.platform === p ? 'cmp-chip--on' : ''}`}
                  onClick={() =>
                    setFacet(f => ({ ...f, platform: f.platform === p ? null : p }))
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </details>

          <details className="cmp-acc">
            <summary className="cmp-acc__summary">Program type</summary>
            <div className="cmp-acc__body">
              {['Challenge', 'Funded'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`cmp-chip ${facet.programType === t ? 'cmp-chip--on' : ''}`}
                  onClick={() =>
                    setFacet(f => ({ ...f, programType: f.programType === t ? null : t }))
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </details>

          <button type="button" className="cmp-reset" onClick={resetFacets}>
            Reset filter
          </button>
        </aside>

        <div className="cmp-main">
          <div className="cmp-toolbar" role="toolbar" aria-label="Table filters" ref={toolbarRef}>
            <button
              type="button"
              className={`cmp-pill${sidebarOpen ? ' cmp-pill--active cmp-pill--filter-open' : ''}`}
              onClick={() => {
                setSidebarOpen(v => !v);
                setOpenDropdown(null);
              }}
              aria-pressed={sidebarOpen}
              aria-expanded={sidebarOpen}
              aria-controls="cmp-filters"
            >
              <ToolbarIcon name="filter" />
              Filter
            </button>

            <span className="cmp-toolbar__sep" aria-hidden />

            <FilterDropdown
              id="assets"
              label="Assets"
              valueLabel={formatMultiLabel(facet.assets, 'All')}
              open={openDropdown === 'assets'}
              onToggle={setOpenDropdown}
              options={uniqueAssets}
              selected={facet.assets}
              onToggleOption={opt => toggleMulti('assets', opt)}
            />
            <FilterDropdown
              id="sizes"
              label="Size"
              valueLabel={formatMultiLabel(facet.sizes, 'All')}
              open={openDropdown === 'sizes'}
              onToggle={setOpenDropdown}
              options={ACCOUNT_SIZE_OPTIONS}
              selected={facet.sizes}
              onToggleOption={opt => toggleMulti('sizes', opt)}
            />
            <FilterDropdown
              id="steps"
              label="Steps"
              valueLabel={formatMultiLabel(facet.steps, 'All')}
              open={openDropdown === 'steps'}
              onToggle={setOpenDropdown}
              options={STEP_OPTIONS}
              selected={facet.steps}
              onToggleOption={opt => toggleMulti('steps', opt)}
            />
            <FilterDropdown
              id="prices"
              label="Price"
              valueLabel={formatMultiLabel(facet.prices, 'All')}
              open={openDropdown === 'prices'}
              onToggle={setOpenDropdown}
              options={PRICE_OPTIONS}
              selected={facet.prices}
              onToggleOption={opt => toggleMulti('prices', opt)}
            />

            <span className="cmp-toolbar__sep" aria-hidden />

            <ToggleSwitch
              label="Apply Discount"
              checked={applyDiscount}
              onChange={setApplyDiscount}
            />

            <span className="cmp-toolbar__sep" aria-hidden />

            <button
              type="button"
              className={`cmp-pill cmp-pill--round${topMode === 'all' ? ' cmp-pill--active' : ''}`}
              onClick={() => setTopMode('all')}
              aria-pressed={topMode === 'all'}
            >
              All
            </button>
            <button
              type="button"
              className={`cmp-pill${topMode === 'favorites' ? ' cmp-pill--active' : ''}`}
              onClick={() => setTopMode('favorites')}
              aria-pressed={topMode === 'favorites'}
            >
              <ToolbarIcon name="bookmark" />
              Bookmarks {favCount}/{MAX_FAVORITES}
            </button>

            <div className="cmp-customize-wrap">
              <button
                type="button"
                className={`cmp-pill cmp-pill--customize${customizeOpen ? ' cmp-pill--active' : ''}`}
                onClick={() => {
                  setCustomizeOpen(v => !v);
                  setOpenDropdown(null);
                }}
                aria-pressed={customizeOpen}
                aria-expanded={customizeOpen}
              >
                <ToolbarIcon name="grid" />
                Customize
              </button>
              {customizeOpen && (
                <div className="cmp-customize" role="dialog" aria-label="Customize columns">
                  <p className="cmp-customize__title">Show or hide columns</p>
                  <div className="cmp-customize__list">
                    {MID_COLS.map(col => (
                      <label key={col.key} className="cmp-customize__item">
                        <input
                          type="checkbox"
                          checked={visibleCols.has(col.key)}
                          onChange={() => toggleCol(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="cmp-customize__reset"
                    onClick={() => setVisibleCols(new Set(ALL_COL_KEYS))}
                  >
                    Reset columns
                  </button>
                </div>
              )}
            </div>

            <label className="cmp-search">
              <svg
                className="cmp-search__icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M21 21l-4.3-4.3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                className="cmp-search__input"
                placeholder="Search firm name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search firm name"
                autoComplete="off"
                spellCheck={false}
              />
              {search ? (
                <button
                  type="button"
                  className="cmp-search__clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </label>
          </div>

          <div className="cmp-table-stage">
            <div className="cmp-table-headrow">
              <h3 className="cmp-table-heading">
                Prop firm challenges <span className="cmp-table-heading__count">{filtered.length}</span>
              </h3>
              <TableScrollSlider getMidPanes={getMidPanes} masterRef={masterMidRef} />
            </div>

            <div
              className="cmp-board"
              ref={boardRef}
              role="table"
              aria-label="Compare prop firm challenges: size, steps, drawdown, payouts, and price"
            >
              <div className="cmp-board__row cmp-board__row--head" role="row">
                <div className="cmp-pin cmp-pin--firm" role="columnheader">
                  <span className="cmp-th cmp-th--firm">Firm / Rank</span>
                </div>
                <div
                  className="cmp-mid"
                  id="cmp-mid-scroller"
                  ref={setMasterMidRef}
                  onScroll={onMidScroll}
                  role="presentation"
                >
                  <div className="cmp-mid__track">
                    {visibleMidCols.map(col =>
                      col.sort ? (
                        <SortHead
                          key={col.key}
                          label={col.label}
                          sub={col.sub}
                          sortKey={col.key}
                          sort={sort}
                          onSort={cycleSort}
                          className="cmp-mid__cell"
                          style={{ flex: `0 0 ${col.min}px`, minWidth: col.min }}
                        />
                      ) : (
                        <StaticHead
                          key={col.key}
                          label={col.label}
                          sub={col.sub}
                          className="cmp-mid__cell"
                          style={{ flex: `0 0 ${col.min}px`, minWidth: col.min }}
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="cmp-pin cmp-pin--price" role="columnheader">
                  <SortHead
                    label="Price"
                    sortKey="price"
                    sort={sort}
                    onSort={cycleSort}
                    className="cmp-th--price"
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="cmp-board__empty" role="row">
                  <div className="cmp-empty" role="cell">
                    No challenges match these filters. Try{' '}
                    <button
                      type="button"
                      className="cmp-empty__link"
                      onClick={() => {
                        resetFacets();
                        setTopMode('all');
                      }}
                    >
                      resetting
                    </button>{' '}
                    or switching to <strong>All</strong>.
                  </div>
                </div>
              ) : (
                pageRows.map(({ firm: f, plan: p }, i) => {
                  const websiteHref = firmWebsiteUrl(f.website);
                  const displayPrice = applyDiscount ? p.price : p.priceWas;
                  const promoCode = p.promoCode || f.promoCode;
                  return (
                    <div
                      key={p.id}
                      className="cmp-board__row cmp-row"
                      role="row"
                      style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
                    >
                      <div className="cmp-pin cmp-pin--firm" role="cell">
                        <div className="cmp-firm">
                          <div className="cmp-firm__logo-wrap">
                            <div className="cmp-firm__logo">
                              <Image src={f.logo} alt={`${f.name} logo`} width={52} height={52} />
                            </div>
                            <VerifiedBadge />
                          </div>
                          <div className="cmp-firm__meta">
                            <span className="cmp-firm__name">{f.name}</span>
                            {p.planType ? (
                              <span className="cmp-firm__plan-type">{p.planType}</span>
                            ) : null}
                            <div
                              className="cmp-firm__rating-pill"
                              aria-label={
                                f.reviews < 10
                                  ? 'Less than 10 reviews'
                                  : `Rated ${f.rating} from ${f.reviews} reviews`
                              }
                            >
                              {f.reviews < 10 ? (
                                <span className="cmp-firm__reviews">Less than 10 reviews</span>
                              ) : (
                                <>
                                  <span className="cmp-firm__rating">{f.rating.toFixed(1)}</span>
                                  <RatingStars rating={f.rating} idPrefix={`r-${p.id}`} />
                                  <span className="cmp-firm__rating-sep" aria-hidden />
                                  <span className="cmp-firm__reviews">[{f.reviews}]</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`cmp-fav${favorites.has(f.name) ? ' cmp-fav--on' : ''}`}
                            onClick={() => toggleFavorite(f.name)}
                            aria-label={
                              favorites.has(f.name)
                                ? `Remove ${f.name} from bookmarks`
                                : `Bookmark ${f.name}`
                            }
                            disabled={!favorites.has(f.name) && favorites.size >= MAX_FAVORITES}
                          >
                            <Bookmark
                              size={16}
                              strokeWidth={1.85}
                              absoluteStrokeWidth
                              fill={favorites.has(f.name) ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="cmp-mid" onScroll={onMidScroll} role="presentation">
                        <div className="cmp-mid__track">
                          {visibleMidCols.map(col => renderMidCell(col, p))}
                        </div>
                      </div>

                      <div className="cmp-pin cmp-pin--price" role="cell">
                        <div className="cmp-price">
                          <div className="cmp-price__meta">
                            {applyDiscount && p.priceWas > p.price && (
                              <span className="cmp-price__was">{formatMoney(p.priceWas)}</span>
                            )}
                            <span className="cmp-price__now">{formatMoney(displayPrice)}</span>
                            <span className="cmp-price__type">{p.priceType.toLowerCase()}</span>
                            {applyDiscount && promoCode && (
                              <button
                                type="button"
                                className="cmp-price__code"
                                onClick={() => copyCode(promoCode)}
                              >
                                {promoCode}
                                {copied === promoCode ? ' ✓' : ''}
                              </button>
                            )}
                          </div>
                          {websiteHref ? (
                            <a
                              href={websiteHref}
                              className="cmp-buy"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Buy
                            </a>
                          ) : (
                            <span className="cmp-buy cmp-buy--muted">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filtered.length > 0 && (
              <nav className="cmp-pager" aria-label="Table pagination">
                <div className="cmp-pager__group">
                  <button
                    type="button"
                    className="cmp-pager__btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  {pageItems.map((item, idx) =>
                    item === '…' ? (
                      <span key={`e-${idx}`} className="cmp-pager__ellipsis" aria-hidden>
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`cmp-pager__page${page === item ? ' cmp-pager__page--active' : ''}`}
                        onClick={() => setPage(item)}
                        aria-label={`Page ${item}`}
                        aria-current={page === item ? 'page' : undefined}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="cmp-pager__btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
                <span className="cmp-pager__meta" aria-live="polite">
                  {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
