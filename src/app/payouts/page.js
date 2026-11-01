import GreenPageShell from '@/components/green/GreenPageShell';
import PayoutTracker from '@/components/green/PayoutTracker';
import { loadSnapshot } from '@/lib/payouts/live';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Payout tracker',
  description: 'Prop firm payouts read from public blockchains. See how much each firm pays out, and how often.',
};

export default async function PayoutsPage() {
  return (
    <GreenPageShell atmosphere={false}>
      <PayoutTracker initial={await loadSnapshot()} />
    </GreenPageShell>
  );
}
