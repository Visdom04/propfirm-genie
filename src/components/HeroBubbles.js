'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { firms } from '@/data/firms';
import './HeroBubbles.css';

const VISIBLE = 3;

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

function ArrowIcon({ dir }) {
  const d = dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FirmBubble({ firm, slot }) {
  const split = firm.discount?.includes('%') ? firm.discount : '90% split';
  return (
    <article
      className={`hero-bubble hero-bubble--${slot}`}
      aria-hidden={slot !== 'center'}
      tabIndex={slot === 'center' ? 0 : -1}
    >
      <div className="hero-bubble__glass">
        <div className="hero-bubble__socials" aria-hidden="true">
          <span className="hero-bubble__dot" />
          <span className="hero-bubble__dot" />
          <span className="hero-bubble__dot" />
        </div>

        <div className="hero-bubble__avatar">
          <Image
            src={firm.logo}
            alt=""
            width={88}
            height={88}
            className="hero-bubble__logo"
            draggable={false}
          />
        </div>

        <h3 className="hero-bubble__name">{firm.name}</h3>
        <p className="hero-bubble__handle">@{firm.website?.replace(/^www\./, '') ?? 'propfirm'}</p>
        <p className="hero-bubble__bio">{firm.description}</p>

        <div className="hero-bubble__stats">
          <div className="hero-bubble__stat">
            <span className="hero-bubble__stat-val">{firm.rating}</span>
            <span className="hero-bubble__stat-label">Rating</span>
          </div>
          <div className="hero-bubble__stat">
            <span className="hero-bubble__stat-val">{firm.maxAlloc}</span>
            <span className="hero-bubble__stat-label">Max alloc</span>
          </div>
          <div className="hero-bubble__stat">
            <span className="hero-bubble__stat-val">{split.replace(' OFF', '')}</span>
            <span className="hero-bubble__stat-label">Promo</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HeroBubbles() {
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
  const reducedMotion = useReducedMotion();

  const goTo = useCallback(
    i => setActive(prev => (len ? ((i % len) + len) % len : prev)),
    [len]
  );
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (reducedMotion || paused || len < 2) return undefined;
    const id = setInterval(() => setActive(a => (a + 1) % len), 4200);
    return () => clearInterval(id);
  }, [reducedMotion, paused, len]);

  if (!len) return null;

  const slots = [];
  for (let offset = -1; offset <= 1; offset += 1) {
    const index = (active + offset + len) % len;
    const slot = offset === -1 ? 'left' : offset === 0 ? 'center' : 'right';
    slots.push({ firm: featured[index], slot, index });
  }

  // Pad if fewer than 3 firms
  while (slots.length < VISIBLE && featured[0]) {
    slots.push({ firm: featured[0], slot: 'right', index: 0 });
  }

  return (
    <div
      className="hero-bubbles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hero-bubbles__glow" aria-hidden="true" />

      <button
        type="button"
        className="hero-bubbles__nav hero-bubbles__nav--prev"
        onClick={prev}
        aria-label="Previous featured firm"
      >
        <ArrowIcon dir="left" />
      </button>

      <div className="hero-bubbles__stage" role="group" aria-roledescription="carousel" aria-label="Featured prop firms">
        {slots.map(({ firm, slot, index }) => (
          <FirmBubble key={`${slot}-${firm.name}-${index}`} firm={firm} slot={slot} />
        ))}
      </div>

      <button
        type="button"
        className="hero-bubbles__nav hero-bubbles__nav--next"
        onClick={next}
        aria-label="Next featured firm"
      >
        <ArrowIcon dir="right" />
      </button>

      <div className="hero-bubbles__dots" role="tablist" aria-label="Featured firm slides">
        {featured.map((f, i) => (
          <button
            key={f.name}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Show ${f.name}`}
            className={`hero-bubbles__dot${i === active ? ' hero-bubbles__dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
