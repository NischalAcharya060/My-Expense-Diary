"use client";

import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="notebook-paper min-h-screen flex items-center justify-center p-8">
      <div className="paper-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto bg-accent-warm/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-accent-warm" />
        </div>
        <h2 className="font-handwritten text-4xl text-ink-dark mb-2">404</h2>
        <p className="text-sm text-ink-light mb-6">
          This page doesn&apos;t exist. It may have been moved or deleted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity font-sans"
        >
          <Home size={14} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
