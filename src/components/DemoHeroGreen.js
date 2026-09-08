'use client';

import FirmCompareDemoGreen from '@/components/FirmCompareDemoGreen';
import GreenPageShell from '@/components/green/GreenPageShell';
import { FocusWord } from '@/components/green/PfgControls';

/** Digi Green demo-2 — compare table only */
export default function DemoHero() {
  return (
    <GreenPageShell>
      <section
        className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 sm:px-6 lg:px-8"
        id="partner-firms"
        aria-labelledby="demo-compare-title"
      >
        <header className="mb-8 text-center">
          <h1
            id="demo-compare-title"
            className="mb-4 text-[clamp(1.85rem,4.4vw,3rem)] font-bold leading-[1.12] tracking-tight text-white"
          >
            Compare Prop
            <FocusWord>Firms</FocusWord>
          </h1>
          <p className="mx-auto m-0 max-w-xl text-[15px] leading-relaxed text-white/70">
            Filter challenges by size, steps, and price — rules, drawdown, and promos in one table.
          </p>
        </header>
        <FirmCompareDemoGreen />
      </section>
    </GreenPageShell>
  );
}
