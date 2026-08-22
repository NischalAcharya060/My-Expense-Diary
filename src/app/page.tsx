"use client";

import { useSyncExternalStore, memo, useState, useEffect } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { Plus, ChevronRight, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useExpenses, useRecurringPayments, useBudgets, useCategories, useIncome } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";
import { getUpcomingBills, getDueBadge } from "@/lib/reminders";
import type { Expense } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import BudgetBar from "@/components/BudgetBar";
import ProgressRing from "@/components/ProgressRing";

const AddExpenseModal = dynamic(() => import("@/components/AddExpenseModal"), { ssr: false });

export default function DashboardPage() {
  const { user, loading: authLoading, isConfigured, completeOnboarding } = useAuth();
  const { expenses, loaded, getTodayTotal, getMonthTotal } = useExpenses();
  const { payments } = useRecurringPayments();
  const { budgets, getBudget } = useBudgets();
  const { getCategoryByName } = useCategories();
  const { getMonthIncome } = useIncome();
  const today = new Date();
  const { year, month } = getCurrentMonth();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  // First-time user experience: route brand-new users through onboarding once.
  // Users who already have data (pre-onboarding accounts) are silently marked onboarded.
  useEffect(() => {
    if (!mounted || authLoading || !isConfigured || !user || !loaded) return;
    if (user.user_metadata?.onboarded) return;
    if (expenses.length > 0) {
      completeOnboarding();
    } else {
      router.replace("/onboarding");
    }
  }, [mounted, authLoading, isConfigured, user, loaded, expenses.length, completeOnboarding, router]);

  if (!mounted || authLoading) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="mb-8 border-b border-[rgba(0,0,0,0.06)] pb-4 space-y-2">
            <div className="shimmer h-11 w-64 rounded" />
            <div className="shimmer h-3 w-24 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`shimmer h-[76px] rounded ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render guest marketing landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  // Wait for database values to resolve once authenticated
  if (!loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="mb-8 border-b border-[rgba(0,0,0,0.06)] pb-4 space-y-2">
            <div className="shimmer h-11 w-64 rounded" />
            <div className="shimmer h-3 w-24 rounded" />
          </div>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`paper-card px-4 py-3 ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}>
                <div className={`shimmer h-2.5 rounded mb-2 ${["w-10", "w-14", "w-12", "w-16"][i - 1]}`} />
                <div className="shimmer h-7 w-full max-w-[90px] rounded" />
              </div>
            ))}
          </div>
          {/* Today's entries card */}
          <div className="paper-card p-6 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] pb-3">
              <div className="shimmer h-6 w-40 rounded" />
              <div className="shimmer h-7 w-24 rounded" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-5 rounded" style={{ width: `${88 - i * 18}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayStr = today.toISOString().split("T")[0];
  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const todayTotal = getTodayTotal();
  const monthTotal = getMonthTotal(year, month);
  const monthIncome = getMonthIncome(year, month);
  const netBalance = monthIncome - monthTotal;
  const budget = getBudget(year, month);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - monthTotal;
  
  const upcomingBills = getUpcomingBills(payments, expenses, todayStr).slice(0, 5);

  // Budget + savings progress values
  const budgetPct = budgetAmount > 0 ? (monthTotal / budgetAmount) * 100 : 0;
  const savingsRate = monthIncome > 0 ? (netBalance / monthIncome) * 100 : 0;
  const savingsRateDisplay = Math.round(Math.min(Math.max(savingsRate, 0), 100));

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        {/* Date header */}
        <div className="mb-8 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient">
          <h1 className="font-handwritten text-4xl sm:text-5xl text-ink-dark mb-1 leading-tight">
            {format(today, "MMMM d, yyyy")}
          </h1>
          <p className="text-ink-light text-sm font-semibold tracking-wider uppercase font-sans">
            {format(today, "EEEE")}
          </p>
        </div>

        {/* Quick stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 pt-2">
          {/* Today */}
          <div className="paper-card px-4 py-3 relative rotate-[-1.5deg] hover:rotate-0 transition-transform shadow duration-200">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Today</p>
            <p className="font-handwritten text-2xl sm:text-3xl text-accent-warm amount font-semibold">{formatCurrency(todayTotal)}</p>
          </div>
          
          {/* Income */}
          <div className="paper-card px-4 py-3 relative rotate-[0.5deg] hover:rotate-0 transition-transform shadow duration-200">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 -rotate-2 shadow-sm rounded-sm pointer-events-none" />
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Income</p>
            <p className="font-handwritten text-2xl sm:text-3xl text-accent-green amount font-semibold">{formatCurrency(monthIncome)}</p>
          </div>

          {/* Expenses */}
          <div className="paper-card px-4 py-3 relative rotate-[1deg] hover:rotate-0 transition-transform shadow duration-200">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Expenses</p>
            <p className="font-handwritten text-2xl sm:text-3xl text-ink-dark amount font-semibold">{formatCurrency(monthTotal)}</p>
          </div>

          {/* Net Balance / Remaining */}
          {budgetAmount > 0 ? (
            <div className={`paper-card px-4 py-3 relative rotate-[-0.5deg] hover:rotate-0 transition-transform shadow duration-200 ${remaining < 0 ? "border-l-4 border-l-accent-red" : ""}`}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 -rotate-1 shadow-sm rounded-sm pointer-events-none" />
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Remaining</p>
              <p className={`font-handwritten text-2xl sm:text-3xl amount font-semibold ${remaining < 0 ? "text-accent-red" : "text-accent-green"}`}>
                {formatCurrency(Math.abs(remaining))}
                {remaining < 0 && <span className="text-[10px] block sm:inline font-sans font-normal text-accent-red ml-1">over</span>}
              </p>
            </div>
          ) : (
            <div className={`paper-card px-4 py-3 relative rotate-[-0.5deg] hover:rotate-0 transition-transform shadow duration-200 ${netBalance < 0 ? "border-l-4 border-l-accent-red" : ""}`}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 -rotate-1 shadow-sm rounded-sm pointer-events-none" />
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Net Balance</p>
              <p className={`font-handwritten text-2xl sm:text-3xl amount font-semibold ${netBalance < 0 ? "text-accent-red" : "text-accent-green"}`}>
                {formatCurrency(Math.abs(netBalance))}
                {netBalance < 0 && <span className="text-[10px] block sm:inline font-sans font-normal text-accent-red ml-1">deficit</span>}
              </p>
            </div>
          )}
        </div>

        {/* Monthly budget & savings */}
        {(budgetAmount > 0 || monthIncome > 0) && (
          <div className="paper-card p-6 mb-8 relative rotate-[0.5deg]">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.04)] pb-3">
              <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark">Budget &amp; Savings</h2>
              <Link href="/settings" className="text-xs text-accent-warm hover:underline font-bold">
                Manage →
              </Link>
            </div>
            <div className="flex items-center gap-8 flex-wrap justify-between">
              {budgetAmount > 0 && (
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-ink-medium font-semibold">Monthly budget</span>
                    <span
                      className={`font-bold amount ${budgetPct >= 100 ? "text-accent-red" : budgetPct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-ink-medium"}`}
                    >
                      {Math.round(budgetPct)}% used
                    </span>
                  </div>
                  <BudgetBar pct={budgetPct} label="Monthly budget usage" />
                  <p className="text-[10px] text-ink-light mt-1.5 amount">
                    {formatCurrency(monthTotal)} of {formatCurrency(budgetAmount)} ·{" "}
                    {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                  </p>
                </div>
              )}
              {monthIncome > 0 && (
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <ProgressRing
                    pct={savingsRate}
                    color={netBalance >= 0 ? "var(--accent-green)" : "var(--accent-red)"}
                    label={`Savings rate ${savingsRateDisplay}% of income`}
                    size={76}
                  >
                    <span className={`text-sm font-bold amount ${netBalance >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {savingsRateDisplay}%
                    </span>
                  </ProgressRing>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-ink-light mb-0.5">Saved</p>
                    <p className={`font-handwritten text-xl amount font-semibold leading-none ${netBalance >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {formatCurrency(netBalance)}
                    </p>
                    <p className="text-[10px] text-ink-light mt-1">of {formatCurrency(monthIncome)} income</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's entries */}
        <div className="paper-card p-6 mb-8 relative rotate-[0.5deg]">
          <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.04)] pb-3">
            <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark">Today&apos;s Entries</h2>
            <Link
              href="/expenses?add=true"
              onClick={(e) => { e.preventDefault(); requireAuth(() => router.push("/expenses?add=true")); }}
              className="flex items-center gap-1 px-3 py-1 bg-accent-warm text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Plus size={14} /> Add Entry
            </Link>
          </div>

          {todayExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-handwritten text-xl text-ink-light/60">No entries yet today</p>
              <p className="text-xs text-ink-light mt-1">Record your first expense by clicking Add</p>
            </div>
          ) : (
            <div className="space-y-1">
              {todayExpenses.map((expense) => (
                <ExpenseEntry key={expense.id} expense={expense} />
              ))}
              <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)] flex items-center">
                <span className="font-handwritten text-xl text-ink-medium font-medium">Today&apos;s Total</span>
                <span className="dots" />
                <span className="font-handwritten text-2xl text-accent-warm amount font-bold">
                  {formatCurrency(todayTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming bills */}
        {upcomingBills.length > 0 && (
          <div className="paper-card p-6 mb-8 relative rotate-[-0.5deg]">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.04)] pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={20} className="text-accent-warm" />
                <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark">Upcoming Bills &amp; Subs</h2>
              </div>
              <Link href="/bills" className="text-xs text-accent-warm hover:underline font-bold">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingBills.map(({ payment: p, dueDateStr, daysUntil }) => {
                const badge = getDueBadge({ payment: p, dueDateStr, daysUntil, isPaid: false });
                return (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.02)] last:border-0 hover:bg-paper-dark/30 px-2 rounded transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{p.category === "Subscription" ? "📺" : "💡"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-ink-dark font-semibold leading-tight">{p.name}</p>
                          {badge && <span className={badge.className}>{badge.label}</span>}
                        </div>
                        <p className="text-[10px] text-ink-light mt-0.5">
                          Due {format(new Date(`${dueDateStr}T00:00:00`), "MMM d")} {p.auto_pay && "· ⏰ Auto-Pay"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink-medium amount shrink-0 ml-2">
                      {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent expenses */}
        <div className="paper-card p-6 relative rotate-[0.5deg]">
          <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.04)] pb-3">
            <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark">Recent Activity</h2>
            <Link
              href="/expenses"
              className="flex items-center gap-0.5 text-xs text-accent-warm hover:underline font-bold"
            >
              View Journal <ChevronRight size={14} />
            </Link>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-10">
              <div className="animate-floaty text-6xl mb-3" aria-hidden="true">📓</div>
              <p className="font-handwritten text-2xl text-ink-dark font-semibold">Your diary is empty!</p>
              <p className="text-xs text-ink-light mt-1.5 max-w-xs mx-auto leading-relaxed">
                Every entry is a line in your journal. Write your first one — it takes 10 seconds.
              </p>
              <button
                onClick={() => requireAuth(() => setShowAdd(true))}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                <Plus size={16} /> Add First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {expenses.slice(0, 5).map((expense) => {
                const catColor = getCategoryByName(expense.category)?.color || "#6B7280";
                return (
                  <div key={expense.id} className="flex items-center py-2.5 border-b border-[rgba(0,0,0,0.03)] last:border-0 hover:bg-paper-dark/30 px-2 rounded transition-colors font-medium">
                    <span className="text-lg mr-3 shrink-0">{getCategoryByName(expense.category)?.icon || "🏷️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-dark font-semibold truncate">{expense.name}</p>
                      <p className="text-[10px] text-ink-light mt-0.5">
                        {expense.category} · {format(new Date(expense.date), "MMM d")}
                      </p>
                    </div>
                    <span className="text-sm font-bold amount ml-2 shrink-0" style={{ color: catColor }}>
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddExpenseModal open onClose={() => setShowAdd(false)} />}
      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
    </div>
  );
}

const ExpenseEntry = memo(function ExpenseEntry({ expense }: { expense: Expense }) {
  const { getCategoryByName } = useCategories();
  const color = getCategoryByName(expense.category)?.color || "#6B7280";
  return (
    <div className="handwritten-entry flex items-baseline group hover:bg-paper-dark/30 px-2 py-0.5 rounded transition-all">
      <span className="text-base mr-1.5 shrink-0">{getCategoryByName(expense.category)?.icon || "🏷️"}</span>
      <span className="text-ink-dark font-semibold leading-relaxed">{expense.name}</span>
      <span className="dots" />
      <span className="text-ink-medium amount whitespace-nowrap font-bold" style={{ color }}>
        {formatCurrency(expense.amount)}
      </span>
    </div>
  );
});

// Guest Marketing Landing Page Component
function LandingPage() {
  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 pt-24 lg:pl-20 text-center">
        
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-accent-warm uppercase tracking-widest bg-accent-warm/10 px-3 py-1.5 rounded-full border border-accent-warm/15">
            ✍️ Your Cozy Personal Finance Diary
          </span>
          <h1 className="font-handwritten text-5xl sm:text-6xl text-ink-dark mt-6 mb-4 leading-tight">
            Keep a cozy journal of your daily expenses
          </h1>
          <p className="text-sm sm:text-base text-ink-medium leading-relaxed font-semibold">
            Say goodbye to rigid grids and complex tables. Log your spending like writing in a cozy paper notebook, with scheduled bills, auto-pay tracking, and clean sticky notes.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-accent-warm hover:opacity-90 text-white font-bold rounded-xl text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Open Your Diary — It&apos;s Free
          </Link>
        </div>

        {/* Mock Diary Preview */}
        <div className="paper-card p-6 max-w-md mx-auto mb-16 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 relative shadow-lg">
          {/* Simulated clear tape */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3 mb-4">
            <h3 className="font-handwritten text-2xl text-ink-dark font-bold">Wednesday, August 19</h3>
            <span className="text-xs text-ink-light font-bold uppercase tracking-wider font-sans">Total: $82</span>
          </div>
          <div className="space-y-3 text-left">
            <div className="handwritten-entry flex items-baseline">
              <span className="text-base mr-1.5">🍔</span>
              <span className="text-ink-dark font-medium">Cozy Coffee & Lunch</span>
              <span className="dots" />
              <span className="text-ink-medium amount font-bold text-accent-warm">$18.50</span>
            </div>
            <div className="handwritten-entry flex items-baseline">
              <span className="text-base mr-1.5">🛒</span>
              <span className="text-ink-dark font-medium">Weekly Groceries</span>
              <span className="dots" />
              <span className="text-ink-medium amount font-bold text-accent-warm">$63.50</span>
            </div>
            <div className="handwritten-entry flex items-baseline opacity-40">
              <span className="text-base mr-1.5">🎬</span>
              <span className="text-ink-dark font-medium">Cinema Ticket (Pre-planned)</span>
              <span className="dots" />
              <span className="text-ink-medium amount font-bold text-accent-warm">$12.00</span>
            </div>
          </div>
        </div>

        {/* Features list in sticky notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-16">
          <div className="p-6 bg-[#FEF9C3] dark:bg-[#3D3520] rounded-lg shadow rotate-[-1.5deg] relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[-1deg] rounded-sm pointer-events-none" />
            <h3 className="font-handwritten text-xl font-bold text-ink-dark mb-2">✍️ Cozy Cursive Journal</h3>
            <p className="text-xs text-ink-medium leading-relaxed font-medium">
              Designed to look and feel like a handwritten paper journal. Fully responsive, cozy warm tones, and dynamic dark mode settings.
            </p>
          </div>

          <div className="p-6 bg-[#DCFCE7] dark:bg-[#1A3325] rounded-lg shadow rotate-[1deg] relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[2deg] rounded-sm pointer-events-none" />
            <h3 className="font-handwritten text-xl font-bold text-ink-dark mb-2">⏰ Scheduled Auto-Pay</h3>
            <p className="text-xs text-ink-medium leading-relaxed font-medium">
              Track utility bills or Netflix subscriptions. Opt-in to Schedule Pay to log them automatically as expenses on due dates.
            </p>
          </div>

          <div className="p-6 bg-[#DBEAFE] dark:bg-[#1A2538] rounded-lg shadow rotate-[-0.5deg] relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[-2deg] rounded-sm pointer-events-none" />
            <h3 className="font-handwritten text-xl font-bold text-ink-dark mb-2">📌 Checklist & Sticky Notes</h3>
            <p className="text-xs text-ink-medium leading-relaxed font-medium">
              Jot down shopping lists, note dynamic budgeting guidelines, or pin quick lists right on your corkboard.
            </p>
          </div>
        </div>

        {/* CTA closing card */}
        <div className="max-w-xl mx-auto border-t border-[rgba(0,0,0,0.06)] pt-12">
          <h3 className="font-handwritten text-3xl text-ink-dark mb-2 font-bold">Start your finance journal today</h3>
          <p className="text-xs text-ink-light mb-6 font-medium">Join now. Securely syncs your budgets and notes across all devices.</p>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            Create Your Account
          </Link>
        </div>

      </div>
    </div>
  );
}
