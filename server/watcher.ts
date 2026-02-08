import axios from "axios";
import { storage } from "./storage";
import { getRequiredConfirmations } from "./crypto";

const SCAN_APIS: Record<string, { base: string; apiKeyEnv: string }> = {
  bsc: { base: "https://api.bscscan.com/api", apiKeyEnv: "BSCSCAN_API_KEY" },
  polygon: { base: "https://api.polygonscan.com/api", apiKeyEnv: "POLYGONSCAN_API_KEY" },
};

async function getBlockNumber(network: string): Promise<number | null> {
  const config = SCAN_APIS[network];
  if (!config) return null;
  const apiKey = process.env[config.apiKeyEnv] || process.env.TATUM_API_KEY || "";
  try {
    const resp = await axios.get(config.base, {
      params: { module: "proxy", action: "eth_blockNumber", apikey: apiKey },
      timeout: 10000,
    });
    if (resp.data.result) return parseInt(resp.data.result, 16);
  } catch (err: any) {
    console.error(`[Watcher] Failed to get block number for ${network}:`, err.message);
  }
  return null;
}

async function checkAddressTransactions(
  address: string,
  network: string
): Promise<Array<{ hash: string; from: string; to: string; value: string; blockNumber: number; confirmations: number }>> {
  const config = SCAN_APIS[network];
  if (!config) return [];
  const apiKey = process.env[config.apiKeyEnv] || process.env.TATUM_API_KEY || "";

  try {
    const currentBlock = await getBlockNumber(network);
    if (!currentBlock) return [];

    const resp = await axios.get(config.base, {
      params: {
        module: "account",
        action: "txlist",
        address,
        startblock: Math.max(0, currentBlock - 50000),
        endblock: currentBlock,
        sort: "desc",
        apikey: apiKey,
      },
      timeout: 15000,
    });

    if (resp.data.status !== "1" || !Array.isArray(resp.data.result)) return [];

    return resp.data.result
      .filter((tx: any) => tx.to?.toLowerCase() === address.toLowerCase() && tx.isError === "0")
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        blockNumber: parseInt(tx.blockNumber),
        confirmations: currentBlock - parseInt(tx.blockNumber),
      }));
  } catch (err: any) {
    console.error(`[Watcher] Error checking ${network} address ${address}:`, err.message);
    return [];
  }
}

function weiToEther(wei: string): string {
  const weiBig = BigInt(wei);
  const etherStr = (Number(weiBig) / 1e18).toFixed(8);
  return etherStr;
}

async function processDeposits(): Promise<void> {
  const hasApiKey = process.env.BSCSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY || process.env.TATUM_API_KEY;
  if (!hasApiKey) return;

  try {
    const depositAddresses = await storage.getAllDepositAddresses();
    if (depositAddresses.length === 0) return;

    const uniqueAddresses = new Map<string, { user_id: number; currency: string }>();
    for (const da of depositAddresses) {
      if (da.deposit_address) {
        uniqueAddresses.set(da.deposit_address.toLowerCase(), {
          user_id: da.user_id,
          currency: da.currency,
        });
      }
    }

    const entries = Array.from(uniqueAddresses.entries());
    for (const [address, info] of entries) {
      for (const network of ["bsc", "polygon"]) {
        try {
          const txs = await checkAddressTransactions(address, network);

          for (const tx of txs) {
            if (tx.value === "0") continue;

            const existing = await storage.getTransactionByTxHash(tx.hash);
            if (existing) {
              if (existing.status === "confirming") {
                const required = getRequiredConfirmations(network);
                if (tx.confirmations >= required) {
                  await storage.updateTransactionConfirmations(existing.id, tx.confirmations, "completed");
                  await storage.adjustUserBalance(info.user_id, info.currency, parseFloat(existing.amount));
                  console.log(`[Watcher] Deposit confirmed: ${tx.hash} - ${existing.amount} ${info.currency}`);
                } else {
                  await storage.updateTransactionConfirmations(existing.id, tx.confirmations);
                }
              }
              continue;
            }

            const required = getRequiredConfirmations(network);
            const amount = weiToEther(tx.value);
            const status = tx.confirmations >= required ? "completed" : "confirming";

            const newTx = await storage.createTransaction({
              user_id: info.user_id,
              type: "deposit",
              currency: info.currency,
              amount,
              network,
              status,
              tx_hash: tx.hash,
              confirmations: tx.confirmations,
              required_confirmations: required,
              from_address: tx.from,
              to_address: tx.to,
              withdraw_address: null,
              admin_note: null,
            });

            if (status === "completed") {
              await storage.adjustUserBalance(info.user_id, info.currency, parseFloat(amount));
              console.log(`[Watcher] Auto-credited deposit: ${tx.hash} - ${amount} ${info.currency}`);
            } else {
              console.log(`[Watcher] New deposit detected: ${tx.hash} - ${amount} ${info.currency} (${tx.confirmations}/${required} confirmations)`);
            }
          }
        } catch (err: any) {
          console.error(`[Watcher] Error processing ${network} for ${address}:`, err.message);
        }
      }
    }

    const pendingDeposits = await storage.getAllPendingDeposits();
    for (const deposit of pendingDeposits) {
      if (!deposit.tx_hash || !deposit.to_address) continue;
      const network = deposit.network;
      try {
        const txs = await checkAddressTransactions(deposit.to_address, network);
        const matchingTx = txs.find(t => t.hash.toLowerCase() === deposit.tx_hash!.toLowerCase());
        if (matchingTx) {
          const required = getRequiredConfirmations(network);
          if (matchingTx.confirmations >= required && deposit.status !== "completed") {
            await storage.updateTransactionConfirmations(deposit.id, matchingTx.confirmations, "completed");
            await storage.adjustUserBalance(deposit.user_id, deposit.currency, parseFloat(deposit.amount));
            console.log(`[Watcher] Pending deposit confirmed: ${deposit.tx_hash}`);
          } else if (deposit.status === "confirming") {
            await storage.updateTransactionConfirmations(deposit.id, matchingTx.confirmations);
          }
        }
      } catch (err: any) {
        console.error(`[Watcher] Error updating pending deposit ${deposit.id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[Watcher] Error in deposit processing cycle:", err.message);
  }
}

let watcherInterval: NodeJS.Timeout | null = null;

export function startDepositWatcher(intervalMs: number = 30000): void {
  const hasApiKey = process.env.BSCSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY || process.env.TATUM_API_KEY;
  if (!hasApiKey) {
    console.log("[Watcher] No blockchain API key configured. Deposit monitoring disabled.");
    console.log("[Watcher] Set BSCSCAN_API_KEY or TATUM_API_KEY to enable auto-detection.");
    return;
  }

  console.log(`[Watcher] Starting deposit watcher (interval: ${intervalMs / 1000}s)`);
  processDeposits();
  watcherInterval = setInterval(processDeposits, intervalMs);
}

export function stopDepositWatcher(): void {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
    console.log("[Watcher] Deposit watcher stopped");
  }
}
