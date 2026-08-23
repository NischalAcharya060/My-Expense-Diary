"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hapticFeedback } from "@/lib/utils";

const LONG_PRESS_MS = 420;
const AUTO_DISMISS_MS = 3500;
const MOVE_CANCEL_PX = 12;
const MIN_ZOOM_WINDOW = 7;
const TAP_MS = 300;
const TAP_SLOP_PX = 10;
const DOUBLE_TAP_PX = 32;

interface Pin {
  index: number;
  xPct: number;
}

function PinnedOverlay({ pin, children }: { pin: Pin; children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-y-0 z-10 pointer-events-none" style={{ left: `${pin.xPct * 100}%` }}>
        <div className="h-full border-l border-dashed border-ink-light/60 -translate-x-1/2" />
      </div>
      <div
        role="status"
        className="paper-card absolute bottom-full z-20 px-3 py-2 text-xs shadow-md border border-accent-warm/30 pointer-events-none whitespace-nowrap"
        style={{ left: `${pin.xPct * 100}%`, transform: "translate(-50%, -8px)" }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * Touch-friendly chart shell: long-press pins exact values at that x position,
 * two-finger pinch zooms the series window (single-finger horizontal drag pans),
 * and double-tap resets. Vertical page scrolling stays intact via axis locking.
 * Remount (e.g. keyed by range) resets the zoom window automatically.
 */
export default function InteractiveChart<T>({
  items,
  renderChart,
  renderValue,
  enableZoom = true,
  caption,
  mobileHint,
}: {
  items: T[];
  renderChart: (slice: T[]) => React.ReactNode;
  renderValue?: (index: number, item: T) => React.ReactNode;
  enableZoom?: boolean;
  caption?: string;
  mobileHint?: string;
}) {
  const [win, setWin] = useState({ start: 0, size: items.length });
  const elRef = useRef<HTMLDivElement | null>(null);
  const winRef = useRef(win);
  const totalRef = useRef(items.length);

  useEffect(() => {
    totalRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    winRef.current = win;
  }, [win]);

  const setEl = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
  }, []);

  /* ----- long-press pinned values ----- */

  const [pin, setPin] = useState<Pin | null>(null);
  const timerRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pinCountRef = useRef(0);

  useEffect(() => {
    pinCountRef.current = Math.max(0, Math.min(items.length, win.size));
  }, [items.length, win.size]);

  const clearFireTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fire = useCallback((touchX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || pinCountRef.current === 0) return;
    const xPct = Math.min(Math.max((touchX - rect.left) / rect.width, 0), 1);
    const index = Math.min(pinCountRef.current - 1, Math.max(0, Math.round(xPct * (pinCountRef.current - 1))));
    hapticFeedback();
    setPin({ index, xPct });
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = window.setTimeout(() => setPin(null), AUTO_DISMISS_MS);
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) return;
      if (pin) {
        setPin(null);
        return;
      }
      const t = e.touches[0];
      startPosRef.current = { x: t.clientX, y: t.clientY };
      const el = e.currentTarget;
      clearFireTimer();
      timerRef.current = window.setTimeout(() => fire(t.clientX, el), LONG_PRESS_MS);
    },
    [pin, clearFireTimer, fire]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const start = startPosRef.current;
      if (!start || timerRef.current === null) return;
      const t = e.touches[0];
      if (
        Math.abs(t.clientX - start.x) > MOVE_CANCEL_PX ||
        Math.abs(t.clientY - start.y) > MOVE_CANCEL_PX
      ) {
        clearFireTimer();
        startPosRef.current = null;
      }
    },
    [clearFireTimer]
  );

  const onTouchEnd = useCallback(() => {
    clearFireTimer();
    startPosRef.current = null;
  }, [clearFireTimer]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
    },
    []
  );

  /* ----- pinch / pan / double-tap zoom ----- */

  useEffect(() => {
    const el = elRef.current;
    if (!el || !enableZoom) return;
    const g = {
      mode: "none" as "none" | "pinch" | "maybe-pan" | "pan",
      dist0: 0,
      win0: { start: 0, size: 0 },
      panStartX: 0,
      panStartOffset: 0,
      firstTouch: null as { x: number; y: number } | null,
      moved: false,
      tapT: 0,
      lastTapT: 0,
      lastTapXY: null as { x: number; y: number } | null,
    };

    const clampWindow = (start: number, size: number) => {
      const n = totalRef.current;
      const s = Math.min(Math.max(MIN_ZOOM_WINDOW, size), n);
      return { start: Math.min(Math.max(start, 0), n - s), size: s };
    };

    const commit = (next: { start: number; size: number }) => {
      winRef.current = next;
      setWin(next);
    };

    const dist = (e: TouchEvent) => {
      const [a, b] = [e.touches[0], e.touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const onTouchStartNative = (e: TouchEvent) => {
      if (e.touches.length >= 2 && totalRef.current > MIN_ZOOM_WINDOW) {
        g.mode = "pinch";
        g.dist0 = dist(e);
        g.win0 = { ...winRef.current };
        g.moved = true;
        e.preventDefault();
        return;
      }
      const t = e.touches[0];
      g.tapT = performance.now();
      g.moved = false;
      g.firstTouch = { x: t.clientX, y: t.clientY };
      if (winRef.current.size < totalRef.current) {
        g.mode = "maybe-pan";
        g.panStartX = t.clientX;
        g.panStartOffset = winRef.current.start;
      } else {
        g.mode = "none";
      }
    };

    const onTouchMoveNative = (e: TouchEvent) => {
      if (g.mode === "pinch") {
        e.preventDefault();
        if (g.dist0 <= 0) return;
        const newSize = g.win0.size / (dist(e) / g.dist0);
        const center = g.win0.start + g.win0.size / 2;
        commit(clampWindow(Math.round(center - newSize / 2), Math.round(newSize)));
        return;
      }
      const t = e.touches[0];
      if (!g.firstTouch) return;
      const adx = Math.abs(t.clientX - g.firstTouch.x);
      const ady = Math.abs(t.clientY - g.firstTouch.y);
      if (Math.max(adx, ady) > TAP_SLOP_PX) g.moved = true;
      if (g.mode === "maybe-pan") {
        if (Math.max(adx, ady) < TAP_SLOP_PX) return;
        g.mode = ady > adx ? "none" : "pan";
      }
      if (g.mode === "pan") {
        e.preventDefault();
        const width = el.clientWidth || 1;
        const shift = Math.round(((t.clientX - g.panStartX) / width) * winRef.current.size);
        const next = clampWindow(g.panStartOffset - shift, winRef.current.size);
        if (next.start !== winRef.current.start) commit(next);
      }
    };

    const onTouchEndNative = (e: TouchEvent) => {
      if (e.touches.length > 0) return;
      const t = e.changedTouches[0];
      const isTap = !g.moved && performance.now() - g.tapT < TAP_MS && g.mode !== "pinch" && t != null;
      if (isTap && t) {
        const near =
          g.lastTapXY &&
          Math.hypot(t.clientX - g.lastTapXY.x, t.clientY - g.lastTapXY.y) < DOUBLE_TAP_PX;
        if (near && performance.now() - g.lastTapT < TAP_MS * 2) {
          hapticFeedback();
          commit({ start: 0, size: totalRef.current });
          g.lastTapT = 0;
          g.lastTapXY = null;
        } else {
          g.lastTapT = performance.now();
          g.lastTapXY = { x: t.clientX, y: t.clientY };
        }
      }
      g.mode = "none";
      g.firstTouch = null;
    };

    el.addEventListener("touchstart", onTouchStartNative, { passive: false });
    el.addEventListener("touchmove", onTouchMoveNative, { passive: false });
    el.addEventListener("touchend", onTouchEndNative);
    return () => {
      el.removeEventListener("touchstart", onTouchStartNative);
      el.removeEventListener("touchmove", onTouchMoveNative);
      el.removeEventListener("touchend", onTouchEndNative);
    };
  }, [enableZoom]);

  /* Stale-window guard: if the dataset shrank, fall back to the full range. */
  const valid = win.size <= items.length && win.start + win.size <= items.length
    ? win
    : { start: 0, size: items.length };
  const slice = items.slice(valid.start, valid.start + valid.size);
  const isZoomed = valid.size < items.length;

  return (
    <div>
      {enableZoom && isZoomed && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] text-ink-light font-bold uppercase tracking-wider" aria-live="polite">
            Showing {valid.size} of {items.length} points · drag to pan · double-tap to reset
          </p>
          <button
            onClick={() => {
              hapticFeedback();
              setWin({ start: 0, size: items.length });
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-accent-warm hover:underline cursor-pointer shrink-0"
          >
            Reset zoom
          </button>
        </div>
      )}
      <div ref={setEl} className="touch-pan-y">
        <div {...{ onTouchStart, onTouchMove, onTouchEnd }} className="relative">
          {renderChart(slice)}
          {mobileHint && !isZoomed && (
            <p className="text-center text-[10px] text-ink-light mt-1 md:hidden">{mobileHint}</p>
          )}
          {pin && renderValue && (
            <PinnedOverlay pin={pin}>{renderValue(pin.index, slice[pin.index])}</PinnedOverlay>
          )}
        </div>
      </div>
      {caption && <p className="text-center text-[10px] text-ink-light mt-1">{caption}</p>}
    </div>
  );
}
