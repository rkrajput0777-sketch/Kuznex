-- Kuznex Platform Settings Migration (v7)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default USDT buy/sell rates (INR per USDT)
INSERT INTO platform_settings (key, value) VALUES ('usdt_buy_rate', '92.00') ON CONFLICT (key) DO NOTHING;
INSERT INTO platform_settings (key, value) VALUES ('usdt_sell_rate', '90.00') ON CONFLICT (key) DO NOTHING;
