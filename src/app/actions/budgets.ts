"use server";

import { createClient } from "@/lib/supabase/server";
import type { Budget } from "@/types";
import { budgetSchema, validateOrThrow } from "@/lib/validations";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function fetchBudgets(): Promise<Budget[]> {
  const { supabase, user } = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;
  return (data || []) as Budget[];
}

export async function upsertBudget(
  year: number,
  month: number,
  amount: number,
  category?: string
): Promise<Budget> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  validateOrThrow(budgetSchema, { year, month, amount, category: category ?? null });

  const catValue = category || null;

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .is("category", catValue)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from("budgets")
      .update({ amount })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return updated as Budget;
  } else {
    const { data: inserted, error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        amount,
        category: catValue,
        month,
        year,
      })
      .select()
      .single();

    if (error) throw error;
    return inserted as Budget;
  }
}

export async function deleteBudget(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
