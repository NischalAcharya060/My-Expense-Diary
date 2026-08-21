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
- [ ] Add page transition animations (route change fade/slide)
- [ ] Add subtle hover lift effect on cards
- [ ] Add swipe-to-delete on mobile expense items
- [ ] Add confetti or celebration animation when all bills are paid for the month

### 11.2 Empty States (per page)
- [ ] `expenses/page.tsx` — Illustrated empty state with "Start Tracking" CTA
- [ ] `bills/page.tsx` — Already has one, but improve with illustration
- [ ] `recurring/page.tsx` — Add illustration and CTA button
- [ ] `insights/page.tsx` — "Add expenses to see insights" with CTA
- [ ] `calendar/page.tsx` — Show empty calendar with prompt
- [ ] `notes/page.tsx` — "Jot down your first note" prompt
- [ ] `income/page.tsx` (new) — "Track your first income" prompt

### 11.3 Visual Refinements
- [ ] Consistent card shadows across all pages
- [ ] Add subtle gradient to header sections
- [ ] Improve typography hierarchy (headings, body, captions)
- [ ] Add color-coded category dots next to expense names (not just left border)

---

## Phase 12: Code Quality & Maintainability

### 12.1 Deduplication
- [ ] Extract shared form fields from `AddExpenseModal.tsx` and `EditExpenseModal.tsx` into a shared `ExpenseForm` component
- [ ] Consolidate default categories from 3 locations (`types/index.ts:3-16`, `lib/store.tsx:42-55`, `lib/utils.ts:51-64`) into a single source of truth
- [ ] Remove `CategoryItem` duplicate type definition from `actions/categories.ts:5-10`

### 12.2 Type Safety
- [ ] Remove all `as any` casts (found in `recurring/page.tsx:56`, `bills/page.tsx:115`, `store.tsx`)
- [ ] Create proper union types for `ExpenseType`, `Frequency`, `PaymentMethod` if not already done
- [ ] Add strict TypeScript config: `"strict": true` in `tsconfig.json`

### 12.3 Testing
- [ ] Add unit tests for `getDueDates` function (complex pure function with 5 frequency types)
- [ ] Add unit tests for `formatCurrency` and other utility functions
- [ ] Add component tests for `ConfirmDialog`, `Toast`, `AddExpenseModal`
- [ ] Add E2E tests for: login → add expense → verify on dashboard → delete expense flow

---

## Phase 13: First-Time User Experience (Onboarding)

### 13.1 Welcome Flow
- [ ] Create `src/app/onboarding/page.tsx` — 3-step guided welcome after first login
  - Step 1: "Welcome to My Expense Diary" — short animated intro with app preview
  - Step 2: "Pick your currency" — country/currency selector (reuses CountryProvider)
  - Step 3: "Log your first expense" — inline mini form to add one expense right there
- [ ] Store `onboarded` flag in `user_metadata` to skip flow on return visits
- [ ] Show onboarding only once per user (check `user.user_metadata.onboarded`)

### 13.2 Empty State CTAs with Guidance
- [ ] Dashboard empty state: "Your diary is empty!" with animated illustration + "Add First Expense" button that opens the modal
- [ ] Expenses page empty: Show a mock journal page with faded example entries and "Tap to start tracking" overlay
- [ ] Bills page empty: Show a card with "No bills yet — add Netflix, rent, electricity..." and quick-add presets
- [ ] Notes page empty: Show a blank sticky note with blinking cursor prompt "Jot something down..."
- [ ] Insights page empty: "Add 3+ expenses to unlock insights" with progress indicator
- [ ] Calendar page empty: Show current month calendar with "Tap any day to add expenses"

---

## Phase 14: Frictionless Expense Entry (Core UX)

### 14.1 Quick Add (1-Tap Expense)
- [ ] Add "Quick Add" floating action button (FAB) visible on ALL pages (bottom-right, above theme toggle)
- [ ] Quick Add opens a minimal modal: Amount + Category grid + Done button (3 taps total)
- [ ] Remember last used category and pre-select it
- [ ] Remember last used payment method and pre-select it
- [ ] Show recent expense names as chips above the name field for quick re-entry

