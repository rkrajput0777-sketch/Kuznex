-- =============================================================================
-- Kuznex Platform - Complete Supabase Migration
-- Run this in Supabase SQL Editor for a fresh setup
-- This includes ALL tables required by the platform
-- =============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  kuznex_id TEXT UNIQUE,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'not_submitted',
  rejection_reason TEXT,
  kyc_data JSONB,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER WALLETS TABLE
CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance TEXT NOT NULL DEFAULT '0',
  deposit_address TEXT,
  private_key_enc TEXT,
  UNIQUE(user_id, currency)
);

-- 3. SWAP HISTORY TABLE
CREATE TABLE IF NOT EXISTS swap_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  from_amount TEXT NOT NULL,
  to_amount TEXT NOT NULL,
  rate TEXT NOT NULL,
  spread_percent TEXT NOT NULL DEFAULT '1',
  status TEXT NOT NULL DEFAULT 'completed',
  tds_amount TEXT,
  net_payout TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CRYPTO DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS crypto_deposits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount TEXT,
  network TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INR TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS inr_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount TEXT NOT NULL,
  utr_number TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tds_amount TEXT,
  net_payout TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRANSACTIONS TABLE (Withdrawals)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  confirmations INTEGER NOT NULL DEFAULT 0,
  required_confirmations INTEGER NOT NULL DEFAULT 12,
  from_address TEXT,
  to_address TEXT,
  withdraw_address TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SPOT ORDERS TABLE
CREATE TABLE IF NOT EXISTS spot_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  side TEXT NOT NULL,
  amount TEXT NOT NULL,
  price TEXT NOT NULL,
  fee TEXT NOT NULL DEFAULT '0',
  total_usdt TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DAILY SNAPSHOTS TABLE (Portfolio Analytics)
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  total_balance_usdt TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 9. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. FIAT TRANSACTIONS TABLE (Buy/Sell USDT with Admin Approval)
CREATE TABLE IF NOT EXISTS fiat_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount TEXT NOT NULL,
  usdt_amount TEXT NOT NULL,
  rate TEXT NOT NULL,
  utr_number TEXT,
  screenshot TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_reply TEXT,
  tds_amount TEXT,
  net_payout TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PLATFORM SETTINGS TABLE (Admin-configurable rates)
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_currency ON user_wallets(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_swap_history_user_id ON swap_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_created ON swap_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_inr_transactions_user_id ON inr_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_spot_orders_user_id ON spot_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_orders_pair ON spot_orders(pair);
CREATE INDEX IF NOT EXISTS idx_spot_orders_created ON spot_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_snapshots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_user_id ON fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_status ON fiat_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_type ON fiat_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_created ON fiat_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_kuznex_id ON users(kuznex_id);

-- =============================================================================
-- SEED DEFAULT PLATFORM SETTINGS
-- =============================================================================

INSERT INTO platform_settings (key, value, updated_at)
VALUES
  ('usdt_buy_rate', '92', NOW()),
  ('usdt_sell_rate', '90', NOW())
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- DISABLE ROW LEVEL SECURITY (for server-side anon key access)
-- =============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE swap_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE inr_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE spot_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE fiat_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DONE! All 11 tables created with indexes and default settings.
-- =============================================================================
