import { supabase } from "./supabase";
import type {
  User,
  InsertUser,
  UserWallet,
  SwapHistory,
  CryptoDeposit,
  InrTransaction,
  Transaction,
  SpotOrder,
  InsertSpotOrder,
  DailySnapshot,
  ContactMessage,
  FiatTransaction,
  Notification,
  NotificationWithStatus,
} from "@shared/schema";
import { SUPPORTED_CURRENCIES } from "@shared/constants";
import bcrypt from "bcrypt";
import { generateDepositWalletForUser, getRequiredConfirmations } from "./crypto";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getWallets(userId: number): Promise<UserWallet[]>;
  getWallet(userId: number, currency: string): Promise<UserWallet | undefined>;
  updateWalletBalance(userId: number, currency: string, newBalance: string): Promise<void>;
  createSwap(data: Omit<SwapHistory, "id" | "created_at">): Promise<SwapHistory>;
  getSwapHistory(userId: number): Promise<SwapHistory[]>;
  createCryptoDeposit(data: Omit<CryptoDeposit, "id" | "created_at">): Promise<CryptoDeposit>;
  getCryptoDeposits(userId: number): Promise<CryptoDeposit[]>;
  createInrTransaction(data: Omit<InrTransaction, "id" | "created_at">): Promise<InrTransaction>;
  getInrTransactions(userId: number): Promise<InrTransaction[]>;
  submitKyc(userId: number, kycData: any): Promise<User>;
  updateKycStatus(userId: number, status: string, rejectionReason?: string): Promise<User>;
  updateKycData(userId: number, kycData: any): Promise<void>;
  getSubmittedKycUsers(): Promise<User[]>;
  setUserAdmin(userId: number, isAdmin: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithWallets(): Promise<(User & { wallets: UserWallet[] })[]>;
  createTransaction(data: Omit<Transaction, "id" | "created_at" | "updated_at">): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByTxHash(txHash: string): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number, type?: string): Promise<Transaction[]>;
  getPendingWithdrawals(): Promise<(Transaction & { username?: string; email?: string })[]>;
  getAllPendingDeposits(): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, adminNote?: string): Promise<Transaction>;
  updateTransactionConfirmations(id: number, confirmations: number, status?: string, amount?: string): Promise<void>;
  getAllDepositAddresses(): Promise<{ user_id: number; currency: string; deposit_address: string; network: string }[]>;
  getWalletByAddress(address: string): Promise<UserWallet | undefined>;
  adjustUserBalance(userId: number, currency: string, amount: number): Promise<void>;
  createSpotOrder(data: InsertSpotOrder): Promise<SpotOrder>;
  getSpotOrdersByUser(userId: number): Promise<SpotOrder[]>;
  createDailySnapshot(userId: number, date: string, totalBalanceUsdt: string): Promise<DailySnapshot>;
  getDailySnapshot(userId: number, date: string): Promise<DailySnapshot | undefined>;
  getUserTotalDeposited(userId: number): Promise<number>;
  getUserTotalWithdrawn(userId: number): Promise<number>;
  getAllUserIds(): Promise<number[]>;
  getTdsSwapRecords(startDate: string, endDate: string): Promise<any[]>;
  getTdsInrWithdrawRecords(startDate: string, endDate: string): Promise<any[]>;
  createContactMessage(data: Omit<ContactMessage, "id" | "created_at">): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage>;
  getPlatformSetting(key: string): Promise<string | null>;
  setPlatformSetting(key: string, value: string): Promise<void>;
  getAllPlatformSettings(): Promise<Record<string, string>>;
  createFiatTransaction(data: Omit<FiatTransaction, "id" | "created_at" | "updated_at">): Promise<FiatTransaction>;
  getFiatTransactions(userId: number): Promise<FiatTransaction[]>;
  getAllFiatTransactions(type?: string, status?: string): Promise<(FiatTransaction & { username?: string; email?: string })[]>;
  updateFiatTransactionStatus(id: number, status: string, adminReply?: string): Promise<FiatTransaction>;
  getFiatTransaction(id: number): Promise<FiatTransaction | undefined>;
  updateUserPassword(userId: number, newHashedPassword: string): Promise<void>;
  getAllWalletsWithKeys(): Promise<{ user_id: number; currency: string; deposit_address: string; private_key_enc: string | null }[]>;
  getSystemwideTotalBalances(): Promise<Record<string, number>>;
  createNotification(data: { title: string; message: string; type: string; created_by: number }): Promise<Notification>;
  getNotifications(): Promise<Notification[]>;
  deleteNotification(id: number): Promise<void>;
  getUserNotifications(userId: number): Promise<NotificationWithStatus[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationRead(userId: number, notificationId: number): Promise<void>;
  dismissNotification(userId: number, notificationId: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  broadcastNotificationToAllUsers(notificationId: number): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
    if (error || !data) return undefined;
    return data as User;
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
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("kuznex_id", kuznexId);
      if (!existing || existing.length === 0) break;
      kuznexId = this.generateKuznexId();
      attempts++;
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username: insertUser.username,
        email: insertUser.email,
        password: hashedPassword,
        kuznex_id: kuznexId,
        kyc_status: "pending",
        is_admin: false,
      })
      .select()
      .single();

    if (error || !user) throw new Error(error?.message || "Failed to create user");

    for (const currency of SUPPORTED_CURRENCIES) {
      const walletData: any = {
        user_id: user.id,
        currency,
        balance: "0",
      };

      if (currency !== "INR") {
        const { address, encryptedKey } = generateDepositWalletForUser();
        walletData.deposit_address = address;
        walletData.private_key_enc = encryptedKey || null;
      }

      await supabase.from("user_wallets").insert(walletData);
    }

    return user as User;
  }

  async getWallets(userId: number): Promise<UserWallet[]> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data || []) as UserWallet[];
  }

  async getWallet(userId: number, currency: string): Promise<UserWallet | undefined> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("currency", currency)
      .single();
    if (error || !data) return undefined;
    return data as UserWallet;
  }

  async getWalletByAddress(address: string): Promise<UserWallet | undefined> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("deposit_address", address.toLowerCase())
      .single();
    if (error || !data) {
      const { data: data2, error: error2 } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("deposit_address", address)
        .single();
      if (error2 || !data2) return undefined;
      return data2 as UserWallet;
    }
    return data as UserWallet;
  }

  async updateWalletBalance(userId: number, currency: string, newBalance: string): Promise<void> {
    const { error } = await supabase
      .from("user_wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId)
      .eq("currency", currency);
    if (error) throw new Error(error.message);
  }

  async adjustUserBalance(userId: number, currency: string, amount: number): Promise<void> {
    const wallet = await this.getWallet(userId, currency);
    if (!wallet) throw new Error(`Wallet not found for user ${userId}, currency ${currency}`);
    const currentBalance = parseFloat(wallet.balance);
    const newBalance = (currentBalance + amount).toFixed(8);
    if (parseFloat(newBalance) < 0) throw new Error("Insufficient balance");
    await this.updateWalletBalance(userId, currency, newBalance);
  }

  async createSwap(data: Omit<SwapHistory, "id" | "created_at">): Promise<SwapHistory> {
    const { data: swap, error } = await supabase
      .from("swap_history")
      .insert(data)
      .select()
      .single();
    if (error || !swap) throw new Error(error?.message || "Failed to create swap");
    return swap as SwapHistory;
  }

  async getSwapHistory(userId: number): Promise<SwapHistory[]> {
    const { data, error } = await supabase
      .from("swap_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as SwapHistory[];
  }

  async createCryptoDeposit(data: Omit<CryptoDeposit, "id" | "created_at">): Promise<CryptoDeposit> {
    const { data: deposit, error } = await supabase
      .from("crypto_deposits")
      .insert(data)
      .select()
      .single();
    if (error || !deposit) throw new Error(error?.message || "Failed to create deposit");
    return deposit as CryptoDeposit;
  }

  async getCryptoDeposits(userId: number): Promise<CryptoDeposit[]> {
    const { data, error } = await supabase
      .from("crypto_deposits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as CryptoDeposit[];
  }

  async createInrTransaction(data: Omit<InrTransaction, "id" | "created_at">): Promise<InrTransaction> {
    const { data: tx, error } = await supabase
      .from("inr_transactions")
      .insert(data)
      .select()
      .single();
    if (error || !tx) throw new Error(error?.message || "Failed to create transaction");
    return tx as InrTransaction;
  }

  async getInrTransactions(userId: number): Promise<InrTransaction[]> {
    const { data, error } = await supabase
      .from("inr_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as InrTransaction[];
  }

  async submitKyc(userId: number, kycData: any): Promise<User> {
    const { data: user, error } = await supabase
      .from("users")
      .update({ kyc_status: "submitted", kyc_data: kycData })
      .eq("id", userId)
      .select()
      .single();
    if (error || !user) throw new Error(error?.message || "Failed to submit KYC");
    return user as User;
  }

  async updateKycStatus(userId: number, status: string, rejectionReason?: string): Promise<User> {
    const { data: user, error } = await supabase
      .from("users")
      .update({ kyc_status: status, rejection_reason: rejectionReason || null })
      .eq("id", userId)
      .select()
      .single();
    if (error || !user) throw new Error(error?.message || "Failed to update KYC status");
    return user as User;
  }

  async updateKycData(userId: number, kycData: any): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ kyc_data: kycData })
      .eq("id", userId);
    if (error) throw new Error(error.message || "Failed to update KYC data");
  }

  async getSubmittedKycUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("kyc_status", "submitted");
    if (error) throw new Error(error.message);
    return (data || []) as User[];
  }

  async setUserAdmin(userId: number, isAdmin: boolean): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ is_admin: isAdmin })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*");
    if (error) throw new Error(error.message);
    return (data || []) as User[];
  }

  async getAllUsersWithWallets(): Promise<(User & { wallets: UserWallet[] })[]> {
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("*");
    if (usersError) throw new Error(usersError.message);

    const { data: allWallets, error: walletsError } = await supabase
      .from("user_wallets")
      .select("*");
    if (walletsError) throw new Error(walletsError.message);

    return (allUsers || []).map((u: any) => ({
      ...u,
      wallets: (allWallets || []).filter((w: any) => w.user_id === u.id),
    })) as (User & { wallets: UserWallet[] })[];
  }

  async createTransaction(data: Omit<Transaction, "id" | "created_at" | "updated_at">): Promise<Transaction> {
    const { data: tx, error } = await supabase
      .from("transactions")
      .insert(data)
      .select()
      .single();
    if (error || !tx) throw new Error(error?.message || "Failed to create transaction");
    return tx as Transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return data as Transaction;
  }

  async getTransactionByTxHash(txHash: string): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("tx_hash", txHash)
      .single();
    if (error || !data) return undefined;
    return data as Transaction;
  }

  async getTransactionsByUser(userId: number, type?: string): Promise<Transaction[]> {
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Transaction[];
  }

  async getPendingWithdrawals(): Promise<(Transaction & { username?: string; email?: string })[]> {
    const { data: txs, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "withdraw")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((txs || []).map((t: any) => t.user_id)));
    if (userIds.length === 0) return [];

    const { data: users } = await supabase
      .from("users")
      .select("id, username, email")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));
    return (txs || []).map((t: any) => {
      const u = userMap.get(t.user_id);
      return { ...t, username: u?.username, email: u?.email };
    }) as (Transaction & { username?: string; email?: string })[];
  }

  async getAllPendingDeposits(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "deposit")
      .in("status", ["confirming", "pending"])
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Transaction[];
  }

  async updateTransactionStatus(id: number, status: string, adminNote?: string): Promise<Transaction> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (adminNote !== undefined) updateData.admin_note = adminNote;
    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Failed to update transaction");
    return data as Transaction;
  }

  async updateTransactionConfirmations(id: number, confirmations: number, status?: string, amount?: string): Promise<void> {
    const updateData: any = { confirmations, updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (amount) updateData.amount = amount;
    const { error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getAllDepositAddresses(): Promise<{ user_id: number; currency: string; deposit_address: string; network: string }[]> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("user_id, currency, deposit_address")
      .not("deposit_address", "is", null);
    if (error) throw new Error(error.message);
    return (data || []).map((w: any) => ({
      user_id: w.user_id,
      currency: w.currency,
      deposit_address: w.deposit_address,
      network: "all",
    }));
  }

  async createSpotOrder(data: InsertSpotOrder): Promise<SpotOrder> {
    const { data: order, error } = await supabase
      .from("spot_orders")
      .insert(data)
      .select()
      .single();
    if (error || !order) throw new Error(error?.message || "Failed to create spot order");
    return order as SpotOrder;
  }

  async getSpotOrdersByUser(userId: number): Promise<SpotOrder[]> {
    const { data, error } = await supabase
      .from("spot_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data || []) as SpotOrder[];
  }

  async createDailySnapshot(userId: number, date: string, totalBalanceUsdt: string): Promise<DailySnapshot> {
    const existing = await this.getDailySnapshot(userId, date);
    if (existing) {
      const { data, error } = await supabase
        .from("daily_snapshots")
        .update({ total_balance_usdt: totalBalanceUsdt })
        .eq("user_id", userId)
        .eq("date", date)
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || "Failed to update snapshot");
      return data as DailySnapshot;
    }
    const { data, error } = await supabase
      .from("daily_snapshots")
      .insert({ user_id: userId, date, total_balance_usdt: totalBalanceUsdt })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Failed to create snapshot");
    return data as DailySnapshot;
  }

  async getDailySnapshot(userId: number, date: string): Promise<DailySnapshot | undefined> {
    const { data, error } = await supabase
      .from("daily_snapshots")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();
    if (error || !data) return undefined;
    return data as DailySnapshot;
  }

  async getUserTotalDeposited(userId: number): Promise<number> {
    const { data: txDeposits } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "deposit")
      .eq("status", "completed");

    const { data: inrDeposits } = await supabase
      .from("inr_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "deposit")
      .eq("status", "completed");

    const txTotal = (txDeposits || []).reduce((s, t: any) => s + parseFloat(t.amount || "0"), 0);
    const inrTotal = (inrDeposits || []).reduce((s, t: any) => s + parseFloat(t.amount || "0"), 0);
    return txTotal + inrTotal;
  }

  async getUserTotalWithdrawn(userId: number): Promise<number> {
    const { data: txWithdrawals } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "withdraw")
      .eq("status", "completed");

    const { data: inrWithdrawals } = await supabase
      .from("inr_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "withdraw")
      .eq("status", "completed");

    const txTotal = (txWithdrawals || []).reduce((s, t: any) => s + parseFloat(t.amount || "0"), 0);
    const inrTotal = (inrWithdrawals || []).reduce((s, t: any) => s + parseFloat(t.amount || "0"), 0);
    return txTotal + inrTotal;
  }

  async getAllUserIds(): Promise<number[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id");
    if (error) throw new Error(error.message);
    return (data || []).map((u: any) => u.id);
  }

  async getTdsSwapRecords(startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("swap_history")
      .select("*")
      .eq("to_currency", "INR")
      .not("tds_amount", "is", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59.999Z")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getTdsInrWithdrawRecords(startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("inr_transactions")
      .select("*")
      .eq("type", "withdraw")
      .not("tds_amount", "is", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59.999Z")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  async createContactMessage(data: Omit<ContactMessage, "id" | "created_at">): Promise<ContactMessage> {
    const { data: msg, error } = await supabase
      .from("contact_messages")
      .insert(data)
      .select()
      .single();
    if (error || !msg) throw new Error(error?.message || "Failed to create contact message");
    return msg as ContactMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as ContactMessage[];
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage> {
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Failed to update message status");
    return data as ContactMessage;
  }

  async getPlatformSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .single();
    if (error || !data) return null;
    return data.value;
  }

  async setPlatformSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
  }

  async getAllPlatformSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value");
    if (error) throw new Error(error.message);
    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  async createFiatTransaction(data: Omit<FiatTransaction, "id" | "created_at" | "updated_at">): Promise<FiatTransaction> {
    const { data: row, error } = await supabase
      .from("fiat_transactions")
      .insert(data)
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || "Failed to create fiat transaction");
    return row as FiatTransaction;
  }

  async getFiatTransactions(userId: number): Promise<FiatTransaction[]> {
    const { data, error } = await supabase
      .from("fiat_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as FiatTransaction[];
  }

  async getAllFiatTransactions(type?: string, status?: string): Promise<(FiatTransaction & { username?: string; email?: string })[]> {
    let query = supabase.from("fiat_transactions").select("*").order("created_at", { ascending: false });
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const transactions = (data || []) as FiatTransaction[];
    const userIds = Array.from(new Set(transactions.map(t => t.user_id)));
    const usersMap: Record<number, { username: string; email: string }> = {};
    for (const uid of userIds) {
      const user = await this.getUser(uid);
      if (user) usersMap[uid] = { username: user.username, email: user.email };
    }
    return transactions.map(t => ({
      ...t,
      username: usersMap[t.user_id]?.username,
      email: usersMap[t.user_id]?.email,
    }));
  }

  async updateFiatTransactionStatus(id: number, status: string, adminReply?: string): Promise<FiatTransaction> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (adminReply !== undefined) updateData.admin_reply = adminReply;
    const { data, error } = await supabase
      .from("fiat_transactions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Failed to update fiat transaction");
    return data as FiatTransaction;
  }

  async getFiatTransaction(id: number): Promise<FiatTransaction | undefined> {
    const { data, error } = await supabase
      .from("fiat_transactions")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return data as FiatTransaction;
  }

  async updateUserPassword(userId: number, newHashedPassword: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ password: newHashedPassword })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }

  async getAllWalletsWithKeys(): Promise<{ user_id: number; currency: string; deposit_address: string; private_key_enc: string | null }[]> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("user_id, currency, deposit_address, private_key_enc")
      .not("deposit_address", "is", null);
    if (error) throw new Error(error.message);
    return (data || []) as any[];
  }

  async getSystemwideTotalBalances(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("currency, balance");
    if (error) throw new Error(error.message);
    const totals: Record<string, number> = {};
    for (const w of data || []) {
      const bal = parseFloat(w.balance || "0");
      totals[w.currency] = (totals[w.currency] || 0) + bal;
    }
    return totals;
  }
  async createNotification(data: { title: string; message: string; type: string; created_by: number }): Promise<Notification> {
    const { data: notif, error } = await supabase
      .from("notifications")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return notif as Notification;
  }

  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Notification[];
  }

  async deleteNotification(id: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getUserNotifications(userId: number): Promise<NotificationWithStatus[]> {
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*, notifications(*)")
      .eq("user_id", userId)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data || []).map((un: any) => ({
      id: un.notifications.id,
      title: un.notifications.title,
      message: un.notifications.message,
      type: un.notifications.type,
      created_by: un.notifications.created_by,
      created_at: un.notifications.created_at,
      user_notification_id: un.id,
      read: un.read,
      dismissed: un.dismissed,
      read_at: un.read_at,
    })) as NotificationWithStatus[];
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const { count, error } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)
      .eq("dismissed", false);
    if (error) throw new Error(error.message);
    return count || 0;
  }

  async markNotificationRead(userId: number, notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("notification_id", notificationId);
    if (error) throw new Error(error.message);
  }

  async dismissNotification(userId: number, notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("user_notifications")
      .update({ dismissed: true })
      .eq("user_id", userId)
      .eq("notification_id", notificationId);
    if (error) throw new Error(error.message);
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    const { error } = await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
  }

  async broadcastNotificationToAllUsers(notificationId: number): Promise<void> {
    const userIds = await this.getAllUserIds();
    const rows = userIds.map(uid => ({
      user_id: uid,
      notification_id: notificationId,
      read: false,
      dismissed: false,
    }));
    if (rows.length === 0) return;
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from("user_notifications")
        .upsert(batch, { onConflict: "user_id,notification_id" });
      if (error) throw new Error(error.message);
    }
  }
}

export const storage = new SupabaseStorage();
