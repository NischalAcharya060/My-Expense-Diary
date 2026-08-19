"use client";

import { format } from "date-fns";
import type { Expense, Category } from "@/types";
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
  const { symbol, locale } = getCountry();
  return `${symbol} ${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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

export const CATEGORIES: Category[] = [
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
];

export const PAYMENT_METHODS = ["Cash", "Bank", "Card", "Digital Wallet", "Other"] as const;

export const EXPENSE_TYPES = ["Daily purchase", "Bill", "Subscription", "Recurring payment", "Other"] as const;

export const BILL_TYPES = ["Electricity", "Water", "Internet", "Mobile/Phone", "Gas", "Rent", "Other"] as const;

export const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] as const;

export const CATEGORY_COLORS: Record<Category, string> = {
  Groceries: "#16A34A",
  Food: "#EA580C",
  Transport: "#2563EB",
  Shopping: "#D946EF",
  Personal: "#8B5CF6",
  Medicine: "#DC2626",
  Education: "#0891B2",
  Entertainment: "#F59E0B",
  Household: "#64748B",
  Bills: "#E11D48",
  Subscription: "#7C3AED",
  Other: "#6B7280",
};

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
