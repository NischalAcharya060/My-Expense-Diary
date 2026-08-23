"use client";

import { useEffect, useState } from "react";
import { hasSeenWhatsNew, markWhatsNewSeen, WHATS_NEW, APP_VERSION } from "@/lib/help";
import { hapticFeedback } from "@/lib/utils";

/**
 * "What's new" changelog modal — shown once per app version after updates.
 * Mounted once in the root layout.
 */
export default function WhatsNew() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive || hasSeenWhatsNew()) return;
      // Let the page settle before interrupting with the changelog.
      setTimeout(() => {
        if (alive) setOpen(true);
      }, 1800);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!open) return null;

  const dismiss = () => {
    hapticFeedback();
    markWhatsNewSeen();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[88] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        data-gesture-block
        className="paper-card w-full max-w-sm p-6 pt-8 relative shadow-xl rotate-[-0.5deg]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 -rotate-1 shadow-sm rounded-sm pointer-events-none" />
        <div className="text-center mb-4">
          <span className="text-5xl block mb-1.5" aria-hidden="true">
            📓
          </span>
          <h2 id="whats-new-title" className="font-handwritten text-3xl text-ink-dark font-semibold">
            What&rsquo;s new
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent-warm mt-0.5">Version {APP_VERSION}</p>
        </div>
        <ul className="space-y-3 mb-6">
          {WHATS_NEW.map((entry) => (
            <li key={entry.title} className="flex items-start gap-2.5">
              <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">
                {entry.emoji}
              </span>
              <div>
                <p className="text-xs font-bold text-ink-dark">{entry.title}</p>
                <p className="text-[11px] text-ink-light leading-relaxed">{entry.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={dismiss}
          className="w-full py-2.5 bg-accent-warm text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          Nice — let&rsquo;s go!
        </button>
      </div>
    </div>
  );
}
