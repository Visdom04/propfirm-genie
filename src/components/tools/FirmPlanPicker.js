'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BTN =
  'btn-bare appearance-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FB185]/80';

function Chevron({ up }) {
  return (
    <svg
      className="ml-auto shrink-0 text-[#3FB185] motion-safe:transition-transform motion-safe:duration-200"
      style={{ transform: up ? 'rotate(180deg)' : 'rotate(0deg)' }}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo({ src, name }) {
  const [broken, setBroken] = useState(false);
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  if (!src || broken) {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-md border border-white/12 bg-black text-[0.7rem] font-bold text-emerald-200/55 sm:size-7">
        {letter}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote firm marks
    <img
      src={src}
      alt=""
      width={28}
      height={28}
      className="size-6 shrink-0 rounded-md border border-[#3FB185]/40 bg-black object-cover sm:size-7"
      onError={() => setBroken(true)}
    />
  );
}

function Menu({ items, selectedKey, onPick, searchable, searchPlaceholder }) {
  const inputRef = useRef(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!searchable) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) inputRef.current?.focus();
  }, [searchable]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item => item.label.toLowerCase().includes(needle));
  }, [items, q]);

  return (
    <div
      className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 flex max-h-[min(18rem,55dvh)] flex-col overflow-hidden overscroll-contain rounded-2xl border border-white/10 bg-[#0c1612] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
      role="listbox"
    >
      {searchable ? (
        <div className="shrink-0 border-b border-white/8 p-2">
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={searchPlaceholder || 'Search'}
            className="w-full min-h-11 rounded-lg border border-white/10 bg-[#08120e] px-3 py-2.5 text-base text-emerald-50 outline-none placeholder:text-emerald-200/30 focus:border-[#3FB185]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FB185]/80 sm:text-[0.8125rem]"
          />
        </div>
      ) : null}
      <div className="scrollbar-pfg min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="m-0 px-2 py-3 text-[0.8125rem] text-emerald-200/50">No matches.</p>
        ) : (
          filtered.map(item => {
            const on = item.key === selectedKey;
            return (
              <button
                key={item.key}
                type="button"
                role="option"
                aria-selected={on}
                className={`${BTN} flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-emerald-50 ${
                  on ? 'bg-[#3FB185]/12' : 'hover:bg-[#3FB185]/10'
                }`}
                onClick={() => onPick(item.key)}
              >
                {item.logo !== undefined ? <Logo src={item.logo} name={item.label} /> : null}
                <span className="min-w-0 flex-1 truncate text-[0.84rem] font-semibold">{item.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function Trigger({ label, filled, disabled, expanded, onClick, onClose, menu, children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!expanded) return undefined;
    const onDoc = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose();
    };
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [expanded, onClose]);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="sr-only text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-emerald-200/50 sm:not-sr-only sm:shrink-0">
        {label}
      </span>
      <div className="relative min-w-0 flex-1" ref={rootRef}>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={expanded}
          aria-haspopup="listbox"
          aria-label={label}
          onClick={onClick}
          className={`${BTN} flex h-11 w-full min-h-11 items-center gap-2 rounded-full px-2.5 text-left text-white motion-safe:transition-colors motion-safe:duration-200 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:min-h-10 sm:gap-2.5 sm:px-3 ${
            filled
              ? 'border border-solid border-[#3FB185]/45 bg-[#08120e]'
              : 'border border-white/12 bg-[#08120e] hover:border-[#3FB185]/40'
          }`}
        >
          {children}
          <Chevron up={expanded} />
        </button>
        {menu}
      </div>
    </div>
  );
}

export default function FirmPlanPicker({ firms, firmSlug, planId, custom, onFirm, onPlan }) {
  const [open, setOpen] = useState(null);
  const firm = custom ? null : firms.find(f => f.slug === firmSlug) || null;
  const plans = firm?.plans || [];
  const plan = plans.find(p => p.id === planId) || plans[0] || null;

  const firmItems = useMemo(
    () => [
      { key: 'custom', label: 'Custom — type the rules' },
      ...firms.map(f => ({ key: f.slug, label: f.name, logo: f.logo })),
    ],
    [firms]
  );

  const planItems = useMemo(
    () => plans.map(p => ({ key: p.id, label: `${p.planType} · ${p.accountSize}` })),
    [plans]
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Trigger
        label="Firm"
        filled={Boolean(firm || custom)}
        expanded={open === 'firm'}
        onClick={() => setOpen(open === 'firm' ? null : 'firm')}
        onClose={() => setOpen(null)}
        menu={
          open === 'firm' ? (
            <Menu
              items={firmItems}
              selectedKey={custom ? 'custom' : firmSlug}
              searchable
              searchPlaceholder="Search firms"
              onPick={key => {
                onFirm(key);
                setOpen(null);
              }}
            />
          ) : null
        }
      >
        <Logo src={custom ? '' : firm?.logo} name={custom ? 'C' : firm?.name || '?'} />
        <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold sm:text-[0.875rem]">
          {custom ? 'Custom — type the rules' : firm?.name || 'Choose a firm'}
        </span>
      </Trigger>

      <Trigger
        label="Plan"
        filled={Boolean(plan) && !custom}
        disabled={custom || !plans.length}
        expanded={open === 'plan'}
        onClick={() => setOpen(open === 'plan' ? null : 'plan')}
        onClose={() => setOpen(null)}
        menu={
          open === 'plan' && !custom ? (
            <Menu
              items={planItems}
              selectedKey={planId}
              onPick={key => {
                onPlan(key);
                setOpen(null);
              }}
            />
          ) : null
        }
      >
        <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold sm:text-[0.875rem]">
          {custom ? 'Not used in custom' : plan ? `${plan.planType} · ${plan.accountSize}` : 'Choose a plan'}
        </span>
      </Trigger>

      {firm?.lastVerified ? (
        <p className="m-0 hidden shrink-0 text-[0.6875rem] leading-tight text-emerald-200/40 xl:block">
          Verified {firm.lastVerified}
        </p>
      ) : null}
    </div>
  );
}
