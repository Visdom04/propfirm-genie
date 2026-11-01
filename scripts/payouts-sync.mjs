/**
 * Hourly payout sync. Reads outgoing payouts of every tracked wallet from
 * the chain (Alchemy transfer history), stores them in payout_events, then
 * rolls the whole table into the snapshot the page renders.
 *
 *   node --env-file=.env.local scripts/payouts-sync.mjs [--chain base] [--firm vest] [--dry] [--snapshot]
 *
 * Needs ALCHEMY_API_KEY plus the Supabase service role. A chain that is not
 * enabled on the Alchemy app fails alone: the rest still sync and the run
 * exits 1 so the failure shows.
 */
import { serviceClient } from '../src/lib/fineprint/db.js';
import { buildSnapshot } from '../src/lib/payouts/snapshot.js';
import { MIN_PAYOUT, ownWalletSet, PAYOUT_WALLETS, payoutCounts } from '../src/lib/payouts/wallets.js';
import { headBlock, readPayouts } from '../src/lib/payouts/transfers.js';

const REORG_OVERLAP = 64;
const BATCH = 500;

const args = process.argv.slice(2);
const flag = name => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : null);
const dry = args.includes('--dry');
const onlyChain = flag('chain');
const onlyFirm = flag('firm');
// --snapshot: skip the chain read and only rebuild the snapshot from stored events.
const snapshotOnly = args.includes('--snapshot');

const key = process.env.ALCHEMY_API_KEY;
const db = serviceClient();
if (!key && !snapshotOnly) throw new Error('ALCHEMY_API_KEY is not set');
if (!db && !dry) throw new Error('Supabase service role is not set');

async function readCursor(wallet) {
  if (!db) return 0;
  const { data, error } = await db.from('payout_cursors').select('last_block').eq('chain', wallet.chain).eq('address', wallet.address).maybeSingle();
  if (error) throw new Error(`cursor read: ${error.message}`);
  return data ? Math.max(0, Number(data.last_block) - REORG_OVERLAP) : 0;
}

async function saveEvents(rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await db.from('payout_events').upsert(rows.slice(i, i + BATCH), { onConflict: 'chain,tx_hash,log_index', ignoreDuplicates: true });
    if (error) throw new Error(`event write: ${error.message}`);
  }
}

async function syncWallet(wallet) {
  const head = await headBlock(wallet.chain, key);
  const from = await readCursor(wallet);
  let seen = 0;
  let sum = 0;
  for await (const rows of readPayouts(wallet, key, from)) {
    seen += rows.length;
    sum += rows.reduce((total, row) => total + row.amount, 0);
    if (!dry && rows.length) await saveEvents(rows);
  }
  if (!dry) {
    const { error } = await db.from('payout_cursors').upsert({ chain: wallet.chain, address: wallet.address, firm_id: wallet.firmId, last_block: head, updated_at: new Date().toISOString() });
    if (error) throw new Error(`cursor write: ${error.message}`);
  }
  console.log(`${wallet.firmId.padEnd(14)} ${wallet.chain.padEnd(9)} from ${String(from).padStart(10)}  ${String(seen).padStart(6)} transfers  $${sum.toFixed(2)}`);
}

// Raw transfers stay in the table. What counts as a trader payout is decided here.
// Keyset paging per firm on the (firm_id, paid_at) index: offset paging over the
// whole table hits the statement timeout once it holds a few hundred thousand rows.
async function loadEvents() {
  const events = [];
  const rules = new Map(PAYOUT_WALLETS.map(wallet => [`${wallet.chain}:${wallet.address}`, wallet]));
  const firms = [...new Set(PAYOUT_WALLETS.map(wallet => wallet.firmId))];
  for (const firmId of firms) {
    let after = null;
    let edge = new Set();
    for (;;) {
      let query = db
        .from('payout_events')
        .select('chain,source,firm_id,recipient,amount,paid_at,tx_hash,log_index')
        .eq('firm_id', firmId)
        .gte('amount', MIN_PAYOUT)
        .order('paid_at', { ascending: true })
        .limit(1000);
      if (after) query = query.gte('paid_at', after);
      const { data, error } = await query;
      if (error) throw new Error(`event read ${firmId}: ${error.message}`);
      const fresh = data.filter(row => !edge.has(`${row.chain}:${row.tx_hash}:${row.log_index}`));
      for (const row of fresh) {
        const wallet = rules.get(`${row.chain}:${row.source}`);
        if (!wallet || !payoutCounts(wallet, row)) continue;
        events.push({ firmId: row.firm_id, to: row.recipient, amount: Number(row.amount), at: Date.parse(row.paid_at), kind: 'payout', tx: row.tx_hash || null, chain: row.chain });
      }
      if (data.length < 1000) break;
      const last = data[data.length - 1].paid_at;
      if (!fresh.length) throw new Error(`event read ${firmId}: over 1000 rows share ${last}`);
      // Rows at the boundary timestamp come back on the next page, so remember them.
      edge = new Set((after === last ? [...edge] : []).concat(data.filter(row => row.paid_at === last).map(row => `${row.chain}:${row.tx_hash}:${row.log_index}`)));
      after = last;
    }
  }
  return events;
}

const failed = [];
for (const wallet of snapshotOnly ? [] : PAYOUT_WALLETS) {
  if ((onlyChain && wallet.chain !== onlyChain) || (onlyFirm && wallet.firmId !== onlyFirm)) continue;
  try {
    await syncWallet(wallet);
  } catch (error) {
    failed.push(wallet);
    console.error(`FAILED ${wallet.firmId} ${wallet.chain}: ${error.message}`);
  }
}

if (!dry) {
  const events = await loadEvents();
  const snap = buildSnapshot({ events, ownWallets: ownWalletSet() });
  const { error } = await db.from('payout_snapshot').upsert({ id: 'current', data: snap, updated_at: new Date().toISOString() });
  if (error) throw new Error(`snapshot write: ${error.message}`);
  console.log(`snapshot written from ${events.length} payouts`);
}

if (failed.length) process.exit(1);
