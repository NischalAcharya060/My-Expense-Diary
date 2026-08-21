"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { PAYMENT_METHODS, EXPENSE_TYPES, getCurrencySymbol } from "@/lib/utils";
import { suggestCategoryFrom } from "@/lib/smartCategory";
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
  /** Recent expense names shown as quick re-entry chips above the name field. */
  recentNames?: string[];
  /** Auto-select the suggested category as the user types the expense name. */
  enableSmartCategory?: boolean;
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
  recentNames,
  enableSmartCategory = false,
}: ExpenseFormProps) {
  // Becomes true when the user explicitly picks a category, so auto-categorize
  // stops overriding them until the name field is cleared again.
  const categoryManuallyPicked = useRef(false);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);
  const suggestion = useMemo(
    () => (enableSmartCategory && data.name.trim() ? suggestCategoryFrom(data.name, categoryNames) : null),
    [enableSmartCategory, data.name, categoryNames]
  );

  const applyNameChange = (name: string) => {
    const patch: Partial<ExpenseFormData> = { name };
    if (enableSmartCategory) {
      if (!name.trim()) categoryManuallyPicked.current = false;
      if (!categoryManuallyPicked.current) {
        const match = suggestCategoryFrom(name, categoryNames);
        if (match && match !== data.category) patch.category = match;
      }
    }
    onChange(patch);
  };

  const suggestionMeta = suggestion ? categories.find((c) => c.name === suggestion) : undefined;

  const expenseTypeOptions = allExpenseTypes
    ? EXPENSE_TYPES
    : EXPENSE_TYPES.filter((t) => t !== "Bill" && t !== "Subscription" && t !== "Recurring payment");

  return (
    <>
      {/* Name */}
      <div>
        <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">What did you spend on?</label>
        {recentNames && recentNames.length > 0 && !data.name && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] uppercase tracking-wide text-ink-light self-center mr-0.5">Recent</span>
            {recentNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => applyNameChange(name)}
                title={`Reuse "${name}"`}
                className="px-2 py-1 max-w-[9rem] truncate text-xs rounded-full bg-paper-dark/70 text-ink-medium border border-[rgba(0,0,0,0.08)] hover:border-accent-warm hover:text-accent-warm transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={data.name}
          onChange={(e) => applyNameChange(e.target.value)}
          placeholder="e.g. Milk, Bus fare, Groceries..."
          className={inputClass}
          autoFocus
          required
        />
        {suggestionMeta && (
          suggestion === data.category ? (
            <p className="flex items-center gap-1 text-[10px] text-ink-light mt-1.5" aria-live="polite">
              <Sparkles size={10} className="text-accent-green" aria-hidden="true" />
              Auto-matched to {suggestionMeta.icon} {suggestionMeta.name}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                categoryManuallyPicked.current = true;
                onChange({ category: suggestionMeta.name });
              }}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-dashed border-accent-warm/50 text-accent-warm hover:bg-accent-warm/10 transition-colors"
            >
              <Sparkles size={10} aria-hidden="true" />
              Suggested: {suggestionMeta.icon} {suggestionMeta.name}
            </button>
          )
        )}
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
              onClick={() => {
                categoryManuallyPicked.current = true;
                onChange({ category: cat.name });
              }}
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
