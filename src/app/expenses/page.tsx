"use client";

import { useEffect, useState } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Plus, Trash2, Search, Edit2, CalendarDays, X } from "lucide-react";
import { useExpenses, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AddExpenseModal from "@/components/AddExpenseModal";
import EditExpenseModal from "@/components/EditExpenseModal";
import type { Expense } from "@/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

function ExpensesPageInner() {
  const { expenses, loaded, deleteExpense } = useExpenses();
  const { categories, getCategoryByName } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [quickFilter, setQuickFilter] = useState<string>("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchParams = useSearchParams();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("add") === "true") requireAuth(() => setShowAdd(true));
  }, [searchParams, requireAuth]);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

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
      let matchDate = true;
      if (dateRange) {
        matchDate = e.date >= dateRange.start && e.date <= dateRange.end;
      }
      return matchSearch && matchCategory && matchDate;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

  const grouped: Record<string, Expense[]> = {};
  filtered.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  function applyQuickFilter(type: string) {
    setQuickFilter(type);
    if (type === "All") {
      setDateRange(null);
    } else if (type === "Today") {
      setDateRange({ start: todayStr, end: todayStr });
    } else if (type === "This Week") {
      const start = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      setDateRange({ start, end });
    } else if (type === "This Month") {
      const start = format(startOfMonth(today), "yyyy-MM-dd");
      const end = format(endOfMonth(today), "yyyy-MM-dd");
      setDateRange({ start, end });
    } else if (type === "Last 30 Days") {
      const start = format(subDays(today, 30), "yyyy-MM-dd");
      setDateRange({ start, end: todayStr });
    }
  }

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <div>
            <h1 className="font-handwritten text-4xl text-ink-dark">Daily Expenses</h1>
            <p className="text-xs text-ink-light mt-0.5">Your financial journal logs sorted chronologically.</p>
          </div>
          <button
            onClick={() => requireAuth(() => setShowAdd(true))}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Log Expense
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="mb-6 bg-paper-dark/30 p-3 rounded-lg border border-[rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
              <input
                type="text"
                placeholder="Search by keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          {/* Date range quick filters */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <CalendarDays size={14} className="text-ink-light shrink-0" />
            {["All", "Today", "This Week", "This Month", "Last 30 Days"].map((f) => (
              <button
                key={f}
                onClick={() => applyQuickFilter(f)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  quickFilter === f
                    ? "bg-accent-warm text-white"
                    : "bg-paper-bg text-ink-medium hover:text-ink-dark border border-[rgba(0,0,0,0.06)]"
                }`}
              >
                {f}
              </button>
            ))}
            {quickFilter === "Custom" && (
              <>
                <input
                  type="date"
                  value={dateRange?.start || ""}
                  onChange={(e) => setDateRange((prev) => ({ start: e.target.value, end: prev?.end || todayStr }))}
                  className="px-2 py-1 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-[11px] text-ink-dark focus:outline-none focus:border-accent-warm"
                />
                <span className="text-[10px] text-ink-light">to</span>
                <input
                  type="date"
                  value={dateRange?.end || ""}
                  onChange={(e) => setDateRange((prev) => ({ start: prev?.start || todayStr, end: e.target.value }))}
                  className="px-2 py-1 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-[11px] text-ink-dark focus:outline-none focus:border-accent-warm"
                />
              </>
            )}
            <button
              onClick={() => {
                setQuickFilter("Custom");
                if (!dateRange) setDateRange({ start: format(subDays(today, 30), "yyyy-MM-dd"), end: todayStr });
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                quickFilter === "Custom"
                  ? "bg-accent-warm text-white"
                  : "bg-paper-bg text-ink-medium hover:text-ink-dark border border-[rgba(0,0,0,0.06)]"
              }`}
            >
              Custom
            </button>
            {dateRange && (
              <button
                onClick={() => { setDateRange(null); setQuickFilter("All"); }}
                className="p-1 rounded hover:bg-paper-dark text-ink-light hover:text-accent-red cursor-pointer"
                aria-label="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Expenses List */}
        {Object.keys(grouped).length === 0 ? (
          <div className="paper-card p-12 text-center">
            <span className="text-4xl block mb-2 font-handwritten">📓</span>
            <p className="font-handwritten text-2xl text-ink-light">No entries found</p>
            <p className="text-xs text-ink-light mt-1">Change your search terms or log a new entry!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-3 mb-2 px-1">
                  <h3 className="font-handwritten text-xl text-ink-dark font-semibold">
                    {format(new Date(date + "T00:00:00"), "EEEE, MMMM d")}
                  </h3>
                  <span className="dots" />
                  <span className="font-handwritten text-xl text-accent-warm amount font-bold">{formatCurrency(dayTotal)}</span>
                </div>
                
                <div className="space-y-2">
                  {dayExpenses.map((expense) => {
                    const catColor = getCategoryByName(expense.category)?.color || "#6B7280";
                    return (
                      <div
                        key={expense.id}
                        className="paper-card px-4 py-3 flex items-center gap-3 group hover:shadow-md transition-all border-l-4"
                        style={{ borderLeftColor: catColor }}
                      >
                        <span className="text-xl shrink-0">{getCategoryByName(expense.category)?.icon || "🏷️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink-dark font-semibold truncate">{expense.name}</p>
                          <p className="text-[10px] text-ink-light mt-0.5">
                            {expense.category} · {expense.payment_method}
                          </p>
                        </div>
                        <span className="text-sm font-bold amount shrink-0 ml-2" style={{ color: catColor }}>
                          {formatCurrency(expense.amount)}
                        </span>
                        
                        {/* Edit and Delete buttons (always semi-opaque on touch devices, hover opaque on hover) */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-2">
                          <button
                            onClick={() => requireAuth(() => setEditingExpense(expense))}
                            className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            aria-label="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-accent-red transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            aria-label="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
      <EditExpenseModal open={!!editingExpense} onClose={() => setEditingExpense(null)} expense={editingExpense} />
      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleting(false); }}
        onConfirm={async () => {
          if (deleteId) {
            setDeleting(true);
            try {
              await deleteExpense(deleteId);
              toast("Expense deleted");
            } catch (err) {
              console.error(err);
              toast("Failed to delete expense", "error");
            }
            setDeleteId(null);
            setDeleting(false);
          }
        }}
        loading={deleting}
        title="Delete expense?"
        message="This will permanently remove this expense record."
      />
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
