'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { TOOLS } from '@/lib/toolsCatalog';
import FirmPlanPicker from './FirmPlanPicker';
import { Actions, CALC_BODY } from './calculators';
import { useFirmState } from './useFirmState';
import { CHIP, Disclaimer } from './ui';

const FIRMLESS = new Set(['cheat-sheet', 'dca']);

export default function ToolClient({ slug, firms, initialFirm }) {
  const state = useFirmState(firms, initialFirm);
  const Body = CALC_BODY[slug] || CALC_BODY['position-size'];
  const needsFirm = !FIRMLESS.has(slug);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pfg_tools_used', { detail: { slug, firm: state.firmSlug } }));
  }, [slug, state.firmSlug]);

  if (!firms.length && needsFirm) {
    return <p className="m-0 text-[0.8125rem] text-emerald-100/70">No firm catalog loaded. Check the sheet sync.</p>;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {needsFirm ? (
        <FirmPlanPicker
          firms={firms}
          firmSlug={state.firmSlug}
          planId={state.plan?.id}
          custom={state.custom}
          onFirm={state.onFirm}
          onPlan={state.onPlan}
        />
      ) : null}
      {needsFirm ? <Actions firm={state.firm} plan={state.plan} /> : null}
      <Body plan={state.plan} custom={state.custom} firms={firms} />
      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none" aria-label="Other tools">
        {TOOLS.filter(t => t.slug !== slug).map(t => (
          <Link
            key={t.slug}
            href={state.firm && !state.custom ? `/tools/${t.slug}/${state.firm.slug}` : `/tools/${t.slug}`}
            className={`${CHIP} border border-white/10 bg-transparent text-emerald-100/55 no-underline hover:text-white`}
          >
            {t.short || t.title}
          </Link>
        ))}
      </nav>
      <Disclaimer />
    </div>
  );
}
