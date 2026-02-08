import { z } from "zod";

export interface User {
  id: number;
  kuznex_id: string | null;
  username: string;
  email: string;
  password: string;
  kyc_status: string;
  rejection_reason: string | null;
  kyc_data: any;
  is_admin: boolean;
  created_at: string;
}

export interface UserWallet {
  id: number;
  user_id: number;
  currency: string;
  balance: string;
  deposit_address: string | null;
  private_key_enc: string | null;
}

export interface SwapHistory {
  id: number;
  user_id: number;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  rate: string;
  spread_percent: string;
  status: string;
  tds_amount: string | null;
  net_payout: string | null;
  created_at: string;
}

export interface CryptoDeposit {
  id: number;
  user_id: number;
  currency: string;
  amount: string | null;
  network: string;
  tx_hash: string | null;
  status: string;
  created_at: string;
}

export interface InrTransaction {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  utr_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  status: string;
  tds_amount: string | null;
  net_payout: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: string;
  currency: string;
  amount: string;
  network: string;
  status: string;
  tx_hash: string | null;
  confirmations: number;
  required_confirmations: number;
  from_address: string | null;
  to_address: string | null;
  withdraw_address: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertUser = {
  username: string;
  email: string;
  password: string;
};

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

export const withdrawRequestSchema = z.object({
  currency: z.string().min(1),
  amount: z.string().min(1),
  network: z.string().min(1),
  withdrawAddress: z.string().min(1, "Withdrawal address is required"),
});

export interface SpotOrder {
  id: number;
  user_id: number;
  pair: string;
  side: string;
  amount: string;
  price: string;
  fee: string;
  total_usdt: string;
  status: string;
  created_at: string;
}

export type InsertSpotOrder = Omit<SpotOrder, "id" | "created_at">;

export interface DailySnapshot {
  id: number;
  user_id: number;
  date: string;
  total_balance_usdt: string;
  created_at: string;
}

export interface UserStats {
  totalDeposited: number;
  totalWithdrawn: number;
  change24hAmount: number;
  change24hPercent: number;
  totalBalanceUsdt: number;
}

export const spotOrderSchema = z.object({
  pair: z.string().min(1, "Trading pair is required"),
  side: z.enum(["BUY", "SELL"]),
  amount: z.string().min(1, "Amount is required"),
});

export interface ContactMessage {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export const contactMessageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export interface PlatformSettings {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export const usdtBuySellSchema = z.object({
  type: z.enum(["buy", "sell"]),
  amount: z.string().min(1, "Amount is required"),
});

export const adminRateSettingsSchema = z.object({
  usdt_buy_rate: z.string().min(1, "Buy rate is required"),
  usdt_sell_rate: z.string().min(1, "Sell rate is required"),
});
