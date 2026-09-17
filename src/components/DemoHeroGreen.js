'use client';

import FirmCompareDemoGreen from '@/components/FirmCompareDemoGreen';
import GreenPageShell from '@/components/green/GreenPageShell';
import { FocusWord } from '@/components/green/PfgControls';

/** Digi Green challenges table */
export default function DemoHero({ firms }) {
  return (
    <GreenPageShell>
      <section
        className="pfg-table-page mx-auto w-full max-w-[1600px] px-0 pb-20 pt-10 md:px-4 lg:px-8 max-md:pb-0 max-md:pt-4"
        id="partner-firms"
        aria-labelledby="demo-compare-title"
      >
        <header className="mb-8 text-center max-md:mb-3 max-md:px-3">
          <h1
            id="demo-compare-title"
            className="mb-4 text-[clamp(1.85rem,4.4vw,3rem)] font-bold leading-[1.12] tracking-tight text-white max-md:mb-0 max-md:text-[1.45rem]"
          >
            Compare Prop
            <FocusWord>Challenges</FocusWord>
          </h1>
          <p className="mx-auto m-0 max-w-xl text-[15px] leading-relaxed text-white/70 max-md:hidden">
            Compare challenges by size, steps, drawdown, and KAGE price.
          </p>
        </header>
        <FirmCompareDemoGreen firms={firms} />
      </section>
    </GreenPageShell>
  );
}
