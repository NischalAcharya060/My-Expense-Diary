"use client";

import { useState, useEffect } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { useRecurringPayments, useCategories } from "@/lib/store";
import { PAYMENT_METHODS, FREQUENCIES, getToday, getCurrencySymbol } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { RecurringPayment, PaymentMethod, RecurringFrequency } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editingPayment?: RecurringPayment | null;
}

interface Preset {
  name: string;
  category: string;
  icon: string;
  color: string;
}

const BILL_PRESETS: Preset[] = [
  { name: "Rent", category: "Bills", icon: "🏠", color: "#8B5CF6" },
  { name: "Electricity", category: "Bills", icon: "⚡", color: "#F59E0B" },
  { name: "Water", category: "Bills", icon: "💧", color: "#0891B2" },
  { name: "Internet", category: "Bills", icon: "🌐", color: "#3B82F6" },
  { name: "Mobile/Phone", category: "Bills", icon: "📱", color: "#10B981" },
  { name: "Gas", category: "Bills", icon: "🔥", color: "#EF4444" },
];

const SUB_PRESETS: Preset[] = [
  { name: "Netflix", category: "Subscription", icon: "📺", color: "#E50914" },
  { name: "Spotify", category: "Subscription", icon: "🎵", color: "#1DB954" },
  { name: "YouTube", category: "Subscription", icon: "🔴", color: "#FF0000" },
  { name: "iCloud", category: "Subscription", icon: "☁️", color: "#007AFF" },
  { name: "Gym", category: "Subscription", icon: "🏋️", color: "#FF9500" },
  { name: "GitHub", category: "Subscription", icon: "💻", color: "#24292F" },
];

