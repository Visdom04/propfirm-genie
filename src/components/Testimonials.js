'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import anime from 'animejs';
import './Testimonials.css';

/* ── Data ─────────────────────────────────────────────────────────── */
const FIRM_TABS = [
  { id: 'ftmo', label: 'FTMO', shape: 'circle' },
  { id: 'mff', label: 'MFF', shape: 'square' },
  { id: 'topstep', label: 'TOPSTEP', shape: 'diamond' },
  { id: 'e8', label: 'E8', shape: 'ring' },
];

const TESTIMONIALS = [
  [
    {
      name: 'Alex Rivera',
      role: 'Prop Trader',
      firm: 'Funded via FTMO',
      initials: 'AR',
      color: '#60a5fa',
      stars: 5,
      quote:
        '"PropFirmGenie matched me with the perfect $100k account in under 2 minutes. Their AI understood my low-drawdown style and pointed me straight to FTMO — passed first try."',
    },
    {
      name: 'Sarah Kim',
      role: 'Forex Specialist',
      firm: 'Funded via MFF',
      initials: 'SK',
      color: '#a78bfa',
      stars: 5,
      quote:
        '"The comparison table saved me weeks of research. Side-by-side payout rules, drawdown limits, and fees — all in one view. I went from confused to funded in 3 weeks."',
    },
    {
      name: 'Marcus T.',
      role: 'Futures Trader',
      firm: 'Funded via TopStep',
      initials: 'MT',
      color: '#34d399',
      stars: 5,
      quote:
        "\"As a futures trader I was always overlooked by generic sites. PropFirmGenie surfaced TopStep's combine rules and showed me exactly why I was the right fit. Game-changer.\"",
    },
  ],
  [
    {
      name: 'Priya Sharma',
      role: 'Swing Trader',
      firm: 'Funded via E8 Markets',
      initials: 'PS',
      color: '#f472b6',
      stars: 5,
      quote:
        '"I tried three firms before finding PropFirmGenie. The filter for payout speed alone helped me avoid two firms with terrible withdrawal tracks. Now funded and profitable."',
    },
    {
      name: 'James O.',
      role: 'Crypto Desk Trader',
      firm: 'Funded via FTMO',
      initials: 'JO',
      color: '#fb923c',
      stars: 5,
      quote:
        '"The live intelligence feature flagged a rule change at my original target firm the week before I was going to sign up. Saved me money and steered me to a better option."',
    },
    {
      name: 'Li Wei',
      role: 'Algo Developer',
      firm: 'Funded via MFF',
      initials: 'LW',
      color: '#60a5fa',
      stars: 4,
      quote:
        '"Finding algo-friendly firms used to require deep-diving Reddit threads. PropFirmGenie surfaced EA-allowed accounts with scaling plans instantly. Brilliant product."',
    },
  ],
];

