"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const { user, loading, isConfigured, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="notebook-paper min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ink-light font-handwritten text-xl">Loading...</div>
      </div>
    );
  }

  if (user) return null;

  // Supabase not configured — show setup instructions
  if (!isConfigured) {
    return (
      <div className="notebook-paper min-h-screen page-enter">
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="paper-card p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-paper-dark rounded-full flex items-center justify-center mb-3">
                <BookOpen size={28} className="text-accent-warm" />
              </div>
              <h1 className="font-handwritten text-4xl text-ink-dark">My Expense Diary</h1>
            </div>
            <div className="paper-card p-4 text-left text-sm text-ink-medium space-y-2">
              <p className="font-medium text-ink-dark">Supabase not configured</p>
              <p>To enable Google sign-in, add your Supabase credentials to <code className="bg-paper-dark px-1 rounded text-xs">.env</code>:</p>
              <pre className="bg-paper-dark p-2 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
              </pre>
              <p className="text-xs text-ink-light">Then enable Google provider in your Supabase dashboard under Authentication &gt; Providers.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="paper-card p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-paper-dark rounded-full flex items-center justify-center mb-3">
              <BookOpen size={28} className="text-accent-warm" />
            </div>
            <h1 className="font-handwritten text-4xl text-ink-dark">My Expense Diary</h1>
            <p className="text-sm text-ink-light mt-2">Your personal notebook for tracking expenses</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(0,0,0,0.08)]" />
            <span className="text-xs text-ink-light uppercase tracking-wide">Sign in to continue</span>
            <div className="flex-1 h-px bg-[rgba(0,0,0,0.08)]" />
          </div>

          {/* Google sign-in button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-[rgba(0,0,0,0.12)] rounded-lg text-sm font-medium text-neutral-800 hover:bg-gray-50 hover:border-[rgba(0,0,0,0.2)] transition-all shadow-sm cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer note */}
          <p className="text-[11px] text-ink-light mt-6 leading-relaxed">
            By signing in, your budgets and notes will be saved to your account
            and synced across devices.
          </p>
        </div>
      </div>
    </div>
  );
}
