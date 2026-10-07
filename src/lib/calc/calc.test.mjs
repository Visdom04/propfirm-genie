import assert from 'node:assert/strict';
import { consistencyNeeded, consistencyCheck } from './consistency.mjs';
import { positionSize } from './positionSize.mjs';
import { drawdownFloor, drawdownRoom } from './drawdown.mjs';
import { lossesUntilBust, winsToRecover } from './blowout.mjs';
import { payoutTakeHome, recoupPayouts } from './payout.mjs';
import { expectedValue, breakevenWinRate } from './growth.mjs';
import { dcaLadder, dcaTakeProfit } from './dca.mjs';
import { bustSeverity } from './blowout.mjs';

assert.equal(Math.round(consistencyNeeded(1000, 0.3) * 100) / 100, 3333.33);
const c = consistencyCheck({ bestDay: 1000, totalProfit: 2000, ruleRatio: 0.3 });
assert.equal(c.pass, false);
assert.equal(Math.round(c.stillToEarn * 100) / 100, 1333.33);

const size = positionSize({ dollarRisk: 1000, stopTicks: 20, tickValue: 0.5, maxContracts: 40 });
assert.equal(size.contracts, 40);
assert.equal(size.capped, true);
assert.equal(size.uncapped, 100);

assert.equal(drawdownFloor({ startBalance: 50000, peakBalance: 52000, maxLoss: 2000, kind: 'static' }), 48000);
assert.equal(drawdownFloor({ startBalance: 50000, peakBalance: 52000, maxLoss: 2000, kind: 'eod' }), 50000);

const room = drawdownRoom({
  startBalance: 50000,
  peakBalance: 50000,
  equity: 49500,
  maxLoss: 2000,
  dailyLimit: 1000,
  todayPnl: -200,
  kind: 'static',
});
assert.equal(room.overallRoom, 1500);
assert.equal(room.dailyRemaining, 800);
assert.equal(room.tightest, 800);

assert.equal(lossesUntilBust(2000, 100), 20);
assert.equal(winsToRecover(300, 200), 2);

const pay = payoutTakeHome({ grossProfit: 4000, profitSplitPct: 90, activationFee: 0, challengeFee: 55 });
assert.equal(pay.yours, 3600);
assert.equal(recoupPayouts(55, 3600), 1);

assert.equal(expectedValue({ winRate: 0.5, rewardRatio: 2, risk: 100 }), 50);

const ladder = dcaLadder({
  entry: 21000,
  intervalPts: 10,
  direction: 'long',
  levels: 2,
  mode: 'conservative',
  pointValue: 2,
});
assert.equal(ladder.total, 3);
assert.equal(ladder.rows[0].add, 1);
assert.equal(ladder.dropPts, 20);
assert.equal(ladder.bePts, 10);
assert.equal(ladder.recovery, 2);
const tp = dcaTakeProfit(ladder, 20);
assert.equal(tp.profit, 120);
assert.equal(breakevenWinRate(2), 1 / 3);
assert.equal(bustSeverity(20), 'Conservative');
assert.equal(bustSeverity(3), 'Fragile');

console.log('calc tests ok');
