-- Migration V8: Fiat Transactions Table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fiat_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount TEXT NOT NULL,
  usdt_amount TEXT NOT NULL DEFAULT '0',
  rate TEXT NOT NULL DEFAULT '0',
  utr_number TEXT,
  screenshot TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_reply TEXT,
  tds_amount TEXT,
  net_payout TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiat_transactions_user_id ON fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_status ON fiat_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_type ON fiat_transactions(type);
