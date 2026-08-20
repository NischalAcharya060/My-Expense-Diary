# My Expense Diary — Production-Ready Overhaul Plan

> Goal: Transform this from a functional prototype into a polished, real-world finance app that users can trust with their money data.

---

## Phase 1: Critical Fixes (Security + Data Integrity)

### 1.1 Security Hardening
- [ ] Verify `.env` is in `.gitignore` and not tracked by git. Rotate Supabase keys if repo is public.
- [ ] Add Zod validation schemas for ALL server actions (`expenses.ts`, `recurring.ts`, `budgets.ts`, `notes.ts`, `categories.ts`)
  - Validate: name length (max 200), amount (positive, max 999999.99), date format, category names
  - Reject unknown/extra fields
- [ ] Replace `null as any` casts in `lib/supabase/client.ts:12` and `lib/supabase/server.ts:9` with proper null checks and thrown errors
- [ ] Add password strength validation in `profile/page.tsx` (min 8 chars, require number or special char)

### 1.2 Database Schema Fixes
- [ ] Add `payment_method` column to `recurring_payments` table (currently only stored in localStorage, lost on cache clear)
- [ ] Add `auto_pay` column to `recurring_payments` table (same issue — localStorage only)
- [ ] Add missing indexes:
  - `categories(user_id)` 
  - `expenses(user_id, expense_type)` — bills page filters by this constantly
  - `recurring_payments(user_id, due_day)` — auto-pay engine queries
- [ ] Add CHECK constraint on `expense_type` column (prevent typos: should only be 'Expense', 'Bill', 'Subscription', 'Recurring payment')
- [ ] Add database trigger to sync `last_paid` on `recurring_payments` when an expense is logged with `recurring_payment_id`

---

## Phase 2: Error Handling + Resilience

### 2.1 Error Boundaries
- [ ] Create `src/app/error.tsx` — global error boundary with retry button
- [ ] Create `src/app/expenses/error.tsx`
- [ ] Create `src/app/bills/error.tsx`
- [ ] Create `src/app/recurring/error.tsx`
- [ ] Create `src/app/insights/error.tsx`
- [ ] Create `src/app/calendar/error.tsx`
- [ ] Create `src/app/monthly/error.tsx`
- [ ] Create `src/app/notes/error.tsx`
- [ ] Create `src/app/settings/error.tsx`
- [ ] Create `src/app/not-found.tsx` — custom 404 page with "Go Home" CTA

### 2.2 Loading States
- [ ] Create `src/app/expenses/loading.tsx` — skeleton matching expense list layout
- [ ] Create `src/app/bills/loading.tsx` — skeleton matching bill cards
- [ ] Create `src/app/insights/loading.tsx` — chart-shaped skeletons
- [ ] Create `src/app/calendar/loading.tsx` — calendar grid skeleton
- [ ] Create `src/app/recurring/loading.tsx`
- [ ] Create `src/app/monthly/loading.tsx`
- [ ] Create `src/app/notes/loading.tsx`

### 2.3 Store Error Handling
- [ ] In `lib/store.tsx` — stop silently swallowing errors in `.catch(() => {})` (lines ~139-159)
- [ ] Show toast on failed data fetches with retry option
- [ ] Add error state to each hook (`useExpenses().error`, `useRecurringPayments().error`)
- [ ] Handle Supabase session expiry gracefully in `AuthProvider.tsx`

---

## Phase 3: UX Consistency Fixes

### 3.1 Replace Native Browser Dialogs
- [ ] `bills/page.tsx:98` — Replace `prompt()` for variable bill amount with a custom modal input
- [ ] `settings/page.tsx:178` — Replace `alert("Invalid backup file")` with `toast("Invalid backup file", "error")`

### 3.2 Auth Guard Consistency
- [ ] Add `AuthGuard` wrapper to `insights/page.tsx`
- [ ] Add `AuthGuard` wrapper to `calendar/page.tsx`
- [ ] Add `AuthGuard` wrapper to `monthly/page.tsx`

### 3.3 Confirmation Dialogs
- [ ] `recurring/page.tsx` — Add ConfirmDialog for toggle active/inactive (currently instant, no undo)
- [ ] `bills/page.tsx` — Add ConfirmDialog for deactivate bill action (currently instant)

### 3.4 Toast Error Messages
- [ ] Add error toast to all failed server actions across all pages (currently some silently fail)
- [ ] Add loading state to delete buttons (show spinner while deleting)

---

## Phase 4: Dark Mode Polish

