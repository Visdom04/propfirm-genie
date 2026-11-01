import { CHAINS, ZERO_ADDRESS } from './wallets.js';

const PAGE = '0x3e8';

async function alchemy(chain, key, method, params, attempt = 0) {
  const host = CHAINS[chain].alchemy;
  const res = await fetch(`https://${host}.g.alchemy.com/v2/${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await new Promise(resolve => setTimeout(resolve, 800 * 2 ** attempt));
    return alchemy(chain, key, method, params, attempt + 1);
  }
  const body = await res.json().catch(() => ({}));
  if (body.error) throw new Error(`${chain} ${method}: ${body.error.message}`);
  if (!res.ok) throw new Error(`${chain} ${method}: HTTP ${res.status}`);
  return body.result;
}

export function headBlock(chain, key) {
  return alchemy(chain, key, 'eth_blockNumber', []).then(hex => parseInt(hex, 16));
}

// "0xhash:log:0x12" -> ["0xhash", 18]. Alchemy's uniqueId is the log identity.
export function parseUniqueId(id) {
  const [tx, kind, index] = String(id).split(':');
  return { tx, index: kind === 'log' ? parseInt(index, 16) : 0 };
}

export function toEvent(wallet, transfer) {
  const raw = transfer.rawContract || {};
  const decimals = raw.decimal ? parseInt(raw.decimal, 16) : 6;
  const amount = Number(BigInt(raw.value || '0x0')) / 10 ** decimals;
  const { tx, index } = parseUniqueId(transfer.uniqueId);
  return {
    chain: wallet.chain,
    tx_hash: tx || transfer.hash,
    log_index: index,
    firm_id: wallet.firmId,
    source: wallet.address,
    token: String(raw.address || wallet.token).toLowerCase(),
    recipient: String(transfer.to || '').toLowerCase(),
    amount: Math.round(amount * 1e6) / 1e6,
    block: parseInt(transfer.blockNum, 16),
    paid_at: transfer.metadata.blockTimestamp,
  };
}

// Every outgoing transfer of the wallet's token since fromBlock, oldest first.
export async function* readPayouts(wallet, key, fromBlock) {
  let pageKey;
  do {
    const filter = {
      fromBlock: `0x${fromBlock.toString(16)}`,
      toBlock: 'latest',
      fromAddress: wallet.address,
      contractAddresses: [wallet.token],
      category: ['erc20'],
      withMetadata: true,
      excludeZeroValue: true,
      order: 'asc',
      maxCount: PAGE,
    };
    if (wallet.mode === 'burn') filter.toAddress = ZERO_ADDRESS;
    if (pageKey) filter.pageKey = pageKey;
    const result = await alchemy(wallet.chain, key, 'alchemy_getAssetTransfers', [filter]);
    yield result.transfers.map(transfer => toEvent(wallet, transfer));
    pageKey = result.pageKey;
  } while (pageKey);
}
