'use client';

import { useEffect, useMemo, useState } from 'react';
import { BOOKS, instrumentById, instrumentsForBook } from '@/data/instruments';
import { positionSize } from '@/lib/calc/positionSize.mjs';
import { drawdownRoom } from '@/lib/calc/drawdown.mjs';
import { consistencyCheck } from '@/lib/calc/consistency.mjs';
import { payoutTakeHome, recoupPayouts } from '@/lib/calc/payout.mjs';
import { bustSeverity, recoveryTable } from '@/lib/calc/blowout.mjs';
import { breakevenWinRate, expectedValue, projectGrowth } from '@/lib/calc/growth.mjs';
import { dcaLadder, dcaTakeProfit } from '@/lib/calc/dca.mjs';
import { simulateChallenge } from '@/lib/calc/monteCarlo.mjs';
import { parseMaxLots, parseConsistencyRatio, drawdownKind } from '@/lib/calc/parsePlan';
import { genieFirmUrl } from '@/lib/firmGenie';
import { PfgGhost, PfgPrimary } from '@/components/green/PfgControls';
import {
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  ChoiceChips,
  FIELD,
  Field,
  OverflowRow,
  Results,
  Stat,
  money,
  pct,
} from './ui';

export function InstrumentChips({ value, onChange, book = 'futures' }) {
  const list = instrumentsForBook(book);
  return (
    <div role="listbox" aria-label="Contract">
      <OverflowRow
        items={list}
        getKey={i => i.id}
        moreAria="More contracts"
        render={i => {
          const on = i.id === value;
          return (
            <button
              type="button"
              role="option"
              aria-selected={on}
              className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
              onClick={() => onChange(i.id)}
            >
              {i.id}
            </button>
          );
        }}
      />
    </div>
  );
}

export function BookTabs({ value, onChange, compact = false }) {
  return (
    <ChoiceChips
      label="Book"
      options={BOOKS}
      value={value}
      onChange={onChange}
      compact={compact}
    />
  );
}

export function PlanFacts({ plan, verified }) {
  if (!plan && !verified) return null;
  return (
    <p className="m-0 min-w-0 text-[0.875rem] leading-snug text-emerald-200/45 sm:text-[0.75rem]">
      {plan ? (
        <>
          {plan.maxLossType} drawdown {money(plan.maxLoss)}
          <span className="text-white/20"> · </span>
          {plan.profitSplit}% split
          <span className="text-white/20"> · </span>
          lots {plan.maxLots || '—'}
        </>
      ) : null}
      {verified ? (
        <>
          {plan ? <span className="text-white/20 xl:hidden"> · </span> : null}
          <span className="text-emerald-200/40 xl:hidden">Verified {verified}</span>
        </>
      ) : null}
    </p>
  );
}

export function Actions({ firm, plan, compact = false }) {
  const compareHref = firm ? `/compare?a=${firm.slug}` : '/compare';
  const genie = firm ? genieFirmUrl(firm.name) : '';
  return (
    <div className={compact ? 'shrink-0' : 'flex flex-col gap-2.5'}>
      <div className={compact ? 'grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center' : 'flex flex-wrap items-center gap-2'}>
        <PfgGhost href={compareHref} compact={compact} className={compact ? 'h-11 w-full min-h-11 px-2 sm:h-8 sm:w-auto sm:min-h-8 sm:px-3' : ''}>
          <span className="sm:hidden">Compare</span>
          <span className="hidden sm:inline">Open in compare</span>
        </PfgGhost>
        {firm?.affiliateLink ? (
          <PfgPrimary
            href={firm.affiliateLink}
            compact
            rel="noopener noreferrer"
            className="h-11 w-full min-h-11 sm:h-8 sm:w-auto"
          >
            {firm.promoCode ? `Get ${firm.promoCode}` : 'View offer'}
          </PfgPrimary>
        ) : null}
        {genie ? (
          <PfgGhost href={genie} compact={compact} className={compact ? 'h-11 w-full min-h-11 px-2 sm:h-8 sm:w-auto sm:min-h-8 sm:px-3' : ''}>
            <span className="sm:hidden">Firm</span>
            <span className="hidden sm:inline">Firm page</span>
          </PfgGhost>
        ) : null}
      </div>
      {!compact ? <PlanFacts plan={plan} /> : null}
    </div>
  );
}

