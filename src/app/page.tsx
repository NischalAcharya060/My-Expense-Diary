"use client";

import { useSyncExternalStore } from "react";
import { format } from "date-fns";
import { Plus, ChevronRight, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useExpenses, useRecurringPayments, useBudgets, useCategories } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";
import type { Expense } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { expenses, loaded, getTodayTotal, getMonthTotal } = useExpenses();
  const { payments } = useRecurringPayments();
  const { getBudget } = useBudgets();
  const { getCategoryByName } = useCategories();
  const today = new Date();
  const { year, month } = getCurrentMonth();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  if (!mounted || authLoading) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-4 w-32 bg-paper-dark rounded" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-paper-dark rounded" />
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-4 w-32 bg-paper-dark rounded" />
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
  const budget = getBudget(year, month);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - monthTotal;
  
  const upcomingPayments = payments
    .filter((p) => p.is_active)
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 3);

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        {/* Date header */}
        <div className="mb-8 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <h1 className="font-handwritten text-4xl sm:text-5xl text-ink-dark mb-1 leading-tight">
            {format(today, "MMMM d, yyyy")}
          </h1>
          <p className="text-ink-light text-sm font-semibold tracking-wider uppercase font-sans">
            {format(today, "EEEE")}
          </p>
        </div>

        {/* Quick stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pt-2">
          {/* Card 1 */}
          <div className="paper-card px-4 py-3 relative rotate-[-1.5deg] hover:rotate-0 transition-transform shadow duration-200">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Today</p>
            <p className="font-handwritten text-3xl text-accent-warm amount font-semibold">{formatCurrency(todayTotal)}</p>
          </div>
          
          {/* Card 2 */}
          <div className="paper-card px-4 py-3 relative rotate-[1deg] hover:rotate-0 transition-transform shadow duration-200">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 -rotate-2 shadow-sm rounded-sm pointer-events-none" />
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">This Month</p>
            <p className="font-handwritten text-3xl text-ink-dark amount font-semibold">{formatCurrency(monthTotal)}</p>
          </div>

          {/* Card 3 */}
          {budgetAmount > 0 ? (
            <div className={`paper-card px-4 py-3 relative rotate-[-0.5deg] hover:rotate-0 transition-transform shadow duration-200 ${remaining < 0 ? "border-l-4 border-l-accent-red" : ""}`}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
              <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold mb-1">Remaining</p>
              <p className={`font-handwritten text-3xl amount font-semibold ${remaining < 0 ? "text-accent-red" : "text-accent-green"}`}>
                {formatCurrency(Math.abs(remaining))}
                {remaining < 0 && <span className="text-xs block sm:inline font-sans font-normal text-accent-red ml-1">over</span>}
              </p>
            </div>
          ) : (
            <Link href="/settings" className="paper-card px-4 py-3 relative rotate-[-0.5deg] hover:rotate-0 transition-transform shadow duration-200 border-dashed border-ink-light/40 flex flex-col justify-center items-center group">
              <span className="text-xs text-ink-light group-hover:text-accent-warm transition-colors font-medium">No Budget Set</span>
              <span className="text-[10px] text-accent-warm mt-1 font-bold group-hover:underline">Set Budget →</span>
            </Link>
          )}
        </div>

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
        {upcomingPayments.length > 0 && (
          <div className="paper-card p-6 mb-8 relative rotate-[-0.5deg]">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.04)] pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={20} className="text-accent-warm" />
                <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark">Upcoming Bills & Subs</h2>
              </div>
              <Link href="/bills" className="text-xs text-accent-warm hover:underline font-bold">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.02)] last:border-0 hover:bg-paper-dark/30 px-2 rounded transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">{p.category === "Subscription" ? "📺" : "💡"}</span>
                    <div>
                      <p className="text-sm text-ink-dark font-semibold leading-tight">{p.name}</p>
                      <p className="text-[10px] text-ink-light mt-0.5">
                        Due on day {p.due_day} {p.auto_pay && "· ⏰ Auto-Pay"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-medium amount shrink-0">
                    {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
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
            <p className="text-center text-ink-light font-handwritten text-lg py-4">
              Your expense diary is empty. Start writing!
            </p>
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

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
    </div>
  );
}

function ExpenseEntry({ expense }: { expense: Expense }) {
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
}

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
          <div className="p-6 bg-[#FEF9C3] rounded-lg shadow rotate-[-1.5deg] relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[-1deg] rounded-sm pointer-events-none" />
            <h3 className="font-handwritten text-xl font-bold text-ink-dark mb-2">✍️ Cozy Cursive Journal</h3>
            <p className="text-xs text-ink-medium leading-relaxed font-medium">
              Designed to look and feel like a handwritten paper journal. Fully responsive, cozy warm tones, and dynamic dark mode settings.
            </p>
          </div>

          <div className="p-6 bg-[#DCFCE7] rounded-lg shadow rotate-[1deg] relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[2deg] rounded-sm pointer-events-none" />
            <h3 className="font-handwritten text-xl font-bold text-ink-dark mb-2">⏰ Scheduled Auto-Pay</h3>
            <p className="text-xs text-ink-medium leading-relaxed font-medium">
              Track utility bills or Netflix subscriptions. Opt-in to Schedule Pay to log them automatically as expenses on due dates.
            </p>
          </div>

          <div className="p-6 bg-[#DBEAFE] rounded-lg shadow rotate-[-0.5deg] relative">
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
