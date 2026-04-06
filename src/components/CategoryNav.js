import './CategoryNav.css';

const tabs = ['Firms', 'Challenges', 'Offers', 'Reviews'];
const filters = ['Popular', 'New', 'Top Rated', 'All'];

export default function CategoryNav() {
  return (
    <div className="category-nav container">

      <div className="cat-tabs-row">
        <div className="cat-tabs">
          {tabs.map((t, i) => (
            <button key={t} className={`cat-tab${i === 0 ? ' active' : ''}`}>{t}</button>
          ))}
        </div>

        <div className="cat-filters">
          <button className="cat-filter-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filter
          </button>
          {filters.map((f, i) => (
            <button key={f} className={`cat-tag${i === 0 ? ' active' : ''}`}>{f}</button>
          ))}
        </div>
      </div>

    </div>
  );
}
