# My Expense Diary — Production-Ready Overhaul Plan

> Goal: Transform this from a functional prototype into a polished, real-world finance app that users can trust with their money data.

---

## Phase 1: Critical Fixes (Security + Data Integrity)

### 1.1 Security Hardening
- [x] Verify `.env` is in `.gitignore` and not tracked by git. Rotate Supabase keys if repo is public.
- [x] Add Zod validation schemas for ALL server actions (`expenses.ts`, `recurring.ts`, `budgets.ts`, `notes.ts`, `categories.ts`)
  - Validate: name length (max 200), amount (positive, max 999999.99), date format, category names
  - Reject unknown/extra fields
- [x] Replace `null as any` casts in `lib/supabase/client.ts:12` and `lib/supabase/server.ts:9` with proper null checks and thrown errors
- [x] Add password strength validation in `profile/page.tsx` (min 8 chars, require number or special char)

### 1.2 Database Schema Fixes
- [x] Add `payment_method` column to `recurring_payments` table (currently only stored in localStorage, lost on cache clear)
- [x] Add `auto_pay` column to `recurring_payments` table (same issue — localStorage only)
- [x] Add missing indexes:
  - `categories(user_id)` 
  - `expenses(user_id, expense_type)` — bills page filters by this constantly
  - `recurring_payments(user_id, due_day)` — auto-pay engine queries
- [x] Add CHECK constraint on `expense_type` column (prevent typos: should only be 'Expense', 'Bill', 'Subscription', 'Recurring payment')
- [x] Add database trigger to sync `last_paid` on `recurring_payments` when an expense is logged with `recurring_payment_id`

---

## Phase 2: Error Handling + Resilience

### 2.1 Error Boundaries
- [x] Create `src/app/error.tsx` — global error boundary with retry button
- [x] Create `src/app/expenses/error.tsx`
- [x] Create `src/app/bills/error.tsx`
- [x] Create `src/app/recurring/error.tsx`
- [x] Create `src/app/insights/error.tsx`
- [x] Create `src/app/calendar/error.tsx`
- [x] Create `src/app/monthly/error.tsx`
- [x] Create `src/app/notes/error.tsx`
- [x] Create `src/app/settings/error.tsx`
- [x] Create `src/app/not-found.tsx` — custom 404 page with "Go Home" CTA

### 2.2 Loading States
- [x] Create `src/app/expenses/loading.tsx` — skeleton matching expense list layout
- [x] Create `src/app/bills/loading.tsx` — skeleton matching bill cards
- [x] Create `src/app/insights/loading.tsx` — chart-shaped skeletons
- [x] Create `src/app/calendar/loading.tsx` — calendar grid skeleton
- [x] Create `src/app/recurring/loading.tsx`
- [x] Create `src/app/monthly/loading.tsx`
- [x] Create `src/app/notes/loading.tsx`

### 2.3 Store Error Handling
- [x] In `lib/store.tsx` — stop silently swallowing errors in `.catch(() => {})` (lines ~139-159)
- [x] Show toast on failed data fetches with retry option
- [x] Add error state to each hook (`useExpenses().error`, `useRecurringPayments().error`)
- [x] Handle Supabase session expiry gracefully in `AuthProvider.tsx`

---

## Phase 3: UX Consistency Fixes

### 3.1 Replace Native Browser Dialogs
- [x] `bills/page.tsx:98` — Replace `prompt()` for variable bill amount with a custom modal input
- [x] `settings/page.tsx:178` — Replace `alert("Invalid backup file")` with `toast("Invalid backup file", "error")`

### 3.2 Auth Guard Consistency
- [x] Add `AuthGuard` wrapper to `insights/page.tsx`
- [x] Add `AuthGuard` wrapper to `calendar/page.tsx`
- [x] Add `AuthGuard` wrapper to `monthly/page.tsx`

### 3.3 Confirmation Dialogs
- [x] `recurring/page.tsx` — Add ConfirmDialog for toggle active/inactive (currently instant, no undo)
- [x] `bills/page.tsx` — Add ConfirmDialog for deactivate bill action (currently instant)

### 3.4 Toast Error Messages
- [x] Add error toast to all failed server actions across all pages (currently some silently fail)
- [x] Add loading state to delete buttons (show spinner while deleting)

---

## Phase 4: Dark Mode Polish

### 4.1 Fix Dark Mode Breakages
- [x] `notes/page.tsx:197-238` — Replace hardcoded `dark:text-black`, `dark:bg-black/10` with CSS custom properties
- [x] `globals.css:152` — `.sticky-note` hardcoded `background: #FEF9C3` needs dark mode variant
- [x] `page.tsx:309-331` — Landing page sticky notes `bg-[#FEF9C3]`, `bg-[#DCFCE7]`, `bg-[#DBEAFE]` need dark variants
- [x] `login/page.tsx:209` — Google sign-in button `bg-white` needs dark mode handling
- [x] `components/FlagIcon.tsx` — External CDN dependency (`flagcdn.com`); add fallback for when CDN is down

### 4.2 Theme Toggle Conflict
- [x] `ThemeToggle.tsx` and `Toast.tsx` both use `fixed bottom-6 right-6 z-50` — move toast container to `bottom-6 left-6` or adjust z-index stacking

---

## Phase 5: Accessibility

