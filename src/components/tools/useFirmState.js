'use client';

import { useEffect, useState } from 'react';

export function useFirmState(firms, initialSlug) {
  const first = firms.find(f => f.slug === initialSlug) || firms[0];
  const [firmSlug, setFirmSlug] = useState(first?.slug || 'custom');
  const [planId, setPlanId] = useState(first?.plans?.[0]?.id || '');
  const [custom, setCustom] = useState(!first);

  const firm = custom ? null : firms.find(f => f.slug === firmSlug) || null;
  const plan = firm?.plans?.find(p => p.id === planId) || firm?.plans?.[0] || null;

  useEffect(() => {
    if (!firmSlug || firmSlug === 'custom') return;
    window.dispatchEvent(new CustomEvent('pfg_tools_used', { detail: { firm: firmSlug } }));
  }, [firmSlug]);

  const onFirm = value => {
    if (value === 'custom') {
      setCustom(true);
      setFirmSlug('custom');
      return;
    }
    setCustom(false);
    setFirmSlug(value);
    const next = firms.find(f => f.slug === value);
    setPlanId(next?.plans?.[0]?.id || '');
  };

  return { firmSlug, planId, custom, firm, plan, onFirm, onPlan: setPlanId };
}
