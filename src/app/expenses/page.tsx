"use client";

import { useEffect, useState, useMemo, useCallback, memo, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Plus, Trash2, Search, Edit2, CalendarDays, X, ArrowDownUp, Copy, Eye, Check, ChevronDown, Clock, ReceiptText, SlidersHorizontal, CloudUpload } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useExpenses, useCategories, useNotes } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { Expense, Note } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { hapticFeedback } from "@/lib/utils";
import { useTapScrollTop } from "@/lib/useTapScrollTop";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import BackButton from "@/components/BackButton";
import PullToRefresh from "@/components/PullToRefresh";
import { useToast } from "@/components/Toast";

const AddExpenseModal = dynamic(() => import("@/components/AddExpenseModal"), { ssr: false });
const EditExpenseModal = dynamic(() => import("@/components/EditExpenseModal"), { ssr: false });

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = "recent_searches_v1";

type SortMode = "newest" | "oldest" | "highest" | "lowest";

const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  highest: "Highest amount",
  lowest: "Lowest amount",
};

/* Shared styling for every filter-bar control — one height scale, radius scale,
   and visible focus ring so the bar reads as a single component (44px touch
   targets on mobile, compact 40px on desktop). */
const CONTROL_CLS =
  "bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-ink-dark placeholder:text-ink-light/40 transition-colors cursor-pointer focus:outline-none focus-visible:border-accent-warm focus-visible:ring-2 focus-visible:ring-accent-warm/25";

const CHIP_BASE_CLS =
  "shrink-0 whitespace-nowrap inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm/40";

const CHIP_ACTIVE_CLS = "bg-accent-warm text-white shadow-sm border border-transparent";
const CHIP_IDLE_CLS =
  "bg-paper-bg text-ink-medium hover:text-ink-dark hover:border-accent-warm/50 border border-[rgba(0,0,0,0.07)]";

