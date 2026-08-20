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
  updateCategory as updateCategoryAction,
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
  expensesError: string | null;
  refetchExpenses: () => Promise<void>;
  addExpense: (data: Omit<Expense, "id" | "created_at" | "updated_at">) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByDate: (date: string) => Expense[];
  getExpensesByMonth: (year: number, month: number) => Expense[];
  getMonthTotal: (year: number, month: number) => number;
  getTodayTotal: () => number;

  payments: RecurringPayment[];
  paymentsLoaded: boolean;
  paymentsError: string | null;
  refetchPayments: () => Promise<void>;
  addPayment: (data: Omit<RecurringPayment, "id" | "created_at" | "updated_at">) => Promise<RecurringPayment>;
  updatePayment: (id: string, data: Partial<RecurringPayment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  budgets: Budget[];
  budgetsLoaded: boolean;
  budgetsError: string | null;
  refetchBudgets: () => Promise<void>;
  setBudget: (year: number, month: number, amount: number, category?: string) => Promise<void>;
  getBudget: (year: number, month: number, category?: string) => Budget | undefined;
  deleteBudget: (id: string) => Promise<void>;
  fetchBudgetsIfNeeded: () => Promise<void>;

  notes: Note[];
  notesLoaded: boolean;
  notesError: string | null;
  refetchNotes: () => Promise<void>;
  addNote: (data: Omit<Note, "id" | "created_at" | "updated_at">) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  categories: CategoryItem[];
  categoriesLoaded: boolean;
  categoriesError: string | null;
  refetchCategories: () => Promise<void>;
  addCategory: (name: string, icon: string, color: string) => Promise<CategoryItem>;
  updateCategory: (id: string, updates: Partial<Pick<CategoryItem, "name" | "icon" | "color">>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryByName: (name: string) => CategoryItem | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [autoPayProcessed, setAutoPayProcessed] = useState(false);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);
  const [budgetsFetched, setBudgetsFetched] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORY_DATA);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedExpenses = localStorage.getItem("cache_expenses");
      if (cachedExpenses) {
        setExpenses(JSON.parse(cachedExpenses));
        setExpensesLoaded(true);
      }
      const cachedPayments = localStorage.getItem("cache_payments");
      if (cachedPayments) {
        setPayments(JSON.parse(cachedPayments));
        setPaymentsLoaded(true);
      }
      const cachedCategories = localStorage.getItem("cache_categories");
      if (cachedCategories) {
        setCategories(JSON.parse(cachedCategories));
        setCategoriesLoaded(true);
      }
      const cachedNotes = localStorage.getItem("cache_notes");
      if (cachedNotes) {
        setNotes(JSON.parse(cachedNotes));
        setNotesLoaded(true);
      }
    }

    fetchExpenses().then((data) => {
      setExpenses(data);
      setExpensesError(null);
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(data));
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load expenses";
      setExpensesError(msg);
      toast("Failed to load expenses", "error");
    }).finally(() => setExpensesLoaded(true));

    fetchRecurringPayments().then((data) => {
      setPayments(data);
      setPaymentsError(null);
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(data));
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load recurring payments";
      setPaymentsError(msg);
      toast("Failed to load recurring payments", "error");
    }).finally(() => setPaymentsLoaded(true));

    fetchCategories().then((data) => {
      if (data.length > 0) {
        setCategories(data);
        if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(data));
      }
      setCategoriesError(null);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load categories";
      setCategoriesError(msg);
      toast("Failed to load categories", "error");
    }).finally(() => setCategoriesLoaded(true));

    fetchNotes().then((data) => {
      setNotes(data);
      setNotesError(null);
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(data));
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load notes";
      setNotesError(msg);
      toast("Failed to load notes", "error");
    }).finally(() => setNotesLoaded(true));
  }, [toast]); // hydrating store from cache + server on mount
  /* eslint-enable react-hooks/set-state-in-effect */

  const refetchExpenses = useCallback(async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
      setExpensesError(null);
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load expenses";
      setExpensesError(msg);
      toast("Failed to load expenses", "error");
    }
  }, [toast]);

  const refetchPayments = useCallback(async () => {
    try {
      const data = await fetchRecurringPayments();
      setPayments(data);
      setPaymentsError(null);
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load recurring payments";
      setPaymentsError(msg);
      toast("Failed to load recurring payments", "error");
    }
  }, [toast]);

  const refetchNotes = useCallback(async () => {
    try {
      const data = await fetchNotes();
      setNotes(data);
      setNotesError(null);
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load notes";
      setNotesError(msg);
      toast("Failed to load notes", "error");
    }
  }, [toast]);

  const refetchCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      if (data.length > 0) {
        setCategories(data);
        if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(data));
      }
      setCategoriesError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load categories";
      setCategoriesError(msg);
      toast("Failed to load categories", "error");
    }
  }, [toast]);

  const refetchBudgets = useCallback(async () => {
    try {
      const data = await fetchBudgets();
      setBudgets(data);
      setBudgetsError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load budgets";
      setBudgetsError(msg);
      toast("Failed to load budgets", "error");
    }
  }, [toast]);

  const addExpense = useCallback(async (data: Omit<Expense, "id" | "created_at" | "updated_at">) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticExpense: Expense = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setExpenses((prev) => {
      const next = [optimisticExpense, ...prev];
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(next));
      return next;
    });

    try {
      const realExpense = await addExpenseAction(data);
      setExpenses((prev) => {
        const next = prev.map((e) => (e.id === tempId ? realExpense : e));
        if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(next));
        return next;
      });
      return realExpense;
    } catch (err) {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== tempId);
        if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(next));
        return next;
      });
      throw err;
    }
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    let originalExpenses: Expense[] = [];
    setExpenses((prev) => {
      originalExpenses = prev;
      const next = prev.map((e) => (e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e));
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(next));
      return next;
    });

    try {
      await updateExpenseAction(id, data);
    } catch (err) {
      setExpenses(originalExpenses);
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(originalExpenses));
      throw err;
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    let originalExpenses: Expense[] = [];
    setExpenses((prev) => {
      originalExpenses = prev;
      const next = prev.filter((e) => e.id !== id);
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(next));
      return next;
    });

    try {
      await deleteExpenseAction(id);
    } catch (err) {
      setExpenses(originalExpenses);
      if (typeof window !== "undefined") localStorage.setItem("cache_expenses", JSON.stringify(originalExpenses));
      throw err;
    }
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
    const tempId = `temp-${Date.now()}`;
    const optimisticPayment: RecurringPayment = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPayments((prev) => {
      const next = [optimisticPayment, ...prev];
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(next));
      return next;
    });

    try {
      const realPayment = await addRecurringPayment(data);
      setPayments((prev) => {
        const next = prev.map((p) => (p.id === tempId ? realPayment : p));
        if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(next));
        return next;
      });
      return realPayment;
    } catch (err) {
      setPayments((prev) => {
        const next = prev.filter((p) => p.id !== tempId);
        if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(next));
        return next;
      });
      throw err;
    }
  }, []);

  const updatePayment = useCallback(async (id: string, data: Partial<RecurringPayment>) => {
    let originalPayments: RecurringPayment[] = [];
    setPayments((prev) => {
      originalPayments = prev;
      const next = prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p));
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(next));
      return next;
    });

    try {
      await updateRecurringPayment(id, data);
    } catch (err) {
      setPayments(originalPayments);
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(originalPayments));
      throw err;
    }
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    let originalPayments: RecurringPayment[] = [];
    setPayments((prev) => {
      originalPayments = prev;
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(next));
      return next;
    });

    try {
      await deleteRecurringPayment(id);
    } catch (err) {
      setPayments(originalPayments);
      if (typeof window !== "undefined") localStorage.setItem("cache_payments", JSON.stringify(originalPayments));
      throw err;
    }
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
    fetchBudgets().then((data) => {
      setBudgets(data);
      setBudgetsError(null);
    }).catch((err) => {
      setBudgets([]);
      const msg = err instanceof Error ? err.message : "Failed to load budgets";
      setBudgetsError(msg);
      toast("Failed to load budgets", "error");
    }).finally(() => setBudgetsLoaded(true));
  }, [budgetsFetched, toast]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchBudgetsIfNeeded(); }, [fetchBudgetsIfNeeded]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    const tempId = `temp-${Date.now()}`;
    const optimisticNote: Note = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) => {
      const next = [optimisticNote, ...prev];
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(next));
      return next;
    });

    try {
      const realNote = await addNoteAction(data);
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === tempId ? realNote : n));
        if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(next));
        return next;
      });
      return realNote;
    } catch (err) {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== tempId);
        if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(next));
        return next;
      });
      throw err;
    }
  }, []);

  const updateNote = useCallback(async (id: string, data: Partial<Note>) => {
    let originalNotes: Note[] = [];
    setNotes((prev) => {
      originalNotes = prev;
      const next = prev.map((n) => (n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n));
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(next));
      return next;
    });

    try {
      await updateNoteAction(id, data);
    } catch (err) {
      setNotes(originalNotes);
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(originalNotes));
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    let originalNotes: Note[] = [];
    setNotes((prev) => {
      originalNotes = prev;
      const next = prev.filter((n) => n.id !== id);
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(next));
      return next;
    });

    try {
      await deleteNoteAction(id);
    } catch (err) {
      setNotes(originalNotes);
      if (typeof window !== "undefined") localStorage.setItem("cache_notes", JSON.stringify(originalNotes));
      throw err;
    }
  }, []);

  // Categories
  const addCategory = useCallback(async (name: string, icon: string, color: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticCategory: CategoryItem = {
      id: tempId,
      name,
      icon,
      color,
    };

    setCategories((prev) => {
      const next = [...prev, optimisticCategory];
      if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(next));
      return next;
    });

    try {
      const realCategory = await addCategoryAction(name, icon, color);
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === tempId ? realCategory : c));
        if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(next));
        return next;
      });
      return realCategory;
    } catch (err) {
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== tempId);
        if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(next));
        return next;
      });
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Pick<CategoryItem, "name" | "icon" | "color">>) => {
    let originalCategories: CategoryItem[] = [];
    setCategories((prev) => {
      originalCategories = prev;
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(next));
      return next;
    });

    try {
      await updateCategoryAction(id, updates);
    } catch (err) {
      setCategories(originalCategories);
      if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(originalCategories));
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    if (id.startsWith("default-")) return;
    let originalCategories: CategoryItem[] = [];
    setCategories((prev) => {
      originalCategories = prev;
      const next = prev.filter((c) => c.id !== id);
      if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(next));
      return next;
    });

    try {
      await deleteCategoryAction(id);
    } catch (err) {
      setCategories(originalCategories);
      if (typeof window !== "undefined") localStorage.setItem("cache_categories", JSON.stringify(originalCategories));
      throw err;
    }
  }, []);

  const getCategoryByName = useCallback((name: string) =>
    categories.find((c) => c.name === name),
    [categories]
  );

  return (
    <StoreContext.Provider value={{
      expenses, expensesLoaded, expensesError, refetchExpenses,
      addExpense, updateExpense, deleteExpense,
      getExpensesByDate, getExpensesByMonth, getMonthTotal, getTodayTotal,
      payments, paymentsLoaded, paymentsError, refetchPayments,
      addPayment, updatePayment, deletePayment,
      budgets, budgetsLoaded, budgetsError, refetchBudgets,
      setBudget, getBudget, deleteBudget, fetchBudgetsIfNeeded,
      notes, notesLoaded, notesError, refetchNotes,
      addNote, updateNote, deleteNote,
      categories, categoriesLoaded, categoriesError, refetchCategories,
      addCategory, updateCategory, deleteCategory, getCategoryByName,
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
    expenses, expensesLoaded, expensesError, refetchExpenses,
    addExpense, updateExpense, deleteExpense,
    getExpensesByDate, getExpensesByMonth, getMonthTotal, getTodayTotal,
  } = useStore();
  return {
    expenses, loaded: expensesLoaded, error: expensesError, refetch: refetchExpenses,
    addExpense, updateExpense, deleteExpense,
    getExpensesByDate, getExpensesByMonth, getMonthTotal, getTodayTotal,
  };
}

export function useRecurringPayments() {
  const { payments, paymentsLoaded, paymentsError, refetchPayments, addPayment, updatePayment, deletePayment } = useStore();
  return { payments, loaded: paymentsLoaded, error: paymentsError, refetch: refetchPayments, addPayment, updatePayment, deletePayment };
}

export function useBudgets() {
  const { budgets, budgetsLoaded, budgetsError, refetchBudgets, setBudget, getBudget, deleteBudget, fetchBudgetsIfNeeded } = useStore();
  return { budgets, loaded: budgetsLoaded, error: budgetsError, refetch: refetchBudgets, setBudget, getBudget, deleteBudget, fetchBudgets: fetchBudgetsIfNeeded };
}

export function useNotes() {
  const { notes, notesLoaded, notesError, refetchNotes, addNote, updateNote, deleteNote } = useStore();
  return { notes, loaded: notesLoaded, error: notesError, refetch: refetchNotes, addNote, updateNote, deleteNote };
}

export function useCategories() {
  const { categories, categoriesLoaded, categoriesError, refetchCategories, addCategory, updateCategory, deleteCategory, getCategoryByName } = useStore();
  return { categories, loaded: categoriesLoaded, error: categoriesError, refetch: refetchCategories, addCategory, updateCategory, deleteCategory, getCategoryByName };
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
    const checkDate = new Date(start);
    while (checkDate <= today) {
      if (checkDate >= start && (!lastPaid || checkDate > lastPaid)) {
        dates.push(checkDate.toISOString().split("T")[0]);
      }
      checkDate.setDate(checkDate.getDate() + 7);
    }
  } else if (payment.frequency === "Daily") {
    const checkDate = new Date(start);
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
