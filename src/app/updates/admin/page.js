import GreenPageShell from '@/components/green/GreenPageShell';
import FinePrintDesk from '@/components/green/FinePrintDesk';
import { STOCK_COVER } from '@/lib/fineprint/coverage';
import { firmLogo } from '@/lib/firmLogos';

const FIRMS = STOCK_COVER.map(item => item.firm);

export const metadata = {
  title: 'News desk',
  description: 'Draft and publish manual Fine Print updates.',
};

export default function UpdatesAdminPage() {
  const logos = Object.fromEntries(FIRMS.map(name => [name, firmLogo(name)]));
  return (
    <GreenPageShell>
      <main className="mx-auto w-full max-w-[960px] px-4 pb-20 pt-8 sm:px-8 max-md:pt-5">
        <FinePrintDesk firms={FIRMS} logos={logos} />
      </main>
    </GreenPageShell>
  );
}
