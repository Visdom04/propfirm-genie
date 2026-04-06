import './AnnouncementBar.css';

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <span className="announcement-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        <span className="announcement-text">
          Join Our Beta for 21 Days Free &amp; Exclusive Early Access &rarr;
        </span>
        <button className="announcement-cta">Join Beta</button>
      </div>
    </div>
  );
}
