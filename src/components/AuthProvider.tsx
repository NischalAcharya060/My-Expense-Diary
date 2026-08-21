"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  completeOnboarding: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      setLoading(false);
      setIsConfigured(false);
      return;
    }

    setIsConfigured(true);

    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.message.includes("session")) {
        setUser(null);
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User } | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const signInWithGoogle = async () => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  // Optimistically flip the flag so the onboarding gate never re-triggers,
  // then persist to user_metadata for cross-device/session persistence.
  const completeOnboarding = async () => {
    setUser((u) =>
      u ? { ...u, user_metadata: { ...u.user_metadata, onboarded: true } } : u
    );
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { onboarded: true } });
    } catch {
      // Local state already updated; metadata sync can retry on next login.
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured, signInWithGoogle, signOut, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
