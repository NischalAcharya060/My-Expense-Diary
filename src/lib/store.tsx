"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import type {
  Expense,
  RecurringPayment,
  Budget,
  Note,
  CategoryItem,
} from "@/types";
import {
  fetchExpenses,
  addExpense as addExpenseAction,
  updateExpense as updateExpenseAction,
  deleteExpense as deleteExpenseAction,
} from "@/app/actions/expenses";
import {
  fetchRecurringPayments,
  addRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
} from "@/app/actions/recurring";
import {
  fetchBudgets,
  upsertBudget,
  deleteBudget as deleteBudgetAction,
} from "@/app/actions/budgets";
import {
  fetchNotes,
  addNote as addNoteAction,
  updateNote as updateNoteAction,
  deleteNote as deleteNoteAction,
} from "@/app/actions/notes";
import {
  fetchCategories,
  addCategory as addCategoryAction,
  deleteCategory as deleteCategoryAction,
} from "@/app/actions/categories";
import { useToast } from "@/components/Toast";


const DEFAULT_CATEGORY_DATA: CategoryItem[] = [
  { id: "default-groceries", name: "Groceries", icon: "🛒", color: "#16A34A" },
  { id: "default-food", name: "Food", icon: "🍔", color: "#EA580C" },
  { id: "default-transport", name: "Transport", icon: "🚌", color: "#2563EB" },
  { id: "default-shopping", name: "Shopping", icon: "🛍️", color: "#D946EF" },
  { id: "default-personal", name: "Personal", icon: "💆", color: "#8B5CF6" },
  { id: "default-medicine", name: "Medicine", icon: "💊", color: "#DC2626" },
  { id: "default-education", name: "Education", icon: "📚", color: "#0891B2" },
  { id: "default-entertainment", name: "Entertainment", icon: "🎬", color: "#F59E0B" },
  { id: "default-household", name: "Household", icon: "🏠", color: "#64748B" },
  { id: "default-bills", name: "Bills", icon: "💡", color: "#E11D48" },
  { id: "default-subscription", name: "Subscription", icon: "📺", color: "#7C3AED" },
  { id: "default-other", name: "Other", icon: "📝", color: "#6B7280" },
];

interface StoreContextValue {
  expenses: Expense[];
  expensesLoaded: boolean;
  addExpense: (data: Omit<Expense, "id" | "created_at" | "updated_at">) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByDate: (date: string) => Expense[];
  getExpensesByMonth: (year: number, month: number) => Expense[];
  getMonthTotal: (year: number, month: number) => number;
  getTodayTotal: () => number;

