export function breakevenWinRate(rewardRatio) {
  const rr = Number(rewardRatio) || 0;
  if (rr <= 0) return 1;
  return 1 / (1 + rr);
}

export function expectedValue({ winRate, rewardRatio, risk }) {
  const wr = Number(winRate) || 0;
  const rr = Number(rewardRatio) || 0;
  const r = Number(risk) || 0;
  return wr * rr * r - (1 - wr) * r;
}

export function projectGrowth({
  startBalance,
  risk,
  winRate,
  rewardRatio,
  tradesPerDay,
  compound = false,
  days = [1, 21, 63, 252],
}) {
  const start = Number(startBalance) || 0;
  const ev = expectedValue({ winRate, rewardRatio, risk });
  const tpd = Number(tradesPerDay) || 0;
  return days.map(d => {
    const trades = tpd * d;
    let balance = start;
    if (compound && start > 0 && risk > 0) {
      const riskPct = risk / start;
      const evPct = expectedValue({ winRate, rewardRatio, risk: riskPct });
      balance = start * (1 + evPct) ** trades;
    } else {
      balance = start + ev * trades;
    }
    return {
      days: d,
      trades,
      balance,
      profit: balance - start,
      pct: start ? ((balance - start) / start) * 100 : 0,
    };
  });
}
