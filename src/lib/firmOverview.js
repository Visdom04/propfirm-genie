import { categoryBucket, newsLabel, parseMoney, discountBadge } from '@/lib/compareHighlights';

function uniq(list) {
  return [...new Set(list.filter(v => v != null && String(v).trim() !== ''))];
}

function moneyLabel(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Number.isInteger(n)) return `$${n.toLocaleString('en-US')}`;
  return `$${n.toFixed(2)}`;
}

function rangeLabel(nums, fmt = moneyLabel) {
  const clean = nums.filter(n => n != null && Number.isFinite(n));
  if (!clean.length) return '—';
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  if (min === max) return fmt(min);
  return `${fmt(min)}–${fmt(max)}`;
}

function sizeRank(raw) {
  const n = Number(String(raw || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function activationDollars(raw) {
  const s = String(raw || '').trim();
  if (!s || /^none$/i.test(s) || s === '—' || s === '-') return 0;
  const m = s.replace(/,/g, '').match(/([\d]+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function salePrice(plan, applyDiscount) {
  const sale = Number(plan?.price) || 0;
  const list = Number(plan?.priceWas || plan?.listPrice) || 0;
  if (!applyDiscount && list > sale) return list;
  return sale;
}

function listPrice(plan) {
  const was = Number(plan?.priceWas);
  const list = Number(plan?.listPrice);
  if (Number.isFinite(was) && was > 0) return was;
  if (Number.isFinite(list) && list > 0) return list;
  return Number(plan?.price) || 0;
}

function compactPayout(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/every\s*1\s*day|daily/i.test(s)) return 'Daily';
  const m = s.match(/every\s+(\d+)\s*days?/i);
  if (m) return `Every ${m[1]} days`;
  if (s.length > 42) return `${s.slice(0, 38).trim()}…`;
  return s;
}

/** One overview row per firm, rolled up from its plans. */
export function summarizeFirm(firm, { applyDiscount = true } = {}) {
  const plans = firm?.plans || [];
  const comingSoon = Boolean(firm?.comingSoon) && !plans.length;
  const challenge = plans.filter(p => categoryBucket(p) === 'Challenge');
  const s2f = plans.filter(p => categoryBucket(p) === 'S2F');
  const priced = [...challenge, ...plans].filter(p => Number(p.price) > 0);
  const cheapest = priced.reduce((best, p) => {
    const a = salePrice(p, applyDiscount);
    const b = best ? salePrice(best, applyDiscount) : Infinity;
    return a < b ? p : best;
  }, null);

  const evalPlan = (challenge.length ? challenge : priced).reduce((best, p) => {
    const a = salePrice(p, applyDiscount);
    const b = best ? salePrice(best, applyDiscount) : Infinity;
    return a < b ? p : best;
  }, null);

  const sizes = uniq((firm.accountSizes || []).concat(plans.map(p => p.accountSize))).sort(
    (a, b) => sizeRank(a) - sizeRank(b)
  );
  const sizeLabel = sizes.length
    ? sizes[0] === sizes[sizes.length - 1]
      ? String(sizes[0]).replace(/^\$/, '')
      : `${String(sizes[0]).replace(/^\$/, '')}–${String(sizes[sizes.length - 1]).replace(/^\$/, '')}`
    : '—';

  const evalPrice = evalPlan ? salePrice(evalPlan, applyDiscount) : null;
  const evalWas = evalPlan ? listPrice(evalPlan) : null;
  const act = evalPlan ? activationDollars(evalPlan.activationFee) : null;
  const allIn = evalPrice != null && act != null ? evalPrice + act : evalPrice;

  const newsValues = uniq(plans.map(p => newsLabel(p.newsTrading)));
  const news =
    !newsValues.length || newsValues.every(v => v === '—')
      ? '—'
      : newsValues.every(v => v === 'Allowed')
        ? 'Allowed'
        : newsValues.every(v => v === 'Not Allowed')
          ? 'Not Allowed'
          : 'Varies';

  const splits = uniq(
    plans.map(p => (typeof p.profitSplit === 'number' ? `${p.profitSplit}%` : null))
  );
  const drawdowns = uniq(plans.map(p => p.maxLossType));
  const activations = uniq(plans.map(p => (p.activationFee && p.activationFee !== 'None' ? p.activationFee : 'None')));
  const payouts = uniq(plans.map(p => compactPayout(p.payoutFreq))).filter(Boolean);
  const minDays = plans.map(p => p.minTradingDays).filter(d => d != null);
  const maxLosses = plans.map(p => parseMoney(p.maxLoss)).filter(n => n != null);
  const types = uniq(plans.map(p => p.planType));
  const badge = discountBadge(firm, cheapest);

  return {
    firm,
    comingSoon,
    planCount: plans.length,
    sizeLabel,
    sizes,
    platforms: firm.platforms || [],
    types,
    straightToFunded: s2f.length > 0,
    evalPrice,
    evalWas,
    evalPlan,
    activationLabel:
      !activations.length || activations.every(v => v === 'None')
        ? 'None'
        : activations.length === 1
          ? activations[0]
          : 'Varies',
    allIn,
    allInNote: act == null && evalPrice != null ? 'Eval only' : null,
    drawdownLabel: drawdowns.length ? drawdowns.join(' · ') : '—',
    maxLossLabel: rangeLabel(maxLosses),
    daysToPass: minDays.length ? rangeLabel(minDays, n => (n === 1 ? '1 day' : `${n} days`)) : '—',
    news,
    maxAccounts: firm.maxAccounts || '—',
    profitSplit: splits.length ? splits.join(' · ') : '—',
    payoutLabel: payouts.length ? payouts.slice(0, 2).join(' · ') : '—',
    discountLabel: badge ? `${badge.replace('-', '')} OFF` : firm.discount || '—',
    cheapest,
    fromPrice: cheapest ? salePrice(cheapest, applyDiscount) : null,
    fromWas: cheapest ? listPrice(cheapest) : null,
    promoCode: cheapest?.promoCode || firm.promoCode || 'KAGE',
    website: firm.affiliateLink || (firm.website ? `https://${String(firm.website).replace(/^https?:\/\//, '')}` : ''),
  };
}
