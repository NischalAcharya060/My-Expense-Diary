"use server";

import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/types";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function fetchNotes(): Promise<Note[]> {
  const { supabase, user } = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as Note[];
}

export async function addNote(
  data: Omit<Note, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Note> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: inserted, error } = await supabase
    .from("notes")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return inserted as Note;
}

export async function updateNote(
  id: string,
  data: Partial<Omit<Note, "id" | "user_id" | "created_at">>
): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notes")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
