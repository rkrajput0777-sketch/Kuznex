-- Kuznex Platform Migration V2: Hybrid Fund System
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Add deposit address columns to user_wallets
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS deposit_address TEXT;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS private_key_enc TEXT;

-- 2. Create transactions table for deposits and withdrawals
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC(18,8) NOT NULL DEFAULT 0,
  network TEXT NOT NULL,
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

-- 3. Disable RLS on new table
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_user_wallets_deposit_address ON user_wallets(deposit_address);
