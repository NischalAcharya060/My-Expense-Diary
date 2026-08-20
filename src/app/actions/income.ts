"use server";

import { createClient } from "@/lib/supabase/server";
import type { Income } from "@/types";
import { incomeSchema, incomeUpdateSchema, validateOrThrow } from "@/lib/validations";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function fetchIncome(): Promise<Income[]> {
  const { supabase, user } = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("income")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as Income[];
}

export async function addIncome(
  rawData: Omit<Income, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Income> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(incomeSchema, rawData);

  const { data: inserted, error } = await supabase
    .from("income")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return inserted as Income;
}

export async function updateIncome(
  id: string,
  rawData: Partial<Omit<Income, "id" | "user_id" | "created_at">>
): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(incomeUpdateSchema, rawData);

  const { error } = await supabase
    .from("income")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteIncome(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("income")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
