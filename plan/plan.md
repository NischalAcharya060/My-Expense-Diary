Build a modern personal expense-tracking web app using **Next.js, TypeScript, Tailwind CSS, and Supabase**. The main concept is a **digital physical notebook/expense diary**, not a conventional banking dashboard.

### Design & Theme

Create the entire UI around a realistic paper notebook aesthetic:

* Warm off-white/cream paper background
* Subtle paper texture
* Horizontal ruled notebook lines
* Thin red vertical margin line
* Handwritten-style headings and accent text
* Slightly imperfect paper/card edges
* Notebook tabs and page sections
* Paper clips, sticky notes, small tape elements where appropriate
* Soft shadows and subtle paper depth
* Minimal, clean, cozy interface
* Responsive on desktop, tablet, and mobile
* Use animations sparingly for page transitions and interactions
* Keep the UI practical and readable; do not make it look like a banking/fintech dashboard

The app should feel like opening a **real personal expense notebook**.

### Main Navigation

Create:

1. Notebook / Dashboard
2. Daily Expenses
3. Calendar
4. Monthly Summary
5. Recurring Payments
6. Bills & Subscriptions
7. Insights
8. Notes
9. Settings

### Dashboard / Notebook Home

The homepage should look like an open notebook page.

Show:

* Current date
* Today's expenses written like notebook entries
* Today's total
* Current month's total
* Monthly budget
* Remaining budget
* Upcoming recurring payments
* Recent expenses
* Quick “+ Add Expense” button

Example visual structure:

August 18, 2026

Milk........................Rs. 80
Vegetables................Rs. 250
Bus fare....................Rs. 30
----------------------------------

Today's Total.............Rs. 360

Make the entries visually resemble handwritten notes rather than database rows.

### Add Expense

Create a very fast expense form.

Fields:

* Expense name
* Amount
* Category
* Date
* Payment method
* Optional note
* Optional receipt/photo
* Optional recurring payment

Categories should include:

* Groceries
* Food
* Transport
* Shopping
* Personal
* Medicine
* Education
* Entertainment
* Household
* Other

Payment methods:

* Cash
* Bank
* Card
* Digital Wallet
* Other

The user should be able to add an expense in a few seconds.

### Expense Types

Support multiple expense types:

* Daily purchase
* Bill
* Subscription
* Recurring payment
* Other

### Bills

Create a dedicated Bills page for:

* Electricity
* Water
* Internet
* Mobile/Phone
* Gas
* Rent
* Other utilities

Support both fixed and variable bills.

For example:
Electricity → Variable amount → Due every month on the 15th.

When a variable bill becomes due, allow the user to enter the actual amount.

### Recurring Payments

Create a recurring-payment management page.

Each recurring payment should support:

* Name
* Amount
* Fixed or variable amount
* Category
* Frequency
* Due date/day
* Start date
* Optional end date
* Active/inactive status
* Reminder
* Automatically generate expense when due

Examples:

* Internet — Rs. 1,200/month
* Netflix — Rs. 549/month
* Electricity — variable/month
* Water — variable/month
* Rent — Rs. 15,000/month

Show upcoming payments clearly on the notebook dashboard.

### Calendar

Create a monthly calendar showing expense activity.

Each date should display the total amount spent that day.

Clicking a date should open that day's notebook page containing all expenses.

### Monthly Summary

Create a notebook-style monthly page showing:

* Total spending
* Total bills
* Total subscriptions
* Daily expenses
* Remaining budget
* Average daily spending
* Highest spending day
* Highest spending category

Allow navigation between months.

### Insights

Add useful but simple analytics:

* Spending by category
* Monthly spending comparison
* Daily spending trend
* Bills vs daily expenses
* Budget progress

Charts should still follow the notebook aesthetic and should not dominate the interface.

### Budget

Allow users to create:

* Monthly budget
* Optional category budgets

Show:
Budget: Rs. 30,000
Spent: Rs. 18,450
Remaining: Rs. 11,550

Warn the user when spending approaches or exceeds the budget.

### Notes

Add a simple notebook Notes section where users can write personal financial notes, reminders, shopping lists, or anything else.

### Database

Use **Supabase** (PostgreSQL) with the Supabase JS client.

Create suitable tables in Supabase:

* users
* expenses
* categories
* recurring_payments
* budgets
* notes

Expenses should support relationships with users, categories, and recurring payments.

Use proper indexes and timestamps (created_at, updated_at).

### Technical Requirements

* Next.js App Router
* TypeScript
* Tailwind CSS
* Supabase (client-side JS SDK + Row Level Security)
* Server Actions or appropriate Next.js server-side APIs
* Responsive design
* Proper loading states
* Empty states
* Error handling
* Form validation
* Accessible components
* Dark mode should be supported while preserving the notebook aesthetic
* Use reusable components
* Keep the code clean and scalable
* Do not put everything into one large component
* Use environment variables for database configuration
* Do not hardcode user data

### Important UX Requirement

The application must feel like a **real personal expense diary**.

Avoid generic SaaS dashboards, excessive cards, neon colors, glassmorphism, gradients, or overly futuristic UI.

The notebook/paper experience should be the main visual identity.

Build the project as a production-quality application with a polished responsive UI and realistic sample data for development.
