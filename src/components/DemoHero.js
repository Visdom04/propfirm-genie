'use client';
import { useState, useMemo, useEffect, useRef, useId, Fragment } from 'react';
import Image from 'next/image';
import anime from 'animejs';
import FirmCompareDemo from '@/components/FirmCompareDemo';
import WhyChooseUs from '@/components/WhyChooseUs';
import HowRewardsWorks from '@/components/HowRewardsWorks';
import Testimonials from '@/components/Testimonials';
import CreatorVideos from '@/components/CreatorVideos';
import DemoFAQ from '@/components/DemoFAQ';
import DemoFooter from '@/components/DemoFooter';
import { firms } from '@/data/firms';
import './DemoHero.css';

const MEGA_FEATURE_LINKS = [
  { href: '#', label: 'All Firms', icon: 'building' },
  { href: '#', label: 'Payouts', icon: 'clock' },
  { href: '#', label: 'Reviews', icon: 'chat' },
  { href: '#', label: 'Best Sellers', icon: 'flame' },
  { href: '#', label: 'Prop Firm Rules', icon: 'megaphone' },
  { href: '#', label: 'Challenges', icon: 'target' },
  { href: '#', label: 'Trader Leaderboard', icon: 'trophy' },
  { href: '#', label: 'Offers', icon: 'ribbon' },
  { href: '#', label: 'Favorite Firms', icon: 'star' },
];

const MEGA_RESOURCE_LINKS = [
  'Blog',
  'Help Center',
  'Prop Firm Lists',
  'Demo Accounts',
  'How It Works',
  'High Impact News',
  'Announcements',
  'Press',
  'Resources',
  'Brokers',
];

const MEGA_PROGRAM_LINKS = ['Loyalty Program', 'Affiliate Program'];
const MEGA_CONTACT_LINKS = ['Contact', 'About Us', 'Careers'];

const MEGA_SOCIAL = [
  { href: '#', label: 'X', icon: 'x' },
  { href: '#', label: 'Instagram', icon: 'instagram' },
  { href: '#', label: 'YouTube', icon: 'youtube' },
  { href: '#', label: 'TikTok', icon: 'tiktok' },
];

