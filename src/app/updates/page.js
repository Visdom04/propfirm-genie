import GreenPageShell from '@/components/green/GreenPageShell';
import FinePrintBoard from '@/components/green/FinePrintBoard';
import { STOCK_COVER } from '@/lib/fineprint/coverage';
import { STARTER_PAGES } from '@/lib/fineprint/starter';
import { firmLogo } from '@/lib/firmLogos';
import changes from '@/data/fineprint/changes.json';
import demoChanges from '@/data/fineprint/demo-changes.json';
import starterWatch from '@/data/fineprint/starter-watch.json';

const STARTER_FIRMS = [...new Set(STARTER_PAGES.map(page => page.firm))];

export const metadata = {
  title: 'Market intelligence',
  description: 'A command center for tracking prop firm rules, pricing, and payouts.',
};

export default function UpdatesPage() {
  const watchById = new Map((starterWatch.pages || []).map(page => [page.id, page]));
  const pages = STARTER_PAGES.map(page => {
    const watched = watchById.get(page.id) || {};
    const { source: fetchSource, ...rest } = watched;
    return { ...page, ...rest, source: 'starter', fetchSource };
  });
  const logos = Object.fromEntries(STOCK_COVER.map(item => [item.firm, firmLogo(item.firm)]));
  const cards = [...demoChanges, ...changes]
    .filter(change => change.status === 'published' && STARTER_FIRMS.includes(change.firm))
    .map(change => ({ ...change, logo: logos[change.firm] || firmLogo(change.firm) }));

  return (
    <GreenPageShell>
      <main className="mx-auto w-full max-w-[1520px] px-4 pb-20 pt-8 sm:px-8 lg:px-10 xl:px-12 max-md:pt-5">
        <header className="mb-8 max-w-3xl max-md:mb-6">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ddec4]">Market intelligence</p>
          <h1 className="mb-3 mt-3 text-[clamp(1.55rem,3.4vw,2.15rem)] font-bold leading-[1.2] tracking-tight">
            Stay ahead of every change.
          </h1>
          <p className="m-0 max-w-[40rem] text-[1rem] leading-relaxed text-[#c5e6d6]/80">
            A command center for tracking prop firm rules, pricing, and payouts.
          </p>
        </header>
        <FinePrintBoard changes={cards} pages={pages} logos={logos} />
      </main>
    </GreenPageShell>
  );
}
