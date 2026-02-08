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
  submitKyc(userId: number, kycData: any): Promise<User>;
  updateKycStatus(userId: number, status: string, rejectionReason?: string): Promise<User>;
  getSubmittedKycUsers(): Promise<User[]>;
  setUserAdmin(userId: number, isAdmin: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithWallets(): Promise<(User & { wallets: UserWallet[] })[]>;
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

  private generateKuznexId(): string {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    return `KUZ-${digits}`;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    let kuznexId = this.generateKuznexId();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select().from(users).where(eq(users.kuznexId, kuznexId));
      if (existing.length === 0) break;
      kuznexId = this.generateKuznexId();
      attempts++;
    }
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword, kuznexId })
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

  async submitKyc(userId: number, kycData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ kycStatus: "submitted", kycData })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateKycStatus(userId: number, status: string, rejectionReason?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ kycStatus: status, rejectionReason: rejectionReason || null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getSubmittedKycUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.kycStatus, "submitted"));
  }

  async setUserAdmin(userId: number, isAdmin: boolean): Promise<void> {
    await db.update(users).set({ isAdmin }).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getAllUsersWithWallets(): Promise<(User & { wallets: UserWallet[] })[]> {
    const allUsers = await db.select().from(users);
    const allWallets = await db.select().from(userWallets);
    return allUsers.map(u => ({
      ...u,
      wallets: allWallets.filter(w => w.userId === u.id),
    }));
  }
}

export const storage = new DatabaseStorage();
