"use client";

import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative paper-card p-6 max-w-sm w-full page-enter">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-ink-light hover:text-ink-dark cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-accent-red/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={22} className="text-accent-red" />
          </div>
          <h3 className="font-handwritten text-xl text-ink-dark mb-1">{title}</h3>
          <p className="text-sm text-ink-medium mb-5">{message}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded text-xs font-medium text-ink-medium hover:bg-paper-dark transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-accent-red text-white rounded text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loading ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
