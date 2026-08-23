"use client";

import { useEffect, useRef, useState } from "react";
import { GESTURE_BLOCK_SELECTOR, hapticFeedback } from "./utils";

/** Pull distance (px) that triggers a refresh on release. */
export const PULL_TRIGGER_AT = 64;
/** Hard cap for the rubber-band pull distance. */
const MAX_PULL = 110;
/** Downward movement required before the gesture engages (ignores taps/jiggle). */
const START_SLOP = 12;
/** Resistance multiplier — the indicator travels slower than the finger. */
const RESISTANCE = 0.42;
/** Minimum time the spinner stays visible so a fast refresh doesn't flash. */
const MIN_SPIN_MS = 650;

interface Options {
  /** May refresh several stores in parallel via Promise.all — any result is fine. */
  onRefresh: () => void | Promise<unknown>;
  enabled?: boolean;
}

/**
 * Pull-to-refresh for window-scrolled list pages on touch devices.
 *
 * Listens at window level and engages only when the page is scrolled to the
 * top and the user drags downward; while engaged, native scrolling/overscroll
 * (and Chrome's built-in pull-to-refresh) are suppressed via preventDefault.
 *
 * Returns the current pull distance (px) plus dragging/refreshing flags for
 * rendering an indicator — see components/PullToRefresh.tsx.
 */
export function usePullToRefresh({ onRefresh, enabled = true }: Options) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef<number | null>(null);
  const engagedRef = useRef(false);
  const pullValueRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const gestureBlocked = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      !!target.closest(`textarea, input, select, [contenteditable="true"], ${GESTURE_BLOCK_SELECTOR}`);

    const reset = () => {
      startYRef.current = null;
      engagedRef.current = false;
      pullValueRef.current = 0;
      setPull(0);
      setDragging(false);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (e.touches.length !== 1 || gestureBlocked(e.target)) {
        reset();
        return;
      }
      startYRef.current = e.touches[0].clientY;
      engagedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshingRef.current) return;
      // Scrolled away from the top mid-gesture → this is a normal scroll.
      if (window.scrollY > 0) {
        reset();
        return;
      }
      const dy = e.touches[0].clientY - startYRef.current;
      if (!engagedRef.current) {
        if (dy <= START_SLOP) return;
        engagedRef.current = true;
        setDragging(true);
      }
      if (e.cancelable) e.preventDefault();
      const next = Math.min(Math.max(dy * RESISTANCE, 0), MAX_PULL);
      pullValueRef.current = next;
      setPull(next);
    };

    const onTouchEnd = () => {
      if (startYRef.current === null || refreshingRef.current) return;
      const shouldRefresh = engagedRef.current && pullValueRef.current >= PULL_TRIGGER_AT;
      if (!shouldRefresh) {
        reset();
        return;
      }
      startYRef.current = null;
      engagedRef.current = false;
      setDragging(false);
      refreshingRef.current = true;
      setRefreshing(true);
      hapticFeedback();
      const startedAt = Date.now();
      // Store refetches surface their own errors (toasts/error state); a
      // rejection here must only end the spinner, never double-report.
      Promise.resolve(onRefreshRef.current())
        .catch(() => {})
        .finally(() => {
          const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt));
          holdTimer.current = setTimeout(() => {
            holdTimer.current = null;
            refreshingRef.current = false;
            setRefreshing(false);
            setPull(0);
          }, wait);
        });
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
      if (holdTimer.current !== null) clearTimeout(holdTimer.current);
    };
  }, [enabled]);

  return { pull, dragging, refreshing };
}
