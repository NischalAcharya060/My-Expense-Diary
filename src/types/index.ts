export type Category = string;

export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORY_DATA = [
  { name: "Groceries", icon: "🛒", color: "#16A34A" },
  { name: "Food", icon: "🍔", color: "#EA580C" },
  { name: "Transport", icon: "🚌", color: "#2563EB" },
  { name: "Shopping", icon: "🛍️", color: "#D946EF" },
  { name: "Personal", icon: "💆", color: "#8B5CF6" },
  { name: "Medicine", icon: "💊", color: "#DC2626" },
  { name: "Education", icon: "📚", color: "#0891B2" },
  { name: "Entertainment", icon: "🎬", color: "#F59E0B" },
  { name: "Household", icon: "🏠", color: "#64748B" },
  { name: "Bills", icon: "💡", color: "#E11D48" },
  { name: "Subscription", icon: "📺", color: "#7C3AED" },
  { name: "Other", icon: "📝", color: "#6B7280" },
] as const satisfies readonly DefaultCategory[];

export const DEFAULT_CATEGORIES: Category[] = DEFAULT_CATEGORY_DATA.map((c) => c.name);

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id?: string;
}

export type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Card"
  | "Digital Wallet"
  | "Other";

export type ExpenseType =
  | "Daily purchase"
  | "Bill"
  | "Subscription"
  | "Recurring payment"
  | "Other";

export type BillType =
  | "Electricity"
  | "Water"
  | "Internet"
  | "Mobile/Phone"
  | "Gas"
  | "Rent"
  | "Other";

export type RecurringFrequency =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Yearly";

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: Category;
  date: string;
  payment_method: PaymentMethod;
  note?: string;
  receipt_url?: string;
  expense_type: ExpenseType;
  recurring_payment_id?: string;
  created_at: string;
  updated_at: string;
  /** True while an entry added offline is still waiting to be synced. */
  pendingSync?: boolean;
}

export interface RecurringPayment {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_variable: boolean;
  category: Category;
  frequency: RecurringFrequency;
  due_day: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  reminder_days: number;
  last_paid?: string;
  auto_pay?: boolean;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  amount: number;
  category?: Category;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  expense_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  date: string;
  source: string;
  category: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface DayExpenses {
  date: string;
  expenses: Expense[];
  total: number;
}
