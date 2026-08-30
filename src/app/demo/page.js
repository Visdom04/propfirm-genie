import DemoHero from '@/components/DemoHero';
import { BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/brand';

export const metadata = {
  title: `${BRAND_NAME} — Compare Prop Firms & Earn Exclusive Rewards`,
  description: BRAND_DESCRIPTION,
};

export default function DemoPage() {
  return <DemoHero />;
}
