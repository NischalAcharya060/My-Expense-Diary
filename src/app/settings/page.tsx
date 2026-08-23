"use client";

import { useSyncExternalStore, useState, useEffect, useRef } from "react";
import { Moon, Sun, Trash2, Download, Upload, DollarSign, Edit2, X, Check, FileSpreadsheet, FileText, Info, RefreshCw, Palette, Globe, Database, AlertTriangle } from "lucide-react";
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
import CollapsibleSection from "@/components/CollapsibleSection";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import type { Expense, RecurringPayment, Note } from "@/types";

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

type ImportableExpense = Omit<Expense, "id" | "user_id" | "created_at" | "updated_at">;
type ImportablePayment = Omit<RecurringPayment, "id" | "user_id" | "created_at" | "updated_at">;
type ImportableNote = Omit<Note, "id" | "user_id" | "created_at" | "updated_at">;

// Backup rows carry DB metadata fields that must be stripped before
// re-inserting; they are declared so destructuring stays type-safe.
type WithMeta = {
  id?: unknown;
  user_id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

interface BackupData {
  expenses?: (ImportableExpense & WithMeta)[];
  recurring?: (ImportablePayment & WithMeta)[];
  budgets?: { year: number; month: number; amount: number; category?: string | null }[];
  notes?: (ImportableNote & WithMeta)[];
}

/** Loose structural check so garbage files never open the preview. */
function parseBackup(raw: string): BackupData | null {
  try {
    const data = JSON.parse(raw) as BackupData;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const keys = ["expenses", "recurring", "budgets", "notes"] as const;
    const hasAny = keys.some((k) => Array.isArray(data[k]));
    if (!hasAny) return null;
    for (const k of keys) {
      if (data[k] !== undefined && !Array.isArray(data[k])) return null;
    }
    return data;
  } catch {
    return null;
  }
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
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [deletingData, setDeletingData] = useState(false);
  // Parsed JSON waiting for user confirmation in the import preview.
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importing, setImporting] = useState(false);
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
    const WARM_RGB: [number, number, number] = [212, 133, 74];
    const GRAY_RGB: [number, number, number] = [120, 120, 120];

    doc.setFontSize(18);
    doc.text("My Expense Diary — Expense Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_RGB);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, 14, 30);
    doc.text(`Total entries: ${expenses.length}`, 14, 36);
    doc.text(`Total amount: ${formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}`, 14, 42);

    let tableStartY = 50;

    if (expenses.length > 0) {
      // --- Chart 1: monthly spending bars (last 6 months) ---
      const months: { label: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.push({
          label: d.toLocaleDateString("en", { month: "short" }),
          total: expenses
            .filter((e) => e.date.startsWith(prefix))
            .reduce((s, e) => s + e.amount, 0),
        });
      }
      const maxMonth = Math.max(...months.map((m) => m.total), 1);

      doc.setTextColor(40);
      doc.setFontSize(11);
      doc.text("Monthly Spending — Last 6 Months", 14, 56);

      const chartBaseY = 100;
      const plotLeft = 16;
      const plotWidth = 178;
      const gap = 10;
      const barW = (plotWidth - gap * (months.length - 1)) / months.length;
      const maxBarH = 32;

      doc.setFontSize(7);
      months.forEach((m, i) => {
        const barH = m.total > 0 ? Math.max((m.total / maxMonth) * maxBarH, 2) : 0;
        const x = plotLeft + i * (barW + gap);
        // Value above the bar
        doc.setTextColor(60);
        if (m.total > 0) {
          doc.text(formatCurrency(m.total), x + barW / 2, chartBaseY - barH - 3, { align: "center" });
        }
        // Bar
        doc.setFillColor(...WARM_RGB);
        if (barH > 0) doc.rect(x, chartBaseY - barH, barW, barH, "F");
        else {
          doc.setDrawColor(200);
          doc.line(x, chartBaseY - 1, x + barW, chartBaseY - 1);
        }
        // Month label below baseline
        doc.setTextColor(...GRAY_RGB);
        doc.text(m.label, x + barW / 2, chartBaseY + 6, { align: "center" });
      });

      // Baseline
      doc.setDrawColor(150);
      doc.line(plotLeft, chartBaseY, plotLeft + plotWidth, chartBaseY);

      // --- Chart 2: category breakdown horizontal bars ---
      const catTotals = new Map<string, number>();
      for (const e of expenses) {
        catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
      }
      const grandTotal = [...catTotals.values()].reduce((s, v) => s + v, 0);
      const topCats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

      doc.setFontSize(11);
      doc.setTextColor(40);
      const catTitleY = chartBaseY + 20;
      doc.text("Spending by Category", 14, catTitleY);

      doc.setFontSize(7);
      const barRowH = 9;
      const nameX = 14;
      const barX = 70;
      const barMaxW = 80;
      topCats.forEach(([name, total], i) => {
        const y = catTitleY + 6 + i * barRowH;
        doc.setTextColor(60);
        doc.text(name.length > 22 ? name.slice(0, 21) + "…" : name, nameX, y + 3);
        const w = Math.max((total / grandTotal) * barMaxW, 1);
        doc.setFillColor(...WARM_RGB);
        doc.rect(barX, y, w, 4, "F");
        const pct = Math.round((total / grandTotal) * 100);
        doc.setTextColor(...GRAY_RGB);
        const label = `${formatCurrency(total)} · ${pct}%`;
        doc.text(label, barX + w + 2, y + 3);
      });

      tableStartY = catTitleY + 10 + topCats.length * barRowH + 8;
    }

    autoTable(doc, {
      startY: tableStartY,
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
    toast("PDF exported with charts");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = parseBackup(event.target?.result as string);
      if (!data) {
        toast("Invalid backup file", "error");
        return;
      }
      setImportFileName(file.name);
      setPendingImport(data);
    };
    reader.readAsText(file);
  };

  const applyImport = async (data: BackupData) => {
    setImporting(true);
    try {
      if (data.expenses) {
        for (const exp of data.expenses) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, user_id, created_at, updated_at, ...rest } = exp;
          await addExpense(rest);
        }
      }
      if (data.recurring) {
        for (const rec of data.recurring) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, user_id, created_at, updated_at, ...rest } = rec;
          await addPayment(rest);
        }
      }
      if (data.budgets) {
        for (const b of data.budgets) {
          await setBudget(b.year, b.month, b.amount, b.category ?? undefined);
        }
      }
      if (data.notes) {
        for (const n of data.notes) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, user_id, created_at, updated_at, ...rest } = n;
          await addNote(rest);
        }
      }
      toast("Data imported");
      setPendingImport(null);
    } catch {
      toast("Failed to import data", "error");
    } finally {
      setImporting(false);
    }
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
      setClearConfirmText("");
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

  const totalRecords = expenses.length + payments.length + budgets.length + notes.length;
  const currentMonthBudget = budgets.find((b) => b.year === year && b.month === month && !b.category);
  const budgetSubtitle = currentMonthBudget
    ? `${budgets.length} saved · this month ${formatCurrency(currentMonthBudget.amount)}`
    : budgets.length > 0
      ? `${budgets.length} saved · none for this month`
      : "No budgets yet";

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
        <div className="flex items-center gap-1 mb-6">
          <BackButton />
          <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark">Settings</h1>
        </div>

        {/* Theme */}
        <CollapsibleSection
          title="Appearance"
          icon={<Palette size={18} />}
          subtitle={theme === "light" ? "Light mode active" : "Dark mode active"}
        >
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
        </CollapsibleSection>

        {/* Country & Currency */}
        <CollapsibleSection
          title="Country & Currency"
          icon={<Globe size={18} />}
          subtitle={`${country.name} · ${getCurrencySymbol()} ${country.currency}`}
          className="relative z-10"
        >
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
        </CollapsibleSection>

        {/* Monthly Budget */}
        <div ref={budgetRef}>
          <CollapsibleSection
            title="Monthly Budget"
            icon={<DollarSign size={18} />}
            subtitle={budgetSubtitle}
          >

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
          </CollapsibleSection>
        </div>

        {/* Data Stats */}
        <CollapsibleSection
          title="Data Overview"
          icon={<Database size={18} />}
          subtitle={`${totalRecords} record${totalRecords === 1 ? "" : "s"} stored`}
        >
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
        </CollapsibleSection>

        {/* Import/Export */}
        <CollapsibleSection
          title="Export Data"
          icon={<Download size={18} />}
          subtitle="JSON · CSV · Excel · PDF"
        >
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
                    <p className="text-[10px] text-ink-medium leading-relaxed">Printable report with header, summary stats, spending charts (monthly bars + category breakdown), and formatted table.</p>
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
            <p className="text-[10px] text-ink-light mb-2">Import from JSON backup (with preview):</p>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-paper-dark rounded text-sm text-ink-dark hover:bg-accent-blue hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] cursor-pointer w-fit">
              <Upload size={16} /> Import JSON
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </CollapsibleSection>

        {/* Performance / Cache */}
        <CollapsibleSection
          title="Performance"
          icon={<RefreshCw size={18} />}
          subtitle={cacheSize === null ? "Local cache" : `Using ${formatBytes(cacheSize)} of local cache`}
        >
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
        </CollapsibleSection>

        {/* Danger zone — collapsed by default, requires typing DELETE ALL */}
        <CollapsibleSection
          title="Danger Zone"
          icon={<AlertTriangle size={18} />}
          subtitle={`${totalRecords} record${totalRecords === 1 ? "" : "s"} will be permanently deleted`}
          danger
        >
          <p className="text-xs text-ink-light mb-4">
            Permanently delete all expenses, recurring payments, budgets, and notes from your account. This action cannot be undone.
          </p>
          <button
            onClick={() => { setShowClearDataConfirm(true); setClearConfirmText(""); }}
            disabled={deletingData}
            className="flex items-center gap-2 px-4 py-2 border border-accent-red text-accent-red rounded text-sm font-medium hover:bg-accent-red hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 size={16} /> Clear All Data
          </button>
        </CollapsibleSection>
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

      {/* Clear-all-data dialog with typed confirmation */}
      {showClearDataConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Delete all data confirmation">
          <div className="absolute inset-0 bg-black/40 fade-in" onClick={() => !deletingData && setShowClearDataConfirm(false)} />
          <div className="relative paper-card p-6 max-w-sm w-full page-enter will-change-transform">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-accent-red/10 rounded-full flex items-center justify-center">
                <AlertTriangle size={22} className="text-accent-red" />
              </div>
              <h3 className="font-handwritten text-xl text-ink-dark mb-1">Delete ALL data?</h3>
              <p className="text-sm text-ink-medium mb-4">
                All {totalRecords} records (expenses, recurring payments, budgets, notes) will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <label htmlFor="delete-all-confirm-input" className="block text-[10px] font-bold uppercase tracking-wide text-ink-light mb-1.5">
              Type DELETE ALL to confirm
            </label>
            <input
              id="delete-all-confirm-input"
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && clearConfirmText.trim() === "DELETE ALL") handleClearAll();
              }}
              placeholder="DELETE ALL"
              autoComplete="off"
              spellCheck={false}
              disabled={deletingData}
              className={`w-full px-3 py-2 bg-paper-bg border rounded text-sm text-ink-dark focus:outline-none mb-4 transition-colors ${
                clearConfirmText.trim() === "DELETE ALL" ? "border-accent-green" : "border-accent-red/50 focus:border-accent-red"
              }`}
            />
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearDataConfirm(false)}
                disabled={deletingData}
                className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded text-xs font-medium text-ink-medium hover:bg-paper-dark transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={deletingData || clearConfirmText.trim() !== "DELETE ALL"}
                className="px-4 py-2 bg-accent-red text-white rounded text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingData ? "Deleting..." : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import preview modal — shows what will be imported before applying */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import preview">
          <div className="absolute inset-0 bg-black/40 fade-in" onClick={() => !importing && setPendingImport(null)} />
          <div className="relative paper-card p-6 max-w-sm w-full page-enter will-change-transform max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPendingImport(null)}
              disabled={importing}
              className="absolute top-3 right-3 p-1 text-ink-light hover:text-ink-dark cursor-pointer disabled:opacity-50"
              aria-label="Close import preview"
            >
              <X size={16} />
            </button>
            <h3 className="font-handwritten text-xl text-ink-dark mb-1">Preview Import</h3>
            <p className="text-[10px] text-ink-light mb-4 truncate">{importFileName}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 bg-paper-dark/60 rounded text-center">
                <p className="text-xl font-handwritten text-ink-dark">{pendingImport.expenses?.length ?? 0}</p>
                <p className="text-[10px] text-ink-light uppercase tracking-wide">Expenses</p>
              </div>
              <div className="p-3 bg-paper-dark/60 rounded text-center">
                <p className="text-xl font-handwritten text-ink-dark">{pendingImport.recurring?.length ?? 0}</p>
                <p className="text-[10px] text-ink-light uppercase tracking-wide">Recurring</p>
              </div>
              <div className="p-3 bg-paper-dark/60 rounded text-center">
                <p className="text-xl font-handwritten text-ink-dark">{pendingImport.budgets?.length ?? 0}</p>
                <p className="text-[10px] text-ink-light uppercase tracking-wide">Budgets</p>
              </div>
              <div className="p-3 bg-paper-dark/60 rounded text-center">
                <p className="text-xl font-handwritten text-ink-dark">{pendingImport.notes?.length ?? 0}</p>
                <p className="text-[10px] text-ink-light uppercase tracking-wide">Notes</p>
              </div>
            </div>

            {/* Sample of what's inside the backup */}
            {pendingImport.expenses && pendingImport.expenses.length > 0 && (
              <div className="mb-4 p-3 bg-paper-dark/40 rounded-lg">
                <p className="text-[10px] font-semibold text-ink-dark uppercase tracking-wider mb-2">First entries</p>
                <ul className="space-y-1">
                  {(pendingImport.expenses as Array<{ name?: unknown; amount?: unknown; date?: unknown }>)
                    .slice(0, 3)
                    .map((exp, i) => (
                      <li key={i} className="text-[11px] text-ink-medium flex justify-between gap-2">
                        <span className="truncate">{String(exp.name ?? "Unnamed")}</span>
                        <span className="shrink-0 text-ink-light">{String(exp.date ?? "")}</span>
                      </li>
                    ))}
                </ul>
                {pendingImport.expenses.length > 3 && (
                  <p className="text-[10px] text-ink-light mt-1.5 italic">
                    + {pendingImport.expenses.length - 3} more…
                  </p>
                )}
              </div>
            )}

            <p className="text-[11px] text-ink-medium bg-accent-blue/5 border border-accent-blue/20 rounded px-3 py-2 mb-4 leading-relaxed">
              These entries will be <strong>added</strong> to your account. Existing data is not removed or overwritten.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingImport(null)}
                disabled={importing}
                className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded text-xs font-medium text-ink-medium hover:bg-paper-dark transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => applyImport(pendingImport)}
                disabled={importing || totalItemsIn(pendingImport) === 0}
                className="px-4 py-2 bg-accent-warm text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Upload size={13} />
                {importing ? "Importing..." : `Import ${totalItemsIn(pendingImport)} item${totalItemsIn(pendingImport) === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function totalItemsIn(data: BackupData): number {
  return (
    (data.expenses?.length ?? 0) +
    (data.recurring?.length ?? 0) +
    (data.budgets?.length ?? 0) +
    (data.notes?.length ?? 0)
  );
}

