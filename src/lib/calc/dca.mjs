function addForLevel(mode, level) {
  if (mode === 'aggressive') return level + 1;
  if (mode === 'pyramid') return Math.ceil((level + 1) / 2);
  if (mode === 'moderate') return level % 2 === 0 ? 1 : 0;
  return 1;
}

export function dcaLadder({
  entry,
  intervalPts,
  direction = 'long',
  levels,
  mode = 'conservative',
  pointValue,
  startContracts = 1,
  maxRisk = Infinity,
}) {
  const dir = direction === 'short' ? 1 : -1;
  const rows = [];
  let total = 0;
  let costPts = 0;
  const cap = Number.isFinite(Number(levels)) ? Math.max(0, Number(levels)) : 0;
  for (let i = 0; i <= cap; i += 1) {
    const add = i === 0 ? startContracts : addForLevel(mode, i);
    if (add <= 0) continue;
    const price = entry + dir * intervalPts * i;
    const nextTotal = total + add;
    const nextCost = costPts + price * add;
    const avg = nextCost / nextTotal;
    const risk = Math.abs(entry - avg) * nextTotal * pointValue;
    if (i > 0 && risk > maxRisk) break;
    total = nextTotal;
    costPts = nextCost;
    rows.push({
      level: i === 0 ? 'Entry' : `DCA ${i}`,
      price,
      add,
      total,
      avg,
      dollarsPerPt: total * pointValue,
      risk,
    });
  }
  const first = rows[0];
  const last = rows[rows.length - 1];
  const dropPts = first && last ? Math.abs(first.price - last.price) : 0;
  const bePts = last ? Math.abs(last.price - last.avg) : 0;
  return {
    rows,
    total: last?.total || 0,
    avg: last?.avg || entry,
    atRisk: last?.risk || 0,
    dollarsPerPt: last?.dollarsPerPt || 0,
    dropPts,
    bePts,
    recovery: bePts > 0 ? dropPts / bePts : 0,
    levelsUsed: Math.max(0, rows.length - 1),
  };
}

export function dcaTakeProfit(ladder, takeProfitPts) {
  const tp = Number(takeProfitPts) || 0;
  const dollars = tp * (ladder.dollarsPerPt || 0);
  const risk = ladder.atRisk || 0;
  return {
    profit: dollars,
    rewardRatio: risk > 0 ? dollars / risk : 0,
  };
}
