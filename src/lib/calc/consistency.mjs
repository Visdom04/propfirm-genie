export function consistencyNeeded(bestDay, ruleRatio) {
  const best = Number(bestDay) || 0;
  const rule = Number(ruleRatio) || 0;
  if (best <= 0 || rule <= 0 || rule >= 1) return null;
  return best / rule;
}

export function consistencyCheck({ bestDay, totalProfit, ruleRatio }) {
  const best = Number(bestDay) || 0;
  const total = Number(totalProfit) || 0;
  const rule = Number(ruleRatio) || 0;
  if (rule <= 0 || rule >= 1) {
    return {
      applies: false,
      ratio: null,
      pass: true,
      neededTotal: null,
      stillToEarn: 0,
      maxSafeNextDay: null,
    };
  }
  const neededTotal = consistencyNeeded(best, rule);
  const ratio = total > 0 ? best / total : null;
  const pass = total > 0 && ratio != null && ratio <= rule + 1e-9;
  const stillToEarn = neededTotal == null ? 0 : Math.max(0, neededTotal - total);
  const maxSafeNextDay = total > 0 ? (rule * total) / (1 - rule) : null;
  return { applies: true, ratio, pass, neededTotal, stillToEarn, maxSafeNextDay };
}