### 14.2 Smart Expense Form
- [ ] Auto-categorize based on expense name (e.g., "Netflix" → Subscription, "Uber" → Transport)
- [ ] Show category suggestions as user types the name
- [ ] Add " Repeat this?" toggle on expense form → creates recurring payment automatically
- [ ] Show running daily total at the bottom of the form as user adds expenses
- [ ] Haptic feedback on mobile when expense is saved (navigator.vibrate)

### 14.3 Voice Entry (Future)
- [ ] Add microphone button on AddExpenseModal
- [ ] Use Web Speech API: "Spent 50 dollars on groceries" → auto-fills amount + category
- [ ] Show transcribed text for confirmation before saving

---

## Phase 15: Smart Defaults & Personalization

### 15.1 Recent & Frequent
- [ ] On AddExpenseModal: Show "Recent" section with last 5 used categories + payment methods
- [ ] On AddExpenseModal: Show "Frequently Used" section with top 3 categories by frequency
- [ ] Pre-fill date with today, payment method with last used, category with most used

### 15.2 Expense Name Autocomplete
- [ ] As user types expense name, show dropdown of previous expense names matching the input
- [ ] Selecting a suggestion auto-fills amount, category, and payment method from history
- [ ] Dedupe suggestions by name, show most recent amount

### 15.3 Smart Category Suggestions
- [ ] When user types a new category name, check if it's similar to existing ones ("food" vs "Food")
- [ ] Suggest merging similar categories
- [ ] Auto-assign colors based on category name hash (consistent per user)

---

## Phase 16: Visual Feedback & Micro-interactions

### 16.1 Success Celebrations
- [ ] After adding expense: Show a subtle checkmark animation (scale up + fade) on the button
- [ ] After paying all bills for the month: Show confetti animation on bills page
- [ ] After reaching budget limit: Show a gentle "Budget reached" pulse animation on the category
- [ ] After deleting: Slide-out animation on the deleted row before removing from DOM

### 16.2 Progress Indicators
- [ ] Budget progress bars with color gradient: green (0-50%) → yellow (50-80%) → red (80-100%)
- [ ] Monthly savings goal progress ring (circular progress)
- [ ] Bill payment progress: "3 of 5 bills paid this month" with visual progress bar
- [ ] Expense count milestone badges: "100 expenses logged! 🎉"

### 16.3 Haptic & Visual Feedback
- [ ] On mobile: Light haptic feedback on button taps (navigator.vibrate(10))
- [ ] On mobile: Pull-to-refresh on expenses list
- [ ] Long-press on expense → context menu (Edit, Delete, Duplicate)
- [ ] Swipe left on expense → reveals red delete button (mobile)
- [ ] Swipe right on expense → reveals green duplicate button (mobile)

### 16.4 Skeleton Loading Improvements
- [ ] Expense list skeletons: Show rows with animated gradient shimmer matching handwritten style
- [ ] Chart skeletons: Show faint chart outlines with pulse animation
- [ ] Dashboard skeletons: Show stat cards with shimmer effect
- [ ] Calendar skeletons: Show grid with pulse

---

## Phase 17: Navigation & Wayfinding

### 17.1 Smart Sidebar
- [ ] Show unread bill count badge on "Bills & Subs" sidebar link when overdue bills exist
- [ ] Show today's expense count on "Expenses" sidebar link
- [ ] Highlight current page with animated underline (not just color change)
- [ ] Show "New" badge on sidebar links for features user hasn't tried yet

### 17.2 Breadcrumbs & Back Navigation
- [ ] Add breadcrumbs on settings sub-pages
- [ ] On mobile: Show back arrow in page header for easy navigation
- [ ] On modals: Swipe down to dismiss (mobile)

### 17.3 Quick Jump
- [ ] Add `Ctrl+K` / `Cmd+K` keyboard shortcut to open command palette
- [ ] Command palette: Search expenses, jump to pages, quick actions (add expense, add bill)
- [ ] Show recent actions in command palette
- [ ] Show on desktop only, with spotlight-style UI

---

## Phase 18: Dashboard UX Redesign

### 18.1 At-a-Glance Cards
- [ ] Top row: 4 stat cards with icons — Total Spent (month), Bills Due, Budget Left, Savings
- [ ] Each card: Icon + label + amount + trend arrow (↑↓ vs last month)
- [ ] Cards should be tappable to navigate to relevant page

