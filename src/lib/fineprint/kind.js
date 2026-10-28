const KINDS = new Set(['pricing', 'rules', 'payouts']);

export const KIND_LABEL = {
  pricing: 'Price',
  rules: 'Rules',
  payouts: 'Payouts',
  faq: 'FAQ',
};

export function classifyKind(text) {
  const blob = String(text || '');
  if (/\bpayout|claiming-profit/i.test(blob)) return 'payouts';
  if (/\b(fee|price|activation|pricing|account-tier)/i.test(blob)) return 'pricing';
  return 'rules';
}

export function factKind(change, fact) {
  const stamped = fact?.kind || change?.kind;
  if (KINDS.has(stamped)) return stamped;
  return classifyKind(`${fact?.label || ''} ${change?.title || ''} ${change?.sourceUrl || ''}`);
}

export function stampFact(fact, kind) {
  const next = kind && KINDS.has(kind) ? kind : classifyKind(`${fact?.label || ''} ${fact?.beforeLine || ''} ${fact?.afterLine || ''}`);
  return { ...fact, kind: next };
}
