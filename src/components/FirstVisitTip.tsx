"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { hasSeenHint, markHintSeen, type HintId } from "@/lib/help";
import { hapticFeedback } from "@/lib/utils";

interface FirstVisitTipProps {
  id: HintId;
  children: ReactNode;
  title?: string;
}

/**
 * One-time onboarding tip card. Renders nothing until it knows the hint
 * hasn't been dismissed before; dismissing persists forever.
 */
export default function FirstVisitTip({ id, children, title = "Quick tip" }: FirstVisitTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    // Microtask keeps setState out of the effect body (react-hooks lint).
    Promise.resolve().then(() => {
      if (alive && !hasSeenHint(id)) setVisible(true);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!visible) return null;

  const dismiss = () => {
    hapticFeedback();
    markHintSeen(id);
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="paper-card p-4 mb-6 relative rotate-[-0.3deg] shadow-sm flex items-start gap-3"
      data-testid={`tip-${id}`}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
      <span className="shrink-0 w-8 h-8 rounded-full bg-accent-warm/15 text-accent-warm flex items-center justify-center mt-0.5">
        <Sparkles size={16} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-warm mb-1">{title}</p>
        <p className="text-xs text-ink-dark leading-relaxed">{children}</p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 text-[11px] font-bold text-accent-warm hover:underline cursor-pointer"
        >
          Got it ✓
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="shrink-0 p-1 rounded-full text-ink-light hover:text-ink-dark hover:bg-paper-dark transition-colors cursor-pointer"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}
