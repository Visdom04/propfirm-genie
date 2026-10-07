import CalculatorsSuite from '@/components/tools/CalculatorsSuite';
import { getRuntimeFirms } from '@/lib/firmPlansSheet';
import { compactToolsFirms } from '@/lib/toolsFirms';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Trading Calculators | ${BRAND_NAME}`,
  description:
    'Free futures and perp calculators for position size, blowout, consistency, growth, DCA, payouts, and challenge ROI — using live prop firm plan rules.',
};

export default async function ToolsPage() {
  const { firms: runtime } = await getRuntimeFirms();
  const firms = compactToolsFirms(runtime);
  return <CalculatorsSuite firms={firms} />;
}
