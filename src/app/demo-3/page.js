import FeaturedFirmsLive from '@/components/FeaturedFirmsLive';
import FirmCompareLive from '@/components/FirmCompareLive';
import { getFirmDetail } from '@/lib/propfirmmap';

export const metadata = {
  title: 'DEGENIE — Live Prop Firm Data (PropFirmMap)',
  description: 'Prop trading firms, ranked live via the PropFirmMap public API.',
};

// Matched from the Kage Instagram promo set — only firms PropFirmMap actually publishes.
// Not found on PropFirmMap (no slug exists): Funding Ticks, Funded Next Futures,
// TickTick Trader, Phidias Propfirm, The Futures Desk, Chronos Funding.
// "Tradeify Crypto" is the same firm as "tradeify" — not a separate slug.
const FIRM_SLUGS = [
  'myfundedfutures',
  'takeprofittrader',
  'tradeify',
  'apextraderfunding',
  'bulenox',
  'propshoptrader',
  'fundedfuturesnetwork',
  'legendstrading',
  'daytraders',
  'purdiacapital',
  'earn2trade',
  'alphafutures',
  'lucidtrading',
  'yrmprop',
  'fxifyfutures',
  'nexgenprotrader',
  'e8markets',
];

function buildRows(details) {
  const rows = [];
  details.forEach(firm => {
    if (!firm) return;
    const promoCode = firm.offers?.[0]?.promo_code ?? null;
    (firm.challenges ?? []).forEach(challenge => {
      rows.push({
        rowId: `${firm.slug}-${challenge.id}`,
        slug: firm.slug,
        name: firm.name,
        logo_url: firm.logo_url,
        country: firm.country,
        asset_type: firm.asset_type,
        propfirmmap_score: firm.propfirmmap_score,
        safety_grade: firm.safety_grade,
        trustpilot: firm.trustpilot,
        payout_frequency: firm.payout_frequency,
        promo_code: promoCode,
        step: challenge.step,
        profit_target: challenge.profit_target,
        max_daily_loss: challenge.max_daily_loss,
        max_total_drawdown: challenge.max_total_drawdown,
        activation_fee: challenge.activation_fee,
        profit_split: challenge.profit_split,
        actual_price: challenge.actual_price,
        before_price: challenge.before_price,
      });
    });
  });
  return rows;
}

export default async function Demo3Page() {
  const details = await Promise.all(FIRM_SLUGS.map(getFirmDetail));
  const firms = details.filter(Boolean);
  const rows = buildRows(firms);

  return (
    <main style={{ minHeight: '100vh', background: '#050308' }}>
      <FeaturedFirmsLive firms={firms} />
      <div style={{ padding: '0 clamp(16px, 3vw, 32px) 80px' }}>
        <FirmCompareLive rows={rows} />
      </div>
    </main>
  );
}
