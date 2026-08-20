"use client";

import { useState, useEffect } from "react";
import { X, Check, Plus } from "lucide-react";
import { useExpenses, useCategories } from "@/lib/store";
import { PAYMENT_METHODS, EXPENSE_TYPES, getCurrencySymbol } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Expense, PaymentMethod, ExpenseType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export default function EditExpenseModal({ open, onClose, expense }: Props) {
  const { updateExpense } = useExpenses();
  const { categories, addCategory } = useCategories();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [expenseType, setExpenseType] = useState("Daily purchase");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("#6B7280");
  const { toast } = useToast();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && expense) {
      setName(expense.name);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setDate(expense.date);
      setPaymentMethod(expense.payment_method);
      setExpenseType(expense.expense_type);
      setNote(expense.note || "");
      setShowAddCategory(false);
      setNewCatName("");
      setNewCatIcon("🏷️");
      setNewCatColor("#6B7280");
    }
  }, [open, expense]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open || !expense) return null;

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await addCategory(newCatName.trim(), newCatIcon, newCatColor);
      setCategory(cat.name);
      setShowAddCategory(false);
      setNewCatName("");
      setNewCatIcon("🏷️");
      setNewCatColor("#6B7280");
      toast("Category added");
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;

    setSaving(true);
    try {
      await updateExpense(expense.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        category,
        date,
        payment_method: paymentMethod as PaymentMethod,
        expense_type: expenseType as ExpenseType,
        note: note.trim() || undefined,
      });
      toast("Expense updated");
      onClose();
    } catch (err) {
      console.error("Failed to update expense:", err);
      toast("Failed to update expense", "error");
    } finally {
      setSaving(false);
    }
  };

  const QUICK_COLORS = ["#16A34A", "#EA580C", "#2563EB", "#D946EF", "#8B5CF6", "#DC2626", "#0891B2", "#F59E0B", "#64748B", "#E11D48", "#7C3AED", "#6B7280"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-paper-bg rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto paper-card page-enter">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="font-handwritten text-2xl text-ink-dark">Edit Expense</h2>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded transition-colors" aria-label="Close">
            <X size={18} className="text-ink-light" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">What did you spend on?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Milk, Bus fare, Groceries..."
              className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm placeholder:text-ink-light/50 focus:outline-none focus:border-accent-warm transition-colors"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Amount ({getCurrencySymbol()})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm placeholder:text-ink-light/50 focus:outline-none focus:border-accent-warm transition-colors amount"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`px-2 py-1.5 text-xs rounded border transition-all flex items-center gap-1 ${
                    category === cat.name
                      ? "text-white border-accent-warm"
                      : "bg-paper-bg text-ink-medium border-[rgba(0,0,0,0.08)] hover:border-ink-light"
                  }`}
                  style={category === cat.name ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-2 py-1.5 text-xs rounded border border-dashed border-ink-light/40 text-ink-light hover:border-accent-warm hover:text-accent-warm transition-all flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {showAddCategory && (
              <div className="mt-2 p-3 bg-paper-dark rounded border border-[rgba(0,0,0,0.06)] space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-12 text-center px-1 py-1.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-sm"
                    placeholder="icon"
                  />
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-1.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${newCatColor === c ? "border-ink-dark scale-125" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="px-3 py-1 bg-accent-warm text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Add Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="px-3 py-1 border border-[rgba(0,0,0,0.1)] rounded text-xs text-ink-medium hover:bg-paper-bg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-1.5 text-xs rounded border transition-all ${
                    paymentMethod === pm
                      ? "bg-ink-dark text-paper-bg border-ink-dark"
                      : "bg-paper-bg text-ink-medium border-[rgba(0,0,0,0.08)] hover:border-ink-light"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Type</label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm transition-colors"
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm placeholder:text-ink-light/50 focus:outline-none focus:border-accent-warm transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim() || !amount}
            className="w-full py-3 bg-accent-warm text-white rounded text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
