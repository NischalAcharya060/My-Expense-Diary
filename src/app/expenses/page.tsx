"use client";

import { useEffect, useState, useMemo, useCallback, memo, useRef, Suspense } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Plus, Trash2, Search, Edit2, CalendarDays, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useExpenses, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

const AddExpenseModal = dynamic(() => import("@/components/AddExpenseModal"), { ssr: false });
const EditExpenseModal = dynamic(() => import("@/components/EditExpenseModal"), { ssr: false });

const PAGE_SIZE = 10;

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
  const [pagination, setPagination] = useState<{ key: string; days: number }>({ key: "", days: PAGE_SIZE });
  const searchParams = useSearchParams();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("add") === "true") requireAuth(() => setShowAdd(true));
  }, [searchParams, requireAuth]);

  const filterKey = `${search}|${filterCategory}|${dateRange?.start ?? ""}|${dateRange?.end ?? ""}`;
  const visibleDays = pagination.key === filterKey ? pagination.days : PAGE_SIZE;

  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => {
          const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
          const matchCategory = filterCategory === "All" || e.category === filterCategory;
          let matchDate = true;
          if (dateRange) {
            matchDate = e.date >= dateRange.start && e.date <= dateRange.end;
          }
          return matchSearch && matchCategory && matchDate;
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    [expenses, search, filterCategory, dateRange]
  );

  const grouped = useMemo(() => {
    const g: Record<string, Expense[]> = {};
    filtered.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [filtered]);

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleEdit = useCallback(
    (expense: Expense) => {
      requireAuth(() => setEditingExpense(expense));
    },
    [requireAuth]
  );

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

  const groupEntries = Object.entries(grouped);
  const visibleEntries = groupEntries.slice(0, visibleDays);
  const hiddenDays = groupEntries.length - visibleEntries.length;

  const clearFilters = () => {
    setSearch("");
    setFilterCategory("All");
    setDateRange(null);
    setQuickFilter("All");
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient">
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
        {groupEntries.length === 0 ? (
          expenses.length === 0 ? (
            <div className="paper-card p-12 text-center relative overflow-hidden">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200/30 border border-amber-300/20 rotate-[-2deg] rounded-sm pointer-events-none" />
              <span className="text-6xl block mb-3">📓</span>
              <p className="font-handwritten text-3xl text-ink-dark font-semibold">Your diary is empty</p>
              <p className="text-xs text-ink-light mt-2 max-w-xs mx-auto leading-relaxed">
                Start tracking your daily spending — it takes just a few seconds per entry.
              </p>
              <button
                onClick={() => requireAuth(() => setShowAdd(true))}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                <Plus size={16} /> Start Tracking
              </button>
            </div>
          ) : (
            <div className="paper-card p-12 text-center">
              <span className="text-5xl block mb-3">🔍</span>
              <p className="font-handwritten text-2xl text-ink-light">No entries found</p>
              <p className="text-xs text-ink-light mt-1">Nothing matches your current search or filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-paper-dark rounded-lg text-xs font-semibold text-ink-medium hover:text-ink-dark transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )
        ) : (
          <>
            {visibleEntries.map(([date, dayExpenses]) => {
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
                    {dayExpenses.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        color={getCategoryByName(expense.category)?.color || "#6B7280"}
                        icon={getCategoryByName(expense.category)?.icon || "🏷️"}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {hiddenDays > 0 && (
              <button
                onClick={() => setPagination({ key: filterKey, days: visibleDays + PAGE_SIZE })}
                className="w-full py-3 mb-6 bg-paper-dark/50 hover:bg-paper-dark rounded-lg text-sm font-semibold text-ink-medium hover:text-ink-dark transition-colors cursor-pointer"
              >
                Load More ({hiddenDays} more day{hiddenDays === 1 ? "" : "s"})
              </button>
            )}
          </>
        )}
      </div>

      {showAdd && <AddExpenseModal open onClose={() => setShowAdd(false)} />}
      {editingExpense && (
        <EditExpenseModal open onClose={() => setEditingExpense(null)} expense={editingExpense} />
      )}
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

interface ExpenseRowProps {
  expense: Expense;
  color: string;
  icon: string;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = -64;
const SWIPE_MAX = -96;

const ExpenseRow = memo(function ExpenseRow({ expense, color, icon, onEdit, onDelete }: ExpenseRowProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    setDx(Math.max(Math.min(0, delta), SWIPE_MAX));
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (dx < SWIPE_THRESHOLD) {
      setDx(0);
      onDelete(expense.id);
    } else {
      setDx(0);
    }
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded">
      <button
        onClick={() => onDelete(expense.id)}
        className="absolute inset-y-0 right-0 w-24 bg-accent-red text-white flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        aria-label="Delete expense"
        tabIndex={-1}
      >
        <Trash2 size={16} />
        <span className="text-[10px] font-semibold">Delete</span>
      </button>
      <div
        className="paper-card px-4 py-3 flex items-center gap-3 group hover:shadow-md transition-all border-l-4 swipe-row"
        style={{
          borderLeftColor: color,
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-dark font-semibold truncate">{expense.name}</p>
          <p className="text-[10px] text-ink-light mt-0.5">
            {expense.category} · {expense.payment_method}
          </p>
        </div>
        <span className="text-sm font-bold amount shrink-0 ml-2" style={{ color }}>
          {formatCurrency(expense.amount)}
        </span>

        {/* Edit and Delete buttons (always semi-opaque on touch devices, hover opaque on hover) */}
        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            aria-label="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-accent-red transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
});
