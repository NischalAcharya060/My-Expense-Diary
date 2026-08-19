"use client";

import { useAuth } from "@/components/AuthProvider";
import { LogIn, X } from "lucide-react";
import Link from "next/link";

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export default function AuthPrompt({ open, onClose, feature = "this feature" }: Props) {
  const { isConfigured } = useAuth();

  if (!isConfigured || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative paper-card p-6 max-w-sm w-full page-enter">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-ink-light hover:text-ink-dark"
        >
          <X size={16} />
        </button>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-accent-warm/10 rounded-full flex items-center justify-center">
            <LogIn size={22} className="text-accent-warm" />
          </div>
          <h3 className="font-handwritten text-xl text-ink-dark mb-1">Login Required</h3>
          <p className="text-sm text-ink-medium mb-5">
            Sign in to use {feature}
          </p>
          <Link
            href="/login"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <LogIn size={15} />
            Sign in with Google
          </Link>
        </div>
      </div>
    </div>
  );
}
