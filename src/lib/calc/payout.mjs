export function payoutTakeHome({ grossProfit, profitSplitPct, activationFee = 0, challengeFee = 0 }) {
  const gross = Number(grossProfit) || 0;
  const split = (Number(profitSplitPct) || 0) / 100;
  const yours = gross * split;
  const firmShare = gross - yours;
  const fees = (Number(activationFee) || 0) + (Number(challengeFee) || 0);
  return {
    yours,
    firmShare,
    fees,
    netAfterFees: yours - fees,
  };
}

export function recoupPayouts(fees, perPayout) {
  const f = Number(fees) || 0;
  const p = Number(perPayout) || 0;
  if (f <= 0) return 0;
  if (p <= 0) return Infinity;
  return Math.ceil(f / p);
}
