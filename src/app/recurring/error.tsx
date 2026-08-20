"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function RecurringError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Recurring page error:", error);
  }, [error]);

  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="paper-card p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto bg-accent-red/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-accent-red" />
        </div>
        <h2 className="font-handwritten text-2xl text-ink-dark mb-2">Couldn&apos;t load recurring payments</h2>
        <p className="text-sm text-ink-light mb-4">
          Failed to fetch your recurring payments. Check your connection and try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer font-sans"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    </div>
  );
}
