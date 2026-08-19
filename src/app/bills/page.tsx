"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, DollarSign } from "lucide-react";
import { useExpenses, useRecurringPayments, useCategories } from "@/lib/store";
import { formatCurrency, BILL_TYPES, getCurrentMonth } from "@/lib/utils";
import AddExpenseModal from "@/components/AddExpenseModal";
import { format } from "date-fns";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

export default function BillsPage() {
  const { expenses, loaded } = useExpenses();
  const { payments } = useRecurringPayments();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBillType, setSelectedBillType] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-paper-dark rounded" />)}
        </div>
      </div>
    );
  }

  const { year, month } = getCurrentMonth();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthBills = expenses.filter((e) => e.expense_type === "Bill" && e.date.startsWith(prefix));
  const totalBills = monthBills.reduce((s, e) => s + e.amount, 0);

  const billPayments = payments.filter((p) => p.is_active && (p.category === "Bills" || BILL_TYPES.some((bt) => p.name.toLowerCase().includes(bt.toLowerCase()))));

  const billsByType: Record<string, { payment: any; expense: any }> = {};
  BILL_TYPES.forEach((bt) => {
    const payment = billPayments.find((p) => p.name.toLowerCase().includes(bt.toLowerCase()));
    const expense = monthBills.find((e) => e.name.toLowerCase().includes(bt.toLowerCase()));
    billsByType[bt] = { payment, expense };
  });

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark">Bills & Subscriptions</h1>
          <button onClick={() => requireAuth(() => setShowAdd(true))}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-warm text-white rounded text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Add Bill
          </button>
        </div>

        {/* Month total */}
        <div className="paper-card px-4 py-3 mb-6 flex items-center gap-3">
          <DollarSign size={20} className="text-accent-warm" />
          <div>
            <p className="text-xs text-ink-light uppercase tracking-wide">
              {format(new Date(), "MMMM yyyy")} Bills Total
            </p>
            <p className="font-handwritten text-2xl text-accent-warm amount">{formatCurrency(totalBills)}</p>
          </div>
        </div>

        {/* Bill types */}
        <div className="space-y-3">
          {BILL_TYPES.map((bt) => {
            const { payment, expense } = billsByType[bt] || {};
            const amount = expense?.amount || payment?.amount || 0;
            const isPaid = !!expense;
            const isVariable = payment?.is_variable;

            return (
              <div key={bt}
                className={`paper-card px-4 py-4 cursor-pointer transition-all hover:shadow-md ${selectedBillType === bt ? "ring-1 ring-accent-warm" : ""}`}
                onClick={() => setSelectedBillType(selectedBillType === bt ? null : bt)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isPaid ? "bg-accent-green" : "bg-ink-light/40"}`} />
                    <div>
                      <p className="text-sm text-ink-dark font-medium">{bt}</p>
                      <p className="text-xs text-ink-light">
                        {payment ? `${payment.frequency} · Due ${payment.due_day}${getOrdinalSuffix(payment.due_day)}` : "No schedule"}
                        {isVariable && " · Variable"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm amount ${isPaid ? "text-accent-green" : "text-ink-medium"}`}>
                      {amount > 0 ? formatCurrency(amount) : "—"}
                    </span>
                    {isPaid && <span className="block text-xs text-accent-green">Paid</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent bill payments */}
        {monthBills.length > 0 && (
          <div className="paper-card p-6 mt-6">
            <h3 className="font-handwritten text-xl text-ink-dark mb-3">This Month&apos;s Bills</h3>
            <div className="space-y-2">
              {monthBills.map((e) => (
                <div key={e.id} className="flex items-center py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                  <div className="w-2 h-2 rounded-full bg-accent-green mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-dark">{e.name}</p>
                    <p className="text-xs text-ink-light">{format(new Date(e.date), "MMM d")} · {e.payment_method}</p>
                  </div>
                  <span className="text-sm text-ink-medium amount">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding bills" />
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
}
