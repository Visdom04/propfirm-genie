import GreenPageShell from '@/components/green/GreenPageShell';
import FinePrintBoard from '@/components/green/FinePrintBoard';
import { STARTER_PAGES } from '@/lib/fineprint/starter';
import { firmLogo } from '@/lib/firmLogos';
import changes from '@/data/fineprint/changes.json';
import starterWatch from '@/data/fineprint/starter-watch.json';

const STARTER_FIRMS = STARTER_PAGES.map(page => page.firm);

export const metadata = {
  title: 'Fine Print — a changelog for prop firm plans',
  description: `Price, payout, and rule edits from ${STARTER_FIRMS.length} firms, with the old wording kept next to the new.`,
};

export default function UpdatesPage() {
  const watchByFirm = new Map((starterWatch.pages || []).map(page => [page.firm, page]));
  const pages = STARTER_PAGES.map(page => ({
    ...page,
    source: 'starter',
    ...(watchByFirm.get(page.firm) || {}),
  }));
  const logos = Object.fromEntries(STARTER_FIRMS.map(name => [name, firmLogo(name)]));
  const cards = changes
    .filter(change => change.status === 'published' && STARTER_FIRMS.includes(change.firm))
    .map(change => ({ ...change, logo: logos[change.firm] || firmLogo(change.firm) }));

  return (
    <GreenPageShell>
      <main className="mx-auto w-full max-w-[1520px] px-4 pb-20 pt-8 sm:px-8 lg:px-10 xl:px-12 max-md:pt-5">
        <header className="mb-8 max-w-3xl max-md:mb-6">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ddec4]">Fine Print</p>
          <h1 className="mb-3 mt-3 text-[clamp(1.55rem,3.4vw,2.15rem)] font-bold leading-[1.2] tracking-tight">
            A changelog for prop firm plans.
          </h1>
          <p className="m-0 max-w-[40rem] text-[1rem] leading-relaxed text-[#c5e6d6]/80">
            Price, payout, and rule edits from {STARTER_FIRMS.length} firms. We keep the old line next to the new one,
            and only publish when that new line is still on the firm’s own page.
          </p>
        </header>
        <FinePrintBoard changes={cards} pages={pages} logos={logos} />
      </main>
    </GreenPageShell>
  );
}
