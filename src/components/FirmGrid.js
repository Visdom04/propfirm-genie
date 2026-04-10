import Image from 'next/image';
import { firms } from '@/data/firms';
import './FirmGrid.css';

function Stars({ rating }) {
  return (
    <span className="stars-row">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= Math.floor(rating) ? 'full' : i - 0.5 <= rating ? 'half' : 'empty'}`}>★</span>
      ))}
    </span>
  );
}

export default function FirmGrid() {
  return (
    <section className="firm-table-section container animate-fade">

      <div className="firm-table-wrap">
        <table className="firm-table">

          {/* ── Header ── */}
          <thead>
            <tr className="firm-table-head">
              <th className="th-firm">Firm Name</th>
              <th className="th-rating">Rating</th>
              <th className="th-desc">Description</th>
              <th className="th-platforms">Platforms</th>
              <th className="th-alloc">Max Allocation</th>
              <th className="th-website">Website</th>
              <th className="th-promo">Promo & Code</th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {firms.map((f, i) => (
              <tr key={f.name} className="firm-row" style={{ animationDelay: `${i * 0.06}s` }}>

                {/* Firm */}
                <td className="td-firm">
                  <div className="firm-identity">
                    <div className="firm-logo-wrap">
                      <Image src={f.logo} alt={f.name} width={38} height={38} />
                    </div>
                    <div className="firm-meta">
                      <span className="firm-title">{f.name}</span>
                      <span className={`type-badge type-${f.type.toLowerCase()}`}>{f.type}</span>
                    </div>
                  </div>
                </td>

                {/* Rating */}
                <td className="td-rating">
                  <div className="rating-wrap">
                    <span className="rating-num">{f.rating}</span>
                    <Stars rating={f.rating} />
                    <span className="review-count">{f.reviews.toLocaleString()} reviews</span>
                  </div>
                </td>

                {/* Description */}
                <td className="td-desc">
                  <p className="desc-text">{f.description}</p>
                </td>

                {/* Platforms */}
                <td className="td-platforms">
                  <div className="platform-tags">
                    {f.platforms.map(p => (
                      <span key={p} className="platform-tag">{p}</span>
                    ))}
                  </div>
                </td>

                {/* Max Allocation */}
                <td className="td-alloc">
                  <span className="alloc-value">{f.maxAlloc}</span>
                  <span className="accounts-note">up to {f.maxAccounts} accounts</span>
                </td>

                {/* Website */}
                <td className="td-website">
                  <a href="#" className="visit-link">
                    Visit Site
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </td>

                {/* Promo */}
                <td className="td-promo">
                  <div className="promo-wrap">
                    <div className="promo-discount">{f.discount}</div>
                    <div className="promo-code-wrap">
                      <span className="promo-code">{f.promoCode}</span>
                      <button className="copy-btn" title="Copy code">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
}
