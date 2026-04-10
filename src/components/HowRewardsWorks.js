'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import anime from 'animejs';
import './HowRewardsWorks.css';

/* ── Data ─────────────────────────────────────────────────────────── */
const AUTO_INTERVAL_MS = 3000;

const CONVERSION_SLIDES = [
  { spent: '$100', points: '100', earnLabel: 'Earn 100 points' },
  { spent: '$500', points: '500', earnLabel: 'Earn 500 points' },
  { spent: '$1,000', points: '1,000', earnLabel: 'Earn 1,000 points' },
];

const STEPS = [
  {
    number: '01',
    icon: 'check',
    title: 'Signup & Choose a Firm',
    desc: 'Create your account and select from our partner trading firms to get started',
  },
  {
    number: '02',
    icon: 'arrow-up-right',
    title: 'Purchase via Our Referral Link',
    desc: 'Use our referral link and exclusive coupon to get the highest exclusive discount available and start trading with your chosen firm',
  },
  {
    number: '03',
    icon: 'download',
    title: 'Submit Proof & Earn Rewards',
    desc: 'Submit proof of your transactions using our referral link and start earning rewards points to spend now!',
  },
];

/* ── Icons ────────────────────────────────────────────────────────── */
function StepIcon({ name }) {
  const s = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };
  switch (name) {
    case 'check':
      return (
        <svg {...s}>
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'arrow-up-right':
      return (
        <svg {...s}>
          <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'download':
      return (
        <svg {...s}>
          <path d="M12 3v12M7 11l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 20h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function GiftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function HowRewardsWorks() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);
  const convRowRef = useRef(null);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const convRef = useRef(null);
  const stepsRef = useRef(null);
  const total = CONVERSION_SLIDES.length;

  /* ── Slide transition ────────────────────────────────────────────── */
  const goTo = useCallback(
    (next) => {
      if (isAnimating) return;
      const idx = ((next % total) + total) % total;
      setIsAnimating(true);

      const el = convRowRef.current;
      if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSlideIdx(idx);
        setIsAnimating(false);
        return;
      }

      anime({
        targets: el,
        opacity: [1, 0],
        translateY: [0, -12],
        duration: 260,
        easing: 'easeInQuad',
        complete: () => {
          setSlideIdx(idx);
          anime({
            targets: el,
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 380,
            easing: 'easeOutExpo',
            complete: () => setIsAnimating(false),
          });
        },
      });
    },
    [isAnimating, total],
  );

  /* ── Auto-advance ────────────────────────────────────────────────── */
  const resetTimer = useCallback(() => {
    window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(
      () => setSlideIdx(s => (s + 1) % total),
      AUTO_INTERVAL_MS,
    );
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => window.clearInterval(timerRef.current);
  }, [resetTimer]);

  // When slideIdx changes via timer, run the animation
  const prevIdxRef = useRef(slideIdx);
  useEffect(() => {
    if (prevIdxRef.current === slideIdx) return;
    prevIdxRef.current = slideIdx;

    const el = convRowRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 380,
      easing: 'easeOutExpo',
    });
  }, [slideIdx]);

  /* ── Scroll-triggered entrance ───────────────────────────────────── */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const els = [titleRef.current, subRef.current, convRef.current].filter(Boolean);
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
    });

    const stepsEl = stepsRef.current;
    if (stepsEl) {
      stepsEl.querySelectorAll('.hrw-step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(32px)';
      });
    }

    return () => {
      els.forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
      });
      stepsEl?.querySelectorAll('.hrw-step').forEach(el => {
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
        tl.add({ targets: titleRef.current, opacity: [0, 1], translateY: [28, 0], duration: 780 });
      }
      if (subRef.current) {
        tl.add({ targets: subRef.current, opacity: [0, 1], translateY: [20, 0], duration: 640 }, '-=560');
      }
      if (convRef.current) {
        tl.add({ targets: convRef.current, opacity: [0, 1], translateY: [32, 0], duration: 800 }, '-=480');
      }
      const cards = stepsRef.current?.querySelectorAll('.hrw-step');
      if (cards?.length) {
        tl.add(
          {
            targets: cards,
            opacity: [0, 1],
            translateY: [32, 0],
            duration: 720,
            delay: anime.stagger(110),
          },
          '-=400',
        );
      }
    };

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            runIntro();
            io.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  const slide = CONVERSION_SLIDES[slideIdx];

  return (
    <section ref={sectionRef} className="hrw-section" aria-labelledby="hrw-title">
      <div className="hrw-inner">

        {/* ── Header ── */}
        <header className="hrw-head">
          <p className="hrw-eyebrow">Rewards Program</p>
          <h2 id="hrw-title" ref={titleRef} className="hrw-title">
            How Rewards <span className="hrw-title-accent">Works</span>
          </h2>
          <p ref={subRef} className="hrw-sub">
            Earn rewards on every trade and convert your points to real prizes, special items, and participate in
            exclusive raffles and giveaways!
          </p>
        </header>

        {/* ── Conversion showcase ── */}
        <div ref={convRef} className="hrw-conv-wrap">
          <div className="hrw-conv-shell">
            <div className="hrw-conv-shell-glow" aria-hidden />

            <h3 className="hrw-conv-title">Points-to-Rewards Conversion</h3>
            <p className="hrw-conv-sub">
              Watch your prop firm spend turn into real rewards points that you can claim for exclusive prizes and items!
            </p>

            {/* Animated conversion row */}
            <div ref={convRowRef} className="hrw-conv-row" aria-live="polite" aria-atomic="true">
              {/* Spent card */}
              <div className="hrw-conv-card hrw-conv-card--left">
                <div className="hrw-conv-card__shine" aria-hidden />
                <span className="hrw-conv-amount">{slide.spent}</span>
                <span className="hrw-conv-badge">SPENT</span>
                <span className="hrw-conv-hint">{slide.earnLabel}</span>
              </div>

              {/* Arrow connector */}
              <div className="hrw-conv-connector" aria-hidden>
                <div className="hrw-conv-connector__line" />
                <div className="hrw-conv-connector__icon">
                  <ArrowIcon />
                </div>
                <div className="hrw-conv-connector__line" />
              </div>

              {/* Points card */}
              <div className="hrw-conv-card hrw-conv-card--right">
                <div className="hrw-conv-card__shine" aria-hidden />
                <div className="hrw-conv-gift">
                  <GiftIcon />
                </div>
                <span className="hrw-conv-amount">{slide.points}</span>
                <span className="hrw-conv-badge">POINTS</span>
                <span className="hrw-conv-hint">Redeem for rewards</span>
              </div>
            </div>

            {/* Dot nav */}
            <div className="hrw-dots" role="tablist" aria-label="Conversion examples">
              {CONVERSION_SLIDES.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === slideIdx}
                  aria-label={`Example ${i + 1}: ${CONVERSION_SLIDES[i].spent} spent`}
                  className={`hrw-dot${i === slideIdx ? ' hrw-dot--active' : ''}`}
                  onClick={() => {
                    goTo(i);
                    resetTimer();
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Steps ── */}
        <div ref={stepsRef} className="hrw-steps" role="list">
          {STEPS.map((step, i) => (
            <article
              key={step.number}
              role="listitem"
              className={`hrw-step${slideIdx === i ? ' hrw-step--active' : ''}`}
            >
              <div className="hrw-step__top-line" aria-hidden />
              <span className="hrw-step__ghost-num" aria-hidden>{step.number}</span>
              <div className="hrw-step__icon-pill">
                <StepIcon name={step.icon} />
              </div>
              <h3 className="hrw-step__title">{step.title}</h3>
              <p className="hrw-step__desc">{step.desc}</p>
            </article>
          ))}
        </div>

        {/* ── CTA ── */}
        <a href="#" className="hrw-cta">
          Start Earning Rewards Now
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3 13L13 3M13 3H5M13 3v8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

      </div>
    </section>
  );
}
