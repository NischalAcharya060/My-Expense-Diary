-- ============================================
-- Expense Tracker — Supabase / PostgreSQL Schema
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (predefined + user custom)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#6B7280',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Insert default categories (available to all users)
INSERT INTO categories (name, icon, color, user_id) VALUES
  ('Groceries', '🛒', '#16A34A', NULL),
  ('Food', '🍔', '#EA580C', NULL),
  ('Transport', '🚌', '#2563EB', NULL),
  ('Shopping', '🛍️', '#D946EF', NULL),
  ('Personal', '💆', '#8B5CF6', NULL),
  ('Medicine', '💊', '#DC2626', NULL),
  ('Education', '📚', '#0891B2', NULL),
  ('Entertainment', '🎬', '#F59E0B', NULL),
  ('Household', '🏠', '#64748B', NULL),
  ('Bills', '💡', '#E11D48', NULL),
  ('Subscription', '📺', '#7C3AED', NULL),
  ('Other', '📝', '#6B7280', NULL);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'Other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  note TEXT,
  receipt_url TEXT,
  expense_type TEXT NOT NULL DEFAULT 'Daily purchase' CHECK (expense_type IN ('Daily purchase', 'Bill', 'Subscription', 'Recurring payment', 'Other')),
  recurring_payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring payments table
CREATE TABLE recurring_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) CHECK (amount >= 0),
  is_variable BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'Other',
  frequency TEXT NOT NULL DEFAULT 'Monthly',
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  reminder_days INTEGER DEFAULT 3,
  last_paid DATE,
  payment_method TEXT DEFAULT 'Cash',
  auto_pay BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from expenses to recurring_payments
ALTER TABLE expenses
  ADD CONSTRAINT fk_expense_recurring
  FOREIGN KEY (recurring_payment_id)
  REFERENCES recurring_payments(id)
  ON DELETE SET NULL;

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year, category)
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '#FEF9C3',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_expenses_user_type ON expenses(user_id, expense_type);
CREATE INDEX idx_recurring_payments_user ON recurring_payments(user_id, is_active);
CREATE INDEX idx_recurring_payments_user_due ON recurring_payments(user_id, due_day);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX idx_notes_user ON notes(user_id, pinned DESC, updated_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON recurring_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: sync last_paid on recurring_payments when an expense is linked
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

CREATE TRIGGER trg_sync_recurring_last_paid
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_recurring_last_paid();

-- Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own data
CREATE POLICY "Users can manage own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recurring_payments" ON recurring_payments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Categories: users can read all defaults + their own custom, but only modify their own
CREATE POLICY "Users can read default and own categories" ON categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);
