import type { SupabaseClient } from "@supabase/supabase-js";

export interface TheaterLocation {
  id: string;
  theater_id: string;
  name: string;
  street: string | null;
  zip: string | null;
  city: string | null;
  sort_order: number;
}

export async function getTheaterLocations(
  supabase: SupabaseClient,
  theaterId: string
): Promise<TheaterLocation[]> {
  const { data, error } = await supabase
    .from("theater_locations")
    .select("id, theater_id, name, street, zip, city, sort_order")
    .eq("theater_id", theaterId)
    .order("sort_order");

  if (error) return [];
  return (data ?? []) as TheaterLocation[];
}
