'use client';

import { useId, useState } from 'react';

export const COUNTRY_LABELS = {
  US: 'United States',
  AE: 'United Arab Emirates',
  CY: 'Cyprus',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
};

/** Collapse noisy drawdown strings into filterable buckets */
export function normalizeDrawdown(raw) {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'Other';
  if (s.includes('static')) return 'Static';
  if (s.includes('intraday')) return 'Intraday';
  if (s.includes('eod')) return 'EOD';
  if (s.includes('trail')) return 'Trailing';
  return String(raw);
}

export function createEmptyFacet(bounds) {
  return {
    assets: [],
    sizes: [],
    steps: [],
    prices: [],
    firms: [],
    drawdownTypes: [],
    platforms: [],
    countries: [],
    priceRange: bounds ? { min: bounds.price.min, max: bounds.price.max } : null,
    splitRange: bounds ? { min: bounds.split.min, max: bounds.split.max } : null,
    ratingRange: bounds ? { min: bounds.rating.min, max: bounds.rating.max } : null,
    yearsRange: bounds ? { min: bounds.years.min, max: bounds.years.max } : null,
  };
}

export function cloneFacet(f) {
  return {
    ...f,
    assets: [...f.assets],
    sizes: [...f.sizes],
    steps: [...f.steps],
    prices: [...f.prices],
    firms: [...f.firms],
    drawdownTypes: [...f.drawdownTypes],
    platforms: [...f.platforms],
    countries: [...f.countries],
    priceRange: f.priceRange ? { ...f.priceRange } : null,
    splitRange: f.splitRange ? { ...f.splitRange } : null,
    ratingRange: f.ratingRange ? { ...f.ratingRange } : null,
    yearsRange: f.yearsRange ? { ...f.yearsRange } : null,
  };
}

export function isRangeActive(range, bound) {
  if (!range || !bound) return false;
  return range.min > bound.min || range.max < bound.max;
}

export function countActiveFilters(facet, bounds) {
  if (!facet) return 0;
  let n =
    facet.assets.length +
    facet.sizes.length +
    facet.steps.length +
    facet.prices.length +
    facet.firms.length +
    facet.drawdownTypes.length +
    facet.platforms.length +
    facet.countries.length;
  if (isRangeActive(facet.priceRange, bounds?.price)) n += 1;
  if (isRangeActive(facet.splitRange, bounds?.split)) n += 1;
  if (isRangeActive(facet.ratingRange, bounds?.rating)) n += 1;
  if (isRangeActive(facet.yearsRange, bounds?.years)) n += 1;
  return n;
}

