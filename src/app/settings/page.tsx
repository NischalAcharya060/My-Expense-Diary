"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Trash2, Download, Upload, DollarSign, Edit2, X, Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useExpenses, useRecurringPayments, useBudgets, useNotes } from "@/lib/store";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import { format } from "date-fns";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SettingsPage() {
  return <AuthGuard feature="Budget & Settings"><SettingsContent /></AuthGuard>;
}

function SettingsContent() {
  const { theme, toggleTheme } = useTheme();
  const { expenses, loaded: expensesLoaded, addExpense, deleteExpense } = useExpenses();
  const { payments, addPayment, deletePayment } = useRecurringPayments();
  const { budgets, setBudget, getBudget, deleteBudget, fetchBudgets } = useBudgets(true);
  const { notes, addNote, deleteNote } = useNotes();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetYear, setBudgetYear] = useState("");
  const [budgetMonth, setBudgetMonth] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const budgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = budgetRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchBudgets();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchBudgets]);

  const { year, month } = getCurrentMonth();

  useEffect(() => {
    setBudgetYear(year.toString());
    setBudgetMonth(month.toString());
  }, [year, month]);

  if (!mounted) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-64 bg-paper-dark rounded mt-4" />
        </div>
      </div>
    );
  }

  const handleSaveBudget = async () => {
    const amt = parseFloat(budgetAmount);
    const yr = parseInt(budgetYear);
    const mo = parseInt(budgetMonth);
    if (!isNaN(amt) && amt > 0 && !isNaN(yr) && !isNaN(mo) && mo >= 1 && mo <= 12) {
      await setBudget(yr, mo, amt);
      setBudgetAmount("");
    }
  };

  const handleUpdateBudget = async (id: string) => {
    const amt = parseFloat(editAmount);
    if (!isNaN(amt) && amt > 0) {
      const b = budgets.find((b) => b.id === id);
      if (b) {
        await setBudget(b.year, b.month, amt, b.category);
        setEditingId(null);
        setEditAmount("");
      }
    }
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
  };

  const sortedBudgets = [...budgets].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );

  const handleExportData = async () => {
    const data = {
      expenses,
      recurring: payments,
      budgets,
      notes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-diary-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.expenses) {
          for (const exp of data.expenses) {
            const { id, created_at, updated_at, ...rest } = exp;
            await addExpense(rest);
          }
        }
        if (data.recurring) {
          for (const rec of data.recurring) {
            const { id, created_at, updated_at, ...rest } = rec;
            await addPayment(rest);
          }
        }
        if (data.budgets) {
          for (const b of data.budgets) {
            await setBudget(b.year, b.month, b.amount, b.category);
          }
        }
        if (data.notes) {
          for (const n of data.notes) {
            const { id, created_at, updated_at, ...rest } = n;
            await addNote(rest);
          }
        }
      } catch {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    try {
      for (const exp of expenses) await deleteExpense(exp.id);
      for (const p of payments) await deletePayment(p.id);
      for (const b of budgets) await deleteBudget(b.id);
      for (const n of notes) await deleteNote(n.id);
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark mb-6">Settings</h1>

        {/* Theme */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-dark">Theme</p>
              <p className="text-xs text-ink-light">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-paper-dark rounded text-sm text-ink-dark hover:bg-paper-bg transition-colors border border-[rgba(0,0,0,0.06)]"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        </div>

        {/* Monthly Budget */}
        <div ref={budgetRef} className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4 flex items-center gap-2">
            <DollarSign size={18} /> Monthly Budget
          </h3>

          {/* Add new budget form */}
          <div className="p-4 bg-paper-dark/50 rounded-lg mb-4">
            <p className="text-xs text-ink-light mb-3 uppercase tracking-wide">Add New Budget</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={budgetMonth}
                onChange={(e) => setBudgetMonth(e.target.value)}
                className="px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
              <input
                type="number"
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
                placeholder="Year"
                className="w-24 px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm amount"
              />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light text-sm">Rs.</span>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  className="w-full pl-10 pr-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm amount"
                />
              </div>
              <button
                onClick={() => requireAuth(handleSaveBudget)}
                className="px-5 py-2.5 bg-accent-warm text-white rounded text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
              >
                Save
              </button>
            </div>
          </div>

          {/* Existing budgets list */}
          {sortedBudgets.length === 0 ? (
            <p className="text-sm text-ink-light text-center py-4">No budgets set yet</p>
          ) : (
            <div className="space-y-2">
              {sortedBudgets.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 py-3 px-4 bg-paper-bg rounded border border-[rgba(0,0,0,0.04)]"
                >
                  <div className="flex-1 min-w-0">
                    {editingId === b.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink-medium shrink-0">
                          {MONTH_NAMES[b.month - 1]} {b.year}:
                        </span>
                        <span className="text-ink-light text-sm shrink-0">Rs.</span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="flex-1 px-2 py-1 bg-paper-bg border border-accent-warm rounded text-sm text-ink-dark focus:outline-none amount"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-ink-dark font-medium">
                          {MONTH_NAMES[b.month - 1]} {b.year}
                        </p>
                        <p className="font-handwritten text-lg text-accent-warm amount">
                          {formatCurrency(b.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === b.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateBudget(b.id)}
                          className="p-1.5 text-accent-green hover:bg-accent-green/10 rounded transition-colors"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditAmount(""); }}
                          className="p-1.5 text-ink-light hover:bg-paper-dark rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(b.id); setEditAmount(b.amount.toString()); }}
                          className="p-1.5 text-ink-light hover:text-ink-dark hover:bg-paper-dark rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1.5 text-ink-light hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Stats */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Data Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-paper-dark rounded">
              <p className="text-2xl font-handwritten text-ink-dark">{expenses.length}</p>
              <p className="text-xs text-ink-light">Expenses</p>
            </div>
            <div className="text-center p-3 bg-paper-dark rounded">
              <p className="text-2xl font-handwritten text-ink-dark">{payments.length}</p>
              <p className="text-xs text-ink-light">Recurring</p>
            </div>
            <div className="text-center p-3 bg-paper-dark rounded">
              <p className="text-2xl font-handwritten text-ink-dark">{budgets.length}</p>
              <p className="text-xs text-ink-light">Budgets</p>
            </div>
            <div className="text-center p-3 bg-paper-dark rounded">
              <p className="text-2xl font-handwritten text-ink-dark">{notes.length}</p>
              <p className="text-xs text-ink-light">Notes</p>
            </div>
          </div>
        </div>

        {/* Import/Export */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Backup & Restore</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-paper-dark rounded text-sm text-ink-dark hover:bg-accent-warm hover:text-white transition-colors border border-[rgba(0,0,0,0.06)]"
            >
              <Download size={16} /> Export Data
            </button>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-paper-dark rounded text-sm text-ink-dark hover:bg-accent-blue hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] cursor-pointer">
              <Upload size={16} /> Import Data
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Danger zone */}
        <div className="paper-card p-6 border-l-2 border-accent-red">
          <h3 className="font-handwritten text-xl text-accent-red mb-2">Danger Zone</h3>
          <p className="text-xs text-ink-light mb-4">This action cannot be undone. All your data will be permanently deleted.</p>
          {showClearConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-accent-red font-medium">Are you sure?</span>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-accent-red text-white rounded text-xs font-medium hover:opacity-90"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 border border-[rgba(0,0,0,0.1)] rounded text-xs text-ink-medium hover:bg-paper-dark"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-accent-red text-accent-red rounded text-sm hover:bg-accent-red hover:text-white transition-colors"
            >
              <Trash2 size={16} /> Clear All Data
            </button>
          )}
        </div>
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="budget management" />
    </div>
  );
}

