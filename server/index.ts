import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startDepositWatcher } from "./watcher";

function validateRequiredSecrets(): void {
  const required: Array<{ key: string; label: string }> = [
    { key: "ENCRYPTION_KEY", label: "ENCRYPTION_KEY (AES-256 key for encrypting user wallet private keys)" },
    { key: "ETHERSCAN_API_KEY", label: "ETHERSCAN_API_KEY (Etherscan V2 Multichain API key)" },
    { key: "SESSION_SECRET", label: "SESSION_SECRET (Express session secret)" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];

  for (const { key, label } of required) {
    if (!process.env[key]) {
      missing.push(label);
    }
  }

  if (!supabaseUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL (Supabase project URL)");
  }
  if (!supabaseKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase anon key)");
  }

  if (missing.length > 0) {
    console.error("=".repeat(70));
    console.error("CRITICAL ERROR: Missing required environment secrets!");
    console.error("=".repeat(70));
    for (const m of missing) {
      console.error(`  - ${m}`);
    }
    console.error("=".repeat(70));
    console.error("The server cannot start without these secrets.");
    console.error("Please configure them in your environment and restart.");
    console.error("=".repeat(70));
    process.exit(1);
  }

  if (!process.env.MASTER_PRIVATE_KEY) {
    console.warn("[Security] WARNING: MASTER_PRIVATE_KEY not set. On-chain withdrawal sends will be disabled.");
  }
  if (!process.env.ADMIN_COLD_WALLET) {
    console.warn("[Security] WARNING: ADMIN_COLD_WALLET not set. Sweep will require manual cold wallet address input.");
  }
}

validateRequiredSecrets();

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
    () => {
      log(`serving on port ${port}`);
      startDepositWatcher(60000);
    },
  );
})();
