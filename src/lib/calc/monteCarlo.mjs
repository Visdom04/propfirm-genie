function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[i];
}

export function simulateChallenge({
  startBalance,
  risk,
  winRate,
  rewardRatio,
  tradesPerDay,
  profitTarget,
  maxLoss,
  dailyLimit,
  trailing = false,
  tradingDays = 60,
  paths = 500,
  seed = 1,
  profitSplitPct = 80,
  fees = 0,
}) {
  const rand = rng(seed);
  const tpd = Math.max(1, Number(tradesPerDay) || 1);
  const maxTrades = tpd * tradingDays;
  const target = Number(profitTarget) || 0;
  const dd = Number(maxLoss) || 0;
  const daily = Number(dailyLimit) || 0;
  const rr = Number(rewardRatio) || 1;
  const r = Number(risk) || 0;
  const wr = Number(winRate) || 0;

  let passed = 0;
  let blown = 0;
  const nets = [];

  for (let p = 0; p < paths; p += 1) {
    let eq = startBalance;
    let peak = startBalance;
    let dayPnl = 0;
    let tradesToday = 0;
    let fail = false;
    let win = false;
    for (let t = 0; t < maxTrades; t += 1) {
      const pnl = rand() < wr ? r * rr : -r;
      eq += pnl;
      dayPnl += pnl;
      if (eq > peak) peak = eq;
      const floor = trailing ? peak - dd : startBalance - dd;
      if (dd > 0 && eq <= floor) {
        fail = true;
        break;
      }
      if (daily > 0 && dayPnl <= -daily) {
        fail = true;
        break;
      }
      if (target > 0 && eq - startBalance >= target) {
        win = true;
        break;
      }
      tradesToday += 1;
      if (tradesToday >= tpd) {
        tradesToday = 0;
        dayPnl = 0;
      }
    }
    if (fail) blown += 1;
    else if (win) passed += 1;
    const gross = Math.max(0, eq - startBalance);
    const take = gross * ((Number(profitSplitPct) || 0) / 100) - (Number(fees) || 0);
    nets.push(take);
  }

  nets.sort((a, b) => a - b);
  const median = percentile(nets, 50);
  const fee = Number(fees) || 0;
  return {
    paths,
    passRate: passed / paths,
    blowoutRate: blown / paths,
    median,
    p10: percentile(nets, 10),
    p90: percentile(nets, 90),
    feeRoi: fee > 0 ? (median / fee) * 100 : null,
  };
}
