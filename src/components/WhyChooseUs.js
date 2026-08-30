'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import anime from 'animejs';
import './WhyChooseUs.css';

const REWARD_PILLS = [
  'Cashback',
  'Fee discounts',
  'Reset promos',
  'Loyalty tiers',
  'Partner perks',
  'Holiday bonuses',
  'Referral credit',
  'Scaling deals',
  'Free retries',
  'Newsletter codes',
  'Bundle savings',
  'Limited drops',
];

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM7 4H5a2 2 0 002 2M17 4h2a2 2 0 01-2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRadar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 3a9 9 0 019 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M19 11a7 7 0 01-14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const COMPARE_NODE_KEYS = ['chart', 'grid', 'wallet', 'cpu', 'globe', 'sliders'];

function CompareNodeIcon({ name }) {
  const s = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
  const c = 'currentColor';
  switch (name) {
    case 'chart':
      return (
        <svg {...s}>
          <path d="M4 19V5M9 19v-6M14 19V9M19 19v-9" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...s}>
          <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" stroke={c} strokeWidth="1.4" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...s}>
          <path
            d="M3 7a2 2 0 012-2h14v16H5a2 2 0 01-2-2V7zm16 0v10M7 12h5"
            stroke={c}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'cpu':
      return (
        <svg {...s}>
          <rect x="7" y="7" width="10" height="10" rx="2" stroke={c} strokeWidth="1.5" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
          <path d="M3 12h18M12 3a14 14 0 000 18M12 3a14 14 0 010 18" stroke={c} strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <path d="M6 8h12M6 12h8M6 16h10" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function CardCompare({ rootRef }) {
  const nodesRef = useRef(null);
  const pathsRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const nodes = nodesRef.current?.querySelectorAll('.why-compare__node');
    if (!nodes?.length) return undefined;

    const float = anime({
      targets: nodes,
      translateY: [-3, 3],
      duration: 2800,
      delay: anime.stagger(140, { from: 'center' }),
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    });

    const paths = pathsRef.current?.querySelectorAll('path');
    let pathAnim = null;
    if (paths?.length) {
      pathAnim = anime({
        targets: paths,
        strokeOpacity: [0.15, 0.55],
        duration: 2200,
        delay: anime.stagger(120, { from: 'first' }),
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutQuad',
      });
    }

    return () => {
      float.pause();
      nodes.forEach(n => anime.remove(n));
      if (pathAnim) {
        pathAnim.pause();
        paths.forEach(p => anime.remove(p));
      }
    };
  }, []);

  return (
    <article ref={rootRef} className="why-card">
      <div className="why-card__glow-top" aria-hidden />
      <div className="why-card__dots" aria-hidden />
      <div className="why-card__body">
        <div className="why-card__icon">
          <IconSpark />
        </div>
        <h3 className="why-card__heading">AI-powered comparison</h3>
        <p className="why-card__text">
          Side-by-side rules, fees, and platforms, ranked for how you actually trade, not generic star ratings.
        </p>
      </div>
      <div className="why-card__viz">
        <div className="why-card__viz-inner">
          <div ref={nodesRef} className="why-compare__row">
            {COMPARE_NODE_KEYS.map(key => (
              <div key={key} className="why-compare__node">
                <CompareNodeIcon name={key} />
              </div>
            ))}
          </div>
          <svg ref={pathsRef} className="why-compare__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 12 20 C 12 60, 50 60, 50 85" />
            <path d="M 27 20 C 27 60, 50 60, 50 85" />
            <path d="M 42 20 C 42 60, 50 60, 50 85" />
            <path d="M 58 20 C 58 60, 50 60, 50 85" />
            <path d="M 73 20 C 73 60, 50 60, 50 85" />
            <path d="M 88 20 C 88 60, 50 60, 50 85" />
          </svg>
          <div className="why-compare__hub">
            <div className="why-compare__hub-glow" aria-hidden />
            <div className="why-compare__hub-core">
              <IconLayers />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function chunkPills(arr, perRow) {
  const rows = [];
  for (let i = 0; i < arr.length; i += perRow) {
    rows.push(arr.slice(i, i + perRow));
  }
  return rows;
}

function CardRewards({ rootRef }) {
  const [hot, setHot] = useState(() => new Set([0, 4, 7]));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const id = window.setInterval(() => {
      const next = new Set();
      const pool = REWARD_PILLS.map((_, i) => i);
      for (let k = 0; k < 3; k += 1) {
        if (!pool.length) break;
        const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        next.add(pick);
      }
      setHot(next);
    }, 900);

    return () => window.clearInterval(id);
  }, []);

  const rows = chunkPills(REWARD_PILLS, 4);

  return (
    <article ref={rootRef} className="why-card">
      <div className="why-card__glow-top" aria-hidden />
      <div className="why-card__dots" aria-hidden />
      <div className="why-card__body">
        <div className="why-card__icon">
          <IconTrophy />
        </div>
        <h3 className="why-card__heading">Best rewards</h3>
        <p className="why-card__text">
          Spot the strongest promos, fee breaks, and loyalty perks across firms without digging through Discord
          threads.
        </p>
      </div>
      <div className="why-card__viz">
        <div className="why-card__viz-inner" style={{ justifyContent: 'center' }}>
          <div className="why-rewards__bg" aria-hidden>
            {rows.map((row, ri) => (
              <div key={ri} className={`why-rewards__marquee why-rewards__marquee--${ri + 1}`}>
                {row.map((label, i) => {
                  const globalIdx = ri * 4 + i;
                  return (
                    <span
                      key={label}
                      className={`why-rewards__pill${hot.has(globalIdx) ? ' why-rewards__pill--hot' : ''}`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="why-rewards__center">
            <div className="why-rewards__badge">
              <div className="why-rewards__badge-glow" aria-hidden />
              <div className="why-rewards__badge-inner">
                <IconCheck />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CardLiveIntel({ rootRef }) {
  const barsRef = useRef(null);
  const chipRef = useRef(null);

  const tickBars = useCallback(() => {
    const bars = barsRef.current?.querySelectorAll('.why-live__bar');
    if (!bars?.length) return;
    const heights = [10, 16, 24, 12, 20, 8, 14, 18, 6, 12];
    anime({
      targets: bars,
      scaleY: (_, i) => {
        const base = heights[i % heights.length];
        const jitter = Math.random() * 10;
        return (base + jitter) / 24;
      },
      duration: 420,
      easing: 'easeOutQuad',
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const bars = barsRef.current?.querySelectorAll('.why-live__bar');
    if (bars?.length) {
      bars.forEach(el => {
        el.style.transformOrigin = 'bottom center';
        el.style.transform = 'scaleY(0.45)';
      });
    }

    tickBars();
    const id = window.setInterval(tickBars, 180);

    let chipFloat = null;
    if (chipRef.current) {
      chipFloat = anime({
        targets: chipRef.current,
        translateY: [-2, 3],
        duration: 2600,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
      });
    }

    return () => {
      window.clearInterval(id);
      if (chipFloat) {
        chipFloat.pause();
        anime.remove(chipRef.current);
      }
      bars?.forEach(el => anime.remove(el));
    };
  }, [tickBars]);

  return (
    <article ref={rootRef} className="why-card">
      <div className="why-card__glow-top" aria-hidden />
      <div className="why-card__dots" aria-hidden />
      <div className="why-card__body">
        <div className="why-card__icon">
          <IconRadar />
        </div>
        <h3 className="why-card__heading">Live firm intelligence</h3>
        <p className="why-card__text">
          Programs shift fast. We refresh rankings and highlights so you are not acting on last month&apos;s
          spreadsheet.
        </p>
      </div>
      <div className="why-card__viz">
        <div className="why-card__viz-inner why-live__viz-inner">
          <div ref={chipRef} className="why-live__chip">
            Updated daily
          </div>
          <div className="why-live__meter">
            <div className="why-live__mic">
              <IconMic />
            </div>
            <div ref={barsRef} className="why-live__bars" aria-hidden>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <div
                  key={i}
                  className={`why-live__bar${i > 5 ? ' why-live__bar--dim' : ''}`}
                  style={{ height: 12 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function WhyChooseUs() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const card1 = useRef(null);
  const card2 = useRef(null);
  const card3 = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const heads = [titleRef.current, subRef.current].filter(Boolean);
    const cards = [card1.current, card2.current, card3.current].filter(Boolean);
    heads.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
    });
    cards.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(36px) perspective(900px) rotateX(7deg)';
    });

    return () => {
      [...heads, ...cards].forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
      });
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const section = sectionRef.current;
    if (!section) return undefined;

    const runIntro = () => {
      const tl = anime.timeline({ easing: 'easeOutExpo' });
      if (titleRef.current) {
        tl.add({
          targets: titleRef.current,
          opacity: [0, 1],
          translateY: [26, 0],
          duration: 780,
        });
      }
      if (subRef.current) {
        tl.add(
          {
            targets: subRef.current,
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 620,
          },
          '-=560',
        );
      }
      const cards = [card1.current, card2.current, card3.current].filter(Boolean);
      if (cards.length) {
        tl.add(
          {
            targets: cards,
            opacity: [0, 1],
            translateY: [36, 0],
            rotateX: [7, 0],
            duration: 900,
            delay: anime.stagger(110, { start: 120 }),
            complete: () => {
              cards.forEach(el => {
                el.style.transform = '';
              });
            },
          },
          '-=420',
        );
      }
    };

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runIntro();
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="why-choose" aria-labelledby="why-choose-title">
      <div className="why-choose__glow" aria-hidden />
      <div className="why-choose__inner">
        <header className="why-choose__head">
          <h2 id="why-choose-title" ref={titleRef} className="why-choose__title">
            Why Choose <span className="why-choose__title-accent">Prop Firm Wise</span>
          </h2>
          <p ref={subRef} className="why-choose__sub">
            Three reasons we feel less like a directory and more like a decision engine.
          </p>
        </header>

        <div className="why-choose__grid">
          <CardCompare rootRef={card1} />
          <CardRewards rootRef={card2} />
          <CardLiveIntel rootRef={card3} />
        </div>
      </div>
    </section>
  );
}
