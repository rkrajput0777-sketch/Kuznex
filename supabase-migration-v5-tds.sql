-- Migration V5: TDS (Tax Deducted at Source) Compliance
-- Run this in Supabase SQL Editor
-- Adds TDS tracking columns to swap_history and inr_transactions tables

ALTER TABLE swap_history
  ADD COLUMN IF NOT EXISTS tds_amount DECIMAL(18, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS net_payout DECIMAL(18, 2) DEFAULT NULL;

ALTER TABLE inr_transactions
  ADD COLUMN IF NOT EXISTS tds_amount DECIMAL(18, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS net_payout DECIMAL(18, 2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_swap_history_tds ON swap_history(to_currency, tds_amount) WHERE tds_amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inr_transactions_tds ON inr_transactions(type, tds_amount) WHERE tds_amount IS NOT NULL;
