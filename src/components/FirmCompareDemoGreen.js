'use client';

import Image from 'next/image';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Bookmark, Star } from 'lucide-react';
import {
  firms,
  ACCOUNT_SIZE_OPTIONS,
  STEP_OPTIONS,
  PRICE_OPTIONS,
} from '@/data/firms';
import './FirmCompareDemoGreen.css';

const MAX_FAVORITES = 5;

/** Mid-column track widths — keep header + body cells in lockstep */
const MID_COLS = [
  { key: 'accountSize', label: 'Account size', sort: true, min: 120 },
  { key: 'steps', label: 'Steps', sort: true, min: 100 },
  { key: 'activationFee', label: 'Activation fee', sort: false, min: 130 },
  { key: 'maxLots', label: 'Max contract size', sub: 'Minis / Micros', sort: false, min: 140 },
  { key: 'profitTarget', label: 'Profit target', sort: true, min: 120 },
  { key: 'maxLoss', label: 'Max loss', sort: true, min: 110 },
  { key: 'maxLossType', label: 'Max loss type', sort: true, min: 140 },
  { key: 'ptDd', label: 'PT:DD', sort: true, min: 90 },
  { key: 'profitSplit', label: 'Profit split', sort: true, min: 130 },
  { key: 'maxPayout', label: 'Max payout amount', sort: true, min: 160 },
  { key: 'minPayout', label: 'Min payout threshold', sort: true, min: 160 },
  { key: 'consistency', label: 'Consistency rule', sub: 'Eval / Funded', sort: false, min: 180 },
  { key: 'payoutFreq', label: 'Payout freq.', sort: true, min: 140 },
];

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
function RatingStars({ rating }) {
  const rounded = Math.round(Math.min(5, Math.max(0, Number(rating) || 0)) * 2) / 2;
  return (
    <span className="cmp-stars" aria-hidden>
      {[1, 2, 3, 4, 5].map(n => {
        const state = rounded >= n ? 'full' : rounded >= n - 0.5 ? 'half' : 'empty';
        return (
          <span key={n} className={`cmp-stars__s cmp-stars__s--${state}`}>
            <svg viewBox="0 0 24 24" width="11" height="11">
              <path d={STAR_PATH} className="cmp-stars__track" />
              {state === 'full' && <path d={STAR_PATH} className="cmp-stars__fill" />}
              {state === 'half' && (
                <>
                  <defs>
                    <clipPath id={`half-${n}`}>
                      <rect x="0" y="0" width="12" height="24" />
                    </clipPath>
                  </defs>
                  <path d={STAR_PATH} className="cmp-stars__fill" clipPath={`url(#half-${n})`} />
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
  const fill = Math.min(100, Math.max(0, pct));
  return (
    <div className="cmp-split">
      <span className="cmp-split__val">{pct}%</span>
      <div className="cmp-split__bar" role="presentation" aria-hidden>
        <span className="cmp-split__fill" style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
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
      className={`cmp-th ${className}`.trim()}
      style={style}
      aria-sort={
        sort.key === sortKey ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'
      }
    >
      <button type="button" className="cmp-th__btn" onClick={() => onSort(sortKey)}>
        {label}
        <SortArrows active={sort.key === sortKey} direction={sort.dir} />
      </button>
      {sub ? <span className="cmp-th__sub">{sub}</span> : null}
    </div>
  );
}

function StaticHead({ label, sub, className = '', style }) {
  return (
    <div role="columnheader" className={`cmp-th ${className}`.trim()} style={style}>
      {label}
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
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sort, setSort] = useState({ key: 'accountSize', dir: 'desc' });
  const [copied, setCopied] = useState(null);
  const toolbarRef = useRef(null);
  const midPanesRef = useRef([]);
  const masterMidRef = useRef(null);
  const syncingScroll = useRef(false);

  const getMidPanes = useCallback(() => midPanesRef.current.filter(Boolean), []);

  const setMidPaneRef = useCallback(
    index => el => {
      midPanesRef.current[index] = el;
      if (index === 0) masterMidRef.current = el;
    },
    []
  );

  const onMidScroll = useCallback(e => {
    if (syncingScroll.current) return;
    syncingScroll.current = true;
    const left = e.currentTarget.scrollLeft;
    midPanesRef.current.forEach(pane => {
      if (pane && pane !== e.currentTarget) pane.scrollLeft = left;
    });
    syncingScroll.current = false;
  }, []);

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
    if (!openDropdown) return undefined;
    const onPointer = e => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [openDropdown]);

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
    setOpenDropdown(null);
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
    rows = [...rows].sort((a, b) => {
      const key = sort.key;
      const av = a.plan[key] ?? a.firm[key];
      const bv = b.plan[key] ?? b.firm[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
      return String(av ?? '').localeCompare(String(bv ?? '')) * mul;
    });

    return rows;
  }, [topMode, favorites, facet, sort]);

  useEffect(() => {
    midPanesRef.current = midPanesRef.current.slice(0, filtered.length + 1);
  }, [filtered.length]);

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
                  ref={setMidPaneRef(0)}
                  onScroll={onMidScroll}
                  role="presentation"
                >
                  <div className="cmp-mid__track">
                    {MID_COLS.map(col =>
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
                filtered.map(({ firm: f, plan: p }, i) => {
                  const websiteHref = firmWebsiteUrl(f.website);
                  const displayPrice = applyDiscount ? p.price : p.priceWas;
                  const midIndex = i + 1;
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
                            <div
                              className="cmp-firm__rating-pill"
                              aria-label={`Rated ${f.rating} from ${f.reviews} reviews`}
                            >
                              <span className="cmp-firm__rating">{f.rating.toFixed(1)}</span>
                              <RatingStars rating={f.rating} />
                              <span className="cmp-firm__rating-sep" aria-hidden />
                              <span className="cmp-firm__reviews">{f.reviews}</span>
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

                      <div
                        className="cmp-mid"
                        ref={setMidPaneRef(midIndex)}
                        onScroll={onMidScroll}
                        role="presentation"
                      >
                        <div className="cmp-mid__track">
                          <div
                            className="cmp-td cmp-td--num cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[0].min}px`, minWidth: MID_COLS[0].min }}
                          >
                            {p.accountSize.replace('$', '')}
                          </div>
                          <div
                            className="cmp-td cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[1].min}px`, minWidth: MID_COLS[1].min }}
                          >
                            <span className="cmp-cell-with-info">
                              {p.steps}
                              <span className="cmp-info" title="Evaluation steps">
                                <ToolbarIcon name="info" />
                              </span>
                            </span>
                          </div>
                          <div
                            className="cmp-td cmp-td--muted cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[2].min}px`, minWidth: MID_COLS[2].min }}
                          >
                            {p.activationFee}
                          </div>
                          <div
                            className="cmp-td cmp-td--num cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[3].min}px`, minWidth: MID_COLS[3].min }}
                          >
                            {String(p.maxLots).includes('|') ? (
                              <>
                                {p.maxLots.split('|')[0].trim()}{' '}
                                <span className="cmp-pipe">|</span>{' '}
                                {p.maxLots.split('|')[1].trim()}
                              </>
                            ) : (
                              p.maxLots
                            )}
                          </div>
                          <div
                            className="cmp-td cmp-td--num cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[4].min}px`, minWidth: MID_COLS[4].min }}
                          >
                            {p.profitTarget}
                          </div>
                          <div
                            className="cmp-td cmp-td--num cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[5].min}px`, minWidth: MID_COLS[5].min }}
                          >
                            {p.maxLoss}
                          </div>
                          <div
                            className="cmp-td cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[6].min}px`, minWidth: MID_COLS[6].min }}
                          >
                            {p.maxLossType}
                          </div>
                          <div
                            className="cmp-td cmp-td--num cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[7].min}px`, minWidth: MID_COLS[7].min }}
                          >
                            {p.ptDd}
                          </div>
                          <div
                            className="cmp-td cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[8].min}px`, minWidth: MID_COLS[8].min }}
                          >
                            <ProfitSplitBar pct={p.profitSplit} />
                          </div>
                          <div
                            className="cmp-td cmp-td--wrap cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[9].min}px`, minWidth: MID_COLS[9].min }}
                          >
                            <span className="cmp-cell-with-info">
                              {p.maxPayout}
                              <span className="cmp-info" title="Maximum payout amount">
                                <ToolbarIcon name="info" />
                              </span>
                            </span>
                          </div>
                          <div
                            className="cmp-td cmp-td--wrap cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[10].min}px`, minWidth: MID_COLS[10].min }}
                          >
                            <span className="cmp-cell-with-info">
                              {p.minPayout}
                              <span className="cmp-info" title="Minimum payout threshold">
                                <ToolbarIcon name="info" />
                              </span>
                            </span>
                          </div>
                          <div
                            className="cmp-td cmp-td--num cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[11].min}px`, minWidth: MID_COLS[11].min }}
                          >
                            {p.consistencyEval} <span className="cmp-pipe">|</span>{' '}
                            {p.consistencyFunded}
                          </div>
                          <div
                            className="cmp-td cmp-td--wrap cmp-mid__cell"
                            style={{ flex: `0 0 ${MID_COLS[12].min}px`, minWidth: MID_COLS[12].min }}
                          >
                            {p.payoutFreq}
                          </div>
                        </div>
                      </div>

                      <div className="cmp-pin cmp-pin--price" role="cell">
                        <div className="cmp-price">
                          <div className="cmp-price__meta">
                            <span className="cmp-price__now">{formatMoney(displayPrice)}</span>
                            {applyDiscount && p.priceWas > p.price && (
                              <span className="cmp-price__was">{formatMoney(p.priceWas)}</span>
                            )}
                            <span className="cmp-price__type">{p.priceType.toLowerCase()}</span>
                            {applyDiscount && (
                              <button
                                type="button"
                                className="cmp-price__code"
                                onClick={() => copyCode(f.promoCode)}
                              >
                                {f.promoCode}
                                {copied === f.promoCode ? ' ✓' : ''}
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
          </div>
        </div>
      </div>
    </div>
  );
}
