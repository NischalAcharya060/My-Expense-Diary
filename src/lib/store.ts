"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Expense,
  RecurringPayment,
  Budget,
  Note,
  Category,
  CategoryItem,
  PaymentMethod,
  ExpenseType,
  RecurringFrequency,
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
import { DEFAULT_CATEGORIES } from "@/types";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchExpenses()
      .then(setExpenses)
      .catch(() => setExpenses([]))
      .finally(() => setLoaded(true));
  }, []);

  const addExpense = useCallback(
    async (data: Omit<Expense, "id" | "created_at" | "updated_at">) => {
      const expense = await addExpenseAction(data);
      setExpenses((prev) => [expense, ...prev]);
      return expense;
    },
    []
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<Expense>) => {
      await updateExpenseAction(id, data);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e))
      );
    },
    []
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await deleteExpenseAction(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    []
  );

  const getExpensesByDate = useCallback(
    (date: string) =>
      expenses
        .filter((e) => e.date === date)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [expenses]
  );

  const getExpensesByMonth = useCallback(
    (year: number, month: number) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return expenses.filter((e) => e.date.startsWith(prefix));
    },
    [expenses]
  );

  const getMonthTotal = useCallback(
    (year: number, month: number) => {
      return getExpensesByMonth(year, month).reduce((sum, e) => sum + e.amount, 0);
    },
    [getExpensesByMonth]
  );

  const getTodayTotal = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return expenses.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return {
    expenses,
    loaded,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByDate,
    getExpensesByMonth,
    getMonthTotal,
    getTodayTotal,
  };
}

export function useRecurringPayments() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchRecurringPayments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoaded(true));
  }, []);

  const addPayment = useCallback(
    async (data: Omit<RecurringPayment, "id" | "created_at" | "updated_at">) => {
      const payment = await addRecurringPayment(data);
      setPayments((prev) => [payment, ...prev]);
      return payment;
    },
    []
  );

  const updatePayment = useCallback(
    async (id: string, data: Partial<RecurringPayment>) => {
      await updateRecurringPayment(id, data);
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p))
      );
    },
    []
  );

  const deletePayment = useCallback(
    async (id: string) => {
      await deleteRecurringPayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    },
    []
  );

  return { payments, loaded, addPayment, updatePayment, deletePayment };
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchBudgets()
      .then(setBudgets)
      .catch(() => setBudgets([]))
      .finally(() => setLoaded(true));
  }, []);

  const setBudget = useCallback(
    async (year: number, month: number, amount: number, category?: string) => {
      const budget = await upsertBudget(year, month, amount, category);
      setBudgets((prev) => {
        const existing = prev.find(
          (b) => b.year === year && b.month === month && b.category === (category || undefined)
        );
        if (existing) {
          return prev.map((b) => (b.id === existing.id ? budget : b));
        }
        return [...prev, budget];
      });
    },
    []
  );

  const getBudget = useCallback(
    (year: number, month: number, category?: string) =>
      budgets.find(
        (b) => b.year === year && b.month === month && b.category === (category || undefined)
      ),
    [budgets]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      await deleteBudgetAction(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    },
    []
  );

  return { budgets, loaded, setBudget, getBudget, deleteBudget };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchNotes()
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoaded(true));
  }, []);

  const addNote = useCallback(
    async (data: Omit<Note, "id" | "created_at" | "updated_at">) => {
      const note = await addNoteAction(data);
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    []
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Note>) => {
      await updateNoteAction(id, data);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n))
      );
    },
    []
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await deleteNoteAction(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    []
  );

  return { notes, loaded, addNote, updateNote, deleteNote };
}

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

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORY_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const addCategory = useCallback(
    async (name: string, icon: string, color: string) => {
      const category = await addCategoryAction(name, icon, color);
      setCategories((prev) => [...prev, category]);
      return category;
    },
    []
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (id.startsWith("default-")) return;
      await deleteCategoryAction(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  const getCategoryByName = useCallback(
    (name: string) => categories.find((c) => c.name === name),
    [categories]
  );

  return { categories, loaded, addCategory, deleteCategory, getCategoryByName };
}