export default function AddBillModal({ open, onClose, editingPayment }: Props) {
  const { addPayment, updatePayment } = useRecurringPayments();
  const { categories } = useCategories();
  const { toast } = useToast();

  const [type, setType] = useState<"Bill" | "Subscription">("Bill");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  const [category, setCategory] = useState("Bills");
  const [frequency, setFrequency] = useState<RecurringFrequency>("Monthly");
  const [dueDay, setDueDay] = useState("1");
  const [startDate, setStartDate] = useState(getToday());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");
  const [autoPay, setAutoPay] = useState(false);
  const [reminderDays, setReminderDays] = useState("3");
  const [saving, setSaving] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      if (editingPayment) {
        setName(editingPayment.name);
        setAmount(editingPayment.amount ? editingPayment.amount.toString() : "");
        setIsVariable(editingPayment.is_variable);
        setCategory(editingPayment.category);
        setType(editingPayment.category === "Subscription" ? "Subscription" : "Bill");
        setFrequency(editingPayment.frequency);
        setDueDay(editingPayment.due_day.toString());
        setStartDate(editingPayment.start_date);
        setPaymentMethod((editingPayment.payment_method as PaymentMethod) || "Card");
        setAutoPay(!!editingPayment.auto_pay);
        setReminderDays(editingPayment.reminder_days.toString());
      } else {
        setName("");
        setAmount("");
        setIsVariable(false);
        setCategory("Bills");
        setType("Bill");
        setFrequency("Monthly");
        setDueDay("1");
        setStartDate(getToday());
        setPaymentMethod("Card");
        setAutoPay(false);
        setReminderDays("3");
      }
    }
  }, [open, editingPayment]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null;

  const handleApplyPreset = (preset: Preset) => {
    setName(preset.name);
    const matchingCat = categories.find((c) => c.name.toLowerCase() === preset.category.toLowerCase());
    setCategory(matchingCat ? matchingCat.name : "Other");
    setType(preset.category === "Subscription" ? "Subscription" : "Bill");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const numericAmount = isVariable ? 0 : parseFloat(amount) || 0;
    const data = {
      user_id: "",
      name: name.trim(),
      amount: numericAmount,
      is_variable: isVariable,
      category,
      frequency,
      due_day: parseInt(dueDay) || 1,
      start_date: startDate,
      is_active: true,
      reminder_days: parseInt(reminderDays) || 0,
      auto_pay: autoPay,
      payment_method: paymentMethod,
    };

    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, data);
        toast("Bill / Subscription updated");
      } else {
        await addPayment(data);
        toast("Bill / Subscription added");
      }
      onClose();
    } catch (err) {
      console.error("Failed to save recurring payment:", err);
      toast("Error saving payment details", "error");
    } finally {
      setSaving(false);
    }
  };

  const currentPresets = type === "Bill" ? BILL_PRESETS : SUB_PRESETS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-paper-bg rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto paper-card page-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="font-handwritten text-2xl text-ink-dark">
            {editingPayment ? "Edit" : "New"} {type}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-paper-dark rounded transition-colors" aria-label="Close">
            <X size={18} className="text-ink-light" />
          </button>
        </div>

        {/* Type selector tabs */}
        <div className="flex border-b border-[rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => {
              setType("Bill");
              setCategory("Bills");
            }}
            className={`flex-1 py-2.5 text-center text-sm font-semibold transition-all ${
              type === "Bill"
                ? "text-accent-warm border-b-2 border-accent-warm bg-accent-warm/5"
                : "text-ink-light hover:text-ink-medium hover:bg-paper-dark/20"
            }`}
          >
            💡 Bill
          </button>
          <button
            type="button"
            onClick={() => {
              setType("Subscription");
              setCategory("Subscription");
            }}
            className={`flex-1 py-2.5 text-center text-sm font-semibold transition-all ${
              type === "Subscription"
                ? "text-accent-warm border-b-2 border-accent-warm bg-accent-warm/5"
                : "text-ink-light hover:text-ink-medium hover:bg-paper-dark/20"
            }`}
          >
            📺 Subscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Quick presets */}
          <div>
            <span className="flex items-center gap-1 text-[10px] text-ink-light uppercase tracking-wider mb-2">
              <Sparkles size={10} className="text-accent-warm" /> Quick Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {currentPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2 py-1.5 text-xs rounded border border-[rgba(0,0,0,0.06)] bg-paper-dark hover:bg-paper-dark/80 hover:border-ink-light/30 transition-all flex items-center gap-1.5 justify-start text-ink-medium"
                >
                  <span className="text-sm">{preset.icon}</span>
                  <span className="truncate font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Name / Provider</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "Bill" ? "e.g. Electric Company, Rent" : "e.g. Netflix, Spotify, Gym"}
              className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm"
              required
            />
          </div>

          {/* Amount and Variable Checkbox */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">
                Amount ({getCurrencySymbol()})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isVariable}
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm disabled:opacity-50 disabled:cursor-not-allowed amount"
                required={!isVariable}
              />
            </div>
            <div className="pb-2.5 flex items-center gap-2">
              <input
                type="checkbox"
                id="isVariable"
                checked={isVariable}
                onChange={(e) => {
                  setIsVariable(e.target.checked);
                  if (e.target.checked) setAmount("");
                }}
                className="rounded border-[rgba(0,0,0,0.15)] text-accent-warm focus:ring-accent-warm w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isVariable" className="text-xs text-ink-medium select-none cursor-pointer leading-tight">
                Variable Amount
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category selection */}
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency selection */}
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Billing Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Due Day */}
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Due Day</label>
              <input
                type="number"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                min="1"
                max="31"
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm"
                required
              />
            </div>

            {/* Start Date */}
            <div className="col-span-2">
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Days */}
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Remind Me (days)</label>
              <input
                type="number"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                min="0"
                max="30"
                placeholder="3"
                className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded text-ink-dark text-sm focus:outline-none focus:border-accent-warm"
              />
            </div>
          </div>

          {/* Schedule Pay / Auto Pay Toggle */}
          <div className="p-3 bg-paper-dark border border-[rgba(0,0,0,0.06)] rounded-lg flex items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-ink-dark">⏰ Schedule Pay (Auto-Pay)</span>
              <span className="block text-[10px] text-ink-light mt-0.5 leading-tight">
                Automatically log this expense in your ledger when the due date arrives.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoPay(!autoPay)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                autoPay ? "bg-accent-green" : "bg-ink-light/40"
              }`}
            >
              <span
                className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 left-0.5 transition-transform duration-200 ${
                  autoPay ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-accent-warm text-white rounded text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Check size={16} />
            {saving ? "Saving..." : editingPayment ? "Update Details" : `Add ${type}`}
          </button>
        </form>
      </div>
    </div>
  );
}
