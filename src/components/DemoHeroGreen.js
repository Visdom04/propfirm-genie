'use client';

import FirmCompareDemoGreen from '@/components/FirmCompareDemoGreen';
import './DemoHeroGreen.css';

/** Digi Green demo-2 — compare table only */
export default function DemoHero() {
  return (
    <div className="demo-page demo-page--green demo-page--table-only">
      <div className="demo-aura" aria-hidden="true" />
      <div className="demo-vignette" aria-hidden="true" />
      <div className="demo-stars" aria-hidden="true" />
      <div className="demo-grid" aria-hidden="true" />
      <div className="demo-orb demo-orb--1" aria-hidden="true" />
      <div className="demo-orb demo-orb--2" aria-hidden="true" />
      <div className="demo-orb demo-orb--3" aria-hidden="true" />

      <section className="demo-compare" id="partner-firms" aria-labelledby="demo-compare-title">
        <div className="demo-compare__inner">
          <p className="demo-compare__eyebrow">
            <span className="demo-compare__eyebrow-dot" aria-hidden />
            Verified directory
          </p>
          <h1 id="demo-compare-title" className="demo-compare__title">
            Compare firms
          </h1>
          <p className="demo-compare__sub">
            Side-by-side rules, platforms, allocation, and promos — same layout as our full directory.
          </p>
          <div className="demo-compare__table-zone">
            <FirmCompareDemoGreen />
          </div>
        </div>
      </section>
    </div>
  );
}
