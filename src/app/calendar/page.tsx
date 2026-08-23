"use client";

import { useSyncExternalStore, useState } from "react";
import dynamic from "next/dynamic";
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
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenses, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import BackButton from "@/components/BackButton";

const DayDetailDrawer = dynamic(() => import("@/components/DayDetailDrawer"), { ssr: false });
const AddExpenseModal = dynamic(() => import("@/components/AddExpenseModal"), { ssr: false });

// A day counts as "high spending" when its total is at least this
// multiple of the average spend across days that had any expenses.
const HIGH_SPEND_FACTOR = 1.75;

export default function CalendarPage() {
  const { expenses, loaded, deleteExpense } = useExpenses();
  const { getCategoryByName } = useCategories();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Direction of the last month change: 1 = forward, -1 = back, 0 = initial load.
  const [monthDir, setMonthDir] = useState<-1 | 0 | 1>(0);
  const [showAdd, setShowAdd] = useState(false);
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

  const changeMonth = (delta: -1 | 1) => {
    setMonthDir(delta);
    setCurrentDate((d) => addMonths(d, delta));
    setSelectedDate(null);
  };

  const goToday = () => {
    const today = new Date();
    setMonthDir(format(today, "yyyy-MM") < format(currentDate, "yyyy-MM") ? -1 : 1);
    setCurrentDate(today);
    setSelectedDate(null);
  };

  // Jumping days from the drawer may cross a month boundary — keep the
  // grid (and its slide direction) in sync.
  const navigateToDay = (dateStr: string) => {
    const next = new Date(dateStr + "T00:00:00");
    setMonthDir(format(next, "yyyy-MM") >= format(currentDate, "yyyy-MM") ? 1 : -1);
    if (!isSameMonth(next, currentDate)) setCurrentDate(startOfMonth(next));
    setSelectedDate(dateStr);
  };

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

  // Threshold for the high-spending red dot: average daily spend across
  // days that actually had expenses in the displayed month.
  const spendingDayTotals = Array.from(
    new Set(expenses.filter((e) => e.date.startsWith(format(currentDate, "yyyy-MM"))).map((e) => e.date))
  ).map((d) =>
    expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0)
  );
  const avgSpendingDay =
    spendingDayTotals.length > 0
      ? spendingDayTotals.reduce((s, t) => s + t, 0) / spendingDayTotals.length
      : 0;
  const highSpendThreshold = avgSpendingDay * HIGH_SPEND_FACTOR;

  const isViewingCurrentMonth = isSameMonth(currentDate, new Date());
  const monthKey = format(currentDate, "yyyy-MM");

  return (
    <AuthGuard feature="expense calendar">
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient">
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark">Expense Calendar</h1>
              <p className="text-xs text-ink-light mt-0.5">Visualize your cash flow calendar month by month.</p>
            </div>
          </div>
        </div>

        {/* Month navigation card */}
        <div className="paper-card p-4 mb-6 relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
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
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>

          {/* Quick jump back to the current month */}
          {!isViewingCurrentMonth && (
            <div className="flex justify-center mb-3">
              <button
                onClick={goToday}
                className="flex items-center gap-1.5 px-3 h-8 text-xs font-semibold text-accent-warm border border-accent-warm/40 bg-accent-warm/10 rounded-full hover:bg-accent-warm/20 active:scale-95 transition-all cursor-pointer"
                aria-label="Jump back to current month"
              >
                <CalendarDays size={13} />
                Today
              </button>
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 border-b border-[rgba(0,0,0,0.04)] pb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] text-ink-light font-bold uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Empty prompt when no expenses exist at all */}
        {expenses.length === 0 && (
          <div className="paper-card p-8 text-center mb-6">
            <span className="text-5xl block mb-2">🗓️</span>
            <p className="font-handwritten text-2xl text-ink-dark font-semibold">Nothing on the calendar yet</p>
            <p className="text-xs text-ink-light mt-1.5 max-w-xs mx-auto leading-relaxed">
              This is your month. Tap any day below to add expenses — today is glowing to get you started.
            </p>
          </div>
        )}

        {/* Days Grid — remounts per month so the directional slide plays */}
          <div
            key={monthKey}
            className={`grid grid-cols-7 gap-1.5 ${monthDir > 0 ? "month-slide-next" : monthDir < 0 ? "month-slide-prev" : ""}`}
          >
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate === dateStr;
              const dayTotal = getDayTotal(day);
              const categoryIcons = getDayCategoryIcons(dateStr);
              const isHighSpend =
                isCurrentMonth && dayTotal > 0 && dayTotal >= highSpendThreshold;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  aria-pressed={isSelected}
                  className={`
                    relative p-2 rounded-lg text-left transition-all min-h-[56px] sm:min-h-[68px] flex flex-col justify-between cursor-pointer
                    ${!isCurrentMonth ? "opacity-25" : ""}
                    ${isToday ? (expenses.length === 0 ? "bg-accent-warm/10 ring-2 ring-accent-warm animate-pulse" : "bg-accent-warm/5 ring-1 ring-accent-warm") : "bg-paper-dark/20 border border-[rgba(0,0,0,0.02)]"}
                    ${isSelected ? "bg-accent-warm/15 ring-2 ring-accent-warm scale-[1.02] shadow-sm" : "hover:bg-paper-dark/45"}
                  `}
                >
                  <span className={`text-xs font-semibold ${isToday ? "text-accent-warm font-bold" : "text-ink-dark"}`}>
                    {format(day, "d")}
                  </span>

                  {/* High-spending day: red pulsing dot */}
                  {isHighSpend && (
                    <span
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-red pulse-dot"
                      title="High spending day"
                      aria-label="High spending day"
                    />
                  )}

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

                    {/* Quiet days: subtle gray dot so empty cells still feel alive */}
                    {isCurrentMonth && dayTotal === 0 && !isSelected && (
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink-light/25" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail drawer (slides in from the right) */}
        {selectedDate && (
          <DayDetailDrawer
            date={selectedDate}
            expenses={selectedExpenses}
            onClose={() => setSelectedDate(null)}
            onNavigateDay={navigateToDay}
            onDeleteExpense={deleteExpense}
            onAddExpense={() => setShowAdd(true)}
            navigationPaused={showAdd}
          />
        )}

        {showAdd && selectedDate && (
          <AddExpenseModal open onClose={() => setShowAdd(false)} defaultDate={selectedDate} />
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
