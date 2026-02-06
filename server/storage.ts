import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  userWallets,
  swapHistory,
  cryptoDeposits,
  inrTransactions,
  type User,
  type InsertUser,
  type UserWallet,
  type SwapHistory,
  type CryptoDeposit,
  type InrTransaction,
} from "@shared/schema";
import { SUPPORTED_CURRENCIES } from "@shared/constants";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getWallets(userId: number): Promise<UserWallet[]>;
  getWallet(userId: number, currency: string): Promise<UserWallet | undefined>;
  updateWalletBalance(userId: number, currency: string, newBalance: string): Promise<void>;
  createSwap(data: Omit<SwapHistory, "id" | "createdAt">): Promise<SwapHistory>;
  getSwapHistory(userId: number): Promise<SwapHistory[]>;
  createCryptoDeposit(data: Omit<CryptoDeposit, "id" | "createdAt">): Promise<CryptoDeposit>;
  getCryptoDeposits(userId: number): Promise<CryptoDeposit[]>;
  createInrTransaction(data: Omit<InrTransaction, "id" | "createdAt">): Promise<InrTransaction>;
  getInrTransactions(userId: number): Promise<InrTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();

    for (const currency of SUPPORTED_CURRENCIES) {
      await db.insert(userWallets).values({
        userId: user.id,
        currency,
        balance: "0",
      });
    }

    return user;
  }

  async getWallets(userId: number): Promise<UserWallet[]> {
    return db.select().from(userWallets).where(eq(userWallets.userId, userId));
  }

  async getWallet(userId: number, currency: string): Promise<UserWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.currency, currency)));
    return wallet;
  }

  async updateWalletBalance(userId: number, currency: string, newBalance: string): Promise<void> {
    await db
      .update(userWallets)
      .set({ balance: newBalance })
      .where(and(eq(userWallets.userId, userId), eq(userWallets.currency, currency)));
  }

  async createSwap(data: Omit<SwapHistory, "id" | "createdAt">): Promise<SwapHistory> {
    const [swap] = await db.insert(swapHistory).values(data).returning();
    return swap;
  }

  async getSwapHistory(userId: number): Promise<SwapHistory[]> {
    return db.select().from(swapHistory).where(eq(swapHistory.userId, userId));
  }

  async createCryptoDeposit(data: Omit<CryptoDeposit, "id" | "createdAt">): Promise<CryptoDeposit> {
    const [deposit] = await db.insert(cryptoDeposits).values(data).returning();
    return deposit;
  }

  async getCryptoDeposits(userId: number): Promise<CryptoDeposit[]> {
    return db.select().from(cryptoDeposits).where(eq(cryptoDeposits.userId, userId));
  }

  async createInrTransaction(data: Omit<InrTransaction, "id" | "createdAt">): Promise<InrTransaction> {
    const [tx] = await db.insert(inrTransactions).values(data).returning();
    return tx;
  }

  async getInrTransactions(userId: number): Promise<InrTransaction[]> {
    return db.select().from(inrTransactions).where(eq(inrTransactions.userId, userId));
  }
}

export const storage = new DatabaseStorage();
