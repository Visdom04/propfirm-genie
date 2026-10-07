import Link from 'next/link';
import GreenPageShell from '@/components/green/GreenPageShell';
import { FocusWord } from '@/components/green/PfgControls';
import ToolClient from '@/components/tools/ToolClient';

export default function ToolPageView({ tool, firms, initialFirm }) {
  return (
    <GreenPageShell className="pb-24">
      <section className="mx-auto w-full max-w-[1360px] scroll-mt-[calc(var(--pfg-nav-h)+12px)] px-4 pt-5 pb-20 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-6 max-w-2xl">
          <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-[#3FB185]">
            <Link
              href="/tools"
              className="text-[#3FB185] no-underline outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FB185]/80"
            >
              Tools
            </Link>
          </p>
          <h1 className="mb-2 text-[clamp(1.55rem,3.6vw,2.35rem)] font-bold leading-[1.12] tracking-tight text-white">
            <FocusWord>{tool.title}</FocusWord>
          </h1>
          <p className="m-0 text-[0.9375rem] leading-relaxed text-emerald-100/65">{tool.job}</p>
        </header>
        <ToolClient slug={tool.slug} firms={firms} initialFirm={initialFirm} />
      </section>
    </GreenPageShell>
  );
}