### 18.2 Today's Summary Card
- [ ] Show today's expenses with running total
- [ ] Show "Last expense: [name] [amount] [time ago]"
- [ ] Quick "Add Another" button at the bottom

### 18.3 Upcoming Bills Timeline
- [ ] Show next 3-5 upcoming bills as a vertical timeline
- [ ] Color-code: Red (overdue), Orange (due today), Blue (upcoming)
- [ ] Show countdown: "Netflix due in 3 days"
- [ ] Each bill item tappable to go to bills page

### 18.4 Spending Heatmap
- [ ] Show a mini GitHub-style spending heatmap for the current month
- [ ] Green shades for low spending days, red shades for high spending days
- [ ] Tappable to navigate to that day's expenses

---

## Phase 19: Expense List UX Improvements

### 19.1 Grouping & Sorting
- [ ] Group expenses by date with sticky date headers ("Today", "Yesterday", "Aug 18")
- [ ] Show daily subtotals in the date header
- [ ] Sort options: Newest first, Oldest first, Highest amount, Lowest amount
- [ ] Sort toggle button in the filter bar

### 19.2 Inline Actions
- [ ] Swipe to delete on mobile
- [ ] Long press for context menu (Edit, Delete, Duplicate, View details)
- [ ] Tap on expense → expand to show full details (note, receipt, category color)
- [ ] Double-tap on expense → quick edit amount inline

### 19.3 Search UX
- [ ] Search bar with magnifying glass icon and clear button
- [ ] Search as you type (debounced 300ms)
- [ ] Show result count: "Found 12 expenses"
- [ ] Highlight matching text in results
- [ ] Recent searches dropdown when search is focused
- [ ] Empty search state: "No expenses match your search"

### 19.4 Filter UX
- [ ] Filter chips with visual feedback (colored borders when active)
- [ ] Active filter count badge: "3 filters active"
- [ ] "Clear all filters" button when any filter is active
- [ ] Filter bar should be sticky on scroll

---

## Phase 20: Bills & Subscriptions UX

### 20.1 Visual Status Cards
- [ ] Overdue bills: Red left border + pulsing dot + "OVERDUE" badge
- [ ] Due today: Orange left border + "DUE TODAY" badge
- [ ] Upcoming: Blue left border + countdown badge
- [ ] Paid: Green left border + checkmark + strikethrough name

### 20.2 Pay Flow
- [ ] "Pay Now" button opens a confirmation modal (not instant)
- [ ] Show payment summary before confirming: Name, Amount, Date, Method
- [ ] After payment: Green checkmark animation + toast
- [ ] Show "All bills paid! 🎉" celebration when all monthly bills are settled

### 20.3 Subscription Health
- [ ] Show monthly subscription total prominently
- [ ] Show "You spend $X/month on subscriptions" with comparison to income
- [ ] Flag unused subscriptions: "Haven't used in 30 days" warning
- [ ] Suggest canceling expensive subscriptions (UX hint, not actual cancel)

---

## Phase 21: Notes & Journal UX

### 21.1 Rich Note Creation
- [ ] Drag-and-drop color picker for sticky notes (instead of dropdown)
- [ ] Pin note to top with visual "pin" animation
- [ ] Notes should auto-resize as content grows
- [ ] Show character count / word count at bottom of note

### 21.2 Note Organization
- [ ] Pinned notes always at top with a subtle "📌" indicator
- [ ] Sort by: Last edited, Created date, Color
- [ ] Grid layout on desktop, list on mobile
- [ ] Masonry layout option for notes (Pinterest-style)

### 21.3 Note-to-Expense Link
- [ ] Allow linking a note to an expense (e.g., "Grocery list" note linked to grocery expense)
- [ ] Show linked notes on expense detail view
- [ ] Show linked expenses on note view

---

## Phase 22: Calendar UX Improvements

### 22.1 Day Detail Panel
- [ ] Tapping a day opens a slide-in panel from right (not a new page)
- [ ] Panel shows: Date, total, list of expenses, "Add Expense" button for that date
- [ ] Swipe panel left/right to navigate to previous/next day

### 22.2 Visual Indicators
- [ ] Days with expenses: Show dot indicator with color matching top category
- [ ] Days with high spending: Show red dot
- [ ] Today: Highlight with ring/border
- [ ] Days with no expenses: Subtle gray dot or no indicator

