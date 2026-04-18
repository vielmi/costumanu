/**
 * profile-service.ts
 *
 * Datenbankzugriffe auf die profiles-Tabelle.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string | null;
  platform_role: string | null;
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, platform_role")
    .eq("id", userId)
    .single();

  return data ?? null;
}

export async function getProfiles(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Profile[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, platform_role")
    .in("id", userIds);

  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Ermittelt userRole und theaterId für einen eingeloggten User. */
export async function resolveUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<{ userRole: string; theaterId: string | null }> {
  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase.from("theater_members").select("theater_id, role").eq("user_id", userId).limit(1).single(),
    supabase.from("profiles").select("platform_role").eq("id", userId).single(),
  ]);

  const isPlatformAdmin = profile?.platform_role === "platform_admin";
  const userRole = isPlatformAdmin ? "platform_admin" : (membership?.role ?? "member");
  const theaterId = membership?.theater_id ?? null;

  return { userRole, theaterId };
}
