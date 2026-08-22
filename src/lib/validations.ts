import { z } from "zod";

const PAYMENT_METHODS = ["Cash", "Bank", "Card", "Digital Wallet", "Other"] as const;
const EXPENSE_TYPES = [
  "Daily purchase",
  "Bill",
  "Subscription",
  "Recurring payment",
  "Other",
] as const;
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] as const;

export const expenseSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be 200 characters or less")
      .trim(),
    amount: z
      .number()
      .positive("Amount must be positive")
      .max(999999.99, "Amount must be 999,999.99 or less"),
    category: z.string().min(1, "Category is required").max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    payment_method: z.enum(PAYMENT_METHODS),
    note: z.string().max(1000).optional().nullable(),
    receipt_url: z.string().url().optional().nullable(),
    expense_type: z.enum(EXPENSE_TYPES),
    recurring_payment_id: z.string().uuid().optional().nullable(),
  })
  .strict();

export const expenseUpdateSchema = expenseSchema.partial().strict();

export const recurringPaymentSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be 200 characters or less")
      .trim(),
    amount: z.number().max(999999.99).optional().nullable(),
    is_variable: z.boolean(),
    category: z.string().min(1).max(100),
    frequency: z.enum(FREQUENCIES),
    due_day: z.number().int().min(1).max(31),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional()
      .nullable(),
    is_active: z.boolean(),
    reminder_days: z.number().int().min(0).max(365),
    last_paid: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional()
      .nullable(),
    auto_pay: z.boolean().optional(),
    payment_method: z.enum(PAYMENT_METHODS).optional(),
  })
  .strict();

export const recurringPaymentUpdateSchema = recurringPaymentSchema.partial().strict();

export const budgetSchema = z
  .object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    amount: z
      .number()
      .positive("Amount must be positive")
      .max(999999.99, "Amount must be 999,999.99 or less"),
    category: z.string().max(100).optional().nullable(),
  })
  .strict();

export const noteSchema = z
  .object({
    title: z.string().max(200).optional().default(""),
    content: z.string().max(10000).optional().default(""),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color hex")
      .optional()
      .default("#FEF9C3"),
    pinned: z.boolean().optional().default(false),
    expense_id: z.string().uuid("Invalid expense link").nullable().optional(),
  })
  .strict();

export const noteUpdateSchema = noteSchema.partial().strict();

export const categorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .trim(),
    icon: z.string().max(10).optional().default("📝"),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color hex")
      .optional()
      .default("#6B7280"),
  })
  .strict();

export const incomeSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be 200 characters or less")
      .trim(),
    amount: z
      .number()
      .positive("Amount must be positive")
      .max(999999.99, "Amount must be 999,999.99 or less"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    source: z.string().min(1, "Source is required").max(100),
    category: z.string().min(1, "Category is required").max(100),
    note: z.string().max(1000).optional().nullable(),
  })
  .strict();

export const incomeUpdateSchema = incomeSchema.partial().strict();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character"
  );

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(", ");
    throw new Error(message);
  }
  return result.data;
}
