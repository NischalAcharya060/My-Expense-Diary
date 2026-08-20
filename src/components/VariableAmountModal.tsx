"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  title?: string;
  label?: string;
}

export default function VariableAmountModal({
  open,
  onClose,
  onConfirm,
  title = "Enter Variable Amount",
  label = "Amount",
}: Props) {
  const [amount, setAmount] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0;

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  const handleSubmit = () => {
    if (valid) {
      onConfirm(parsed);
      setAmount("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative paper-card p-6 max-w-sm w-full page-enter">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 text-ink-light hover:text-ink-dark cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="text-center">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">{title}</h3>
          <div className="mb-5">
            <label className="block text-xs text-ink-medium mb-1 text-left">{label}</label>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) handleSubmit();
                if (e.key === "Escape") handleClose();
              }}
              autoFocus
              className="w-full px-3 py-2 border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
            />
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded text-xs font-medium text-ink-medium hover:bg-paper-dark transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!valid}
              className="px-4 py-2 bg-accent-warm text-white rounded text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
