-- ================================================================
-- KUZNEX COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- This script is safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

-- ========================
-- TABLE 1: users
-- ========================
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
  aadhaar_mask TEXT,
  pan_mask TEXT,
  total_volume_usdt NUMERIC DEFAULT 0,
  total_tds_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe column additions for existing users table
DO $$ BEGIN ALTER TABLE users ADD COLUMN kuznex_id TEXT UNIQUE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN rejection_reason TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN kyc_data JSONB; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN aadhaar_mask TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN pan_mask TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN total_volume_usdt NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN total_tds_paid NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ========================
-- TABLE 2: user_wallets
-- ========================
CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance TEXT NOT NULL DEFAULT '0',
  deposit_address TEXT,
  private_key_enc TEXT,
  UNIQUE(user_id, currency)
);

-- ========================
-- TABLE 3: swap_history
-- ========================
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

DO $$ BEGIN ALTER TABLE swap_history ADD COLUMN tds_amount TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE swap_history ADD COLUMN net_payout TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ========================
-- TABLE 4: crypto_deposits
-- ========================
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

-- ========================
-- TABLE 5: inr_transactions
-- ========================
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

DO $$ BEGIN ALTER TABLE inr_transactions ADD COLUMN tds_amount TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE inr_transactions ADD COLUMN net_payout TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ========================
-- TABLE 6: transactions
-- ========================
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

DO $$ BEGIN ALTER TABLE transactions ADD COLUMN withdraw_address TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE transactions ADD COLUMN admin_note TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ========================
-- TABLE 7: spot_orders
-- ========================
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

-- ========================
-- TABLE 8: daily_snapshots
-- ========================
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  total_balance_usdt TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ========================
-- TABLE 9: contact_messages
-- ========================
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

-- ========================
-- TABLE 10: fiat_transactions
-- ========================
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

-- ========================
-- TABLE 11: platform_settings
-- ========================
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- TABLE 12: notifications
-- ========================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- TABLE 13: user_notifications
-- ========================
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_user_id ON swap_history(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_inr_transactions_user_id ON inr_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_spot_orders_user_id ON spot_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_snapshots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_user_id ON fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_status ON fiat_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_dismissed ON user_notifications(user_id, dismissed);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ========================
-- DEFAULT PLATFORM SETTINGS
-- ========================
INSERT INTO platform_settings (key, value, updated_at)
VALUES
  ('usdt_buy_rate', '92', NOW()),
  ('usdt_sell_rate', '90', NOW()),
  ('upi_id', 'kuznex@upi', NOW()),
  ('bank_name', 'State Bank of India', NOW()),
  ('bank_account_number', '1234567890', NOW()),
  ('bank_ifsc', 'SBIN0001234', NOW()),
  ('bank_account_name', 'Kuznex Pvt Ltd', NOW()),
  ('is_upi_enabled', 'true', NOW()),
  ('is_bank_enabled', 'true', NOW()),
  ('is_imps_enabled', 'true', NOW())
ON CONFLICT (key) DO NOTHING;

-- ========================
-- DISABLE ROW LEVEL SECURITY
-- ========================
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
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- DONE! All 13 tables created with indexes and settings.
-- Tables: users, user_wallets, swap_history, crypto_deposits,
--         inr_transactions, transactions, spot_orders,
--         daily_snapshots, contact_messages, fiat_transactions,
--         platform_settings, notifications, user_notifications
-- ================================================================
