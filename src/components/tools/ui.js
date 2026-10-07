'use client';

import { useEffect, useRef, useState } from 'react';

export const PAGE =
  'mx-auto w-full min-w-0 max-w-[1360px] px-4 pt-5 pb-[max(5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 lg:px-8 max-md:max-w-none max-md:px-3';

export const FIELD =
  'w-full min-h-11 rounded-xl border border-white/10 bg-[#08120e] px-3 text-base text-emerald-50 outline-none placeholder:text-emerald-200/30 motion-safe:transition-colors motion-safe:duration-200 focus:border-[#3FB185]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FB185]/80 disabled:cursor-not-allowed disabled:opacity-40 sm:text-[0.875rem]';

export const LABEL = 'mb-1.5 block text-[0.875rem] font-medium text-emerald-200/70 sm:text-[0.8125rem]';

export const CHIP =
  'btn-bare inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-3 text-[0.875rem] font-semibold motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FB185]/80 sm:text-[0.8125rem]';

export const SCROLL_X =
  'flex w-full min-w-0 max-w-full gap-2.5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-1 [-webkit-overflow-scrolling:touch] scrollbar-none';

export const CHIP_ON = 'bg-[#3FB185]/20 text-[#3FB185]';
export const CHIP_OFF = 'bg-white/5 text-emerald-100/65 hover:text-white';

const PLUS =
  'btn-bare inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[#3FB185]/40 bg-[#08120e] text-[0.875rem] font-semibold text-[#3FB185] motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#3FB185]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FB185]/80';

export function OverflowRow({ items, getKey, render, moreAria = 'Show more' }) {
  const measureRef = useRef(null);
  const rootRef = useRef(null);
  const [visible, setVisible] = useState(() => Math.min(items.length, 4));
  const [open, setOpen] = useState(false);
  const sig = items.map(getKey).join('|');

  useEffect(() => {
    const row = measureRef.current;
    if (!row) return undefined;
    const run = () => {
      const chips = [...row.querySelectorAll('[data-overflow-chip]')];
      if (!chips.length) return;
      const styles = getComputedStyle(row);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 10;
      const max = row.clientWidth;
      if (max < 8) return;
      const plus = 44;
      let used = 0;
      let count = 0;
      for (let i = 0; i < chips.length; i += 1) {
        const w = chips[i].getBoundingClientRect().width;
        const g = count === 0 ? 0 : gap;
        const rest = chips.length - (count + 1);
        const reserve = rest > 0 ? plus + gap : 0;
        if (used + g + w + reserve > max + 0.5) break;
        used += g + w;
        count += 1;
      }
      setVisible(Math.max(1, Math.min(count, chips.length)));
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(row);
    return () => ro.disconnect();
  }, [sig]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const extra = items.slice(visible);

  return (
    <div className="relative w-full min-w-0" ref={rootRef}>
      <div ref={measureRef} className="pointer-events-none invisible absolute inset-x-0 top-0 flex flex-nowrap gap-2.5" aria-hidden>
        {items.map(item => (
          <div key={getKey(item)} data-overflow-chip className="shrink-0">
            {render(item)}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-nowrap items-center gap-2.5 overflow-hidden">
        {items.slice(0, visible).map(item => (
          <div key={getKey(item)} className="shrink-0">
            {render(item)}
          </div>
        ))}
        {extra.length ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${moreAria}, ${extra.length} more`}
            className={PLUS}
            onClick={() => setOpen(v => !v)}
          >
            +{extra.length}
          </button>
        ) : null}
      </div>
      {open && extra.length ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 flex max-h-64 min-w-[11rem] flex-col gap-0.5 overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1612] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
          {extra.map(item => (
            <div
              key={getKey(item)}
              className="min-w-0 [&_a]:w-full [&_button]:w-full [&_a]:justify-start [&_button]:justify-start [&_a]:rounded-xl [&_button]:rounded-xl"
              onClick={() => setOpen(false)}
            >
              {render(item, { inMenu: true })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function money(n, digits = 0) {
  if (n == null || Number(n) === Infinity || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function pct(n, digits = 1) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `${(Number(n) * 100).toFixed(digits)}%`;
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export function Results({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#08120e]">{children}</div>
  );
}

export function Stat({ label, value, hint, warn = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-white/[0.06] px-3 py-3 first:border-t-0 sm:gap-4 sm:px-4">
      <div className="min-w-0">
        <div className="text-[0.75rem] text-emerald-200/70 sm:text-[0.8125rem]">{label}</div>
        {hint ? <div className="mt-0.5 text-[0.6875rem] leading-snug text-emerald-200/40 sm:text-[0.75rem]">{hint}</div> : null}
      </div>
      <div
        className={`shrink-0 text-[1.0625rem] font-bold tabular-nums sm:text-[1.25rem] ${
          warn ? 'text-amber-200' : 'text-[#3FB185]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function ChoiceChips({ label, options, value, onChange, format, compact = false }) {
  return (
    <div className={compact ? 'flex min-w-0 max-w-full items-center gap-2.5' : 'min-w-0 max-w-full'}>
      {label ? (
        <span
          className={
            compact
              ? 'mb-0 shrink-0 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-emerald-200/50'
              : LABEL
          }
        >
          {label}
        </span>
      ) : null}
      <div className="min-w-0 flex-1" role="listbox" aria-label={label || 'Choices'}>
        <OverflowRow
          items={options}
          getKey={opt => (typeof opt === 'object' ? opt.id : opt)}
          moreAria={label || 'More choices'}
          render={opt => {
            const key = typeof opt === 'object' ? opt.id : opt;
            const text = format ? format(opt) : typeof opt === 'object' ? opt.label : String(opt);
            const on = value === key;
            return (
              <button
                type="button"
                role="option"
                aria-selected={on}
                className={`${CHIP} ${compact ? 'sm:!min-h-8 sm:!min-w-8 sm:!px-2.5' : ''} ${on ? CHIP_ON : CHIP_OFF}`}
                onClick={() => onChange(key)}
              >
                {text}
              </button>
            );
          }}
        />
      </div>
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0c1612]/80 p-3.5 sm:p-5 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="m-0 max-w-2xl text-[0.875rem] leading-relaxed text-emerald-200/40 sm:text-[0.8125rem]">
      Planning figures only. Confirm limits on the firm dashboard before you size a trade or request a payout.
      Affiliate links may earn a commission.
    </p>
  );
}