/* ── Stars ────────────────────────────────────────────────────────── */
function Stars({ count }) {
  return (
    <div className="testi-stars" aria-label={`${count} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`testi-star${i <= count ? ' testi-star--on' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.2 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z"
            fill={i <= count ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────── */
function Avatar({ initials, color }) {
  return (
    <div
      className="testi-avatar"
      style={{ '--avatar-color': color }}
      aria-hidden
    >
      <span className="testi-avatar__initials">{initials}</span>
    </div>
  );
}

/* ── Single card ─────────────────────────────────────────────────── */
function TestiCard({ data, index }) {
  return (
    <article className="testi-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="testi-card__glow" aria-hidden />
      <div className="testi-card__inner">
        <div className="testi-card__top">
          <Avatar initials={data.initials} color={data.color} />
          <Stars count={data.stars} />
        </div>
        <blockquote className="testi-card__quote">{data.quote}</blockquote>
        <div className="testi-card__divider" aria-hidden />
        <footer className="testi-card__footer">
          <p className="testi-card__name">{data.name}</p>
          <p className="testi-card__role">{data.role}</p>
          <p className="testi-card__firm">{data.firm}</p>
        </footer>
      </div>
    </article>
  );
}

/* ── Main section ─────────────────────────────────────────────────── */
const AUTO_INTERVAL_MS = 3000;

export default function Testimonials() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const sliderRef = useRef(null);

  const [activeFirm, setActiveFirm] = useState('ftmo');
  const [slide, setSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);
  const total = TESTIMONIALS.length;

  /* ── auto-advance ─────────────────────────────────────────────── */
  const goTo = useCallback(
    (next, dir = 1) => {
      if (isAnimating) return;
      const idx = ((next % total) + total) % total;
      setIsAnimating(true);

      const el = sliderRef.current;
      if (!el) {
        setSlide(idx);
        setIsAnimating(false);
        return;
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSlide(idx);
        setIsAnimating(false);
        return;
      }

      anime({
        targets: el,
        opacity: [1, 0],
        translateX: [0, dir * -40],
        duration: 260,
        easing: 'easeInQuad',
        complete: () => {
          setSlide(idx);
          anime({
            targets: el,
            opacity: [0, 1],
            translateX: [dir * 40, 0],
            duration: 340,
            easing: 'easeOutExpo',
            complete: () => setIsAnimating(false),
          });
        },
      });
    },
    [isAnimating, total],
  );

  const goNext = useCallback(() => goTo(slide + 1, 1), [slide, goTo]);
  const goPrev = useCallback(() => goTo(slide - 1, -1), [slide, goTo]);

  /* ── reset timer on manual nav ───────────────────────────────── */
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(goNext, AUTO_INTERVAL_MS);
  }, [goNext]);

  useEffect(() => {
    timerRef.current = setInterval(goNext, AUTO_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [goNext]);

  /* ── scroll entrance animation ────────────────────────────────── */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const els = [titleRef.current, subRef.current].filter(Boolean);
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
    });
    return () => els.forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const section = sectionRef.current;
    if (!section) return undefined;

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const tl = anime.timeline({ easing: 'easeOutExpo' });
          if (titleRef.current) {
            tl.add({ targets: titleRef.current, opacity: [0, 1], translateY: [22, 0], duration: 720 });
          }
          if (subRef.current) {
            tl.add({ targets: subRef.current, opacity: [0, 1], translateY: [14, 0], duration: 560 }, '-=500');
          }
          io.disconnect();
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  const handleManualNav = (fn) => {
    fn();
    resetTimer();
  };

  return (
    <section ref={sectionRef} className="testi-section" aria-labelledby="testi-title">
      <div className="testi-inner">

        {/* ── header ── */}
        <header className="testi-head">
          <div className="testi-eyebrow">
            <span className="testi-eyebrow__dot" />
            Client Success
          </div>

          <h2 id="testi-title" ref={titleRef} className="testi-title">
            What our traders say about{' '}
            <span className="testi-title__accent">finding their firm.</span>
          </h2>

          <p ref={subRef} className="testi-sub">
            Real results from real traders. See how PropFirmGenie helped them cut research time and get funded faster.
          </p>
        </header>

        {/* ── firm tabs ── */}
        <div className="testi-tabs" role="tablist" aria-label="Filter by firm">
          {FIRM_TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeFirm === tab.id}
              className={`testi-tab${activeFirm === tab.id ? ' testi-tab--active' : ''}`}
              onClick={() => setActiveFirm(tab.id)}
            >
              <FirmShape shape={tab.shape} active={activeFirm === tab.id} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CTA ── */}
        <a href="#" className="testi-cta">
          View all success stories
        </a>

        {/* ── slider ── */}
        <div className="testi-slider-wrap" aria-live="polite" aria-atomic="true">
          <div ref={sliderRef} className="testi-grid">
            {TESTIMONIALS[slide].map((t, i) => (
              <TestiCard key={`${slide}-${i}`} data={t} index={i} />
            ))}
          </div>

          {/* ── dots + arrows ── */}
          <div className="testi-controls">
            <button
              className="testi-arrow testi-arrow--prev"
              onClick={() => handleManualNav(goPrev)}
              aria-label="Previous testimonials"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="testi-dots" role="group" aria-label="Slide indicators">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  className={`testi-dot${i === slide ? ' testi-dot--active' : ''}`}
                  onClick={() => handleManualNav(() => goTo(i, i > slide ? 1 : -1))}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === slide}
                />
              ))}
            </div>

            <button
              className="testi-arrow testi-arrow--next"
              onClick={() => handleManualNav(goNext)}
              aria-label="Next testimonials"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ── Geometric firm shape ────────────────────────────────────────── */
function FirmShape({ shape, active }) {
  const cls = `testi-tab__shape testi-tab__shape--${shape}${active ? ' testi-tab__shape--active' : ''}`;
  return <span className={cls} aria-hidden />;
}
