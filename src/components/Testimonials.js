'use client';

import { BRAND_NAME } from '@/lib/brand';
import './Testimonials.css';

const REVIEW_COUNT = '1,150';

const TESTIMONIALS = [
  {
    id: 'alex',
    name: 'Alex Rivera',
    reviews: 12,
    location: 'United States',
    timeAgo: '18 hours ago',
    avatar: 'AR',
    stars: 5,
    headline: 'Found my $100k match in under two minutes',
    body: 'Prop Firm Wise understood my low-drawdown style and pointed me straight to FTMO. Passed the evaluation on my first attempt — the filters alone saved hours of research.',
  },
  {
    id: 'sarah',
    name: 'Sarah Kim',
    reviews: 8,
    location: 'United Kingdom',
    timeAgo: '2 days ago',
    avatar: 'SK',
    stars: 5,
    headline: 'Side-by-side rules finally made sense',
    body: 'Payout rules, drawdown limits, and fees in one comparison view. I went from confused to funded in three weeks without digging through Discord threads.',
  },
  {
    id: 'marcus',
    name: 'Marcus T.',
    reviews: 21,
    location: 'United States',
    timeAgo: '5 days ago',
    avatar: 'MT',
    stars: 5,
    headline: 'TopStep rules surfaced instantly',
    body: "As a futures trader I was always overlooked by generic sites. Prop Firm Wise showed me exactly why TopStep's combine rules fit how I trade. Game-changer.",
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    reviews: 6,
    location: 'India',
    timeAgo: '3 days ago',
    avatar: 'PS',
    stars: 5,
    headline: 'Payout speed filter saved me from a bad pick',
    body: 'I almost signed with a firm that looked great on paper. The payout cadence filter flagged slow withdrawals — switched to a better match and got funded within a month.',
  },
  {
    id: 'james',
    name: 'James O.',
    reviews: 15,
    location: 'Canada',
    timeAgo: '1 week ago',
    avatar: 'JO',
    stars: 5,
    headline: 'Caught a rule change before I paid',
    body: 'Live firm intelligence flagged an evaluation rule update the week before checkout. Saved me money and steered me to a firmer with clearer scaling terms.',
  },
  {
    id: 'li',
    name: 'Li Wei',
    reviews: 9,
    location: 'Singapore',
    timeAgo: '4 days ago',
    avatar: 'LW',
    stars: 5,
    headline: 'Algo-friendly firms in one search',
    body: 'Finding EA-allowed accounts used to mean hours on Reddit. Prop Firm Wise surfaced scaling plans and platform support instantly — passed and scaled on first try.',
  },
];

const MARQUEE_ITEMS = [...TESTIMONIALS, ...TESTIMONIALS];

function TrustpilotStarBox() {
  return (
    <span className="tp-star-box" aria-hidden>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
      </svg>
    </span>
  );
}

function CardStars({ count }) {
  return (
    <div className="testi-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`testi-star${i < count ? ' testi-star--on' : ''}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function TrustpilotLogo() {
  return (
    <span className="testi-trust__logo" aria-label="Trustpilot">
      <svg className="testi-trust__logo-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
      </svg>
      Trustpilot
    </span>
  );
}

function TestiCard({ data }) {
  return (
    <article className="testi-card">
      <div className="testi-card__header">
        <div className="testi-avatar" aria-hidden>
          <span>{data.avatar}</span>
        </div>
        <div className="testi-card__identity">
          <p className="testi-card__name">{data.name}</p>
          <p className="testi-card__meta">
            <span>{data.reviews} reviews</span>
            <span className="testi-card__meta-dot" aria-hidden>·</span>
            <span className="testi-card__location">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {data.location}
            </span>
          </p>
        </div>
      </div>

      <div className="testi-card__rating-row">
        <CardStars count={data.stars} />
        <span className="testi-card__time">{data.timeAgo}</span>
      </div>

      <h3 className="testi-card__headline">{data.headline}</h3>
      <p className="testi-card__body">{data.body}</p>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="testi-section" id="wise-circle" aria-labelledby="testi-title">
      <div className="testi-section__glow" aria-hidden />

      <div className="testi-inner">
        <header className="testi-head">
          <h2 id="testi-title" className="testi-title">
            Why Traders Love <span className="testi-title__accent">{BRAND_NAME}</span>
          </h2>

          <p className="testi-reviews-count">Based on {REVIEW_COUNT} Reviews</p>

          <div className="testi-trust" aria-label="Rated excellent on Trustpilot">
            <span className="testi-trust__label">Excellent</span>
            <div className="testi-trust__stars">
              {Array.from({ length: 5 }, (_, i) => (
                <TrustpilotStarBox key={i} />
              ))}
            </div>
            <TrustpilotLogo />
          </div>
        </header>

        <div className="testi-marquee" aria-label="Scrolling trader reviews" aria-live="off">
          <div className="testi-marquee__viewport">
            <div className="testi-marquee__track">
              {MARQUEE_ITEMS.map((item, index) => (
                <TestiCard key={`${item.id}-${index}`} data={item} />
              ))}
            </div>
          </div>
        </div>

        <a href="#" className="testi-cta">
          View all
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 17L17 7M17 7H9M17 7v8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
