"use client";

import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenses, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export default function CalendarPage() {
  const { expenses, loaded, getExpensesByDate } = useExpenses();
  const { getCategoryByName } = useCategories();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayTotal = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return expenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
  };

  const selectedExpenses = selectedDate
    ? expenses
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    : [];

  const monthTotal = expenses
    .filter((e) => e.date.startsWith(format(currentDate, "yyyy-MM")))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark mb-6">Calendar</h1>

        {/* Month navigation */}
        <div className="paper-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-paper-dark rounded transition-colors"
            >
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <div className="text-center">
              <h2 className="font-handwritten text-2xl text-ink-dark">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <p className="text-xs text-ink-light mt-1">
                Total: <span className="text-accent-warm amount">{formatCurrency(monthTotal)}</span>
              </p>
            </div>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-paper-dark rounded transition-colors"
            >
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs text-ink-light font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate === dateStr;
              const dayTotal = getDayTotal(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    relative p-1.5 sm:p-2 rounded text-center transition-all min-h-[52px] sm:min-h-[64px]
                    ${!isCurrentMonth ? "opacity-30" : ""}
                    ${isToday ? "ring-1 ring-accent-warm" : ""}
                    ${isSelected ? "bg-accent-warm/10 ring-1 ring-accent-warm" : "hover:bg-paper-dark/50"}
                  `}
                >
                  <span className={`text-xs sm:text-sm ${isToday ? "font-bold text-accent-warm" : "text-ink-dark"}`}>
                    {format(day, "d")}
                  </span>
                  {dayTotal > 0 && isCurrentMonth && (
                    <span className="block text-[10px] sm:text-xs text-accent-red amount mt-0.5">
                      {formatCurrency(dayTotal)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day expenses */}
        {selectedDate && (
          <div className="paper-card p-6 page-enter">
            <h3 className="font-handwritten text-xl text-ink-dark mb-3">
              {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
            </h3>
            {selectedExpenses.length === 0 ? (
              <p className="text-ink-light text-sm text-center py-4">No expenses this day</p>
            ) : (
              <div className="space-y-2">
                {selectedExpenses.map((e) => (
                  <div key={e.id} className="flex items-center py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: getCategoryByName(e.category)?.color || "#6B7280" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-dark">{e.name}</p>
                      <p className="text-xs text-ink-light">{e.category}</p>
                    </div>
                    <span className="text-sm text-ink-medium amount">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
                <div className="pt-2 flex items-center">
                  <span className="text-sm text-ink-medium">Total</span>
                  <span className="dots" />
                  <span className="font-handwritten text-lg text-accent-warm amount">
                    {formatCurrency(selectedExpenses.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Groceries: "#16A34A", Food: "#EA580C", Transport: "#2563EB",
    Shopping: "#D946EF", Personal: "#8B5CF6", Medicine: "#DC2626",
    Education: "#0891B2", Entertainment: "#F59E0B", Household: "#64748B",
    Bills: "#E11D48", Subscription: "#7C3AED", Other: "#6B7280",
  };
  return colors[category] || "#6B7280";
}