### 4.1 Fix Dark Mode Breakages
- [ ] `notes/page.tsx:197-238` — Replace hardcoded `dark:text-black`, `dark:bg-black/10` with CSS custom properties
- [ ] `globals.css:152` — `.sticky-note` hardcoded `background: #FEF9C3` needs dark mode variant
- [ ] `page.tsx:309-331` — Landing page sticky notes `bg-[#FEF9C3]`, `bg-[#DCFCE7]`, `bg-[#DBEAFE]` need dark variants
- [ ] `login/page.tsx:209` — Google sign-in button `bg-white` needs dark mode handling
- [ ] `components/FlagIcon.tsx` — External CDN dependency (`flagcdn.com`); add fallback for when CDN is down

### 4.2 Theme Toggle Conflict
- [ ] `ThemeToggle.tsx` and `Toast.tsx` both use `fixed bottom-6 right-6 z-50` — move toast container to `bottom-6 left-6` or adjust z-index stacking

---

## Phase 5: Accessibility

### 5.1 WCAG Compliance
- [ ] Add `alt` text to flag images in `FlagIcon.tsx` (currently `alt=""`)
- [ ] Add `aria-label` to all icon-only buttons (edit, delete, toggle) across `recurring/page.tsx`, `expenses/page.tsx`, `bills/page.tsx`
- [ ] Add skip-to-content link in `layout.tsx`
- [ ] Ensure all interactive elements have visible focus indicators
- [ ] Add `role` attributes to custom modals (`ConfirmDialog`, `AddExpenseModal`, etc.)

---

## Phase 6: Missing Core Features

### 6.1 Income Tracking
- [ ] Add `income` table to Supabase schema (id, user_id, name, amount, date, source, category, created_at)
- [ ] Add server actions: `fetchIncome`, `addIncome`, `updateIncome`, `deleteIncome`
- [ ] Add `useIncome` hook to store
- [ ] Create `src/app/income/page.tsx` — income journal with CRUD
- [ ] Update dashboard (`page.tsx`) to show net balance (income - expenses)
- [ ] Update `monthly/page.tsx` to show income vs expense comparison
- [ ] Update `insights/page.tsx` to include income charts
- [ ] Add sidebar link for Income

### 6.2 Category Management
- [ ] Create `src/app/categories/page.tsx` — dedicated page to view, edit, reorder, delete categories
- [ ] Add `updateCategory` server action to `actions/categories.ts`
- [ ] Add edit icon and reorder drag handles to category list
- [ ] Show expense count per category
- [ ] Prevent deletion of categories with existing expenses (or offer to reassign)

### 6.3 CSV Export
- [ ] Add CSV export option alongside JSON in `settings/page.tsx`
- [ ] Format: Date, Name, Amount, Category, Payment Method, Expense Type, Note
- [ ] Add date range selector for export
- [ ] Add CSV export to monthly summary page

### 6.4 Date Range Filter on Expenses
- [ ] Add start/end date picker to `expenses/page.tsx` filter bar
- [ ] Add "This Week", "This Month", "Last 30 Days", "Custom Range" quick filters
- [ ] Persist filter selection in URL query params for shareability

---

## Phase 7: Dashboard Enhancement

### 7.1 Rich Dashboard
- [ ] Add mini category pie chart to dashboard (reuse insights chart component)
- [ ] Add spending trend sparkline (last 7 days)
- [ ] Add "Top Spending Category" card
- [ ] Add monthly budget progress bar (when budget is set)
- [ ] Improve empty state: show illustration + "Add Your First Expense" CTA button

### 7.2 Quick Actions
- [ ] Add floating action button (FAB) on mobile for quick expense entry
- [ ] Add keyboard shortcut `Ctrl+N` to open add expense modal (desktop)

---

## Phase 8: Expense Templates

- [ ] Add `expense_templates` table (id, user_id, name, amount, category, payment_method, expense_type, created_at)
- [ ] Add server actions for CRUD
- [ ] Add "Save as Template" button on expense creation success
- [ ] Add "Use Template" section in AddExpenseModal to pre-fill from template
- [ ] Show templates list in settings or as a dropdown on expense page

---

## Phase 9: Notifications & Reminders

### 9.1 Bill Reminders
- [ ] Use the `reminder_days` field on `RecurringPayment` (currently unused)
- [ ] On dashboard, show "Upcoming in X days" badges for bills within reminder window
- [ ] Add browser Notification API support (request permission, show notification on due date)

### 9.2 Budget Alerts
- [ ] When adding an expense that pushes a category over budget, show warning toast
- [ ] On dashboard, show budget warning cards when any category is >80% used

---

## Phase 10: Performance Optimization

### 10.1 Pagination
- [ ] Add server-side pagination to `fetchExpenses` (limit/offset)
- [ ] Add "Load More" button or infinite scroll to expenses page
- [ ] Paginate bills history tab

