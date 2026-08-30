import CompareFirmsH2H from '@/components/compare/CompareFirmsH2H';
import { getRuntimeFirms } from '@/lib/firmPlansSheet';
import { slugify } from '@/lib/firmsApi';
import { BRAND_NAME } from '@/lib/brand';

export const metadata = {
  title: `Compare Prop Firms Side by Side | ${BRAND_NAME}`,
  description:
    'Head-to-head prop firm comparison. Pick two firms, account types, and sizes — see costs, drawdowns, profit splits, and rules with per-row highlights.',
};

function toCompareFirm(firm) {
  return {
    slug: slugify(firm.name),
    name: firm.name,
    logo: firm.logo,
    discount: firm.discount,
    promoCode: firm.promoCode,
    affiliateLink: firm.affiliateLink,
    platforms: firm.platforms || [],
    isPopular: Boolean(firm.isPopular),
    plans: (firm.plans || []).map(p => ({
      id: p.id,
      planType: p.planType,
      accountSize: p.accountSize,
      accountCategory: p.accountCategory,
      steps: p.steps,
      activationFee: p.activationFee,
      maxLots: p.maxLots,
      profitTarget: p.profitTarget,
      maxLoss: p.maxLoss,
      maxLossType: p.maxLossType,
      profitSplit: p.profitSplit,
      ...('dailyDrawdown' in p ? { dailyDrawdown: p.dailyDrawdown } : {}),
      ...('minTradingDays' in p ? { minTradingDays: p.minTradingDays } : {}),
      ...('newsTrading' in p ? { newsTrading: p.newsTrading } : {}),
      consistencyEval: p.consistencyEval,
      consistencyFunded: p.consistencyFunded,
      payoutFreq: p.payoutFreq,
      popularity: p.popularity,
      price: p.price,
      priceWas: p.priceWas,
      ...('listPrice' in p ? { listPrice: p.listPrice } : {}),
      ...('discountPct' in p ? { discountPct: p.discountPct } : {}),
      promoCode: p.promoCode || firm.promoCode,
    })),
  };
}

function buildPopularPairs(firms) {
  const popular = firms.filter(f => f.isPopular).slice(0, 6);
  const pool = popular.length >= 2 ? popular : firms.slice(0, 6);
  const pairs = [];
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      pairs.push({
        a: pool[i].slug,
        b: pool[j].slug,
        label: `${pool[i].name} vs ${pool[j].name}`,
      });
      if (pairs.length >= 8) return pairs;
    }
  }
  return pairs;
}

export default async function CompareFirmsPage() {
  const { firms: runtimeFirms } = await getRuntimeFirms();
  const firms = runtimeFirms
    .filter(f => (f.plans || []).length > 0)
    .map(toCompareFirm)
    .sort((a, b) => a.name.localeCompare(b.name));

  const popularPairs = buildPopularPairs(firms);

  return <CompareFirmsH2H firms={firms} popularPairs={popularPairs} />;
}
