'use client';

import { useEffect, useRef, useState } from 'react';
import GreenPageShell from '@/components/green/GreenPageShell';
import { FocusWord } from '@/components/green/PfgControls';
import { TOOLS } from '@/lib/toolsCatalog';
import FirmPlanPicker from './FirmPlanPicker';
import { Actions, CALC_BODY, PlanFacts } from './calculators';
import { useFirmState } from './useFirmState';
import { Card, CHIP, CHIP_OFF, CHIP_ON, Disclaimer, OverflowRow, PAGE, money } from './ui';

const SESSIONS = 252;

const PACES = [
  { id: 'spark', label: 'Spark', session: 20 },
  { id: 'clip', label: 'Clip', session: 100 },
  { id: 'rent', label: 'Rent', session: 500 },
  { id: 'stack', label: 'Stack', session: 1000 },
  { id: 'scale', label: 'Scale', session: 2500 },
  { id: 'vault', label: 'Vault', session: 5000 },
];

function SessionPaces() {
  return (
    <section aria-label="Session pace rungs">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <p className="m-0 text-[0.875rem] font-medium leading-snug text-emerald-200/70">
          Same clip, 252 sessions. That is the year.
        </p>
        <p className="m-0 hidden text-[0.6875rem] uppercase tracking-[0.14em] text-emerald-200/35 sm:block">
          Session rungs
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6">
        {PACES.map((g, i) => (
          <div
            key={g.id}
            className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#08120e] px-2.5 py-2 sm:px-3 sm:py-2.5"
          >
            <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-[#3FB185]" aria-hidden />
            <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#3FB185]/55" aria-hidden />
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.6875rem] font-semibold tabular-nums text-[#3FB185]/70">0{i + 1}</span>
              <span className="text-[0.75rem] uppercase tracking-wide text-emerald-200/45">{g.label}</span>
            </div>
            <div className="mt-0.5 text-[0.875rem] font-semibold leading-tight text-white">
              {money(g.session, 0)}
              <span className="font-medium text-emerald-200/45">/session</span>
            </div>
            <div className="text-[0.8125rem] tabular-nums leading-tight text-[#3FB185] sm:text-[0.875rem]">
              {money(g.session * SESSIONS, 0)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LazyBody({ eager, children }) {
  const ref = useRef(null);
  const [show, setShow] = useState(eager);

  useEffect(() => {
    if (eager) setShow(true);
  }, [eager]);

  useEffect(() => {
    if (show) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '280px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref}>
      {show ? children : <div className="h-36 rounded-xl bg-white/[0.04]" aria-hidden />}
    </div>
  );
}

export default function CalculatorsSuite({ firms, initialFirm }) {
  const state = useFirmState(firms, initialFirm);
  const [active, setActive] = useState(TOOLS[0].slug);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && TOOLS.some(t => t.slug === hash)) {
      setActive(hash);
      document.getElementById(hash)?.scrollIntoView({ block: 'start' });
    }
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pfg_tools_used', { detail: { slug: 'hub', firm: state.firmSlug } }));
  }, [state.firmSlug]);

  return (
    <GreenPageShell className="pb-16">
      <div className={PAGE}>
        <header className="mb-5 max-w-xl sm:mb-6">
          <h1 className="mb-2 text-[clamp(1.55rem,6vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-white">
            Perp
            <FocusWord>calculators</FocusWord>
          </h1>
          <p className="m-0 text-[0.875rem] leading-snug text-emerald-100/70 sm:text-[0.9375rem] sm:leading-relaxed">
            Size the next perp against this plan’s
            <br className="sm:hidden" /> units, drawdown, and payout.
          </p>
        </header>

        <SessionPaces />

        <div className="mt-5 sm:mt-6">
          <Card className="!px-3 !py-2.5 sm:!px-3.5 sm:!py-2.5">
            {firms.length ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
                  <FirmPlanPicker
                    firms={firms}
                    firmSlug={state.firmSlug}
                    planId={state.plan?.id}
                    custom={state.custom}
                    onFirm={state.onFirm}
                    onPlan={state.onPlan}
                  />
                  <Actions compact firm={state.firm} plan={state.plan} />
                </div>
                <div className="border-t border-white/[0.06] pt-2">
                  <PlanFacts plan={state.plan} verified={state.firm?.lastVerified} />
                </div>
              </div>
            ) : (
              <p className="m-0 text-[0.8125rem] text-emerald-100/70">No firm catalog loaded. Check the sheet sync.</p>
            )}
          </Card>
        </div>
        <nav
          className="sticky top-[var(--pfg-nav-h)] z-20 -mx-3 mt-4 border-b border-white/10 bg-[#0a0f0d]/92 px-3 py-2 backdrop-blur-md sm:mx-0 sm:mt-5 sm:px-1"
          aria-label="Jump to calculator"
        >
          <OverflowRow
            items={TOOLS}
            getKey={t => t.slug}
            moreAria="More calculators"
            render={t => {
              const on = active === t.slug;
              return (
                <a
                  href={`#${t.slug}`}
                  className={`${CHIP} border border-white/10 no-underline ${on ? CHIP_ON : `${CHIP_OFF} bg-[#08120e]`}`}
                  onClick={() => setActive(t.slug)}
                >
                  {t.short || t.title}
                </a>
              );
            }}
          />
        </nav>

        <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:gap-6">
          {TOOLS.map((tool, i) => {
            const Body = CALC_BODY[tool.slug];
            if (!Body) return null;
            return (
              <article
                key={tool.slug}
                id={tool.slug}
                className="min-w-0 scroll-mt-[calc(var(--pfg-nav-h)+3.25rem)] overflow-x-hidden rounded-2xl border border-white/10 bg-[#0c1612]/70 p-3 sm:p-5"
              >
                <header className="mb-3 sm:mb-4">
                  <h2 className="m-0 text-[1.125rem] font-bold tracking-tight text-white sm:text-[1.25rem]">{tool.title}</h2>
                  <p className="mb-0 mt-1 text-[0.875rem] leading-snug text-emerald-100/55 sm:leading-relaxed">{tool.job}</p>
                </header>
                <LazyBody eager={i === 0 || active === tool.slug}>
                  <Body plan={state.plan} custom={state.custom} firms={firms} />
                </LazyBody>
              </article>
            );
          })}
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 p-3.5 sm:mt-8 sm:p-5">
          <h2 className="m-0 text-[1rem] font-bold text-white sm:text-[1.125rem]">Before every trade</h2>
          <ul className="mb-0 mt-2 list-disc space-y-1.5 pl-4 text-[0.875rem] leading-relaxed text-emerald-100/60 sm:text-[0.8125rem]">
            <li>Size off the smaller of daily limit and max drawdown — not the full account.</li>
            <li>Know if drawdown is static, EOD, or trailing, and whether open profit counts.</li>
            <li>Stay inside the plan’s size cap. Wider stop means fewer units.</li>
            <li>Confirm the live rule on the firm dashboard before you click or request a payout.</li>
          </ul>
        </section>

        <div className="mt-6 sm:mt-8">
          <Disclaimer />
        </div>
      </div>
    </GreenPageShell>
  );
}
