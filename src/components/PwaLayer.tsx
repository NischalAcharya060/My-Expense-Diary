"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { hapticFeedback } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The install event usually fires long before React hydrates, so capture the
// prompt at module scope and let the component pick it up afterwards.
let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa-install-available"));
  });
}

const VISITS_KEY = "pwa_visit_count";
const INSTALLED_KEY = "pwa_installed";
const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_VISITS = 3;

function markInstalled(): void {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

export default function PwaLayer() {
  // null = unknown yet, avoids an offline flash during hydration.
  const [offline, setOffline] = useState<boolean | null>(null);
  const [installReady, setInstallReady] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  // Register the service worker slightly after first paint so it never
  // competes with the app's own startup requests.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Count visits and decide whether the install suggestion is due.
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { standalone?: boolean };
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
      if (isStandalone || localStorage.getItem(INSTALLED_KEY) === "1") {
        markInstalled();
        return;
      }
      const visits = parseInt(localStorage.getItem(VISITS_KEY) ?? "0", 10) + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      if (visits < MIN_VISITS) return;
      const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) ?? "0", 10);
      if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => setShowInstallModal(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Track whether the browser has actually offered installation.
  useEffect(() => {
    const checkAvailability = () => setInstallReady(deferredPrompt !== null);
    checkAvailability();
    window.addEventListener("pwa-install-available", checkAvailability);
    return () => window.removeEventListener("pwa-install-available", checkAvailability);
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      markInstalled();
      setShowInstallModal(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const handleInstall = async () => {
    hapticFeedback();
    setShowInstallModal(false);
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") markInstalled();
      else markDismissed();
    } catch {
      markDismissed();
    } finally {
      deferredPrompt = null;
      setInstallReady(false);
    }
  };

  const handleDismiss = () => {
    hapticFeedback();
    markDismissed();
    setShowInstallModal(false);
  };

  return (
    <>
      {offline === true && (
        <div
          role="status"
          aria-live="polite"
          data-gesture-block
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 z-[80] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink-dark text-paper-bg text-xs font-semibold shadow-lg"
        >
          <WifiOff size={14} className="shrink-0" />
          <span>You&rsquo;re offline — entries are saved and will sync automatically.</span>
        </div>
      )}

      {showInstallModal && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleDismiss}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            data-gesture-block
            className="paper-card w-full max-w-sm p-6 pt-8 text-center relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-ink-light hover:bg-paper-bg hover:text-ink-dark transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
            <span className="text-5xl block mb-2" aria-hidden="true">
              📓
            </span>
            <h2 id="pwa-install-title" className="font-handwritten text-2xl text-ink-dark font-semibold mb-1.5">
              Keep your diary close
            </h2>
            <p className="text-xs text-ink-light leading-relaxed mb-4 max-w-[260px] mx-auto">
              Install My Expense Diary on your home screen for one-tap access and offline logging.
            </p>
            <ul className="text-[11px] text-ink-dark space-y-1.5 mb-5" aria-label="Benefits">
              <li className="flex items-center justify-center gap-1.5">
                <WifiOff size={12} className="text-accent-green shrink-0" /> Log expenses even without internet
              </li>
              <li className="flex items-center justify-center gap-1.5">
                <Download size={12} className="text-accent-green shrink-0" /> Everything syncs when you reconnect
              </li>
            </ul>
            <button
              type="button"
              onClick={handleInstall}
              disabled={!installReady}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                installReady
                  ? "bg-accent-warm text-white hover:opacity-90 cursor-pointer shadow-sm"
                  : "bg-paper-bg text-ink-light border border-dashed border-accent-warm/40 cursor-default"
              }`}
            >
              <Download size={15} />
              {installReady ? "Install app" : "Opening installer…"}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-2.5 text-[11px] font-semibold text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
