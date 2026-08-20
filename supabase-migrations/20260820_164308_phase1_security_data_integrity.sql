-- ============================================
-- Phase 1 Migration: Security + Data Integrity
-- Generated: 2026-08-20 16:43:08
-- ============================================
-- Run this against an EXISTING database to apply Phase 1 schema changes.
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).

BEGIN;

-- 1. Add payment_method column to recurring_payments
ALTER TABLE recurring_payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';

-- 2. Add auto_pay column to recurring_payments
ALTER TABLE recurring_payments
  ADD COLUMN IF NOT EXISTS auto_pay BOOLEAN DEFAULT FALSE;

-- 3. Add CHECK constraint on expense_type (prevent typos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_expense_type'
      AND conrelid = 'expenses'::regclass
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT chk_expense_type
      CHECK (expense_type IN ('Daily purchase', 'Bill', 'Subscription', 'Recurring payment', 'Other'));
  END IF;
END $$;

-- 4. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_type ON expenses(user_id, expense_type);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_user_due ON recurring_payments(user_id, due_day);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- 5. Trigger function: sync last_paid on recurring_payments when an expense is linked
CREATE OR REPLACE FUNCTION sync_recurring_last_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recurring_payment_id IS NOT NULL THEN
    UPDATE recurring_payments
    SET last_paid = NEW.date
    WHERE id = NEW.recurring_payment_id
      AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS trg_sync_recurring_last_paid ON expenses;

CREATE TRIGGER trg_sync_recurring_last_paid
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_recurring_last_paid();

COMMIT;
