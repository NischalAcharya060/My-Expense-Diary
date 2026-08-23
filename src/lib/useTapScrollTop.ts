"use client";

import * as React from "react";

/** Interactive elements whose clicks must not trigger a scroll-to-top. */
const INTERACTIVE = "button, a, input, select, textarea, label, [role='button'], [role='menu'], [role='switch']";

/**
 * Makes a page header tappable to scroll back to the top — the web stand-in
 * for the iOS status-bar-tap gesture. Spread the returned props onto the
 * header element. Clicks on nested interactive elements are ignored so real
 * buttons inside the header keep working; keyboard users scroll natively via
 * the Home key, so this stays a pointer-only enhancement (no fake button
 * semantics over a region containing actual controls).
 */
export function useTapScrollTop() {
  const onClick = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  return React.useMemo(() => ({ onClick, title: "Tap to scroll to top" }), [onClick]);
}
