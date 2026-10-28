const FIELDS = [
  'id',
  'planType',
  'accountSize',
  'steps',
  'listPrice',
  'price',
  'profitTarget',
  'maxLoss',
  'maxLossType',
  'dailyDrawdown',
  'profitSplit',
  'payoutFreq',
  'consistencyEval',
  'consistencyFunded',
  'minTradingDays',
  'newsTrading',
  'activationFee',
  'maxPayout',
];

function cell(value) {
  if (value == null || value === '') return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

/** Canonical plan table. This is Loop's trick: diff our records, not marketing HTML. */
export function snapshotFirmPlans(firm) {
  const name = firm?.name || '';
  const plans = [...(firm?.plans || [])].sort((a, b) => cell(a.id).localeCompare(cell(b.id)));
  const lines = [`FIRM ${name}`, `PLANS ${plans.length}`];
  for (const plan of plans) {
    lines.push(FIELDS.map(key => `${key}=${cell(plan[key])}`).join('\t'));
  }
  return lines.join('\n');
}