### 5.1 WCAG Compliance
- [x] Add `alt` text to flag images in `FlagIcon.tsx` (currently `alt=""`)
- [x] Add `aria-label` to all icon-only buttons (edit, delete, toggle) across `expenses/page.tsx`, `bills/page.tsx`, `categories/page.tsx`, `notes/page.tsx`, `insights/page.tsx`, `calendar/page.tsx`, `monthly/page.tsx`, `settings/page.tsx`, `Sidebar.tsx`, `AddBillModal.tsx`, `EditExpenseModal.tsx`, `ConfirmDialog.tsx`, `VariableAmountModal.tsx`
- [x] Ensure all interactive elements have visible focus indicators
- [x] Add `role="dialog"` and `aria-modal="true"` to custom modals (`ConfirmDialog`, `AddExpenseModal`, `EditExpenseModal`, `AddBillModal`, `VariableAmountModal`)
- [x] Add skip-to-content link in `layout.tsx`

---

## Phase 6: Missing Core Features

### 6.1 Income Tracking
- [x] Add `income` table to Supabase schema (id, user_id, name, amount, date, source, category, created_at)
- [x] Add server actions: `fetchIncome`, `addIncome`, `updateIncome`, `deleteIncome`
- [x] Add `useIncome` hook to store
- [x] Create `src/app/income/page.tsx` — income journal with CRUD
- [x] Update dashboard (`page.tsx`) to show net balance (income - expenses)
- [x] Update `monthly/page.tsx` to show income vs expense comparison
- [x] Update `insights/page.tsx` to include income charts
- [x] Add sidebar link for Income

### 6.2 Category Management
- [x] Create `src/app/categories/page.tsx` — dedicated page to view, edit, reorder, delete categories
- [x] Add `updateCategory` server action to `actions/categories.ts`
- [x] Add edit icon and reorder drag handles to category list
- [x] Show expense count per category
- [x] Prevent deletion of categories with existing expenses (or offer to reassign)

### 6.3 CSV Export
- [x] Add CSV export option alongside JSON in `settings/page.tsx`
- [x] Format: Date, Name, Amount, Category, Payment Method, Expense Type, Note
- [x] Add date range selector for export
- [x] Add CSV export to monthly summary page

### 6.4 Date Range Filter on Expenses
- [x] Add start/end date picker to `expenses/page.tsx` filter bar
- [x] Add "This Week", "This Month", "Last 30 Days", "Custom Range" quick filters
- [x] Persist filter selection in URL query params for shareability

---

## Phase 9: Notifications & Reminders

### 9.1 Bill Reminders
- [x] Use the `reminder_days` field on `RecurringPayment` (currently unused)
- [x] On dashboard, show "Upcoming in X days" badges for bills within reminder window
- [x] Add browser Notification API support (request permission, show notification on due date)

### 9.2 Budget Alerts
- [x] When adding an expense that pushes a category over budget, show warning toast
- [x] On dashboard, show budget warning cards when any category is >80% used

---

## Phase 10: Performance Optimization

### 10.1 Pagination
- [x] Add server-side pagination to `fetchExpenses` (limit/offset)
- [x] Add "Load More" button or infinite scroll to expenses page
- [x] Paginate bills history tab

### 10.2 Code Splitting
- [x] Lazy load `recharts` in `insights/page.tsx` (400KB bundle)
- [x] Lazy load `AddBillModal` and `AddExpenseModal` (only needed on interaction)
- [x] Use `next/dynamic` for chart components

### 10.3 Caching
- [x] Add `React.memo` to expense list item components
- [x] Add `useMemo` for filtered/sorted expense lists
- [x] Improve localStorage cache with version stamp (invalidate on schema changes)

---

## Phase 11: UI Polish & Micro-interactions

### 11.1 Animations
- [x] Add page transition animations (route change fade/slide) (already present via `.page-enter` on every page root)
- [x] Add subtle hover lift effect on cards (`.card-hover` utility using `--shadow-lifted`; applied to stat/info cards)
- [x] Add swipe-to-delete on mobile expense items (`ExpenseRow` touch handlers reveal red delete layer, threshold triggers confirm dialog)
- [x] Add confetti or celebration animation when all bills are paid for the month (`Confetti` component + banner + toast on bills page)

### 11.2 Empty States (per page)
- [x] `expenses/page.tsx` — Illustrated empty state with "Start Tracking" CTA (+ separate "no filter matches" state with Clear Filters)
- [x] `bills/page.tsx` — Improved with illustration and "Add Your First Bill" CTA
- [x] ~~`recurring/page.tsx`~~ — N/A, page was removed (replaced by `/bills`)
- [x] `insights/page.tsx` — "No data to analyze yet" with Log First Expense CTA (charts hidden when no expenses)
- [x] `calendar/page.tsx` — Empty calendar prompt with CTA when no expenses exist
- [x] `notes/page.tsx` — "Jot down your first note" prompt with Write a Note CTA
- [x] `income/page.tsx` — "Track Your First Income" prompt with CTA

### 11.3 Visual Refinements
- [x] Consistent card shadows across all pages (tokenized via `--shadow-paper` / `--shadow-lifted`)
- [x] Add subtle gradient to header sections (`.header-gradient` applied to 9 page headers)
- [x] Improve typography hierarchy (font smoothing + optimizeLegibility on body)

---

## Phase 12: Code Quality & Maintainability

### 12.1 Deduplication
- [x] Extract shared form fields from `AddExpenseModal.tsx` and `EditExpenseModal.tsx` into a shared `ExpenseForm` component (controlled component with `ExpenseFormData` + `onChange(patch)`; variations via `allExpenseTypes`, `categoryTilesExtra`, `categoryHint` props)
- [x] Consolidate default categories from 4 locations into a single source of truth (`types/index.ts` now holds `DEFAULT_CATEGORY_DATA` with name/icon/color; `DEFAULT_CATEGORIES`, utils `CATEGORIES`/`CATEGORY_COLORS`, and store `INITIAL_CATEGORIES` are all derived from it)
- [x] Remove `CategoryItem` duplicate type definition from `actions/categories.ts` (now imported from `@/types`)

