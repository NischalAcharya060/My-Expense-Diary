"use client";

import { useSyncExternalStore, useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useExpenses, useBudgets, useCategories, useIncome } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import BackButton from "@/components/BackButton";

function ChartSkeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-paper-dark rounded ${className}`} />;
}

const CategoryPie = dynamic(
  () => import("@/components/insights/Charts").then((m) => m.CategoryPie),
  { ssr: false, loading: () => <ChartSkeleton className="w-44 h-44" /> }
);
const DailyTrendArea = dynamic(
  () => import("@/components/insights/Charts").then((m) => m.DailyTrendArea),
  { ssr: false, loading: () => <ChartSkeleton className="h-48 w-full" /> }
);
const MonthlyComparisonBar = dynamic(
  () => import("@/components/insights/Charts").then((m) => m.MonthlyComparisonBar),
  { ssr: false, loading: () => <ChartSkeleton className="h-48 w-full" /> }
);

export default function InsightsPage() {
  const { expenses, loaded } = useExpenses();
  const { getBudget } = useBudgets();
  const { categories } = useCategories();
  const { getMonthIncome, income } = useIncome();
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
          <div className="h-64 bg-paper-dark rounded mt-4" />
        </div>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthExpenses = expenses.filter((e) => e.date.startsWith(prefix));
  const totalSpending = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Spending by category
  const catData = categories.map((cat) => ({
    name: cat.name,
    icon: cat.icon,
    value: monthExpenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
    color: cat.color,
  })).filter((d) => d.value > 0);

  // Daily trend for current month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyTrend = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${prefix}-${String(i + 1).padStart(2, "0")}`;
    const dayTotal = monthExpenses.filter((e) => e.date === dayStr).reduce((s, e) => s + e.amount, 0);
    return { day: i + 1, amount: dayTotal };
  });

  // Monthly comparison (last 6 months)
  const monthlyComparison = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(year, month - 1), 5 - i);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = expenses.filter((e) => e.date.startsWith(p)).reduce((s, e) => s + e.amount, 0);
    const inc = income.filter((i) => i.date.startsWith(p)).reduce((s, i) => s + i.amount, 0);
    return { month: format(d, "MMM"), expenses: total, income: inc };
  });

  // Current month income
  const monthIncome = getMonthIncome(year, month);
  const netBalance = monthIncome - totalSpending;

  // Bills vs daily
  const billTotal = monthExpenses.filter((e) => e.expense_type === "Bill").reduce((s, e) => s + e.amount, 0);
  const dailyTotal = monthExpenses.filter((e) => e.expense_type === "Daily purchase").reduce((s, e) => s + e.amount, 0);
  const subTotal = monthExpenses.filter((e) => e.expense_type === "Subscription").reduce((s, e) => s + e.amount, 0);

  const budget = getBudget(year, month);
  const budgetAmount = budget?.amount || 0;
  const budgetPercent = budgetAmount > 0 ? (totalSpending / budgetAmount) * 100 : 0;

  return (
    <AuthGuard feature="spending insights">
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient">
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark">Spending Insights</h1>
              <p className="text-xs text-ink-light mt-0.5">Statistical breakdown of your cash outflows.</p>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="paper-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer" aria-label="Previous month">
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <div className="text-center">
              <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-semibold mt-0.5">
                Total Outflow: <span className="text-accent-warm amount font-bold">{formatCurrency(totalSpending)}</span>
              </p>
            </div>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer" aria-label="Next month">
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>
        </div>

        {/* Empty state when no expenses exist at all */}
        {expenses.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <span className="text-6xl block mb-3">📊</span>
            <p className="font-handwritten text-3xl text-ink-dark font-semibold">No data to analyze yet</p>
            <p className="text-xs text-ink-light mt-2 max-w-xs mx-auto leading-relaxed">
              Add 3+ expenses to unlock insights about your spending patterns.
            </p>
            <div className="mt-5 max-w-[220px] mx-auto" aria-label={`${expenses.length} of 3 expenses logged`}>
              <div className="flex justify-between text-[10px] font-bold text-ink-light mb-1.5 uppercase tracking-wider">
                <span>Progress</span>
                <span>{expenses.length}/3</span>
              </div>
              <div
                className="h-2.5 bg-paper-dark rounded-full overflow-hidden border border-[rgba(0,0,0,0.04)]"
                role="progressbar"
                aria-valuenow={expenses.length}
                aria-valuemin={0}
                aria-valuemax={3}
              >
                <div
                  className="h-full bg-accent-warm rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (expenses.length / 3) * 100)}%` }}
                />
              </div>
            </div>
            <Link
              href="/expenses?add=true"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              ✍️ Log First Expense
            </Link>
          </div>
        ) : (
        <>

        {/* Budget Progress Gauge */}
        {budgetAmount > 0 && (
          <div className="paper-card p-6 mb-6 card-hover">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={20} className="text-accent-warm" />
              <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Budget Tracker</h3>
            </div>
            <div className="flex justify-between items-baseline text-xs text-ink-medium mb-1.5 px-1 font-medium">
              <span>Spent: <strong className="amount text-sm text-ink-dark">{formatCurrency(totalSpending)}</strong></span>
              <span>Limit: <strong className="amount text-sm text-ink-dark">{formatCurrency(budgetAmount)}</strong></span>
            </div>
            
            {/* Progress Bar with outline and markers */}
            <div className="w-full h-4 bg-paper-dark border border-[rgba(0,0,0,0.1)] rounded-full overflow-hidden relative shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${totalSpending > budgetAmount ? "bg-accent-red" : "bg-accent-green"}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
              {/* Target line */}
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-ink-light/20" />
            </div>

            <div className="flex justify-between items-center mt-2.5 px-1">
              <span className={`text-xs font-semibold ${totalSpending > budgetAmount ? "text-accent-red" : "text-accent-green"}`}>
                {totalSpending > budgetAmount
                  ? `⚠️ ${formatCurrency(totalSpending - budgetAmount)} over budget`
                  : `🎉 ${formatCurrency(budgetAmount - totalSpending)} left in budget`}
              </span>
              <span className="text-[10px] text-ink-light font-bold">
                {budgetPercent.toFixed(0)}% Used
              </span>
            </div>
          </div>
        )}

        {/* Category Breakdown (Pie + Progress Lists) */}
        <div className="paper-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={20} className="text-accent-warm" />
            <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Category Allocations</h3>
          </div>
          {catData.length === 0 ? (
            <div className="text-center py-8 text-ink-light italic text-xs">
              No categories mapped this month.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Pie Chart */}
              <CategoryPie data={catData} />

              {/* Progress rows */}
              <div className="flex-1 space-y-2 w-full">
                {catData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-18 truncate font-medium text-ink-dark">{d.icon} {d.name}</span>
                    <div className="flex-1">
                      <div className="w-full h-2 bg-paper-dark rounded-full overflow-hidden border border-[rgba(0,0,0,0.02)]">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(d.value / totalSpending) * 100}%`, backgroundColor: d.color }} 
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right font-bold text-ink-medium amount">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily trend area chart (softer, rounded look) */}
        <div className="paper-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <LineIcon size={20} className="text-accent-warm" />
            <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Daily Spending Curve</h3>
          </div>
          <DailyTrendArea data={dailyTrend} />
        </div>

        {/* Monthly Comparison */}
        <div className="paper-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-accent-warm" />
            <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Income vs Expenses (6 Months)</h3>
          </div>
          <MonthlyComparisonBar data={monthlyComparison} />
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-accent-green" />
              <span className="text-[10px] text-ink-light font-medium">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-accent-red" />
              <span className="text-[10px] text-ink-light font-medium">Expenses</span>
            </div>
          </div>
        </div>

        {/* Current Month Summary */}
        <div className="paper-card p-4 mb-6 bg-accent-green/5 border-l-4 border-l-accent-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold">This Month&apos;s Net</p>
              <p className={`font-handwritten text-2xl amount font-semibold ${netBalance >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-accent-green font-medium">Income: {formatCurrency(monthIncome)}</p>
              <p className="text-[10px] text-accent-red font-medium">Spent: {formatCurrency(totalSpending)}</p>
            </div>
          </div>
        </div>

        {/* Bills vs Daily vs Subs */}
        <div className="paper-card p-6">
          <h3 className="font-handwritten text-2xl text-ink-dark mb-4 font-semibold">Expense Distribution Type</h3>
          <div className="space-y-3">
            <TypeBar label="Daily Purchases" amount={dailyTotal} total={totalSpending} color="#2563EB" />
            <TypeBar label="Recurring Bills" amount={billTotal} total={totalSpending} color="#E11D48" />
            <TypeBar label="Digital Subscriptions" amount={subTotal} total={totalSpending} color="#7C3AED" />
          </div>
        </div>
        </>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}

function TypeBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const percent = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="font-medium text-ink-dark">{label} ({percent.toFixed(0)}%)</span>
        <span className="font-bold text-ink-medium amount">{formatCurrency(amount)}</span>
      </div>
      <div className="w-full h-2.5 bg-paper-dark rounded-full overflow-hidden border border-[rgba(0,0,0,0.02)]">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${percent}%`, backgroundColor: color }} 
        />
      </div>
    </div>
  );
}
