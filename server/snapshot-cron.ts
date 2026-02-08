import { storage } from "./storage";
import { COINGECKO_IDS } from "@shared/constants";
import { supabase } from "./supabase";
import axios from "axios";

async function isDailySnapshotsTableReady(): Promise<boolean> {
  try {
    const { error } = await supabase.from("daily_snapshots").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function takeAllSnapshots() {
  try {
    const tableReady = await isDailySnapshotsTableReady();
    if (!tableReady) {
      console.log("[Snapshot] daily_snapshots table not found. Skipping. Run the SQL migration in Supabase SQL Editor.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const userIds = await storage.getAllUserIds();

    let priceMap: Record<string, number> = { USDT: 1, INR: 0 };
    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const priceResp = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        { timeout: 10000 }
      );
      for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
        priceMap[symbol] = priceResp.data?.[geckoId]?.usd || 0;
      }
    } catch {
      console.log("[Snapshot] Warning: Could not fetch prices, using fallback");
      priceMap = { USDT: 1, INR: 0, BTC: 0, ETH: 0, BNB: 0 };
    }

    let count = 0;
    for (const userId of userIds) {
      try {
        const wallets = await storage.getWallets(userId);
        const totalBalanceUsdt = wallets.reduce((sum, w) => {
          const bal = parseFloat(w.balance);
          if (bal === 0 || w.currency === "INR") return sum;
          const usdPrice = priceMap[w.currency] || 0;
          return sum + bal * usdPrice;
        }, 0);

        await storage.createDailySnapshot(userId, today, totalBalanceUsdt.toFixed(2));
        count++;
      } catch (err: any) {
        console.error(`[Snapshot] Error for user ${userId}:`, err.message);
      }
    }

    console.log(`[Snapshot] Saved ${count}/${userIds.length} daily snapshots for ${today}`);
  } catch (err: any) {
    console.error("[Snapshot] Cron job failed:", err.message);
  }
}

export function startSnapshotCron() {
  takeAllSnapshots();

  const now = new Date();
  const nextMidnightUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const msUntilMidnight = nextMidnightUTC.getTime() - now.getTime();

  setTimeout(() => {
    takeAllSnapshots();
    setInterval(takeAllSnapshots, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(`[Snapshot] Cron scheduled. Next run at ${nextMidnightUTC.toISOString()} (in ${Math.round(msUntilMidnight / 1000 / 60)}min)`);
}
