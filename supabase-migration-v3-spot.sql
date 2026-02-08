-- Kuznex Platform Migration V3: Spot Trading Module
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create spot_orders table
CREATE TABLE IF NOT EXISTS spot_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  pair VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  amount VARCHAR(50) NOT NULL,
  price VARCHAR(50) NOT NULL,
  fee VARCHAR(50) NOT NULL,
  total_usdt VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Disable RLS on new table
ALTER TABLE spot_orders DISABLE ROW LEVEL SECURITY;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spot_orders_user_id ON spot_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_orders_created_at ON spot_orders(created_at DESC);
