import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { registerSchema, swapRequestSchema, inrDepositSchema, inrWithdrawSchema } from "@shared/schema";
import { COINGECKO_IDS, SWAP_SPREAD_PERCENT, ADMIN_WALLETS, ADMIN_BANK_DETAILS, SUPPORTED_NETWORKS } from "@shared/constants";
import axios from "axios";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const kycUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = (req as any).user?.id;
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

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function requireKycVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user?.kycStatus !== "verified") {
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
    res.json({ id: user.id, username: user.username, email: user.email, kycStatus: user.kycStatus, isAdmin: user.isAdmin });
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

  app.post("/api/swap", requireKycVerified, async (req, res) => {
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

  app.post("/api/deposit/crypto", requireKycVerified, async (req, res) => {
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

  app.post("/api/inr/deposit", requireKycVerified, async (req, res) => {
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

  app.post("/api/inr/withdraw", requireKycVerified, async (req, res) => {
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

  app.get("/api/kyc/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        kycStatus: user.kycStatus,
        rejectionReason: user.rejectionReason,
        kycData: user.kycData,
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

        const user = await storage.submitKyc(req.user!.id, kycData);
        res.json({
          kycStatus: user.kycStatus,
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
        kycStatus: u.kycStatus,
        kycData: u.kycData,
        createdAt: u.createdAt,
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
      res.json({ id: user.id, kycStatus: user.kycStatus, rejectionReason: user.rejectionReason });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
