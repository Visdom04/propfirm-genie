import { redirect } from 'next/navigation';
import FinePrintDesk from '@/components/green/FinePrintDesk';
import { currentAdmin } from '@/lib/fineprint/admin';
import { STOCK_COVER } from '@/lib/fineprint/coverage';
import { UNWATCHABLE } from '@/lib/fineprint/starter';
import { readChangeLog, readCoverage, readWatch, storeMode } from '@/lib/fineprint/store';
import { firmLogo } from '@/lib/firmLogos';

const FIRMS = STOCK_COVER.map(item => item.firm);

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Market intelligence admin',
  robots: { index: false, follow: false },
};

export default async function UpdatesAdminPage() {
  const admin = await currentAdmin();
  if (!admin) redirect('/login?next=/updates/admin');
  const logos = Object.fromEntries(FIRMS.map(name => [name, firmLogo(name)]));
  const [queue, cover, watch, mode] = await Promise.all([
    readChangeLog({ includeHidden: true }),
    readCoverage(),
    readWatch(),
    storeMode(),
  ]);
  return (
    <FinePrintDesk
      firms={FIRMS}
      logos={logos}
      queue={queue}
      cover={cover}
      watch={watch}
      unwatchable={UNWATCHABLE}
      mode={mode}
      admin={admin.email}
    />
  );
}
