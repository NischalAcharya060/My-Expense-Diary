"use client";

import { useSyncExternalStore, useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react";
import { useExpenses, useBudgets, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from "recharts";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name?: string; icon?: string; day?: number } }>;
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="paper-card px-3 py-2 text-xs border border-accent-warm/30 shadow-md">
        <p className="font-semibold text-ink-dark">{payload[0].payload.name ? `${payload[0].payload.icon} ${payload[0].payload.name}` : payload[0].payload.day ? `Day ${payload[0].payload.day}` : label}</p>
        <p className="text-accent-warm amount font-bold mt-0.5">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export default function InsightsPage() {
  const { expenses, loaded } = useExpenses();
  const { getBudget } = useBudgets();
  const { categories } = useCategories();
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
    return { month: format(d, "MMM"), amount: total };
  });

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
        <div className="mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <h1 className="font-handwritten text-4xl text-ink-dark">Spending Insights</h1>
          <p className="text-xs text-ink-light mt-0.5">Statistical breakdown of your cash outflows.</p>
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

        {/* Budget Progress Gauge */}
        {budgetAmount > 0 && (
          <div className="paper-card p-6 mb-6">
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
              <div className="w-44 h-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                      {catData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

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
          <div className="h-48 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4854A" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#D4854A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#888" }} />
                <YAxis tick={{ fontSize: 9, fill: "#888" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#D4854A" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="paper-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-accent-warm" />
            <h3 className="font-handwritten text-2xl text-ink-dark font-semibold">Monthly Spending Comparison</h3>
          </div>
          <div className="h-48 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#888" }} />
                <YAxis tick={{ fontSize: 9, fill: "#888" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#4A8C6F" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
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
