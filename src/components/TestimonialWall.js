'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { BRAND_NAME } from '@/lib/brand';
import './TestimonialWall.css';

const WALL_ITEMS = [
  { src: '/testimonials/wall-07.png', width: 2001, height: 1113 },
  { src: '/testimonials/wall-11.png', width: 1867, height: 877 },
  { src: '/testimonials/wall-01.png', width: 1887, height: 489 },
  { src: '/testimonials/wall-04.png', width: 1850, height: 1063 },
  { src: '/testimonials/wall-14.png', width: 939, height: 953 },
  { src: '/testimonials/wall-08.png', width: 2053, height: 1092 },
  { src: '/testimonials/wall-02.png', width: 1445, height: 899 },
  { src: '/testimonials/wall-13.png', width: 1948, height: 1011 },
  { src: '/testimonials/wall-09.png', width: 1613, height: 826 },
  { src: '/testimonials/wall-05.png', width: 1324, height: 1060 },
  { src: '/testimonials/wall-15.png', width: 2035, height: 962 },
  { src: '/testimonials/wall-03.png', width: 1909, height: 1014 },
  { src: '/testimonials/wall-10.png', width: 1617, height: 1070 },
  { src: '/testimonials/wall-06.png', width: 1419, height: 969 },
  { src: '/testimonials/wall-12.png', width: 1832, height: 1065 },
];

const COLUMN_COUNT = 3;
const COLUMN_DURATIONS = [46, 58, 40]; // seconds — deliberately mismatched so columns drift out of sync
const COLUMN_DIRECTIONS = ['up', 'down', 'up'];

function splitIntoColumns(items, count) {
  const columns = Array.from({ length: count }, () => []);
  items.forEach((item, i) => columns[i % count].push(item));
  return columns;
}

function TrustpilotStarBox() {
  return (
    <span className="wall-tp-star-box" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
      </svg>
    </span>
  );
}

function TrustpilotBadge() {
  return (
    <div className="wall-trust" aria-label="Rated 4.9 out of 5 on Trustpilot">
      <div className="wall-trust__stars">
        {Array.from({ length: 5 }, (_, i) => (
          <TrustpilotStarBox key={i} />
        ))}
      </div>
      <span className="wall-trust__score">4.9 out of 5</span>
      <span className="wall-trust__logo" aria-hidden="true">
        <svg className="wall-trust__logo-star" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
        </svg>
        Trustpilot
      </span>
    </div>
  );
}

function WallCard({ item }) {
  return (
    <figure className="wall-card">
      <Image
        src={item.src}
        alt={`${BRAND_NAME} trader testimonial screenshot from our Discord community`}
        width={item.width}
        height={item.height}
        sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 34vw"
        className="wall-card__img"
        loading="lazy"
      />
    </figure>
  );
}

function WallColumn({ items, index }) {
  const looped = [...items, ...items];
  return (
    <div
      className={`wall-col wall-col--${index}`}
      style={{
        '--wall-duration': `${COLUMN_DURATIONS[index % COLUMN_DURATIONS.length]}s`,
        '--wall-dir': COLUMN_DIRECTIONS[index % COLUMN_DIRECTIONS.length] === 'down' ? 'reverse' : 'normal',
      }}
    >
      <div className="wall-col__track">
        {looped.map((item, i) => (
          <WallCard key={`${item.src}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialWall() {
  const sectionRef = useRef(null);
  const columns = splitIntoColumns(WALL_ITEMS, COLUMN_COUNT);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="wall-section" id="trader-wall" aria-labelledby="wall-title">
      <div className="wall-section__glow" aria-hidden="true" />

      <div className="wall-inner">
        <header className="wall-head">
          <p className="wall-eyebrow">Straight from Discord</p>
          <h2 id="wall-title" className="wall-title">
            The <span className="wall-title__accent">Wall of Love</span>
          </h2>
          <TrustpilotBadge />
          <p className="wall-stat">
            <strong>7,000+</strong> traders use {BRAND_NAME}
          </p>
        </header>

        <div className="wall-grid" aria-label="Scrolling trader testimonials" aria-live="off">
          {columns.map((items, i) => (
            <WallColumn key={i} items={items} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
