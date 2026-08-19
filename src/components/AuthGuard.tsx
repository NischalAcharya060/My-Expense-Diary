"use client";

import { useAuth } from "@/components/AuthProvider";
import { LogIn, Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  feature?: string;
}

export default function AuthGuard({ children, feature = "this feature" }: Props) {
  const { user, loading, isConfigured } = useAuth();

  // If Supabase is not configured, allow access (local-only mode)
  if (!isConfigured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-32 bg-paper-dark rounded mt-4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="notebook-paper min-h-screen page-enter">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="paper-card p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-paper-dark rounded-full flex items-center justify-center">
              <Lock size={28} className="text-ink-light" />
            </div>
            <h2 className="font-handwritten text-2xl text-ink-dark mb-2">Login Required</h2>
            <p className="text-sm text-ink-medium mb-6">
              Sign in with your Google account to access {feature}.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-warm text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn size={16} />
              Sign in with Google
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
