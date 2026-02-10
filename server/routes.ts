import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { registerSchema, swapRequestSchema, inrDepositSchema, inrWithdrawSchema, withdrawRequestSchema, spotOrderSchema, contactMessageSchema, usdtBuySellSchema, adminRateSettingsSchema, fiatBuySchema, fiatSellSchema } from "@shared/schema";
import { COINGECKO_IDS, SWAP_SPREAD_PERCENT, ADMIN_BANK_DETAILS, SUPPORTED_NETWORKS, SUPPORTED_CHAINS, SPOT_TRADING_FEE, TRADABLE_PAIRS, VIEWABLE_PAIRS, TDS_RATE, EXCHANGE_FEE_RATE, SUPER_ADMIN_EMAIL, type ChainConfig } from "@shared/constants";
import axios from "axios";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRequiredConfirmations, decryptPrivateKey } from "./crypto";
import { ethers } from "ethers";

function extractPanFromKyc(kycData: any): string | null {
  try {
    return kycData?.aiAnalysis?.panCard?.panNumber || null;
  } catch {
    return null;
  }
}

const platformSettings = {
  paymentMethods: {
    upi: true,
    imps: true,
    bankTransfer: true,
  },
};

const kycUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const impersonatingUserId = (req as any).session?.impersonatingUserId;
      const userId = (impersonatingUserId && (req as any).user?.is_admin) ? impersonatingUserId : (req as any).user?.id;
      const dir = path.join("uploads", "kyc", String(userId));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${file.fieldname}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

function getEffectiveUserId(req: Request): number {
  const impersonatingUserId = (req.session as any).impersonatingUserId;
  if (impersonatingUserId && req.user?.is_admin) {
    return impersonatingUserId;
  }
  return req.user!.id;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.is_admin || req.user?.email !== SUPER_ADMIN_EMAIL) {
    return res.status(404).json({ message: "Not found" });
  }
  next();
}

async function requireKycVerifiedOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user?.is_admin && (req.session as any).impersonatingUserId) {
    return next();
  }
  if (req.user?.kyc_status !== "verified") {
    return res.status(403).json({ message: "KYC verification required to access this feature" });
  }
  next();
}