### 22.3 Monthly Navigation
- [ ] Smooth month transition animation (slide left/right)
- [ ] Show monthly total at top of calendar
- [ ] "Today" button to quickly jump back to current month

---

## Phase 23: Settings & Profile UX

### 23.1 Settings Organization
- [ ] Group settings into cards with clear sections: "Appearance", "Currency", "Budget", "Data", "Account"
- [ ] Each section collapsible
- [ ] Show current values as subtitles (e.g., "Dark Mode" → "Dark Mode · Currently active")

### 23.2 Profile Improvements
- [ ] Avatar picker with preview (current implementation is basic)
- [ ] Show user stats: "Member since [date]", "[X] expenses logged", "[Y] bills tracked"
- [ ] Account deletion option (with strong confirmation)

### 23.3 Data Management
- [ ] Export as CSV with date range picker
- [ ] Export as PDF report with charts
- [ ] Import preview: Show what will be imported before confirming
- [ ] "Clear all data" requires typing "DELETE ALL" to confirm

---

## Phase 24: Mobile-Specific UX

### 24.1 Touch Interactions
- [ ] Pull-to-refresh on all list pages
- [ ] Swipe right to go back (iOS-style)
- [ ] Long press on expense for context menu
- [ ] Swipe left to delete, swipe right to duplicate
- [ ] Tap status bar to scroll to top

### 24.2 Bottom Navigation (Mobile)
- [ ] Show bottom tab bar on mobile instead of sidebar
- [ ] Tabs: Home, Expenses, Add (center FAB), Bills, More
- [ ] Active tab indicator with color
- [ ] Badge counts on relevant tabs (overdue bills count)

### 24.3 Mobile Modals
- [ ] All modals should slide up from bottom on mobile (sheet style)
- [ ] Swipe down on modal to dismiss
- [ ] Modal backdrop blur effect

### 24.4 Responsive Breakpoints
- [ ] Ensure all pages work on 320px minimum width
- [ ] Test on iPhone SE, iPhone 14, Galaxy S21, iPad
- [ ] Cards should stack vertically on mobile, grid on desktop
- [ ] Charts should be full-width on mobile with horizontal scroll if needed

---

## Phase 25: Insights & Analytics UX

### 25.1 Interactive Charts
- [ ] Tap on pie chart segment → filter expense list to that category
- [ ] Tap on bar chart bar → navigate to that month's expenses
- [ ] Long press on chart → show tooltip with exact values
- [ ] Pinch to zoom on area chart

### 25.2 Time Range Selector
- [ ] Toggle between: This Week, This Month, Last 3 Months, Last 6 Months, This Year, Custom
- [ ] Show selected range prominently
- [ ] Charts should animate when range changes

### 25.3 Comparison Views
- [ ] Month-over-month comparison: "You spent 15% less than last month"
- [ ] Category comparison: "Food spending increased by 20%"
- [ ] Show trend arrows and percentages on all comparison cards

### 25.4 Financial Health Score
- [ ] Calculate a simple score based on: budget adherence, spending trends, bill punctuality
- [ ] Show as a gauge/meter on dashboard
- [ ] Tips to improve score: "Try reducing food spending by 10%"

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
Week 2:   Phase 3 (UX Consistency) + Phase 4 (Dark Mode) + Phase 5 (Accessibility)
Week 3:   Phase 13 (Onboarding) + Phase 14 (Quick Add) + Phase 15 (Smart Defaults)
Week 4:   Phase 6 (Income + Categories + CSV + Date Filter)
Week 5:   Phase 16 (Micro-interactions) + Phase 17 (Navigation)
Week 6:   Phase 18 (Dashboard UX) + Phase 19 (Expense List UX)
Week 7:   Phase 20 (Bills UX) + Phase 21 (Notes UX) + Phase 22 (Calendar UX)
Week 8:   Phase 23 (Settings UX) + Phase 24 (Mobile UX)
Week 9:   Phase 25 (Insights UX) + Phase 9 (Notifications) — DONE
Week 10:  Phase 10 (Performance) + Phase 26 (PWA)
Week 11:  Phase 27 (Onboarding Tips) + Phase 11 (UI Polish)
Week 12:  Phase 12 (Code Quality) + Final QA & Testing
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
| `src/app/recurring/loading.tsx` | Recurring page skeleton | DONE |
| `src/app/monthly/loading.tsx` | Monthly page skeleton | DONE |
| `src/app/notes/loading.tsx` | Notes page skeleton | DONE |
| `src/app/income/page.tsx` | Income tracking page | |
| `src/app/income/loading.tsx` | Income page skeleton | |
| `src/app/categories/page.tsx` | Category management page | |
| `src/components/ExpenseForm.tsx` | Shared expense form (dedup) | |
| `src/components/VariableAmountModal.tsx` | Replace prompt() in bills | |
| `src/lib/validations.ts` | Zod schemas for all actions | DONE |
| `src/app/actions/income.ts` | Income server actions | |
| `src/app/expenses/error.tsx` | Expenses error boundary | DONE |
| `src/app/bills/error.tsx` | Bills error boundary | DONE |
| `src/app/recurring/error.tsx` | Recurring error boundary | DONE |
| `src/app/insights/error.tsx` | Insights error boundary | DONE |
| `src/app/calendar/error.tsx` | Calendar error boundary | DONE |
| `src/app/monthly/error.tsx` | Monthly error boundary | DONE |
| `src/app/notes/error.tsx` | Notes error boundary | DONE |
| `src/app/settings/error.tsx` | Settings error boundary | DONE |
| `supabase-migrations/` | Schema migration files | DONE |

