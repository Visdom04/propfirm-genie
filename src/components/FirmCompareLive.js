'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import './FirmCompareDemoGreen.css';

const PAGE_SIZE = 10;

const MID_COLS = [
  { key: 'step', label: 'Steps', min: 110 },
  { key: 'profit_target', label: 'Profit target', min: 130 },
  { key: 'max_daily_loss', label: 'Max daily loss', min: 140 },
  { key: 'max_total_drawdown', label: 'Max total drawdown', min: 170 },
  { key: 'activation_fee', label: 'Activation fee', min: 130 },
  { key: 'profit_split', label: 'Profit split', min: 130 },
  { key: 'payout_frequency', label: 'Payout freq.', min: 200 },
];

function extractNum(v) {
  if (v == null) return NaN;
  const m = String(v).match(/[\d.]+/);
  return m ? parseFloat(m[0]) : NaN;
}

function SortArrows({ active, direction }) {
  const upStrong = active && direction === 'asc';
  const downStrong = active && direction === 'desc';
  return (
    <span className="cmp-th__sort" aria-hidden>
      <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
        <path d="M3.5 0L6.5 4H0.5L3.5 0Z" fill="currentColor" opacity={upStrong ? 1 : 0.3} />
        <path d="M3.5 10L0.5 6H6.5L3.5 10Z" fill="currentColor" opacity={downStrong ? 1 : 0.3} />
      </svg>
    </span>
  );
}

function SortHead({ label, sortKey, sort, onSort, className = '', style }) {
  return (
    <div
      role="columnheader"
      className={`cmp-th ${className}`.trim()}
      style={style}
      aria-sort={sort.key === sortKey ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <button type="button" className="cmp-th__btn" onClick={() => onSort(sortKey)}>
        {label}
        <SortArrows active={sort.key === sortKey} direction={sort.dir} />
      </button>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="cmp-firm__verified" title="Verified firm" aria-label="Verified">
      <Star size={9} strokeWidth={0} fill="#fff" aria-hidden />
    </span>
  );
}

const STAR_PATH =
  'M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27 6.2 20.37l1.11-6.47-4.7-4.58 6.49-.94L12 2.5z';

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
                    <clipPath id={`half-live-${n}`}>
                      <rect x="0" y="0" width="12" height="24" />
                    </clipPath>
                  </defs>
                  <path d={STAR_PATH} className="cmp-stars__fill" clipPath={`url(#half-live-${n})`} />
                </>
              )}
            </svg>
          </span>
        );
      })}
    </span>
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
      aria-controls="cmp-live-mid-scroller"
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

