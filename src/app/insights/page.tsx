"use client";

import { useState, useEffect } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenses, useBudgets, useCategories } from "@/lib/store";
import { formatCurrency, CATEGORIES } from "@/lib/utils";
import type { Category } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

export default function InsightsPage() {
  const { expenses, loaded } = useExpenses();
  const { getBudget } = useBudgets();
  const { categories, getCategoryByName } = useCategories();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="paper-card px-3 py-2 text-xs">
          <p className="text-ink-dark">{payload[0].payload.name || payload[0].payload.day || `Month: ${label}`}</p>
          <p className="text-accent-warm amount">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark mb-6">Insights</h1>

        {/* Month nav */}
        <div className="paper-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded transition-colors">
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <h2 className="font-handwritten text-2xl text-ink-dark">{format(currentDate, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded transition-colors">
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>
        </div>

        {/* Budget progress */}
        {budgetAmount > 0 && (
          <div className="paper-card p-6 mb-6">
            <h3 className="font-handwritten text-xl text-ink-dark mb-3">Budget Progress</h3>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-ink-dark amount">{formatCurrency(totalSpending)}</span>
              <span className="dots" />
              <span className="text-sm text-ink-medium amount">{formatCurrency(budgetAmount)}</span>
            </div>
            <div className="w-full h-3 bg-paper-dark rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalSpending > budgetAmount ? "bg-accent-red" : "bg-accent-green"}`}
                style={{ width: `${Math.min((totalSpending / budgetAmount) * 100, 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-2 ${totalSpending > budgetAmount ? "text-accent-red" : "text-accent-green"}`}>
              {totalSpending > budgetAmount
                ? `${formatCurrency(totalSpending - budgetAmount)} over budget`
                : `${formatCurrency(budgetAmount - totalSpending)} remaining`}
            </p>
          </div>
        )}

        {/* Category breakdown */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Spending by Category</h3>
          {catData.length === 0 ? (
            <p className="text-ink-light text-sm text-center py-4">No data</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {catData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 w-full">
                {catData.map((d) => (
                  <div key={d.name} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-ink-dark w-20">{d.icon} {d.name}</span>
                    <div className="flex-1 mx-2">
                      <div className="w-full h-1.5 bg-paper-dark rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / totalSpending) * 100}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-ink-medium amount">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily trend */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Daily Spending Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#D4854A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly comparison */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Monthly Comparison</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#4A8C6F" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bills vs Daily */}
        <div className="paper-card p-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Bills vs Daily Expenses</h3>
          <div className="space-y-3">
            <TypeBar label="Bills" amount={billTotal} total={totalSpending} color="#E11D48" />
            <TypeBar label="Daily" amount={dailyTotal} total={totalSpending} color="#2563EB" />
            <TypeBar label="Subscriptions" amount={subTotal} total={totalSpending} color="#7C3AED" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-ink-dark">{label}</span>
        <span className="text-sm text-ink-medium amount">{formatCurrency(amount)}</span>
      </div>
      <div className="w-full h-2 bg-paper-dark rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: total > 0 ? `${(amount / total) * 100}%` : "0%", backgroundColor: color }} />
      </div>
    </div>
  );
}
