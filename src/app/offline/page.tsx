import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline · My Expense Diary",
};

export default function OfflinePage() {
  return (
    <div className="notebook-paper min-h-screen flex items-center justify-center p-8 pt-16">
      <div className="paper-card p-10 max-w-sm w-full text-center rotate-[-1deg] relative shadow-lg">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
        <span className="text-6xl block mb-4" aria-hidden="true">
          📴
        </span>
        <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark font-semibold mb-2">You&apos;re offline</h1>
        <p className="text-xs text-ink-light leading-relaxed mb-6 max-w-[260px] mx-auto">
          This page needs a connection. Entries you log while offline are saved on your device and will sync
          automatically once you&apos;re back online.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
        >
          📓 Open my diary
        </Link>
      </div>
    </div>
  );
}