export default function FirmCompareLive({ rows }) {
  const [facet, setFacet] = useState({ assets: [], steps: [], country: null });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'propfirmmap_score', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(null);
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

  const uniqueAssets = useMemo(
    () => [...new Set(rows.map(r => r.asset_type).filter(Boolean))].sort(),
    [rows]
  );
  const uniqueSteps = useMemo(
    () => [...new Set(rows.map(r => r.step).filter(Boolean))].sort(),
    [rows]
  );
  const uniqueCountries = useMemo(
    () => [...new Set(rows.map(r => r.country).filter(Boolean))].sort(),
    [rows]
  );

  const toggleFacet = useCallback((key, value) => {
    setFacet(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }));
  }, []);

  const cycleSort = useCallback(key => {
    setSort(prev => (prev.key !== key ? { key, dir: 'desc' } : { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }));
  }, []);

  const copyCode = async code => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(r => r.name.toLowerCase().includes(q));
    if (facet.assets.length) list = list.filter(r => facet.assets.includes(r.asset_type));
    if (facet.steps.length) list = list.filter(r => facet.steps.includes(r.step));
    if (facet.country) list = list.filter(r => r.country === facet.country);

    const mul = sort.dir === 'desc' ? -1 : 1;
    const numericCols = new Set([
      'propfirmmap_score',
      'actual_price',
      'profit_target',
      'max_daily_loss',
      'max_total_drawdown',
      'activation_fee',
      'profit_split',
    ]);

    list.sort((a, b) => {
      if (numericCols.has(sort.key)) {
        const av = sort.key === 'propfirmmap_score' ? a[sort.key] : extractNum(a[sort.key]);
        const bv = sort.key === 'propfirmmap_score' ? b[sort.key] : extractNum(b[sort.key]);
        const aNaN = Number.isNaN(av);
        const bNaN = Number.isNaN(bv);
        if (aNaN && bNaN) return 0;
        if (aNaN) return 1;
        if (bNaN) return -1;
        return (av - bv) * mul;
      }
      return String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? '')) * mul;
    });
    return list;
  }, [rows, facet, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => setPage(1), [facet, search, sort]);
  useEffect(() => setPage(p => Math.min(p, totalPages)), [totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    midPanesRef.current = midPanesRef.current.slice(0, pageRows.length + 1);
  }, [pageRows.length]);

  return (
    <div className="cmp">
      <div className="cmp-layout">
        <div className="cmp-main">
          <div className="cmp-toolbar" role="toolbar" aria-label="Table filters">
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
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="cmp-search__input"
                placeholder="Search firm name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search firm name"
              />
              {search && (
                <button
                  type="button"
                  className="cmp-search__clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
            <span className="cmp-toolbar__sep" aria-hidden />
            {uniqueAssets.map(asset => (
              <button
                key={asset}
                type="button"
                className={`cmp-chip ${facet.assets.includes(asset) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggleFacet('assets', asset)}
              >
                {asset}
              </button>
            ))}
            <span className="cmp-toolbar__sep" aria-hidden />
            {uniqueSteps.map(step => (
              <button
                key={step}
                type="button"
                className={`cmp-chip ${facet.steps.includes(step) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggleFacet('steps', step)}
              >
                {step}
              </button>
            ))}
            <span className="cmp-toolbar__sep" aria-hidden />
            <select
              className="cmp-chip"
              value={facet.country ?? ''}
              onChange={e => setFacet(f => ({ ...f, country: e.target.value || null }))}
              aria-label="Filter by country"
            >
              <option value="">All countries</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="cmp-table-stage">
            <div className="cmp-table-headrow">
              <h3 className="cmp-table-heading">
                Live challenges <span className="cmp-table-heading__count">{filtered.length}</span>
              </h3>
              <TableScrollSlider getMidPanes={getMidPanes} masterRef={masterMidRef} />
            </div>

            <div
              className="cmp-board"
              role="table"
              aria-label="Compare prop firm challenges: steps, targets, drawdown, splits, price"
            >
              <div className="cmp-board__row cmp-board__row--head" role="row">
                <div className="cmp-pin cmp-pin--firm" role="columnheader">
                  <SortHead label="Firm / Rank" sortKey="propfirmmap_score" sort={sort} onSort={cycleSort} className="cmp-th--firm" />
                </div>
                <div
                  className="cmp-mid"
                  id="cmp-live-mid-scroller"
                  ref={setMidPaneRef(0)}
                  onScroll={onMidScroll}
                  role="presentation"
                >
                  <div className="cmp-mid__track">
                    {MID_COLS.map(col => (
                      <SortHead
                        key={col.key}
                        label={col.label}
                        sortKey={col.key}
                        sort={sort}
                        onSort={cycleSort}
                        className="cmp-mid__cell"
                        style={{ flex: `0 0 ${col.min}px`, minWidth: col.min }}
                      />
                    ))}
                  </div>
                </div>
                <div className="cmp-pin cmp-pin--price" role="columnheader">
                  <SortHead label="Price" sortKey="actual_price" sort={sort} onSort={cycleSort} className="cmp-th--price" />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="cmp-board__empty" role="row">
                  <div className="cmp-empty" role="cell">
                    No challenges match these filters.
                  </div>
                </div>
              ) : (
                pageRows.map((r, i) => (
                  <div
                    key={r.rowId}
                    className="cmp-board__row cmp-row"
                    role="row"
                    style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
                  >
                    <div className="cmp-pin cmp-pin--firm" role="cell">
                      <div className="cmp-firm">
                        <div className="cmp-firm__logo-wrap">
                          <div className="cmp-firm__logo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.logo_url} alt={`${r.name} logo`} width={52} height={52} />
                          </div>
                          <VerifiedBadge />
                        </div>
                        <div className="cmp-firm__meta">
                          <span className="cmp-firm__name">{r.name}</span>
                          <div
                            className="cmp-firm__rating-pill"
                            aria-label={`Rated ${r.trustpilot?.rating} from ${r.trustpilot?.review_count} reviews`}
                          >
                            <span className="cmp-firm__rating">{r.trustpilot?.rating ?? '—'}</span>
                            <RatingStars rating={r.trustpilot?.rating} />
                            <span className="cmp-firm__rating-sep" aria-hidden />
                            <span className="cmp-firm__reviews">{r.trustpilot?.review_count ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="cmp-mid"
                      ref={setMidPaneRef(i + 1)}
                      onScroll={onMidScroll}
                      role="presentation"
                    >
                      <div className="cmp-mid__track">
                        <div className="cmp-td cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[0].min}px`, minWidth: MID_COLS[0].min }}>
                          {r.step ?? '—'}
                        </div>
                        <div className="cmp-td cmp-td--num cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[1].min}px`, minWidth: MID_COLS[1].min }}>
                          {r.profit_target ?? '—'}
                        </div>
                        <div className="cmp-td cmp-td--num cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[2].min}px`, minWidth: MID_COLS[2].min }}>
                          {r.max_daily_loss ?? '—'}
                        </div>
                        <div className="cmp-td cmp-td--wrap cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[3].min}px`, minWidth: MID_COLS[3].min }}>
                          {r.max_total_drawdown ?? '—'}
                        </div>
                        <div className="cmp-td cmp-td--muted cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[4].min}px`, minWidth: MID_COLS[4].min }}>
                          {r.activation_fee ? `$${r.activation_fee}` : '—'}
                        </div>
                        <div className="cmp-td cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[5].min}px`, minWidth: MID_COLS[5].min }}>
                          {r.profit_split ?? '—'}
                        </div>
                        <div className="cmp-td cmp-td--wrap cmp-mid__cell" style={{ flex: `0 0 ${MID_COLS[6].min}px`, minWidth: MID_COLS[6].min }}>
                          {r.payout_frequency ?? '—'}
                        </div>
                      </div>
                    </div>

                    <div className="cmp-pin cmp-pin--price" role="cell">
                      <div className="cmp-price">
                        <div className="cmp-price__meta">
                          <span className="cmp-price__now">
                            {r.actual_price != null ? `$${r.actual_price}` : '—'}
                          </span>
                          {r.before_price != null && (
                            <span className="cmp-price__was">${r.before_price}</span>
                          )}
                          {r.promo_code && (
                            <button
                              type="button"
                              className="cmp-price__code"
                              onClick={() => copyCode(r.promo_code)}
                            >
                              {r.promo_code}
                              {copied === r.promo_code ? ' ✓' : ''}
                            </button>
                          )}
                        </div>
                        <a
                          href={`https://propfirmmap.com/firms/${r.slug}`}
                          className="cmp-buy"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filtered.length > 0 && (
              <nav className="cmp-pager" aria-label="Table pagination">
                <button
                  type="button"
                  className="cmp-pager__btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>

                <div className="cmp-pager__pages" role="list">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      type="button"
                      role="listitem"
                      className={`cmp-pager__page${page === n ? ' cmp-pager__page--active' : ''}`}
                      onClick={() => setPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={page === n ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <span className="cmp-pager__meta" aria-live="polite">
                  {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>

                <button
                  type="button"
                  className="cmp-pager__btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
