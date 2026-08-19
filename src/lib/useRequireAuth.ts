"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

export function useRequireAuth() {
  const { user, isConfigured } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (!isConfigured || user) {
        action?.();
      } else {
        setShowAuthPrompt(true);
      }
    },
    [user, isConfigured]
  );

  return { requireAuth, showAuthPrompt, setShowAuthPrompt };
}