function defaultSymbol(book, fallback) {
  const list = instrumentsForBook(book);
  return list.find(i => i.id === fallback)?.id || list[0]?.id || fallback;
}

function useBookSymbol(book, fallback) {
  const [sym, setSym] = useState(() => defaultSymbol(book, fallback));
  useEffect(() => {
    const list = instrumentsForBook(book);
    setSym(s => (list.some(i => i.id === s) ? s : defaultSymbol(book, fallback)));
  }, [book, fallback]);
  return [sym, setSym];
}

export function PositionSizeCalc({ plan, custom, book = 'futures' }) {
  const [sym, setSym] = useBookSymbol(book, 'MNQ');
  const inst = instrumentById(sym);
  const start = custom ? 50000 : plan?.accountDollars || 50000;
  const maxLoss = custom ? 2000 : plan?.maxLoss || 2000;
  const daily = custom ? 1000 : plan?.dailyDrawdown || 0;
  const planCap = parseMaxLots(plan?.maxLots, inst.kind);
  const [riskPct, setRiskPct] = useState(1);
  const [stopTicks, setStopTicks] = useState(20);
  const [todayPnl, setTodayPnl] = useState(0);
  const [lock, setLock] = useState(false);
  const [maxContracts, setMaxContracts] = useState(planCap ?? 40);
  useEffect(() => {
    if (planCap != null) setMaxContracts(planCap);
  }, [planCap]);
  const kind = drawdownKind(plan?.maxLossType);
  const dollarRisk = start * (riskPct / 100);
  const sized = positionSize({
    dollarRisk,
    stopTicks,
    tickValue: inst.tickValue,
    maxContracts: maxContracts || Infinity,
  });
  const room = drawdownRoom({
    startBalance: start,
    peakBalance: start,
    equity: start + Number(todayPnl),
    maxLoss,
    dailyLimit: daily,
    todayPnl: Number(todayPnl),
    kind,
    lockAtStart: lock,
    openRisk: sized.actualRisk,
  });

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="min-w-0 space-y-3">
        <InstrumentChips value={sym} onChange={setSym} book={book} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Risk (%)">
            <input className={FIELD} type="number" min="0.1" step="0.1" value={riskPct} onChange={e => setRiskPct(+e.target.value)} inputMode="decimal" autoComplete="off" enterKeyHint="done" />
          </Field>
          <Field label="Stop (ticks)">
            <input className={FIELD} type="number" min="1" value={stopTicks} onChange={e => setStopTicks(+e.target.value)} inputMode="numeric" pattern="[0-9]*" autoComplete="off" enterKeyHint="done" />
          </Field>
          <Field label="Max contracts">
            <input className={FIELD} type="number" min="1" value={maxContracts} onChange={e => setMaxContracts(+e.target.value)} inputMode="numeric" pattern="[0-9]*" autoComplete="off" enterKeyHint="done" />
          </Field>
          <Field label="Today P&L ($)">
            <input className={FIELD} type="number" value={todayPnl} onChange={e => setTodayPnl(+e.target.value)} inputMode="decimal" autoComplete="off" enterKeyHint="done" />
          </Field>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-[0.875rem] text-emerald-100/75">
          <input type="checkbox" className="size-5 accent-[#3FB185]" checked={lock} onChange={e => setLock(e.target.checked)} />
          Lock trailing floor at start
        </label>
        <p className="m-0 text-[0.75rem] leading-snug text-emerald-200/40 sm:text-[0.8125rem]">
          {inst.name}: ${inst.tickValue}/tick · ${inst.pointValue}/pt
          {planCap != null ? ` · plan cap ${planCap} ${inst.kind}` : ''}
        </p>
      </div>
      <Results>
        <Stat label="Contracts" value={sized.contracts} hint={sized.capped ? `Raw ${sized.uncapped}, capped` : `${stopTicks} ticks × ${money(inst.tickValue, 2)}`} />
        <Stat label="Risk amount" value={money(dollarRisk, 0)} hint={`${riskPct}% of ${money(start, 0)}`} />
        <Stat label="Actual risk" value={money(sized.actualRisk, 0)} />
        <Stat
          label="Stop / contract"
          value={money(sized.stopPerContract, 2)}
          hint={`${stopTicks} ticks × ${money(inst.tickValue, 2)}`}
        />
        <Stat label="Overall room" value={money(room.overallRoom, 0)} hint={`Floor ${money(room.floor, 0)}`} warn={room.overallRoom < sized.actualRisk} />
        <Stat
          label="Tightest buffer"
          value={money(room.tightest, 0)}
          hint={room.dailyRemaining != null ? `Daily left ${money(room.dailyRemaining, 0)}` : 'No daily cap in catalog'}
          warn={room.tightest < sized.actualRisk}
        />
      </Results>
    </div>
  );
}

