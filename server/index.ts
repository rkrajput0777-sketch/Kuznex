import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startDepositWatcher } from "./watcher";
import { startSnapshotCron } from "./snapshot-cron";
import { storage } from "./storage";
import { SUPER_ADMIN_EMAIL } from "@shared/constants";
import { runAutoMigration } from "./migrate";

function validateRequiredSecrets(): void {
  const required: string[] = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_DB_PASSWORD",
    "ENCRYPTION_KEY",
    "MASTER_PRIVATE_KEY",
    "ADMIN_COLD_WALLET",
    "ETHERSCAN_API_KEY",
    "SESSION_SECRET",
    "GEMINI_API_KEY",
  ];

  let hasMissing = false;
  const statusLines: string[] = [];

  for (const key of required) {
    if (process.env[key]) {
      statusLines.push(`[OK] ${key}`);
    } else {
      statusLines.push(`[MISSING] ${key}`);
      hasMissing = true;
    }
  }

  if (hasMissing) {
    console.error("");
    console.error("KUZNEX STARTUP FAILED. MISSING SECRETS:");
    console.error("---------------------------------------------------");
    for (const line of statusLines) {
      console.error(line);
    }
    console.error("---------------------------------------------------");
    console.error("ACTION: Go to 'Tools > Secrets' and add the missing keys to start.");
    console.error("");
    process.exit(1);
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("KUZNEX PRODUCTION MODE - All 9 secrets verified.");
  console.log("---------------------------------------------------");
  for (const line of statusLines) {
    console.log(line);
  }
  console.log("---------------------------------------------------");
  console.log("System Secured. Starting Kuznex...");
  console.log("=".repeat(70));
  console.log("");
}

validateRequiredSecrets();

async function seedTestData() {
  try {
    const adminUser = await storage.getUserByEmail(SUPER_ADMIN_EMAIL);
    if (!adminUser) {
      console.log(`[Seed] Admin user ${SUPER_ADMIN_EMAIL} not found. Skipping test data injection.`);
      return;
    }

    if (!adminUser.is_admin) {
      await storage.setUserAdmin(adminUser.id, true);
      console.log(`[Seed] Admin flag set for ${SUPER_ADMIN_EMAIL}`);
    } else {
      console.log(`[Seed] Admin flag already set for ${SUPER_ADMIN_EMAIL}`);
    }

    const usdtWallet = await storage.getWallet(adminUser.id, "USDT");
    if (usdtWallet) {
      await storage.updateWalletBalance(adminUser.id, "USDT", "75.00000000");
      console.log(`[Seed] Admin USDT balance set to 75.00 USDT for testing.`);
    } else {
      console.log(`[Seed] Admin USDT wallet not found. Skipping.`);
    }
  } catch (err: any) {
    console.error(`[Seed] Test data injection failed:`, err.message);
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);
      await runAutoMigration();
      startDepositWatcher(60000);
      startSnapshotCron();
      seedTestData();
    },
  );
})();
