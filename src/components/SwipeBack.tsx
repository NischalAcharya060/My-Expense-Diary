"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GESTURE_BLOCK_SELECTOR, hapticFeedback } from "@/lib/utils";

/** Touch must begin this close to the left edge to arm the gesture (px). */
const EDGE_PX = 28;
/** Rightward drag needed to fire navigation (px). */
const TRIGGER_PX = 90;
/** Movement required before the axis locks (px). */
const AXIS_SLOP = 10;
/** Cooldown after navigating so a lingering touch can't fire twice. */
const NAV_COOLDOWN_MS = 700;

/**
 * iOS-style edge swipe-back navigation for touch devices: a rightward drag
 * starting within EDGE_PX of the left screen edge navigates back in history.
 *
 * Rendered once in the root layout. Suppressed while dialogs / gesture-blocked
 * overlays are open, inside form fields, and when there is nothing to go
 * back to.
 */
export default function SwipeBack() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let startX: number | null = null;
    let startY: number | null = null;
    let engaged = false;
    let lastProgress = 0;
    let coolingDown = false;

    const reset = () => {
      startX = null;
      startY = null;
      engaged = false;
      lastProgress = 0;
      setActive(false);
      setProgress(0);
    };

    const blocked = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      !!target.closest(`textarea, input, select, [contenteditable="true"], ${GESTURE_BLOCK_SELECTOR}`);

    const onTouchStart = (e: TouchEvent) => {
      if (coolingDown) return;
      if (
        e.touches.length !== 1 ||
        blocked(e.target) ||
        e.touches[0].clientX > EDGE_PX ||
        window.history.length <= 1
      ) {
        reset();
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      engaged = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startX === null || startY === null || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!engaged) {
        if (Math.abs(dx) < AXIS_SLOP && Math.abs(dy) < AXIS_SLOP) return;
        // Vertical scroll or leftward drag — not a back gesture.
        if (dx <= 0 || Math.abs(dx) < Math.abs(dy)) {
          reset();
          return;
        }
        engaged = true;
        setActive(true);
      }
      if (e.cancelable) e.preventDefault();
      lastProgress = Math.min(Math.max(dx / TRIGGER_PX, 0), 1);
      setProgress(lastProgress);
    };

    const onTouchEnd = () => {
      if (startX === null) return;
      const fired = engaged && lastProgress >= 1;
      reset();
      if (!fired) return;
      coolingDown = true;
      hapticFeedback();
      router.back();
      window.setTimeout(() => {
        coolingDown = false;
      }, NAV_COOLDOWN_MS);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [router]);

  return (
    <>
      {/* Edge progress bar that grows with the drag */}
      <div
        aria-hidden
        className={`pointer-events-none fixed left-0 top-1/2 z-[60] -translate-y-1/2 transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="w-[3px] rounded-r-full bg-accent-warm"
          style={{ height: `${14 + progress * 60}px`, transition: active ? "none" : "height 180ms ease" }}
        />
      </div>
      {/* Arrow chip that slides in from off-screen */}
      <div
        aria-hidden
        className={`pointer-events-none fixed top-1/2 left-4 z-[60] transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ transform: `translate(${Math.round(-48 + progress * 56)}px, -50%)` }}
      >
        <div className="paper-card rounded-full p-2 shadow-lifted">
          <ArrowLeft size={16} className="text-accent-warm" />
        </div>
      </div>
    </>
  );
}
