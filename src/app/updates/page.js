import GreenPageShell from '@/components/green/GreenPageShell';
import FinePrintBoard from '@/components/green/FinePrintBoard';
import FinePrintFaq, { faqItems, faqJsonLd } from '@/components/green/FinePrintFaq';
import { STOCK_COVER } from '@/lib/fineprint/coverage';
import { STARTER_PAGES } from '@/lib/fineprint/starter';
import { readChangeLog, readCoverage } from '@/lib/fineprint/store';
import { firmLogo } from '@/lib/firmLogos';
import starterWatch from '@/data/fineprint/starter-watch.json';

const STARTER_FIRMS = [...new Set(STARTER_PAGES.map(page => page.firm))];

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Market intelligence',
  description: 'A command center for tracking prop firm rules, pricing, and payouts.',
};

export default async function UpdatesPage() {
  const [log, cover] = await Promise.all([readChangeLog(), readCoverage()]);
  const watchById = new Map((starterWatch.pages || []).map(page => [page.id, page]));
  const pages = STARTER_PAGES.map(page => {
    const watched = watchById.get(page.id) || {};
    const { source: fetchSource, ...rest } = watched;
    return { ...page, ...rest, source: 'starter', fetchSource };
  });
  const logos = Object.fromEntries(STOCK_COVER.map(item => [item.firm, firmLogo(item.firm)]));
  const cards = log
    .filter(change => change.status === 'published' && STARTER_FIRMS.includes(change.firm))
    .map(change => ({
      ...change,
      trending: Boolean(change.trending),
      logo: logos[change.firm] || firmLogo(change.firm),
    }));

  const faq = faqItems(STARTER_FIRMS);

  return (
    <GreenPageShell className="bg-[#131a18]!">
      <main className="mx-auto w-full max-w-[1520px] px-4 pb-20 pt-0 sm:px-8 lg:px-10 xl:px-12">
        <FinePrintBoard changes={cards} pages={pages} logos={logos} cover={cover} />
        <FinePrintFaq items={faq} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)).replace(/</g, '\\u003c') }} />
      </main>
    </GreenPageShell>
  );
}
