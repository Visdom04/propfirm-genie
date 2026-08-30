'use client';

import { useId } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How fast are payouts?',
    a: 'Payout speed depends on the firm you choose. Prop Firm Wise surfaces each partner’s payout cadence up front — weekly, bi-weekly, or monthly — so you can match firms to how you actually trade and withdraw.',
  },
  {
    q: 'What is a prop firm?',
    a: 'A proprietary trading firm provides capital so you can trade their money instead of risking only your own. You typically pass an evaluation that proves risk discipline; if you meet the rules, you keep a share of profits while the firm carries most of the capital risk.',
  },
  {
    q: 'How does Prop Firm Wise pick a match?',
    a: 'You tell us your budget, drawdown comfort, payout cadence, markets, and account size. We score firms against those preferences and surface options that fit — so you spend less time reading fine print and more time comparing real trade-offs.',
  },
  {
    q: 'Are your firm profiles and rankings unbiased?',
    a: 'We aggregate public rules, fees, and platform details and update them on a regular cadence. When we highlight a firm, it is based on fit to your filters and transparent criteria — not a hidden pay-to-rank list.',
  },
  {
    q: 'What is the difference between evaluation and funded?',
    a: 'Evaluation (or challenge) is the trial phase where you prove you can follow drawdown and consistency rules. Funded is the live allocation stage after you pass — payouts and scaling rules are spelled out in each firm’s doc; always verify on the firm’s official site before you buy.',
  },
  {
    q: 'Do you execute trades or hold my capital?',
    a: 'No. Prop Firm Wise is a discovery and comparison layer. You open accounts and pay evaluation fees directly with the firms you choose. We don’t custody funds or place trades on your behalf.',
  },
];

export default function FAQSection({ supportHref = '/Support' }) {
  const baseId = useId();

  return (
    <section
      className="b44-section-faq relative z-[2] w-full"
      id="faq"
      aria-labelledby="demo-faq-title"
    >
      <div
        className="pointer-events-none absolute top-[8%] left-1/2 h-[260px] w-[min(900px,100%)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse 72% 80% at 50% 38%, rgba(91, 33, 182, 0.16) 0%, rgba(59, 130, 246, 0.1) 38%, rgba(30, 58, 138, 0.05) 55%, transparent 72%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex w-full flex-col gap-10 sm:gap-12">
        <header className="text-center">
          <h2
            id="demo-faq-title"
            className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] font-bold tracking-[-0.035em] text-white"
          >
            Frequently Asked Questions?
          </h2>
          <p className="mt-4 mb-0 text-[clamp(1.35rem,2.5vw,1.85rem)] leading-[1.2] font-bold tracking-[-0.03em] text-white/95">
            We&apos;ve got <span className="b44-text-headline">answers</span>
          </p>
        </header>

        <div className="flex w-full flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.q}
              className="group relative isolate overflow-hidden rounded-2xl border border-[rgba(199,160,255,0.16)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-[24px] backdrop-saturate-165 transition-[border-color,box-shadow] duration-300 open:border-[rgba(199,160,255,0.38)] open:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(168,85,247,0.14),0_0_32px_rgba(124,58,237,0.14),0_16px_40px_rgba(0,0,0,0.32)] hover:not-open:border-[rgba(199,160,255,0.28)]"
              name="demo-faq"
              open={index === 0}
            >
              <div className="b44-glass-faq pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-65" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-white/[0.03]" aria-hidden="true" />

              <summary className="relative z-[1] flex cursor-pointer list-none items-center justify-between gap-4 bg-transparent px-5 py-5 select-none sm:gap-5 sm:px-6 sm:py-[22px] [&::-webkit-details-marker]:hidden">
                <span
                  className="flex-1 text-left text-[1.02rem] leading-[1.4] font-semibold tracking-[-0.02em] text-white sm:text-[1.1rem] group-open:font-bold"
                  id={`${baseId}-q-${index}`}
                >
                  {item.q}
                </span>
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-[0_3px_14px_rgba(99,102,241,0.38)] transition-[transform,box-shadow] duration-200 group-open:from-[#5b5ef7] group-open:to-indigo-300 sm:size-9"
                  aria-hidden="true"
                >
                  <span className="relative size-[13px]">
                    <span className="absolute top-1/2 left-1/2 h-0.5 w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white" />
                    <span className="absolute top-1/2 left-1/2 h-[13px] w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:scale-y-0 group-open:opacity-0" />
                  </span>
                </span>
              </summary>

              <div
                className="relative z-[1] px-5 pb-5 sm:px-6 sm:pb-6"
                role="region"
                aria-labelledby={`${baseId}-q-${index}`}
              >
                <p className="m-0 max-w-[72ch] pt-0.5 text-[0.95rem] leading-[1.7] font-normal text-slate-400/90">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>

        <p className="m-0 text-center text-[0.9rem] leading-[1.55] text-slate-500/90">
          Still stuck?{' '}
          <a
            href={supportHref}
            className="border-b border-indigo-400/35 font-semibold text-indigo-300 no-underline transition-[color,border-color] duration-200 hover:border-indigo-300/55 hover:text-indigo-100"
          >
            Open the help center
          </a>{' '}
          or compare live rules in the table above.
        </p>
      </div>
    </section>
  );
}
