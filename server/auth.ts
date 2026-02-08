import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import type { Express } from "express";

const MemoryStore = createMemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    interface User {
      id: number;
      kuznex_id: string | null;
      username: string;
      email: string;
      password: string;
      kyc_status: string;
      rejection_reason: string | null;
      kyc_data: unknown;
      is_admin: boolean;
      created_at: string;
    }
  }
}

export function setupAuth(app: Express) {
  app.use(
    session({
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
      secret: process.env.SESSION_SECRET || "kuznex-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Invalid email or password" });
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return done(null, false, { message: "Invalid email or password" });
          return done(null, user as Express.User);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, (user as Express.User) || undefined);
    } catch (err) {
      done(err);
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Authentication required" });
}
