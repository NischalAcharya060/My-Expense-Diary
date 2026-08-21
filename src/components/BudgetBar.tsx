"use client";

interface BudgetBarProps {
  /** Percent of budget used (can exceed 100). */
  pct: number;
  label?: string;
}

/** Green (0-50%) → yellow (50-80%) → red (80%+) usage coloring. */
export function budgetUsageColor(pct: number): string {
  if (pct >= 80) return "var(--accent-red)";
  if (pct >= 50) return "#F59E0B";
  return "var(--accent-green)";
}

export default function BudgetBar({ pct, label }: BudgetBarProps) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div
      className="w-full h-2 bg-paper-dark rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Budget usage"}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: budgetUsageColor(pct) }}
      />
    </div>
  );
}
