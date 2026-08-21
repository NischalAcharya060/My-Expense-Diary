"use server";

import { createClient } from "@/lib/supabase/server";
import type { Expense } from "@/types";
import {
  expenseSchema,
  expenseUpdateSchema,
  validateOrThrow,
} from "@/lib/validations";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export interface FetchExpensesOptions {
  limit?: number;
  offset?: number;
}

export async function fetchExpenses(
  options: FetchExpensesOptions = {}
): Promise<Expense[]> {
  const { supabase, user } = await getUser();
  if (!user) return [];

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.limit != null) {
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Expense[];
}

export async function addExpense(
  rawData: Omit<Expense, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Expense> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(expenseSchema, rawData);

  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return inserted as Expense;
}

export async function updateExpense(
  id: string,
  rawData: Partial<Omit<Expense, "id" | "user_id" | "created_at">>
): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(expenseUpdateSchema, rawData);

  const { error } = await supabase
    .from("expenses")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
