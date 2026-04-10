'use client';

import Image from 'next/image';
import { useMemo, useState, useCallback } from 'react';
import { firms } from '@/data/firms';
import './FirmCompareDemo.css';

const MAX_FAVORITES = 5;
const YEARS_RING_MAX = 12;

function flagEmoji(code) {
  if (!code || code.length !== 2) return '';
  const A = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map(c => A + (c.charCodeAt(0) - 65))
  );
}

function platformAbbrev(p) {
  if (p === 'cTrader') return 'cT';
  if (p.includes('Ninja')) return 'NT';
  return p.replace(/\s/g, '');
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
          className={upStrong ? 'cmp-th__sort-path--on' : ''}
        />
        <path
          d="M3.5 10L0.5 6H6.5L3.5 10Z"
          fill="currentColor"
          opacity={downStrong ? 1 : 0.3}
          className={downStrong ? 'cmp-th__sort-path--on' : ''}
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

function YearsRing({ years, label, ringId }) {
  const cx = 28;
  const cy = 28;
  const r = 19;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(years / YEARS_RING_MAX, 0), 1);
  const offset = c * (1 - pct);
  const gradId = `cmp-yr-${ringId}`;

  return (
    <div className="cmp-years" role="img" aria-label={`${label} years in operation`}>
      <svg className="cmp-years__svg" width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <span className="cmp-years__label">{label}</span>
    </div>
  );
}

function RatingStars({ rating }) {
  return (
    <span className="cmp-stars">
      {[1, 2, 3, 4, 5].map(i => {
        let cls = 'cmp-stars__s';
        if (i <= Math.floor(rating)) cls += ' cmp-stars__s--on';
        else if (rating >= i - 0.5 && rating < i) cls += ' cmp-stars__s--half';
        return (
          <span key={i} className={cls}>
            ★
          </span>
        );
      })}
    </span>
  );
}

