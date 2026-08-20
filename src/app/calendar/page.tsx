"use client";

import { useSyncExternalStore, useState } from "react";
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
import AuthGuard from "@/components/AuthGuard";

export default function CalendarPage() {
  const { expenses, loaded } = useExpenses();
  const { getCategoryByName } = useCategories();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayTotal = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return expenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
  };

  const getDayCategoryIcons = (dateStr: string): string[] => {
    const dayExpenses = expenses.filter((e) => e.date === dateStr);
    const uniqueCategories = Array.from(new Set(dayExpenses.map((e) => e.category)));
    return uniqueCategories.map((cat) => getCategoryByName(cat)?.icon || "📝");
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
    <AuthGuard feature="expense calendar">
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <h1 className="font-handwritten text-4xl text-ink-dark">Expense Calendar</h1>
          <p className="text-xs text-ink-light mt-0.5">Visualize your cash flow calendar month by month.</p>
        </div>

        {/* Month navigation card */}
        <div className="paper-card p-4 mb-6 relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setCurrentDate(subMonths(currentDate, 1));
                setSelectedDate(null);
              }}
              className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <div className="text-center">
              <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark font-semibold">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-semibold mt-0.5">
                Monthly Total: <span className="text-accent-warm amount font-bold">{formatCurrency(monthTotal)}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentDate(addMonths(currentDate, 1));
                setSelectedDate(null);
              }}
              className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 border-b border-[rgba(0,0,0,0.04)] pb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] text-ink-light font-bold uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate === dateStr;
              const dayTotal = getDayTotal(day);
              const categoryIcons = getDayCategoryIcons(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    relative p-2 rounded-lg text-left transition-all min-h-[56px] sm:min-h-[68px] flex flex-col justify-between cursor-pointer
                    ${!isCurrentMonth ? "opacity-25" : ""}
                    ${isToday ? "bg-accent-warm/5 ring-1 ring-accent-warm" : "bg-paper-dark/20 border border-[rgba(0,0,0,0.02)]"}
                    ${isSelected ? "bg-accent-warm/15 ring-2 ring-accent-warm scale-[1.02] shadow-sm" : "hover:bg-paper-dark/45"}
                  `}
                >
                  <span className={`text-xs font-semibold ${isToday ? "text-accent-warm font-bold" : "text-ink-dark"}`}>
                    {format(day, "d")}
                  </span>
                  
                  <div>
                    {dayTotal > 0 && isCurrentMonth && (
                      <span className="block text-[9px] sm:text-[10px] font-bold text-accent-red amount leading-none text-right truncate">
                        {formatCurrency(dayTotal)}
                      </span>
                    )}
                    
                    {/* Category Icons */}
                    {categoryIcons.length > 0 && isCurrentMonth && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-start">
                        {categoryIcons.slice(0, 4).map((icon, idx) => (
                          <span
                            key={idx}
                            className="text-[8px] sm:text-[9px] leading-none shrink-0"
                          >
                            {icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date detail ledger sheet */}
        {selectedDate && (
          <div className="paper-card p-6 page-enter border-t-4 border-t-accent-warm relative">
            {/* Folder notch corner */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-accent-warm/20 to-transparent" />
            <h3 className="font-handwritten text-xl sm:text-2xl text-ink-dark mb-4 border-b border-[rgba(0,0,0,0.04)] pb-2 font-semibold">
              📓 {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
            </h3>
            
            {selectedExpenses.length === 0 ? (
              <p className="text-ink-light text-sm text-center py-6 italic font-handwritten text-lg">
                No ledger entries for this date.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedExpenses.map((e) => {
                  const cat = getCategoryByName(e.category);
                  const catColor = cat?.color || "#6B7280";
                  const catIcon = cat?.icon || "📝";
                  return (
                    <div key={e.id} className="flex items-center py-1.5 border-b border-[rgba(0,0,0,0.02)] last:border-0 hover:bg-paper-dark/30 px-2 rounded transition-colors">
                      <span className="text-sm mr-3 shrink-0">{catIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-dark truncate">{e.name}</p>
                        <p className="text-[10px] text-ink-light">{e.category} · {e.payment_method}</p>
                      </div>
                      <span className="text-sm font-bold amount ml-2" style={{ color: catColor }}>
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  );
                })}
                
                <div className="pt-2 border-t border-[rgba(0,0,0,0.06)] flex items-center">
                  <span className="text-sm font-semibold text-ink-medium">Daily total</span>
                  <span className="dots" />
                  <span className="font-handwritten text-2xl text-accent-warm amount font-bold">
                    {formatCurrency(selectedExpenses.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
