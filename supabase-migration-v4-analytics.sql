-- Migration V4: Portfolio Analytics - Daily Snapshots
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS daily_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  total_balance_usdt DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_snapshots(user_id, date);

ALTER TABLE daily_snapshots DISABLE ROW LEVEL SECURITY;