## Files to Modify (Existing)

| File | Changes | Status |
|---|---|---|
| `src/app/page.tsx` | Dashboard charts, income display, empty state CTA | |
| `src/app/expenses/page.tsx` | Date range filter, pagination, empty states, aria labels | |
| `src/app/bills/page.tsx` | Replace prompt(), confirm dialogs for deactivate, auth guard | |
| `src/app/recurring/page.tsx` | Confirm dialogs for toggle, aria labels, dark mode | |
| `src/app/insights/page.tsx` | Auth guard, income charts, loading skeleton | |
| `src/app/calendar/page.tsx` | Auth guard, loading skeleton | |
| `src/app/monthly/page.tsx` | Income vs expense comparison, auth guard | |
| `src/app/notes/page.tsx` | Dark mode fixes, empty state | |
| `src/app/settings/page.tsx` | CSV export, date range export, replace alert() | |
| `src/app/profile/page.tsx` | Name editing, password strength | DONE |
| `src/app/login/page.tsx` | Dark mode Google button fix | |
| `src/app/layout.tsx` | Skip-to-content link | |
| `src/components/Sidebar.tsx` | Add Income + Categories links | |
| `src/components/ConfirmDialog.tsx` | Add loading spinner animation | |
| `src/components/Toast.tsx` | Fix position conflict with ThemeToggle | |
| `src/components/ThemeToggle.tsx` | Fix position conflict with Toast | |
| `src/components/FlagIcon.tsx` | Add alt text, fallback for CDN failure | |
| `src/components/AddExpenseModal.tsx` | Refactor to use shared ExpenseForm | |
| `src/components/EditExpenseModal.tsx` | Refactor to use shared ExpenseForm | |
| `src/components/AddBillModal.tsx` | Add payment method from DB | |
| `src/components/AuthProvider.tsx` | Handle session expiry gracefully | DONE |
| `src/lib/store.tsx` | Error handling, income hook, pagination, memoization | DONE (Phase 2) |
| `src/lib/utils.ts` | Consolidate categories, add CSV utils | |
| `src/lib/supabase/client.ts` | Replace null returns with thrown errors | DONE |
| `src/lib/supabase/server.ts` | Replace null returns with thrown errors | DONE |
| `src/types/index.ts` | Add Income type, consolidate categories | |
| `src/app/actions/expenses.ts` | Add Zod validation | DONE |
| `src/app/actions/recurring.ts` | Add Zod validation, payment_method, auto_pay | DONE |
| `src/app/actions/budgets.ts` | Add Zod validation | DONE |
| `src/app/actions/notes.ts` | Add Zod validation | DONE |
| `src/app/actions/categories.ts` | Add Zod validation, updateCategory action | DONE |
| `src/app/globals.css` | Fix sticky-note dark mode, add animations | |
| `supabase-schema.sql` | Add payment_method, auto_pay, indexes, CHECK, trigger | DONE |
| `src/app/auth/callback/route.ts` | Handle thrown errors from createClient | DONE |
