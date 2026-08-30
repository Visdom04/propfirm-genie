'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import anime from 'animejs';
import './HowItWorks.css';

const STEPS = [
  {
    number: '1',
    title: 'Competitive Program Pricing',
    desc: "We operate with complete transparency so you always know exactly what's expected—and what you can earn.",
  },
  {
    number: '2',
    title: 'Trusted Payout Assurance',
    desc: 'Select a funding plan that fits your trading style. No hidden fees, no restrictions, and lifetime durations.',
  },
  {
    number: '3',
    title: 'Fair & Transparent Rules',
    desc: 'Select a funding plan that fits your trading style. No hidden fees, no restrictions, and lifetime durations.',
  },
];

function CheckBadge() {
  return (
    <div className="hiw-node">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M4.5 7.2l1.8 1.8 3.4-3.6"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const connectorRef = useRef(null);
  const cardsRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const els = [titleRef.current, subRef.current, connectorRef.current].filter(Boolean);
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
    });

    cardsRef.current?.querySelectorAll('.hiw-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
    });

    return () => {
      els.forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
      });
      cardsRef.current?.querySelectorAll('.hiw-card').forEach(el => {
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
        tl.add({ targets: titleRef.current, opacity: [0, 1], translateY: [24, 0], duration: 720 });
      }
      if (subRef.current) {
        tl.add({ targets: subRef.current, opacity: [0, 1], translateY: [18, 0], duration: 600 }, '-=520');
      }
      if (connectorRef.current) {
        tl.add({ targets: connectorRef.current, opacity: [0, 1], translateY: [16, 0], duration: 680 }, '-=440');
      }
      const cards = cardsRef.current?.querySelectorAll('.hiw-card');
      if (cards?.length) {
        tl.add(
          {
            targets: cards,
            opacity: [0, 1],
            translateY: [28, 0],
            duration: 700,
            delay: anime.stagger(100),
          },
          '-=380',
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
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="hiw-section" aria-labelledby="hiw-title">
      <div className="hiw-inner">
        <header className="hiw-head">
          <h2 id="hiw-title" ref={titleRef} className="hiw-title">
            How It Works
          </h2>
          <p ref={subRef} className="hiw-sub">
            Experience a seamless journey from evaluation to real capital—crafted for traders who demand
            excellence.
          </p>
        </header>

        <div className="hiw-stage">
          <div ref={connectorRef} className="hiw-connector" aria-hidden>
            <div className="hiw-connector__rail">
              <span className="hiw-connector__rail-glow" />
            </div>
            <div className="hiw-connector__drops">
              {STEPS.map(step => (
                <div key={step.number} className="hiw-connector__drop">
                  <span className="hiw-connector__stem" />
                  <CheckBadge />
                </div>
              ))}
            </div>
          </div>

          <div ref={cardsRef} className="hiw-cards" role="list">
            {STEPS.map(step => (
              <article key={step.number} role="listitem" className="hiw-card">
                <span className="hiw-card__ghost" aria-hidden>
                  {step.number}
                </span>
                <h3 className="hiw-card__title">{step.title}</h3>
                <p className="hiw-card__desc">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
