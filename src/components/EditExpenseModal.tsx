"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Plus } from "lucide-react";
import { useExpenses, useCategories } from "@/lib/store";
import { useToast } from "@/components/Toast";
import ExpenseForm, { type ExpenseFormData } from "@/components/ExpenseForm";
import { useSwipeDownDismiss } from "@/lib/useSwipeDownDismiss";
import type { Expense, PaymentMethod, ExpenseType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}

const QUICK_COLORS = ["#16A34A", "#EA580C", "#2563EB", "#D946EF", "#8B5CF6", "#DC2626", "#0891B2", "#F59E0B", "#64748B", "#E11D48", "#7C3AED", "#6B7280"];

export default function EditExpenseModal({ open, onClose, expense }: Props) {
  const { updateExpense } = useExpenses();
  const { categories, addCategory } = useCategories();
  const [form, setForm] = useState<ExpenseFormData>({
    name: "",
    amount: "",
    category: "Other",
    date: "",
    paymentMethod: "Cash",
    expenseType: "Daily purchase",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("#6B7280");
  const { toast } = useToast();

  const updateForm = useCallback((patch: Partial<ExpenseFormData>) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && expense) {
      setForm({
        name: expense.name,
        amount: String(expense.amount),
        category: expense.category,
        date: expense.date,
        paymentMethod: expense.payment_method,
        expenseType: expense.expense_type,
        note: expense.note || "",
      });
      setShowAddCategory(false);
      setNewCatName("");
      setNewCatIcon("🏷️");
      setNewCatColor("#6B7280");
    }
  }, [open, expense]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const swipe = useSwipeDownDismiss(onClose, open && !!expense);
  if (!open || !expense) return null;

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await addCategory(newCatName.trim(), newCatIcon, newCatColor);
      updateForm({ category: cat.name });
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
    if (!form.name.trim() || !form.amount || parseFloat(form.amount) <= 0) return;

    setSaving(true);
    try {
      await updateExpense(expense.id, {
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        payment_method: form.paymentMethod as PaymentMethod,
        expense_type: form.expenseType as ExpenseType,
        note: form.note.trim() || undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-paper-bg rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto paper-card page-enter will-change-transform" {...swipe.handlers} style={swipe.style}>
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="font-handwritten text-2xl text-ink-dark">Edit Expense</h2>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded transition-colors" aria-label="Close">
            <X size={18} className="text-ink-light" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <ExpenseForm
            data={form}
            onChange={updateForm}
            categories={categories}
            allExpenseTypes
            categoryTilesExtra={
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-2 py-1.5 text-xs rounded border border-dashed border-ink-light/40 text-ink-light hover:border-accent-warm hover:text-accent-warm transition-all flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </button>
            }
            categoryHint={
              showAddCategory ? (
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
              ) : undefined
            }
          />

          <button
            type="submit"
            disabled={saving || !form.name.trim() || !form.amount}
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
