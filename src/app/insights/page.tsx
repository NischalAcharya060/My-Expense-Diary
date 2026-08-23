"use client";

import { useSyncExternalStore, useState } from "react";
import { format, differenceInCalendarDays, addDays, subMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Minus,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useExpenses, useBudgets, useCategories, useIncome } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { useTapScrollTop } from "@/lib/useTapScrollTop";
import AuthGuard from "@/components/AuthGuard";
import BackButton from "@/components/BackButton";
import RangeSelector, {
  buildRange,
  shiftRange,
  rangeLabel,
  periodNoun,
  type DateRangeSel,
} from "@/components/insights/RangeSelector";
import InteractiveChart from "@/components/insights/InteractiveChart";
import FirstVisitTip from "@/components/FirstVisitTip";
import type { DailyTrendDatum, MonthlyComparisonDatum } from "@/components/insights/Charts";

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

function netTitle(type: DateRangeSel["type"]): string {
  switch (type) {
    case "week":
      return "This Week's Net";
    case "month":
      return "This Month's Net";
    case "year":
      return "This Year's Net";
    default:
      return "Period Net";
  }
}

export default function InsightsPage() {
  const { expenses, loaded } = useExpenses();
  const { getBudget } = useBudgets();
  const { categories } = useCategories();
  const { income } = useIncome();
  const router = useRouter();
  const [range, setRange] = useState<DateRangeSel>(() => buildRange("month", new Date()));
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const tapTop = useTapScrollTop();

  const startD = new Date(`${range.start}T00:00:00`);
  const endD = new Date(`${range.end}T00:00:00`);
  const spanDays = differenceInCalendarDays(endD, startD) + 1;

  const inRange = (dateStr: string) => dateStr >= range.start && dateStr <= range.end;
  const sumAmounts = (list: { amount: number }[]) => list.reduce((s, e) => s + e.amount, 0);

  const rangeExpenses = expenses.filter((e) => inRange(e.date));
  const totalSpending = sumAmounts(rangeExpenses);

  const prevStart = format(addDays(startD, -spanDays), "yyyy-MM-dd");
  const prevEnd = format(addDays(startD, -1), "yyyy-MM-dd");
  const prevExpenses = expenses.filter((e) => e.date >= prevStart && e.date <= prevEnd);
  const prevTotal = sumAmounts(prevExpenses);
  const changePct = prevTotal > 0 ? ((totalSpending - prevTotal) / prevTotal) * 100 : null;

  const prevCatMap = new Map<string, number>();
  for (const e of prevExpenses) prevCatMap.set(e.category, (prevCatMap.get(e.category) || 0) + e.amount);

  const catData = categories
    .map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      value: rangeExpenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    }))
    .filter((d) => d.value > 0);

  const trendData: DailyTrendDatum[] = [];
  if (spanDays <= 31) {
    for (let i = 0; i < spanDays; i++) {
      const dayStr = format(addDays(startD, i), "yyyy-MM-dd");
      trendData.push({ day: i + 1, amount: sumAmounts(rangeExpenses.filter((e) => e.date === dayStr)) });
    }
  } else if (spanDays <= 62) {
    for (let i = 0; i < spanDays; i++) {
      const d = addDays(startD, i);
      const dayStr = format(d, "yyyy-MM-dd");
      trendData.push({ label: format(d, "MMM d"), amount: sumAmounts(rangeExpenses.filter((e) => e.date === dayStr)) });
    }
  } else {
    const weeks = Math.ceil(spanDays / 7);
    for (let w = 0; w < weeks; w++) {
      const ws = addDays(startD, w * 7);
      let we = addDays(ws, 6);
      if (we.getTime() > endD.getTime()) we = endD;
      const wsStr = format(ws, "yyyy-MM-dd");
      const weStr = format(we, "yyyy-MM-dd");
      trendData.push({
        label: format(ws, "d MMM"),
        amount: sumAmounts(rangeExpenses.filter((e) => e.date >= wsStr && e.date <= weStr)),
      });
    }
  }

  const anchorMonth = new Date(endD.getFullYear(), endD.getMonth(), 1);
  const monthlyComparison: MonthlyComparisonDatum[] = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(anchorMonth, 5 - i);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      key: p,
      month: format(d, "MMM"),
      expenses: sumAmounts(expenses.filter((e) => e.date.startsWith(p))),
      income: sumAmounts(income.filter((inc) => inc.date.startsWith(p))),
    };
  });

  const rangeIncome = sumAmounts(income.filter((inc) => inRange(inc.date)));
  const netBalance = rangeIncome - totalSpending;

  const isMonthView = range.type === "month";
  const budget = isMonthView ? getBudget(startD.getFullYear(), startD.getMonth() + 1) : undefined;
  const budgetAmount = budget?.amount || 0;
  const budgetPercent = budgetAmount > 0 ? (totalSpending / budgetAmount) * 100 : 0;

  const billTotal = sumAmounts(rangeExpenses.filter((e) => e.expense_type === "Bill"));
  const dailyTotal = sumAmounts(rangeExpenses.filter((e) => e.expense_type === "Daily purchase"));
  const subTotal = sumAmounts(rangeExpenses.filter((e) => e.expense_type === "Subscription"));

  const rangeKey = `${range.type}:${range.start}:${range.end}`;

  const goCategory = (name: string) => {
    const params = new URLSearchParams({ category: name });
    if (isMonthView) params.set("month", range.start.slice(0, 7));
    router.push(`/expenses?${params.toString()}`);
  };
  const goMonthKey = (key: string) => router.push(`/expenses?month=${key}`);

  const noun = periodNoun(range);
  let comparison: { tone: "down" | "up" | "flat"; text: string } | null = null;
  if (!(totalSpending === 0 && prevTotal === 0)) {
    if (changePct == null) comparison = { tone: "flat", text: `No spending recorded in the previous ${noun}.` };
    else if (changePct <= -1) comparison = { tone: "down", text: `You spent ${Math.abs(Math.round(changePct))}% less than last ${noun}.` };
    else if (changePct >= 1) comparison = { tone: "up", text: `You spent ${Math.round(changePct)}% more than last ${noun}.` };
    else comparison = { tone: "flat", text: `Spending held steady vs last ${noun}.` };
  }

  const renderTrendValue = (_index: number, point?: DailyTrendDatum) => {
    if (!point) return null;
    const title = point.day != null ? `Day ${point.day}` : point.label ?? "";
    return (
      <>
        {title && <p className="font-semibold text-ink-dark">{title}</p>}
        <p className="text-accent-warm amount font-bold mt-0.5">{formatCurrency(point.amount)}</p>
      </>
    );
  };

  const renderBarValue = (_index: number, d?: MonthlyComparisonDatum) => {
    if (!d) return null;
    return (
      <>
        <p className="font-semibold text-ink-dark">{d.month}</p>
        <p className="amount font-bold mt-0.5 text-accent-green">Income: {formatCurrency(d.income)}</p>
        <p className="amount font-bold text-accent-red">Expenses: {formatCurrency(d.expenses)}</p>
      </>
    );
  };

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

  return (
    <AuthGuard feature="spending insights">
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">

        {/* Header */}
        <div
          {...tapTop}
          className="mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient cursor-pointer lg:cursor-default"
        >
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark">Spending Insights</h1>
              <p className="text-xs text-ink-light mt-0.5">Statistical breakdown of your cash outflows.</p>
            </div>
          </div>
        </div>

        {/* One-time page tour tip — message adapts to how much data exists */}
        <FirstVisitTip id="tour-insights">
          {expenses.length < 5
            ? "Add at least 5 expenses to see meaningful charts — your spending patterns will start telling a story."
            : "Your spending patterns visualized. Tap any chart segment for details — and long-press points on mobile to pin exact values."}
        </FirstVisitTip>

        {/* Range navigation + selector */}
        <div className="paper-card p-4 mb-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setRange(shiftRange(range, -1))}
              disabled={range.type === "custom"}
              className="p-2 rounded-md transition-colors enabled:hover:bg-paper-dark enabled:cursor-pointer disabled:opacity-30"
              aria-label="Previous period"
            >
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <div className="text-center min-w-0">
              <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark font-semibold truncate">
                {rangeLabel(range)}
              </h2>
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-semibold mt-0.5">
                Total Outflow: <span className="text-accent-warm amount font-bold">{formatCurrency(totalSpending)}</span>
              </p>
            </div>
            <button
              onClick={() => setRange(shiftRange(range, 1))}
              disabled={range.type === "custom"}
              className="p-2 rounded-md transition-colors enabled:hover:bg-paper-dark enabled:cursor-pointer disabled:opacity-30"
              aria-label="Next period"
            >
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.04)]">
            <RangeSelector value={range} onChange={setRange} />
          </div>
        </div>

        {/* Period-over-period comparison strip */}
        {comparison && (
          <div
            className={`paper-card p-4 mb-6 flex items-center gap-3 border-l-4 ${
              comparison.tone === "down"
                ? "border-l-accent-green text-accent-green"
                : comparison.tone === "up"
                  ? "border-l-accent-red text-accent-red"
                  : "border-l-accent-warm text-ink-medium"
            }`}
            role="status"
          >
            {comparison.tone === "down" ? (
              <TrendingDown size={20} className="shrink-0" />
            ) : comparison.tone === "up" ? (
              <TrendingUp size={20} className="shrink-0" />
            ) : (
              <Minus size={20} className="shrink-0" />
            )}
            <p className="text-sm font-semibold">{comparison.text}</p>
          </div>
        )}

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

        {/* Budget Progress Gauge (per calendar month only) */}
        {isMonthView && budgetAmount > 0 && (
          <div className="paper-card p-6 mb-6 card-hover">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={20} className="text-accent-warm" />
              <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Budget Tracker</h3>
            </div>
            <div className="flex justify-between items-baseline text-xs text-ink-medium mb-1.5 px-1 font-medium">
              <span>Spent: <strong className="amount text-sm text-ink-dark">{formatCurrency(totalSpending)}</strong></span>
              <span>Limit: <strong className="amount text-sm text-ink-dark">{formatCurrency(budgetAmount)}</strong></span>
            </div>

            <div className="w-full h-4 bg-paper-dark border border-[rgba(0,0,0,0.1)] rounded-full overflow-hidden relative shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${totalSpending > budgetAmount ? "bg-accent-red" : "bg-accent-green"}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
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
              Nothing spent in this period yet.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Pie Chart */}
              <div className="relative shrink-0">
                <CategoryPie key={rangeKey} data={catData} onSelect={goCategory} />
                <p className="text-center text-[10px] text-ink-light mt-1">Tap a slice to see those entries</p>
              </div>

              {/* Progress rows */}
              <div className="flex-1 space-y-1 w-full min-w-0">
                {catData.map((d) => {
                  const prevVal = prevCatMap.get(d.name) || 0;
                  const delta = prevVal > 0 ? ((d.value - prevVal) / prevVal) * 100 : null;
                  return (
                    <button
                      key={d.name}
                      onClick={() => goCategory(d.name)}
                      title={`Show ${d.name} expenses`}
                      className="w-full flex items-center gap-2 text-xs cursor-pointer hover:bg-paper-dark/30 active:bg-paper-dark/50 rounded px-1.5 py-1 -mx-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm/40"
                    >
                      <span className="w-18 truncate font-medium text-ink-dark text-left">{d.icon} {d.name}</span>
                      <span className="flex-1">
                        <span className="block w-full h-2 bg-paper-dark rounded-full overflow-hidden border border-[rgba(0,0,0,0.02)]">
                          <span
                            className="block h-full rounded-full transition-all duration-500"
                            style={{ width: `${(d.value / totalSpending) * 100}%`, backgroundColor: d.color }}
                          />
                        </span>
                      </span>
                      <span className="w-16 text-right font-bold text-ink-medium amount">{formatCurrency(d.value)}</span>
                      {delta != null && Math.abs(delta) >= 1 ? (
                        <span
                          className={`shrink-0 inline-flex items-center justify-end gap-0.5 w-11 text-[10px] font-bold ${delta < 0 ? "text-accent-green" : "text-accent-red"}`}
                          aria-label={`${delta < 0 ? "Down" : "Up"} ${Math.abs(Math.round(delta))} percent vs previous ${noun}`}
                        >
                          {delta < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                          {Math.abs(Math.round(delta))}%
                        </span>
                      ) : delta == null && prevExpenses.length > 0 ? (
                        <span className="shrink-0 inline-flex justify-end w-11 text-[9px] font-bold text-ink-light uppercase">new</span>
                      ) : (
                        <span className="shrink-0 w-11" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily trend area chart with pinch-to-zoom + long-press exact values */}
        <div className="paper-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <LineIcon size={20} className="text-accent-warm" />
            <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Daily Spending Curve</h3>
          </div>
          <InteractiveChart
            key={`trend-${rangeKey}`}
            items={trendData}
            renderChart={(slice) => <DailyTrendArea data={slice} />}
            renderValue={(index) => renderTrendValue(index)}
            mobileHint="Hold for exact values · pinch to zoom"
          />
        </div>

        {/* Monthly Comparison */}
        <div className="paper-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-accent-warm" />
            <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Income vs Expenses (6 Months)</h3>
          </div>
          <InteractiveChart
            key={`bar-${rangeKey}`}
            enableZoom={false}
            items={monthlyComparison}
            renderChart={(slice) => <MonthlyComparisonBar data={slice} onSelectMonth={goMonthKey} />}
            renderValue={(index) => renderBarValue(index)}
            caption="Tap a bar to open that month"
          />
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

        {/* Selected Period Summary */}
        <div className="paper-card p-4 mb-6 bg-accent-green/5 border-l-4 border-l-accent-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold">{netTitle(range.type)}</p>
              <p className={`font-handwritten text-2xl amount font-semibold ${netBalance >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-accent-green font-medium">Income: {formatCurrency(rangeIncome)}</p>
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
