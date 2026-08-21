"use client";

import { useSyncExternalStore, useState, useEffect, useRef } from "react";
import { Moon, Sun, Trash2, Download, Upload, DollarSign, Edit2, X, Check, FileSpreadsheet, FileText, Info, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "@/components/ThemeProvider";
import { useCountry } from "@/components/CountryProvider";
import FlagIcon from "@/components/FlagIcon";
import { COUNTRIES } from "@/lib/countries";
import { useExpenses, useRecurringPayments, useBudgets, useNotes, useClearCache } from "@/lib/store";
import { formatCurrency, getCurrentMonth, getCurrencySymbol } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCacheBytes(): number {
  if (typeof window === "undefined") return 0;
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("cache_")) {
      bytes += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
  }
  return bytes;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SettingsPage() {
  return <AuthGuard feature="Budget & Settings"><SettingsContent /></AuthGuard>;
}

function SettingsContent() {
  const { theme, toggleTheme } = useTheme();
  const { country, setCountry } = useCountry();
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const { expenses, addExpense, deleteExpense } = useExpenses();
  const { payments, addPayment, deletePayment } = useRecurringPayments();
  const { budgets, setBudget, deleteBudget, fetchBudgets } = useBudgets();
  const { notes, addNote, deleteNote } = useNotes();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetYear, setBudgetYear] = useState("");
  const [budgetMonth, setBudgetMonth] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [showCacheConfirm, setShowCacheConfirm] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const clearCache = useClearCache();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();
  const budgetRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBudgetYear(year.toString());
    setBudgetMonth(month.toString());
    setCacheSize(getCacheBytes());
  }, [year, month]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const handleExportCSV = () => {
    const headers = ["Date", "Name", "Amount", "Category", "Payment Method", "Expense Type", "Note"];
    const rows = expenses.map((e) => [
      e.date,
      `"${e.name.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.category,
      e.payment_method,
      e.expense_type,
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-diary-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  };

  const handleExportExcel = () => {
    const data = expenses.map((e) => ({
      Date: e.date,
      Name: e.name,
      Amount: e.amount,
      Category: e.category,
      "Payment Method": e.payment_method,
      "Expense Type": e.expense_type,
      Note: e.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expense-diary-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast("Excel exported");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("My Expense Diary — Expense Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, 14, 30);
    doc.text(`Total entries: ${expenses.length}`, 14, 36);
    doc.text(`Total amount: ${formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [["Date", "Name", "Amount", "Category", "Payment", "Type", "Note"]],
      body: expenses.map((e) => [
        e.date,
        e.name,
        formatCurrency(e.amount),
        e.category,
        e.payment_method,
        e.expense_type,
        e.note || "",
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [212, 133, 74] },
      alternateRowStyles: { fillColor: [245, 240, 235] },
    });

    doc.save(`expense-diary-${new Date().toISOString().split("T")[0]}.pdf`);
    toast("PDF exported");
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, created_at, updated_at, ...rest } = exp;
            await addExpense(rest);
          }
        }
        if (data.recurring) {
          for (const rec of data.recurring) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, created_at, updated_at, ...rest } = n;
            await addNote(rest);
          }
        }
        toast("Data imported");
      } catch {
        toast("Invalid backup file", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    setDeletingData(true);
    try {
      for (const exp of expenses) await deleteExpense(exp.id);
      for (const p of payments) await deletePayment(p.id);
      for (const b of budgets) await deleteBudget(b.id);
      for (const n of notes) await deleteNote(n.id);
      toast("All data cleared");
      setShowClearDataConfirm(false);
    } catch (err) {
      console.error("Failed to clear data:", err);
      toast("Failed to clear data", "error");
    }
    setDeletingData(false);
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearCache();
      toast("Cache cleared — fresh data loaded");
      setCacheSize(getCacheBytes());
    } catch (err) {
      console.error("Failed to clear cache:", err);
      toast("Failed to clear cache", "error");
    }
    setClearingCache(false);
    setShowCacheConfirm(false);
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
                          aria-label="Save budget"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditAmount(""); }}
                          className="p-1.5 text-ink-light hover:bg-paper-dark rounded transition-colors"
                          aria-label="Cancel editing"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(b.id); setEditAmount(b.amount.toString()); }}
                          className="p-1.5 text-ink-light hover:text-ink-dark hover:bg-paper-dark rounded transition-colors"
                          aria-label="Edit budget"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1.5 text-ink-light hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                          aria-label="Delete budget"
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
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Export Data</h3>
          <p className="text-xs text-ink-light mb-4">Download your expense data in different formats. All exports include all your expenses.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={handleExportData}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-paper-dark rounded-lg text-ink-dark hover:bg-accent-warm hover:text-white transition-colors border border-[rgba(0,0,0,0.06)]"
            >
              <Download size={18} />
              <span className="text-xs font-medium">JSON</span>
              <span className="text-[9px] opacity-60">Full backup</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-paper-dark rounded-lg text-ink-dark hover:bg-accent-green hover:text-white transition-colors border border-[rgba(0,0,0,0.06)]"
            >
              <FileSpreadsheet size={18} />
              <span className="text-xs font-medium">CSV</span>
              <span className="text-[9px] opacity-60">Spreadsheet</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-paper-dark rounded-lg text-ink-dark hover:bg-[#1A73E8] hover:text-white transition-colors border border-[rgba(0,0,0,0.06)]"
            >
              <FileSpreadsheet size={18} />
              <span className="text-xs font-medium">Excel</span>
              <span className="text-[9px] opacity-60">.xlsx format</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex flex-col items-center gap-1.5 px-3 py-3 bg-paper-dark rounded-lg text-ink-dark hover:bg-[#E84040] hover:text-white transition-colors border border-[rgba(0,0,0,0.06)]"
            >
              <FileText size={18} />
              <span className="text-xs font-medium">PDF</span>
              <span className="text-[9px] opacity-60">Printable report</span>
            </button>
          </div>

          {/* Format details */}
          <div className="mt-5 p-4 bg-paper-dark/50 rounded-lg border border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Info size={14} className="text-ink-light" />
              <h4 className="text-xs font-semibold text-ink-dark">Export & Import Details</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-ink-dark uppercase tracking-wider mb-2">Export Formats</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-accent-warm mt-0.5 shrink-0">JSON</span>
                    <p className="text-[10px] text-ink-medium leading-relaxed">Full backup with expenses, recurring payments, budgets, and notes. Can be re-imported to restore data.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-accent-green mt-0.5 shrink-0">CSV</span>
                    <p className="text-[10px] text-ink-medium leading-relaxed">Plain text spreadsheet. Columns: Date, Name, Amount, Category, Payment Method, Expense Type, Note. Opens in any spreadsheet app.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-[#1A73E8] mt-0.5 shrink-0">Excel</span>
                    <p className="text-[10px] text-ink-medium leading-relaxed">Native .xlsx format with auto-sized columns. Same columns as CSV. Opens in Microsoft Excel, Google Sheets, or LibreOffice.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-[#E84040] mt-0.5 shrink-0">PDF</span>
                    <p className="text-[10px] text-ink-medium leading-relaxed">Printable report with header, summary stats, and formatted table. Ideal for sharing or archiving.</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-ink-dark uppercase tracking-wider mb-2">Import Format</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-accent-blue mt-0.5 shrink-0">JSON</span>
                    <p className="text-[10px] text-ink-medium leading-relaxed">Only JSON exports from this app can be imported. The file should contain objects with keys: <code className="bg-paper-dark px-1 rounded">expenses</code>, <code className="bg-paper-dark px-1 rounded">recurring</code>, <code className="bg-paper-dark px-1 rounded">budgets</code>, <code className="bg-paper-dark px-1 rounded">notes</code>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-accent-red mt-0.5 shrink-0">Note</span>
                    <p className="text-[10px] text-ink-medium leading-relaxed">CSV and Excel files are export-only and cannot be imported. Use JSON for data restore.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Import button */}
          <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
            <p className="text-[10px] text-ink-light mb-2">Import from JSON backup:</p>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-paper-dark rounded text-sm text-ink-dark hover:bg-accent-blue hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] cursor-pointer w-fit">
              <Upload size={16} /> Import JSON
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Performance / Cache */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4 flex items-center gap-2">
            <RefreshCw size={18} /> Performance
          </h3>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-ink-dark">Clear local cache</p>
              <p className="text-xs text-ink-light mt-0.5">
                {cacheSize === null
                  ? "Removes temporarily stored data on this device and re-downloads fresh data from the server."
                  : `Using ${formatBytes(cacheSize)} of local storage. Clearing re-downloads fresh data — your saved entries are safe on the server.`}
              </p>
            </div>
            <button
              onClick={() => setShowCacheConfirm(true)}
              disabled={clearingCache}
              className="flex items-center gap-2 px-4 py-2 bg-paper-dark rounded text-sm text-ink-dark hover:bg-accent-warm hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw size={16} className={clearingCache ? "animate-spin" : ""} />
              {clearingCache ? "Clearing..." : "Clear Cache"}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="paper-card p-6 border-l-2 border-accent-red">
          <h3 className="font-handwritten text-xl text-accent-red mb-2 flex items-center gap-2">
            <Trash2 size={18} /> Danger Zone
          </h3>
          <p className="text-xs text-ink-light mb-4">
            Permanently delete all expenses, recurring payments, budgets, and notes from your account. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowClearDataConfirm(true)}
            disabled={deletingData}
            className="flex items-center gap-2 px-4 py-2 border border-accent-red text-accent-red rounded text-sm font-medium hover:bg-accent-red hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 size={16} /> Clear All Data
          </button>
        </div>
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="budget management" />
      <ConfirmDialog
        open={showCacheConfirm}
        onClose={() => setShowCacheConfirm(false)}
        onConfirm={handleClearCache}
        loading={clearingCache}
        title="Clear local cache?"
        message="This removes temporarily stored data on this device and re-downloads fresh data from the server. Your expenses, bills, and settings will not be deleted."
        confirmLabel="Clear Cache"
      />
      <ConfirmDialog
        open={showClearDataConfirm}
        onClose={() => setShowClearDataConfirm(false)}
        onConfirm={handleClearAll}
        loading={deletingData}
        title="Clear all data?"
        message="This will permanently delete all expenses, recurring payments, budgets, and notes from your account. This action cannot be undone."
        confirmLabel="Yes, Delete All"
      />
    </div>
  );
}

