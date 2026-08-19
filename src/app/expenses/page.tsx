"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Search } from "lucide-react";
import { useExpenses, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AddExpenseModal from "@/components/AddExpenseModal";
import type { Expense } from "@/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

function ExpensesPageInner() {
  const { expenses, loaded, deleteExpense } = useExpenses();
  const { categories, getCategoryByName } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const searchParams = useSearchParams();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  useEffect(() => {
    if (searchParams.get("add") === "true") requireAuth(() => setShowAdd(true));
  }, [searchParams]);

  if (!loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-paper-dark rounded" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = expenses
    .filter((e) => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "All" || e.category === filterCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

  const grouped: Record<string, Expense[]> = {};
  filtered.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark">Daily Expenses</h1>
          <button
            onClick={() => requireAuth(() => setShowAdd(true))}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-warm text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark placeholder:text-ink-light/50 focus:outline-none focus:border-accent-warm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="paper-card p-8 text-center">
            <p className="font-handwritten text-xl text-ink-light">No expenses found</p>
            <p className="text-xs text-ink-light mt-2">Start tracking your spending!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-handwritten text-xl text-ink-dark">
                    {format(new Date(date + "T00:00:00"), "EEEE, MMMM d")}
                  </h3>
                  <span className="dots" />
                  <span className="font-handwritten text-lg text-accent-warm amount">{formatCurrency(dayTotal)}</span>
                </div>
                <div className="space-y-1">
                  {dayExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="paper-card px-4 py-3 flex items-center gap-3 group hover:shadow-md transition-shadow"
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryByName(expense.category)?.color || "#6B7280" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-dark truncate">{expense.name}</p>
                        <p className="text-xs text-ink-light">{getCategoryByName(expense.category)?.icon} {expense.category} · {expense.payment_method}</p>
                      </div>
                      <span className="text-sm text-ink-medium amount shrink-0">{formatCurrency(expense.amount)}</span>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-accent-red transition-all"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
        </div>
      </div>
    }>
      <ExpensesPageInner />
    </Suspense>
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
