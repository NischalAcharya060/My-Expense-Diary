"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import type {
  Expense,
  RecurringPayment,
  Budget,
  Note,
  CategoryItem,
  Income,
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
import {
  fetchIncome,
  addIncome as addIncomeAction,
  updateIncome as updateIncomeAction,
  deleteIncome as deleteIncomeAction,
} from "@/app/actions/income";
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

const CACHE_VERSION = "v2";

const cacheKey = (name: string) => `${name}_${CACHE_VERSION}`;

function readCache<T>(name: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(name));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(name: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(name), JSON.stringify(data));
  } catch {
    // storage unavailable or full — cache writes are best-effort
  }
}

const CACHE_NAMES = ["cache_expenses", "cache_payments", "cache_categories", "cache_notes", "cache_income"];

function clearLegacyCache(): void {
  if (typeof window === "undefined") return;
  CACHE_NAMES.forEach((name) => localStorage.removeItem(name));
}

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

  income: Income[];
  incomeLoaded: boolean;
  incomeError: string | null;
  refetchIncome: () => Promise<void>;
  addIncome: (data: Omit<Income, "id" | "created_at" | "updated_at">) => Promise<Income>;
  updateIncome: (id: string, data: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  getMonthIncome: (year: number, month: number) => number;

  clearCache: () => Promise<void>;
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

  const [income, setIncome] = useState<Income[]>([]);
  const [incomeLoaded, setIncomeLoaded] = useState(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    clearLegacyCache();
    if (typeof window !== "undefined") {
      const cachedExpenses = readCache<Expense[]>("cache_expenses");
      if (cachedExpenses) {
        setExpenses(cachedExpenses);
        setExpensesLoaded(true);
      }
      const cachedPayments = readCache<RecurringPayment[]>("cache_payments");
      if (cachedPayments) {
        setPayments(cachedPayments);
        setPaymentsLoaded(true);
      }
      const cachedCategories = readCache<CategoryItem[]>("cache_categories");
      if (cachedCategories) {
        setCategories(cachedCategories);
        setCategoriesLoaded(true);
      }
      const cachedNotes = readCache<Note[]>("cache_notes");
      if (cachedNotes) {
        setNotes(cachedNotes);
        setNotesLoaded(true);
      }
      const cachedIncome = readCache<Income[]>("cache_income");
      if (cachedIncome) {
        setIncome(cachedIncome);
        setIncomeLoaded(true);
      }
    }

    fetchExpenses().then((data) => {
      setExpenses(data);
      setExpensesError(null);
      writeCache("cache_expenses", data);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load expenses";
      setExpensesError(msg);
      toast("Failed to load expenses", "error");
    }).finally(() => setExpensesLoaded(true));

    fetchRecurringPayments().then((data) => {
      setPayments(data);
      setPaymentsError(null);
      writeCache("cache_payments", data);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load recurring payments";
      setPaymentsError(msg);
      toast("Failed to load recurring payments", "error");
    }).finally(() => setPaymentsLoaded(true));

    fetchCategories().then((data) => {
      if (data.length > 0) {
        setCategories(data);
        writeCache("cache_categories", data);
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
      writeCache("cache_notes", data);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load notes";
      setNotesError(msg);
      toast("Failed to load notes", "error");
    }).finally(() => setNotesLoaded(true));

    fetchIncome().then((data) => {
      setIncome(data);
      setIncomeError(null);
      writeCache("cache_income", data);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load income";
      setIncomeError(msg);
      toast("Failed to load income", "error");
    }).finally(() => setIncomeLoaded(true));
  }, [toast]); // hydrating store from cache + server on mount
  /* eslint-enable react-hooks/set-state-in-effect */

  const refetchExpenses = useCallback(async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
      setExpensesError(null);
      writeCache("cache_expenses", data);
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
      writeCache("cache_payments", data);
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
      writeCache("cache_notes", data);
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
        writeCache("cache_categories", data);
      }
      setCategoriesError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load categories";
      setCategoriesError(msg);
      toast("Failed to load categories", "error");
    }
  }, [toast]);

  const refetchIncome = useCallback(async () => {
    try {
      const data = await fetchIncome();
      setIncome(data);
      setIncomeError(null);
      writeCache("cache_income", data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load income";
      setIncomeError(msg);
      toast("Failed to load income", "error");
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

  const clearCache = useCallback(async () => {
    if (typeof window !== "undefined") {
      CACHE_NAMES.forEach((name) => localStorage.removeItem(cacheKey(name)));
      clearLegacyCache();
    }
    await Promise.all([
      refetchExpenses(),
      refetchPayments(),
      refetchNotes(),
      refetchCategories(),
      refetchIncome(),
      refetchBudgets(),
    ]);
  }, [refetchExpenses, refetchPayments, refetchNotes, refetchCategories, refetchIncome, refetchBudgets]);

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
      writeCache("cache_expenses", next);
      return next;
    });

    try {
      const realExpense = await addExpenseAction(data);
      setExpenses((prev) => {
        const next = prev.map((e) => (e.id === tempId ? realExpense : e));
        writeCache("cache_expenses", next);
        return next;
      });
      return realExpense;
    } catch (err) {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== tempId);
        writeCache("cache_expenses", next);
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
      writeCache("cache_expenses", next);
      return next;
    });

    try {
      await updateExpenseAction(id, data);
    } catch (err) {
      setExpenses(originalExpenses);
      writeCache("cache_expenses", originalExpenses);
      throw err;
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    let originalExpenses: Expense[] = [];
    setExpenses((prev) => {
      originalExpenses = prev;
      const next = prev.filter((e) => e.id !== id);
      writeCache("cache_expenses", next);
      return next;
    });

    try {
      await deleteExpenseAction(id);
    } catch (err) {
      setExpenses(originalExpenses);
      writeCache("cache_expenses", originalExpenses);
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
      writeCache("cache_payments", next);
      return next;
    });

    try {
      const realPayment = await addRecurringPayment(data);
      setPayments((prev) => {
        const next = prev.map((p) => (p.id === tempId ? realPayment : p));
        writeCache("cache_payments", next);
        return next;
      });
      return realPayment;
    } catch (err) {
      setPayments((prev) => {
        const next = prev.filter((p) => p.id !== tempId);
        writeCache("cache_payments", next);
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
      writeCache("cache_payments", next);
      return next;
    });

    try {
      await updateRecurringPayment(id, data);
    } catch (err) {
      setPayments(originalPayments);
      writeCache("cache_payments", originalPayments);
      throw err;
    }
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    let originalPayments: RecurringPayment[] = [];
    setPayments((prev) => {
      originalPayments = prev;
      const next = prev.filter((p) => p.id !== id);
      writeCache("cache_payments", next);
      return next;
    });

    try {
      await deleteRecurringPayment(id);
    } catch (err) {
      setPayments(originalPayments);
      writeCache("cache_payments", originalPayments);
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
      writeCache("cache_notes", next);
      return next;
    });

    try {
      const realNote = await addNoteAction(data);
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === tempId ? realNote : n));
        writeCache("cache_notes", next);
        return next;
      });
      return realNote;
    } catch (err) {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== tempId);
        writeCache("cache_notes", next);
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
      writeCache("cache_notes", next);
      return next;
    });

    try {
      await updateNoteAction(id, data);
    } catch (err) {
      setNotes(originalNotes);
      writeCache("cache_notes", originalNotes);
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    let originalNotes: Note[] = [];
    setNotes((prev) => {
      originalNotes = prev;
      const next = prev.filter((n) => n.id !== id);
      writeCache("cache_notes", next);
      return next;
    });

    try {
      await deleteNoteAction(id);
    } catch (err) {
      setNotes(originalNotes);
      writeCache("cache_notes", originalNotes);
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
      writeCache("cache_categories", next);
      return next;
    });

    try {
      const realCategory = await addCategoryAction(name, icon, color);
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === tempId ? realCategory : c));
        writeCache("cache_categories", next);
        return next;
      });
      return realCategory;
    } catch (err) {
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== tempId);
        writeCache("cache_categories", next);
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
      writeCache("cache_categories", next);
      return next;
    });

    try {
      await updateCategoryAction(id, updates);
    } catch (err) {
      setCategories(originalCategories);
      writeCache("cache_categories", originalCategories);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    if (id.startsWith("default-")) return;
    let originalCategories: CategoryItem[] = [];
    setCategories((prev) => {
      originalCategories = prev;
      const next = prev.filter((c) => c.id !== id);
      writeCache("cache_categories", next);
      return next;
    });

    try {
      await deleteCategoryAction(id);
    } catch (err) {
      setCategories(originalCategories);
      writeCache("cache_categories", originalCategories);
      throw err;
    }
  }, []);

  const getCategoryByName = useCallback((name: string) =>
    categories.find((c) => c.name === name),
    [categories]
  );

  // Income
  const addIncome = useCallback(async (data: Omit<Income, "id" | "created_at" | "updated_at">) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticIncome: Income = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIncome((prev) => {
      const next = [optimisticIncome, ...prev];
      writeCache("cache_income", next);
      return next;
    });

    try {
      const realIncome = await addIncomeAction(data);
      setIncome((prev) => {
        const next = prev.map((i) => (i.id === tempId ? realIncome : i));
        writeCache("cache_income", next);
        return next;
      });
      return realIncome;
    } catch (err) {
      setIncome((prev) => {
        const next = prev.filter((i) => i.id !== tempId);
        writeCache("cache_income", next);
        return next;
      });
      throw err;
    }
  }, []);

  const updateIncome = useCallback(async (id: string, updates: Partial<Income>) => {
    let originalIncome: Income[] = [];
    setIncome((prev) => {
      originalIncome = prev;
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      writeCache("cache_income", next);
      return next;
    });

    try {
      await updateIncomeAction(id, updates);
    } catch (err) {
      setIncome(originalIncome);
      writeCache("cache_income", originalIncome);
      throw err;
    }
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    let originalIncome: Income[] = [];
    setIncome((prev) => {
      originalIncome = prev;
      const next = prev.filter((i) => i.id !== id);
      writeCache("cache_income", next);
      return next;
    });

    try {
      await deleteIncomeAction(id);
    } catch (err) {
      setIncome(originalIncome);
      writeCache("cache_income", originalIncome);
      throw err;
    }
  }, []);

  const getMonthIncome = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return income
      .filter((i) => i.date.startsWith(prefix))
      .reduce((sum, i) => sum + i.amount, 0);
  }, [income]);

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
      income, incomeLoaded, incomeError, refetchIncome,
      addIncome, updateIncome, deleteIncome, getMonthIncome,
      clearCache,
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

export function useIncome() {
  const { income, incomeLoaded, incomeError, refetchIncome, addIncome, updateIncome, deleteIncome, getMonthIncome } = useStore();
  return { income, loaded: incomeLoaded, error: incomeError, refetch: refetchIncome, addIncome, updateIncome, deleteIncome, getMonthIncome };
}

export function useClearCache() {
  const { clearCache } = useStore();
  return clearCache;
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