### 12.2 Type Safety
- [x] Remove all `as any` casts (none remain in src — verified via grep)
- [x] Create proper union types for `ExpenseType`, `Frequency`, `PaymentMethod` (already in `types/index.ts`)
- [x] Add strict TypeScript config: `"strict": true` in `tsconfig.json` (already set)

## Phase 13: First-Time User Experience (Onboarding)

### 13.1 Welcome Flow
- [x] Create `src/app/onboarding/page.tsx` — 3-step guided welcome after first login
  - Step 1: "Welcome to My Expense Diary" — short animated intro with app preview
  - Step 2: "Pick your currency" — country/currency selector (reuses CountryProvider)
  - Step 3: "Log your first expense" — inline mini form to add one expense right there
- [x] Store `onboarded` flag in `user_metadata` to skip flow on return visits
- [x] Show onboarding only once per user (check `user.user_metadata.onboarded`)

### 13.2 Empty State CTAs with Guidance
- [x] Dashboard empty state: "Your diary is empty!" with animated illustration + "Add First Expense" button that opens the modal
- [x] Expenses page empty: Show a mock journal page with faded example entries and "Tap to start tracking" overlay
- [x] Bills page empty: Show a card with "No bills yet — add Netflix, rent, electricity..." and quick-add presets
- [x] Notes page empty: Show a blank sticky note with blinking cursor prompt "Jot something down..."
- [x] Insights page empty: "Add 3+ expenses to unlock insights" with progress indicator
- [x] Calendar page empty: Show current month calendar with "Tap any day to add expenses"

---

## Phase 14: Frictionless Expense Entry (Core UX)

### 14.1 Quick Add (1-Tap Expense)
- [x] Remember last used category and pre-select it (`getQuickAddPrefs`/`saveQuickAddPrefs` in utils, persisted to localStorage on save; validated against live category list)
- [x] Remember last used payment method and pre-select it
- [x] Show recent expense names as chips above the name field for quick re-entry (6 most recent unique names from expense history in `ExpenseForm`)

### 14.2 Smart Expense Form
- [x] Auto-categorize based on expense name (e.g., "Netflix" → Subscription, "Uber" → Transport) — `lib/smartCategory.ts` keyword engine with word-boundary matching; suggestions validated against visible categories so hidden Bill/Subscription categories are never auto-picked on the Add form
- [x] Show category suggestions as user types the name (✨ suggestion chip when a manual category override is active; "Auto-matched" hint otherwise; manual pick stops auto-categorize until name is cleared)
- [x] Show running daily total at the bottom of the form as user adds expenses ("Spent so far on {date}" + live `+ entry = new total`)
- [x] Haptic feedback on mobile when expense is saved (navigator.vibrate via `hapticFeedback()` util)

## Phase 16: Visual Feedback & Micro-interactions

### 16.1 Success Celebrations
- [x] After adding expense: Show a subtle checkmark animation (scale up + fade) on the button (button turns green with `check-pop` icon for ~800ms before modal closes)
- [x] After paying all bills for the month: Show confetti animation on bills page (done in Phase 11 — Confetti component + banner + toast)
- [x] After reaching budget limit: Show a gentle "Budget reached" pulse animation on the category (`budget-pulse` glow on dashboard + monthly budget bars when over 100%)
- [x] After deleting: Slide-out animation on the deleted row before removing from DOM (`row-exit` on ExpenseRow; dialog dismisses, row slides right/fades/collapses over 340ms, then delete runs)

### 16.2 Progress Indicators
- [x] Budget progress bars with color gradient: green (0-50%) → yellow (50-80%) → red (80-100%) — shared `BudgetBar` component used by dashboard overall-budget card, budget alerts, and monthly page
- [x] Monthly savings goal progress ring (circular progress) — `ProgressRing` SVG ring on dashboard "Budget & Savings" card showing savings rate (net/income), green/red by sign
- [x] Bill payment progress: "3 of 5 bills paid this month" with visual progress bar (bills page overview card)
- [x] Expense count milestone badges: "100 expenses logged! 🎉" — one-time toast at 10/25/50/100/250/500/1000 after adding an expense (seen milestones tracked in localStorage)

### 16.4 Skeleton Loading Improvements
- [x] Expense list skeletons: Show rows with animated gradient shimmer matching handwritten style (route loading.tsx + inline !loaded state: journal rows, day headers, filter bar)
- [x] Chart skeletons: Show faint chart outlines with pulse animation (pie ring outline + legend lines, bar chart columns, dashed-grid area chart with pulsing stroke)
- [x] Dashboard skeletons: Show stat cards with shimmer effect (rotated stat-card shapes + entries card lines)
- [x] Calendar skeletons: Show grid with pulse (day cells with date/dot placeholders, today-ring hint, weekday header)

---

## Phase 17: Navigation & Wayfinding

### 17.1 Smart Sidebar
- [x] Show unread bill count badge on "Bills & Subs" sidebar link when overdue bills exist (red count bubble via `getUpcomingBills` overdue filter; mini bubble in collapsed mode)
- [x] ~~Show today's expense count on "Expenses" sidebar link~~ — implemented then removed per user preference (only the overdue-bills badge remains)
- [x] Highlight current page with animated underline (not just color change) (scale-x underline under the active label, origin-left 300ms ease-out)
- [x] Show "New" badge on sidebar links for features user hasn't tried yet (visited pages tracked in `visited_pages_v1`; green NEW pill until first visit)

