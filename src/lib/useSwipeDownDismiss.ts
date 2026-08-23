"use client";

import { useCallback, useRef, useState } from "react";

const CLOSE_THRESHOLD = 90;

/**
 * Swipe-down-to-dismiss for modal cards on touch devices.
 * Attach `handlers` to the draggable card element and apply
 * `style` so the card follows the finger and springs back
 * (or closes) on release.
 */
export function useSwipeDownDismiss(onClose: () => void, enabled = true) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startY.current = e.touches[0].clientY;
      setDragging(true);
    },
    [enabled]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      // Rubber-band resistance as the card is pulled down.
      setDragY(dy * 0.85);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    const shouldClose = dragY > CLOSE_THRESHOLD;
    setDragY(0);
    if (shouldClose) onClose();
  }, [dragY, onClose]);

  const style: React.CSSProperties = {
    transform: dragY > 0 ? `translateY(${Math.round(dragY)}px)` : undefined,
    transition: dragging ? "none" : "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
    touchAction: "pan-y",
  };

  return { dragY, dragging, handlers: { onTouchStart, onTouchMove, onTouchEnd }, style };
}
