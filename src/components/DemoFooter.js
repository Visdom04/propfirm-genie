'use client';

import { useId } from 'react';
import { BRAND_LOGO_SRC, BRAND_NAME, SITE_DASHBOARD, SITE_HOME, SITE_MEMBERSHIP, SITE_URL } from '@/lib/brand';
import './DemoFooter.css';

const PROP_FIRMS_LINKS = [
  { href: `${SITE_URL}/prop-firms`, label: 'All Prop Firms' },
  { href: `${SITE_URL}/prop-firms`, label: 'Compare Challenges' },
  { href: `${SITE_URL}/prop-firms`, label: 'Best Sellers' },
  { href: `${SITE_URL}/prop-firms`, label: 'Favorite Firms' },
  { href: '#', label: 'Announcements' },
  { href: '#', label: 'Prop Firm Rules' },
  { href: '#', label: 'Reviews' },
  { href: '#', label: 'Payouts' },
  { href: '#', label: 'Trader Leaderboard' },
  { href: '#', label: 'Demo Accounts' },
  { href: '#', label: 'Unlisted Firms' },
];

const OFFERS_LINKS = [
  { href: '#', label: 'Exclusive Offers' },
  { href: '#', label: 'Extra Account Promo' },
  { href: '#', label: 'All Current Offers' },
];

const RESOURCES_LINKS = [
  { href: '#', label: 'High Impact News' },
  { href: '#', label: 'Blog' },
  { href: '#', label: 'Prop Firm Features' },
  { href: '#', label: 'Awards' },
  { href: '#', label: 'Industry News' },
  { href: '#', label: 'Resources' },
];

const PROGRAMS_LINKS = [
  { href: '#', label: 'Loyalty Program' },
  { href: '#', label: 'Affiliate Program' },
];

const COMPANY_LINKS = [
  { href: '#', label: 'About Us' },
  { href: '#', label: 'Careers' },
  { href: '#', label: 'Prop Firm Business' },
  { href: '#', label: 'Press' },
  { href: '#', label: 'Sitemap' },
];

const HELP_LINKS = [
  { href: `${SITE_URL}/Contact`, label: 'Contact Us' },
  { href: `${SITE_URL}/HowItWorks`, label: 'How it Works' },
];

const SOCIALS = [
  { href: '#', label: 'X', icon: 'x' },
  { href: '#', label: 'LinkedIn', icon: 'linkedin' },
  { href: '#', label: 'Instagram', icon: 'instagram' },
  { href: '#', label: 'YouTube', icon: 'youtube' },
];

function FooterSocialIcon({ name }) {
  const stroke = 'currentColor';
  const s = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
  switch (name) {
    case 'x':
      return (
        <svg {...s}>
          <path d="M4 4l16 16M20 4L4 20" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.335 18.339h-2.665V14.16c0-.996-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.249h-2.666V9.75h2.56v1.17h.035c.358-.68 1.235-1.4 2.543-1.4 2.718 0 3.222 1.787 3.222 4.102v4.667zM7.003 8.574a1.548 1.548 0 01-1.55-1.549 1.55 1.55 0 111.55 1.549zm1.336 9.765H5.666V9.75h2.673v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.339C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3h.003z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...s}>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke={stroke} strokeWidth="1.65" />
          <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.65" />
          <circle cx="17.5" cy="6.5" r="1.2" fill={stroke} />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...s}>
          <path
            d="M22 8s0-2-2-2.2l-8-1-8 1C2 6 2 8 2 8v8s0 2 2 2.2l8 1 8-1c2-.2 2-2.2 2-2.2V8z"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill={stroke} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

function LinkList({ items }) {
  return (
    <ul className="demo-footer__list">
      {items.map(item => (
        <li key={item.label}>
          <a href={item.href} className="demo-footer__link">
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function DemoFooter() {
  const langId = useId();

  return (
    <footer className="demo-footer" id="contact" aria-labelledby="demo-footer-heading">
      <h2 id="demo-footer-heading" className="demo-footer__sr-only">
        Site footer
      </h2>

      <div className="demo-footer__main">
        <div className="demo-footer__inner">
          <div className="demo-footer__grid">
            {/* Column 1 — brand, socials, controls (AuthPlat-style) */}
            <div className="demo-footer__brand">
              <a href={SITE_HOME} className="demo-footer__logo" aria-label={`${BRAND_NAME} home`}>
                <span className="demo-footer__logo-icon" aria-hidden="true">
                  <img src={BRAND_LOGO_SRC} alt="" width={28} height={28} className="demo-footer__logo-img" />
                </span>
                <span className="demo-footer__logo-text">
                  Prop Firm<span className="demo-footer__logo-accent">Wise</span>
                </span>
              </a>

              <ul className="demo-footer__socials">
                {SOCIALS.map(s => (
                  <li key={s.label}>
                    <a href={s.href} className="demo-footer__social-link" aria-label={s.label}>
                      <FooterSocialIcon name={s.icon} />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="demo-footer__controls">
                <button type="button" className="demo-footer__pill">
                  <span className="demo-footer__pill-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3a9 9 0 109 9M12 7v5l3 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="8" cy="14" r="1.2" fill="currentColor" opacity="0.5" />
                      <circle cx="16" cy="18" r="1.2" fill="currentColor" opacity="0.5" />
                    </svg>
                  </span>
                  Cookie settings
                </button>

                <div className="demo-footer__lang">
                  <span className="demo-footer__pill-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M3 12h18M12 3a15 15 0 0010 9 15 15 0 01-10 9 15 15 0 01-10-9 15 15 0 0110-9z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <label htmlFor={langId} className="demo-footer__sr-only">
                    Language
                  </label>
                  <select id={langId} className="demo-footer__lang-select" defaultValue="en">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <a href="#" className="demo-footer__privacy">
                Do not sell or share my personal information
              </a>
            </div>

            <div className="demo-footer__col">
              <h3 className="demo-footer__heading">Prop firms</h3>
              <LinkList items={PROP_FIRMS_LINKS} />
            </div>

            <div className="demo-footer__col demo-footer__col--stack">
              <div>
                <h3 className="demo-footer__heading">Offers</h3>
                <LinkList items={OFFERS_LINKS} />
              </div>
              <div>
                <h3 className="demo-footer__heading">Resources</h3>
                <LinkList items={RESOURCES_LINKS} />
              </div>
            </div>

            <div className="demo-footer__col demo-footer__col--stack">
              <div>
                <h3 className="demo-footer__heading">Programs</h3>
                <LinkList items={PROGRAMS_LINKS} />
              </div>
              <div>
                <h3 className="demo-footer__heading">Company</h3>
                <LinkList items={COMPANY_LINKS} />
              </div>
            </div>

            <div className="demo-footer__col">
              <h3 className="demo-footer__heading">Get help</h3>
              <LinkList items={HELP_LINKS} />
            </div>
          </div>

          <div className="demo-footer__rule" aria-hidden="true" />

          <div className="demo-footer__meta">
            <p className="demo-footer__copy">© 2026 {BRAND_NAME}. All rights reserved.</p>
            <nav className="demo-footer__legal" aria-label="Legal">
              <a href={`${SITE_URL}/TermsAndConditions`} className="demo-footer__legal-link">
                Terms
              </a>
              <a href={`${SITE_URL}/PrivacyPolicy`} className="demo-footer__legal-link">
                Privacy
              </a>
              <a href={`${SITE_URL}/PrivacyPolicy`} className="demo-footer__legal-link">
                Cookies
              </a>
            </nav>
          </div>
        </div>
      </div>

    </footer>
  );
}