### 10.2 Code Splitting
- [ ] Lazy load `recharts` in `insights/page.tsx` (400KB bundle)
- [ ] Lazy load `AddBillModal` and `AddExpenseModal` (only needed on interaction)
- [ ] Use `next/dynamic` for chart components

### 10.3 Caching
- [ ] Add `React.memo` to expense list item components
- [ ] Add `useMemo` for filtered/sorted expense lists
- [ ] Improve localStorage cache with version stamp (invalidate on schema changes)

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

## Implementation Order

```
Week 1:  Phase 1 (Security) + Phase 2 (Error Handling)
Week 2:  Phase 3 (UX Consistency) + Phase 4 (Dark Mode) + Phase 5 (Accessibility)
Week 3:  Phase 6 (Core Features: Income + Categories + CSV Export + Date Filter)
Week 4:  Phase 7 (Dashboard) + Phase 8 (Templates)
Week 5:  Phase 9 (Notifications) + Phase 10 (Performance)
Week 6:  Phase 11 (UI Polish) + Phase 12 (Code Quality)
```

---

## Files to Create (New)

| File | Purpose |
|---|---|
| `src/app/error.tsx` | Global error boundary |
| `src/app/not-found.tsx` | Custom 404 page |
| `src/app/expenses/loading.tsx` | Expense page skeleton |
| `src/app/bills/loading.tsx` | Bills page skeleton |
| `src/app/insights/loading.tsx` | Insights page skeleton |
| `src/app/calendar/loading.tsx` | Calendar page skeleton |
| `src/app/recurring/loading.tsx` | Recurring page skeleton |
| `src/app/monthly/loading.tsx` | Monthly page skeleton |
| `src/app/notes/loading.tsx` | Notes page skeleton |
| `src/app/income/page.tsx` | Income tracking page |
| `src/app/income/loading.tsx` | Income page skeleton |
| `src/app/categories/page.tsx` | Category management page |
| `src/components/ExpenseForm.tsx` | Shared expense form (dedup) |
| `src/components/VariableAmountModal.tsx` | Replace prompt() in bills |
| `src/lib/validations.ts` | Zod schemas for all actions |
| `src/app/actions/income.ts` | Income server actions |
| `supabase-migrations/` | Schema migration files |

## Files to Modify (Existing)

| File | Changes |
|---|---|
| `src/app/page.tsx` | Dashboard charts, income display, empty state CTA |
| `src/app/expenses/page.tsx` | Date range filter, pagination, empty states, aria labels |
| `src/app/bills/page.tsx` | Replace prompt(), confirm dialogs for deactivate, auth guard |
| `src/app/recurring/page.tsx` | Confirm dialogs for toggle, aria labels, dark mode |
| `src/app/insights/page.tsx` | Auth guard, income charts, loading skeleton |
| `src/app/calendar/page.tsx` | Auth guard, loading skeleton |
| `src/app/monthly/page.tsx` | Income vs expense comparison, auth guard |
| `src/app/notes/page.tsx` | Dark mode fixes, empty state |
| `src/app/settings/page.tsx` | CSV export, date range export, replace alert() |
| `src/app/profile/page.tsx` | Name editing, password strength |
| `src/app/login/page.tsx` | Dark mode Google button fix |
| `src/app/layout.tsx` | Skip-to-content link |
| `src/components/Sidebar.tsx` | Add Income + Categories links |
| `src/components/ConfirmDialog.tsx` | Add loading spinner animation |
| `src/components/Toast.tsx` | Fix position conflict with ThemeToggle |
| `src/components/ThemeToggle.tsx` | Fix position conflict with Toast |
| `src/components/FlagIcon.tsx` | Add alt text, fallback for CDN failure |
| `src/components/AddExpenseModal.tsx` | Refactor to use shared ExpenseForm |
| `src/components/EditExpenseModal.tsx` | Refactor to use shared ExpenseForm |
| `src/components/AddBillModal.tsx` | Add payment method from DB |
| `src/lib/store.tsx` | Error handling, income hook, pagination, memoization |
| `src/lib/utils.ts` | Consolidate categories, add CSV utils |
| `src/lib/supabase/client.ts` | Remove null as any |
| `src/lib/supabase/server.ts` | Remove null as any |
| `src/types/index.ts` | Add Income type, Template type, consolidate categories |
| `src/app/actions/expenses.ts` | Add Zod validation |
| `src/app/actions/recurring.ts` | Add Zod validation, payment_method, auto_pay |
| `src/app/actions/budgets.ts` | Add Zod validation |
| `src/app/actions/notes.ts` | Add Zod validation |
| `src/app/actions/categories.ts` | Add Zod validation, updateCategory action |
| `src/app/globals.css` | Fix sticky-note dark mode, add animations |
| `supabase-schema.sql` | Add income table, indexes, constraints, triggers |
