"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Trash2, Download, Upload, DollarSign, Edit2, X, Check, Eye, EyeOff, ShieldCheck, Link2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useCountry } from "@/components/CountryProvider";
import FlagIcon from "@/components/FlagIcon";
import { COUNTRIES } from "@/lib/countries";
import { useExpenses, useRecurringPayments, useBudgets, useNotes } from "@/lib/store";
import { formatCurrency, getCurrentMonth, getCurrencySymbol } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import { useToast } from "@/components/Toast";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SettingsPage() {
  return <AuthGuard feature="Budget & Settings"><SettingsContent /></AuthGuard>;
}

function SettingsContent() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { country, setCountry } = useCountry();
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const identities = user?.identities || [];
  const hasGoogle = identities.some((id) => id.provider === "google");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();
    if (!supabase) {
      toast("Supabase client failed to load", "error");
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast("Password saved successfully!");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Failed to update password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    if (!supabase) {
      toast("Supabase client failed to load", "error");
      setGoogleLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Failed to link Google account", "error");
      setGoogleLoading(false);
    }
  };
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
  const { toast } = useToast();
  const budgetRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showCountryDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
        setCountrySearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCountryDropdown]);

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
      toast("Budget saved");
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
        toast("Budget updated");
      }
    }
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
    toast("Budget deleted");
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
    toast("Data exported");
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
        toast("Data imported");
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
      toast("All data cleared");
    } catch (err) {
      console.error("Failed to clear data:", err);
      toast("Failed to clear data", "error");
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

        {/* Country & Currency */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Country & Currency</h3>
          <p className="text-xs text-ink-light mb-3">Select your country to set the currency symbol</p>
          <div ref={countryRef} className="relative">
            <button
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark hover:border-accent-warm transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <FlagIcon code={country.code} size={22} />
                <span>{country.name} ({country.currency})</span>
              </span>
              <span className="text-ink-light text-xs">{showCountryDropdown ? "▲" : "▼"}</span>
            </button>
            {showCountryDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded-lg shadow-lg max-h-64 overflow-hidden">
                <div className="p-2 border-b border-[rgba(0,0,0,0.06)]">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full px-3 py-2 bg-paper-dark/50 border border-[rgba(0,0,0,0.06)] rounded text-sm text-ink-dark placeholder:text-ink-light/50 focus:outline-none focus:border-accent-warm"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-52">
                  {COUNTRIES.filter((c) =>
                    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                    c.currency.toLowerCase().includes(countrySearch.toLowerCase())
                  ).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.code); setShowCountryDropdown(false); setCountrySearch(""); toast(`${c.name} — ${c.symbol} ${c.currency}`); }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-paper-dark/50 transition-colors ${c.code === country.code ? "text-accent-warm font-medium" : "text-ink-dark"}`}
                    >
                      <FlagIcon code={c.code} size={22} />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-ink-light">{c.currency}</span>
                    </button>
                  ))}
                  {COUNTRIES.filter((c) =>
                    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                    c.currency.toLowerCase().includes(countrySearch.toLowerCase())
                  ).length === 0 && (
                    <p className="px-4 py-3 text-sm text-ink-light text-center">No countries found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account & Security */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4 flex items-center gap-2">
            <ShieldCheck size={18} /> Account &amp; Security
          </h3>
          
          <div className="mb-6 p-4 bg-paper-dark/50 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-ink-light">Email Address</span>
              <span className="text-ink-dark font-semibold">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium border-t border-[rgba(0,0,0,0.06)] pt-2.5">
              <span className="text-ink-light">Google Sync</span>
              {hasGoogle ? (
                <span className="px-2.5 py-0.5 bg-accent-green/10 text-accent-green text-[10px] font-bold rounded-full border border-accent-green/20 flex items-center gap-1">
                  ✓ Connected
                </span>
              ) : (
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={handleLinkGoogle}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-[rgba(0,0,0,0.12)] hover:bg-gray-50 rounded text-neutral-800 text-[10px] font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Link2 size={11} /> Link Google Account
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-xs text-ink-light font-bold uppercase tracking-wide">Set / Update Password</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-ink-light uppercase tracking-wide mb-1 font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-xs text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-medium focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-ink-light uppercase tracking-wide mb-1 font-semibold">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-xs text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-accent-warm text-white rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer font-sans"
            >
              {passwordLoading ? "Saving..." : "Save Password"}
            </button>
          </form>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light text-sm">{getCurrencySymbol()}</span>
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
                        <span className="text-ink-light text-sm shrink-0">{getCurrencySymbol()}</span>
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

