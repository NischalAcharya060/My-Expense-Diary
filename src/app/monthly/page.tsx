"use client";

import { useSyncExternalStore, useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenses, useBudgets, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";

export default function MonthlySummaryPage() {
  const { expenses, loaded } = useExpenses();
  const { getBudget } = useBudgets();
  const { getCategoryByName } = useCategories();
  const [currentDate, setCurrentDate] = useState(new Date());
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-32 bg-paper-dark rounded mt-4" />
        </div>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthExpenses = expenses.filter((e) => e.date.startsWith(format(currentDate, "yyyy-MM")));
  const totalSpending = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const bills = monthExpenses.filter((e) => e.expense_type === "Bill");
  const subscriptions = monthExpenses.filter((e) => e.expense_type === "Subscription");
  const dailyExpenses = monthExpenses.filter((e) => e.expense_type === "Daily purchase");
  const totalBills = bills.reduce((s, e) => s + e.amount, 0);
  const totalSubs = subscriptions.reduce((s, e) => s + e.amount, 0);
  const totalDaily = dailyExpenses.reduce((s, e) => s + e.amount, 0);

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysWithData = new Set(monthExpenses.map((e) => e.date)).size;
  const avgDaily = daysWithData > 0 ? totalSpending / daysInMonth : 0;

  const dayTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount;
  });
  const highestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];

  const catTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const highestCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const budget = getBudget(year, month);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - totalSpending;

  return (
    <AuthGuard feature="monthly summaries">
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark mb-6">Monthly Summary</h1>

        {/* Month nav */}
        <div className="paper-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded transition-colors" aria-label="Previous month">
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <h2 className="font-handwritten text-2xl text-ink-dark">{format(currentDate, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded transition-colors" aria-label="Next month">
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Total Spending" value={formatCurrency(totalSpending)} />
          <SummaryCard label="Bills" value={formatCurrency(totalBills)} />
          <SummaryCard label="Subscriptions" value={formatCurrency(totalSubs)} />
          <SummaryCard label="Daily" value={formatCurrency(totalDaily)} />
        </div>

        {budgetAmount > 0 && (
          <div className="paper-card p-4 mb-6">
            <p className="text-xs text-ink-light uppercase tracking-wide mb-2">Budget Progress</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-ink-dark">Spent: {formatCurrency(totalSpending)}</span>
              <span className="dots" />
              <span className="text-sm text-ink-medium">Budget: {formatCurrency(budgetAmount)}</span>
            </div>
            <div className="w-full h-2 bg-paper-dark rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${remaining < 0 ? "bg-accent-red" : "bg-accent-green"}`}
                style={{ width: `${Math.min((totalSpending / budgetAmount) * 100, 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${remaining < 0 ? "text-accent-red" : "text-accent-green"}`}>
              {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over budget` : `${formatCurrency(remaining)} remaining`}
            </p>
          </div>
        )}

        {/* Additional stats */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Details</h3>
          <div className="space-y-3">
            <StatRow label="Average Daily Spending" value={formatCurrency(avgDaily)} />
            {highestDay && (
              <StatRow label="Highest Spending Day" value={`${format(new Date(highestDay[0] + "T00:00:00"), "MMM d")} — ${formatCurrency(highestDay[1])}`} />
            )}
            {highestCategory && (
              <StatRow label="Highest Category" value={`${highestCategory[0]} — ${formatCurrency(highestCategory[1])}`} />
            )}
            <StatRow label="Total Entries" value={`${monthExpenses.length}`} />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="paper-card p-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">By Category</h3>
          {Object.keys(catTotals).length === 0 ? (
            <p className="text-ink-light text-sm text-center py-4">No data for this month</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(catTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => (
                    <div key={cat} className="flex items-center">
                      <span className="text-sm mr-3 shrink-0">{getCategoryByName(cat)?.icon || "🏷️"}</span>
                    <span className="text-sm text-ink-dark w-28">{cat}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full h-1.5 bg-paper-dark rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(total / totalSpending) * 100}%`,
                            backgroundColor: getCategoryByName(cat)?.color || "#6B7280",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-ink-medium amount">{formatCurrency(total)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="paper-card px-3 py-3 text-center">
      <p className="text-xs text-ink-light uppercase tracking-wide mb-1">{label}</p>
      <p className="font-handwritten text-xl text-ink-dark amount">{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center py-1.5 border-b border-[rgba(0,0,0,0.04)] last:border-0">
      <span className="text-sm text-ink-medium">{label}</span>
      <span className="dots" />
      <span className="text-sm text-ink-dark amount">{value}</span>
    </div>
  );
}
