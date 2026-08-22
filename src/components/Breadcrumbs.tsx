import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Notebook-style breadcrumb trail for settings-area pages.
 * Renders an ordered list for screen readers; the last crumb
 * is the current page and is not a link.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center flex-wrap gap-1 text-xs text-ink-light">
        {items.map((crumb, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-ink-light/60 shrink-0" aria-hidden="true" />}
              {isLast || !crumb.href ? (
                <span className={isLast ? "text-ink-dark font-semibold" : undefined} aria-current={isLast ? "page" : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-accent-warm hover:underline transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