export function BlowoutCalc({ plan, custom }) {
  const start = custom ? 50000 : plan?.accountDollars || 50000;
  const maxLoss = custom ? 2000 : plan?.maxLoss || 2000;
  const [risk, setRisk] = useState(100);
  const [rr, setRr] = useState(2);
  const table = recoveryTable({ room: maxLoss, riskPerTrade: risk, rewardRatio: rr });
  const severity = bustSeverity(table.consecutiveToBust);
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-3">
        <Field label="Risk per trade ($)">
          <input className={FIELD} type="number" min="1" value={risk} onChange={e => setRisk(+e.target.value)} inputMode="decimal" />
        </Field>
        <ChoiceChips label="Reward : risk" options={[1, 2, 3, 4, 5]} value={rr} onChange={setRr} format={n => `${n}:1`} />
        <p className="m-0 text-[0.75rem] leading-snug text-emerald-200/40 sm:text-[0.8125rem]">
          Room is this plan’s max loss ({money(maxLoss)}), not account size ({money(start)}).
        </p>
      </div>
      <div className="space-y-3">
        <Results>
          <Stat label="Losses until bust" value={table.consecutiveToBust} hint={severity} warn={table.consecutiveToBust < 5} />
        </Results>
        <div className="-mx-0.5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[18rem] text-left text-[0.75rem] sm:text-[0.875rem]">
            <thead className="text-emerald-200/45">
              <tr>
                <th className="px-3 py-2 font-semibold">Losses</th>
                <th className="px-3 py-2 font-semibold">Drawdown</th>
                <th className="px-3 py-2 font-semibold">Wins to recover</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map(row => (
                <tr key={row.losses} className={row.blows ? 'text-amber-300' : 'text-white/80'}>
                  <td className="px-3 py-1.5 tabular-nums">{row.losses}</td>
                  <td className="px-3 py-1.5 tabular-nums">{money(row.lost)}</td>
                  <td className="px-3 py-1.5 tabular-nums">{row.winsToRecover === Infinity ? '—' : row.winsToRecover}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const RULE_CHIPS = [20, 30, 35, 40, 45, 50];

export function ConsistencyCalc({ plan, custom, firms }) {
  const [best, setBest] = useState(1000);
  const [total, setTotal] = useState(2500);
  const [phase, setPhase] = useState('funded');
  const raw = phase === 'eval' ? plan?.consistencyEval : plan?.consistencyFunded;
  const catalogRatio = custom ? null : parseConsistencyRatio(raw);
  const [rulePct, setRulePct] = useState(30);
  const ratio = catalogRatio ?? rulePct / 100;
  const result = consistencyCheck({ bestDay: best, totalProfit: total, ruleRatio: ratio || 0 });

  const peers = useMemo(() => {
    return firms
      .map(f => {
        const p = f.plans.find(x => x.accountSize === plan?.accountSize) || f.plans[0];
        const r = parseConsistencyRatio(p?.consistencyFunded);
        if (r == null) return null;
        return { name: f.name, needed: consistencyCheck({ bestDay: best, totalProfit: total, ruleRatio: r }).neededTotal, rule: r };
      })
      .filter(Boolean)
      .slice(0, 8);
  }, [firms, best, total, plan]);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-3">
        <ChoiceChips label="Phase" options={['eval', 'funded']} value={phase} onChange={setPhase} format={p => (p === 'eval' ? 'Eval' : 'Funded')} />
        <Field label="Biggest end-of-day P&L ($)">
          <input className={FIELD} type="number" min="0" value={best} onChange={e => setBest(+e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Total profit so far ($)">
          <input className={FIELD} type="number" min="0" value={total} onChange={e => setTotal(+e.target.value)} inputMode="decimal" />
        </Field>
        {catalogRatio == null ? (
          <ChoiceChips label="Consistency rule" options={RULE_CHIPS} value={rulePct} onChange={setRulePct} format={n => `${n}%`} />
        ) : (
          <p className="m-0 text-[0.8125rem] text-emerald-100/60">
            {phase === 'eval' ? 'Eval' : 'Funded'} rule {raw}
          </p>
        )}
      </div>
      <div className="grid gap-3">
        {!result.applies ? (
          <Results>
            <Stat label="Rule" value="None" hint="This plan has no consistency cap in the catalog." />
          </Results>
        ) : (
          <Results>
            <Stat label={result.pass ? 'Eligible' : 'Blocked'} value={result.pass ? 'Pass' : 'Need more profit'} warn={!result.pass} />
            <Stat
              label="Total needed"
              value={money(result.neededTotal, 0)}
              hint={`${money(best, 0)} / ${(ratio * 100).toFixed(0)}% = ${money(result.neededTotal, 0)}`}
            />
            <Stat label="Still to earn" value={money(result.stillToEarn, 0)} />
            <Stat label="Max safe next day" value={money(result.maxSafeNextDay, 0)} hint="New best-day ceiling at the current total" />
          </Results>
        )}
        {peers.length ? (
          <div className="rounded-2xl border border-white/10 p-3">
            <div className="mb-2 text-[0.75rem] text-emerald-200/45">Same best day, other funded rules</div>
            <ul className="m-0 list-none space-y-1.5 p-0 text-[0.8125rem] text-emerald-100/70">
              {peers.map(p => (
                <li key={p.name} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-[#3FB185]">{money(p.needed, 0)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ChallengeCostCalc({ plan, custom }) {
  const [gross, setGross] = useState(3000);
  const split = custom ? 90 : plan?.profitSplit || 90;
  const fee = custom ? 99 : plan?.price || 0;
  const act = custom ? 0 : plan?.activationFee || 0;
  const take = payoutTakeHome({ grossProfit: gross, profitSplitPct: split, activationFee: act, challengeFee: fee });
  const cycles = recoupPayouts(take.fees, take.yours);
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-3">
        <Field label="Gross profit on the account ($)">
          <input className={FIELD} type="number" min="0" value={gross} onChange={e => setGross(+e.target.value)} inputMode="decimal" />
        </Field>
        <p className="m-0 text-[0.75rem] leading-snug text-emerald-100/55 sm:text-[0.8125rem]">
          Split {split}% · challenge {money(fee, 2)} · activation {money(act, 0)}
          {plan?.payoutFreq ? ` · ${plan.payoutFreq}` : ''}
          {plan?.minTradingDays ? ` · min days ${plan.minTradingDays}` : ''}
        </p>
      </div>
      <Results>
        <Stat label="Your take" value={money(take.yours, 0)} />
        <Stat label="Firm share" value={money(take.firmShare, 0)} />
        <Stat label="Cash out the door" value={money(take.fees, 2)} />
        <Stat label="Payouts to recoup" value={cycles === Infinity ? '—' : cycles} hint={`Net after fees ${money(take.netAfterFees, 0)}`} />
      </Results>
    </div>
  );
}

const RR_CHIPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function GrowthCalc({ plan, custom }) {
  const start = custom ? 2000 : Math.min(plan?.maxLoss || 2000, 5000);
  const [risk, setRisk] = useState(20);
  const [wr, setWr] = useState(50);
  const [rr, setRr] = useState(2);
  const [tpd, setTpd] = useState(3);
  const [compound, setCompound] = useState(false);
  const rows = projectGrowth({
    startBalance: start,
    risk,
    winRate: wr / 100,
    rewardRatio: rr,
    tradesPerDay: tpd,
    compound,
  });
  const ev = expectedValue({ winRate: wr / 100, rewardRatio: rr, risk });
  const be = breakevenWinRate(rr);
  const labels = { 1: '1 day', 21: '1 month', 63: '1 quarter', 252: '1 year' };
  const year = rows.find(r => r.days === 252);
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-3">
        <Field label="Risk per trade ($)">
          <input className={FIELD} type="number" value={risk} onChange={e => setRisk(+e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Win rate (%)">
          <input className={FIELD} type="number" value={wr} onChange={e => setWr(+e.target.value)} inputMode="decimal" />
        </Field>
        <ChoiceChips label="Risk-to-reward" options={RR_CHIPS} value={rr} onChange={setRr} format={n => `${n}:1`} />
        <Field label="Trades / day">
          <input className={FIELD} type="number" value={tpd} onChange={e => setTpd(+e.target.value)} inputMode="numeric" />
        </Field>
        <label className="flex min-h-11 items-center gap-3 text-[0.875rem] text-emerald-100/75">
          <input type="checkbox" className="size-5 accent-[#3FB185]" checked={compound} onChange={e => setCompound(e.target.checked)} />
          Compound (% of start each trade)
        </label>
        <p className="m-0 text-[0.75rem] leading-snug text-emerald-200/40 sm:text-[0.8125rem]">
          Breakeven win rate {(be * 100).toFixed(0)}% at {rr}:1. Expected {money(ev, 2)} / trade.
          {wr / 100 > be ? ' Setup is profitable in EV.' : ' Win rate is below breakeven.'} Prop accounts usually keep size fixed.
        </p>
      </div>
      <Results>
        {rows.map(r => (
          <Stat key={r.days} label={labels[r.days] || `${r.days} days`} value={money(r.balance, 0)} hint={`${r.pct.toFixed(0)}% · ${money(r.profit, 0)}`} />
        ))}
        {year ? (
          <>
            <Stat label="Monthly profit" value={money(year.profit / 12, 0)} />
            <Stat label="Yearly profit" value={money(year.profit, 0)} />
          </>
        ) : null}
      </Results>
    </div>
  );
}

const BUDGETS = [500, 1000, 2000, 3000, 4500, 6000];
const MODES = [
  { id: 'conservative', label: 'Conservative' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'pyramid', label: 'Pyramid' },
  { id: 'aggressive', label: 'Aggressive' },
];

export function DcaCalc({ book = 'futures' }) {
  const [sym, setSym] = useBookSymbol(book, 'MNQ');
  const inst = instrumentById(sym);
  const [entry, setEntry] = useState(21000);
  const [interval, setInterval] = useState(10);
  const [levels, setLevels] = useState(16);
  const [mode, setMode] = useState('conservative');
  const [dir, setDir] = useState('long');
  const [budget, setBudget] = useState(2000);
  const [tp, setTp] = useState(20);
  const ladder = dcaLadder({
    entry,
    intervalPts: interval,
    direction: dir,
    levels,
    mode,
    pointValue: inst.pointValue,
    maxRisk: budget,
  });
  const take = dcaTakeProfit(ladder, tp);
  return (
    <div className="space-y-3 sm:space-y-4">
      <InstrumentChips value={sym} onChange={setSym} book={book} />
      <p className="m-0 text-[0.75rem] text-emerald-200/40 sm:text-[0.8125rem]">
        {inst.name} — ${inst.pointValue}/pt · tick {inst.tickSize}
      </p>
      <ChoiceChips label="Direction" options={['long', 'short']} value={dir} onChange={setDir} format={d => (d === 'long' ? 'Long' : 'Short')} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Entry">
          <input className={FIELD} type="number" value={entry} onChange={e => setEntry(+e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Interval (pts)">
          <input className={FIELD} type="number" value={interval} onChange={e => setInterval(+e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Max levels">
          <input className={FIELD} type="number" min="1" max="24" value={levels} onChange={e => setLevels(+e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Take profit (pts)">
          <input className={FIELD} type="number" value={tp} onChange={e => setTp(+e.target.value)} inputMode="decimal" />
        </Field>
      </div>
      <ChoiceChips label="Drawdown budget" options={BUDGETS} value={budget} onChange={setBudget} format={n => money(n, 0)} />
      <ChoiceChips label="Scaling mode" options={MODES} value={mode} onChange={setMode} />
      <Results>
        <Stat label="Levels used" value={ladder.levelsUsed} hint={`${ladder.total} ${inst.id}`} />
        <Stat label="Points covered" value={ladder.dropPts} hint={`Avg ${ladder.avg.toFixed(2)}`} />
        <Stat label="$ / pt max" value={money(ladder.dollarsPerPt, 0)} />
        <Stat label="At risk" value={money(ladder.atRisk, 0)} warn={ladder.atRisk >= budget} />
        <Stat label="Recovery" value={`${ladder.recovery.toFixed(1)}×`} hint={`Drop ${ladder.dropPts} pts, need ${ladder.bePts.toFixed(1)} to BE`} />
        <Stat label={`Profit at +${tp} pts`} value={money(take.profit, 0)} hint={`R:R 1 : ${take.rewardRatio.toFixed(2)}`} />
      </Results>
      <div className="-mx-0.5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[32rem] text-left text-[0.75rem] sm:text-[0.875rem]">
          <thead className="text-emerald-200/45">
            <tr>
              {['Level', 'Price', 'Add', 'Total', 'Avg', '$/pt', 'Risk'].map(h => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-white/80">
            {ladder.rows.map(row => (
              <tr key={row.level} className="border-t border-white/5">
                <td className="px-3 py-1.5">{row.level}</td>
                <td className="px-3 py-1.5 tabular-nums">{row.price.toFixed(2)}</td>
                <td className="px-3 py-1.5 tabular-nums">+{row.add}</td>
                <td className="px-3 py-1.5 tabular-nums">{row.total}</td>
                <td className="px-3 py-1.5 tabular-nums">{row.avg.toFixed(2)}</td>
                <td className="px-3 py-1.5 tabular-nums">{money(row.dollarsPerPt, 0)}</td>
                <td className="px-3 py-1.5 tabular-nums">{money(row.risk, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CheatSheet({ book = 'futures' }) {
  const rooms = [300, 600, 750, 1000, 1500, 2000, 2500, 3000];
  const stop = 20;
  const specs = book === 'perps'
    ? [
        { id: 'NQ1', pointValue: 1 },
        { id: 'ES1', pointValue: 5 },
      ]
    : [
        { id: 'MNQ', pointValue: 2 },
        { id: 'NQ', pointValue: 20 },
        { id: 'MES', pointValue: 5 },
        { id: 'ES', pointValue: 50 },
      ];
  const row = (pointValue, room) => {
    const per = pointValue * stop;
    const n = Math.max(1, Math.floor(room / per));
    return { n, dollars: n * pointValue, stop: n * per };
  };
  return (
    <div className="space-y-3">
      <div className="-mx-0.5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[22rem] text-left text-[0.75rem] sm:text-[0.875rem]">
          <thead className="text-emerald-200/45">
            <tr>
              <th className="px-3 py-2 font-semibold">Your room</th>
              {specs.map(s => (
                <th key={s.id} className="px-3 py-2 font-semibold">
                  {s.id}
                </th>
              ))}
              <th className="px-3 py-2 font-semibold">20-pt stop</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {rooms.map(room => {
              const first = row(specs[0].pointValue, room);
              return (
                <tr key={room} className="border-t border-white/5">
                  <td className="px-3 py-1.5 tabular-nums">{money(room)}</td>
                  {specs.map(s => {
                    const r = row(s.pointValue, room);
                    return (
                      <td key={s.id} className="px-3 py-1.5 tabular-nums">
                        {r.n} · ${r.dollars}/pt
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5 tabular-nums">{money(first.stop)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {specs.map(s => (
          <div key={s.id} className="rounded-xl border border-white/10 px-3 py-2">
            <div className="text-[0.6875rem] text-emerald-200/45">{s.id}</div>
            <div className="text-[0.875rem] font-semibold text-[#3FB185]">${s.pointValue}/pt</div>
          </div>
        ))}
      </div>
      <p className="m-0 text-[0.75rem] leading-relaxed text-white/45">
        Room = the smaller of daily loss and max drawdown. A 40-pt stop halves the contract count.
        {book === 'perps' ? ' Two NQ1 units ≈ one MNQ; twenty ≈ one NQ.' : ''}
      </p>
    </div>
  );
}

export function RoiCalc({ plan, custom }) {
  const start = custom ? 50000 : plan?.accountDollars || 50000;
  const [wr, setWr] = useState(50);
  const [rr, setRr] = useState(2);
  const [riskPct, setRiskPct] = useState(0.5);
  const [tpd, setTpd] = useState(3);
  const risk = start * (riskPct / 100);
  const sim = useMemo(
    () =>
      simulateChallenge({
        startBalance: start,
        risk,
        winRate: wr / 100,
        rewardRatio: rr,
        tradesPerDay: tpd,
        profitTarget: custom ? 3000 : plan?.profitTarget || 3000,
        maxLoss: custom ? 2000 : plan?.maxLoss || 2000,
        dailyLimit: custom ? 1000 : plan?.dailyDrawdown || 0,
        trailing: drawdownKind(plan?.maxLossType) !== 'static',
        profitSplitPct: custom ? 90 : plan?.profitSplit || 90,
        fees: custom ? 99 : (plan?.price || 0) + (plan?.activationFee || 0),
        paths: 400,
      }),
    [start, risk, wr, rr, tpd, plan, custom]
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-3">
        <Field label="Win rate (%)">
          <input className={FIELD} type="number" value={wr} onChange={e => setWr(+e.target.value)} inputMode="decimal" />
        </Field>
        <ChoiceChips label="R : R" options={[1, 2, 3, 4, 5]} value={rr} onChange={setRr} format={n => `${n}:1`} />
        <Field label="Risk / trade (% of size)">
          <input className={FIELD} type="number" step="0.1" value={riskPct} onChange={e => setRiskPct(+e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Trades / day">
          <input className={FIELD} type="number" value={tpd} onChange={e => setTpd(+e.target.value)} inputMode="numeric" />
        </Field>
        <p className="m-0 text-[0.75rem] leading-snug text-emerald-200/40 sm:text-[0.8125rem]">
          400 paths, fixed dollar risk. Trailing uses this plan’s drawdown type when it is not static.
        </p>
      </div>
      <Results>
        <Stat label="Pass rate" value={pct(sim.passRate, 1)} />
        <Stat label="Blowout" value={pct(sim.blowoutRate, 1)} warn={sim.blowoutRate > 0.4} />
        <Stat label="Median take-home" value={money(sim.median, 0)} hint={`P10 ${money(sim.p10, 0)} · P90 ${money(sim.p90, 0)}`} />
        <Stat label="Fee ROI" value={sim.feeRoi == null ? '—' : `${sim.feeRoi.toFixed(0)}%`} />
      </Results>
    </div>
  );
}

export const CALC_BODY = {
  'position-size': PositionSizeCalc,
  blowout: BlowoutCalc,
  consistency: ConsistencyCalc,
  'challenge-cost': ChallengeCostCalc,
  growth: GrowthCalc,
  dca: DcaCalc,
  'cheat-sheet': CheatSheet,
  roi: RoiCalc,
};
