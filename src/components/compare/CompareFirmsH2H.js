'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  categoryBucket,
  discountBadge,
  findPlan,
  formatDailyLoss,
  formatMinDays,
  formatUsd,
  newsLabel,
  parseMoney,
  pickDefaultPlanType,
  pickDefaultSize,
  pickWinner,
} from '@/lib/compareHighlights';
import '@/components/DemoHeroGreen.css';
import './CompareFirmsH2H.css';

const STEPS = ['Firms', 'Account Type', 'Size'];

function emptySide() {
  return { slug: null, planType: null, accountSize: null };
}

function firmBySlug(firms, slug) {
  return firms.find(f => f.slug === slug) || null;
}

function planTypesFor(firm) {
  const seen = new Set();
  const out = [];
  for (const p of firm?.plans || []) {
    if (!seen.has(p.planType)) {
      seen.add(p.planType);
      out.push(p.planType);
    }
  }
  return out;
}

function sizesFor(firm, planType) {
  return (firm?.plans || [])
    .filter(p => p.planType === planType)
    .map(p => p.accountSize);
}

function SideCard({
  label,
  firm,
  side,
  firms,
  otherSlug,
  openPicker,
  setOpenPicker,
  onSelectFirm,
  onSelectType,
  onSelectSize,
  sideKey,
}) {
  const typeOpen = openPicker === `${sideKey}-type`;
  const sizeOpen = openPicker === `${sideKey}-size`;
  const firmOpen = openPicker === `${sideKey}-firm`;
  const badge = firm && side.planType && side.accountSize
    ? discountBadge(firm, findPlan(firm, side.planType, side.accountSize))
    : discountBadge(firm, null);

  const types = planTypesFor(firm);
  const sizes = sizesFor(firm, side.planType);

  return (
    <div className="h2h-side">
      <p className="h2h-side__label">{label}</p>

      <div className="h2h-picker-wrap">
        <button
          type="button"
          className={`h2h-firm-btn${firm ? ' h2h-firm-btn--filled' : ''}`}
          onClick={() => setOpenPicker(firmOpen ? null : `${sideKey}-firm`)}
          aria-expanded={firmOpen}
        >
          {firm ? (
            <>
              <img src={firm.logo} alt="" className="h2h-firm-btn__logo" width={36} height={36} />
              <span className="h2h-firm-btn__meta">
                <span className="h2h-firm-btn__name">
                  {firm.name}
                  {badge ? <span className="h2h-badge">{badge}</span> : null}
                </span>
                <span className="h2h-firm-btn__hint">Click to change firm</span>
              </span>
              <Chevron />
            </>
          ) : (
            <>
              <span className="h2h-firm-btn__plus" aria-hidden>+</span>
              <span className="h2h-firm-btn__meta">
                <span className="h2h-firm-btn__name">Add Firm</span>
                <span className="h2h-firm-btn__hint">Click to select</span>
              </span>
            </>
          )}
        </button>
        {firmOpen ? (
          <PickerMenu
            onClose={() => setOpenPicker(null)}
            items={firms
              .filter(f => f.slug !== otherSlug)
              .map(f => ({
                key: f.slug,
                label: f.name,
                logo: f.logo,
                sub: f.discount || null,
              }))}
            onPick={slug => {
              onSelectFirm(slug);
              setOpenPicker(null);
            }}
          />
        ) : null}
      </div>

      {firm ? (
        <>
          <p className="h2h-field-label">{firm.name}</p>
          <div className="h2h-picker-wrap">
            <button
              type="button"
              className={`h2h-select${side.planType ? ' h2h-select--done' : ''}`}
              onClick={() => setOpenPicker(typeOpen ? null : `${sideKey}-type`)}
              aria-expanded={typeOpen}
            >
              <span>{side.planType || 'Select account type'}</span>
              {side.planType ? <CheckIcon /> : <Chevron />}
            </button>
            {typeOpen ? (
              <PickerMenu
                onClose={() => setOpenPicker(null)}
                items={types.map(t => ({ key: t, label: t }))}
                onPick={t => {
                  onSelectType(t);
                  setOpenPicker(null);
                }}
              />
            ) : null}
          </div>

          <p className="h2h-field-label">{firm.name}</p>
          <div className="h2h-picker-wrap">
            <button
              type="button"
              className={`h2h-select${side.accountSize ? ' h2h-select--done' : ''}`}
              disabled={!side.planType}
              onClick={() => side.planType && setOpenPicker(sizeOpen ? null : `${sideKey}-size`)}
              aria-expanded={sizeOpen}
            >
              <span>{side.accountSize || 'Select account size'}</span>
              {side.accountSize ? <CheckIcon /> : <Chevron />}
            </button>
            {sizeOpen ? (
              <PickerMenu
                onClose={() => setOpenPicker(null)}
                items={sizes.map(s => ({ key: s, label: s }))}
                onPick={s => {
                  onSelectSize(s);
                  setOpenPicker(null);
                }}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PickerMenu({ items, onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  return (
    <div className="h2h-menu" ref={ref} role="listbox">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          className="h2h-menu__item"
          role="option"
          onClick={() => onPick(item.key)}
        >
          {item.logo ? (
            <img src={item.logo} alt="" width={24} height={24} className="h2h-menu__logo" />
          ) : null}
          <span className="h2h-menu__label">{item.label}</span>
          {item.sub ? <span className="h2h-menu__sub">{item.sub}</span> : null}
        </button>
      ))}
    </div>
  );
}

function Chevron() {
  return (
    <svg className="h2h-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h2h-check" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7 12.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7h11l-3-3M17 17H6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCell({ value, best, badge, sub }) {
  return (
    <td className={`h2h-td${best ? ' h2h-td--best' : ''}`}>
      <div className="h2h-cell">
        {sub ? <span className="h2h-cell__was">{sub}</span> : null}
        <span className="h2h-cell__val">{value}</span>
        {badge ? <span className="h2h-cell__badge">{badge}</span> : null}
      </div>
    </td>
  );
}

function PlatformsCell({ platforms }) {
  const list = platforms || [];
  const shown = list.slice(0, 4);
  const more = list.length - shown.length;
  return (
    <td className="h2h-td">
      <ul className="h2h-platforms">
        {shown.map(p => (
          <li key={p}>{p}</li>
        ))}
        {more > 0 ? <li className="h2h-platforms__more">+{more}</li> : null}
      </ul>
    </td>
  );
}

export default function CompareFirmsH2H({ firms = [], popularPairs = [] }) {
  const [a, setA] = useState(emptySide);
  const [b, setB] = useState(emptySide);
  const [openPicker, setOpenPicker] = useState(null);
  const [copied, setCopied] = useState(false);

  const firmA = firmBySlug(firms, a.slug);
  const firmB = firmBySlug(firms, b.slug);
  const planA = findPlan(firmA, a.planType, a.accountSize);
  const planB = findPlan(firmB, b.planType, b.accountSize);
  const ready = Boolean(planA && planB);

  const stepIndex = useMemo(() => {
    if (!a.slug || !b.slug) return 0;
    if (!a.planType || !b.planType) return 1;
    if (!a.accountSize || !b.accountSize) return 2;
    return 3;
  }, [a, b]);

  const categoryWarn = ready && categoryBucket(planA) !== categoryBucket(planB);
  const sizeWarn = ready && a.accountSize !== b.accountSize;

  const applyFirm = useCallback((setter, slug) => {
    const firm = firmBySlug(firms, slug);
    const planType = pickDefaultPlanType(firm);
    const accountSize = pickDefaultSize(firm, planType);
    setter({ slug, planType, accountSize });
  }, [firms]);

  const applyPopular = useCallback((slugA, slugB) => {
    applyFirm(setA, slugA);
    applyFirm(setB, slugB);
    setOpenPicker(null);
  }, [applyFirm]);

  const clearAll = () => {
    setA(emptySide());
    setB(emptySide());
    setOpenPicker(null);
  };

  const swap = () => {
    setA(b);
    setB(a);
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('a', [a.slug, a.planType, a.accountSize].filter(Boolean).join('|'));
    url.searchParams.set('b', [b.slug, b.planType, b.accountSize].filter(Boolean).join('|'));
    window.history.replaceState(null, '', url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const parse = key => {
      const raw = params.get(key);
      if (!raw) return null;
      const [slug, planType, accountSize] = raw.split('|');
      if (!slug || !firmBySlug(firms, slug)) return null;
      return { slug, planType: planType || null, accountSize: accountSize || null };
    };
    const nextA = parse('a');
    const nextB = parse('b');
    if (nextA) setA(nextA);
    if (nextB) setB(nextB);
  }, [firms]);

  const title = firmA && firmB ? `${firmA.name} vs ${firmB.name}` : 'Compare Prop Firms';

  const costWinner = ready ? pickWinner(planA.price, planB.price, 'lower') : null;
  const splitWinner = ready ? pickWinner(planA.profitSplit, planB.profitSplit, 'higher') : null;
  const targetWinner = ready
    ? pickWinner(parseMoney(planA.profitTarget), parseMoney(planB.profitTarget), 'lower')
    : null;
  const ddWinner = ready
    ? pickWinner(parseMoney(planA.maxLoss), parseMoney(planB.maxLoss), 'higher')
    : null;
  const dailyWinner = ready && 'dailyDrawdown' in planA && 'dailyDrawdown' in planB
    ? pickWinner(planA.dailyDrawdown, planB.dailyDrawdown, 'none-or-lower')
    : null;
  const daysWinner = ready && 'minTradingDays' in planA && 'minTradingDays' in planB
    ? pickWinner(planA.minTradingDays, planB.minTradingDays, 'none-or-lower')
    : null;
  const newsReady = ready && 'newsTrading' in planA && 'newsTrading' in planB;
  const consWinner = ready
    ? pickWinner(planA.consistencyFunded, planB.consistencyFunded, 'none-or-higher')
    : null;
  const newsWinner = newsReady
    ? pickWinner(planA.newsTrading, planB.newsTrading, 'news')
    : null;

  return (
    <div className="demo-page demo-page--green h2h-page">
      <div className="demo-aura" aria-hidden="true" />
      <div className="demo-vignette" aria-hidden="true" />
      <div className="demo-stars" aria-hidden="true" />
      <div className="demo-grid" aria-hidden="true" />

      <div className="h2h-shell">
        <header className="h2h-hero">
          <p className="h2h-eyebrow">
            <span className="h2h-eyebrow__dot" aria-hidden />
            Head-to-head
          </p>
          <h1 className="h2h-title">{title}</h1>
          <p className="h2h-sub">
            Pick two firms, an account type, and a size. Green cells mark the more trader-friendly
            value on that row — no overall winner score.
          </p>

          <ol className="h2h-steps" aria-label="Comparison steps">
            {STEPS.map((label, i) => {
              const done = stepIndex > i;
              const active = stepIndex === i || (stepIndex === 3 && i === 2);
              return (
                <li
                  key={label}
                  className={`h2h-steps__item${done || active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                >
                  <span className="h2h-steps__n">{i + 1}</span>
                  <span className="h2h-steps__t">{label}</span>
                </li>
              );
            })}
          </ol>
        </header>

        <div className="h2h-toolbar">
          <p className="h2h-toolbar__count">
            Comparing <strong>{[a.slug, b.slug].filter(Boolean).length}</strong> firms
          </p>
          <div className="h2h-toolbar__actions">
            <button type="button" className="h2h-ghost" onClick={share} disabled={!a.slug && !b.slug}>
              {copied ? 'Copied' : 'Share'}
            </button>
            <button type="button" className="h2h-ghost" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>

        <div className="h2h-selectors">
          <SideCard
            label="Firm #1"
            sideKey="a"
            firm={firmA}
            side={a}
            firms={firms}
            otherSlug={b.slug}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            onSelectFirm={slug => applyFirm(setA, slug)}
            onSelectType={planType => {
              const size = pickDefaultSize(firmA, planType);
              setA(prev => ({ ...prev, planType, accountSize: size }));
            }}
            onSelectSize={accountSize => setA(prev => ({ ...prev, accountSize }))}
          />

          <button type="button" className="h2h-swap" onClick={swap} aria-label="Swap firms" disabled={!a.slug && !b.slug}>
            <SwapIcon />
          </button>

          <SideCard
            label="Firm #2"
            sideKey="b"
            firm={firmB}
            side={b}
            firms={firms}
            otherSlug={a.slug}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            onSelectFirm={slug => applyFirm(setB, slug)}
            onSelectType={planType => {
              const size = pickDefaultSize(firmB, planType);
              setB(prev => ({ ...prev, planType, accountSize: size }));
            }}
            onSelectSize={accountSize => setB(prev => ({ ...prev, accountSize }))}
          />
        </div>

        {!ready ? (
          <div className="h2h-empty" role="status">
            <h2>Complete your selections</h2>
            <p>Select firm, account type, and account size on both sides to see the detailed comparison.</p>
          </div>
        ) : (
          <div className="h2h-results">
            {(categoryWarn || sizeWarn) && (
              <div className="h2h-warnings" role="status">
                {categoryWarn ? (
                  <p className="h2h-warn">
                    You&apos;re comparing different account categories ({categoryBucket(planA)} vs{' '}
                    {categoryBucket(planB)}). Rules and pricing may not be apples-to-apples.
                  </p>
                ) : null}
                {sizeWarn ? (
                  <p className="h2h-warn h2h-warn--soft">
                    Account sizes differ ({a.accountSize} vs {b.accountSize}). Drawdown and targets
                    scale with size — compare carefully.
                  </p>
                ) : null}
              </div>
            )}

            <div className="h2h-table-wrap">
              <table className="h2h-table">
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">
                      <span className="h2h-th__name">{firmA.name}</span>
                      <span className="h2h-th__plan">
                        {a.planType} · {a.accountSize}
                      </span>
                    </th>
                    <th scope="col">
                      <span className="h2h-th__name">{firmB.name}</span>
                      <span className="h2h-th__plan">
                        {b.planType} · {b.accountSize}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Total Cost</th>
                    <MetricCell
                      value={formatUsd(planA.price)}
                      sub={planA.priceWas && planA.priceWas > planA.price ? formatUsd(planA.priceWas) : null}
                      badge={
                        [
                          discountBadge(firmA, planA),
                          costWinner === 0 ? 'Best Price' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || null
                      }
                      best={costWinner === 0}
                    />
                    <MetricCell
                      value={formatUsd(planB.price)}
                      sub={planB.priceWas && planB.priceWas > planB.price ? formatUsd(planB.priceWas) : null}
                      badge={
                        [
                          discountBadge(firmB, planB),
                          costWinner === 1 ? 'Best Price' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || null
                      }
                      best={costWinner === 1}
                    />
                  </tr>
                  <tr>
                    <th scope="row">Profit Split</th>
                    <MetricCell
                      value={`${planA.profitSplit}%`}
                      badge={splitWinner === 0 ? 'Best' : null}
                      best={splitWinner === 0}
                    />
                    <MetricCell
                      value={`${planB.profitSplit}%`}
                      badge={splitWinner === 1 ? 'Best' : null}
                      best={splitWinner === 1}
                    />
                  </tr>

                  <tr className="h2h-section">
                    <th colSpan={3}>Evaluation rules</th>
                  </tr>
                  <tr>
                    <th scope="row">Profit Target</th>
                    <MetricCell value={planA.profitTarget} best={targetWinner === 0} />
                    <MetricCell value={planB.profitTarget} best={targetWinner === 1} />
                  </tr>
                  <tr>
                    <th scope="row">Maximum Drawdown</th>
                    <MetricCell
                      value={`${planA.maxLoss}${planA.maxLossType ? ` (${planA.maxLossType})` : ''}`}
                      best={ddWinner === 0}
                    />
                    <MetricCell
                      value={`${planB.maxLoss}${planB.maxLossType ? ` (${planB.maxLossType})` : ''}`}
                      best={ddWinner === 1}
                    />
                  </tr>
                  <tr>
                    <th scope="row">Daily Loss Limit</th>
                    <MetricCell value={formatDailyLoss(planA)} best={dailyWinner === 0} />
                    <MetricCell value={formatDailyLoss(planB)} best={dailyWinner === 1} />
                  </tr>
                  <tr>
                    <th scope="row">Min Trading Days</th>
                    <MetricCell value={formatMinDays(planA)} best={daysWinner === 0} />
                    <MetricCell value={formatMinDays(planB)} best={daysWinner === 1} />
                  </tr>
                  <tr>
                    <th scope="row">Activation Fee</th>
                    <MetricCell value={planA.activationFee || '—'} />
                    <MetricCell value={planB.activationFee || '—'} />
                  </tr>
                  <tr>
                    <th scope="row">Consistency (Eval)</th>
                    <MetricCell value={planA.consistencyEval || '—'} />
                    <MetricCell value={planB.consistencyEval || '—'} />
                  </tr>

                  <tr className="h2h-section">
                    <th colSpan={3}>Funded rules</th>
                  </tr>
                  <tr>
                    <th scope="row">Funded Drawdown</th>
                    <MetricCell value={planA.maxLoss} best={ddWinner === 0} />
                    <MetricCell value={planB.maxLoss} best={ddWinner === 1} />
                  </tr>
                  <tr>
                    <th scope="row">Consistency Rule</th>
                    <MetricCell value={planA.consistencyFunded || 'None'} best={consWinner === 0} />
                    <MetricCell value={planB.consistencyFunded || 'None'} best={consWinner === 1} />
                  </tr>
                  <tr>
                    <th scope="row">News Trading</th>
                    <MetricCell value={newsLabel(planA.newsTrading)} best={newsWinner === 0} />
                    <MetricCell value={newsLabel(planB.newsTrading)} best={newsWinner === 1} />
                  </tr>
                  <tr>
                    <th scope="row">Payout Frequency</th>
                    <MetricCell value={planA.payoutFreq || '—'} />
                    <MetricCell value={planB.payoutFreq || '—'} />
                  </tr>
                  <tr>
                    <th scope="row">Max Contracts</th>
                    <MetricCell value={planA.maxLots || '—'} />
                    <MetricCell value={planB.maxLots || '—'} />
                  </tr>

                  <tr className="h2h-section">
                    <th colSpan={3}>Platforms & payouts</th>
                  </tr>
                  <tr>
                    <th scope="row">Platforms</th>
                    <PlatformsCell platforms={firmA.platforms} />
                    <PlatformsCell platforms={firmB.platforms} />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="h2h-ctas">
              <a
                className="h2h-cta"
                href={firmA.affiliateLink || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                Visit {firmA.name}
                {planA.promoCode ? <span className="h2h-cta__code">{planA.promoCode}</span> : null}
              </a>
              <a
                className="h2h-cta"
                href={firmB.affiliateLink || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                Visit {firmB.name}
                {planB.promoCode ? <span className="h2h-cta__code">{planB.promoCode}</span> : null}
              </a>
            </div>
          </div>
        )}

        {popularPairs.length > 0 ? (
          <section className="h2h-popular" aria-labelledby="h2h-popular-title">
            <h2 id="h2h-popular-title">Popular comparisons</h2>
            <p>Jump straight into a side-by-side with the most popular plan on each firm.</p>
            <ul className="h2h-popular__list">
              {popularPairs.map(pair => (
                <li key={`${pair.a}-${pair.b}`}>
                  <button
                    type="button"
                    className="h2h-popular__btn"
                    onClick={() => applyPopular(pair.a, pair.b)}
                  >
                    {pair.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
