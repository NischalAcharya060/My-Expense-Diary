"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const { user, loading, isConfigured, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                {/* eslint-disable-next-line @next/next/no-img-element -- local static logo */}
                <img src="/logo/org-logo.png" alt="Logo" className="w-10 h-10 rounded-md" />
              </div>
              <h1 className="font-handwritten text-4xl text-ink-dark">My Expense Diary</h1>
            </div>
            <div className="paper-card p-4 text-left text-sm text-ink-medium space-y-2">
              <p className="font-medium text-ink-dark">Supabase not configured</p>
              <p>To enable sign-in, add your Supabase credentials to <code className="bg-paper-dark px-1 rounded text-xs">.env</code>:</p>
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

  const handleUnifiedAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setAuthLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Failed to load Supabase auth client.");
      setAuthLoading(false);
      return;
    }

    try {
      // 1. Attempt to sign in first
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!signInErr) {
        toast("Welcome back!");
        router.push("/");
        return;
      }

      // 2. If sign in fails due to credential validation (wrong password OR email doesn't exist)
      const isInvalidCredentials = 
        signInErr.message.includes("Invalid login credentials") || 
        signInErr.status === 400;

      if (isInvalidCredentials) {
        // 3. Attempt to sign up since the account might be new
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (!signUpErr) {
          toast("Account created successfully!");
          router.push("/");
          return;
        }

        // 4. If sign up fails because user already exists, it means they typed the wrong password!
        const isAlreadyRegistered = 
          signUpErr.message.includes("already registered") || 
          signUpErr.message.includes("already exists") ||
          signUpErr.status === 422;

        if (isAlreadyRegistered) {
          throw new Error("Incorrect password for this account.");
        } else {
          throw signUpErr;
        }
      } else {
        throw signInErr;
      }
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="paper-card p-8 text-center relative rotate-[0.5deg]">
          
          {/* Logo Header */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 flex items-center justify-center rounded-2xl shadow-sm mb-4 border border-[rgba(0,0,0,0.06)] relative rotate-[-1.5deg] hover:rotate-0 transition-transform duration-200">
              {/* Tape style overlay */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-3 bg-amber-200/25 border border-amber-300/10 rotate-1 rounded-sm pointer-events-none" />
              {/* eslint-disable-next-line @next/next/no-img-element -- local static logo */}
              <img src="/logo/org-logo.png" alt="Logo" className="w-12 h-12 rounded-xl" />
            </div>
            <h1 className="font-handwritten text-4xl text-ink-dark font-bold leading-tight">My Expense Diary</h1>
            <p className="text-xs text-ink-light mt-1.5 uppercase tracking-widest font-semibold font-sans">Finance Tracker</p>
          </div>

          {/* Alert Error Message Box */}
          {error && (
            <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg flex items-start gap-2 text-left animate-in fade-in">
              <AlertCircle size={16} className="text-accent-red shrink-0 mt-0.5" />
              <span className="text-xs text-accent-red font-medium leading-tight">{error}</span>
            </div>
          )}


          {/* Unified Email / Password Form */}
          <form onSubmit={handleUnifiedAuth} className="space-y-4 text-left mb-6">
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light uppercase tracking-wide mb-1 font-semibold">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-medium focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50 font-sans tracking-wide"
            >
              {authLoading ? "Verifying..." : "Continue"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(0,0,0,0.06)]" />
            <span className="text-[10px] text-ink-light uppercase tracking-widest font-bold">or continue with</span>
            <div className="flex-1 h-px bg-[rgba(0,0,0,0.06)]" />
          </div>

          {/* Google sign-in button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-[rgba(0,0,0,0.12)] rounded-lg text-sm font-medium text-neutral-800 hover:bg-gray-50 hover:border-[rgba(0,0,0,0.2)] transition-all shadow-sm cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          {/* Footer note */}
          <p className="text-[11px] text-ink-light mt-6 leading-relaxed">
            New here? Enter your email and a password to create a diary. Existing user? Enter your credentials to resume your logs.
          </p>
        </div>
      </div>
    </div>
  );
}
