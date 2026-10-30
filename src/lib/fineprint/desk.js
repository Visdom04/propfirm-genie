const KEY = 'pfg-fineprint-desk';
const EVENT = 'pfg-fineprint-desk';

export function emptyDeskItem(firms = []) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `desk-${Date.now()}`,
    firm: firms[0] || '',
    product: '',
    market: 'futures',
    kind: 'rules',
    date: today,
    title: '',
    label: '',
    before: '',
    after: '',
    notes: '',
    verdict: '',
    sourceUrl: '',
    demo: false,
    trending: false,
    status: 'draft',
  };
}

export function loadDesk() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveDesk(items) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeDesk(onChange) {
  const ping = () => onChange(loadDesk());
  window.addEventListener(EVENT, ping);
  window.addEventListener('storage', ping);
  return () => {
    window.removeEventListener(EVENT, ping);
    window.removeEventListener('storage', ping);
  };
}

export function deskToChange(item) {
  const iso = `${item.date || new Date().toISOString().slice(0, 10)}T12:00:00.000Z`;
  const before = String(item.before || '').trim();
  const after = String(item.after || '').trim();
  const label = String(item.label || 'Change').trim();
  const fact = {
    label,
    kind: item.kind || 'rules',
    stage: 'desk',
    verdict: item.verdict || undefined,
    before,
    after,
    beforeLine: before,
    afterLine: after,
  };
  return {
    id: item.id,
    pageId: 'desk',
    manual: true,
    detectedAt: iso,
    publishedAt: item.status === 'published' ? iso : null,
    firm: item.firm,
    market: item.market || 'futures',
    kind: item.kind || 'rules',
    product: item.product || '',
    title: String(item.title || `${item.firm} ${label}`).trim(),
    summary: String(item.notes || (before && after ? `Was “${before}”. Now “${after}”.` : label)).trim(),
    demo: Boolean(item.demo),
    trending: Boolean(item.trending),
    sourceUrl: item.sourceUrl || '',
    facts: [fact],
    hunks:
      before || after
        ? [
            {
              before: before ? [before] : [],
              after: after ? [after] : [],
              removed: before ? [before] : [],
              added: after ? [after] : [],
            },
          ]
        : [],
    status: item.status === 'published' ? 'published' : 'draft',
  };
}

export function changeToDeskItem(change) {
  const fact = change?.facts?.[0] || {};
  return {
    id: change.id,
    firm: change.firm || '',
    product: change.product || '',
    market: change.market || 'futures',
    kind: fact.kind || change.kind || 'rules',
    date: String(change.detectedAt || new Date().toISOString()).slice(0, 10),
    title: change.title || '',
    label: fact.label || '',
    before: fact.before || '',
    after: fact.after || '',
    notes: change.summary || '',
    verdict: fact.verdict || '',
    sourceUrl: change.sourceUrl || '',
    demo: Boolean(change.demo),
    trending: Boolean(change.trending),
    status: change.status === 'published' ? 'published' : 'draft',
  };
}
