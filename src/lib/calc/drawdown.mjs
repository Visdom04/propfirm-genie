export function drawdownFloor({
  startBalance,
  peakBalance,
  maxLoss,
  kind = 'static',
  lockAtStart = false,
}) {
  const start = Number(startBalance) || 0;
  const peak = Number(peakBalance) || start;
  const loss = Number(maxLoss) || 0;
  const isStatic = kind === 'static';
  let floor = isStatic ? start - loss : peak - loss;
  if (lockAtStart) floor = Math.min(floor, start);
  return floor;
}

export function drawdownRoom({
  startBalance,
  peakBalance,
  equity,
  maxLoss,
  dailyLimit,
  todayPnl = 0,
  kind = 'static',
  lockAtStart = false,
  openRisk = 0,
}) {
  const eq = Number(equity) || 0;
  const floor = drawdownFloor({ startBalance, peakBalance, maxLoss, kind, lockAtStart });
  const overall = eq - floor;
  const dailyCap = Number(dailyLimit) || 0;
  const dailyRemaining = dailyCap > 0 ? dailyCap + Math.min(0, Number(todayPnl) || 0) : Infinity;
  const tightest = Math.min(overall, dailyRemaining) - (Number(openRisk) || 0);
  return {
    floor,
    overallRoom: overall,
    dailyRemaining: Number.isFinite(dailyRemaining) ? dailyRemaining : null,
    tightest,
  };
}
