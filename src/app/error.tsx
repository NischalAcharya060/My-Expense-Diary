"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="notebook-paper min-h-screen flex items-center justify-center p-8">
      <div className="paper-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto bg-accent-red/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-accent-red" />
        </div>
        <h2 className="font-handwritten text-2xl text-ink-dark mb-2">Something went wrong</h2>
        <p className="text-sm text-ink-light mb-1">
          An unexpected error occurred. Your data is safe.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-light/60 mb-4 font-mono">Error: {error.digest}</p>
        )}
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
