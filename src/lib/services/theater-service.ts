/**
 * theater-service.ts
 *
 * Datenbankzugriffe auf theaters und theater_members.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Theater {
  id: string;
  name: string;
  slug: string;
}

export interface TheaterMembership {
  theater_id: string;
  role: string;
}

export async function getUserMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<TheaterMembership | null> {
  const { data } = await supabase
    .from("theater_members")
    .select("theater_id, role")
    .eq("user_id", userId)
    .limit(1)
    .single();

  return data ?? null;
}

export async function getAllTheaters(supabase: SupabaseClient): Promise<Theater[]> {
  const { data, error } = await supabase
    .from("theaters")
    .select("id, name, slug")
    .order("name");

  if (error) throw error;
  return (data ?? []) as Theater[];
}

export async function getTheaterMembers(
  supabase: SupabaseClient,
  theaterId: string
) {
  const { data, error } = await supabase
    .from("theater_members")
    .select("user_id, role")
    .eq("theater_id", theaterId);

  if (error) throw error;
  return data ?? [];
}
