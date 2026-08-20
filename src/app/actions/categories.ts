"use server";

import { createClient } from "@/lib/supabase/server";
import type { CategoryItem } from "@/types";
import { categorySchema, validateOrThrow } from "@/lib/validations";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const { supabase, user } = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name");

  if (error) throw error;
  return (data || []) as CategoryItem[];
}

export async function addCategory(
  name: string,
  icon: string,
  color: string
): Promise<CategoryItem> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const data = validateOrThrow(categorySchema, { name, icon, color });

  const { data: inserted, error } = await supabase
    .from("categories")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return inserted as CategoryItem;
}

export async function deleteCategory(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
