import './Navbar.css';
import { BRAND_LOGO_SRC, BRAND_NAME, SITE_HOME } from '@/lib/brand';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <div className="navbar-left">
          <a href={SITE_HOME} className="logo" aria-label={`${BRAND_NAME} home`}>
            <img src={BRAND_LOGO_SRC} alt="" className="logo-icon-img" width={32} height={32} />
            <span className="logo-text">Prop Firm <span className="text-blue">Wise</span></span>
          </a>
          
          <div className="search-bar glass">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search prop firms..." />
          </div>
        </div>

        <div className="navbar-center">
          <div className="category-switcher glass">
            <button className="switch-btn active">Forex</button>
            <button className="switch-btn">Futures</button>
            <button className="switch-btn">Crypto <span className="badge-new">NEW</span></button>
          </div>
        </div>

        <div className="navbar-right">
          <button className="btn-link we-hiring">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            We're Hiring
          </button>
          <button className="btn btn-secondary">Log in</button>
          <button className="btn btn-primary">Sign Up</button>
          <button className="menu-btn">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className="navbar-subnav">
        <div className="container subnav-content">
          {['Home', 'Offers', 'Challenges', 'Best Sellers', 'Reviews', 'Favorite Firms', 'Prop Firm Rules', 'Spreads', 'Payouts', 'Brokers'].map((item) => (
            <a key={item} href="#" className={`subnav-link${item === 'Home' ? ' active' : ''}`}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
