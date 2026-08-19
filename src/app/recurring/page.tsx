"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit2 } from "lucide-react";
import { useRecurringPayments, useCategories } from "@/lib/store";
import { formatCurrency, FREQUENCIES } from "@/lib/utils";
import type { RecurringPayment } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import { useToast } from "@/components/Toast";

export default function RecurringPage() {
  const { payments, loaded, addPayment, updatePayment, deletePayment } = useRecurringPayments();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  const [category, setCategory] = useState("Other");
  const [frequency, setFrequency] = useState("Monthly");
  const [dueDay, setDueDay] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [reminderDays, setReminderDays] = useState("3");
  const [mounted, setMounted] = useState(false);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-paper-dark rounded" />)}
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setName(""); setAmount(""); setIsVariable(false); setCategory("Other");
    setFrequency("Monthly"); setDueDay("1"); setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(""); setReminderDays("3"); setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data = {
      user_id: "", name: name.trim(), amount: isVariable ? 0 : parseFloat(amount) || 0,
      is_variable: isVariable, category: category as any, frequency: frequency as any,
      due_day: parseInt(dueDay), start_date: startDate, end_date: endDate || undefined,
      is_active: true, reminder_days: parseInt(reminderDays),
    };
    try {
      if (editing) {
        await updatePayment(editing.id, data);
        toast("Payment updated");
      } else {
        await addPayment(data);
        toast("Payment added");
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save payment:", err);
    }
  };

  const startEdit = (p: RecurringPayment) => {
    setEditing(p);
    setName(p.name); setAmount(p.amount.toString()); setIsVariable(p.is_variable);
    setCategory(p.category); setFrequency(p.frequency); setDueDay(p.due_day.toString());
    setStartDate(p.start_date); setEndDate(p.end_date || ""); setReminderDays(p.reminder_days.toString());
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deletePayment(id);
    toast("Payment deleted");
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updatePayment(id, { is_active: isActive });
    toast(isActive ? "Payment activated" : "Payment deactivated");
  };

  const active = payments.filter((p) => p.is_active);
  const inactive = payments.filter((p) => !p.is_active);
  const monthlyTotal = active.reduce((s, p) => s + (p.is_variable ? 0 : p.amount), 0);

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark">Recurring Payments</h1>
          <button
            onClick={() => requireAuth(() => { resetForm(); setShowForm(true); })}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-warm text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Monthly total */}
        <div className="paper-card px-4 py-3 mb-6">
          <p className="text-xs text-ink-light uppercase tracking-wide">Estimated Monthly Total</p>
          <p className="font-handwritten text-2xl text-accent-warm amount">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-ink-light mt-1">* Variable amounts not included in total</p>
        </div>

        {/* Form */}
        {showForm && (
          <div className="paper-card p-4 mb-6 page-enter">
            <h3 className="font-handwritten text-xl text-ink-dark mb-3">{editing ? "Edit" : "New"} Recurring Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm" required />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Amount (Rs.)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isVariable}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm disabled:opacity-50 amount" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isVariable" checked={isVariable} onChange={(e) => setIsVariable(e.target.checked)} className="rounded" />
                <label htmlFor="isVariable" className="text-sm text-ink-medium">Variable amount (enter when due)</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm">
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm">
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Due Day</label>
                  <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} min="1" max="31"
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm" />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm" />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Reminder (days)</label>
                  <input type="number" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} min="0" max="30"
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark focus:outline-none focus:border-accent-warm" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-accent-warm text-white rounded text-sm font-medium hover:opacity-90 transition-opacity">
                  {editing ? "Update" : "Add Payment"}
                </button>
                <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                  className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded text-sm text-ink-medium hover:bg-paper-dark transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active payments */}
        {active.length > 0 && (
          <div className="mb-6">
            <h3 className="font-handwritten text-xl text-ink-dark mb-3">Active</h3>
            <div className="space-y-2">
              {active.map((p) => (
                <div key={p.id} className="paper-card px-4 py-3 flex items-center gap-3">
                  <button onClick={() => handleToggle(p.id, false)} className="text-accent-green hover:opacity-70" title="Deactivate">
                    <ToggleRight size={22} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-dark font-medium">{p.name}</p>
                    <p className="text-xs text-ink-light">{p.category} · Due {p.due_day}{getOrdinalSuffix(p.due_day)} · {p.frequency}</p>
                  </div>
                  <span className="text-sm text-ink-medium amount shrink-0">
                    {p.is_variable ? "Variable" : formatCurrency(p.amount)}
                  </span>
                  <button onClick={() => startEdit(p)} className="p-1 text-ink-light hover:text-ink-dark transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-ink-light hover:text-accent-red transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive */}
        {inactive.length > 0 && (
          <div>
            <h3 className="font-handwritten text-xl text-ink-light mb-3">Inactive</h3>
            <div className="space-y-2">
              {inactive.map((p) => (
                <div key={p.id} className="paper-card px-4 py-3 flex items-center gap-3 opacity-60">
                  <button onClick={() => handleToggle(p.id, true)} className="text-ink-light hover:text-accent-green transition-colors" title="Activate">
                    <ToggleLeft size={22} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-dark">{p.name}</p>
                    <p className="text-xs text-ink-light">{p.category}</p>
                  </div>
                  <span className="text-sm text-ink-medium amount">{p.is_variable ? "Variable" : formatCurrency(p.amount)}</span>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-ink-light hover:text-accent-red transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {payments.length === 0 && (
          <div className="paper-card p-8 text-center">
            <p className="font-handwritten text-xl text-ink-light">No recurring payments yet</p>
            <p className="text-xs text-ink-light mt-2">Add your subscriptions and bills</p>
          </div>
        )}
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="recurring payments" />
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th";
  }
}
