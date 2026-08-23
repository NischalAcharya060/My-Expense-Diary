"use client";

import { Loader2 } from "lucide-react";
import { usePullToRefresh, PULL_TRIGGER_AT } from "@/lib/usePullToRefresh";

/** Indicator Y position (px) while fully hidden above the viewport. */
const HIDDEN_Y = -56;
/** Indicator Y position at/after the trigger point. */
const REST_Y = 20;

interface Props {
  /** May refresh several stores in parallel via Promise.all — any result is fine. */
  onRefresh: () => void | Promise<unknown>;
  enabled?: boolean;
}

/**
 * Fixed pull-to-refresh indicator for list pages. Invisible until a downward
 * pull is detected near the top of the page; follows the finger with a
 * rubber-band, spins while refreshing, and springs back when released.
 */
export default function PullToRefresh({ onRefresh, enabled = true }: Props) {
  const { pull, dragging, refreshing } = usePullToRefresh({ onRefresh, enabled });
  const progress = Math.min(pull / PULL_TRIGGER_AT, 1);
  const y = refreshing ? REST_Y : HIDDEN_Y + progress * (REST_Y - HIDDEN_Y);
  const visible = refreshing || pull > 0;

  return (
    <>
      <div
        aria-hidden={!visible}
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
      >
        <div
          className="paper-card rounded-full p-2.5 shadow-md"
          style={{
            transform: `translateY(${Math.round(y)}px)`,
            opacity: visible ? Math.min(progress * 1.6, 1) : 0,
            transition: dragging
              ? "opacity 120ms ease"
              : "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease",
          }}
        >
          <Loader2
            size={18}
            className={`text-accent-warm motion-reduce:animate-none ${refreshing ? "animate-spin" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${Math.round(progress * 300)}deg)` }}
          />
        </div>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {refreshing ? "Refreshing…" : ""}
      </div>
    </>
  );
}
