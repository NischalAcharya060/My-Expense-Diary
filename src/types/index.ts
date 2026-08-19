export type Category = string;

export const DEFAULT_CATEGORIES = [
  "Groceries",
  "Food",
  "Transport",
  "Shopping",
  "Personal",
  "Medicine",
  "Education",
  "Entertainment",
  "Household",
  "Bills",
  "Subscription",
  "Other",
] as const;

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
  created_at: string;
  updated_at: string;
}

export interface DayExpenses {
  date: string;
  expenses: Expense[];
  total: number;
}
