"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit2, Calendar, CreditCard, 
  CheckCircle2, AlertCircle, Clock, History
} from "lucide-react";
import { useExpenses, useRecurringPayments, useCategories } from "@/lib/store";
import { formatCurrency, getToday, getCurrentMonth } from "@/lib/utils";
import AddBillModal from "@/components/AddBillModal";
import { format, differenceInDays } from "date-fns";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import { useToast } from "@/components/Toast";
import type { RecurringPayment } from "@/types";

export default function BillsPage() {
  const { expenses, loaded: expensesLoaded, addExpense, deleteExpense } = useExpenses();
  const { payments, loaded: paymentsLoaded, deletePayment, updatePayment } = useRecurringPayments();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "history">("list");
  const [mounted, setMounted] = useState(false);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();

  useEffect(() => setMounted(true), []);

  if (!mounted || !expensesLoaded || !paymentsLoaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-paper-dark rounded" />)}
        </div>
      </div>
    );
  }

  const todayStr = getToday();
  const today = new Date(todayStr);
  const { year, month } = getCurrentMonth();
  const currentMonthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const billExpenses = expenses.filter(
    (e) => e.expense_type === "Bill" || e.expense_type === "Subscription" || e.recurring_payment_id
  );
  
  const currentMonthBillExpenses = billExpenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const totalPaidThisMonth = currentMonthBillExpenses.reduce((s, e) => s + e.amount, 0);

  const activePayments = payments.filter((p) => p.is_active);
  const inactivePayments = payments.filter((p) => !p.is_active);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  const processedPayments = activePayments.map((p) => {
    const daysInCurrMonth = getDaysInMonth(year, month - 1);
    const dueDayChecked = Math.min(p.due_day, daysInCurrMonth);
    const dueDateStr = `${year}-${String(month).padStart(2, "0")}-${String(dueDayChecked).padStart(2, "0")}`;
    const dueDate = new Date(dueDateStr);

    const hasLoggedExpense = currentMonthBillExpenses.some((e) => e.recurring_payment_id === p.id);
    const isPaid = !!((p.last_paid && p.last_paid.startsWith(currentMonthPrefix)) || hasLoggedExpense);
    const loggedExpense = currentMonthBillExpenses.find((e) => e.recurring_payment_id === p.id);

    return {
      payment: p,
      dueDateStr,
      dueDate,
      isPaid,
      loggedExpense,
    };
  });

  const paidBills = processedPayments.filter((p) => p.isPaid);
  const unpaidBills = processedPayments.filter((p) => !p.isPaid);

  const dueBills = unpaidBills.filter((p) => p.dueDate <= today);
  const upcomingBills = unpaidBills.filter((p) => p.dueDate > today);

  const estimatedMonthlyTotal = activePayments.reduce((s, p) => s + (p.is_variable ? 0 : p.amount), 0);
  const remainingDueTotal = unpaidBills.reduce((s, p) => s + (p.payment.is_variable ? 0 : p.payment.amount), 0);

  const nextUpcoming = upcomingBills.length > 0 
    ? [...upcomingBills].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]
    : dueBills.length > 0
    ? [...dueBills].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0]
    : null;

  const handlePayNow = async (p: RecurringPayment, dueDateStr: string) => {
    let amountToPay = p.amount;

    if (p.is_variable) {
      const input = prompt(`Enter variable bill amount for ${p.name}:`, "");
      if (input === null) return;
      const parsed = parseFloat(input);
      if (isNaN(parsed) || parsed <= 0) {
        toast("Please enter a valid amount", "error");
        return;
      }
      amountToPay = parsed;
    }

    try {
      await addExpense({
        user_id: "",
        name: p.name,
        amount: amountToPay,
        category: p.category,
        date: dueDateStr <= todayStr ? dueDateStr : todayStr,
        payment_method: p.payment_method || "Card",
        expense_type: p.category === "Subscription" ? "Subscription" : "Bill",
        recurring_payment_id: p.id,
        note: `Manual payment via Bills & Subs dashboard`,
      });

      await updatePayment(p.id, { 
        last_paid: dueDateStr <= todayStr ? dueDateStr : todayStr 
      });

      toast(`Successfully paid ${p.name}`);
    } catch (err) {
      console.error(err);
      toast("Failed to log payment", "error");
    }
  };

  const handleDeactivate = async (p: RecurringPayment) => {
    try {
      await updatePayment(p.id, { is_active: false });
      toast(`Deactivated ${p.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async (p: RecurringPayment) => {
    try {
      await updatePayment(p.id, { is_active: true });
      toast(`Activated ${p.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring payment?")) return;
    try {
      await deletePayment(id);
      toast("Recurring payment deleted");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-handwritten text-4xl text-ink-dark">Bills & Subscriptions</h1>
            <p className="text-xs text-ink-light mt-1">Manage scheduled bills, active subscriptions, and automatic payments.</p>
          </div>
          <button 
            onClick={() => requireAuth(() => { setEditingPayment(null); setShowAddModal(true); })}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto shadow-md"
          >
            <Plus size={16} /> Add Bill / Subscription
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="paper-card p-4">
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-semibold">Monthly Total</p>
            <p className="font-handwritten text-2xl text-accent-warm amount mt-1 font-bold">
              {formatCurrency(estimatedMonthlyTotal)}
            </p>
            <p className="text-[9px] text-ink-light mt-0.5">*Excludes variable</p>
          </div>

          <div className="paper-card p-4">
            <p className="text-[10px] text-accent-green uppercase tracking-wider font-semibold">Total Paid</p>
            <p className="font-handwritten text-2xl text-accent-green amount mt-1 font-bold">
              {formatCurrency(totalPaidThisMonth)}
            </p>
            <p className="text-[9px] text-ink-light mt-0.5">Logged this month</p>
          </div>

          <div className="paper-card p-4">
            <p className="text-[10px] text-ink-medium uppercase tracking-wider font-semibold">Remaining Due</p>
            <p className="font-handwritten text-2xl text-ink-dark amount mt-1 font-bold">
              {formatCurrency(remainingDueTotal)}
            </p>
            <p className="text-[9px] text-ink-light mt-0.5">Unpaid active items</p>
          </div>

          <div className="paper-card p-4 bg-accent-warm/5 border-accent-warm/20">
            <p className="text-[10px] text-accent-warm uppercase tracking-wider font-semibold">Next Upcoming</p>
            {nextUpcoming ? (
              <>
                <p className="font-semibold text-sm text-ink-dark truncate mt-1">
                  {nextUpcoming.payment.name}
                </p>
                <p className="text-[10px] text-ink-medium mt-0.5">
                  Due {format(nextUpcoming.dueDate, "MMM d")} ({differenceInDays(nextUpcoming.dueDate, today)}d left)
                </p>
              </>
            ) : (
              <p className="text-xs text-ink-light italic mt-2">No upcoming bills</p>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[rgba(0,0,0,0.06)] mb-6">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "list"
                ? "border-accent-warm text-accent-warm"
                : "border-transparent text-ink-light hover:text-ink-medium"
            }`}
          >
            <Calendar size={16} /> All Bills & Subs ({activePayments.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "border-accent-warm text-accent-warm"
                : "border-transparent text-ink-light hover:text-ink-medium"
            }`}
          >
            <History size={16} /> Payment History ({billExpenses.length})
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "list" ? (
          <div className="space-y-6">
            
            {/* Overdue / Due section */}
            {dueBills.length > 0 && (
              <div>
                <h3 className="font-handwritten text-xl text-accent-red flex items-center gap-1.5 mb-3">
                  <AlertCircle size={18} /> Action Required / Due
                </h3>
                <div className="space-y-3">
                  {dueBills.map(({ payment: p, dueDateStr }) => (
                    <div key={p.id} className="paper-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-accent-red">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-0.5">
                          {p.category === "Subscription" ? "📺" : "💡"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-ink-dark">{p.name}</span>
                            <span className="text-[10px] bg-paper-dark border border-[rgba(0,0,0,0.08)] text-ink-medium px-2 py-0.5 rounded-full uppercase">
                              {p.frequency}
                            </span>
                            {p.auto_pay && (
                              <span className="text-[10px] bg-accent-green/10 text-accent-green border border-accent-green/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                ⏰ Auto-Pay
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-accent-red font-medium mt-1">
                            Due Day: {p.due_day} · Overdue since {format(new Date(dueDateStr), "MMM d, yyyy")}
                          </p>
                          <p className="text-[10px] text-ink-light mt-0.5">
                            Method: {p.payment_method || "Card"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[rgba(0,0,0,0.04)]">
                        <div className="text-left sm:text-right">
                          <span className="text-base font-bold text-accent-red amount block">
                            {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePayNow(p, dueDateStr)}
                            className="px-3 py-1.5 bg-accent-green hover:opacity-90 text-white rounded text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            Pay Now
                          </button>
                          <button
                            onClick={() => { setEditingPayment(p); setShowAddModal(true); }}
                            className="p-2 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(p)}
                            className="p-2 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                            title="Deactivate"
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Section */}
            <div>
              <h3 className="font-handwritten text-xl text-ink-dark flex items-center gap-1.5 mb-3">
                <Clock size={18} className="text-ink-medium" /> Upcoming Payments
              </h3>
              {upcomingBills.length > 0 ? (
                <div className="space-y-2">
                  {upcomingBills.map(({ payment: p, dueDateStr, dueDate }) => (
                    <div key={p.id} className="paper-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-accent-blue">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-0.5">
                          {p.category === "Subscription" ? "📺" : "💡"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-ink-dark">{p.name}</span>
                            <span className="text-[10px] bg-paper-dark border border-[rgba(0,0,0,0.08)] text-ink-medium px-2 py-0.5 rounded-full uppercase">
                              {p.frequency}
                            </span>
                            {p.auto_pay && (
                              <span className="text-[10px] bg-accent-green/10 text-accent-green border border-accent-green/20 px-2 py-0.5 rounded-full font-medium">
                                ⏰ Auto-Pay
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-medium mt-1">
                            Due on {format(dueDate, "MMMM d, yyyy")} ({differenceInDays(dueDate, today)} days left)
                          </p>
                          <p className="text-[10px] text-ink-light mt-0.5">
                            Method: {p.payment_method || "Card"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[rgba(0,0,0,0.04)]">
                        <div className="text-left sm:text-right">
                          <span className="text-sm font-semibold text-ink-dark amount block">
                            {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePayNow(p, dueDateStr)}
                            className="px-2.5 py-1 bg-paper-dark border border-[rgba(0,0,0,0.1)] hover:bg-paper-dark/80 text-ink-medium hover:text-ink-dark rounded text-xs font-semibold cursor-pointer"
                          >
                            Pay Early
                          </button>
                          <button
                            onClick={() => { setEditingPayment(p); setShowAddModal(true); }}
                            className="p-2 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(p)}
                            className="p-2 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                            title="Deactivate"
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="paper-card p-6 text-center text-ink-light bg-paper-dark/20 italic text-xs">
                  No upcoming bills left for this month.
                </div>
              )}
            </div>

            {/* Paid Section */}
            {paidBills.length > 0 && (
              <div>
                <h3 className="font-handwritten text-xl text-accent-green flex items-center gap-1.5 mb-3">
                  <CheckCircle2 size={18} /> Paid This Month
                </h3>
                <div className="space-y-2">
                  {paidBills.map(({ payment: p, loggedExpense }) => (
                    <div key={p.id} className="paper-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-accent-green opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-0.5">
                          {p.category === "Subscription" ? "📺" : "💡"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-ink-dark line-through">{p.name}</span>
                            <span className="text-[10px] bg-accent-green/10 text-accent-green border border-accent-green/20 px-2 py-0.5 rounded-full font-medium">
                              Paid
                            </span>
                          </div>
                          {loggedExpense ? (
                            <p className="text-xs text-accent-green font-medium mt-1">
                              Payment recorded on {format(new Date(loggedExpense.date), "MMM d, yyyy")} ({loggedExpense.payment_method})
                            </p>
                          ) : p.last_paid ? (
                            <p className="text-xs text-accent-green font-medium mt-1">
                              Marked paid on {format(new Date(p.last_paid), "MMM d, yyyy")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[rgba(0,0,0,0.04)]">
                        <div className="text-left sm:text-right">
                          <span className="text-sm font-semibold text-accent-green amount block">
                            {loggedExpense ? formatCurrency(loggedExpense.amount) : formatCurrency(p.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setEditingPayment(p); setShowAddModal(true); }}
                            className="p-2 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(p)}
                            className="p-2 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                            title="Deactivate"
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive & Suspended List */}
            {inactivePayments.length > 0 && (
              <div>
                <h3 className="font-handwritten text-xl text-ink-light mb-3">Suspended / Inactive</h3>
                <div className="space-y-2">
                  {inactivePayments.map((p) => (
                    <div key={p.id} className="paper-card p-3 flex items-center justify-between gap-4 opacity-50 hover:opacity-75 transition-opacity">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔕</span>
                        <div>
                          <p className="text-sm font-medium text-ink-dark">{p.name}</p>
                          <p className="text-[10px] text-ink-light">Category: {p.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-medium amount font-medium">
                          {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                        </span>
                        <button
                          onClick={() => handleActivate(p)}
                          className="px-2 py-1 bg-paper-dark text-ink-dark text-[10px] font-semibold rounded hover:bg-paper-dark/80 cursor-pointer"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-ink-light hover:text-accent-red rounded transition-colors cursor-pointer"
                          title="Delete permanently"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payments.length === 0 && (
              <div className="paper-card p-12 text-center">
                <span className="text-4xl block mb-2">💡</span>
                <p className="font-handwritten text-2xl text-ink-medium">No bills or subscriptions tracked yet</p>
                <p className="text-xs text-ink-light mt-1 max-w-sm mx-auto">
                  Click &ldquo;Add Bill / Subscription&rdquo; above to catalog your monthly expenses, utilities, or digital services.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* History tab */
          <div className="space-y-4">
            <h3 className="font-handwritten text-xl text-ink-dark mb-3">Logged Bills & Subs History</h3>
            
            {billExpenses.length > 0 ? (
              <div className="space-y-4">
                {Array.from(new Set(billExpenses.map((e) => e.date.substring(0, 7))))
                  .sort((a, b) => b.localeCompare(a))
                  .map((monthKey) => {
                    const monthExpenses = billExpenses.filter((e) => e.date.startsWith(monthKey));
                    const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
                    const parsedDate = new Date(`${monthKey}-01`);

                    return (
                      <div key={monthKey} className="paper-card p-4">
                        <div className="flex justify-between items-center border-b border-[rgba(0,0,0,0.06)] pb-2 mb-3">
                          <span className="font-handwritten text-lg text-ink-dark font-bold">
                            {format(parsedDate, "MMMM yyyy")}
                          </span>
                          <span className="text-xs font-semibold text-accent-warm amount font-bold">
                            Total: {formatCurrency(monthTotal)}
                          </span>
                        </div>
                        <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                          {monthExpenses.map((e) => (
                            <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                              <div>
                                <span className="font-medium text-ink-dark">{e.name}</span>
                                <span className="text-[10px] text-ink-light block">
                                  {format(new Date(e.date), "MMM d, yyyy")} · Paid via {e.payment_method}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-ink-medium amount font-medium">
                                  {formatCurrency(e.amount)}
                                </span>
                                <button
                                  onClick={async () => {
                                    if (confirm("Delete this expense log?")) {
                                      await deleteExpense(e.id);
                                      toast("Expense log deleted");
                                    }
                                  }}
                                  className="p-1 hover:bg-paper-dark text-ink-light hover:text-accent-red rounded transition-colors cursor-pointer"
                                  title="Delete log"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="paper-card p-8 text-center text-ink-light bg-paper-dark/20 italic text-xs">
                No past bill payment records found.
              </div>
            )}
          </div>
        )}

      </div>

      <AddBillModal 
        open={showAddModal} 
        onClose={() => { setShowAddModal(false); setEditingPayment(null); }} 
        editingPayment={editingPayment}
      />
      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="managing bills" />
    </div>
  );
}
