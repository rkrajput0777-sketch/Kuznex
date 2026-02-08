import { supabase } from "./supabase";
import type {
  User,
  InsertUser,
  UserWallet,
  SwapHistory,
  CryptoDeposit,
  InrTransaction,
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
  createSwap(data: Omit<SwapHistory, "id" | "created_at">): Promise<SwapHistory>;
  getSwapHistory(userId: number): Promise<SwapHistory[]>;
  createCryptoDeposit(data: Omit<CryptoDeposit, "id" | "created_at">): Promise<CryptoDeposit>;
  getCryptoDeposits(userId: number): Promise<CryptoDeposit[]>;
  createInrTransaction(data: Omit<InrTransaction, "id" | "created_at">): Promise<InrTransaction>;
  getInrTransactions(userId: number): Promise<InrTransaction[]>;
  submitKyc(userId: number, kycData: any): Promise<User>;
  updateKycStatus(userId: number, status: string, rejectionReason?: string): Promise<User>;
  getSubmittedKycUsers(): Promise<User[]>;
  setUserAdmin(userId: number, isAdmin: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithWallets(): Promise<(User & { wallets: UserWallet[] })[]>;
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
      await supabase
        .from("user_wallets")
        .insert({
          user_id: user.id,
          currency,
          balance: "0",
        });
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

  async updateWalletBalance(userId: number, currency: string, newBalance: string): Promise<void> {
    const { error } = await supabase
      .from("user_wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId)
      .eq("currency", currency);
    if (error) throw new Error(error.message);
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
}

export const storage = new SupabaseStorage();