const TOP_FILTERS = [
  { id: 'filter', label: 'Filter', icon: 'filter' },
  { id: 'popular', label: 'Popular', icon: 'flame' },
  { id: 'favorites', label: 'Favorite', icon: 'heart', count: true },
  { id: 'new', label: 'New', icon: 'ribbon' },
  { id: 'all', label: 'All', icon: null },
];

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
    case 'flame':
      return (
        <svg {...s}>
          <path
            d="M12 3c2 4 4 5 4 9a4 4 0 11-8 0c0-2 1-4 2-5 .5 2 1.5 3.5 2 5z"
            stroke={stroke}
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg {...s}>
          <path
            d="M12 21s-7-4.35-7-10a4.5 4.5 0 019-1 4.5 4.5 0 019 1c0 5.65-7 10-7 10z"
            stroke={stroke}
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ribbon':
      return (
        <svg {...s}>
          <path
            d="M12 3l2 4 4 .5-3 3 1 4.5L12 13l-4 2 1-4.5-3-3L10 7l2-4z"
            stroke={stroke}
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function FirmCompareDemo() {
  const [topMode, setTopMode] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const [facet, setFacet] = useState({
    asset: null,
    country: null,
    platform: null,
    programType: null,
  });
  const [sort, setSort] = useState({ key: 'rating', dir: 'desc' });
  const [copied, setCopied] = useState(null);

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

  const toggleFavorite = useCallback(name => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (next.size < MAX_FAVORITES) next.add(name);
      return next;
    });
  }, []);

  const resetFacets = useCallback(() => {
    setFacet({ asset: null, country: null, platform: null, programType: null });
  }, []);

  const cycleSort = useCallback(key => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'desc' };
      return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' };
    });
  }, []);

  const filtered = useMemo(() => {
    let list = firms.filter(Boolean);
    if (topMode === 'popular') list = list.filter(f => f.isPopular);
    else if (topMode === 'new') list = list.filter(f => f.isNew);
    else if (topMode === 'favorites') list = list.filter(f => favorites.has(f.name));

    if (facet.asset) list = list.filter(f => f.assets.includes(facet.asset));
    if (facet.country) list = list.filter(f => f.countryCode === facet.country);
    if (facet.platform) list = list.filter(f => f.platforms.includes(facet.platform));
    if (facet.programType) list = list.filter(f => f.type === facet.programType);

    const mul = sort.dir === 'desc' ? -1 : 1;
    list = [...list].sort((a, b) => {
      if (sort.key === 'rating') return (a.rating - b.rating) * mul;
      if (sort.key === 'allocPct') return (a.allocPct - b.allocPct) * mul;
      return a.name.localeCompare(b.name) * (sort.dir === 'desc' ? -1 : 1);
    });
    return list;
  }, [topMode, favorites, facet, sort]);

  const handleTopPill = id => {
    if (id === 'filter') {
      setSidebarOpen(v => !v);
      return;
    }
    setTopMode(id);
    if (id !== 'filter') setSidebarOpen(false);
  };

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
            <span className="cmp-sidebar__title">Filters</span>
            <button
              type="button"
              className="cmp-sidebar__close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close filter panel"
            >
              ×
            </button>
          </div>

          <details className="cmp-acc" open>
            <summary className="cmp-acc__summary">Instruments</summary>
            <div className="cmp-acc__body">
              {uniqueAssets.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`cmp-chip ${facet.asset === a ? 'cmp-chip--on' : ''}`}
                  onClick={() => setFacet(p => ({ ...p, asset: p.asset === a ? null : a }))}
                >
                  {a}
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
          <div className="cmp-toolbar" role="toolbar" aria-label="Table filters">
            {TOP_FILTERS.map(({ id, label, icon, count }) => {
              const isFilter = id === 'filter';
              const active = isFilter ? sidebarOpen : topMode === id;
              const labelText =
                count && id === 'favorites' ? `${label} ${favCount}/${MAX_FAVORITES}` : label;
              return (
                <button
                  key={id}
                  type="button"
                  className={`cmp-pill${active ? ' cmp-pill--active' : ''}${isFilter && sidebarOpen ? ' cmp-pill--filter-open' : ''}`}
                  onClick={() => handleTopPill(id)}
                  aria-pressed={active}
                  aria-expanded={isFilter ? sidebarOpen : undefined}
                  aria-controls={isFilter ? 'cmp-filters' : undefined}
                >
                  {icon && <ToolbarIcon name={icon} />}
                  {labelText}
                </button>
              );
            })}
          </div>

          <div className="cmp-table-stage">
            <div className="cmp-table-scroller">
              <table className="cmp-table">
                <caption className="cmp-table__caption">
                  Compare prop firms: rating, region, scale, platforms, and promos
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="cmp-th cmp-th--firm">
                      Firm
                    </th>
                    <th
                      scope="col"
                      className="cmp-th"
                      aria-sort={
                        sort.key === 'rating'
                          ? sort.dir === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        className="cmp-th__btn"
                        onClick={() => cycleSort('rating')}
                        aria-label={`Sort by rating, ${sort.key === 'rating' ? (sort.dir === 'desc' ? 'highest first' : 'lowest first') : 'highest first'}`}
                      >
                        Rating
                        <SortArrows active={sort.key === 'rating'} direction={sort.dir} />
                      </button>
                    </th>
                    <th scope="col" className="cmp-th">
                      Country
                    </th>
                    <th scope="col" className="cmp-th">
                      Years in operation
                    </th>
                    <th scope="col" className="cmp-th">
                      Assets
                    </th>
                    <th scope="col" className="cmp-th">
                      Platforms
                    </th>
                    <th
                      scope="col"
                      className="cmp-th"
                      aria-sort={
                        sort.key === 'allocPct'
                          ? sort.dir === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        className="cmp-th__btn"
                        onClick={() => cycleSort('allocPct')}
                        aria-label={`Sort by allocation scale, ${sort.key === 'allocPct' ? (sort.dir === 'desc' ? 'largest first' : 'smallest first') : 'largest first'}`}
                      >
                        Max allocation
                        <SortArrows active={sort.key === 'allocPct'} direction={sort.dir} />
                      </button>
                    </th>
                    <th scope="col" className="cmp-th">
                      Promo
                    </th>
                    <th scope="col" className="cmp-th">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="cmp-empty">
                      No firms match these filters. Try <button type="button" className="cmp-empty__link" onClick={() => { resetFacets(); setTopMode('all'); }}>resetting</button> or switching to <strong>All</strong>.
                    </td>
                  </tr>
                ) : (
                  filtered.map((f, i) => {
                    const websiteHref = firmWebsiteUrl(f.website);
                    return (
                    <tr
                      key={f.name}
                      className="cmp-row"
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <td className="cmp-td cmp-td--firm">
                        <div className="cmp-firm">
                          <div className="cmp-firm__logo">
                            <Image src={f.logo} alt={`${f.name} logo`} width={52} height={52} />
                          </div>
                          <div className="cmp-firm__meta">
                            <div className="cmp-firm__title-row">
                              <span className="cmp-firm__name">{f.name}</span>
                              <button
                                type="button"
                                className={`cmp-fav${favorites.has(f.name) ? ' cmp-fav--on' : ''}`}
                                onClick={() => toggleFavorite(f.name)}
                                aria-label={
                                  favorites.has(f.name)
                                    ? `Remove ${f.name} from favorites`
                                    : `Add ${f.name} to favorites`
                                }
                                disabled={!favorites.has(f.name) && favorites.size >= MAX_FAVORITES}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <path
                                    d="M12 21s-7-4.35-7-10a4.5 4.5 0 019-1 4.5 4.5 0 019 1c0 5.65-7 10-7 10z"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    fill={favorites.has(f.name) ? 'currentColor' : 'none'}
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="cmp-firm__likes">
                              <span className="cmp-firm__heart" aria-hidden>
                                ♥
                              </span>
                              <span>{f.likes.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="cmp-td cmp-td--rank">
                        <div className="cmp-rank">
                          <div className="cmp-rank__badge" aria-hidden>
                            {f.rating}
                          </div>
                          <RatingStars rating={f.rating} />
                          <span className="cmp-rank__reviews">{f.reviews.toLocaleString()} reviews</span>
                        </div>
                      </td>
                      <td className="cmp-td cmp-td--country">
                        <span className="cmp-flag" title={f.countryCode}>
                          {flagEmoji(f.countryCode)}
                        </span>
                        <span className="cmp-cc">{f.countryCode}</span>
                      </td>
                      <td className="cmp-td cmp-td--years">
                        <YearsRing years={f.years} label={f.yearsLabel} ringId={`y${i}`} />
                      </td>
                      <td className="cmp-td cmp-td--assets">
                        <div className="cmp-assets">
                          {f.assets.map(a => (
                            <span key={a} className="cmp-asset-tag">
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="cmp-td cmp-td--platforms">
                        <div className="cmp-platforms">
                          {f.platforms.map(p => (
                            <div key={p} className="cmp-platform-orb" title={p}>
                              {platformAbbrev(p)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="cmp-td cmp-td--alloc">
                        <span className="cmp-alloc__val">{f.maxAlloc}</span>
                        <div className="cmp-alloc__bar" role="presentation">
                          <span className="cmp-alloc__fill" style={{ width: `${f.allocPct * 100}%` }} />
                        </div>
                      </td>
                      <td className="cmp-td cmp-td--promo">
                        <button
                          type="button"
                          className="cmp-promo-btn"
                          onClick={() => copyCode(f.promoCode)}
                        >
                          <span className="cmp-promo-btn__discount">{f.discount}</span>
                          <span className="cmp-promo-btn__brand">
                            {f.promoCode}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path
                                d="M4 7h4l2 3h8v8H4V7z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                              <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </span>
                        </button>
                        {copied === f.promoCode && (
                          <span className="cmp-copied" role="status">
                            Copied
                          </span>
                        )}
                      </td>
                      <td className="cmp-td cmp-td--actions">
                        {websiteHref ? (
                          <a
                            href={websiteHref}
                            className="cmp-firm-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visit site
                          </a>
                        ) : (
                          <span className="cmp-firm-link cmp-firm-link--muted">—</span>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
