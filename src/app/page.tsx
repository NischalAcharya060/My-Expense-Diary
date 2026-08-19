"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, ChevronRight, TrendingDown, Wallet, CalendarClock } from "lucide-react";
import Link from "next/link";
import { useExpenses, useRecurringPayments, useBudgets, useCategories } from "@/lib/store";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";
import type { Expense } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

export default function DashboardPage() {
  const { expenses, loaded, getTodayTotal, getMonthTotal } = useExpenses();
  const { payments } = useRecurringPayments();
  const { getBudget } = useBudgets();
  const { getCategoryByName } = useCategories();
  const today = new Date();
  const { year, month } = getCurrentMonth();
  const [mounted, setMounted] = useState(false);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-4 w-32 bg-paper-dark rounded" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-paper-dark rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayStr = today.toISOString().split("T")[0];
  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const todayTotal = getTodayTotal();
  const monthTotal = getMonthTotal(year, month);
  const budget = getBudget(year, month);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - monthTotal;
  const upcomingPayments = payments
    .filter((p) => p.is_active)
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 3);

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        {/* Date header */}
        <div className="mb-8">
          <h1 className="font-handwritten text-4xl sm:text-5xl text-ink-dark mb-1">
            {format(today, "MMMM d, yyyy")}
          </h1>
          <p className="text-ink-light text-sm font-sans">
            {format(today, "EEEE")}
          </p>
        </div>

        {/* Quick stats ribbon */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="paper-card px-4 py-3 flex-1 min-w-[140px]">
            <p className="text-xs text-ink-light uppercase tracking-wide mb-1">Today</p>
            <p className="font-handwritten text-2xl text-accent-warm amount">{formatCurrency(todayTotal)}</p>
          </div>
          <div className="paper-card px-4 py-3 flex-1 min-w-[140px]">
            <p className="text-xs text-ink-light uppercase tracking-wide mb-1">This Month</p>
            <p className="font-handwritten text-2xl text-ink-dark amount">{formatCurrency(monthTotal)}</p>
          </div>
          {budgetAmount > 0 && (
            <div className={`paper-card px-4 py-3 flex-1 min-w-[140px] ${remaining < 0 ? "border-l-2 border-accent-red" : ""}`}>
              <p className="text-xs text-ink-light uppercase tracking-wide mb-1">Remaining</p>
              <p className={`font-handwritten text-2xl amount ${remaining < 0 ? "text-accent-red" : "text-accent-green"}`}>
                {formatCurrency(Math.abs(remaining))}
                {remaining < 0 && " over"}
              </p>
            </div>
          )}
        </div>

        {/* Today's entries — notebook style */}
        <div className="paper-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-handwritten text-2xl text-ink-dark">Today&apos;s Entries</h2>
            <Link
              href="/expenses?add=true"
              onClick={(e) => { e.preventDefault(); requireAuth(() => window.location.href = "/expenses?add=true"); }}
              className="flex items-center gap-1.5 text-sm text-accent-warm hover:opacity-80 transition-opacity font-medium"
            >
              <Plus size={16} />
              Add
            </Link>
          </div>

          {todayExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-handwritten text-xl text-ink-light">No entries yet today</p>
              <p className="text-xs text-ink-light mt-2">Tap &ldquo;Add&rdquo; to write your first expense</p>
            </div>
          ) : (
            <>
              {todayExpenses.map((expense) => (
                <ExpenseEntry key={expense.id} expense={expense} />
              ))}
              <div className="mt-4 pt-3 border-t border-ink-light/30 flex items-center">
                <span className="font-handwritten text-lg text-ink-medium">Today&apos;s Total</span>
                <span className="dots" />
                <span className="font-handwritten text-xl text-accent-warm amount font-semibold">
                  {formatCurrency(todayTotal)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Upcoming recurring payments */}
        {upcomingPayments.length > 0 && (
          <div className="paper-card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock size={18} className="text-ink-light" />
              <h2 className="font-handwritten text-2xl text-ink-dark">Upcoming Payments</h2>
            </div>
            <div className="space-y-2">
              {upcomingPayments.map((p) => (
                <div key={p.id} className="flex items-center py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                  <span className="text-sm text-ink-dark font-medium">{p.name}</span>
                  <span className="dots" />
                  <span className="text-sm text-ink-medium amount">
                    {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                  </span>
                  <span className="ml-3 text-xs text-ink-light">
                    Due {p.due_day}{getOrdinalSuffix(p.due_day)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent expenses */}
        <div className="paper-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-handwritten text-2xl text-ink-dark">Recent Expenses</h2>
            <Link
              href="/expenses"
              className="flex items-center gap-1 text-sm text-accent-warm hover:opacity-80 transition-opacity"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {expenses.length === 0 ? (
            <p className="text-center text-ink-light font-handwritten text-lg py-4">
              Your expense diary is empty. Start writing!
            </p>
          ) : (
            <div className="space-y-1">
              {expenses.slice(0, 7).map((expense) => (
                <div key={expense.id} className="flex items-center py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                  <span className="text-base mr-3 shrink-0">{getCategoryByName(expense.category)?.icon || "🏷️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-dark truncate">{expense.name}</p>
                    <p className="text-xs text-ink-light">{expense.category} · {format(new Date(expense.date), "MMM d")}</p>
                  </div>
                  <span className="text-sm text-ink-medium amount ml-2">{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
    </div>
  );
}

function ExpenseEntry({ expense }: { expense: Expense }) {
  const { getCategoryByName } = useCategories();
  return (
    <div className="handwritten-entry flex items-baseline group">
      <span className="text-base mr-1.5 shrink-0">{getCategoryByName(expense.category)?.icon || "🏷️"}</span>
      <span className="text-ink-dark">{expense.name}</span>
      <span className="dots" />
      <span className="text-ink-medium amount whitespace-nowrap">{formatCurrency(expense.amount)}</span>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Groceries: "#16A34A", Food: "#EA580C", Transport: "#2563EB",
    Shopping: "#D946EF", Personal: "#8B5CF6", Medicine: "#DC2626",
    Education: "#0891B2", Entertainment: "#F59E0B", Household: "#64748B",
    Bills: "#E11D48", Subscription: "#7C3AED", Other: "#6B7280",
  };
  return colors[category] || "#6B7280";
}

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
