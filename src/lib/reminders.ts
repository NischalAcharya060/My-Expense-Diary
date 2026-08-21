import type { Expense, RecurringPayment } from "@/types";

export interface UpcomingBill {
  payment: RecurringPayment;
  dueDateStr: string;
  daysUntil: number;
  isPaid: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Returns all active recurring payments that still need payment, with their
 * next unpaid due occurrence (current or next month) and days until due.
 * Negative daysUntil means overdue. Sorted most urgent first.
 */
export function getUpcomingBills(
  payments: RecurringPayment[],
  expenses: Expense[],
  todayStr: string
): UpcomingBill[] {
  const today = new Date(`${todayStr}T00:00:00Z`);
  if (isNaN(today.getTime())) return [];

  const baseYear = today.getUTCFullYear();
  const baseMonth = today.getUTCMonth();
  const results: UpcomingBill[] = [];

  for (const payment of payments) {
    if (!payment.is_active) continue;

    for (let offset = 0; offset <= 1; offset++) {
      const cursor = new Date(Date.UTC(baseYear, baseMonth + offset, 1));
      const y = cursor.getUTCFullYear();
      const m0 = cursor.getUTCMonth();
      const daysInMonth = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
      const dueDay = Math.min(payment.due_day, daysInMonth);
      const monthKey = `${y}-${pad(m0 + 1)}`;
      const dueDateStr = `${monthKey}-${pad(dueDay)}`;

      if (payment.start_date && dueDateStr < payment.start_date) continue;

      const hasLoggedExpense = expenses.some(
        (e) => e.recurring_payment_id === payment.id && e.date.startsWith(monthKey)
      );
      const isPaid =
        hasLoggedExpense ||
        (!!payment.last_paid && payment.last_paid.startsWith(monthKey));

      if (isPaid) continue;

      const dueDate = new Date(`${dueDateStr}T00:00:00Z`);
      const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

      if (daysUntil < -31) continue;

      results.push({ payment, dueDateStr, daysUntil, isPaid });
      break;
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export interface DueBadge {
  label: string;
  className: string;
}

const BADGE_OVERDUE = "text-[10px] bg-accent-red/10 text-accent-red border border-accent-red/25 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap";
const BADGE_TODAY = "text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap";
const BADGE_UPCOMING = "text-[10px] bg-accent-blue/10 text-accent-blue border border-accent-blue/25 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap";

/**
 * Badge for a bill based on days until due.
 * Returns null when the bill is outside its reminder window.
 */
export function getDueBadge(bill: UpcomingBill): DueBadge | null {
  const { daysUntil, payment } = bill;
  if (daysUntil < 0) {
    return { label: `Overdue ${-daysUntil}d`, className: BADGE_OVERDUE };
  }
  if (daysUntil === 0) {
    return { label: "Due today", className: BADGE_TODAY };
  }
  if (daysUntil <= payment.reminder_days) {
    return { label: `In ${daysUntil}d`, className: BADGE_UPCOMING };
  }
  return null;
}
