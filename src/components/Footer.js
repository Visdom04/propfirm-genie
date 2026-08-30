import './Footer.css';
import { BRAND_LOGO_SRC, BRAND_NAME, SITE_HOME, SITE_URL } from '@/lib/brand';

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-top container">

        {/* Brand + email */}
        <div className="footer-brand">
          <a href={SITE_HOME} className="footer-logo" aria-label={`${BRAND_NAME} home`}>
            <img src={BRAND_LOGO_SRC} alt="" className="footer-logo-icon-img" width={36} height={36} />
            <span className="footer-logo-text">Prop Firm <span>Wise</span></span>
          </a>
          <p className="footer-tagline">Payout protection, free evaluation accounts, and bonus payouts on prop firm purchases.</p>
          <div className="footer-email-form">
            <input type="email" placeholder="Your Email" className="footer-email-input" />
            <button className="footer-email-btn">Get Updates</button>
          </div>
        </div>

        {/* Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">GET HELP</h4>
          <a href="#" className="footer-link">FAQ</a>
          <a href="#" className="footer-link">Contact Us</a>
          <a href="#" className="footer-link">Advertise</a>
          <a href="#" className="footer-link">Submit a Firm</a>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">EXPLORE</h4>
          <a href="#" className="footer-link">Compare Firms</a>
          <a href="#" className="footer-link">Best Sellers</a>
          <a href="#" className="footer-link">Challenges</a>
          <a href="#" className="footer-link">Payout Proofs</a>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">SUPPORT</h4>
          <a href="mailto:support@propfirmwise.com" className="footer-link footer-link--cyan">
            support@propfirmwise.com
          </a>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">FOLLOW US</h4>
          <div className="footer-socials">
            {/* X / Twitter */}
            <a href="#" className="footer-social-btn" aria-label="X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" className="footer-social-btn" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            {/* YouTube */}
            <a href="#" className="footer-social-btn" aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            {/* Discord */}
            <a href="#" className="footer-social-btn" aria-label="Discord">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            </a>
          </div>
        </div>

      </div>

      {/* Divider + bottom */}
      <div className="footer-bottom container">
        <span className="footer-copy">© 2026 {BRAND_NAME}. All rights reserved.</span>
        <div className="footer-bottom-links">
          <a href={`${SITE_URL}/TermsAndConditions`} className="footer-link">Terms of Service</a>
          <a href={`${SITE_URL}/PrivacyPolicy`} className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Cookie Policy</a>
        </div>
      </div>

    </footer>
  );
}
