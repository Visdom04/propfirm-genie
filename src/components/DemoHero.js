'use client';
import { useState, useEffect, useRef, useId, Fragment } from 'react';
import Image from 'next/image';
import FirmCompareDemo from '@/components/FirmCompareDemo';
import FeaturedFirms from '@/components/FeaturedFirms';
import FirmMarquee from '@/components/FirmMarquee';
import HeroBubbles from '@/components/HeroBubbles';
import WhyChooseUs from '@/components/WhyChooseUs';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import TestimonialWall from '@/components/TestimonialWall';
import DemoFAQ from '@/components/DemoFAQ';
import DiscordCommunity from '@/components/DiscordCommunity';
import DemoFooter from '@/components/DemoFooter';
import { BRAND_LOGO_SRC, BRAND_NAME, SITE_DASHBOARD, SITE_HOME, SITE_MEMBERSHIP } from '@/lib/brand';
import './DemoHero.css';

const DISCORD_URL = '#';
const COMPARE_CTA = '#partner-firms';

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

/* Compare-table section replaced by FeaturedFirms carousel below the hero.
   Flip to true to bring the full comparison table back. */
const SHOW_COMPARE_TABLE = true;
const SHOW_TESTIMONIALS_MARQUEE = false;

const DEMO_NAV_LINKS = [
  { href: '#', label: 'Home' },
  { href: '#partner-firms', label: 'Partner Firms' },
  { href: '#wise-circle', label: 'Wise Circle' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#contact', label: 'Contact Us' },
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
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          <nav className="demo-mega__quick-nav" aria-label="Quick links">
            {DEMO_NAV_LINKS.map(item => (
              <a
                key={item.label}
                href={item.href}
                className="demo-mega__quick-link"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
          </nav>

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
          <a href={SITE_HOME} className="demo-nav__logo" aria-label={`${BRAND_NAME} home`}>
            <span className="demo-nav__logo-icon" aria-hidden="true">
              <Image
                src={BRAND_LOGO_SRC}
                alt=""
                width={28}
                height={28}
                className="demo-nav__logo-img"
                priority
              />
            </span>
            <span className="demo-nav__logo-text">
              Prop Firm<span className="demo-nav__logo-accent">Wise</span>
            </span>
          </a>

          <ul className="demo-nav__links">
            {DEMO_NAV_LINKS.map(item => (
              <li key={item.label}>
                <a href={item.href} className="demo-nav__link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="demo-nav__actions">
            <a href={SITE_DASHBOARD} className="demo-nav__signin">
              Sign in
            </a>
            <a href={SITE_MEMBERSHIP} className="demo-nav__signup">
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
  return (
    <div className="demo-page">
      {/* ── Layered cosmic background ── */}
      <div className="demo-aura" aria-hidden="true" />
      <div className="demo-vignette" aria-hidden="true" />
      <div className="demo-stars" aria-hidden="true" />
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
        <h1 className="demo-heading">
          We give{' '}
          <em className="demo-heading__serif">the best rewards &amp; discounts</em>
          <br />
          in the prop firm industry
        </h1>

        <p className="demo-sub">
          Compare verified firms, unlock exclusive codes, and claim payout perks — built for active traders.
        </p>

        <div className="hero-cta-row">
          <a href={COMPARE_CTA} className="hero-discord-cta">
            Compare firms
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href={DISCORD_URL} className="hero-ghost-cta">
            Join Discord
          </a>
        </div>

        <HeroBubbles />

        <FirmMarquee />
      </section>

      </div>{/* end demo-hero-zone */}

      <FeaturedFirms />

      {SHOW_COMPARE_TABLE && (
        <section className="demo-compare" id="partner-firms" aria-labelledby="demo-compare-title">
          <div className="demo-compare__inner">
            <h2 id="demo-compare-title" className="demo-compare__title">
              Compare <span className="demo-compare__title-accent">verified firms</span>
            </h2>
            <p className="demo-compare__sub">
              Side-by-side rules, platforms, allocation, and promos — same layout as our full directory.
            </p>
            <div className="demo-compare__table-zone">
              <FirmCompareDemo />
            </div>
          </div>
        </section>
      )}

      <WhyChooseUs />

      <HowItWorks />

      {SHOW_TESTIMONIALS_MARQUEE && <Testimonials />}

      <TestimonialWall />

      <DemoFAQ />

      <DiscordCommunity />

      <DemoFooter />

      {/* ── Corner sparkle ── */}
      <span className="corner-sparkle" aria-hidden="true">✦</span>
    </div>
  );
}
