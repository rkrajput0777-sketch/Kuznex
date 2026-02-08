import axios from "axios";
import { ethers } from "ethers";
import { storage } from "./storage";
import { getRequiredConfirmations } from "./crypto";
import { ETHERSCAN_V2_BASE, SUPPORTED_CHAINS, NATIVE_CURRENCY_MAP, VERIFIED_TOKEN_CONTRACTS } from "@shared/constants";

function getApiKey(): string {
  return process.env.ETHERSCAN_API_KEY || "";
}

async function getBlockNumber(chainId: number): Promise<number | null> {
  const apiKey = getApiKey();
  try {
    const resp = await axios.get(ETHERSCAN_V2_BASE, {
      params: {
        chainid: chainId,
        module: "proxy",
        action: "eth_blockNumber",
        apikey: apiKey,
      },
      timeout: 10000,
    });
    if (resp.data.result) return parseInt(resp.data.result, 16);
  } catch (err: any) {
    console.error(`[Watcher] Failed to get block number for chainId ${chainId}:`, err.message);
  }
  return null;
}

async function getNormalTransactions(
  address: string,
  chainId: number,
  currentBlock: number
): Promise<Array<{ hash: string; from: string; to: string; value: string; blockNumber: number; confirmations: number }>> {
  const apiKey = getApiKey();
  try {
    const resp = await axios.get(ETHERSCAN_V2_BASE, {
      params: {
        chainid: chainId,
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
    console.error(`[Watcher] Error fetching txlist for ${address} on chainId ${chainId}:`, err.message);
    return [];
  }
}

async function getTokenTransactions(
  address: string,
  chainId: number,
  currentBlock: number
): Promise<Array<{ hash: string; from: string; to: string; value: string; blockNumber: number; confirmations: number; contractAddress: string; tokenDecimal: string }>> {
  const apiKey = getApiKey();
  try {
    const resp = await axios.get(ETHERSCAN_V2_BASE, {
      params: {
        chainid: chainId,
        module: "account",
        action: "tokentx",
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
      .filter((tx: any) => tx.to?.toLowerCase() === address.toLowerCase())
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        blockNumber: parseInt(tx.blockNumber),
        confirmations: currentBlock - parseInt(tx.blockNumber),
        contractAddress: (tx.contractAddress || "").toLowerCase(),
        tokenDecimal: tx.tokenDecimal || "18",
      }));
  } catch (err: any) {
    console.error(`[Watcher] Error fetching tokentx for ${address} on chainId ${chainId}:`, err.message);
    return [];
  }
}

function resolveVerifiedToken(chainId: number, contractAddress: string): { currency: string; decimals: number } | null {
  const chainTokens = VERIFIED_TOKEN_CONTRACTS[chainId];
  if (!chainTokens) return null;
  return chainTokens[contractAddress.toLowerCase()] || null;
}

function networkIdFromChainId(chainId: number): string {
  for (const [id, chain] of Object.entries(SUPPORTED_CHAINS)) {
    if (chain.chainId === chainId) return id;
  }
  return "unknown";
}

async function processDeposits(): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  try {
    const depositAddresses = await storage.getAllDepositAddresses();
    if (depositAddresses.length === 0) return;

    const uniqueAddresses = new Map<string, { user_id: number; currency: string }>();
    for (const da of depositAddresses) {
      if (da.deposit_address) {
        const key = da.deposit_address.toLowerCase();
        if (!uniqueAddresses.has(key)) {
          uniqueAddresses.set(key, {
            user_id: da.user_id,
            currency: da.currency,
          });
        }
      }
    }

    const chainIds = Object.values(SUPPORTED_CHAINS).map(c => c.chainId);

    for (const chainId of chainIds) {
      const networkId = networkIdFromChainId(chainId);
      const currentBlock = await getBlockNumber(chainId);
      if (!currentBlock) continue;

      const nativeCurrency = NATIVE_CURRENCY_MAP[chainId] || "ETH";

      for (const [address, info] of Array.from(uniqueAddresses.entries())) {
        try {
          const nativeTxs = await getNormalTransactions(address, chainId, currentBlock);
          for (const tx of nativeTxs) {
            if (tx.value === "0") continue;
            const nativeInfo = { user_id: info.user_id, currency: nativeCurrency };
            await processIncomingTx(tx, nativeInfo, networkId);
          }

          const tokenTxs = await getTokenTransactions(address, chainId, currentBlock);
          for (const tx of tokenTxs) {
            if (tx.value === "0") continue;
            const verifiedToken = resolveVerifiedToken(chainId, tx.contractAddress);
            if (!verifiedToken) continue;
            const tokenInfo = { user_id: info.user_id, currency: verifiedToken.currency };
            const amount = ethers.formatUnits(tx.value, verifiedToken.decimals);
            await processIncomingTx(tx, tokenInfo, networkId, amount);
          }
        } catch (err: any) {
          console.error(`[Watcher] Error processing chainId ${chainId} for ${address}:`, err.message);
        }
      }

      await new Promise(r => setTimeout(r, 250));
    }

    const pendingDeposits = await storage.getAllPendingDeposits();
    for (const deposit of pendingDeposits) {
      if (!deposit.tx_hash || !deposit.to_address) continue;
      const network = deposit.network;
      const chain = SUPPORTED_CHAINS[network];
      if (!chain) continue;
      try {
        const currentBlock = await getBlockNumber(chain.chainId);
        if (!currentBlock) continue;
        const txs = await getNormalTransactions(deposit.to_address, chain.chainId, currentBlock);
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

async function processIncomingTx(
  tx: { hash: string; from: string; to: string; value: string; blockNumber: number; confirmations: number },
  info: { user_id: number; currency: string },
  networkId: string,
  precomputedAmount?: string
): Promise<void> {
  const existing = await storage.getTransactionByTxHash(tx.hash);
  if (existing) {
    if (existing.status === "confirming") {
      const required = getRequiredConfirmations(networkId);
      if (tx.confirmations >= required) {
        await storage.updateTransactionConfirmations(existing.id, tx.confirmations, "completed");
        await storage.adjustUserBalance(info.user_id, info.currency, parseFloat(existing.amount));
        console.log(`[Watcher] Deposit confirmed: ${tx.hash} - ${existing.amount} ${info.currency} on ${networkId}`);
      } else {
        await storage.updateTransactionConfirmations(existing.id, tx.confirmations);
      }
    }
    return;
  }

  const required = getRequiredConfirmations(networkId);
  const amount = precomputedAmount || ethers.formatEther(tx.value);
  const status = tx.confirmations >= required ? "completed" : "confirming";

  await storage.createTransaction({
    user_id: info.user_id,
    type: "deposit",
    currency: info.currency,
    amount,
    network: networkId,
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
    console.log(`[Watcher] Auto-credited deposit: ${tx.hash} - ${amount} ${info.currency} on ${networkId}`);
  } else {
    console.log(`[Watcher] New deposit detected: ${tx.hash} - ${amount} ${info.currency} on ${networkId} (${tx.confirmations}/${required} confirmations)`);
  }
}

let watcherInterval: NodeJS.Timeout | null = null;

export function startDepositWatcher(intervalMs: number = 60000): void {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log("[Watcher] No ETHERSCAN_API_KEY configured. Deposit monitoring disabled.");
    console.log("[Watcher] Set ETHERSCAN_API_KEY to enable auto-detection across ETH, BSC, Polygon, Base.");
    return;
  }

  console.log(`[Watcher] Starting Etherscan V2 multichain deposit watcher (interval: ${intervalMs / 1000}s)`);
  console.log(`[Watcher] Monitoring chains: ${Object.values(SUPPORTED_CHAINS).map(c => `${c.shortName} (${c.chainId})`).join(", ")}`);
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
