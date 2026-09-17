import GreenPageShell from '@/components/green/GreenPageShell';
import FirmDirectoryTable from '@/components/green/FirmDirectoryTable';
import { FocusWord } from '@/components/green/PfgControls';
import { getRuntimeFirms } from '@/lib/firmPlansSheet';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse Prop Firms',
  description: 'Ratings, platforms, max allocation, and promo codes, listed A to Z.',
};

export default async function FirmsPage() {
  const { firms } = await getRuntimeFirms();
  return (
    <GreenPageShell>
      <section className="pfg-table-page mx-auto w-full max-w-[1440px] px-0 pb-20 pt-10 md:px-4 lg:px-8 max-md:pb-0 max-md:pt-4" id="table-scroll-target">
        <header className="mb-8 text-center max-md:mb-3 max-md:px-3">
          <h1 className="mb-4 text-[clamp(1.85rem,4.4vw,3rem)] font-bold leading-[1.12] tracking-tight text-white max-md:mb-0 max-md:text-[1.45rem]">
            Browse Prop
            <FocusWord>Firms</FocusWord>
          </h1>
          <p className="mx-auto m-0 max-w-xl text-[15px] leading-relaxed text-white/70 max-md:hidden">
            Ratings, platforms, max allocation, and promo codes, listed A to Z.
          </p>
        </header>
        <FirmDirectoryTable firms={firms} />
      </section>
    </GreenPageShell>
  );
}
