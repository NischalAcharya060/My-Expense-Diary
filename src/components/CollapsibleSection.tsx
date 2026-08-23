"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  /** Current value shown under the title (e.g. "Dark mode active"). */
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  // Sections start collapsed by default and expand on interaction.
  defaultOpen = false,
  danger = false,
  className = "",
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = useId();

  const toggle = () => setOpen((o) => !o);

  return (
    <section
      className={`paper-card mb-6 ${danger ? "border-l-2 border-accent-red" : ""} ${className}`}
      aria-labelledby={headingId}
    >
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-controls={headingId}
        className={`w-full flex items-center gap-3 p-6 pb-4 text-left cursor-pointer ${
          open ? "" : "pb-6"
        }`}
      >
        <span className={danger ? "text-accent-red" : "text-ink-dark"}>{icon}</span>
        <span className="flex-1 min-w-0">
          <span
            id={headingId}
            className={`block font-handwritten text-xl font-semibold ${
              danger ? "text-accent-red" : "text-ink-dark"
            }`}
          >
            {title}
          </span>
          {subtitle && (
            <span className="block text-[11px] text-ink-light truncate mt-0.5">{subtitle}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-light transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* grid-rows trick animates height without measuring content */}
      <div
        className={`grid transition-[grid-template-rows] duration-250 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}
