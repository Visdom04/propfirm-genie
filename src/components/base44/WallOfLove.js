'use client';

import { useEffect, useRef } from 'react';

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
const COLUMN_DURATIONS = [46, 58, 40];
const COLUMN_DIRECTIONS = ['up', 'down', 'up'];

function splitIntoColumns(items, count) {
  const columns = Array.from({ length: count }, () => []);
  items.forEach((item, i) => columns[i % count].push(item));
  return columns;
}

function TrustpilotStarBox() {
  return (
    <span
      className="inline-flex size-[26px] items-center justify-center rounded-md shadow-[0_2px_8px_rgba(0,182,122,0.35)]"
      style={{ background: 'var(--b44-tp)' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[15px] text-white">
        <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
      </svg>
    </span>
  );
}

function TrustpilotBadge() {
  return (
    <div
      className="mt-0.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5"
      aria-label="Rated 4.9 out of 5 on Trustpilot"
    >
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <TrustpilotStarBox key={i} />
        ))}
      </div>
      <span className="text-base font-bold text-white">4.9 out of 5</span>
      <span
        className="inline-flex items-center gap-1.5 text-[0.95rem] font-bold tracking-tight text-white"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" style={{ color: 'var(--b44-tp)' }}>
          <path d="M12 2l2.35 7.23H22l-6.1 4.43 2.33 7.2L12 17.1l-6.23 4.76 2.33-7.2L2 9.23h7.65L12 2z" />
        </svg>
        Trustpilot
      </span>
    </div>
  );
}

function WallCard({ item, brandName }) {
  return (
    <figure className="relative block w-full min-w-0 shrink-0 isolate overflow-hidden rounded-2xl border border-blue-300/20 border-t-violet-300/25 bg-[rgba(15,15,26,0.55)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_36px_rgba(0,0,0,0.45)] backdrop-blur-[18px] backdrop-saturate-150 transition-[border-color,box-shadow] duration-250 hover:border-purple-300/35">
      <img
        src={item.src}
        alt={`${brandName} trader testimonial screenshot from our Discord community`}
        width={item.width}
        height={item.height}
        className="block h-auto w-full max-w-none"
        loading="lazy"
      />
    </figure>
  );
}

function WallColumn({ items, index, brandName, className = '' }) {
  const looped = [...items, ...items];

  return (
    <div
      className={`b44-wall-col relative h-full min-w-0 overflow-hidden ${className}`}
      style={{
        '--wall-duration': `${COLUMN_DURATIONS[index % COLUMN_DURATIONS.length]}s`,
        '--wall-dir': COLUMN_DIRECTIONS[index % COLUMN_DIRECTIONS.length] === 'down' ? 'reverse' : 'normal',
      }}
    >
      <div className="b44-wall-track flex w-full flex-col gap-4 will-change-transform sm:gap-5">
        {looped.map((item, i) => (
          <WallCard key={`${item.src}-${i}`} item={item} brandName={brandName} />
        ))}
      </div>
    </div>
  );
}

export default function WallOfLove({ brandName = 'Prop Firm Wise' }) {
  const sectionRef = useRef(null);
  const columns = splitIntoColumns(WALL_ITEMS, COLUMN_COUNT);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );

    const grid = section.querySelector('[data-wall-grid]');
    if (grid) io.observe(grid);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="b44-section-wall relative z-[2] w-full"
      id="trader-wall"
      aria-labelledby="wall-title"
    >
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[360px] w-[min(960px,100%)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse 70% 78% at 50% 30%, rgba(59, 130, 246, 0.14) 0%, rgba(91, 33, 182, 0.1) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <header className="relative mb-10 flex flex-col items-center gap-3.5 text-center sm:mb-12">
        <p className="m-0 text-[0.8rem] font-bold tracking-[0.16em] text-indigo-300 uppercase">
          Straight from Discord
        </p>
        <h2
          id="wall-title"
          className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] font-bold tracking-[-0.035em] text-white"
        >
          The <span className="b44-text-headline">Wall of Love</span>
        </h2>
        <TrustpilotBadge />
        <p className="m-0 text-base font-medium text-slate-400/80">
          <strong className="font-extrabold text-white">7,000+</strong> traders use {brandName}
        </p>
      </header>

      <div
        data-wall-grid
        className="b44-wall-mask b44-wall-grid relative grid h-[560px] w-full grid-cols-1 gap-4 opacity-0 sm:h-[620px] sm:grid-cols-2 sm:gap-5 lg:h-[680px] lg:grid-cols-3"
        aria-label="Scrolling trader testimonials"
        aria-live="off"
      >
        <WallColumn items={columns[0]} index={0} brandName={brandName} />
        <WallColumn items={columns[1]} index={1} brandName={brandName} className="hidden sm:block" />
        <WallColumn items={columns[2]} index={2} brandName={brandName} className="hidden lg:block" />
      </div>
    </section>
  );
}
