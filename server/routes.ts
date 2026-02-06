import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { registerSchema, swapRequestSchema, inrDepositSchema, inrWithdrawSchema } from "@shared/schema";
import { COINGECKO_IDS, SWAP_SPREAD_PERCENT, ADMIN_WALLETS, ADMIN_BANK_DETAILS, SUPPORTED_NETWORKS } from "@shared/constants";
import axios from "axios";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const existing = await storage.getUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(parsed.data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(parsed.data);

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.json({ id: user.id, username: user.username, email: user.email });
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        return res.json({ id: user.id, username: user.username, email: user.email });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user!;
    res.json({ id: user.id, username: user.username, email: user.email });
  });

  app.get("/api/wallet", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(req.user!.id);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prices", async (_req, res) => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,inr`,
        { timeout: 10000 }
      );
      const prices: Record<string, { usd: number; inr: number }> = {};
      for (const [symbol, cgId] of Object.entries(COINGECKO_IDS)) {
        if (response.data[cgId]) {
          prices[symbol] = {
            usd: response.data[cgId].usd,
            inr: response.data[cgId].inr,
          };
        }
      }
      prices["INR"] = { usd: 0, inr: 1 };
      res.json(prices);
    } catch (error: any) {
      res.status(503).json({ message: "Price feed unavailable" });
    }
  });

  app.post("/api/swap", requireAuth, async (req, res) => {
    try {
      const parsed = swapRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const { fromCurrency, toCurrency, fromAmount } = parsed.data;
      const userId = req.user!.id;
      const amount = parseFloat(fromAmount);

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const fromWallet = await storage.getWallet(userId, fromCurrency);
      if (!fromWallet || parseFloat(fromWallet.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const ids = Object.values(COINGECKO_IDS).join(",");
      const priceResp = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,inr`,
        { timeout: 10000 }
      );

      let fromPriceUsd = 1;
      let toPriceUsd = 1;

      if (fromCurrency === "INR") {
        const usdInr = priceResp.data["tether"]?.inr || 83;
        fromPriceUsd = 1 / usdInr;
      } else if (COINGECKO_IDS[fromCurrency]) {
        fromPriceUsd = priceResp.data[COINGECKO_IDS[fromCurrency]]?.usd || 0;
      }

      if (toCurrency === "INR") {
        const usdInr = priceResp.data["tether"]?.inr || 83;
        toPriceUsd = 1 / usdInr;
      } else if (COINGECKO_IDS[toCurrency]) {
        toPriceUsd = priceResp.data[COINGECKO_IDS[toCurrency]]?.usd || 0;
      }

      if (fromPriceUsd === 0 || toPriceUsd === 0) {
        return res.status(503).json({ message: "Price feed unavailable for this pair" });
      }

      const rawRate = fromPriceUsd / toPriceUsd;
      const spreadMultiplier = 1 - SWAP_SPREAD_PERCENT / 100;
      const effectiveRate = rawRate * spreadMultiplier;
      const toAmount = amount * effectiveRate;

      const newFromBalance = (parseFloat(fromWallet.balance) - amount).toFixed(8);
      const toWallet = await storage.getWallet(userId, toCurrency);
      const newToBalance = (parseFloat(toWallet?.balance || "0") + toAmount).toFixed(8);

      await storage.updateWalletBalance(userId, fromCurrency, newFromBalance);
      await storage.updateWalletBalance(userId, toCurrency, newToBalance);

      const swap = await storage.createSwap({
        userId,
        fromCurrency,
        toCurrency,
        fromAmount: amount.toFixed(8),
        toAmount: toAmount.toFixed(8),
        rate: effectiveRate.toFixed(8),
        spreadPercent: SWAP_SPREAD_PERCENT.toFixed(2),
        status: "completed",
      });

      res.json(swap);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Swap failed" });
    }
  });

  app.get("/api/swap/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getSwapHistory(req.user!.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit/address", requireAuth, (_req, res) => {
    res.json({
      wallets: ADMIN_WALLETS,
      networks: SUPPORTED_NETWORKS,
    });
  });

  app.post("/api/deposit/crypto", requireAuth, async (req, res) => {
    try {
      const { currency, network, txHash } = req.body;
      if (!currency || !network) {
        return res.status(400).json({ message: "Currency and network are required" });
      }

      const deposit = await storage.createCryptoDeposit({
        userId: req.user!.id,
        currency,
        network,
        txHash: txHash || null,
        amount: null,
        status: "pending",
      });

      res.json(deposit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit/crypto/history", requireAuth, async (req, res) => {
    try {
      const deposits = await storage.getCryptoDeposits(req.user!.id);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inr/bank-details", requireAuth, (_req, res) => {
    res.json(ADMIN_BANK_DETAILS);
  });

  app.post("/api/inr/deposit", requireAuth, async (req, res) => {
    try {
      const parsed = inrDepositSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const tx = await storage.createInrTransaction({
        userId: req.user!.id,
        type: "deposit",
        amount: parsed.data.amount,
        utrNumber: parsed.data.utrNumber,
        bankName: null,
        accountNumber: null,
        ifscCode: null,
        status: "pending",
      });

      res.json(tx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inr/withdraw", requireAuth, async (req, res) => {
    try {
      const parsed = inrWithdrawSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const userId = req.user!.id;
      const amount = parseFloat(parsed.data.amount);

      const wallet = await storage.getWallet(userId, "INR");
      if (!wallet || parseFloat(wallet.balance) < amount) {
        return res.status(400).json({ message: "Insufficient INR balance" });
      }

      const newBalance = (parseFloat(wallet.balance) - amount).toFixed(2);
      await storage.updateWalletBalance(userId, "INR", newBalance);

      const tx = await storage.createInrTransaction({
        userId,
        type: "withdraw",
        amount: amount.toFixed(2),
        utrNumber: null,
        bankName: parsed.data.bankName,
        accountNumber: parsed.data.accountNumber,
        ifscCode: parsed.data.ifscCode,
        status: "pending",
      });

      res.json(tx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inr/history", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getInrTransactions(req.user!.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