async function analyzeDocumentWithGemini(filePath: string, docType: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { isValid: false, error: "Gemini API key not configured", confidence: 0, issues: ["API key not configured"] };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageData = fs.readFileSync(filePath);
    const base64Image = imageData.toString("base64");
    const mimeType = filePath.endsWith(".png") ? "image/png" : "image/jpeg";

    let prompt = "";
    if (docType === "aadhaar_front") {
      prompt = "Analyze this image. Is this an Indian Aadhaar card (front side)? Extract the name and last 4 digits of Aadhaar number if visible. Respond in JSON format: { \"isValid\": true/false, \"documentType\": \"aadhaar_front\", \"name\": \"...\", \"aadhaarLast4\": \"...\", \"confidence\": 0-100, \"issues\": [] }";
    } else if (docType === "aadhaar_back") {
      prompt = "Analyze this image. Is this an Indian Aadhaar card (back side)? Check if the address section is visible. Respond in JSON format: { \"isValid\": true/false, \"documentType\": \"aadhaar_back\", \"hasAddress\": true/false, \"confidence\": 0-100, \"issues\": [] }";
    } else if (docType === "pan_card") {
      prompt = "Analyze this image. Is this an Indian PAN card? Extract the PAN number and name if visible. Respond in JSON format: { \"isValid\": true/false, \"documentType\": \"pan_card\", \"panNumber\": \"...\", \"name\": \"...\", \"confidence\": 0-100, \"issues\": [] }";
    } else if (docType === "selfie") {
      prompt = "Analyze this image. Is this a clear selfie/photo of a person's face? Check image quality and face visibility. Respond in JSON format: { \"isValid\": true/false, \"documentType\": \"selfie\", \"faceDetected\": true/false, \"imageQuality\": \"good/poor/blurry\", \"confidence\": 0-100, \"issues\": [] }";
    }

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64Image } },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { isValid: false, confidence: 0, issues: ["Could not parse AI response"], rawResponse: responseText };
  } catch (error: any) {
    return { isValid: false, error: error.message, confidence: 0, issues: [error.message] };
  }
}

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

      req.login(user as any, (err) => {
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
    const impersonatingUserId = (req.session as any).impersonatingUserId;
    if (impersonatingUserId) {
      storage.getUser(impersonatingUserId).then(targetUser => {
        if (!targetUser) return res.status(404).json({ message: "Impersonated user not found" });
        res.json({
          id: targetUser.id,
          kuznexId: targetUser.kuznex_id,
          username: targetUser.username,
          email: targetUser.email,
          kycStatus: targetUser.kyc_status,
          isAdmin: targetUser.is_admin,
          impersonating: true,
          adminId: user.id,
          adminUsername: user.username,
        });
      }).catch(() => res.status(500).json({ message: "Error loading impersonated user" }));
      return;
    }
    res.json({
      id: user.id,
      kuznexId: user.kuznex_id,
      username: user.username,
      email: user.email,
      kycStatus: user.kyc_status,
      isAdmin: user.is_admin,
      isSuperAdmin: user.is_admin && user.email === SUPER_ADMIN_EMAIL,
    });
  });

  app.get("/api/wallet", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(getEffectiveUserId(req));
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  let cachedPrices: Record<string, { usd: number; inr: number }> | null = null;
  let pricesCacheTime = 0;
  const PRICES_CACHE_TTL = 10000;

  async function fetchPrices(): Promise<Record<string, { usd: number; inr: number }>> {
    const now = Date.now();
    if (cachedPrices && now - pricesCacheTime < PRICES_CACHE_TTL) {
      return cachedPrices;
    }

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
    cachedPrices = prices;
    pricesCacheTime = now;
    return prices;
  }

  app.get("/api/prices", async (_req, res) => {
    try {
      const prices = await fetchPrices();
      res.json(prices);
    } catch (error: any) {
      if (cachedPrices) return res.json(cachedPrices);
      res.status(503).json({ message: "Price feed unavailable" });
    }
  });

  app.post("/api/swap", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = swapRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const { fromCurrency, toCurrency, fromAmount } = parsed.data;
      const userId = getEffectiveUserId(req);
      const amount = parseFloat(fromAmount);

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const fromWallet = await storage.getWallet(userId, fromCurrency);
      if (!fromWallet || parseFloat(fromWallet.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const prices = await fetchPrices();

      let fromPriceUsd = 1;
      let toPriceUsd = 1;

      if (fromCurrency === "INR") {
        const usdInr = prices["USDT"]?.inr || 83;
        fromPriceUsd = 1 / usdInr;
      } else if (prices[fromCurrency]) {
        fromPriceUsd = prices[fromCurrency].usd || 0;
      }

      if (toCurrency === "INR") {
        const usdInr = prices["USDT"]?.inr || 83;
        toPriceUsd = 1 / usdInr;
      } else if (prices[toCurrency]) {
        toPriceUsd = prices[toCurrency].usd || 0;
      }

      if (fromPriceUsd === 0 || toPriceUsd === 0) {
        return res.status(503).json({ message: "Price feed unavailable for this pair" });
      }

      const rawRate = fromPriceUsd / toPriceUsd;
      const spreadMultiplier = 1 - SWAP_SPREAD_PERCENT / 100;
      const effectiveRate = rawRate * spreadMultiplier;
      const toAmount = amount * effectiveRate;

      let tdsAmount = 0;
      let exchangeFee = 0;
      let netPayout = toAmount;

      if (toCurrency === "INR") {
        const currentUser = await storage.getUser(userId);
        if (!currentUser) return res.status(404).json({ message: "User not found" });
        const pan = extractPanFromKyc(currentUser.kyc_data);
        if (!pan && !currentUser.is_admin) {
          return res.status(403).json({ message: "PAN Card verification required for crypto-to-INR transactions as per Govt norms." });
        }
        tdsAmount = toAmount * TDS_RATE;
        exchangeFee = toAmount * EXCHANGE_FEE_RATE;
        netPayout = toAmount - tdsAmount - exchangeFee;
      }

      const newFromBalance = (parseFloat(fromWallet.balance) - amount).toFixed(8);
      const toWallet = await storage.getWallet(userId, toCurrency);
      const creditAmount = toCurrency === "INR" ? netPayout : toAmount;
      const newToBalance = (parseFloat(toWallet?.balance || "0") + creditAmount).toFixed(toCurrency === "INR" ? 2 : 8);

      await storage.updateWalletBalance(userId, fromCurrency, newFromBalance);
      await storage.updateWalletBalance(userId, toCurrency, newToBalance);

      const swap = await storage.createSwap({
        user_id: userId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: amount.toFixed(8),
        to_amount: toAmount.toFixed(toCurrency === "INR" ? 2 : 8),
        rate: effectiveRate.toFixed(8),
        spread_percent: SWAP_SPREAD_PERCENT.toFixed(2),
        status: "completed",
        tds_amount: tdsAmount > 0 ? tdsAmount.toFixed(2) : null,
        net_payout: tdsAmount > 0 ? netPayout.toFixed(2) : null,
      });

      res.json(swap);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Swap failed" });
    }
  });

  app.get("/api/swap/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getSwapHistory(getEffectiveUserId(req));
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/network-config", (_req, res) => {
    res.json(SUPPORTED_NETWORKS);
  });

  app.get("/api/deposit/address", requireAuth, async (req, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const wallets = await storage.getWallets(userId);
      const addresses: Record<string, string> = {};
      for (const w of wallets) {
        if (w.deposit_address) {
          addresses[w.currency] = w.deposit_address;
        }
      }
      res.json({
        addresses,
        networks: SUPPORTED_NETWORKS,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit/transactions", requireAuth, async (req, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const transactions = await storage.getTransactionsByUser(userId, "deposit");
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/withdraw/transactions", requireAuth, async (req, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const transactions = await storage.getTransactionsByUser(userId, "withdraw");
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/withdraw", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = withdrawRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const { currency, amount, network, withdrawAddress } = parsed.data;
      const userId = getEffectiveUserId(req);
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const chain = SUPPORTED_CHAINS[network];
      if (!chain) {
        return res.status(400).json({ message: "Unsupported network" });
      }

      if (numAmount < chain.minWithdrawal) {
        return res.status(400).json({ message: `Minimum withdrawal on ${chain.name} is ${chain.minWithdrawal} USDT equivalent` });
      }

      const networkFee = chain.withdrawalFee;
      if (numAmount <= networkFee) {
        return res.status(400).json({ message: `Amount must be greater than the network fee of ${networkFee} USDT` });
      }

      const wallet = await storage.getWallet(userId, currency);
      if (!wallet || parseFloat(wallet.balance) < numAmount) {
        return res.status(400).json({ message: "Insufficient balance for withdrawal including network fee" });
      }

      const receiveAmount = numAmount - networkFee;

      const newBalance = (parseFloat(wallet.balance) - numAmount).toFixed(8);
      await storage.updateWalletBalance(userId, currency, newBalance);

      const tx = await storage.createTransaction({
        user_id: userId,
        type: "withdraw",
        currency,
        amount: numAmount.toFixed(8),
        network,
        status: "pending",
        tx_hash: null,
        confirmations: 0,
        required_confirmations: 0,
        from_address: null,
        to_address: null,
        withdraw_address: withdrawAddress,
        admin_note: `Fee: ${networkFee} ${currency} | User receives: ${receiveAmount.toFixed(8)} ${currency}`,
      });

      res.json({ ...tx, networkFee, receiveAmount: receiveAmount.toFixed(8) });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Withdrawal request failed" });
    }
  });

  app.post("/api/deposit/crypto", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const { currency, network, txHash } = req.body;
      if (!currency || !network) {
        return res.status(400).json({ message: "Currency and network are required" });
      }

      const deposit = await storage.createCryptoDeposit({
        user_id: getEffectiveUserId(req),
        currency,
        network,
        tx_hash: txHash || null,
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
      const deposits = await storage.getCryptoDeposits(getEffectiveUserId(req));
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inr/bank-details", requireAuth, (_req, res) => {
    res.json(ADMIN_BANK_DETAILS);
  });

  app.post("/api/inr/deposit", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = inrDepositSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const tx = await storage.createInrTransaction({
        user_id: getEffectiveUserId(req),
        type: "deposit",
        amount: parsed.data.amount,
        utr_number: parsed.data.utrNumber,
        bank_name: null,
        account_number: null,
        ifsc_code: null,
        status: "pending",
        tds_amount: null,
        net_payout: null,
      });

      res.json(tx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inr/withdraw", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = inrWithdrawSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const userId = getEffectiveUserId(req);
      const amount = parseFloat(parsed.data.amount);

      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(404).json({ message: "User not found" });
      const pan = extractPanFromKyc(currentUser.kyc_data);
      if (!pan && !currentUser.is_admin) {
        return res.status(403).json({ message: "PAN Card verification required for INR withdrawals as per Govt norms." });
      }

      const wallet = await storage.getWallet(userId, "INR");
      if (!wallet || parseFloat(wallet.balance) < amount) {
        return res.status(400).json({ message: "Insufficient INR balance" });
      }

      const tdsAmount = amount * TDS_RATE;
      const exchangeFee = amount * EXCHANGE_FEE_RATE;
      const netPayout = amount - tdsAmount - exchangeFee;

      const newBalance = (parseFloat(wallet.balance) - amount).toFixed(2);
      await storage.updateWalletBalance(userId, "INR", newBalance);

      const tx = await storage.createInrTransaction({
        user_id: userId,
        type: "withdraw",
        amount: amount.toFixed(2),
        utr_number: null,
        bank_name: parsed.data.bankName,
        account_number: parsed.data.accountNumber,
        ifsc_code: parsed.data.ifscCode,
        status: "pending",
        tds_amount: tdsAmount.toFixed(2),
        net_payout: netPayout.toFixed(2),
      });

      res.json(tx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inr/history", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getInrTransactions(getEffectiveUserId(req));
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/usdt-rates", async (_req, res) => {
    try {
      const buyRate = await storage.getPlatformSetting("usdt_buy_rate");
      const sellRate = await storage.getPlatformSetting("usdt_sell_rate");
      res.json({
        buyRate: buyRate || "92.00",
        sellRate: sellRate || "90.00",
      });
    } catch (error: any) {
      res.json({ buyRate: "92.00", sellRate: "90.00" });
    }
  });

  app.post("/api/fiat/buy", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = fiatBuySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const userId = getEffectiveUserId(req);
      const inrAmount = parseFloat(parsed.data.amount);
      if (isNaN(inrAmount) || inrAmount <= 0) return res.status(400).json({ message: "Invalid amount" });

      const buyRateStr = await storage.getPlatformSetting("usdt_buy_rate");
      const buyRate = parseFloat(buyRateStr || "92");
      const usdtAmount = inrAmount / buyRate;

      await storage.createFiatTransaction({
        user_id: userId,
        type: "buy",
        amount: inrAmount.toFixed(2),
        usdt_amount: usdtAmount.toFixed(8),
        rate: buyRate.toFixed(2),
        utr_number: parsed.data.utrNumber,
        screenshot: null,
        bank_name: null,
        account_number: null,
        ifsc_code: null,
        status: "pending",
        admin_reply: null,
        tds_amount: null,
        net_payout: null,
      });

      res.json({
        message: "Buy request submitted successfully. Admin will verify your payment and credit USDT.",
        inrAmount: inrAmount.toFixed(2),
        estimatedUsdt: usdtAmount.toFixed(2),
        rate: buyRate.toFixed(2),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fiat/sell", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = fiatSellSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const userId = getEffectiveUserId(req);
      const usdtAmount = parseFloat(parsed.data.amount);
      if (isNaN(usdtAmount) || usdtAmount <= 0) return res.status(400).json({ message: "Invalid amount" });

      const usdtWallet = await storage.getWallet(userId, "USDT");
      if (!usdtWallet || parseFloat(usdtWallet.balance) < usdtAmount) {
        return res.status(400).json({ message: "Insufficient USDT balance" });
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(404).json({ message: "User not found" });
      const pan = extractPanFromKyc(currentUser.kyc_data);
      if (!pan && !currentUser.is_admin) {
        return res.status(403).json({ message: "PAN Card verification required for selling USDT as per Govt norms." });
      }

      const sellRateStr = await storage.getPlatformSetting("usdt_sell_rate");
      const sellRate = parseFloat(sellRateStr || "90");
      const grossInr = usdtAmount * sellRate;
      const tdsAmount = grossInr * TDS_RATE;
      const netInr = grossInr - tdsAmount;

      const newUsdtBalance = (parseFloat(usdtWallet.balance) - usdtAmount).toFixed(8);
      await storage.updateWalletBalance(userId, "USDT", newUsdtBalance);

      await storage.createFiatTransaction({
        user_id: userId,
        type: "sell",
        amount: grossInr.toFixed(2),
        usdt_amount: usdtAmount.toFixed(8),
        rate: sellRate.toFixed(2),
        utr_number: null,
        screenshot: null,
        bank_name: parsed.data.bankName,
        account_number: parsed.data.accountNumber,
        ifsc_code: parsed.data.ifscCode,
        status: "pending",
        admin_reply: null,
        tds_amount: tdsAmount.toFixed(2),
        net_payout: netInr.toFixed(2),
      });

      res.json({
        message: "Sell request submitted. Admin will send INR to your bank account.",
        usdtSold: usdtAmount.toFixed(8),
        grossInr: grossInr.toFixed(2),
        tdsAmount: tdsAmount.toFixed(2),
        netInr: netInr.toFixed(2),
        rate: sellRate.toFixed(2),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/fiat/history", requireAuth, async (req, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const transactions = await storage.getFiatTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/fiat-transactions", requireAdmin, async (req, res) => {
    try {
      const { type, status } = req.query;
      const transactions = await storage.getAllFiatTransactions(
        type as string | undefined,
        status as string | undefined
      );
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/fiat-transactions/:id/approve", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const tx = await storage.getFiatTransaction(id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.status !== "pending") return res.status(400).json({ message: "Transaction is not pending" });

      if (tx.type === "buy") {
        const usdtAmount = parseFloat(tx.usdt_amount);
        const usdtWallet = await storage.getWallet(tx.user_id, "USDT");
        const newBalance = (parseFloat(usdtWallet?.balance || "0") + usdtAmount).toFixed(8);
        await storage.updateWalletBalance(tx.user_id, "USDT", newBalance);
      }

      const adminReply = req.body.adminReply || "Approved";
      await storage.updateFiatTransactionStatus(id, "approved", adminReply);
      res.json({ message: `Transaction approved${tx.type === "buy" ? " and USDT credited" : ""}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/fiat-transactions/:id/reject", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const tx = await storage.getFiatTransaction(id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.status !== "pending") return res.status(400).json({ message: "Transaction is not pending" });

      if (tx.type === "sell") {
        const usdtAmount = parseFloat(tx.usdt_amount);
        const usdtWallet = await storage.getWallet(tx.user_id, "USDT");
        const newBalance = (parseFloat(usdtWallet?.balance || "0") + usdtAmount).toFixed(8);
        await storage.updateWalletBalance(tx.user_id, "USDT", newBalance);
      }

      const adminReply = req.body.adminReply || "Rejected";
      await storage.updateFiatTransactionStatus(id, "rejected", adminReply);
      res.json({ message: `Transaction rejected${tx.type === "sell" ? " and USDT refunded" : ""}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/fiat-transactions/:id/complete", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const tx = await storage.getFiatTransaction(id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.status !== "approved") return res.status(400).json({ message: "Transaction must be approved first before marking complete" });

      const adminReply = req.body.adminReply || "Completed";
      await storage.updateFiatTransactionStatus(id, "completed", adminReply);
      res.json({ message: "Transaction marked as completed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/rates", requireAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json({
        usdt_buy_rate: settings.usdt_buy_rate || "92.00",
        usdt_sell_rate: settings.usdt_sell_rate || "90.00",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/rates", requireAdmin, async (req, res) => {
    try {
      const parsed = adminRateSettingsSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      await storage.setPlatformSetting("usdt_buy_rate", parsed.data.usdt_buy_rate);
      await storage.setPlatformSetting("usdt_sell_rate", parsed.data.usdt_sell_rate);

      res.json({ message: "Rates updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/kyc/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(getEffectiveUserId(req));
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        kycStatus: user.kyc_status,
        rejectionReason: user.rejection_reason,
        kycData: user.kyc_data,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/kyc/submit",
    requireAuth,
    kycUpload.fields([
      { name: "aadhaar_front", maxCount: 1 },
      { name: "aadhaar_back", maxCount: 1 },
      { name: "pan_card", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files.aadhaar_front || !files.aadhaar_back || !files.pan_card || !files.selfie) {
          return res.status(400).json({ message: "All documents required: aadhaar_front, aadhaar_back, pan_card, selfie" });
        }

        const kycData: any = {
          aadhaarFrontPath: files.aadhaar_front[0].path,
          aadhaarBackPath: files.aadhaar_back[0].path,
          panCardPath: files.pan_card[0].path,
          selfiePath: files.selfie[0].path,
          submittedAt: new Date().toISOString(),
          aiAnalysis: {},
        };

        const analysisPromises = [
          analyzeDocumentWithGemini(files.aadhaar_front[0].path, "aadhaar_front"),
          analyzeDocumentWithGemini(files.aadhaar_back[0].path, "aadhaar_back"),
          analyzeDocumentWithGemini(files.pan_card[0].path, "pan_card"),
          analyzeDocumentWithGemini(files.selfie[0].path, "selfie"),
        ];

        const [aadhaarFrontResult, aadhaarBackResult, panResult, selfieResult] = await Promise.all(analysisPromises);

        kycData.aiAnalysis = {
          aadhaarFront: aadhaarFrontResult,
          aadhaarBack: aadhaarBackResult,
          panCard: panResult,
          selfie: selfieResult,
        };

        const allValid = aadhaarFrontResult.isValid && aadhaarBackResult.isValid && panResult.isValid && selfieResult.isValid;
        kycData.aiVerdict = allValid ? "documents_appear_valid" : "review_required";

        const user = await storage.submitKyc(getEffectiveUserId(req), kycData);
        res.json({
          kycStatus: user.kyc_status,
          aiAnalysis: kycData.aiAnalysis,
          aiVerdict: kycData.aiVerdict,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || "KYC submission failed" });
      }
    }
  );

  app.get("/api/kyc/file/:userId/:filename", requireAdmin, (req, res) => {
    const userId = req.params.userId as string;
    const filename = req.params.filename as string;
    if (!/^\d+$/.test(userId) || /[\/\\]/.test(filename)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }
    const safeName = path.basename(filename);
    const filePath = path.join("uploads", "kyc", userId, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.sendFile(path.resolve(filePath));
  });

  app.get("/api/admin/kyc", requireAdmin, async (req, res) => {
    try {
      const submittedUsers = await storage.getSubmittedKycUsers();
      const safeUsers = submittedUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        kycStatus: u.kyc_status,
        kycData: u.kyc_data,
        createdAt: u.created_at,
      }));
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/kyc/:userId", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId as string);
      const { status, rejectionReason } = req.body;

      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'verified' or 'rejected'" });
      }

      if (status === "rejected" && !rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const user = await storage.updateKycStatus(userId, status, rejectionReason);
      res.json({ id: user.id, kycStatus: user.kyc_status, rejectionReason: user.rejection_reason });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const usersWithWallets = await storage.getAllUsersWithWallets();
      const safeUsers = usersWithWallets.map((u) => ({
        id: u.id,
        kuznexId: u.kuznex_id,
        username: u.username,
        email: u.email,
        kycStatus: u.kyc_status,
        isAdmin: u.is_admin,
        createdAt: u.created_at,
        wallets: u.wallets.map(w => ({ currency: w.currency, balance: w.balance })),
      }));
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/impersonate/:userId", requireAdmin, async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.userId as string);
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      (req.session as any).impersonatingUserId = targetUserId;
      res.json({ message: "Now impersonating user", userId: targetUserId, username: targetUser.username });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/stop-impersonation", requireAuth, async (req, res) => {
    delete (req.session as any).impersonatingUserId;
    res.json({ message: "Stopped impersonation" });
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const pending = await storage.getPendingWithdrawals();
      res.json(pending);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:txId/approve", requireAdmin, async (req, res) => {
    try {
      const txId = parseInt(req.params.txId as string);
      const tx = await storage.getTransaction(txId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.type !== "withdraw" || tx.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not a pending withdrawal" });
      }

      const { adminNote, manualTxHash } = req.body;
      let onChainTxHash: string | null = null;

      if (manualTxHash && typeof manualTxHash === "string" && manualTxHash.trim().length > 0) {
        onChainTxHash = manualTxHash.trim();
        console.log(`[Admin] Manual hash provided for withdrawal #${txId}: ${onChainTxHash}`);
      } else {
        const masterKey = process.env.MASTER_PRIVATE_KEY;
        if (masterKey && tx.withdraw_address) {
          try {
            const chain = SUPPORTED_CHAINS[tx.network];
            if (!chain) throw new Error(`Unsupported network: ${tx.network}`);
            const rpcUrl = chain.rpcUrl;
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const signer = new ethers.Wallet(masterKey, provider);
            const networkFee = chain.withdrawalFee;
            const sendAmount = Math.max(0, parseFloat(tx.amount) - networkFee);
            if (sendAmount <= 0) throw new Error("Send amount after fee deduction is zero or negative");
            const txResp = await signer.sendTransaction({
              to: tx.withdraw_address,
              value: ethers.parseEther(sendAmount.toFixed(18)),
            });
            onChainTxHash = txResp.hash;
            console.log(`[Admin] Withdrawal sent on ${tx.network}: ${txResp.hash} (${sendAmount} after ${networkFee} fee)`);
          } catch (err: any) {
            console.error(`[Admin] On-chain send failed on ${tx.network}:`, err.message);
            return res.status(500).json({ message: `Auto-send failed: ${err.message}` });
          }
        } else {
          return res.status(400).json({ message: "MASTER_PRIVATE_KEY not configured and no manual hash provided" });
        }
      }

      const updatedTx = await storage.updateTransactionStatus(txId, "completed", adminNote || "Approved by admin");
      if (onChainTxHash) {
        await (await import("./supabase")).supabase
          .from("transactions")
          .update({ tx_hash: onChainTxHash })
          .eq("id", txId);
      }

      res.json({ ...updatedTx, tx_hash: onChainTxHash || updatedTx.tx_hash });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:txId/reject", requireAdmin, async (req, res) => {
    try {
      const txId = parseInt(req.params.txId as string);
      const tx = await storage.getTransaction(txId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.type !== "withdraw" || tx.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not a pending withdrawal" });
      }

      await storage.adjustUserBalance(tx.user_id, tx.currency, parseFloat(tx.amount));

      const updatedTx = await storage.updateTransactionStatus(txId, "rejected", req.body.adminNote || "Rejected by admin");
      res.json(updatedTx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/balance-adjust", requireAdmin, async (req, res) => {
    try {
      const { userId, currency, amount } = req.body;
      if (!userId || !currency || amount === undefined) {
        return res.status(400).json({ message: "userId, currency, and amount are required" });
      }
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) return res.status(400).json({ message: "Invalid amount" });

      await storage.adjustUserBalance(userId, currency, numAmount);
      const wallet = await storage.getWallet(userId, currency);
      res.json({ userId, currency, newBalance: wallet?.balance, adjusted: numAmount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/sweep", requireAdmin, async (req, res) => {
    try {
      const coldWallet = req.body.coldWalletAddress;
      if (!coldWallet) return res.status(400).json({ message: "Cold wallet address required" });

      const allAddresses = await storage.getAllDepositAddresses();
      const results: Array<{ address: string; chain: string; status: string; txHash?: string; error?: string; amount?: string }> = [];

      const seenAddresses = new Set<string>();
      for (const addrInfo of allAddresses) {
        const addrLower = addrInfo.deposit_address.toLowerCase();
        if (seenAddresses.has(addrLower)) continue;
        seenAddresses.add(addrLower);

        const wallet = await storage.getWallet(addrInfo.user_id, addrInfo.currency);
        if (!wallet || !wallet.private_key_enc) {
          results.push({ address: addrInfo.deposit_address, chain: "all", status: "skipped", error: "No encrypted key" });
          continue;
        }

        let privateKey: string;
        try {
          privateKey = decryptPrivateKey(wallet.private_key_enc);
        } catch {
          results.push({ address: addrInfo.deposit_address, chain: "all", status: "skipped", error: "Decryption failed" });
          continue;
        }

        for (const [chainId, chain] of Object.entries(SUPPORTED_CHAINS)) {
          try {
            const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
            const signer = new ethers.Wallet(privateKey, provider);
            const balance = await provider.getBalance(addrInfo.deposit_address);

            if (balance === BigInt(0)) {
              results.push({ address: addrInfo.deposit_address, chain: chainId, status: "empty" });
              continue;
            }

            const gasPrice = (await provider.getFeeData()).gasPrice || BigInt(5000000000);
            const gasLimit = BigInt(21000);
            const gasCost = gasPrice * gasLimit;
            const sendAmount = balance - gasCost;

            if (sendAmount <= BigInt(0)) {
              results.push({ address: addrInfo.deposit_address, chain: chainId, status: "insufficient_for_gas" });
              continue;
            }

            const txResp = await signer.sendTransaction({
              to: coldWallet,
              value: sendAmount,
              gasLimit,
              gasPrice,
            });

            results.push({
              address: addrInfo.deposit_address,
              chain: chainId,
              status: "sent",
              txHash: txResp.hash,
              amount: ethers.formatEther(sendAmount),
            });
          } catch (err: any) {
            results.push({ address: addrInfo.deposit_address, chain: chainId, status: "error", error: err.message });
          }
        }
      }

      res.json({ swept: results.filter(r => r.status === "sent").length, total: results.length, results });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  let cachedPairs: any[] = [];
  let pairsCacheTime = 0;
  const PAIRS_CACHE_TTL = 15000;

  app.get("/api/spot/pairs", async (_req, res) => {
    try {
      const now = Date.now();
      if (cachedPairs.length > 0 && now - pairsCacheTime < PAIRS_CACHE_TTL) {
        return res.json(cachedPairs);
      }

      const response = await axios.get(
        `https://data-api.binance.vision/api/v3/ticker/24hr`,
        { timeout: 15000 }
      );
      const allTickers = response.data as any[];
      const stablecoinBases = new Set(["USDC", "BUSD", "TUSD", "USDP", "DAI", "FDUSD", "USDD", "AEUR", "EUR", "GBP", "BRL", "TRY", "ARS", "PLN", "RON", "UAH", "BIDR", "IDRT", "VAI", "BVND"]);
      const filtered = allTickers
        .filter((t: any) => {
          if (!t.symbol.endsWith("USDT")) return false;
          const base = t.symbol.replace("USDT", "");
          if (stablecoinBases.has(base)) return false;
          if (parseFloat(t.quoteVolume) < 10000) return false;
          return true;
        })
        .map((t: any) => {
          const tradablePair = TRADABLE_PAIRS.find(p => p.symbol === t.symbol);
          return {
            symbol: t.symbol,
            displayName: t.symbol.replace("USDT", "/USDT"),
            price: t.lastPrice,
            priceChangePercent: t.priceChangePercent,
            highPrice: t.highPrice,
            lowPrice: t.lowPrice,
            volume: t.volume,
            quoteVolume: t.quoteVolume,
            tradable: !!tradablePair,
            base: tradablePair?.base || t.symbol.replace("USDT", ""),
            quote: "USDT",
          };
        })
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));

      cachedPairs = filtered;
      pairsCacheTime = now;
      res.json(filtered);
    } catch (error: any) {
      if (cachedPairs.length > 0) {
        return res.json(cachedPairs);
      }
      res.status(503).json({ message: "Market data unavailable" });
    }
  });

  app.post("/api/spot/order", requireKycVerifiedOrAdmin, async (req, res) => {
    try {
      const parsed = spotOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const { pair, side, amount: amountStr } = parsed.data;
      const userId = getEffectiveUserId(req);
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const tradablePair = TRADABLE_PAIRS.find(p => p.symbol === pair);
      if (!tradablePair) {
        return res.status(400).json({ message: "This pair is not available for trading. Only BTC/USDT, ETH/USDT, and BNB/USDT are supported." });
      }

      const { base, quote } = tradablePair;

      const tickerResp = await axios.get(
        `https://data-api.binance.vision/api/v3/ticker/price?symbol=${pair}`,
        { timeout: 10000 }
      );
      const marketPrice = parseFloat(tickerResp.data.price);
      if (!marketPrice || marketPrice <= 0) {
        return res.status(503).json({ message: "Unable to fetch market price" });
      }

      const fee = amount * SPOT_TRADING_FEE;

      if (side === "BUY") {
        const totalUsdt = amount * marketPrice + fee * marketPrice;
        const usdtWallet = await storage.getWallet(userId, quote);
        if (!usdtWallet || parseFloat(usdtWallet.balance) < totalUsdt) {
          return res.status(400).json({ message: `Insufficient ${quote} balance. Need ${totalUsdt.toFixed(2)} ${quote}` });
        }

        const originalUsdtBalance = usdtWallet.balance;
        const newUsdtBalance = (parseFloat(usdtWallet.balance) - totalUsdt).toFixed(8);
        await storage.updateWalletBalance(userId, quote, newUsdtBalance);

        try {
          const baseWallet = await storage.getWallet(userId, base);
          const originalBaseBalance = baseWallet?.balance || "0";
          const newBaseBalance = (parseFloat(originalBaseBalance) + amount).toFixed(8);
          await storage.updateWalletBalance(userId, base, newBaseBalance);

          try {
            const order = await storage.createSpotOrder({
              user_id: userId,
              pair,
              side: "BUY",
              amount: amount.toFixed(8),
              price: marketPrice.toFixed(8),
              fee: (fee * marketPrice).toFixed(8),
              total_usdt: totalUsdt.toFixed(8),
              status: "completed",
            });
            res.json(order);
          } catch (orderErr) {
            await storage.updateWalletBalance(userId, base, originalBaseBalance);
            await storage.updateWalletBalance(userId, quote, originalUsdtBalance);
            throw orderErr;
          }
        } catch (creditErr: any) {
          if (!creditErr.message?.includes("Failed to create spot order")) {
            await storage.updateWalletBalance(userId, quote, originalUsdtBalance);
          }
          throw creditErr;
        }
      } else {
        const baseWallet = await storage.getWallet(userId, base);
        if (!baseWallet || parseFloat(baseWallet.balance) < amount) {
          return res.status(400).json({ message: `Insufficient ${base} balance` });
        }

        const grossUsdt = amount * marketPrice;
        const feeUsdt = grossUsdt * SPOT_TRADING_FEE;
        const netUsdt = grossUsdt - feeUsdt;

        const originalBaseBalance = baseWallet.balance;
        const newBaseBalance = (parseFloat(baseWallet.balance) - amount).toFixed(8);
        await storage.updateWalletBalance(userId, base, newBaseBalance);

        try {
          const usdtWallet = await storage.getWallet(userId, quote);
          const originalUsdtBalance = usdtWallet?.balance || "0";
          const newUsdtBalance = (parseFloat(originalUsdtBalance) + netUsdt).toFixed(8);
          await storage.updateWalletBalance(userId, quote, newUsdtBalance);

          try {
            const order = await storage.createSpotOrder({
              user_id: userId,
              pair,
              side: "SELL",
              amount: amount.toFixed(8),
              price: marketPrice.toFixed(8),
              fee: feeUsdt.toFixed(8),
              total_usdt: grossUsdt.toFixed(8),
              status: "completed",
            });
            res.json(order);
          } catch (orderErr) {
            await storage.updateWalletBalance(userId, quote, originalUsdtBalance);
            await storage.updateWalletBalance(userId, base, originalBaseBalance);
            throw orderErr;
          }
        } catch (creditErr: any) {
          if (!creditErr.message?.includes("Failed to create spot order")) {
            await storage.updateWalletBalance(userId, base, originalBaseBalance);
          }
          throw creditErr;
        }
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Trade execution failed" });
    }
  });

  app.get("/api/spot/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getSpotOrdersByUser(getEffectiveUserId(req));
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const wallets = await storage.getWallets(userId);

      let priceMap: Record<string, number> = { USDT: 1, INR: 0 };
      try {
        const prices = await fetchPrices();
        for (const [symbol, data] of Object.entries(prices)) {
          priceMap[symbol] = data.usd;
        }
      } catch {
        priceMap = { USDT: 1, INR: 0, BTC: 0, ETH: 0, BNB: 0 };
      }

      const totalBalanceUsdt = wallets.reduce((sum, w) => {
        const bal = parseFloat(w.balance);
        if (bal === 0 || w.currency === "INR") return sum;
        const usdPrice = priceMap[w.currency] || 0;
        return sum + bal * usdPrice;
      }, 0);

      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const snapshot = await storage.getDailySnapshot(userId, yesterdayStr);
      const yesterdayBalance = snapshot ? parseFloat(snapshot.total_balance_usdt) : 0;

      let change24hAmount = totalBalanceUsdt - yesterdayBalance;
      let change24hPercent = 0;
      if (yesterdayBalance > 0) {
        change24hPercent = (change24hAmount / yesterdayBalance) * 100;
      } else if (totalBalanceUsdt > 0) {
        change24hPercent = 100;
      }

      const totalDeposited = await storage.getUserTotalDeposited(userId);
      const totalWithdrawn = await storage.getUserTotalWithdrawn(userId);

      res.json({
        totalDeposited,
        totalWithdrawn,
        change24hAmount: parseFloat(change24hAmount.toFixed(2)),
        change24hPercent: parseFloat(change24hPercent.toFixed(2)),
        totalBalanceUsdt: parseFloat(totalBalanceUsdt.toFixed(2)),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/user-stats", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.is_admin || req.user?.email !== SUPER_ADMIN_EMAIL) return res.status(404).json({ message: "Not found" });

      const usersWithWallets = await storage.getAllUsersWithWallets();

      let priceMap: Record<string, number> = { USDT: 1, INR: 0 };
      try {
        const prices = await fetchPrices();
        for (const [symbol, data] of Object.entries(prices)) {
          priceMap[symbol] = data.usd;
        }
      } catch {}

      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const stats = await Promise.all(
        usersWithWallets.map(async (u) => {
          const totalBalanceUsdt = u.wallets.reduce((sum, w) => {
            const bal = parseFloat(w.balance);
            if (bal === 0 || w.currency === "INR") return sum;
            return sum + bal * (priceMap[w.currency] || 0);
          }, 0);

          const snapshot = await storage.getDailySnapshot(u.id, yesterdayStr);
          const yesterdayBalance = snapshot ? parseFloat(snapshot.total_balance_usdt) : 0;
          let change24hPercent = 0;
          if (yesterdayBalance > 0) {
            change24hPercent = ((totalBalanceUsdt - yesterdayBalance) / yesterdayBalance) * 100;
          } else if (totalBalanceUsdt > 0) {
            change24hPercent = 100;
          }

          const totalDeposited = await storage.getUserTotalDeposited(u.id);
          const totalWithdrawn = await storage.getUserTotalWithdrawn(u.id);

          return {
            userId: u.id,
            netDeposit: parseFloat((totalDeposited - totalWithdrawn).toFixed(2)),
            change24hPercent: parseFloat(change24hPercent.toFixed(2)),
            totalDeposited: parseFloat(totalDeposited.toFixed(2)),
            totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
          };
        })
      );

      const statsMap: Record<number, typeof stats[0]> = {};
      for (const s of stats) statsMap[s.userId] = s;
      res.json(statsMap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/tds-report", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.is_admin || req.user?.email !== SUPER_ADMIN_EMAIL) return res.status(404).json({ message: "Not found" });

      const startDate = (req.query.start as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const endDate = (req.query.end as string) || new Date().toISOString().split("T")[0];

      const [swapRecords, inrRecords] = await Promise.all([
        storage.getTdsSwapRecords(startDate, endDate),
        storage.getTdsInrWithdrawRecords(startDate, endDate),
      ]);

      const allUsers = await storage.getAllUsersWithWallets();
      const userMap: Record<number, { username: string; email: string; pan: string | null }> = {};
      for (const u of allUsers) {
        userMap[u.id] = {
          username: u.username,
          email: u.email,
          pan: extractPanFromKyc(u.kyc_data),
        };
      }

      const records = [
        ...swapRecords.map((r: any) => ({
          id: r.id,
          date: r.created_at,
          userId: r.user_id,
          username: userMap[r.user_id]?.username || "Unknown",
          email: userMap[r.user_id]?.email || "",
          pan: userMap[r.user_id]?.pan || "N/A",
          type: "Crypto Sell (Swap)",
          grossAmount: r.to_amount,
          tdsAmount: r.tds_amount,
          netPayout: r.net_payout,
          fromCurrency: r.from_currency,
          fromAmount: r.from_amount,
        })),
        ...inrRecords.map((r: any) => ({
          id: r.id,
          date: r.created_at,
          userId: r.user_id,
          username: userMap[r.user_id]?.username || "Unknown",
          email: userMap[r.user_id]?.email || "",
          pan: userMap[r.user_id]?.pan || "N/A",
          type: "INR Withdrawal",
          grossAmount: r.amount,
          tdsAmount: r.tds_amount,
          netPayout: r.net_payout,
          fromCurrency: "INR",
          fromAmount: r.amount,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalTds = records.reduce((sum, r) => sum + parseFloat(r.tdsAmount || "0"), 0);
      const totalGross = records.reduce((sum, r) => sum + parseFloat(r.grossAmount || "0"), 0);

      res.json({
        records,
        summary: {
          totalRecords: records.length,
          totalGross: totalGross.toFixed(2),
          totalTds: totalTds.toFixed(2),
          period: { start: startDate, end: endDate },
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/platform/payment-methods", (_req, res) => {
    res.json(platformSettings.paymentMethods);
  });

  app.get("/api/admin/platform-settings", requireAdmin, (_req, res) => {
    res.json(platformSettings);
  });

  app.post("/api/admin/platform-settings/payment-methods", requireAdmin, (req, res) => {
    const { upi, imps, bankTransfer } = req.body;
    if (typeof upi === "boolean") platformSettings.paymentMethods.upi = upi;
    if (typeof imps === "boolean") platformSettings.paymentMethods.imps = imps;
    if (typeof bankTransfer === "boolean") platformSettings.paymentMethods.bankTransfer = bankTransfer;
    res.json({ message: "Payment method settings updated", paymentMethods: platformSettings.paymentMethods });
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = contactMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const userId = req.isAuthenticated() ? req.user!.id : null;
      const msg = await storage.createContactMessage({
        user_id: userId,
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        status: "new",
      });
      res.json({ message: "Message sent successfully", id: msg.id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/messages", requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { status } = req.body;
      if (!["new", "replied", "archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const msg = await storage.updateContactMessageStatus(id, status);
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/fund-overview", requireAdmin, async (_req, res) => {
    try {
      const systemBalances = await storage.getSystemwideTotalBalances();
      const allWallets = await storage.getAllWalletsWithKeys();

      const uniqueAddresses = new Set<string>();
      for (const w of allWallets) {
        if (w.deposit_address) uniqueAddresses.add(w.deposit_address.toLowerCase());
      }

      const onChainBalances: Record<string, Record<string, string>> = {};
      const sampleAddresses = Array.from(uniqueAddresses).slice(0, 5);

      for (const addr of sampleAddresses) {
        onChainBalances[addr] = {};
        for (const [chainId, chain] of Object.entries(SUPPORTED_CHAINS).slice(0, 2)) {
          try {
            const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
            const balance = await provider.getBalance(addr);
            if (balance > BigInt(0)) {
              onChainBalances[addr][chainId] = ethers.formatEther(balance);
            }
          } catch {}
        }
      }

      res.json({
        systemBalances,
        totalWallets: uniqueAddresses.size,
        coldWallet: process.env.ADMIN_COLD_WALLET || "Not configured",
        sampleOnChainBalances: onChainBalances,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/fiat-settings", requireAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json({
        upi_id: settings.upi_id || "",
        bank_account_number: settings.bank_account_number || "",
        bank_ifsc: settings.bank_ifsc || "",
        bank_account_name: settings.bank_account_name || "",
        bank_name: settings.bank_name || "",
        is_upi_enabled: settings.is_upi_enabled === "true",
        is_bank_enabled: settings.is_bank_enabled === "true",
        is_imps_enabled: settings.is_imps_enabled === "true",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/fiat-settings", requireAdmin, async (req, res) => {
    try {
      const { upi_id, bank_account_number, bank_ifsc, bank_account_name, bank_name, is_upi_enabled, is_bank_enabled, is_imps_enabled } = req.body;

      if (upi_id !== undefined) await storage.setPlatformSetting("upi_id", upi_id);
      if (bank_account_number !== undefined) await storage.setPlatformSetting("bank_account_number", bank_account_number);
      if (bank_ifsc !== undefined) await storage.setPlatformSetting("bank_ifsc", bank_ifsc);
      if (bank_account_name !== undefined) await storage.setPlatformSetting("bank_account_name", bank_account_name);
      if (bank_name !== undefined) await storage.setPlatformSetting("bank_name", bank_name);
      if (is_upi_enabled !== undefined) await storage.setPlatformSetting("is_upi_enabled", String(is_upi_enabled));
      if (is_bank_enabled !== undefined) await storage.setPlatformSetting("is_bank_enabled", String(is_bank_enabled));
      if (is_imps_enabled !== undefined) await storage.setPlatformSetting("is_imps_enabled", String(is_imps_enabled));

      res.json({ message: "Fiat settings updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/fiat/payment-info", requireAuth, async (_req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json({
        upiId: settings.is_upi_enabled === "true" ? (settings.upi_id || null) : null,
        bankDetails: settings.is_bank_enabled === "true" ? {
          accountNumber: settings.bank_account_number || null,
          ifsc: settings.bank_ifsc || null,
          accountName: settings.bank_account_name || null,
          bankName: settings.bank_name || null,
        } : null,
        isImpsEnabled: settings.is_imps_enabled === "true",
        isUpiEnabled: settings.is_upi_enabled === "true",
        isBankEnabled: settings.is_bank_enabled === "true",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/reset-password", requireAdmin, async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) return res.status(400).json({ message: "userId and newPassword are required" });
      if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const hashedPassword = await (await import("bcrypt")).hash(newPassword, 10);
      await storage.updateUserPassword(userId, hashedPassword);

      res.json({ message: `Password reset for ${user.username} (${user.email})` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      res.json({ message: "If an account exists with this email, a password reset has been initiated. Please contact support at support@Kuznex.in for further assistance." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/crypto-withdrawals/:txId/send", requireAdmin, async (req, res) => {
    try {
      const txId = parseInt(req.params.txId as string);
      const tx = await storage.getTransaction(txId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.type !== "withdraw" || tx.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not a pending withdrawal" });
      }

      if (!tx.withdraw_address) return res.status(400).json({ message: "No withdrawal address" });

      const network = tx.network;
      const chain = SUPPORTED_CHAINS[network];
      if (!chain) return res.status(400).json({ message: "Unsupported network" });

      const masterKey = process.env.MASTER_PRIVATE_KEY;
      if (!masterKey) return res.status(500).json({ message: "MASTER_PRIVATE_KEY not configured" });

      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const signer = new ethers.Wallet(masterKey, provider);

      const sendAmount = ethers.parseEther(tx.amount);
      const gasPrice = (await provider.getFeeData()).gasPrice || BigInt(5000000000);
      const gasLimit = BigInt(21000);

      const txResp = await signer.sendTransaction({
        to: tx.withdraw_address,
        value: sendAmount,
        gasLimit,
        gasPrice,
      });

      await storage.updateTransactionStatus(txId, "completed", `On-chain tx: ${txResp.hash}`);
      const { supabase: sb } = await import("./supabase");
      await sb.from("transactions").update({ tx_hash: txResp.hash }).eq("id", txId);

      res.json({ txHash: txResp.hash, status: "completed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
