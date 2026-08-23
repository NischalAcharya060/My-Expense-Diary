/**
 * Shared plumbing for onboarding hints, contextual tips, the keyboard
 * shortcuts guide and the "What's new" changelog modal (Phase 27).
 */

export type HintId =
  | "tour-dashboard"
  | "tour-expenses"
  | "tour-bills"
  | "tour-insights"
  | "hint-swipe-delete";

const HINTS_KEY = "hints_seen_v1";

function readSeenHints(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(HINTS_KEY) ?? "{}") as Record<string, true>;
  } catch {
    return {};
  }
}

export function hasSeenHint(id: HintId): boolean {
  return !!readSeenHints()[id];
}

export function markHintSeen(id: HintId): void {
  try {
    localStorage.setItem(HINTS_KEY, JSON.stringify({ ...readSeenHints(), [id]: true }));
  } catch {
    // storage unavailable — hint will simply show again next session
  }
}

/** True while the user is typing into a field — global hotkeys must back off. */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

/* ---------- What's new changelog ---------- */

export const APP_VERSION = "0.10.0";

const WHATS_NEW_KEY = "whats_new_seen_version";

export interface ChangelogEntry {
  emoji: string;
  title: string;
  description: string;
}

export const WHATS_NEW: ChangelogEntry[] = [
  {
    emoji: "📴",
    title: "Works offline",
    description:
      "Log expenses without internet — entries are saved on your device and sync automatically once you're back online.",
  },
  {
    emoji: "❤️",
    title: "Financial Health score",
    description: "A daily gauge on your dashboard rates your budgeting, savings and punctuality.",
  },
  {
    emoji: "📊",
    title: "Interactive charts",
    description:
      "Long-press any chart point to pin exact values, pinch to zoom into busy weeks, tap pie slices to drill down.",
  },
  {
    emoji: "⌨️",
    title: "Keyboard shortcuts",
    description: "Press ? anywhere on desktop to see everything the diary can do from the keyboard.",
  },
];

export function hasSeenWhatsNew(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(WHATS_NEW_KEY) === APP_VERSION;
  } catch {
    return true;
  }
}

export function markWhatsNewSeen(): void {
  try {
    localStorage.setItem(WHATS_NEW_KEY, APP_VERSION);
  } catch {
    // ignore storage errors
  }
}
