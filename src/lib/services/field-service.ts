import type { SupabaseClient } from "@supabase/supabase-js";

export interface FieldDef {
  id: string;
  label: string;
  field_type: "text" | "textarea" | "number" | "boolean" | "select";
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

export interface FieldRequirement {
  label: string;
  field_type: "text" | "textarea" | "number" | "boolean" | "select";
  options: string[] | null;
  is_required: boolean;
  network_id: string;
}

export async function getFieldDefinitions(
  supabase: SupabaseClient,
  theaterId: string
): Promise<FieldDef[]> {
  if (!theaterId) return [];
  const { data } = await supabase
    .from("field_definitions")
    .select("id, label, field_type, options, is_required, sort_order")
    .eq("theater_id", theaterId)
    .order("sort_order");
  return (data ?? []) as FieldDef[];
}

/** Gibt alle Feldanforderungen zurück die Netzwerke für dieses Theater definiert haben. */
export async function getFieldRequirements(
  supabase: SupabaseClient,
  theaterId: string
): Promise<FieldRequirement[]> {
  if (!theaterId) return [];
  const { data: memberships } = await supabase
    .from("theater_network_members")
    .select("network_id")
    .eq("theater_id", theaterId);

  const networkIds = (memberships ?? []).map((m) => m.network_id);
  if (networkIds.length === 0) return [];

  const { data } = await supabase
    .from("field_requirements")
    .select("label, field_type, options, is_required, network_id")
    .in("network_id", networkIds);

  return (data ?? []) as FieldRequirement[];
}
