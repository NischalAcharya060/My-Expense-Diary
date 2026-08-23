"use client";

import { format } from "date-fns";
import type { Expense, Category } from "@/types";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_DATA } from "@/types";
import { COUNTRIES, DEFAULT_COUNTRY, getFlagUrl } from "@/lib/countries";

function getCountry() {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;
  const saved = localStorage.getItem("country");
  if (saved) {
    const found = COUNTRIES.find((c) => c.code === saved);
    if (found) return found;
  }
  return DEFAULT_COUNTRY;
}

export function formatCurrency(amount: number): string {
  const { symbol } = getCountry();
  return `${symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol(): string {
  return getCountry().symbol;
}

export function getFlag(): string {
  return getFlagUrl(getCountry().code);
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM dd, yyyy");
}

export function formatDateFull(dateStr: string): string {
  return format(new Date(dateStr), "MMMM d, yyyy");
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), "MMM d");
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export const CATEGORIES: Category[] = DEFAULT_CATEGORIES;

export const PAYMENT_METHODS = ["Cash", "Bank", "Card", "Digital Wallet", "Other"] as const;

export const EXPENSE_TYPES = ["Daily purchase", "Bill", "Subscription", "Recurring payment", "Other"] as const;

export const BILL_TYPES = ["Electricity", "Water", "Internet", "Mobile/Phone", "Gas", "Rent", "Other"] as const;

export const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] as const;

export const CATEGORY_COLORS: Record<Category, string> = Object.fromEntries(
  DEFAULT_CATEGORY_DATA.map((c) => [c.name, c.color])
);

export function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};
  expenses.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });
  return grouped;
}

export function getTotalByCategory(expenses: Expense[]): Record<Category, number> {
  const totals: Record<Category, number> = {
    Groceries: 0, Food: 0, Transport: 0, Shopping: 0, Personal: 0,
    Medicine: 0, Education: 0, Entertainment: 0, Household: 0,
    Bills: 0, Subscription: 0, Other: 0,
  };
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return totals;
}

/* Quick-add preferences — remembers the last used category / payment method
   so the Add Expense form opens pre-selected for faster entry. */

const QUICK_ADD_PREFS_KEY = "quick_add_prefs_v1";

export interface QuickAddPrefs {
  category?: string;
  paymentMethod?: string;
}

export function getQuickAddPrefs(): QuickAddPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(QUICK_ADD_PREFS_KEY);
    return raw ? (JSON.parse(raw) as QuickAddPrefs) : {};
  } catch {
    return {};
  }
}

export function saveQuickAddPrefs(prefs: QuickAddPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUICK_ADD_PREFS_KEY, JSON.stringify({ ...getQuickAddPrefs(), ...prefs }));
  } catch {
    // storage unavailable or full — preference writes are best-effort
  }
}

/** Short vibration tick on supported devices (mobile expense saved). */
export function hapticFeedback(): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(35);
  }
}

/**
 * Selector matching overlays (dialogs, mobile nav) that opt out of the global
 * touch gestures — pull-to-refresh and edge swipe-back never fire while a
 * matched element contains the touch target.
 */
export const GESTURE_BLOCK_SELECTOR = '[role="dialog"], [data-gesture-block]';