### 17.2 Breadcrumbs & Back Navigation
- [x] Add breadcrumbs on settings sub-pages (`Breadcrumbs` component; Home / Settings on settings page and Home / Profile on profile page)
- [x] On mobile: Show back arrow in page header for easy navigation (`BackButton` on expenses, bills, calendar, monthly, income, insights, categories, notes, settings, profile; history.back with "/" fallback)
- [x] On modals: Swipe down to dismiss (mobile) (`useSwipeDownDismiss` hook applied to ConfirmDialog, AuthPrompt, VariableAmountModal, AddExpenseModal, EditExpenseModal, AddBillModal — rubber-band drag, closes past 90px)

### 17.3 Quick Jump
- [x] Add `Ctrl+K` / `Cmd+K` keyboard shortcut to toggle focus on the Expenses page search bar from anywhere (press again to blur; "Ctrl K" hint chip inside the search input)
- [ ] ~~Command palette~~ — implemented then removed per user preference (shortcut now focuses the expenses search bar instead)

---

## Phase 19: Expense List UX Improvements

### 19.1 Grouping & Sorting
- [x] Group expenses by date with sticky date headers ("Today", "Yesterday", "Aug 18") (day headers now sticky (top-2, paper tab w/ shadow) while their group is in view; Today/Yesterday labels with full date subtitle)
- [x] Show daily subtotals in the date header ("Total: X" under each day header)
- [x] Sort options: Newest first, Oldest first, Highest amount, Lowest amount (amount sorts order day groups by daily total; ties newer-first)
- [x] Sort toggle button in the filter bar (icon dropdown select next to category filter)

### 19.2 Inline Actions
- [x] Swipe to delete on mobile (done in Phase 11 via `ExpenseRow`)
- [x] Long press for context menu (Edit, Delete, Duplicate, View details) (500ms hold opens portal menu at press point; right-click opens it on desktop; outside tap/scroll/Esc closes)
- [x] Tap on expense → expand to show full details (note, receipt, category color) (tap toggles detail panel: colored category chip, type badge, note in handwritten style, receipt thumbnail/link, added timestamp)
- [x] Double-tap on expense → quick edit amount inline (300ms double-tap/double-click opens number input in the row; Enter/✓/blur saves via `updateExpense`, Esc/✕ cancels)

### 19.3 Search UX
- [x] Search bar with magnifying glass icon and clear button (✕ button replaces the Ctrl K hint while typing; clears input + committed term and refocuses)
- [x] Search as you type (debounced 300ms) (`searchInput` raw vs `search` debounced/trimmed committed value used by filters)
- [x] Show result count: "Found 12 expenses" (with "matching …" when searching; aria-live polite)
- [x] Highlight matching text in results (`HighlightMatch` wraps first case-insensitive occurrence in accent `<mark>` inside expense names)
- [x] Recent searches dropdown when search is focused (max 5, localStorage `recent_searches_v1`, dedupe case-insensitive; header with Clear-all; rows fill the query)
- [x] Empty search state: "No expenses match your search" ("Nothing matches your current search or filters." + Clear filters button)

### 19.4 Filter UX
- [x] Filter chips with visual feedback (colored borders when active) (active chips get solid accent background + white text)
- [x] Active filter count badge: "3 filters active" (counts search + category + date range; warm pill in quick-filter row)
- [x] "Clear all filters" button when any filter is active (now shown in the filter bar next to the badge, not just the empty state)
- [x] Filter bar should be sticky on scroll (sticky top-2 opaque paper card z-40; day headers park below it via measured bar height w/ ResizeObserver)

### 19.5 Search & Filter Polish (mobile-first refinement)
- [x] Slim sticky mode: bar collapses when stuck (sentinel + IntersectionObserver hides the date-chip row and tightens padding; ResizeObserver keeps day-header offsets in sync); floating count bubble appears when stuck w/ active filters — tap scrolls back to full bar
- [x] Mobile layout: category + sort selects sit side-by-side (grid-cols-2) instead of stacked full-width; search field taller tap target (py-2.5) with focus ring
- [x] Date chips: horizontally scrollable strip (no-scrollbar utility + right-edge fade affordance) instead of multi-row wrap; pill-shaped chips with bigger tap targets; badge/Reset labels shorten on small screens
- [x] Result count now includes day span ("Found 12 expenses across 5 days"); row edit/delete buttons get larger touch targets on mobile

### 19.6 Search & Filter Redesign (UI/UX Pro Max audit fixes)
- [x] Unified control scale: shared CONTROL_CLS — all controls h-11 (mobile) / h-10 (desktop), rounded-lg, visible focus-visible ring (accent-warm border + ring-accent-warm/25); selects use appearance-none + custom ChevronDown for consistent styling across browsers
- [x] Recents popover rebuilt: menu-in entrance animation (reduced-motion aware, also reused by ExpenseRow context menu, replacing nonexistent .menu-pop class), rounded-xl + shadow-xl elevation, 384px desktop panel, per-row ✕ remove buttons (writes through to localStorage), Clear all in header, hover/keyboard highlight sync (↑/↓ to navigate, Enter picks, Esc closes popover first then blurs field)
- [x] Date chips: 36px-tall pill buttons via CHIP_BASE_CLS with aria-pressed state, active chips keep identical height (border-transparent instead of removed border), active:scale-95 press feedback; custom range date inputs restyled to matching h-9 scale; clear-date button is a proper 36px hit area
- [x] Badge/Reset: taller badge (h-7), Reset button promoted to a 36px target with press feedback and red focus ring
- [x] Mobile Filters toggle: category/sort selects + date-chip strip collapse behind a "Filters" button (sm:hidden) beside the search field; button shows active-filter count badge, fills warm when expanded, and panels animate in via menu-in; desktop unaffected (sm:flex / sm:contents keep everything visible)

