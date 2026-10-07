import { slugify } from '@/lib/firmsApi';
import { firmLogo } from '@/lib/firmLogos';
import { listPriceOf, salePriceOf } from '@/lib/planPrice';
import { parseAccountDollars, parseFeeDollars } from '@/lib/calc/parsePlan';
import { parseMoney } from '@/lib/compareHighlights';

export function compactToolsFirms(runtimeFirms) {
  return (runtimeFirms || [])
    .filter(f => (f.plans || []).length > 0)
    .map(firm => ({
      slug: slugify(firm.name),
      name: firm.name,
      logo: firmLogo(firm.name, firm.logo),
      lastVerified: firm.lastVerified || null,
      affiliateLink: firm.affiliateLink || '',
      promoCode: firm.promoCode || '',
      plans: (firm.plans || []).map(p => ({
        id: p.id,
        planType: p.planType,
        accountSize: p.accountSize,
        accountDollars: parseAccountDollars(p.accountSize),
        maxLoss: parseMoney(p.maxLoss),
        maxLossType: p.maxLossType || '',
        dailyDrawdown: p.dailyDrawdown == null || p.dailyDrawdown === '' ? null : Number(p.dailyDrawdown) || parseMoney(p.dailyDrawdown),
        maxLots: p.maxLots || '',
        profitTarget: parseMoney(p.profitTarget),
        profitSplit: Number(p.profitSplit) || 0,
        activationFee: parseFeeDollars(p.activationFee),
        consistencyEval: p.consistencyEval,
        consistencyFunded: p.consistencyFunded,
        payoutFreq: p.payoutFreq || '',
        minTradingDays: p.minTradingDays,
        price: salePriceOf(p),
        listPrice: listPriceOf(p),
      })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
