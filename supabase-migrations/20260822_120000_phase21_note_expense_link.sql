-- Phase 21.3: Link notes to expenses
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notes_expense ON notes(expense_id);
