"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Back arrow shown in page headers on mobile only.
 * Falls back to `fallback` when there is no history to go back to.
 */
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="lg:hidden shrink-0 -ml-2 p-2 rounded-lg text-ink-medium hover:text-ink-dark hover:bg-paper-dark/70 transition-colors cursor-pointer"
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
