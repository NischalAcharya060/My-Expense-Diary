"use client";

import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

export type RangeType = "week" | "month" | "m3" | "m6" | "year" | "custom";

export interface DateRangeSel {
  type: RangeType;
  /** yyyy-MM-dd, inclusive */
  start: string;
  end: string;
}

const OPTIONS: Array<{ type: RangeType; label: string }> = [
  { type: "week", label: "This Week" },
  { type: "month", label: "This Month" },
  { type: "m3", label: "3 Months" },
  { type: "m6", label: "6 Months" },
  { type: "year", label: "This Year" },
  { type: "custom", label: "Custom" },
];

const CHIP_BASE_CLS =
  "shrink-0 whitespace-nowrap inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm/40";
const CHIP_ACTIVE_CLS = "bg-accent-warm text-white shadow-sm border border-transparent";
const CHIP_IDLE_CLS =
  "bg-paper-bg text-ink-medium hover:text-ink-dark hover:border-accent-warm/50 border border-[rgba(0,0,0,0.07)]";

const INPUT_CLS =
  "bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-lg px-2.5 py-1.5 text-xs text-ink-dark cursor-pointer focus:outline-none focus-visible:border-accent-warm focus-visible:ring-2 focus-visible:ring-accent-warm/25";

function toStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parse(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

export function buildRange(type: RangeType, anchor: Date, custom?: { start: string; end: string }): DateRangeSel {
  switch (type) {
    case "week":
      return { type, start: toStr(startOfWeek(anchor, { weekStartsOn: 1 })), end: toStr(endOfWeek(anchor, { weekStartsOn: 1 })) };
    case "month":
      return { type, start: toStr(startOfMonth(anchor)), end: toStr(endOfMonth(anchor)) };
    case "m3":
      return { type, start: toStr(startOfMonth(subMonths(anchor, 2))), end: toStr(endOfMonth(anchor)) };
    case "m6":
      return { type, start: toStr(startOfMonth(subMonths(anchor, 5))), end: toStr(endOfMonth(anchor)) };
    case "year":
      return { type, start: toStr(startOfYear(anchor)), end: toStr(endOfYear(anchor)) };
    case "custom":
      return custom
        ? { type, ...custom }
        : { type, start: toStr(startOfMonth(anchor)), end: toStr(endOfMonth(anchor)) };
  }
}

export function shiftRange(sel: DateRangeSel, dir: -1 | 1): DateRangeSel {
  switch (sel.type) {
    case "week": {
      const d = addDays(parse(sel.start), 7 * dir);
      return buildRange("week", d);
    }
    case "month":
      return buildRange("month", addMonths(parse(sel.start), dir));
    case "m3":
      return buildRange("m3", addMonths(parse(sel.end), 3 * dir));
    case "m6":
      return buildRange("m6", addMonths(parse(sel.end), 6 * dir));
    case "year":
      return buildRange("year", addMonths(parse(sel.start), 12 * dir));
    default:
      return sel;
  }
}

export function rangeLabel(sel: DateRangeSel): string {
  const s = parse(sel.start);
  const e = parse(sel.end);
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sel.type === "month") return format(s, "MMMM yyyy");
  if (sel.type === "year") return format(s, "yyyy");
  if (sel.type === "m3" || sel.type === "m6") {
    return sameYear ? `${format(s, "MMM")} – ${format(e, "MMM yyyy")}` : `${format(s, "MMM yy")} – ${format(e, "MMM yy")}`;
  }
  return sameYear ? `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}` : `${format(s, "MMM d, yy")} – ${format(e, "MMM d, yy")}`;
}

export function periodNoun(sel: DateRangeSel): string {
  switch (sel.type) {
    case "week":
      return "week";
    case "month":
      return "month";
    case "m3":
      return "3-month stretch";
    case "m6":
      return "6-month stretch";
    case "year":
      return "year";
    default:
      return "period";
  }
}

export default function RangeSelector({
  value,
  onChange,
}: {
  value: DateRangeSel;
  onChange: (next: DateRangeSel) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            aria-pressed={value.type === opt.type}
            className={`${CHIP_BASE_CLS} ${value.type === opt.type ? CHIP_ACTIVE_CLS : CHIP_IDLE_CLS}`}
            onClick={() =>
              onChange(
                opt.type === "custom"
                  ? buildRange("custom", new Date(), { start: value.start, end: value.end })
                  : buildRange(opt.type, new Date())
              )
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value.type === "custom" && (
        <div className="flex items-center gap-2 mt-3 flex-wrap" role="group" aria-label="Custom date range">
          <input
            type="date"
            aria-label="Start date"
            className={INPUT_CLS}
            value={value.start}
            max={value.end}
            onChange={(e) => {
              if (!e.target.value) return;
              onChange({ type: "custom", start: e.target.value, end: value.end });
            }}
          />
          <span className="text-ink-light text-xs">→</span>
          <input
            type="date"
            aria-label="End date"
            className={INPUT_CLS}
            value={value.end}
            min={value.start}
            onChange={(e) => {
              if (!e.target.value) return;
              onChange({ type: "custom", start: value.start, end: e.target.value });
            }}
          />
        </div>
      )}
    </div>
  );
}
