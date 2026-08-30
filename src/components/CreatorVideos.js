'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import './CreatorVideos.css';

const CHANNEL_URL = 'https://propfirmwise.com';

const VISIBLE_COUNT = 3;

const CREATOR_VIDEOS = [
  {
    id: 'Xtrop27pHAE',
    badge: 'Breakdown',
    badgeTone: 'cyan',
    title: 'Eval psychology under pressure',
    blurb: 'What changes when size steps up — risk, pacing, and passing clean.',
    meta: 'Deep dive',
  },
  {
    id: '00rIVeQypU4',
    badge: 'Playbook',
    badgeTone: 'ice',
    title: 'Payout cadence that actually fits you',
    blurb: 'Matching firm schedules to how you trade and withdraw.',
    meta: 'Guide',
  },
  {
    id: 'uNF5wmV_gA8',
    badge: 'New',
    badgeTone: 'blue',
    title: 'Rules that trip traders first',
    blurb: 'Drawdown, consistency, and the clauses worth reading twice.',
    meta: 'Explainer',
  },
  {
    id: '4wakYmnqjus',
    badge: 'Live Q&A',
    badgeTone: 'violet',
    title: 'Ask-me-anything: firm stack',
    blurb: 'Community questions on stacks, promos, and real-world gotchas.',
    meta: 'AMA',
  },
  {
    id: 'ZeQdC3krHFc',
    badge: 'Tools',
    badgeTone: 'cyan',
    title: 'Screen setup for prop reviews',
    blurb: 'Tabs, checklists, and how we compare firms side by side.',
    meta: 'Workflow',
  },
];

const AUTO_MS = 7000;

const MAX_START = Math.max(0, CREATOR_VIDEOS.length - VISIBLE_COUNT);

function IconArrowUpRight({ className }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

export default function CreatorVideos() {
  const reducedMotion = usePrefersReducedMotion();
  const [page, setPage] = useState(0);
  const [pause, setPause] = useState(false);
  const carouselId = useId();
  const liveRef = useRef(null);

  const goNext = useCallback(() => {
    setPage(p => (p >= MAX_START ? 0 : p + 1));
  }, []);

  const goTo = useCallback(i => {
    const next = Math.max(0, Math.min(MAX_START, i));
    setPage(next);
  }, []);

  useEffect(() => {
    if (reducedMotion || MAX_START === 0) return undefined;
    if (pause) return undefined;
    const id = window.setInterval(goNext, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, pause, goNext]);

  const visible = CREATOR_VIDEOS.slice(page, page + VISIBLE_COUNT);

  useEffect(() => {
    if (!liveRef.current) return;
    liveRef.current.textContent = `Showing videos ${page + 1}–${page + visible.length} of ${CREATOR_VIDEOS.length}`;
  }, [page, visible.length]);

  const dotCount = MAX_START + 1;

  return (
    <section className="creator-videos" id="tools" aria-labelledby="creator-videos-heading">
      <div className="creator-videos__glows" aria-hidden="true">
        <div className="creator-videos__glow creator-videos__glow--a" />
        <div className="creator-videos__glow creator-videos__glow--b" />
      </div>

      <div className="creator-videos__wrap">
        <header className="creator-videos__header">
          <div className="creator-videos__header-copy">
            <div className="creator-videos__eyebrow">
              <span>From the creator</span>
              <span className="creator-videos__eyebrow-dot" />
            </div>
            <h2 id="creator-videos-heading" className="creator-videos__title">
              Prop firm takes you can{' '}
              <span className="creator-videos__title-accent">watch, rewind, apply.</span>
            </h2>
            <p className="creator-videos__lede">
              Breakdowns, rule deep-dives, and live Q&amp;As — same voice as the site, on YouTube.
            </p>
          </div>
          <div className="creator-videos__header-cta">
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="creator-videos__channel-btn"
            >
              Open channel
              <IconArrowUpRight className="creator-videos__channel-btn-icon" />
            </a>
          </div>
        </header>

        <div className="creator-videos__shell">
          <div className="creator-videos__shell-shine" aria-hidden="true" />
          <div className="creator-videos__shell-inner">
            <div className="creator-videos__shell-head">
              <h3 className="creator-videos__shell-title">Featured picks</h3>
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="creator-videos__shell-link"
              >
                <span>View all</span>
                <IconArrowUpRight className="creator-videos__shell-link-icon" />
              </a>
            </div>

            <p ref={liveRef} className="creator-videos__sr-only" aria-live="polite" />

            <div
              id={carouselId}
              className="creator-videos__carousel"
              onMouseEnter={() => setPause(true)}
              onMouseLeave={() => setPause(false)}
              onFocusCapture={() => setPause(true)}
              onBlurCapture={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setPause(false);
              }}
            >
              <ul key={page} className="creator-videos__grid">
                {visible.map((v, i) => (
                  <li
                    key={v.id}
                    className="creator-videos__card"
                    style={
                      reducedMotion
                        ? undefined
                        : { animationDelay: `${0.06 + i * 0.08}s` }
                    }
                  >
                    <article className="creator-videos__card-inner">
                      <div className="creator-videos__media">
                        <span className={`creator-videos__badge creator-videos__badge--${v.badgeTone}`}>
                          {v.badge}
                        </span>
                        <div className="creator-videos__iframe-wrap">
                          <iframe
                            className="creator-videos__iframe"
                            src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`}
                            title={v.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                      </div>
                      <div className="creator-videos__body">
                        <div className="creator-videos__body-top">
                          <div>
                            <h4 className="creator-videos__card-title">{v.title}</h4>
                            <p className="creator-videos__card-blurb">{v.blurb}</p>
                          </div>
                        </div>
                        <div className="creator-videos__body-foot">
                          <span className="creator-videos__meta-pill">
                            <span className="creator-videos__meta-dot" />
                            {v.meta}
                          </span>
                          <a
                            href={`https://www.youtube.com/watch?v=${v.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="creator-videos__text-link"
                          >
                            Open
                            <span className="creator-videos__text-link-icon" aria-hidden>
                              <IconArrowUpRight className="creator-videos__text-link-svg" />
                            </span>
                          </a>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>

            {dotCount > 1 && (
              <div
                className="creator-videos__dots"
                role="tablist"
                aria-label="Video groups"
              >
                {Array.from({ length: dotCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={page === i}
                    aria-controls={carouselId}
                    className={`creator-videos__dot${page === i ? ' creator-videos__dot--active' : ''}`}
                    onClick={() => goTo(i)}
                  >
                    <span className="creator-videos__sr-only">
                      Show videos {i + 1} to {i + VISIBLE_COUNT}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!reducedMotion && dotCount > 1 && (
              <p className="creator-videos__hint" aria-hidden="true">
                Pauses while you hover or focus inside
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
