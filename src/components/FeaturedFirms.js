'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { firms } from '@/data/firms';
import './FeaturedFirms.css';

const ROTATE_MS = 4500;
const VISIBLE_RADIUS = 2;

const GLOW_COLORS = [
  '#60a5fa', // blue
  '#c084fc', // purple
  '#fbbf24', // gold
  '#2dd4bf', // teal
  '#f472b6', // pink
  '#818cf8', // indigo
  '#34d399', // green
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = e => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function signedDistance(i, active, len) {
  let diff = (i - active + len) % len;
  if (diff > len / 2) diff -= len;
  return diff;
}

function StarIcon() {
  return (
    <svg className="fc-card__star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
    </svg>
  );
}

function ArrowIcon({ dir }) {
  const d = dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FeaturedFirms() {
  const featured = useMemo(
    () =>
      [...firms]
        .filter(f => f.isPopular || f.rating >= 4.4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 7),
    []
  );
  const len = featured.length;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef(null);

  const goTo = useCallback(i => setActive(prev => (len ? ((i % len) + len) % len : prev)), [len]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (reducedMotion || paused || len < 2) return undefined;
    const id = setInterval(() => setActive(a => (a + 1) % len), ROTATE_MS);
    return () => clearInterval(id);
  }, [reducedMotion, paused, len]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onKeyDown = e => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  };

  if (len === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`feat-firms${visible ? ' feat-firms--visible' : ''}`}
      id="partner-firms"
      aria-labelledby="feat-firms-title"
    >
      <div className="feat-firms__spotlight" aria-hidden="true" />

      <div className="feat-firms__inner">
        <header className="feat-firms__head">
          <span className="feat-firms__eyebrow">
            <span className="feat-firms__eyebrow-dot" aria-hidden="true" />
            Trending Now
          </span>
          <h2 id="feat-firms-title" className="feat-firms__title">
            Featured <span className="feat-firms__title-accent">Prop Firms</span>
          </h2>
          <p className="feat-firms__sub">
            The firms traders are picking most this week — ranked by rating, rotating in real time.
          </p>
        </header>

        <div
          className="feat-firms__stage"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured prop firms"
          tabIndex={0}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={onKeyDown}
        >
          <button
            type="button"
            className="feat-firms__nav feat-firms__nav--prev"
            onClick={prev}
            aria-label="Previous firm"
          >
            <ArrowIcon dir="left" />
          </button>

          <ul className="feat-firms__track" aria-live="polite">
            {featured.map((firm, i) => {
              const dist = signedDistance(i, active, len);
              const absDist = Math.abs(dist);
              if (absDist > VISIBLE_RADIUS) return null;

              const isActive = dist === 0;
              const style = {
                '--fc-dist': dist,
                '--fc-abs': absDist,
                '--fc-glow': GLOW_COLORS[i % GLOW_COLORS.length],
                zIndex: 20 - absDist,
              };

              return (
                <li
                  key={firm.name}
                  className={`fc-card${isActive ? ' fc-card--active' : ''}`}
                  style={style}
                  aria-hidden={!isActive}
                >
                  <button
                    type="button"
                    className="fc-card__hit"
                    onClick={() => goTo(i)}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`${firm.name}, rated ${firm.rating}, ${firm.type}, ${firm.maxAlloc} max allocation`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="fc-card__bg" aria-hidden="true" />
                    <span className="fc-card__glow" aria-hidden="true" />

                    <span className="fc-card__logo-zone">
                      <Image
                        src={firm.logo}
                        alt=""
                        width={120}
                        height={120}
                        className="fc-card__logo"
                      />
                    </span>

                    <span className="fc-card__dim" aria-hidden="true" />

                    <span className="fc-card__badge" aria-hidden="true">
                      FP
                    </span>
                    <span className="fc-card__rating" aria-hidden="true">
                      <StarIcon />
                      {firm.rating}
                    </span>

                    <span className="fc-card__footer">
                      {firm.discount && (
                        <span className="fc-card__discount">{firm.discount}</span>
                      )}
                      <span className="fc-card__name">{firm.name}</span>
                      <span className="fc-card__meta">
                        {firm.type} · {firm.maxAlloc} max
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="feat-firms__nav feat-firms__nav--next"
            onClick={next}
            aria-label="Next firm"
          >
            <ArrowIcon dir="right" />
          </button>
        </div>

        <div className="feat-firms__dots" role="tablist" aria-label="Select featured firm">
          {featured.map((firm, i) => (
            <button
              key={firm.name}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show ${firm.name}`}
              className={`feat-firms__dot${i === active ? ' feat-firms__dot--on' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
