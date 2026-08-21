"use client";

import type { ReactNode } from "react";
import { PAYMENT_METHODS, EXPENSE_TYPES, getCurrencySymbol } from "@/lib/utils";
import type { CategoryItem } from "@/types";

export interface ExpenseFormData {
  name: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: string;
  expenseType: string;
  note: string;
}

interface ExpenseFormProps {
  data: ExpenseFormData;
  onChange: (patch: Partial<ExpenseFormData>) => void;
  categories: CategoryItem[];
  allExpenseTypes?: boolean;
  categoryTilesExtra?: ReactNode;
  categoryHint?: ReactNode;
}

const inputClass =
  "w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm placeholder:text-ink-light/50 focus:outline-none focus:border-accent-warm transition-colors";

export default function ExpenseForm({
  data,
  onChange,
  categories,
  allExpenseTypes = false,
  categoryTilesExtra,
  categoryHint,
}: ExpenseFormProps) {
  const expenseTypeOptions = allExpenseTypes
    ? EXPENSE_TYPES
    : EXPENSE_TYPES.filter((t) => t !== "Bill" && t !== "Subscription" && t !== "Recurring payment");

  return (
    <>
      {/* Name */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">What did you spend on?</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Milk, Bus fare, Groceries..."
          className={inputClass}
          autoFocus
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Amount ({getCurrencySymbol()})</label>
        <input
          type="number"
          value={data.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
          placeholder="0"
          min="0"
          step="0.01"
          className={`${inputClass} amount`}
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Category</label>
        <div className="grid grid-cols-3 gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange({ category: cat.name })}
              className={`px-2 py-1.5 text-xs rounded border transition-all flex items-center gap-1 ${
                data.category === cat.name
                  ? "text-white border-accent-warm"
                  : "bg-paper-bg text-ink-medium border-[rgba(0,0,0,0.08)] hover:border-ink-light"
              }`}
              style={data.category === cat.name ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
            >
              <span>{cat.icon}</span>
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
          {categoryTilesExtra}
        </div>
        {categoryHint}
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Date</label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Payment Method</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => onChange({ paymentMethod: pm })}
              className={`px-3 py-1.5 text-xs rounded border transition-all ${
                data.paymentMethod === pm
                  ? "bg-ink-dark text-paper-bg border-ink-dark"
                  : "bg-paper-bg text-ink-medium border-[rgba(0,0,0,0.08)] hover:border-ink-light"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
      </div>

      {/* Expense type */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Type</label>
        <select
          value={data.expenseType}
          onChange={(e) => onChange({ expenseType: e.target.value })}
          className={inputClass}
        >
          {expenseTypeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Note (optional)</label>
        <textarea
          value={data.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="Any additional details..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>
    </>
  );
}