  payments: RecurringPayment[];
  paymentsLoaded: boolean;
  addPayment: (data: Omit<RecurringPayment, "id" | "created_at" | "updated_at">) => Promise<RecurringPayment>;
  updatePayment: (id: string, data: Partial<RecurringPayment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  budgets: Budget[];
  budgetsLoaded: boolean;
  setBudget: (year: number, month: number, amount: number, category?: string) => Promise<void>;
  getBudget: (year: number, month: number, category?: string) => Budget | undefined;
  deleteBudget: (id: string) => Promise<void>;
  fetchBudgetsIfNeeded: () => Promise<void>;

  notes: Note[];
  notesLoaded: boolean;
  addNote: (data: Omit<Note, "id" | "created_at" | "updated_at">) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  categories: CategoryItem[];
  categoriesLoaded: boolean;
  addCategory: (name: string, icon: string, color: string) => Promise<CategoryItem>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryByName: (name: string) => CategoryItem | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);

  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [autoPayProcessed, setAutoPayProcessed] = useState(false);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [budgetsFetched, setBudgetsFetched] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORY_DATA);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    fetchExpenses().then(setExpenses).catch(() => setExpenses([])).finally(() => setExpensesLoaded(true));
    fetchRecurringPayments().then(setPayments).catch(() => setPayments([])).finally(() => setPaymentsLoaded(true));
    fetchCategories().then((data) => { if (data.length > 0) setCategories(data); }).catch(() => {}).finally(() => setCategoriesLoaded(true));
    fetchNotes().then(setNotes).catch(() => setNotes([])).finally(() => setNotesLoaded(true));
  }, []);

  // Expenses
  const addExpense = useCallback(async (data: Omit<Expense, "id" | "created_at" | "updated_at">) => {
    const expense = await addExpenseAction(data);
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    await updateExpenseAction(id, data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteExpenseAction(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getExpensesByDate = useCallback((date: string) =>
    expenses.filter((e) => e.date === date).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [expenses]
  );

  const getExpensesByMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(prefix));
  }, [expenses]);

  const getMonthTotal = useCallback((year: number, month: number) =>
    getExpensesByMonth(year, month).reduce((sum, e) => sum + e.amount, 0),
    [getExpensesByMonth]
  );

  const getTodayTotal = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return expenses.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Payments
  const addPayment = useCallback(async (data: Omit<RecurringPayment, "id" | "created_at" | "updated_at">) => {
    const payment = await addRecurringPayment(data);
    setPayments((prev) => [payment, ...prev]);
    return payment;
  }, []);

  const updatePayment = useCallback(async (id: string, data: Partial<RecurringPayment>) => {
    await updateRecurringPayment(id, data);
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p)));
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    await deleteRecurringPayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Auto-Pay Engine
  useEffect(() => {
    if (!expensesLoaded || !paymentsLoaded || autoPayProcessed) return;

    const runAutoPay = async () => {
      setAutoPayProcessed(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const activeAutoPay = payments.filter((p) => p.is_active && p.auto_pay);

      for (const p of activeAutoPay) {
        const dueDates = getDueDates(p, todayStr);
        if (dueDates.length === 0) continue;

        for (const dueDate of dueDates) {
          try {
            await addExpense({
              user_id: "",
              name: p.name,
              amount: p.amount,
              category: p.category,
              date: dueDate,
              payment_method: p.payment_method || "Card",
              expense_type: p.category === "Subscription" ? "Subscription" : "Bill",
              recurring_payment_id: p.id,
              note: `Scheduled auto-pay on due date ${dueDate}`,
            });
            await updatePayment(p.id, { last_paid: dueDate });
            toast(`Auto-paid: ${p.name}`);
          } catch (err) {
            console.error("Auto-pay failed for", p.name, err);
          }
        }
      }
    };

    runAutoPay();
  }, [expensesLoaded, paymentsLoaded, autoPayProcessed, payments, addExpense, updatePayment, toast]);

  // Budgets
  const fetchBudgetsIfNeeded = useCallback(async () => {
    if (budgetsFetched) return;
    setBudgetsFetched(true);
    fetchBudgets().then(setBudgets).catch(() => setBudgets([])).finally(() => setBudgetsLoaded(true));
  }, [budgetsFetched]);

  useEffect(() => { fetchBudgetsIfNeeded(); }, [fetchBudgetsIfNeeded]);

  const setBudget = useCallback(async (year: number, month: number, amount: number, category?: string) => {
    const budget = await upsertBudget(year, month, amount, category);
    setBudgets((prev) => {
      const existing = prev.find(
        (b) => b.year === year && b.month === month && (b.category || null) === (category || null)
      );
      if (existing) return prev.map((b) => (b.id === existing.id ? budget : b));
      return [...prev, budget];
    });
  }, []);

  const getBudget = useCallback((year: number, month: number, category?: string) =>
    budgets.find((b) => b.year === year && b.month === month && (b.category || null) === (category || null)),
    [budgets]
  );

  const deleteBudget = useCallback(async (id: string) => {
    await deleteBudgetAction(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Notes
  const addNote = useCallback(async (data: Omit<Note, "id" | "created_at" | "updated_at">) => {
    const note = await addNoteAction(data);
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback(async (id: string, data: Partial<Note>) => {
    await updateNoteAction(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n)));
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await deleteNoteAction(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Categories
  const addCategory = useCallback(async (name: string, icon: string, color: string) => {
    const category = await addCategoryAction(name, icon, color);
    setCategories((prev) => [...prev, category]);
    return category;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    if (id.startsWith("default-")) return;
    await deleteCategoryAction(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCategoryByName = useCallback((name: string) =>
    categories.find((c) => c.name === name),
    [categories]
  );

  return (
    <StoreContext.Provider value={{
      expenses, expensesLoaded, addExpense, updateExpense, deleteExpense,
      getExpensesByDate, getExpensesByMonth, getMonthTotal, getTodayTotal,
      payments, paymentsLoaded, addPayment, updatePayment, deletePayment,
      budgets, budgetsLoaded, setBudget, getBudget, deleteBudget, fetchBudgetsIfNeeded,
      notes, notesLoaded, addNote, updateNote, deleteNote,
      categories, categoriesLoaded, addCategory, deleteCategory, getCategoryByName,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useExpenses() {
  const {
    expenses, expensesLoaded, addExpense, updateExpense, deleteExpense,
    getExpensesByDate, getExpensesByMonth, getMonthTotal, getTodayTotal,
  } = useStore();
  return {
    expenses, loaded: expensesLoaded, addExpense, updateExpense, deleteExpense,
    getExpensesByDate, getExpensesByMonth, getMonthTotal, getTodayTotal,
  };
}

export function useRecurringPayments() {
  const { payments, paymentsLoaded, addPayment, updatePayment, deletePayment } = useStore();
  return { payments, loaded: paymentsLoaded, addPayment, updatePayment, deletePayment };
}

export function useBudgets(lazy = false) {
  const { budgets, budgetsLoaded, setBudget, getBudget, deleteBudget, fetchBudgetsIfNeeded } = useStore();
  return { budgets, loaded: budgetsLoaded, setBudget, getBudget, deleteBudget, fetchBudgets: fetchBudgetsIfNeeded };
}

export function useNotes() {
  const { notes, notesLoaded, addNote, updateNote, deleteNote } = useStore();
  return { notes, loaded: notesLoaded, addNote, updateNote, deleteNote };
}

export function useCategories() {
  const { categories, categoriesLoaded, addCategory, deleteCategory, getCategoryByName } = useStore();
  return { categories, loaded: categoriesLoaded, addCategory, deleteCategory, getCategoryByName };
}

export function getDueDates(payment: RecurringPayment, todayStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(payment.start_date);
  const today = new Date(todayStr);
  const lastPaid = payment.last_paid ? new Date(payment.last_paid) : null;

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  let year = start.getFullYear();
  let month = start.getMonth();

  if (payment.frequency === "Monthly") {
    let checkDate = new Date(year, month, Math.min(payment.due_day, getDaysInMonth(year, month)));
    while (checkDate <= today) {
      if (checkDate >= start && (!lastPaid || checkDate > lastPaid)) {
        dates.push(checkDate.toISOString().split("T")[0]);
      }
      month++;
      checkDate = new Date(year, month, Math.min(payment.due_day, getDaysInMonth(year, month)));
    }
  } else if (payment.frequency === "Yearly") {
    let checkDate = new Date(year, month, Math.min(payment.due_day, getDaysInMonth(year, month)));
    while (checkDate <= today) {
      if (checkDate >= start && (!lastPaid || checkDate > lastPaid)) {
        dates.push(checkDate.toISOString().split("T")[0]);
      }
      year++;
      checkDate = new Date(year, month, Math.min(payment.due_day, getDaysInMonth(year, month)));
    }
  } else if (payment.frequency === "Weekly") {
    let checkDate = new Date(start);
    while (checkDate <= today) {
      if (checkDate >= start && (!lastPaid || checkDate > lastPaid)) {
        dates.push(checkDate.toISOString().split("T")[0]);
      }
      checkDate.setDate(checkDate.getDate() + 7);
    }
  } else if (payment.frequency === "Daily") {
    let checkDate = new Date(start);
    while (checkDate <= today) {
      if (checkDate >= start && (!lastPaid || checkDate > lastPaid)) {
        dates.push(checkDate.toISOString().split("T")[0]);
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
  } else if (payment.frequency === "Quarterly") {
    let checkDate = new Date(year, month, Math.min(payment.due_day, getDaysInMonth(year, month)));
    while (checkDate <= today) {
      if (checkDate >= start && (!lastPaid || checkDate > lastPaid)) {
        dates.push(checkDate.toISOString().split("T")[0]);
      }
      month += 3;
      checkDate = new Date(year, month, Math.min(payment.due_day, getDaysInMonth(year, month)));
    }
  }
  return dates;
}

