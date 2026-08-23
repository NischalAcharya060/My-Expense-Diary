"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Expense } from "@/types";

const SWIPE_THRESHOLD = 60;

interface Props {
  date: string;
  expenses: Expense[];
  onClose: () => void;
  onNavigateDay: (dateStr: string) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onAddExpense: () => void;
  /** True while another dialog (e.g. Add Expense modal) sits above the drawer. */
  navigationPaused?: boolean;
}

export default function DayDetailDrawer({
  date,
  expenses,
  onClose,
  onNavigateDay,
  onDeleteExpense,
  onAddExpense,
  navigationPaused = false,
}: Props) {
  const { getCategoryByName } = useCategories();
  const { toast } = useToast();
  const [swapDir, setSwapDir] = useState<-1 | 0 | 1>(0);
  const [entered, setEntered] = useState(false);
  const [dragX, setDragX] = useState(0);
  const horizontalRef = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const go = useCallback(
    (delta: -1 | 1) => {
      setSwapDir(delta);
      onNavigateDay(format(addDays(new Date(date + "T00:00:00"), delta), "yyyy-MM-dd"));
    },
    [date, onNavigateDay]
  );

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (navigationPaused || pendingDelete) return;
      const target = e.target as HTMLElement | null;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        (target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable))
      ) {
        return;
      }
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, navigationPaused, pendingDelete]);

  const onTouchStart = (e: React.TouchEvent) => {
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    horizontalRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!startPos.current) return;
    const dx = e.touches[0].clientX - startPos.current.x;
    const dy = e.touches[0].clientY - startPos.current.y;
    if (!horizontalRef.current && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      horizontalRef.current = true;
    }
    if (horizontalRef.current) {
      // Rubber-band resistance so drags feel damped.
      setDragX(dx * 0.65);
    }
  };

  const onTouchEnd = () => {
    if (!startPos.current) return;
    const dx = dragX;
    startPos.current = null;
    horizontalRef.current = false;
    setDragX(0);
    if (dx < -SWIPE_THRESHOLD) go(1);
    else if (dx > SWIPE_THRESHOLD) go(-1);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDeleteExpense(pendingDelete.id);
      toast("Expense deleted");
      setPendingDelete(null);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      toast("Failed to delete expense", "error");
    } finally {
      setDeleting(false);
    }
  };

  const dayTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label={`Expenses on ${format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}`}
    >
      <div className="absolute inset-0 bg-black/40 fade-in" onClick={onClose} />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-sm bg-paper-bg shadow-2xl flex flex-col will-change-transform ${entered ? "" : "drawer-in"}`}
        style={{
          transform: dragX !== 0 ? `translateX(${Math.round(dragX)}px)` : undefined,
          transition: dragX !== 0 ? "none" : "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          touchAction: "pan-y",
        }}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setEntered(true);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center gap-0.5 p-4 border-b border-[rgba(0,0,0,0.06)] shrink-0">
          <button
            onClick={() => go(-1)}
            className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} className="text-ink-dark" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <h3 className="font-handwritten text-xl text-ink-dark font-semibold truncate">
              📓 {format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
            </h3>
            <p className="text-[10px] text-ink-light uppercase tracking-wider font-semibold mt-0.5">
              Daily Total:{" "}
              <span className={`amount font-bold ${dayTotal > 0 ? "text-accent-red" : "text-ink-light"}`}>
                {formatCurrency(dayTotal)}
              </span>
            </p>
          </div>
          <button
            onClick={() => go(1)}
            className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight size={18} className="text-ink-dark" />
          </button>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-2 hover:bg-paper-dark rounded-md transition-colors cursor-pointer ml-0.5"
            aria-label="Close panel"
          >
            <X size={18} className="text-ink-light" />
          </button>
        </div>

        {/* Content swaps directionally when navigating days */}
        <div
          key={date}
          className={`flex-1 overflow-y-auto p-4 ${swapDir > 0 ? "day-swap-next" : swapDir < 0 ? "day-swap-prev" : ""}`}
        >
          {expenses.length === 0 ? (
            <p className="text-ink-light text-center py-10 italic font-handwritten text-lg">
              No ledger entries for this date.
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.map((e) => {
                const cat = getCategoryByName(e.category);
                const catColor = cat?.color || "#6B7280";
                const catIcon = cat?.icon || "📝";
                return (
                  <div
                    key={e.id}
                    className="group flex items-center py-1.5 border-b border-[rgba(0,0,0,0.02)] last:border-0 hover:bg-paper-dark/30 px-2 rounded transition-colors"
                  >
                    <span className="text-sm mr-3 shrink-0">{catIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-dark truncate">{e.name}</p>
                      <p className="text-[10px] text-ink-light">
                        {e.category} · {e.payment_method}
                      </p>
                    </div>
                    <span className="text-sm font-bold amount ml-2 shrink-0" style={{ color: catColor }}>
                      {formatCurrency(e.amount)}
                    </span>
                    <button
                      onClick={() => setPendingDelete(e)}
                      className="ml-2 p-1.5 text-ink-light hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors cursor-pointer opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label={`Delete ${e.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              <div className="pt-2 border-t border-[rgba(0,0,0,0.06)] flex items-center">
                <span className="text-sm font-semibold text-ink-medium">Daily total</span>
                <span className="dots" />
                <span className="font-handwritten text-2xl text-accent-warm amount font-bold">
                  {formatCurrency(dayTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-[rgba(0,0,0,0.06)] shrink-0">
          <button
            onClick={onAddExpense}
            className="w-full py-3 bg-accent-warm text-white rounded text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={16} />
            Add Expense
          </button>
          <p className="text-[10px] text-ink-light text-center mt-2">
            Swipe the panel or use ← → to change days
          </p>
        </div>
      </aside>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        message="This expense will be permanently removed."
        loading={deleting}
      />
    </div>
  );
}
