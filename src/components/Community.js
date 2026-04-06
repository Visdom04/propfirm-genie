import './Community.css';

export default function Community() {
  return (
    <section className="community-section container">

      {/* Community Hub */}
      <div className="comm-card comm-left">
        <div className="comm-card-top">
          <span className="comm-label">COMMUNITY HUB</span>
          <div className="comm-icon comm-icon--discord">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
          </div>
        </div>

        <div className="comm-brand">
          <div className="comm-brand-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h3 className="comm-brand-name">Prop Firm Match</h3>
            <div className="comm-stats">
              <span className="comm-online">● 500 Online</span>
              <span className="comm-members">👥 3,557 Members</span>
            </div>
          </div>
        </div>

        <p className="comm-desc">
          Join the most active prop trading community. Get real-time trade alerts, firm reviews and structured side-by-side comparisons built by active traders, backed by real performance data.
        </p>
        <p className="comm-desc-sub">
          Compare challenge rules in real time, review payout proof from active traders, and get practical feedback before committing to a firm.
        </p>

        <div className="comm-tags">
          {['Live Trade Chat', 'Discount Alerts', 'Daily Sessions'].map(t => (
            <span key={t} className="comm-tag">{t}</span>
          ))}
        </div>

        <button className="comm-cta">
          Join Our Discord
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </button>
      </div>

      {/* Trading Tracker */}
      <div className="comm-card comm-right">
        <div className="comm-card-top">
          <span className="comm-label">TRADING TRACKER</span>
          <div className="comm-icon comm-icon--tracker">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
        </div>

        <h3 className="tracker-title">Track Your Trading<br />Performance</h3>
        <p className="comm-desc">
          Import your trading data, monitor account ROI, and review payout trends in one focused dashboard.
        </p>

        <div className="tracker-stats">
          <div className="tracker-stat tracker-stat--green">
            <span className="tracker-stat-label">PAYOUT</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span className="tracker-stat-value">$1k</span>
          </div>
          <div className="tracker-stat tracker-stat--yellow">
            <span className="tracker-stat-label">SPEND</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span className="tracker-stat-value">$192</span>
          </div>
          <div className="tracker-stat tracker-stat--cyan">
            <span className="tracker-stat-label">NET</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <span className="tracker-stat-value">$808</span>
          </div>
        </div>

        <div className="comm-tags">
          {['CSV Import', 'Account Analytics', 'ROI & Payouts'].map(t => (
            <span key={t} className="comm-tag">{t}</span>
          ))}
        </div>

        <button className="comm-cta">
          Start Tracking
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </button>
      </div>

    </section>
  );
}
