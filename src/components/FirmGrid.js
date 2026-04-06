import Image from 'next/image';
import './FirmGrid.css';

const firms = [
  {
    name: 'The5%ers',
    logo: '/firm/the-5-ers-partner.svg',
    rating: 4.8, reviews: 1128,
    description: 'UK-based prop firm offering instant funding and scaling plans up to $4M. No time limits, no minimum trading days.',
    platforms: ['MT5', 'cTrader'],
    maxAccounts: 'Unlimited',
    maxAlloc: '$4M',
    promoCode: 'MATCH5',
    discount: '5% OFF',
    website: 'the5ers.com',
    type: 'Challenge',
  },
  {
    name: 'FundingPips',
    logo: '/firm/funding-pips-partner.svg',
    rating: 4.3, reviews: 979,
    description: 'Dubai-based firm with 1-step and 2-step challenges. Fast payouts with up to 95% profit split.',
    platforms: ['MT5', 'cTrader'],
    maxAccounts: '3',
    maxAlloc: '$300K',
    promoCode: 'MATCHFP',
    discount: '20% OFF',
    website: 'fundingpips.com',
    type: 'Challenge',
  },
  {
    name: 'Alpha Capital',
    logo: '/firm/alpha-partner.svg',
    rating: 4.4, reviews: 412,
    description: 'UK-based prop firm with instant funded accounts. Trade forex and indices with up to 90% profit share.',
    platforms: ['cTrader'],
    maxAccounts: '5',
    maxAlloc: '$2M',
    promoCode: 'MATCHAC',
    discount: '30% OFF',
    website: 'alphacapitalgroup.uk',
    type: 'Funded',
  },
  {
    name: 'AquaFunded',
    logo: '/firm/aquafunded-partner.svg',
    rating: 4.3, reviews: 310,
    description: 'Fast-growing UAE firm offering 1-step challenges with aggressive scaling. Up to 90% profit split.',
    platforms: ['MT5'],
    maxAccounts: '3',
    maxAlloc: '$400K',
    promoCode: 'MATCHAQ',
    discount: '40% OFF',
    website: 'aquafunded.com',
    type: 'Challenge',
  },
  {
    name: 'BrightFunded',
    logo: '/firm/brightfunded-partner.svg',
    rating: 4.5, reviews: 520,
    description: 'European prop firm with simple 2-step evaluation. Bi-weekly payouts and up to 100% profit share.',
    platforms: ['MT5', 'cTrader'],
    maxAccounts: '5',
    maxAlloc: '$400K',
    promoCode: 'MATCHBF',
    discount: '20% OFF',
    website: 'brightfunded.com',
    type: 'Challenge',
  },
  {
    name: 'Blue Guardian',
    logo: '/firm/bg-partner.svg',
    rating: 4.2, reviews: 280,
    description: 'UK prop firm with Guardian challenge accounts. No minimum trading days and weekly payouts available.',
    platforms: ['MT5'],
    maxAccounts: '4',
    maxAlloc: '$200K',
    promoCode: 'MATCHBG',
    discount: '15% OFF',
    website: 'blueguardian.com',
    type: 'Challenge',
  },
  {
    name: 'Audacity Capital',
    logo: '/firm/audacity-capital.png',
    rating: 4.1, reviews: 195,
    description: 'UK firm offering Ability Challenge accounts. Specialises in funded trader development with no profit targets.',
    platforms: ['MT5'],
    maxAccounts: '10',
    maxAlloc: '$1M',
    promoCode: 'MATCHAUD',
    discount: '10% OFF',
    website: 'audacitycapital.co.uk',
    type: 'Funded',
  },
  {
    name: 'Lark Funding',
    logo: '/firm/lark-partner.svg',
    rating: 4.0, reviews: 140,
    description: 'US-based futures and forex prop firm. Simple rules, fast payouts, and lifetime funded accounts.',
    platforms: ['MT5', 'NinjaTrader'],
    maxAccounts: '3',
    maxAlloc: '$200K',
    promoCode: 'MATCHLF',
    discount: '25% OFF',
    website: 'larkfunding.com',
    type: 'Challenge',
  },
];

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