---

## Phase 20: Bills & Subscriptions UX

### 20.1 Visual Status Cards
- [x] Overdue bills: Red left border + pulsing dot + "OVERDUE" badge (due-date split by string compare; red pill w/ `.pulse-dot` (reduced-motion aware) + existing "Overdue since ..." line)
- [x] Due today: Orange left border + "DUE TODAY" badge (`border-l-accent-warm` card, warm pill badge, "Due today (...)" subtitle; section header shows "· Due Today" suffix when only due-today items remain)
- [x] Upcoming: Blue left border + countdown badge (blue border + "(X days left)" inline countdown)
- [x] Paid: Green left border + checkmark + strikethrough name (green border, strikethrough name, green "Paid" pill; CheckCircle2 on section header)

### 20.2 Pay Flow
- [x] "Pay Now" button opens a confirmation modal (not instant) (fixed bills open `PayConfirmModal`; variable bills go through the amount modal first, then the same confirmation)
- [x] Show payment summary before confirming: Name, Amount, Date, Method (dl rows; Date reflects early-pay logging rule `dueDate <= today ? dueDate : today`)
- [x] After payment: Green checkmark animation + toast (centered success card with `check-pop` CheckCircle2 + name/amount, auto-dismisses after ~2.4s; toast unchanged)
- [x] Show "All bills paid! 🎉" celebration when all monthly bills are settled (Confetti component + green banner + toast)

### 20.3 Subscription Health
- [x] Show monthly subscription total prominently ("Monthly Total" overview stat card)
- [x] Show "You spend $X/month on subscriptions" with comparison to income (Subscription Health card; frequency-normalized monthly cost, % of `getMonthIncome` with color-coded bar — green ≤10%, warm ≤25%, red >25%; prompts to log income when none)
- [x] Flag unused subscriptions: "Haven't used in 30 days" warning (activity proxy: latest logged expense / `last_paid`; amber AlertTriangle row when >30 days stale or never paid after 30+ days tracked)
- [x] Suggest canceling expensive subscriptions (UX hint, not actual cancel) (💡 rows for subs costing ≥5% of monthly income, priciest first; mentions "no recent activity" when also unused)

---

## Phase 21: Notes & Journal UX

### 21.1 Rich Note Creation
- [x] Drag-and-drop color picker for sticky notes (instead of dropdown) (editor swatches are draggable + click-selectable; drop onto any note card or the editor itself to recolor with accent ring highlight + "Drop the color…" hint while dragging)
- [x] Pin note to top with visual "pin" animation (Pin/PinOff toggle buttons + pinned indicator; pinned sorted first)
- [x] Notes should auto-resize as content grows (`AutoResizeTextarea` grows/shrinks with content via scrollHeight, overflow hidden)
- [x] Show character count / word count at bottom of note ("X words · Y characters" live counter in editor footer; per-note word/char count in card footers next to Updated date)

### 21.2 Note Organization
- [x] Pinned notes always at top with a subtle "📌" indicator (pinned-first sort + indicator on card)
- [x] Sort by: Last edited, Created date, Color (sort select in toolbar above grid — pinned always first; color groups by NOTE_COLORS order w/ recency tiebreak; choice persisted to `notes_sort_v1`)
- [x] Grid layout on desktop, list on mobile (`grid-cols-1 sm:grid-cols-2`)
- [x] Masonry layout option for notes (Pinterest-style) (Grid/Masonry toggle (LayoutGrid/Columns3 icons); masonry = CSS columns with break-inside-avoid + full unclamped content so cards size naturally; persisted to `notes_layout_v1`)

