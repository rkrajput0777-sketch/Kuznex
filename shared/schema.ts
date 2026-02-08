import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  kycStatus: text("kyc_status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  kycData: json("kyc_data"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userWallets = pgTable("user_wallets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  currency: text("currency").notNull(),
  balance: numeric("balance", { precision: 18, scale: 8 }).notNull().default("0"),
});

export const swapHistory = pgTable("swap_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  fromAmount: numeric("from_amount", { precision: 18, scale: 8 }).notNull(),
  toAmount: numeric("to_amount", { precision: 18, scale: 8 }).notNull(),
  rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
  spreadPercent: numeric("spread_percent", { precision: 5, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cryptoDeposits = pgTable("crypto_deposits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 18, scale: 8 }),
  network: text("network").notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inrTransactions = pgTable("inr_transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  utrNumber: text("utr_number"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});
export const insertWalletSchema = createInsertSchema(userWallets).pick({
  userId: true,
  currency: true,
  balance: true,
});
export const insertSwapSchema = createInsertSchema(swapHistory).pick({
  userId: true,
  fromCurrency: true,
  toCurrency: true,
  fromAmount: true,
  toAmount: true,
  rate: true,
  spreadPercent: true,
  status: true,
});
export const insertCryptoDepositSchema = createInsertSchema(cryptoDeposits).pick({
  userId: true,
  currency: true,
  amount: true,
  network: true,
  txHash: true,
  status: true,
});
export const insertInrTransactionSchema = createInsertSchema(inrTransactions).pick({
  userId: true,
  type: true,
  amount: true,
  utrNumber: true,
  bankName: true,
  accountNumber: true,
  ifscCode: true,
  status: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const swapRequestSchema = z.object({
  fromCurrency: z.string(),
  toCurrency: z.string(),
  fromAmount: z.string(),
});

export const inrDepositSchema = z.object({
  amount: z.string(),
  utrNumber: z.string().min(1, "UTR number is required"),
});

export const inrWithdrawSchema = z.object({
  amount: z.string(),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifscCode: z.string().min(1, "IFSC code is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserWallet = typeof userWallets.$inferSelect;
export type SwapHistory = typeof swapHistory.$inferSelect;
export type CryptoDeposit = typeof cryptoDeposits.$inferSelect;
export type InrTransaction = typeof inrTransactions.$inferSelect;
