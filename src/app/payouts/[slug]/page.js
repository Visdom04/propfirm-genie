import { notFound } from 'next/navigation';
import GreenPageShell from '@/components/green/GreenPageShell';
import PayoutTracker from '@/components/green/PayoutTracker';
import { payoutFirm } from '@/lib/payouts/catalog';
import { loadSnapshot } from '@/lib/payouts/live';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const firm = payoutFirm(slug);
  if (!firm) return { title: 'Payout tracker' };
  return {
    title: `${firm.name} payouts`,
    description: `${firm.name} payouts read from public blockchains. See how much it pays out, and how often.`,
  };
}

export default async function PayoutFirmPage({ params }) {
  const { slug } = await params;
  const firm = payoutFirm(slug);
  if (!firm) notFound();
  return (
    <GreenPageShell atmosphere={false}>
      <PayoutTracker initial={await loadSnapshot()} firmId={firm.id} />
    </GreenPageShell>
  );
}