function DualRange({ label, min, max, step = 1, value, onChange, format = v => v }) {
  const id = useId();
  const lo = Math.min(value.min, value.max);
  const hi = Math.max(value.min, value.max);
  const span = Math.max(max - min, 1);
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;

  return (
    <div className="cmp-range">
      <div className="cmp-range__head">
        <label className="cmp-range__label" htmlFor={`${id}-min`}>
          {label}
        </label>
        <span className="cmp-range__vals">
          {format(lo)} – {format(hi)}
        </span>
      </div>
      <div className="cmp-range__track-wrap">
        <div className="cmp-range__rail" aria-hidden />
        <div
          className="cmp-range__fill"
          style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
          aria-hidden
        />
        <input
          id={`${id}-min`}
          className="cmp-range__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={`${label} minimum`}
          onChange={e => {
            const next = Number(e.target.value);
            onChange({ min: Math.min(next, hi), max: hi });
          }}
        />
        <input
          id={`${id}-max`}
          className="cmp-range__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={`${label} maximum`}
          onChange={e => {
            const next = Number(e.target.value);
            onChange({ min: lo, max: Math.max(next, lo) });
          }}
        />
      </div>
      <div className="cmp-range__ends" aria-hidden>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function Accordion({ title, defaultOpen = false, children, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className={`cmp-acc${accent ? ' cmp-acc--accent' : ''}`}
      open={open}
      onToggle={e => setOpen(e.currentTarget.open)}
    >
      <summary className="cmp-acc__summary">{title}</summary>
      <div className="cmp-acc__body">{children}</div>
    </details>
  );
}

function toggleIn(list, value) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

export default function CompareFilterSidebar({
  open,
  draft,
  bounds,
  options,
  firmList,
  onChange,
  onApply,
  onReset,
  onClose,
  activeCount,
}) {
  if (!draft || !bounds) return null;

  const set = patch => onChange({ ...draft, ...patch });
  const toggle = (key, value) => set({ [key]: toggleIn(draft[key], value) });

  return (
    <>
      {open ? (
        <button
          type="button"
          className="cmp-sidebar__backdrop"
          aria-label="Close filters"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`cmp-sidebar cmp-sidebar--responsive${open ? ' cmp-sidebar--open' : ''}`}
        id="cmp-filters"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        aria-label="Filters"
      >
        <div className="cmp-sidebar__head">
          <span className="cmp-sidebar__title">
            Filters
            {activeCount > 0 ? (
              <span className="cmp-sidebar__count">{activeCount}</span>
            ) : null}
          </span>
          <button
            type="button"
            className="cmp-sidebar__close"
            onClick={onClose}
            aria-label="Close filter panel"
          >
            ×
          </button>
        </div>

        <div className="cmp-sidebar__scroll">
          <Accordion title="Instruments" defaultOpen accent>
            {options.assets.map(a => (
              <button
                key={a}
                type="button"
                className={`cmp-chip ${draft.assets.includes(a) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('assets', a)}
              >
                {a}
              </button>
            ))}
          </Accordion>

          <Accordion title={`Firms · ${firmList.length}`} defaultOpen>
            <div className="cmp-firm-list" role="group" aria-label="Filter by firm">
              {firmList.map(f => {
                const on = draft.firms.includes(f.name);
                return (
                  <label key={f.name} className={`cmp-firm-check${on ? ' cmp-firm-check--on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle('firms', f.name)}
                    />
                    <span className="cmp-firm-check__logo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.logo} alt="" width={30} height={30} loading="lazy" decoding="async" />
                      {f.isPopular ? (
                        <span className="cmp-firm-check__star" title="Popular" aria-hidden />
                      ) : null}
                      {f.isNew ? <span className="cmp-firm-check__new">NEW</span> : null}
                    </span>
                    <span className="cmp-firm-check__name" title={f.name}>
                      {f.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </Accordion>

          <Accordion title="Account size" defaultOpen>
            {options.sizes.map(s => (
              <button
                key={s}
                type="button"
                className={`cmp-chip ${draft.sizes.includes(s) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('sizes', s)}
              >
                {s}
              </button>
            ))}
          </Accordion>

          <Accordion title="Steps">
            {options.steps.map(s => (
              <button
                key={s}
                type="button"
                className={`cmp-chip ${draft.steps.includes(s) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('steps', s)}
              >
                {s}
              </button>
            ))}
          </Accordion>

          <Accordion title="Drawdown type" defaultOpen>
            {options.drawdownTypes.map(t => (
              <button
                key={t}
                type="button"
                className={`cmp-chip ${draft.drawdownTypes.includes(t) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('drawdownTypes', t)}
              >
                {t}
              </button>
            ))}
          </Accordion>

          <Accordion title="Price type">
            {options.priceTypes.map(p => (
              <button
                key={p}
                type="button"
                className={`cmp-chip ${draft.prices.includes(p) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('prices', p)}
              >
                {p}
              </button>
            ))}
          </Accordion>

          <Accordion title="Advanced filtering" defaultOpen>
            <div className="cmp-range-stack">
              <DualRange
                label="Price"
                min={bounds.price.min}
                max={bounds.price.max}
                step={bounds.price.step}
                value={draft.priceRange || bounds.price}
                onChange={priceRange => set({ priceRange })}
                format={v => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              />
              <DualRange
                label="Profit split"
                min={bounds.split.min}
                max={bounds.split.max}
                step={1}
                value={draft.splitRange || bounds.split}
                onChange={splitRange => set({ splitRange })}
                format={v => `${v}%`}
              />
              <DualRange
                label="Trustpilot / rating"
                min={bounds.rating.min}
                max={bounds.rating.max}
                step={0.1}
                value={draft.ratingRange || bounds.rating}
                onChange={ratingRange => set({ ratingRange })}
                format={v => Number(v).toFixed(1)}
              />
              <DualRange
                label="Years in business"
                min={bounds.years.min}
                max={bounds.years.max}
                step={1}
                value={draft.yearsRange || bounds.years}
                onChange={yearsRange => set({ yearsRange })}
                format={v => String(v)}
              />
            </div>
          </Accordion>

          <Accordion title="Platforms">
            {options.platforms.map(p => (
              <button
                key={p}
                type="button"
                className={`cmp-chip ${draft.platforms.includes(p) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('platforms', p)}
              >
                {p}
              </button>
            ))}
          </Accordion>

          <Accordion title="Countries">
            <p className="cmp-acc__hint">Countries where firms are based</p>
            {options.countries.map(c => (
              <button
                key={c}
                type="button"
                className={`cmp-chip ${draft.countries.includes(c) ? 'cmp-chip--on' : ''}`}
                onClick={() => toggle('countries', c)}
              >
                {COUNTRY_LABELS[c] || c}
              </button>
            ))}
          </Accordion>
        </div>

        <div className="cmp-sidebar__foot">
          <button type="button" className="cmp-reset cmp-sidebar__reset-desktop" onClick={onReset}>
            Reset filter
          </button>
          <div className="cmp-sidebar__foot-mobile">
            <button type="button" className="cmp-sidebar__reset-btn" onClick={onReset}>
              Reset filter
            </button>
            <button type="button" className="cmp-sidebar__apply-btn" onClick={onApply}>
              Apply
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
