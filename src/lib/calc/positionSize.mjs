export function positionSize({
  dollarRisk,
  stopTicks,
  tickValue,
  maxContracts = Infinity,
}) {
  const risk = Number(dollarRisk) || 0;
  const ticks = Number(stopTicks) || 0;
  const tv = Number(tickValue) || 0;
  const stopPerContract = ticks * tv;
  if (risk <= 0 || stopPerContract <= 0) {
    return { contracts: 0, stopPerContract: 0, actualRisk: 0, capped: false, uncapped: 0 };
  }
  const raw = Math.floor(risk / stopPerContract);
  const cap = Number.isFinite(maxContracts) ? maxContracts : Infinity;
  const contracts = Math.max(0, Math.min(raw, cap));
  return {
    contracts,
    stopPerContract,
    actualRisk: contracts * stopPerContract,
    capped: raw > cap,
    uncapped: raw,
  };
}
