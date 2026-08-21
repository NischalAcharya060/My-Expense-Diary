"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Check, Camera, Upload, Loader2 } from "lucide-react";
import { useExpenses, useCategories, useBudgets } from "@/lib/store";
import {
  getToday,
  formatCurrency,
  formatDateShort,
  getQuickAddPrefs,
  saveQuickAddPrefs,
  hapticFeedback,
  PAYMENT_METHODS,
} from "@/lib/utils";
import { useToast } from "@/components/Toast";
import ExpenseForm, { type ExpenseFormData } from "@/components/ExpenseForm";
import type { PaymentMethod, ExpenseType, Expense } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

const emptyForm = (defaultDate?: string): ExpenseFormData => ({
  name: "",
  amount: "",
  category: "Other",
  date: defaultDate || getToday(),
  paymentMethod: "Cash",
  expenseType: "Daily purchase",
  note: "",
});

export default function AddExpenseModal({ open, onClose, defaultDate }: Props) {
  const { addExpense, expenses } = useExpenses();
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const [form, setForm] = useState<ExpenseFormData>(() => emptyForm(defaultDate));
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const updateForm = useCallback((patch: Partial<ExpenseFormData>) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (defaultDate) updateForm({ date: defaultDate });
  }, [defaultDate, updateForm]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pre-select the last used category and payment method for faster re-entry.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      const prefs = getQuickAddPrefs();
      setForm({
        ...emptyForm(defaultDate),
        category: prefs.category || "Other",
        paymentMethod:
          prefs.paymentMethod && PAYMENT_METHODS.includes(prefs.paymentMethod as PaymentMethod)
            ? prefs.paymentMethod
            : "Cash",
      });
      setScanning(false);
      setReceiptPreview(null);
    }
  }, [open, defaultDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the selected category valid if the category list changes while open.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setForm((f) =>
      categories.some((c) => c.name === f.category) ? f : { ...f, category: "Other" }
    );
  }, [open, categories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const recentNames = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const e of expenses) {
      const trimmed = e.name.trim();
      const key = trimmed.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      names.push(trimmed);
      if (names.length >= 6) break;
    }
    return names;
  }, [expenses]);

  const dayTotal = useMemo(
    () => expenses.filter((e) => e.date === form.date).reduce((sum, e) => sum + e.amount, 0),
    [expenses, form.date]
  );
  const entryAmount = parseFloat(form.amount);

  if (!open) return null;

  const handleReceiptScan = async (file: File) => {
    setScanning(true);
    setReceiptPreview(URL.createObjectURL(file));
    try {
      // Loaded dynamically so the OCR engine (~2MB) only ships to users
      // who actually use this feature.
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "eng");
      const text = data.text;

      // Prefer a number that sits next to a "total" keyword (Grand Total,
      // Total Amount, Receipt Total, Amount Due, etc.) since that's the
      // actual amount paid, not just any number on the receipt.
      const totalKeywordRegex = /(grand\s*total|total\s*amount|receipt\s*total|total\s*due|amount\s*due|net\s*total|total\s*payable|balance\s*due|total)\s*[:\-]?\s*[₹$€£]?\s*(\d{1,3}(?:[,.]\d{3})*(?:\.\d{2})?)/gi;
      const totalMatches = [...text.matchAll(totalKeywordRegex)];
      const totalCandidates = totalMatches
          .map((m) => parseFloat(m[2].replace(/,/g, "")))
          .filter((n) => !isNaN(n) && n > 0);

      if (totalCandidates.length > 0) {
        // If several "total" lines exist (subtotal, tax, grand total), the
        // grand/final total is usually the largest of them.
        updateForm({ amount: Math.max(...totalCandidates).toFixed(2) });
      } else {
        // Fallback: no explicit total line found, so assume the largest
        // currency-like number on the receipt is the total.
        const amountMatches = [...text.matchAll(/\d{1,3}(?:[,.]\d{3})*\.\d{2}/g)];
        const amounts = amountMatches
            .map((m) => parseFloat(m[0].replace(/,/g, "")))
            .filter((n) => !isNaN(n) && n > 0);
        if (amounts.length > 0) {
          updateForm({ amount: Math.max(...amounts).toFixed(2) });
        }
      }

      // Look for a date in common receipt formats.
      const dateMatch = text.match(/\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
      if (dateMatch) {
        const parsed = new Date(dateMatch[0]);
        if (!isNaN(parsed.getTime())) {
          updateForm({ date: parsed.toISOString().split("T")[0] });
        }
      }

      // Guess the merchant/expense name from the first meaningful line.
      const firstLine = text
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.length > 2 && /[a-zA-Z]/.test(l));
      if (firstLine) {
        updateForm({ name: firstLine.slice(0, 60) });
      }

      toast("Receipt scanned — please double-check the details");
    } catch (err) {
      console.error("Failed to scan receipt:", err);
      toast("Couldn't read that receipt, please enter details manually", "error");
    } finally {
      setScanning(false);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleReceiptScan(file);
    e.target.value = "";
  };

  // Warn when this expense pushes a budgeted category (or the overall
  // monthly budget) past 80% / over 100% for the first time.
  const checkBudgetWarning = (saved: Expense) => {
    const monthPrefix = saved.date.slice(0, 7);
    const monthBudgets = budgets.filter(
      (b) => b.year === parseInt(saved.date.slice(0, 4)) && b.month === parseInt(monthPrefix.replace(/^\d{4}-/, "")) && b.amount > 0
    );
    if (monthBudgets.length === 0) return;

    const evaluate = (label: string, amount: number, spent: number) => {
      const beforePct = ((spent - saved.amount) / amount) * 100;
      if (beforePct > 100) return;
      const pct = (spent / amount) * 100;
      if (pct > 100) {
        toast(`${label} budget exceeded — ${formatCurrency(spent)} of ${formatCurrency(amount)}`, "error");
      } else if (pct >= 80) {
        toast(`${label} budget at ${Math.round(pct)}% used`, "info");
      }
    };

    const catBudget = monthBudgets.find((b) => b.category === saved.category);
    if (catBudget) {
      const spent =
        expenses
          .filter((e) => e.category === saved.category && e.date.startsWith(monthPrefix))
          .reduce((s, e) => s + e.amount, 0) + saved.amount;
      evaluate(saved.category, catBudget.amount, spent);
      return;
    }

    const overallBudget = monthBudgets.find((b) => !b.category);
    if (overallBudget) {
      const spent =
        expenses.filter((e) => e.date.startsWith(monthPrefix)).reduce((s, e) => s + e.amount, 0) + saved.amount;
      evaluate("Monthly", overallBudget.amount, spent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || parseFloat(form.amount) <= 0) return;

    setSaving(true);
    try {
      const saved = await addExpense({
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        payment_method: form.paymentMethod as PaymentMethod,
        expense_type: form.expenseType as ExpenseType,
        note: form.note.trim() || undefined,
      });
      checkBudgetWarning(saved);
      saveQuickAddPrefs({ category: form.category, paymentMethod: form.paymentMethod });
      hapticFeedback();
      toast("Expense added");
      onClose();
    } catch (err) {
      console.error("Failed to save expense:", err);
      toast("Failed to save expense", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-paper-bg rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto paper-card page-enter">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.06)]">
            <h2 className="font-handwritten text-2xl text-ink-dark">New Expense</h2>
            <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded transition-colors" aria-label="Close">
              <X size={18} className="text-ink-light" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Receipt scan */}
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Scan a Receipt</label>
              {receiptPreview ? (
                  <div className="flex items-center gap-3 p-2 bg-paper-dark rounded border border-[rgba(0,0,0,0.06)]">
                    <Image src={receiptPreview} alt="Receipt preview" width={48} height={48} unoptimized className="w-12 h-12 object-cover rounded flex-shrink-0" />
                    <div className="flex-1 text-xs text-ink-medium">
                      {scanning ? (
                          <span className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" /> Reading receipt...
                    </span>
                      ) : (
                          "Filled in below — please double-check before saving"
                      )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setReceiptPreview(null)}
                        className="p-1 hover:bg-paper-bg rounded transition-colors flex-shrink-0"
                        aria-label="Remove receipt"
                    >
                      <X size={14} className="text-ink-light" />
                    </button>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-ink-light/40 rounded text-xs text-ink-light hover:border-accent-warm hover:text-accent-warm transition-all cursor-pointer">
                      <Upload size={14} />
                      Upload Photo
                      <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleReceiptFileChange}
                      />
                    </label>
                    <label className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-ink-light/40 rounded text-xs text-ink-light hover:border-accent-warm hover:text-accent-warm transition-all cursor-pointer">
                      <Camera size={14} />
                      Take Photo
                      <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleReceiptFileChange}
                      />
                    </label>
                  </div>
              )}
            </div>

            <ExpenseForm
              data={form}
              onChange={updateForm}
              categories={categories.filter((cat) => cat.name !== "Bill" && cat.name !== "Subscription")}
              recentNames={recentNames}
              enableSmartCategory
              categoryHint={
                <p className="text-[10px] text-ink-light mt-1.5">
                  Manage categories on the <a href="/categories" className="text-accent-warm hover:underline">Categories page</a>
                </p>
              }
            />

            {/* Running daily total */}
            <div className="flex items-center justify-between text-xs text-ink-light bg-paper-dark/50 rounded px-3 py-2" aria-live="polite">
              <span>Spent so far on {formatDateShort(form.date)}</span>
              <span className="font-bold text-ink-dark tabular-nums amount">
                {formatCurrency(dayTotal)}
                {!isNaN(entryAmount) && entryAmount > 0 && (
                  <span className="text-accent-warm">
                    {" "}+{formatCurrency(entryAmount)} = {formatCurrency(dayTotal + entryAmount)}
                  </span>
                )}
              </span>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={saving || scanning || !form.name.trim() || !form.amount}
                className="w-full py-3 bg-accent-warm text-white rounded text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </form>
        </div>
      </div>
  );
}