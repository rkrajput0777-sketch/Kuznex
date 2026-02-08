-- Kuznex Platform Database Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  kuznex_id TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  kyc_data JSONB,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  currency TEXT NOT NULL,
  balance NUMERIC(18,8) NOT NULL DEFAULT 0
);

-- Swap history table
CREATE TABLE IF NOT EXISTS swap_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  from_amount NUMERIC(18,8) NOT NULL,
  to_amount NUMERIC(18,8) NOT NULL,
  rate NUMERIC(18,8) NOT NULL,
  spread_percent NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crypto deposits table
CREATE TABLE IF NOT EXISTS crypto_deposits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  currency TEXT NOT NULL,
  amount NUMERIC(18,8),
  network TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INR transactions table
CREATE TABLE IF NOT EXISTS inr_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  utr_number TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session table for express-session (optional, using memorystore instead)
-- CREATE TABLE IF NOT EXISTS session (
--   sid VARCHAR NOT NULL PRIMARY KEY,
--   sess JSON NOT NULL,
--   expire TIMESTAMPTZ NOT NULL
-- );

-- Disable Row Level Security for server-side access with anon key
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE swap_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE inr_transactions DISABLE ROW LEVEL SECURITY;