function MegaFeatureIcon({ name }) {
  const stroke = 'url(#demoMegaIconGrad)';
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
  switch (name) {
    case 'building':
      return (
        <svg {...common}>
          <path d="M4 21V8l8-4 8 4v13M9 21v-6h6v6" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.65" />
          <path d="M12 7v5l3 2" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 01-8 8H8l-5 3v-3a8 8 0 018-8h10z" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...common}>
          <path d="M12 3c2 4 4 5 4 9a4 4 0 11-8 0c0-2 1-4 2-5 .5 2 1.5 3.5 2 5z" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'megaphone':
      return (
        <svg {...common}>
          <path d="M3 11v2l4 2V9L3 11zm4 2l8 3V6l-8 3M13 9v6" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.65" />
          <circle cx="12" cy="12" r="5" stroke={stroke} strokeWidth="1.65" />
          <circle cx="12" cy="12" r="1.5" fill="url(#demoMegaIconGrad)" stroke="none" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 4H5a2 2 0 002 2M17 4h2a2 2 0 01-2 2" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'ribbon':
      return (
        <svg {...common}>
          <path d="M12 3l2 4 4 .5-3 3 1 4.5L12 13l-4 2 1-4.5-3-3L10 7l2-4z" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.9 5.7 21l2.3-7-6-4.6h7.6L12 2z" stroke={stroke} strokeWidth="1.65" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function MegaSocialIcon({ name }) {
  const c = 'rgba(255,255,255,0.88)';
  const s = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
  switch (name) {
    case 'x':
      return (
        <svg {...s}>
          <path d="M4 4l16 16M20 4L4 20" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...s}>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke={c} strokeWidth="1.65" />
          <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.65" />
          <circle cx="17.5" cy="6.5" r="1.2" fill={c} />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...s}>
          <path d="M22 8s0-2-2-2.2l-8-1-8 1C2 6 2 8 2 8v8s0 2 2 2.2l8 1 8-1c2-.2 2-2.2 2-2.2V8z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill={c} stroke="none" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...s}>
          <path d="M14 4v11a3 3 0 11-3-3V9a5 5 0 005 5V4" stroke={c} strokeWidth="1.65" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Top 3 from real firms data (sorted by rating desc) ───────────────── */
const RANK_COLORS = {
  1: { medal: '#fbbf24', glow: 'rgba(251,191,36,0.55)', row: 'rgba(251,191,36,0.03)' },
  2: { medal: '#94a3b8', glow: 'rgba(148,163,184,0.4)',  row: 'rgba(148,163,184,0.025)' },
  3: { medal: '#c2855a', glow: 'rgba(194,133,90,0.45)',  row: 'rgba(194,133,90,0.03)' },
};

function RankMedal({ rank }) {
  const { medal } = RANK_COLORS[rank] || RANK_COLORS[3];
  return (
    <span className="tfp-medal" style={{ '--medal-color': medal }} aria-label={`Rank ${rank}`}>
      {rank}
    </span>
  );
}

function TfpStars({ rating }) {
  return (
    <span className="tfp-stars" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map(i => {
        const on = i <= Math.floor(rating);
        const half = !on && i - 0.5 <= rating;
        return (
          <span key={i} className={`tfp-star${on ? ' tfp-star--on' : half ? ' tfp-star--half' : ''}`} aria-hidden="true">
            ★
          </span>
        );
      })}
    </span>
  );
}

function TopFirmsPanel() {
  const topFirms = useMemo(
    () => [...firms].sort((a, b) => b.rating - a.rating).slice(0, 3),
    []
  );

  return (
    <div className="top-firms-panel" aria-label="Most popular prop firms">
      <div className="top-firms-panel__header">
        <div className="top-firms-panel__title-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="top-firms-panel__trophy-icon">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 4H5a2 2 0 002 2M17 4h2a2 2 0 01-2 2" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="top-firms-panel__title">Top Rated Firms</span>
        </div>
        <span className="top-firms-panel__live-dot" aria-label="Live data">
          <span className="top-firms-panel__live-pulse" />
          Live
        </span>
      </div>

      <ul className="top-firms-list">
        {topFirms.map((firm, idx) => {
          const rank = idx + 1;
          const { row } = RANK_COLORS[rank] || RANK_COLORS[3];
          return (
            <li
              key={firm.name}
              className="tfp-row"
              style={{ '--row-tint': row }}
            >
              <RankMedal rank={rank} />

              <span className="tfp-logo-wrap">
                <Image
                  src={firm.logo}
                  alt={firm.name}
                  width={40}
                  height={40}
                  className="tfp-logo-img"
                />
              </span>

              <span className="tfp-info">
                <span className="tfp-name">{firm.name}</span>
                <span className="tfp-meta">
                  <TfpStars rating={firm.rating} />
                  <span className="tfp-rating-val">{firm.rating}</span>
                  <span className="tfp-reviews">{firm.reviews.toLocaleString()}</span>
                </span>
              </span>

              <span className="tfp-badges">
                <span className="tfp-badge tfp-badge--discount">{firm.discount}</span>
                <span className="tfp-badge tfp-badge--match">
                  KAGE
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="top-firms-panel__footer">
        <a href="#" className="tfp-view-all">
          View all rankings
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

const TAGS = ['$50k', '$100k', 'Low Drawdown', 'Fast Payout', 'No Time Limit'];

const FILTER_OPTIONS = {
  accountSize: [
    { value: '', label: 'Any size' },
    { value: '25k', label: '$25K' },
    { value: '50k', label: '$50K' },
    { value: '100k', label: '$100K' },
    { value: '150k', label: '$150K' },
    { value: '200k+', label: '$200K+' },
  ],
  budget: [
    { value: '', label: 'Any fee' },
    { value: 'under-200', label: 'Under $200' },
    { value: '200-400', label: '$200 – $400' },
    { value: '400-600', label: '$400 – $600' },
    { value: '600+', label: '$600+' },
  ],
  drawdown: [
    { value: '', label: 'Any rule' },
    { value: 'strict', label: 'Strict (e.g. 4–5%)' },
    { value: 'standard', label: 'Standard (6–8%)' },
    { value: 'relaxed', label: 'Relaxed (10%+)' },
  ],
  payout: [
    { value: '', label: 'Any cadence' },
    { value: '7-14', label: '7–14 days' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ],
  market: [
    { value: '', label: 'All markets' },
    { value: 'forex', label: 'Forex' },
    { value: 'futures', label: 'Futures' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'multi', label: 'Multi-asset' },
  ],
};

function FilterSelect({ id, label, value, onChange, options }) {
  return (
    <div className="search-filter__field">
      <label className="search-filter__label" htmlFor={id}>
        {label}
      </label>
      <div className="search-filter__select-wrap">
        <select
          id={id}
          className="search-filter__select"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {options.map(opt => (
            <option key={opt.value || 'any'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* Genie star positions (%, %) — tuned from legacy SVG 300×520 layout */
const GENIE_STARS = [
  { x: 50, y: 12, s: 1.15 },
  { x: 74, y: 36, s: 0.85 },
  { x: 24, y: 42, s: 0.75 },
  { x: 80, y: 52, s: 0.65 },
  { x: 20, y: 60, s: 0.7 },
  { x: 68, y: 24, s: 0.9 },
  { x: 82, y: 28, s: 0.55 },
  { x: 58, y: 68, s: 0.6 },
  { x: 36, y: 32, s: 0.5 },
  { x: 88, y: 44, s: 0.45 },
];

/* ─── Genie asset (webp + aura stars + antigravity float) — hero or compare ── */
function GenieHero({ className = '', priority = true }) {
  const floatRef = useRef(null);
  const starsLayerRef = useRef(null);
  const sparkRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const el = floatRef.current;
    if (!el) return undefined;

    const anim = anime({
      targets: el,
      translateY: [-9, 9],
      translateX: [-7, 6],
      rotate: [-0.7, 0.7],
      duration: 5600,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    });

    return () => {
      anim.pause();
      anime.remove(el);
      el.style.transform = '';
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const layer = starsLayerRef.current;
    const spark = sparkRef.current;
    if (!layer) return undefined;

    const dots = layer.querySelectorAll('.genie-star');
    const starTwinkle = anime({
      targets: dots,
      opacity: [0.1, 0.95],
      scale: [0.78, 1.18],
      translateY: [-5, 6],
      duration: 2800,
      delay: anime.stagger(260, { from: 'random' }),
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    });

    let sparkPulse = null;
    if (spark) {
      sparkPulse = anime({
        targets: spark,
        opacity: [0.32, 1],
        scale: [0.88, 1.12],
        rotate: [-5, 5],
        duration: 3200,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutQuad',
      });
    }

    return () => {
      starTwinkle.pause();
      dots.forEach(node => anime.remove(node));
      if (sparkPulse) {
        sparkPulse.pause();
        anime.remove(spark);
      }
      if (spark) {
        spark.style.transform = '';
        spark.style.opacity = '';
      }
    };
  }, []);

  return (
    <div className={`genie-wrap${className ? ` ${className}` : ''}`} aria-hidden="true">
      <div className="genie-anchor">
        <div className="genie-aura genie-aura--back">
          <div className="genie-aura__halo" />
        </div>

        <div ref={floatRef} className="genie-float">
          <Image
            className="genie-img"
            src="/genie_image_2.webp"
            alt=""
            width={600}
            height={1040}
            sizes="min(340px, 32vw)"
            priority={priority}
            draggable={false}
          />
        </div>

        <div ref={starsLayerRef} className="genie-aura genie-aura--front">
          <div className="genie-spark-slot">
            <div ref={sparkRef} className="genie-spark genie-spark--crown" />
          </div>
          {GENIE_STARS.map((st, i) => (
            <span key={i} className="genie-star-slot" style={{ left: `${st.x}%`, top: `${st.y}%` }}>
              <span className="genie-star" style={{ ['--genie-star-scale']: String(st.s) }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar + mega menu ───────────────────────────────────────────────────── */
function DemoNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuPanelRef = useRef(null);
  const burgerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const panel = menuPanelRef.current;
      if (!panel) return;
      const first = panel.querySelector('a[href], button:not([disabled])');
      first?.focus();
    }, 50);
    const onKey = e => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    burgerRef.current?.focus();
  };

  const megaMenu =
    menuOpen ? (
      <div
        id={menuId}
        ref={menuPanelRef}
        className="demo-mega"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        onClick={e => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <div className="demo-mega__inner" onClick={e => e.stopPropagation()}>
          <svg className="demo-mega__grad-defs" width="0" height="0" aria-hidden focusable={false}>
            <defs>
              <linearGradient id="demoMegaIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>

          <div className="demo-mega__layout">
            <div className="demo-mega__features">
              <div className="demo-mega__feature-grid">
                {MEGA_FEATURE_LINKS.map((item, i) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="demo-mega__tile"
                    style={{ animationDelay: `${i * 0.04}s` }}
                    onClick={closeMenu}
                  >
                    <span className="demo-mega__tile-icon">
                      <MegaFeatureIcon name={item.icon} />
                    </span>
                    <span className="demo-mega__tile-label">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="demo-mega__divider" aria-hidden="true" />

            <div className="demo-mega__links">
              <div className="demo-mega__col">
                <h2 className="demo-mega__heading">Resources</h2>
                <ul className="demo-mega__list">
                  {MEGA_RESOURCE_LINKS.map(text => (
                    <li key={text}>
                      <a href="#" className="demo-mega__link" onClick={closeMenu}>
                        {text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="demo-mega__col demo-mega__col--stack">
                <div>
                  <h2 className="demo-mega__heading">Program</h2>
                  <ul className="demo-mega__list">
                    {MEGA_PROGRAM_LINKS.map(text => (
                      <li key={text}>
                        <a href="#" className="demo-mega__link" onClick={closeMenu}>
                          {text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="demo-mega__heading">Contact</h2>
                  <ul className="demo-mega__list">
                    {MEGA_CONTACT_LINKS.map(text => (
                      <li key={text}>
                        <a href="#" className="demo-mega__link" onClick={closeMenu}>
                          {text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="demo-mega__social-block">
                  <h2 className="demo-mega__heading">Social</h2>
                  <ul className="demo-mega__social">
                    {MEGA_SOCIAL.map(s => (
                      <li key={s.label}>
                        <a
                          href={s.href}
                          className="demo-mega__social-link"
                          aria-label={s.label}
                          onClick={closeMenu}
                        >
                          <MegaSocialIcon name={s.icon} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <Fragment>
      <nav className="demo-nav" aria-label="Primary">
        <div className="demo-nav__inner">
          <a href="#" className="demo-nav__logo" aria-label="PropFirmGenie home">
            <span className="demo-nav__logo-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" />
                <path
                  d="M14 5 C14 5 8 10 8 16 C8 20 10.5 23 14 23 C17.5 23 20 20 20 16 C20 10 14 5 14 5Z"
                  fill="#60a5fa"
                  opacity="0.25"
                />
                <path
                  d="M14 8 C14 8 10 12 10 16.5 C10 19.5 11.8 22 14 22 C16.2 22 18 19.5 18 16.5 C18 12 14 8 14 8Z"
                  fill="#93c5fd"
                  opacity="0.5"
                />
                <circle cx="14" cy="16" r="3" fill="#bfdbfe" opacity="0.85" />
                <path d="M14 22 C14 22 12 25 14 26.5 C16 25 14 22 14 22Z" fill="#60a5fa" opacity="0.5" />
              </svg>
            </span>
            <span className="demo-nav__logo-text">
              PropFirm<span className="demo-nav__logo-accent">Genie</span>
            </span>
          </a>

          <div className="demo-nav__actions">
            <a href="#" className="demo-nav__signin">
              Sign in
            </a>
            <a href="#" className="demo-nav__signup">
              Sign up
            </a>
            <button
              ref={burgerRef}
              type="button"
              className={`demo-nav__burger${menuOpen ? ' demo-nav__burger--open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen(o => !o)}
            >
              <span className="demo-nav__burger-line" />
              <span className="demo-nav__burger-line" />
              <span className="demo-nav__burger-line" />
            </button>
          </div>
        </div>
      </nav>
      {megaMenu}
    </Fragment>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────────── */
export default function DemoHero() {
  const [activeTag, setActiveTag] = useState('$100k');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    accountSize: '',
    budget: '',
    drawdown: '',
    payout: '',
    market: '',
  });

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const activeFilterSummary = useMemo(() => {
    const parts = [];
    if (filters.accountSize) {
      const o = FILTER_OPTIONS.accountSize.find(x => x.value === filters.accountSize);
      if (o) parts.push(o.label);
    }
    if (filters.budget) {
      const o = FILTER_OPTIONS.budget.find(x => x.value === filters.budget);
      if (o) parts.push(o.label);
    }
    if (filters.drawdown) {
      const o = FILTER_OPTIONS.drawdown.find(x => x.value === filters.drawdown);
      if (o) parts.push(o.label.split(' ')[0] + ' DD');
    }
    if (filters.payout) {
      const o = FILTER_OPTIONS.payout.find(x => x.value === filters.payout);
      if (o) parts.push(o.label);
    }
    if (filters.market) {
      const o = FILTER_OPTIONS.market.find(x => x.value === filters.market);
      if (o) parts.push(o.label);
    }
    return parts.length ? parts.join(' · ') : null;
  }, [filters]);

  return (
    <div className="demo-page">
      {/* ── Square grid background ── */}
      <div className="demo-grid" aria-hidden="true" />

      {/* ── Ambient glow orbs ── */}
      <div className="demo-orb demo-orb--1" aria-hidden="true" />
      <div className="demo-orb demo-orb--2" aria-hidden="true" />
      <div className="demo-orb demo-orb--3" aria-hidden="true" />

      {/* ── Hero zone ── */}
      <div className="demo-hero-zone">

      {/* ── Navbar ── */}
      <DemoNavbar />

      {/* ── Ambient sparkles ── */}
      <span className="bg-sparkle bg-sparkle--a" aria-hidden="true">✦</span>
      <span className="bg-sparkle bg-sparkle--b" aria-hidden="true">✦</span>
      <span className="bg-sparkle bg-sparkle--c" aria-hidden="true">·</span>
      <span className="bg-sparkle bg-sparkle--d" aria-hidden="true">✦</span>
      <span className="bg-sparkle bg-sparkle--e" aria-hidden="true">✦</span>

      {/* ── Hero content ── */}
      <section className="demo-hero">
        {/* AI badge */}
        <div className="hero-badge">
          <span className="hero-badge__dot" />
          AI-Powered Matching
        </div>

        {/* Heading — one line; "Prop Firm" gradient */}
        <h1 className="demo-heading">
          Find the Best <span className="demo-heading__accent">Prop Firm</span> in Seconds
        </h1>

        {/* Sub */}
        <p className="demo-sub">
          Tell us your budget, rules, and goals. Our AI finds the best match instantly.
        </p>

        {/* ── Two-column split: AI search + Top Firms ── */}
        <div className="hero-split">
          {/* Left: search panel + tags + stats */}
          <div className="hero-split__left">
            {/* Search + structured filters */}
            <div className="search-panel" role="search" aria-label="Find prop firms">
              <div className="search-panel__query">
                <svg
                  className="search-panel__query-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="8.5" cy="8.5" r="5.75" stroke="rgba(148,163,184,0.65)" strokeWidth="1.5" />
                  <path
                    d="M13.25 13.25L16.75 16.75"
                    stroke="rgba(148,163,184,0.65)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  className="search-panel__input"
                  placeholder="Describe what you want — e.g. $100k, low drawdown, fast payouts…"
                  aria-label="Search or describe your ideal prop firm"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <button type="button" className="search-panel__submit apple-glass-btn apple-glass-btn--search">
                  Find firms
                </button>
              </div>

              <div className="search-panel__divider" aria-hidden="true" />

              <fieldset className="search-filter">
                <legend className="search-filter__legend">Refine with filters</legend>
                <div className="search-filter__grid">
                  <FilterSelect
                    id="filter-account-size"
                    label="Account size"
                    value={filters.accountSize}
                    onChange={v => setFilter('accountSize', v)}
                    options={FILTER_OPTIONS.accountSize}
                  />
                  <FilterSelect
                    id="filter-budget"
                    label="Eval / fee budget"
                    value={filters.budget}
                    onChange={v => setFilter('budget', v)}
                    options={FILTER_OPTIONS.budget}
                  />
                  <FilterSelect
                    id="filter-drawdown"
                    label="Drawdown limit"
                    value={filters.drawdown}
                    onChange={v => setFilter('drawdown', v)}
                    options={FILTER_OPTIONS.drawdown}
                  />
                  <FilterSelect
                    id="filter-payout"
                    label="Payout speed"
                    value={filters.payout}
                    onChange={v => setFilter('payout', v)}
                    options={FILTER_OPTIONS.payout}
                  />
                  <FilterSelect
                    id="filter-market"
                    label="Market"
                    value={filters.market}
                    onChange={v => setFilter('market', v)}
                    options={FILTER_OPTIONS.market}
                  />
                </div>
                {activeFilterSummary && (
                  <p className="search-filter__summary" aria-live="polite">
                    Matching: <span>{activeFilterSummary}</span>
                  </p>
                )}
              </fieldset>
            </div>

            {/* Quick-select tags */}
            <div className="tag-row" role="group" aria-label="Quick filters">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`apple-glass-btn apple-glass-btn--tag${activeTag === tag ? ' apple-glass-btn--active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Stats strip */}
            <div className="demo-stats" aria-label="Platform stats">
              <span>Compare 50+ firms</span>
              <span className="demo-stats__dot" aria-hidden="true">•</span>
              <span>Unbiased rankings</span>
              <span className="demo-stats__dot" aria-hidden="true">•</span>
              <span>Updated daily</span>
            </div>
          </div>

          {/* Right: Top Firms ranking panel */}
          <div className="hero-split__right">
            <TopFirmsPanel />
          </div>
        </div>
      </section>

      </div>{/* end demo-hero-zone */}

      <section className="demo-compare" aria-labelledby="demo-compare-title">
        <div className="demo-compare__inner">
          <h2 id="demo-compare-title" className="demo-compare__title">
            Compare <span className="demo-compare__title-accent">verified firms</span>
          </h2>
          <p className="demo-compare__sub">
            Side-by-side rules, platforms, allocation, and promos — same layout as our full directory.
          </p>
          <div className="demo-compare__table-zone">
            <GenieHero className="genie-wrap--compare" priority={false} />
            <FirmCompareDemo />
          </div>
        </div>
      </section>

      <WhyChooseUs />

      <HowRewardsWorks />

      <Testimonials />

      <CreatorVideos />

      <DemoFAQ />

      <DemoFooter />

      {/* ── Corner sparkle ── */}
      <span className="corner-sparkle" aria-hidden="true">✦</span>
    </div>
  );
}