/** Human-friendly day header: Today / Yesterday, otherwise "Monday, Aug 18". */
function getDateLabel(dateStr: string, todayStr: string): string {
  const yesterdayStr = format(subDays(new Date(`${todayStr}T00:00:00`), 1), "yyyy-MM-dd");
  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return format(new Date(`${dateStr}T00:00:00`), "EEEE, MMMM d");
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

function ExpensesPageInner() {
  const { expenses, loaded, refetch: refetchExpenses, deleteExpense, addExpense, updateExpense } = useExpenses();
  const { categories, refetch: refetchCategories, getCategoryByName } = useCategories();
  const { notes } = useNotes();
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced committed query used by filters
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const [activeRecent, setActiveRecent] = useState(-1);
  const [filterBarHeight, setFilterBarHeight] = useState(0);
  const [filterCategory, setFilterCategory] = useState("All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [quickFilter, setQuickFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ key: string; days: number }>({ key: "", days: PAGE_SIZE });
  const searchParams = useSearchParams();
  const filterBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();
  const tapTop = useTapScrollTop();

  useEffect(() => {
    if (searchParams.get("add") === "true") requireAuth(() => setShowAdd(true));
  }, [searchParams, requireAuth]);

  // Pre-fill search from URL (?q=) — used by the command palette.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchInput(q);
  }, [searchParams]);

  // Deep-link category filter (?category=Food) — used by insights chart taps.
  useEffect(() => {
    const c = searchParams.get("category");
    if (!c) return;
    setFilterCategory((prev) => (prev === c ? prev : c));
    if (!searchParams.get("month")) {
      setDateRange((prev) => (prev === null ? prev : null));
      setQuickFilter((prev) => (prev === "All" ? prev : "All"));
    }
  }, [searchParams]);

  // Deep-link a calendar month (?month=YYYY-MM) — used by insights bar-chart taps.
  useEffect(() => {
    const m = searchParams.get("month");
    if (!m || !/^\d{4}-\d{2}$/.test(m)) return;
    const [y, mo] = m.split("-").map(Number);
    const start = `${m}-01`;
    const end = format(endOfMonth(new Date(y, mo - 1, 1)), "yyyy-MM-dd");
    setDateRange((prev) => (prev?.start === start && prev?.end === end ? prev : { start, end }));
    setQuickFilter("Custom");
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Debounce the committed search term + remember successful queries.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      setSearch(q);
      if (!q) return;
      setRecentSearches((prev) => {
        if (prev[0]?.toLowerCase() === q.toLowerCase()) return prev;
        const next = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
        try {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        } catch {
          // storage unavailable or full — recent-search writes are best-effort
        }
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Track the sticky filter bar height so day headers stick right beneath it.
  useEffect(() => {
    const el = filterBarRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setFilterBarHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Detect when the sticky filter bar is stuck so it can collapse to a slim bar.
  const filterSentinelRef = useRef<HTMLDivElement>(null);
  const [filterStuck, setFilterStuck] = useState(false);
  // On small screens the filter controls collapse behind a "Filters" toggle button.
  // Desktop ignores this state (sm:flex forces the panels visible).
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  useEffect(() => {
    const el = filterSentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setFilterStuck(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ---------- recent searches helpers ---------- */

  const persistRecents = useCallback((next: string[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable or full — recent-search writes are best-effort
    }
  }, []);

  const selectRecent = useCallback(
    (q: string) => {
      setSearchInput(q);
      setSearch(q);
      setActiveRecent(-1);
      setRecentsOpen(false);
      searchInputRef.current?.focus();
    },
    []
  );

  const removeRecent = useCallback(
    (q: string) => {
      setRecentSearches((prev) => {
        const next = prev.filter((s) => s !== q);
        persistRecents(next);
        return next;
      });
      setActiveRecent(-1);
    },
    [persistRecents]
  );

  const clearAllRecents = useCallback(() => {
    setRecentSearches([]);
    setActiveRecent(-1);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore storage errors — list is already cleared in state
    }
  }, []);

  // Ctrl/Cmd+K toggles focus on the search bar from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = searchInputRef.current;
        if (!el) return;
        if (document.activeElement === el) {
          el.blur();
        } else {
          el.focus();
          el.select();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filterKey = `${search}|${filterCategory}|${dateRange?.start ?? ""}|${dateRange?.end ?? ""}|${sortBy}`;
  const visibleDays = pagination.key === filterKey ? pagination.days : PAGE_SIZE;

  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => {
          const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
          const matchCategory = filterCategory === "All" || e.category === filterCategory;
          let matchDate = true;
          if (dateRange) {
            matchDate = e.date >= dateRange.start && e.date <= dateRange.end;
          }
          return matchSearch && matchCategory && matchDate;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "oldest":
              return a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at);
            case "highest":
              return b.amount - a.amount || b.date.localeCompare(a.date);
            case "lowest":
              return a.amount - b.amount || b.date.localeCompare(a.date);
            default:
              return b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);
          }
        }),
    [expenses, search, filterCategory, dateRange, sortBy]
  );

  const grouped = useMemo(() => {
    const g: Record<string, Expense[]> = {};
    filtered.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [filtered]);

  // For amount sorts the day groups are ordered by their daily total (ties: newer first).
  const groupEntries = useMemo(() => {
    const entries = Object.entries(grouped);
    if (sortBy !== "highest" && sortBy !== "lowest") return entries;
    const dir = sortBy === "highest" ? -1 : 1;
    return [...entries].sort(([dateA, dayA], [dateB, dayB]) => {
      const totalA = dayA.reduce((s, e) => s + e.amount, 0);
      const totalB = dayB.reduce((s, e) => s + e.amount, 0);
      return dir * (totalA - totalB) || dateB.localeCompare(dateA);
    });
  }, [grouped, sortBy]);

  const notesByExpense = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach((n) => {
      if (!n.expense_id) return;
      const list = map.get(n.expense_id);
      if (list) list.push(n);
      else map.set(n.expense_id, [n]);
    });
    return map;
  }, [notes]);

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleEdit = useCallback(
    (expense: Expense) => {
      requireAuth(() => setEditingExpense(expense));
    },
    [requireAuth]
  );

  const handleDuplicate = useCallback(
    (expense: Expense) => {
      requireAuth(async () => {
        try {
          await addExpense({
            name: expense.name,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            payment_method: expense.payment_method,
            note: expense.note,
            receipt_url: expense.receipt_url,
            // recurring_payment_id is intentionally dropped: the copy is a
            // standalone purchase, not part of the auto-pay schedule.
            expense_type: expense.expense_type,
          });
          toast(`Duplicated "${expense.name}"`);
        } catch (err) {
          console.error(err);
          toast("Failed to duplicate expense", "error");
        }
      });
    },
    [addExpense, requireAuth, toast]
  );

  const handleQuickAmount = useCallback(
    (expense: Expense, amount: number) => {
      requireAuth(async () => {
        try {
          await updateExpense(expense.id, { amount });
          toast("Amount updated");
        } catch (err) {
          console.error(err);
          toast("Failed to update amount", "error");
        }
      });
    },
    [requireAuth, updateExpense, toast]
  );

  if (!loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
            <div className="shimmer h-9 w-52 rounded" />
            <div className="shimmer h-10 w-28 rounded-lg" />
          </div>
          {/* Filter bar */}
          <div className="mb-6 p-3 rounded-lg bg-paper-dark/30 border border-[rgba(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="shimmer h-10 flex-1 rounded-md" />
              <div className="shimmer h-10 w-full sm:w-36 rounded-md" />
            </div>
          </div>
          {/* Journal rows grouped by day */}
          {[1, 2].map((day) => (
            <div key={day} className="mb-6">
              <div className="flex items-center gap-3 mb-2 px-1">
                <div className="shimmer h-6 w-40 rounded" />
                <span className="dots" />
                <div className="shimmer h-6 w-16 rounded" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="paper-card px-4 py-3 flex items-center gap-3 border-l-4 border-l-paper-dark">
                    <div className="shimmer w-7 h-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="shimmer h-3.5 rounded" style={{ width: `${45 + ((day * 13 + row * 17) % 25)}%` }} />
                      <div className="shimmer h-2.5 w-1/4 rounded" />
                    </div>
                    <div className="shimmer h-4 w-14 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  function applyQuickFilter(type: string) {
    setQuickFilter(type);
    if (type === "All") {
      setDateRange(null);
    } else if (type === "Today") {
      setDateRange({ start: todayStr, end: todayStr });
    } else if (type === "This Week") {
      const start = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      setDateRange({ start, end });
    } else if (type === "This Month") {
      const start = format(startOfMonth(today), "yyyy-MM-dd");
      const end = format(endOfMonth(today), "yyyy-MM-dd");
      setDateRange({ start, end });
    } else if (type === "Last 30 Days") {
      const start = format(subDays(today, 30), "yyyy-MM-dd");
      setDateRange({ start, end: todayStr });
    }
  }

  const visibleEntries = groupEntries.slice(0, visibleDays);
  const hiddenDays = groupEntries.length - visibleEntries.length;

  const activeFilterCount =
    (search.trim() ? 1 : 0) + (filterCategory !== "All" ? 1 : 0) + (dateRange ? 1 : 0);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilterCategory("All");
    setDateRange(null);
    setQuickFilter("All");
    searchInputRef.current?.focus();
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <PullToRefresh onRefresh={() => Promise.all([refetchExpenses(), refetchCategories()])} />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">

        {/* Header */}
        <div
          {...tapTop}
          className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient cursor-pointer lg:cursor-default"
        >
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark">Daily Expenses</h1>
              <p className="text-xs text-ink-light mt-0.5">Your financial journal logs sorted chronologically.</p>
            </div>
          </div>
          <button
            onClick={() => requireAuth(() => setShowAdd(true))}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Log Expense
          </button>
        </div>

        {/* Sticky sentinel — lets us know when the filter bar is stuck */}
        <div ref={filterSentinelRef} aria-hidden className="h-px -mb-px" />

        {/* Search & Filter bar (sticky on scroll; collapses to a slim bar while stuck) */}
        <div
          ref={filterBarRef}
          className={`sticky top-2 z-40 mb-6 rounded-lg bg-paper-bg border border-[rgba(0,0,0,0.06)] transition-all duration-200 ${
            filterStuck ? "px-3 py-1.5 shadow-md" : "p-3 shadow-sm"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search + mobile Filters toggle — sm:contents lets the search field rejoin
                the desktop flex row while the toggle disappears */}
            <div className="flex items-stretch gap-2 sm:contents">
              <div
                className="relative flex-1 min-w-0"
                onFocus={() => {
                  setRecentsOpen(true);
                  setActiveRecent(-1);
                }}
                onBlur={(e) => {
                  if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) {
                    setRecentsOpen(false);
                    setActiveRecent(-1);
                  }
                }}
              >
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by keyword..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  const recentsVisible = recentsOpen && !searchInput.trim() && recentSearches.length > 0;
                  if (e.key === "Escape") {
                    // First Esc closes the recents popover, second leaves the field.
                    if (recentsVisible) {
                      setRecentsOpen(false);
                    } else {
                      e.currentTarget.blur();
                    }
                    return;
                  }
                  if (!recentsVisible) {
                    if (e.key === "Enter") setSearch(searchInput.trim());
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveRecent((i) => Math.min(i + 1, recentSearches.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveRecent((i) => Math.max(i - 1, -1));
                  } else if (e.key === "Enter" && activeRecent >= 0) {
                    e.preventDefault();
                    selectRecent(recentSearches[activeRecent]);
                  }
                }}
                aria-label="Search expenses"
                autoComplete="off"
                enterKeyHint="search"
                className={`${CONTROL_CLS} w-full h-11 sm:h-10 pl-10 pr-10 sm:pr-16`}
              />
              {/* Clear button — replaces the Ctrl K hint while typing */}
              {searchInput.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setActiveRecent(-1);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full text-ink-light hover:text-accent-red hover:bg-paper-dark active:scale-90 transition-all cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { searchInputRef.current?.focus(); searchInputRef.current?.select(); }}
                  className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-6 items-center text-[10px] text-ink-light bg-paper-dark border border-[rgba(0,0,0,0.08)] rounded px-1.5 font-sans hover:text-accent-warm hover:border-accent-warm/40 transition-colors cursor-pointer"
                  aria-label="Focus search (Ctrl+K)"
                  title="Press Ctrl+K to jump to search from anywhere"
                >
                  Ctrl K
                </button>
              )}

              {/* Recent searches popover — full-width sheet on mobile, compact 384px panel on desktop.
                  Only shown on an empty input so it never sprawls over live results.
                  Keyboard: ↑/↓ to highlight, Enter to pick, Esc to dismiss. */}
              {recentsOpen && !searchInput.trim() && recentSearches.length > 0 && (
                <div className="menu-in absolute left-0 top-full mt-2 w-full sm:w-96 z-50 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-xl shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-paper-dark/60 border-b border-[rgba(0,0,0,0.05)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-light">Recent searches</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearAllRecents}
                      className="text-[11px] font-medium text-ink-light hover:text-accent-red px-2 py-1 rounded-md hover:bg-accent-red/10 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-[264px] overflow-y-auto py-1">
                    {recentSearches.map((q, i) => (
                      <div
                        key={q}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectRecent(q)}
                        onMouseEnter={() => setActiveRecent(i)}
                        className={`w-full flex items-center gap-3 pl-4 pr-2.5 py-1 cursor-pointer transition-colors ${
                          i === activeRecent ? "bg-paper-dark" : ""
                        }`}
                      >
                        <Clock size={14} className="text-ink-light shrink-0" />
                        <span className={`flex-1 truncate text-sm py-2 ${i === activeRecent ? "text-ink-dark font-medium" : "text-ink-dark"}`}>
                          {q}
                        </span>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={`Remove “${q}” from recent searches`}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecent(q);
                          }}
                          className="grid place-items-center w-8 h-8 rounded-full text-ink-light/70 hover:text-accent-red hover:bg-accent-red/10 active:scale-90 transition-all cursor-pointer shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>

              {/* Mobile-only Filters toggle — collapses the selects + date-chip panels.
                  Shows the active-filter count so hidden filters stay discoverable. */}
              <button
                type="button"
                onClick={() => {
                  setFiltersExpanded((v) => !v);
                  hapticFeedback();
                }}
                aria-expanded={filtersExpanded}
                aria-controls="expenses-filter-panel"
                title={filtersExpanded ? "Hide filters" : "Show filters"}
                className={`sm:hidden shrink-0 inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm/40 transition-all duration-150 active:scale-95 ${
                  filtersExpanded
                    ? "bg-accent-warm text-white border border-transparent shadow-sm"
                    : "bg-paper-bg text-ink-dark border border-[rgba(0,0,0,0.08)] hover:border-accent-warm/50"
                }`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      filtersExpanded ? "bg-white text-accent-warm" : "bg-accent-warm text-white"
                    }`}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            {/* Category + Sort — side by side on small screens instead of stacked.
                Collapsed behind the Filters toggle on mobile; always visible on desktop. */}
            <div
              id="expenses-filter-panel"
              className={`menu-in ${filtersExpanded ? "grid" : "hidden"} sm:flex grid-cols-2 gap-2 sm:gap-3`}
            >
              <div className="relative min-w-0">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  aria-label="Filter by category"
                  className={`${CONTROL_CLS} w-full sm:w-auto sm:flex-none h-11 sm:h-10 pl-3.5 pr-9 appearance-none truncate`}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-light" />
              </div>
              {/* Sort toggle */}
              <div className="relative min-w-0">
                <ArrowDownUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMode)}
                  aria-label="Sort expenses"
                  title={`Sorted by ${SORT_LABELS[sortBy].toLowerCase()}`}
                  className={`${CONTROL_CLS} w-full sm:w-auto h-11 sm:h-10 pl-9 pr-9 appearance-none truncate`}
                >
                  {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                    <option key={mode} value={mode}>{SORT_LABELS[mode]}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-light" />
              </div>
            </div>
          </div>
          {/* Date range quick filters — horizontally scrollable strip, hidden while the bar is stuck.
              Also collapsed behind the Filters toggle on mobile. */}
          {!filterStuck && (
            <div className={`menu-in ${filtersExpanded ? "flex" : "hidden"} sm:flex items-center gap-2 mt-2.5`}>
              <CalendarDays size={14} className="text-ink-light shrink-0" />
              <div className="relative flex-1 min-w-0">
                <div
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-0.5 py-0.5"
                  aria-label="Quick date filters"
                >
                  {["All", "Today", "This Week", "This Month", "Last 30 Days"].map((f) => (
                    <button
                      key={f}
                      onClick={() => applyQuickFilter(f)}
                      aria-pressed={quickFilter === f}
                      className={`${CHIP_BASE_CLS} ${quickFilter === f ? CHIP_ACTIVE_CLS : CHIP_IDLE_CLS}`}
                    >
                      {f}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setQuickFilter("Custom");
                      if (!dateRange) setDateRange({ start: format(subDays(today, 30), "yyyy-MM-dd"), end: todayStr });
                    }}
                    aria-pressed={quickFilter === "Custom"}
                    className={`${CHIP_BASE_CLS} ${quickFilter === "Custom" ? CHIP_ACTIVE_CLS : CHIP_IDLE_CLS}`}
                  >
                    Custom
                  </button>
                  {quickFilter === "Custom" && (
                    <>
                      <input
                        type="date"
                        value={dateRange?.start || ""}
                        onChange={(e) => setDateRange((prev) => ({ start: e.target.value, end: prev?.end || todayStr }))}
                        aria-label="Custom range start date"
                        className={`shrink-0 h-9 px-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-lg text-xs text-ink-dark focus:outline-none focus-visible:border-accent-warm focus-visible:ring-2 focus-visible:ring-accent-warm/25 transition-colors w-[132px]`}
                      />
                      <span className="shrink-0 text-[10px] text-ink-light">to</span>
                      <input
                        type="date"
                        value={dateRange?.end || ""}
                        onChange={(e) => setDateRange((prev) => ({ start: prev?.start || todayStr, end: e.target.value }))}
                        aria-label="Custom range end date"
                        className={`shrink-0 h-9 px-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-lg text-xs text-ink-dark focus:outline-none focus-visible:border-accent-warm focus-visible:ring-2 focus-visible:ring-accent-warm/25 transition-colors w-[132px]`}
                      />
                    </>
                  )}
                  {dateRange && (
                    <button
                      onClick={() => { setDateRange(null); setQuickFilter("All"); }}
                      className="shrink-0 grid place-items-center w-9 h-9 rounded-full hover:bg-paper-dark text-ink-light hover:text-accent-red active:scale-90 transition-all cursor-pointer"
                      aria-label="Clear date filter"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {/* Scroll affordance fade on the right edge */}
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-paper-bg/90 to-transparent rounded-r-md"
                  aria-hidden="true"
                />
              </div>
              {/* Active filter count + clear-all */}
              {activeFilterCount > 0 && (
                <div className="shrink-0 flex items-center gap-2 pl-0.5">
                  <span
                    className="inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-semibold bg-accent-warm/15 text-accent-warm border border-accent-warm/30 whitespace-nowrap"
                    title={`${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`}
                  >
                    {activeFilterCount}
                    {" "}
                    <span className="hidden sm:inline">filter{activeFilterCount === 1 ? "" : "s"} active</span>
                    <span className="sm:hidden">active</span>
                  </span>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-medium text-accent-red hover:bg-accent-red/10 active:scale-95 transition-all cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red/40"
                    aria-label="Clear all filters"
                  >
                    <X size={13} />
                    <span className="hidden sm:inline">Clear all filters</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Compact active-filter indicator while the bar is stuck — tap to jump back to full filters */}
          {filterStuck && activeFilterCount > 0 && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-accent-warm text-white text-[10px] font-bold shadow-md flex items-center justify-center cursor-pointer"
              title={`${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active — tap to edit`}
              aria-label={`${activeFilterCount} filters active, scroll to top to edit`}
            >
              {activeFilterCount}
            </button>
          )}
        </div>

        {/* Result count */}
        {groupEntries.length > 0 && (
          <p className="-mt-2 mb-3 text-[11px] text-ink-light" role="status" aria-live="polite">
            Found {filtered.length} expense{filtered.length === 1 ? "" : "s"}
            {" "}across {groupEntries.length} day{groupEntries.length === 1 ? "" : "s"}
            {search.trim() ? (
              <> matching “<span className="text-ink-dark font-medium">{search.trim()}</span>”</>
            ) : null}
          </p>
        )}

        {/* Expenses List */}
        {groupEntries.length === 0 ? (
          expenses.length === 0 ? (
            <div className="paper-card relative overflow-hidden min-h-[340px] flex items-center justify-center">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200/30 border border-amber-300/20 rotate-[-2deg] rounded-sm pointer-events-none" />
              {/* Faded mock journal entries */}
              <div className="absolute inset-x-4 sm:inset-x-8 top-8 space-y-3 select-none pointer-events-none opacity-40 blur-[0.7px]" aria-hidden="true">
                {[
                  { icon: "☕", name: "Morning coffee", amount: "$4.50" },
                  { icon: "🛒", name: "Weekly groceries", amount: "$63.50" },
                  { icon: "🚌", name: "Bus fare", amount: "$1.75" },
                  { icon: "📺", name: "Netflix", amount: "$15.99" },
                ].map((row) => (
                  <div key={row.name} className="handwritten-entry flex items-baseline !pl-3">
                    <span className="mr-1.5">{row.icon}</span>
                    <span className="text-ink-dark">{row.name}</span>
                    <span className="dots" />
                    <span className="amount font-bold text-accent-warm">{row.amount}</span>
                  </div>
                ))}
              </div>
              {/* Overlay CTA */}
              <button
                onClick={() => requireAuth(() => setShowAdd(true))}
                className="relative z-10 mx-6 my-10 w-full max-w-xs bg-paper-bg/70 backdrop-blur-[2px] border border-[rgba(0,0,0,0.08)] rounded-xl shadow-lg p-8 text-center hover:bg-paper-bg/90 transition-colors cursor-pointer group"
                aria-label="Start tracking your expenses"
              >
                <span className="text-5xl block mb-2 group-hover:scale-110 transition-transform">📓</span>
                <span className="font-handwritten text-3xl text-ink-dark font-semibold block">Your diary is empty</span>
                <span className="text-xs text-ink-light mt-2 block leading-relaxed">
                  Tap to start tracking — it takes just a few seconds per entry.
                </span>
                <span className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold shadow-sm">
                  <Plus size={16} /> Tap to start tracking
                </span>
              </button>
            </div>
          ) : (
            <div className="paper-card p-12 text-center">
              <span className="text-5xl block mb-3">🔍</span>
              <p className="font-handwritten text-2xl text-ink-light">No entries found</p>
              <p className="text-xs text-ink-light mt-1">Nothing matches your current search or filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-paper-dark rounded-lg text-xs font-semibold text-ink-medium hover:text-ink-dark transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )
        ) : (
          <>
            {visibleEntries.map(([date, dayExpenses]) => {
              const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
              const dateLabel = getDateLabel(date, todayStr);
              return (
                <div key={date} className="mb-6">
                  {/* Sticky day header — stays visible while scrolling through this day's entries,
                      parked right below the sticky filter bar */}
                  <div
                    className="sticky z-30 flex items-center gap-3 mb-2 -mx-1 px-2 py-1.5 bg-paper-bg rounded-md shadow-sm border border-[rgba(0,0,0,0.05)]"
                    style={{ top: filterBarHeight ? filterBarHeight + 18 : 8 }}
                  >
                    <h3 className="font-handwritten text-xl text-ink-dark font-semibold whitespace-nowrap">
                      {dateLabel}
                    </h3>
                    {(dateLabel === "Today" || dateLabel === "Yesterday") && (
                      <span className="text-[10px] text-ink-light whitespace-nowrap hidden sm:inline">
                        {format(new Date(date + "T00:00:00"), "EEEE, MMMM d")}
                      </span>
                    )}
                    <span className="dots" />
                    <span className="font-handwritten text-xl text-accent-warm amount font-bold whitespace-nowrap">{formatCurrency(dayTotal)}</span>
                  </div>

                  <div className="space-y-2">
                    {dayExpenses.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        color={getCategoryByName(expense.category)?.color || "#6B7280"}
                        icon={getCategoryByName(expense.category)?.icon || "🏷️"}
                        exiting={exitingId === expense.id}
                        highlight={search}
                        linkedNotes={notesByExpense.get(expense.id)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onQuickAmount={handleQuickAmount}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {hiddenDays > 0 && (
              <button
                onClick={() => setPagination({ key: filterKey, days: visibleDays + PAGE_SIZE })}
                className="w-full py-3 mb-6 bg-paper-dark/50 hover:bg-paper-dark rounded-lg text-sm font-semibold text-ink-medium hover:text-ink-dark transition-colors cursor-pointer"
              >
                Load More ({hiddenDays} more day{hiddenDays === 1 ? "" : "s"})
              </button>
            )}
          </>
        )}
      </div>

      {showAdd && <AddExpenseModal open onClose={() => setShowAdd(false)} />}
      {editingExpense && (
        <EditExpenseModal open onClose={() => setEditingExpense(null)} expense={editingExpense} />
      )}
      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleting(false); }}
        onConfirm={() => {
          if (!deleteId) return;
          const id = deleteId;
          // Dismiss the dialog and play the slide-out animation first,
          // then remove the expense from state/server.
          setDeleteId(null);
          setDeleting(false);
          setExitingId(id);
          window.setTimeout(async () => {
            try {
              await deleteExpense(id);
              toast("Expense deleted");
            } catch (err) {
              console.error(err);
              toast("Failed to delete expense", "error");
            } finally {
              setExitingId((cur) => (cur === id ? null : cur));
            }
          }, 340);
        }}
        loading={deleting}
        title="Delete expense?"
        message="This will permanently remove this expense record."
      />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
        </div>
      </div>
    }>
      <ExpensesPageInner />
    </Suspense>
  );
}

interface ExpenseRowProps {
  expense: Expense;
  color: string;
  icon: string;
  exiting?: boolean;
  highlight?: string;
  linkedNotes?: Note[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onDuplicate: (expense: Expense) => void;
  onQuickAmount: (expense: Expense, amount: number) => void;
}

/** Renders text with the first case-insensitive occurrence of query highlighted. */
function HighlightMatch({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-warm/30 text-ink-dark rounded-[2px]">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/** |dx| beyond which a release fires delete (<0) or duplicate (>0). */
const SWIPE_THRESHOLD = 64;
/** Clamp for the drag distance in either direction. */
const SWIPE_MAX = 96;
/**
 * Touches starting within this distance of the left screen edge belong to the
 * global edge swipe-back gesture (components/SwipeBack.tsx) — rows only track
 * leftward there so the two gestures never fire together.
 */
const SWIPE_BACK_EDGE_PX = 28;
/** How long a finger must stay still before the context menu opens. */
const LONG_PRESS_MS = 500;
/** Movement (px) beyond which a press is treated as a scroll/swipe instead of a tap. */
const TAP_SLOP = 10;
/** Max gap between two taps to count as a double-tap / double-click. */
const DOUBLE_TAP_MS = 300;

interface MenuPosition {
  x: number;
  y: number;
}

const ExpenseRow = memo(function ExpenseRow({
  expense,
  color,
  icon,
  exiting,
  highlight,
  linkedNotes,
  onEdit,
  onDelete,
  onDuplicate,
  onQuickAmount,
}: ExpenseRowProps) {
  const { toast } = useToast();
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountDraft, setAmountDraft] = useState("");

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const gestureMoved = useRef(false);
  const edgeGuard = useRef(false);
  const longPressFired = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const lastTapAt = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Close the context menu on outside interaction.
  useEffect(() => {
    if (!menu) return;
    const handlePointer = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      setMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", handlePointer, true);
    document.addEventListener("touchstart", handlePointer, true);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer, true);
      document.removeEventListener("touchstart", handlePointer, true);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menu]);

  // Focus the inline amount input as soon as quick-edit opens.
  useEffect(() => {
    if (editingAmount) amountInputRef.current?.select();
  }, [editingAmount]);

  useEffect(
    () => () => {
      clearLongPressTimer();
      if (singleTapTimer.current !== null) clearTimeout(singleTapTimer.current);
    },
    []
  );

  const openContextMenu = useCallback((x: number, y: number) => {
    const MENU_W = 176;
    const MENU_H = 168;
    setMenu({
      x: Math.min(Math.max(8, x), window.innerWidth - MENU_W - 8),
      y: Math.min(Math.max(8, y), window.innerHeight - MENU_H - 8),
    });
    hapticFeedback();
  }, []);

  const startAmountEdit = useCallback(() => {
    setExpanded(false);
    setAmountDraft(String(expense.amount));
    setEditingAmount(true);
  }, [expense.amount]);

  const commitAmountEdit = useCallback(() => {
    setEditingAmount(false);
    const parsed = parseFloat(amountDraft);
    if (!isNaN(parsed) && parsed > 0 && parsed !== expense.amount) {
      onQuickAmount(expense, parsed);
    } else if (!isNaN(parsed) && parsed <= 0) {
      toast("Amount must be greater than zero", "error");
    }
  }, [amountDraft, expense, onQuickAmount, toast]);

  const cancelAmountEdit = useCallback(() => {
    setEditingAmount(false);
  }, []);

  /* ---------- touch: swipe-to-delete/duplicate + long-press context menu ---------- */

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    gestureMoved.current = false;
    edgeGuard.current = touch.clientX <= SWIPE_BACK_EDGE_PX;
    longPressFired.current = false;
    suppressClick.current = false;
    setDragging(true);
    const { clientX, clientY } = touch;
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      longPressFired.current = true;
      openContextMenu(clientX, clientY);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Any real movement cancels a pending long press; vertical movement is a scroll.
    if (Math.abs(deltaX) > TAP_SLOP || Math.abs(deltaY) > TAP_SLOP) clearLongPressTimer();
    if (Math.abs(deltaX) > TAP_SLOP && Math.abs(deltaX) > Math.abs(deltaY)) {
      gestureMoved.current = true;
      // Rightward tracking is disabled when the touch began in the swipe-back edge zone.
      const maxRight = edgeGuard.current ? 0 : SWIPE_MAX;
      setDx(Math.max(Math.min(deltaX, maxRight), -SWIPE_MAX));
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    clearLongPressTimer();
    const swipedLeft = dx < -SWIPE_THRESHOLD;
    const swipedRight = !edgeGuard.current && dx > SWIPE_THRESHOLD;
    if (gestureMoved.current || longPressFired.current) suppressClick.current = true;
    if (swipedLeft) {
      onDelete(expense.id);
    } else if (swipedRight) {
      hapticFeedback();
      onDuplicate(expense);
    }
    setDx(0);
    startX.current = null;
    startY.current = null;
  };

  /* ---------- click: single tap expands, double tap quick-edits the amount ---------- */

  const handleRowClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (editingAmount) {
      // The input's blur handler commits and suppresses the follow-up click.
      return;
    }
    const now = Date.now();
    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      // Second tap of a double-tap → cancel the pending expand, quick-edit instead.
      if (singleTapTimer.current !== null) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapAt.current = 0;
      hapticFeedback();
      startAmountEdit();
    } else {
      lastTapAt.current = now;
      if (singleTapTimer.current !== null) clearTimeout(singleTapTimer.current);
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        setMenu(null);
        setExpanded((v) => !v);
      }, DOUBLE_TAP_MS);
    }
  };

  const menuAction = (action: "edit" | "delete" | "duplicate" | "details") => {
    setMenu(null);
    switch (action) {
      case "edit":
        onEdit(expense);
        break;
      case "delete":
        onDelete(expense.id);
        break;
      case "duplicate":
        onDuplicate(expense);
        break;
      case "details":
        setExpanded(true);
        break;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded ${exiting ? "row-exit" : ""}`} aria-hidden={exiting}>
      <button
        onClick={() => onDuplicate(expense)}
        className="absolute inset-y-0 left-0 w-24 bg-accent-green text-white flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        aria-label="Duplicate expense"
        tabIndex={-1}
      >
        <Copy size={16} />
        <span className="text-[10px] font-semibold">Duplicate</span>
      </button>
      <button
        onClick={() => onDelete(expense.id)}
        className="absolute inset-y-0 right-0 w-24 bg-accent-red text-white flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        aria-label="Delete expense"
        tabIndex={-1}
      >
        <Trash2 size={16} />
        <span className="text-[10px] font-semibold">Delete</span>
      </button>
      <div
        className={`paper-card px-4 py-3 group hover:shadow-md transition-all border-l-4 swipe-row cursor-pointer ${
          expanded ? "rounded-b-none" : ""
        }`}
        style={{
          borderLeftColor: color,
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
        onClick={handleRowClick}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu(e.clientX, e.clientY);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          handleTouchEnd();
        }}
        title="Tap for details · Double-tap to edit amount · Long-press for actions · Swipe ← delete · → duplicate"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink-dark font-semibold truncate">
              <HighlightMatch text={expense.name} query={highlight} />
            </p>
            <p className="text-[10px] text-ink-light mt-0.5">
              {expense.category} · {expense.payment_method}
            </p>
            {expense.pendingSync && (
              <span
                className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-accent-warm/10 border border-accent-warm/25 text-[9px] font-bold uppercase tracking-wide text-accent-warm"
                title="Saved on this device — will sync when back online"
              >
                <CloudUpload size={10} aria-hidden="true" /> Syncing…
              </span>
            )}
          </div>

          {/* Amount — becomes an inline input during quick edit */}
          {editingAmount ? (
            <form
              className="flex items-center gap-1 shrink-0 ml-2"
              onSubmit={(e) => {
                e.preventDefault();
                commitAmountEdit();
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                min="0.01"
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitAmountEdit();
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    cancelAmountEdit();
                  }
                }}
                onBlur={() => {
                  // Committing on blur also swallows the click that follows,
                  // so dismissing by clicking elsewhere doesn't re-toggle expand.
                  suppressClick.current = true;
                  commitAmountEdit();
                }}
                className="w-20 px-1.5 py-1 bg-paper-bg border border-accent-warm rounded text-sm font-bold amount text-right focus:outline-none"
                style={{ color }}
                aria-label="Quick edit amount"
              />
              <button
                type="submit"
                className="p-1 rounded bg-accent-green/15 text-accent-green hover:bg-accent-green/25 transition-colors cursor-pointer"
                aria-label="Save amount"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelAmountEdit}
                className="p-1 rounded bg-paper-dark text-ink-light hover:text-accent-red transition-colors cursor-pointer"
                aria-label="Cancel amount edit"
              >
                <X size={13} />
              </button>
            </form>
          ) : (
            <span
              className="text-sm font-bold amount shrink-0 ml-2 transition-transform duration-150 group-hover:scale-[1.04]"
              style={{ color }}
            >
              {formatCurrency(expense.amount)}
            </span>
          )}

          {/* Expand chevron */}
          {!editingAmount && (
            <ChevronDown
              size={14}
              className={`shrink-0 text-ink-light opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 ${
                expanded ? "sm:opacity-60 rotate-180" : ""
              }`}
            />
          )}

          {/* Edit and Delete buttons (always semi-opaque on touch devices, hover opaque on hover) */}
          {!editingAmount && (
            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(expense);
                }}
                className="p-2 sm:p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                aria-label="Edit"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(expense.id);
                }}
                className="p-2 sm:p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-accent-red transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Expanded details panel */}
        {expanded && (
          <div
            className="mt-3 pt-3 border-t border-dashed border-[rgba(0,0,0,0.12)] space-y-2.5 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: color }}
              >
                <span>{icon}</span> {expense.category}
              </span>
              {expense.expense_type !== "Daily purchase" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-paper-dark text-ink-medium border border-[rgba(0,0,0,0.06)]">
                  {expense.expense_type}
                </span>
              )}
              <span className="text-[10px] text-ink-light">
                Paid with {expense.payment_method}
              </span>
            </div>

            {expense.note && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-ink-light mb-0.5">Note</p>
                <p className="font-handwritten text-lg leading-snug text-ink-dark whitespace-pre-wrap break-words">
                  “{expense.note}”
                </p>
              </div>
            )}

            {expense.receipt_url && (
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-fit group/receipt"
                title="Open receipt in a new tab"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={expense.receipt_url}
                  alt={`Receipt for ${expense.name}`}
                  loading="lazy"
                  className="max-h-36 max-w-full rounded border border-[rgba(0,0,0,0.1)] shadow-sm group-hover/receipt:shadow-md transition-shadow"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.nextElementSibling instanceof HTMLElement) {
                      target.nextElementSibling.style.display = "inline-flex";
                    }
                  }}
                />
                <span className="hidden items-center gap-1 text-[11px] text-accent-blue hover:underline">
                  <ReceiptText size={12} /> View receipt
                </span>
              </a>
            )}

            {linkedNotes && linkedNotes.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-ink-light mb-1">
                  Linked note{linkedNotes.length === 1 ? "" : "s"}
                </p>
                <div className="flex flex-col gap-1.5">
                  {linkedNotes.map((n) => (
                    <Link
                      key={n.id}
                      href="/notes"
                      className="note-card block rounded px-2.5 py-1.5 border border-black/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      style={{ backgroundColor: n.color }}
                      title="Open in Notes"
                    >
                      <span className="block text-[11px] font-semibold text-[#2C2C2C] truncate">
                        {n.pinned ? "📌 " : ""}{n.title || "Untitled note"}
                      </span>
                      {n.content && (
                        <span className="block text-[10px] text-[#333333]/80 line-clamp-1">{n.content}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-ink-light flex items-center gap-1">
              <Clock size={11} /> Added {format(new Date(expense.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}
      </div>

      {/* Context menu (long-press / right-click): Edit · Duplicate · Details · Delete */}
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Expense actions"
            className="fixed z-[80] w-44 paper-card shadow-xl border border-[rgba(0,0,0,0.08)] overflow-hidden menu-in"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                menuAction("edit");
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-ink-dark hover:bg-paper-dark transition-colors cursor-pointer"
            >
              <Edit2 size={14} className="text-ink-light" /> Edit
            </button>
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                menuAction("duplicate");
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-ink-dark hover:bg-paper-dark transition-colors cursor-pointer"
            >
              <Copy size={14} className="text-ink-light" /> Duplicate
            </button>
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                menuAction("details");
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-ink-dark hover:bg-paper-dark transition-colors cursor-pointer"
            >
              <Eye size={14} className="text-ink-light" /> View details
            </button>
            <div className="h-px bg-[rgba(0,0,0,0.06)]" />
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                menuAction("delete");
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  );
});
