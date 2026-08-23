"use client";

import { useEffect, useState } from "react";
import ShortcutsModal from "@/components/ShortcutsModal";
import { isTypingTarget } from "@/lib/help";
import { hapticFeedback } from "@/lib/utils";

/**
 * Global layer that opens the keyboard shortcuts guide on "?" (desktop,
 * while not typing). Mounted once in the root layout.
 */
export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?" && !(e.shiftKey && e.key === "/")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      hapticFeedback();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <ShortcutsModal open={open} onClose={() => setOpen(false)} />;
}
