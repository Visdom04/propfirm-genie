export function bustSeverity(consecutiveToBust) {
  const n = Number(consecutiveToBust) || 0;
  if (n >= 20) return 'Conservative';
  if (n >= 10) return 'Moderate';
  if (n >= 5) return 'Aggressive';
  return 'Fragile';
}

export function lossesUntilBust(room, riskPerTrade) {
  const r = Number(riskPerTrade) || 0;
  const roomNum = Number(room) || 0;
  if (r <= 0 || roomNum <= 0) return 0;
  return Math.floor(roomNum / r);
}

export function winsToRecover(lossAmount, rewardPerWin) {
  const loss = Number(lossAmount) || 0;
  const win = Number(rewardPerWin) || 0;
  if (loss <= 0) return 0;
  if (win <= 0) return Infinity;
  return Math.ceil(loss / win);
}

export function recoveryTable({ room, riskPerTrade, rewardRatio, steps = [2, 3, 5, 7, 10] }) {
  const risk = Number(riskPerTrade) || 0;
  const rr = Number(rewardRatio) || 0;
  const reward = risk * rr;
  const bust = lossesUntilBust(room, risk);
  return {
    consecutiveToBust: bust,
    rows: steps.map(n => ({
      losses: n,
      lost: n * risk,
      winsToRecover: winsToRecover(n * risk, reward),
      blows: bust > 0 && n >= bust,
    })),
  };
}
