"use client";

import { useEffect, useRef } from "react";
import { Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; description: string }> = [
  { keys: ["N"], description: "Log a new expense (Expenses page)" },
  { keys: ["Ctrl", "K"], description: "Jump to the expense search bar" },
  { keys: ["⌘", "K"], description: "Jump to search (Mac)" },
  { keys: ["Esc"], description: "Close menus, drawers & dialogs" },
  { keys: ["?"], description: "Open this shortcuts guide" },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.7rem] h-7 px-1.5 rounded-md bg-paper-dark border border-[rgba(0,0,0,0.08)] text-[11px] font-bold text-ink-dark shadow-sm font-sans">
      {children}
    </kbd>
  );
}

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        data-gesture-block
        className="paper-card w-full max-w-sm p-6 pt-8 relative shadow-xl rotate-[-0.5deg]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
        <div className="text-center mb-5">
          <span className="inline-flex w-11 h-11 rounded-full bg-accent-warm/15 text-accent-warm items-center justify-center mb-2">
            <Keyboard size={22} aria-hidden="true" />
          </span>
          <h2 id="shortcuts-title" className="font-handwritten text-3xl text-ink-dark font-semibold">
            Keyboard shortcuts
          </h2>
          <p className="text-[11px] text-ink-light mt-1">Desktop only — faster ways around your diary.</p>
        </div>
        <ul className="space-y-2.5 mb-6">
          {SHORTCUTS.map((s) => (
            <li key={s.description} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 shrink-0">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
              <span className="text-xs text-ink-dark text-right">{s.description}</span>
            </li>
          ))}
        </ul>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-accent-warm text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