### 21.3 Note-to-Expense Link
- [x] Allow linking a note to an expense (e.g., "Grocery list" note linked to grocery expense) (`notes.expense_id` FK column (ON DELETE SET NULL) + migration; "+ Link to an expense…" picker in the note editor listing 50 most recent expenses with name/amount/date, removable chip when linked)
- [x] Show linked notes on expense detail view (expanded row panel lists pinned indicator, title + content snippet as sticky chips in the note's color; click opens Notes)
- [x] Show linked expenses on note view (note cards show a category-icon/name/amount chip that deep-links to `/expenses?q=<name>`; editor shows the same link chip)

---

## Phase 22: Calendar UX Improvements

### 22.1 Day Detail Panel
- [x] Tapping a day opens a slide-in panel from right (not a new page) (`DayDetailDrawer` fixed right-side drawer w/ `drawer-in` slide animation + fade backdrop; backdrop tap closes; replaces the old inline card below the grid)
- [x] Panel shows: Date, total, list of expenses, "Add Expense" button for that date (drawer header shows date + daily total, rows with category color/delete (ConfirmDialog), footer "Add Expense" opens `AddExpenseModal` pre-filled with `defaultDate`)
- [x] Swipe panel left/right to navigate to previous/next day (horizontal swipe w/ rubber-band drag, 60px threshold; chevron buttons + ←/→ keys on desktop; content swaps directionally via `day-swap-next/prev`; crossing month boundaries syncs the grid)

### 22.2 Visual Indicators
- [x] Days with expenses: Show dot indicator with color matching top category (implemented as category icons per day)
- [x] Days with high spending: Show red dot (threshold-based: day total ≥ 1.75× the month's average spending-day total → pulsing red corner dot via `.pulse-dot`)
- [x] Today: Highlight with ring/border (already implemented)
- [x] Days with no expenses: Subtle gray dot or no indicator (faint centered gray dot on empty current-month cells)

### 22.3 Monthly Navigation
- [x] Smooth month transition animation (slide left/right) (grid remounts per month keyed by yyyy-MM with directional `month-slide-next/prev` animations; reduced-motion aware)
- [x] Show monthly total at top of calendar (already implemented)
- [x] "Today" button to quickly jump back to current month (pill button under the month header, only shown when viewing another month)

---

## Phase 23: Settings & Profile UX

### 23.1 Settings Organization
- [x] Group settings into cards with clear sections: "Appearance", "Currency", "Budget", "Data", "Account" (already separate paper-cards: Appearance, Country & Currency, Budget, Data Overview, Export Data, Danger Zone)
- [x] Each section collapsible (shared `CollapsibleSection` component; animated expand/collapse via grid-template-rows trick; every section starts collapsed by default and expands when the user taps its header)
- [x] Show current values as subtitles (e.g., "Dark Mode" → "Dark Mode · Currently active") (each header shows live state: theme mode, country · currency symbol, budgets saved + this month's amount, total records stored, export formats, cache size, record count at risk)

### 23.2 Profile Improvements
- [x] Avatar picker with preview (current avatar preview + selection grid with ring highlight; Google/custom options)
- [x] Show user stats: "Member since [date]", "[X] expenses logged", "[Y] bills tracked" ("Your Journey" card on profile; member since from `user.created_at`, bills counted as active recurring payments)
- [x] Account deletion option (with strong confirmation) (Danger Zone card → dialog requiring typed "DELETE"; calls new `delete_own_account` security-definer RPC (supabase-migrations/20260823_120000_phase23_delete_own_account.sql), signs out, hard-navigates home)

### 23.3 Data Management
- [x] Export as CSV with date range picker (done in Phase 6.3)
- [x] Export as PDF report with charts (jsPDF report now draws a last-6-months spending bar chart + top-categories horizontal breakdown bars with amounts/percentages before the table)
- [x] Import preview: Show what will be imported before confirming (JSON import opens a preview modal with per-type counts, first expense entries sample, and an explicit Import/Cancel choice; nothing applied until confirmed)
- [x] "Clear all data" requires typing "DELETE ALL" to confirm (custom dialog with typed confirmation input, Enter-to-confirm, button stays disabled until exact match)

---

## Phase 24: Mobile-Specific UX

### 24.1 Touch Interactions
- [x] Pull-to-refresh on all list pages (`usePullToRefresh` + `PullToRefresh` indicator — rubber-band drag at top of page, spinner hold, haptic tick; wired into dashboard (full cache refresh), expenses, bills, notes, income, categories, calendar, monthly; native browser PTR disabled via `overscroll-behavior-y: none`)
- [x] Swipe right to go back (iOS-style) (`SwipeBack` component mounted globally in layout — left-edge 28px start zone, axis-locked, arrow-chip + edge-bar progress indicators, haptic on fire; suppressed while dialogs/mobile nav are open via `GESTURE_BLOCK_SELECTOR`)
- [x] Long press on expense for context menu (done in Phase 19)
- [x] Swipe left to delete, swipe right to duplicate (`ExpenseRow` now reveals a green Duplicate layer behind the row on swipe-right with haptic tick; touches starting in the swipe-back edge zone only track leftward so the two gestures never clash)
- [x] Tap status bar to scroll to top (page headers tappable via `useTapScrollTop` — smooth scroll honoring reduced motion, clicks on nested buttons ignored; applied to dashboard, expenses, bills, notes, income, categories, calendar, monthly, insights)

## Phase 25: Insights & Analytics UX

### 25.1 Interactive Charts
- [x] Tap on pie chart segment → filter expense list to that category (CategoryPie takes onSelect; tap routes to /expenses?category=X&month=YYYY-MM; side progress rows are now accessible buttons doing the same)
- [x] Tap on bar chart bar → navigate to that month's expenses (MonthlyComparisonBar datum gained a `key` (YYYY-MM) + onSelectMonth → /expenses?month=YYYY-MM)
- [x] Long press on chart → show tooltip with exact values (InteractiveChart shell: 420ms hold pins a paper-card tooltip + dashed guide line at that x, haptic feedback, auto-dismisses in 3.5s; works on daily trend and 6-month bars — pie excluded since segment arcs don't map linearly to x)
- [x] Pinch to zoom on area chart (two-finger pinch shrinks/expands visible window, min 7 points, center-anchored; single-finger horizontal drag pans while zoomed with axis-lock so vertical scroll still works; double-tap or Reset chip restores full range; spans >62 days auto-bucket weekly)

### 25.2 Time Range Selector
- [x] Toggle between: This Week, This Month, Last 3 Months, Last 6 Months, This Year, Custom (RangeSelector chips + custom start/end date inputs; nav arrows shift week/month/3m/6m/year anchors, disabled for custom)
- [x] Show selected range prominently (handwritten range label centered in the nav card above Total Outflow; all cards/charts derive from the selected window)
- [x] Charts animate when range changes (charts keyed by range → recharts entrance animations replay on every range switch)

### 25.3 Comparison Views
- [x] Month-over-month comparison: "You spent 15% less than last month" (strip under the range card compares against the equal-length preceding window for ANY range type, not just months; green/red/neutral tones with TrendingDown/TrendingUp/Minus icons)
- [x] Category comparison: "Food spending increased by 20%" (each category allocation row shows ▲/▼ % vs the previous period, "NEW" badge when a category had no prior spend)
- [x] Show trend arrows and percentages on all comparison cards (comparison strip + category rows carry trend icons + rounded percentages with aria-labels)

### 25.4 Financial Health Score
- [x] Calculate a simple score based on: budget adherence, spending trends, bill punctuality (src/lib/healthScore.ts: weighted components — budget 30pts, savings rate 25, MoM trend 20, bill punctuality 25; missing data renormalizes the scale instead of punishing)
- [x] Show as a gauge/meter on dashboard (HealthScoreCard: semicircle SVG gauge with animated stroke-dasharray arc, score out of 100, tier label Excellent/Good/Fair/Needs Work, placed after the quick-stats grid)
- [x] Tips to improve score: "Try reducing food spending by 10%" (top 3 contextual tips: budget pacing/over-budget, biggest category spike vs last month with copy matching this suggestion, savings-rate nudge, overdue-bill reminder, set-a-budget hint)

---

## Phase 26: Offline-First UX (PWA)

### 26.1 Service Worker
- [ ] Configure `next-pwa` for offline support
- [ ] Cache all static assets (fonts, icons, CSS, JS)
- [ ] Cache API responses with stale-while-revalidate strategy
- [ ] Show offline indicator banner when network is unavailable

### 26.2 Offline Expense Entry
- [ ] Allow adding expenses when offline (save to IndexedDB)
- [ ] Show "Syncing..." indicator on expenses added offline
- [ ] Auto-sync when connection is restored
- [ ] Show conflict resolution if same expense was edited on another device

### 26.3 Install Prompt
- [ ] Show "Add to Home Screen" banner after 3rd visit
- [ ] Custom install modal explaining PWA benefits
- [ ] Track installation status

---

## Phase 27: Onboarding Tips & Contextual Help

### 27.1 Feature Discovery
- [ ] Show tooltip tour on first visit to each page:
  - Dashboard: "This is your daily journal. Tap any entry to see details."
  - Expenses: "Swipe left to delete, tap to edit. Use filters to find anything."
  - Bills: "Add your recurring bills here. Enable auto-pay to log them automatically."
  - Insights: "Your spending patterns visualized. Tap any chart segment for details."
- [ ] Show "What's new" changelog modal after updates
- [ ] Add "?" help icons next to complex features (budget, auto-pay, recurring)

### 27.2 Contextual Hints
- [ ] First time adding expense: Show a one-time hint "Tip: You can swipe to delete expenses"
- [ ] First time visiting bills: Show hint "Enable auto-pay on recurring bills to track them automatically"
- [ ] First time visiting insights: Show hint "Add at least 5 expenses to see meaningful charts"
- [ ] Store "hints seen" in localStorage to avoid repeating

### 27.3 Keyboard Shortcuts Help
- [ ] Show keyboard shortcuts modal on `?` key press (desktop)
- [ ] List all shortcuts: `N` new expense, `Ctrl+K` command palette, `Esc` close modal
- [ ] Add keyboard shortcut hints to buttons on hover (desktop only)

---

## Updated Implementation Order

```
Week 1:   Phase 1 (Security) + Phase 2 (Error Handling) — DONE
Week 2:   Phase 3 (UX Consistency) + Phase 4 (Dark Mode) + Phase 5 (Accessibility) — DONE
Week 3:   Phase 13 (Onboarding) + Phase 14 (Quick Add)
Week 4:   Phase 6 (Income + Categories + CSV + Date Filter) — DONE
Week 5:   Phase 16 (Micro-interactions) + Phase 17 (Navigation) — DONE
Week 6:   Phase 19 (Expense List UX)
Week 7:   Phase 20 (Bills UX) + Phase 21 (Notes UX) + Phase 22 (Calendar UX)
Week 8:   Phase 23 (Settings UX) + Phase 24 (Mobile UX)
Week 9:   Phase 25 (Insights UX) + Phase 9 (Notifications) — DONE
Week 10:  Phase 10 (Performance) — DONE + Phase 26 (PWA)
Week 11:  Phase 27 (Onboarding Tips) + Phase 11 (UI Polish) — DONE
Week 12:  Phase 12 (Code Quality) — DONE + Final QA & Testing
```

---

## Files to Create (New)

| File | Purpose | Status |
|---|---|---|
| `src/app/error.tsx` | Global error boundary | DONE |
| `src/app/not-found.tsx` | Custom 404 page | DONE |
| `src/app/expenses/loading.tsx` | Expense page skeleton | DONE |
| `src/app/bills/loading.tsx` | Bills page skeleton | DONE |
| `src/app/insights/loading.tsx` | Insights page skeleton | DONE |
| `src/app/calendar/loading.tsx` | Calendar page skeleton | DONE |
| `src/app/recurring/loading.tsx` | ~~Recurring page skeleton~~ — page removed, file deleted | REMOVED |
| `src/app/monthly/loading.tsx` | Monthly page skeleton | DONE |
| `src/app/notes/loading.tsx` | Notes page skeleton | DONE |
| `src/app/income/page.tsx` | Income tracking page | DONE |
| `src/app/income/loading.tsx` | Income page skeleton | DONE |
| `src/app/income/error.tsx` | Income error boundary | DONE |
| `src/app/categories/page.tsx` | Category management page | DONE |
| `src/app/categories/loading.tsx` | Categories page skeleton | DONE |
| `src/app/categories/error.tsx` | Categories error boundary | DONE |
| `src/components/ExpenseForm.tsx` | Shared expense form (dedup) | DONE |
| `src/components/VariableAmountModal.tsx` | Replace prompt() in bills | DONE |
| `src/components/BudgetBar.tsx` | Gradient budget progress bar (green/yellow/red) | DONE |
| `src/components/ProgressRing.tsx` | Circular progress ring (savings rate) | DONE |
| `src/components/DayDetailDrawer.tsx` | Calendar day slide-in drawer (Phase 22) | DONE |
| `src/components/CollapsibleSection.tsx` | Collapsible settings section w/ value subtitles (Phase 23) | DONE |
| `src/components/PullToRefresh.tsx` | Pull-to-refresh indicator + `src/lib/usePullToRefresh.ts` hook (Phase 24) | DONE |
| `src/components/SwipeBack.tsx` | iOS-style left-edge swipe-back navigation (Phase 24) | DONE |
| `src/lib/useTapScrollTop.ts` | Tap-header-to-scroll-top hook (Phase 24) | DONE |
| `src/components/insights/RangeSelector.tsx` | Period chips (week/month/3m/6m/year/custom) + range math helpers (Phase 25.2) | DONE |
| `src/components/insights/InteractiveChart.tsx` | Touch chart shell: long-press pinned values, pinch-zoom/pan/double-tap reset (Phase 25.1) | DONE |
| `src/lib/healthScore.ts` | Financial health score components + tips (Phase 25.4) | DONE |
| `src/components/HealthScoreCard.tsx` | Dashboard gauge card with score, tier, tips (Phase 25.4) | DONE |
| `supabase-migrations/20260823_120000_phase23_delete_own_account.sql` | Account self-deletion RPC (Phase 23.2) | DONE |
| `src/lib/validations.ts` | Zod schemas for all actions | DONE |
| `src/app/actions/income.ts` | Income server actions | DONE |
| `src/app/expenses/error.tsx` | Expenses error boundary | DONE |
| `src/app/bills/error.tsx` | Bills error boundary | DONE |
| `src/app/recurring/error.tsx` | ~~Recurring error boundary~~ — page removed, file deleted | REMOVED |
| `src/app/insights/error.tsx` | Insights error boundary | DONE |
| `src/app/calendar/error.tsx` | Calendar error boundary | DONE |
| `src/app/monthly/error.tsx` | Monthly error boundary | DONE |
| `src/app/notes/error.tsx` | Notes error boundary | DONE |
| `src/app/settings/error.tsx` | Settings error boundary | DONE |
| `supabase-migrations/` | Schema migration files | DONE |

## Files to Modify (Existing)

| File | Changes | Status |
|---|---|---|
| `src/app/page.tsx` | Dashboard charts, income display, empty state CTA | PARTIAL (income display + empty-state CTA done; dashboard charts not) |
| `src/app/expenses/page.tsx` | Date range filter, pagination, empty states, aria labels | DONE (Phase 6.3/15; + `?category=` / `?month=` deep links for Phase 25 chart taps) |
| `src/app/bills/page.tsx` | Replace prompt(), confirm dialogs for deactivate, auth guard | DONE |
| ~~`src/app/recurring/page.tsx`~~ | Page removed (replaced by /bills) | REMOVED |
| `src/app/insights/page.tsx` | Auth guard, income charts, loading skeleton | DONE (+ Phase 25: range selector, comparisons, interactive charts) |
| `src/app/calendar/page.tsx` | Auth guard, loading skeleton | DONE |
| `src/app/monthly/page.tsx` | Income vs expense comparison, auth guard | DONE |
| `src/app/notes/page.tsx` | Dark mode fixes, empty state | DONE |
| `src/app/settings/page.tsx` | CSV export, date range export, replace alert() | DONE |
| `src/app/profile/page.tsx` | Name editing, password strength | DONE |
| `src/app/login/page.tsx` | Dark mode Google button fix | DONE |
| `src/app/layout.tsx` | Skip-to-content link | DONE |
| `src/components/Sidebar.tsx` | Add Income + Categories links | DONE |
| `src/components/ConfirmDialog.tsx` | Add loading spinner animation | PARTIAL (loading state disables buttons + "Deleting..." text; no spinner icon) |
| `src/components/Toast.tsx` | Fix position conflict with ThemeToggle | DONE |
| `src/components/ThemeToggle.tsx` | Fix position conflict with Toast | DONE |
| `src/components/FlagIcon.tsx` | Add alt text, fallback for CDN failure | DONE |
| `src/components/AddExpenseModal.tsx` | Refactor to use shared ExpenseForm | DONE |
| `src/components/EditExpenseModal.tsx` | Refactor to use shared ExpenseForm | DONE |
| `src/components/AddBillModal.tsx` | Add payment method from DB | DONE |
| `src/components/AuthProvider.tsx` | Handle session expiry gracefully | DONE |
| `src/lib/store.tsx` | Error handling, income hook, pagination, memoization | DONE (Phase 2) |
| `src/lib/utils.ts` | Consolidate categories, add CSV utils | DONE |
| `src/lib/supabase/client.ts` | Replace null returns with thrown errors | DONE |
| `src/lib/supabase/server.ts` | Replace null returns with thrown errors | DONE |
| `src/types/index.ts` | Add Income type, consolidate categories | DONE |
| `src/app/actions/expenses.ts` | Add Zod validation | DONE |
| `src/app/actions/recurring.ts` | Add Zod validation, payment_method, auto_pay | DONE |
| `src/app/actions/budgets.ts` | Add Zod validation | DONE |
| `src/app/actions/notes.ts` | Add Zod validation | DONE |
| `src/app/actions/categories.ts` | Add Zod validation, updateCategory action | DONE |
| `src/app/globals.css` | Fix sticky-note dark mode, add animations | DONE |
| `supabase-schema.sql` | Add payment_method, auto_pay, indexes, CHECK, trigger | DONE |
| `src/app/auth/callback/route.ts` | Handle thrown errors from createClient | DONE |
