"use server";

import { createClient } from "@/lib/supabase/server";
import type { RecurringPayment } from "@/types";
import {
  recurringPaymentSchema,
  recurringPaymentUpdateSchema,
  validateOrThrow,
} from "@/lib/validations";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function fetchRecurringPayments(): Promise<RecurringPayment[]> {
  const { supabase, user } = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("recurring_payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as RecurringPayment[];
}

export async function addRecurringPayment(
  rawData: Omit<RecurringPayment, "id" | "user_id" | "created_at" | "updated_at">
): Promise<RecurringPayment> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(recurringPaymentSchema, rawData);

  const { data: inserted, error } = await supabase
    .from("recurring_payments")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return inserted as RecurringPayment;
}

export async function updateRecurringPayment(
  id: string,
  rawData: Partial<Omit<RecurringPayment, "id" | "user_id" | "created_at">>
): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(recurringPaymentUpdateSchema, rawData);

  const { error } = await supabase
    .from("recurring_payments")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteRecurringPayment(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("recurring_payments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
