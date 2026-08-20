"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "border-accent-green/30 bg-paper-bg",
  error: "border-accent-red/30 bg-paper-bg",
  info: "border-accent-blue/30 bg-paper-bg",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-accent-green",
  error: "text-accent-red",
  info: "text-accent-blue",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border
        shadow-lg backdrop-blur-sm toast-enter min-w-[260px] max-w-[360px]
        ${STYLES[toast.type]}
      `}
    >
      <Icon size={18} className={ICON_COLORS[toast.type]} />
      <span className="text-sm text-ink-dark font-medium flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="p-0.5 text-ink-light hover:text-ink-dark">
        <X size={14} />
      </button>
    </div>
  );
}
