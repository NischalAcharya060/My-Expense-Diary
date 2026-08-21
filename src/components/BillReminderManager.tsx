"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useRecurringPayments, useExpenses } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { getUpcomingBills } from "@/lib/reminders";
import { getToday } from "@/lib/utils";

const DISMISS_KEY = "bill_reminder_prompt_dismissed";
const NOTIF_KEY_PREFIX = "bill_notified_";

function describeDue(daysUntil: number): string {
  if (daysUntil < 0) return `is overdue by ${-daysUntil} day${-daysUntil === 1 ? "" : "s"}`;
  if (daysUntil === 0) return "is due today";
  return `is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
}

export default function BillReminderManager() {
  const { user } = useAuth();
  const { payments, loaded: paymentsLoaded } = useRecurringPayments();
  const { expenses, loaded: expensesLoaded } = useExpenses();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const ready = !!user && paymentsLoaded && expensesLoaded;

  // Fire notifications for bills inside their reminder window (once per due date)
  useEffect(() => {
    if (!ready || permission !== "granted") return;

    const todayStr = getToday();

    // Clean up stale dedupe keys from previous due dates
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(NOTIF_KEY_PREFIX)) {
          const duePart = key.split("_").pop();
          if (duePart && /^\d{4}-\d{2}-\d{2}$/.test(duePart) && duePart < todayStr) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch {
      // localStorage unavailable — skip cleanup
    }

    const reminderBills = getUpcomingBills(payments, expenses, todayStr).filter(
      (b) => b.daysUntil <= b.payment.reminder_days
    );

    for (const bill of reminderBills) {
      const key = `${NOTIF_KEY_PREFIX}${bill.payment.id}_${bill.dueDateStr}`;
      try {
        if (localStorage.getItem(key)) continue;
        const notification = new Notification("Bill Reminder — My Expense Diary", {
          body: `${bill.payment.name} ${describeDue(bill.daysUntil)}.`,
          tag: key,
          icon: "/android-chrome-192x192.png",
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        localStorage.setItem(key, "1");
      } catch (err) {
        console.error("Failed to show bill notification:", err);
      }
    }
  }, [ready, permission, payments, expenses]);

  const requestPermission = async () => {
    if (!supported) return;
    try {
      setPermission(await Notification.requestPermission());
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!ready || !supported || permission !== "default" || dismissed) return null;

  const hasReminderBills = getUpcomingBills(payments, expenses, getToday()).some(
    (b) => b.daysUntil <= Math.max(b.payment.reminder_days, 0)
  );
  if (!hasReminderBills) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-40 paper-card p-4 max-w-[300px] shadow-lg border border-[rgba(0,0,0,0.08)] toast-enter"
      role="status"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-ink-light hover:text-ink-dark rounded transition-colors"
        aria-label="Dismiss reminder prompt"
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-warm/10 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-accent-warm" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-dark">Never miss a bill</p>
          <p className="text-xs text-ink-light mt-0.5 leading-relaxed">
            Get browser notifications when your bills enter their reminder window.
          </p>
          <button
            onClick={requestPermission}
            className="mt-2.5 px-3 py-1.5 bg-accent-warm text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Enable Reminders
          </button>
        </div>
      </div>
    </div>
  );
}
