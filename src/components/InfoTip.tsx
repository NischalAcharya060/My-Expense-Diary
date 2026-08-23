"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface InfoTipProps {
  text: string;
  label?: string;
  /** Vertical placement of the bubble. */
  side?: "top" | "bottom";
  /** Horizontal alignment — pick based on how close to an edge the icon sits. */
  align?: "center" | "left" | "right";
}

/**
 * Small "?" help icon with a hover/focus/tap tooltip for complex features.
 */
export default function InfoTip({
  text,
  label = "What does this mean?",
  side = "top",
  align = "center",
}: InfoTipProps) {
  const [open, setOpen] = useState(false);

  const position =
    side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignment =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "left"
        ? "left-0"
        : "right-0";

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-ink-light hover:text-accent-warm transition-colors cursor-help leading-none"
      >
        <HelpCircle size={13} aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          data-gesture-block
          className={`absolute z-[70] ${position} ${alignment} w-52 bg-ink-dark text-paper-bg text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-lg text-left font-sans`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
