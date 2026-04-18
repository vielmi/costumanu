/**
 * costume-service.ts
 *
 * Alle Datenbankzugriffe rund um Kostüme, Kostümteile, Medien, Provenienz und Taxonomie.
 * Jede Funktion nimmt einen SupabaseClient als ersten Parameter — für AWS-Migration
 * einfach die Implementierung austauschen, ohne die Aufruforte anzufassen.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Costume, TaxonomyTerm } from "@/lib/types/costume";

// ─── Internal types ──────────────────────────────────────────────────────────

interface RecentCostumeMedia {
  storage_path: string;
  sort_order: number;
}

interface RecentCostumeItem {
  current_status: string;
}

interface RecentCostumeProvenance {
  production_title: string;
  year: number | null;
}

interface RecentCostumeRow {
  id: string;
  name: string;
  created_at: string;
  gender_term: TaxonomyTerm | TaxonomyTerm[] | null;
  clothing_type: TaxonomyTerm | TaxonomyTerm[] | null;
  costume_media: RecentCostumeMedia[];
  costume_items: RecentCostumeItem[];
  costume_provenance: RecentCostumeProvenance[];
}

export interface RecentCostume {
  id: string;
  name: string;
  created_at: string;
  gender_term: TaxonomyTerm | null;
  clothing_type: TaxonomyTerm | null;
  costume_media: RecentCostumeMedia[];
  costume_items: RecentCostumeItem[];
  costume_provenance: RecentCostumeProvenance[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Supabase gibt joins manchmal als Array zurück, auch wenn es nur ein Element ist.
 * Diese Funktion normalisiert das auf einen einzelnen Wert oder null.
 */
function extractFirst<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Zuletzt erstellte Kostüme eines Theaters (für Cockpit-Liste). */
export async function getRecentCostumes(
  supabase: SupabaseClient,
  theaterId: string,
  limit = 5
): Promise<RecentCostume[]> {
  const { data, error } = await supabase
    .from("costumes")
    .select(`
      id, name, created_at,
      gender_term:taxonomy_terms!gender_term_id(id, label_de),
      clothing_type:taxonomy_terms!clothing_type_id(id, label_de),
      costume_media(storage_path, sort_order),
      costume_items(current_status),
      costume_provenance(production_title, year)
    `)
    .eq("theater_id", theaterId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as RecentCostumeRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    created_at: c.created_at,
    gender_term: extractFirst(c.gender_term),
    clothing_type: extractFirst(c.clothing_type),
    costume_media: c.costume_media ?? [],
    costume_items: c.costume_items ?? [],
    costume_provenance: c.costume_provenance ?? [],
  }));
}

/** Vollständiges Kostüm mit allen Relationen (für Detailseite und Bearbeitung). */
export async function getCostume(supabase: SupabaseClient, id: string): Promise<Costume | null> {
  const { data, error } = await supabase
    .from("costumes")
    .select(`
      *,
      gender_term:taxonomy_terms!gender_term_id(*),
      clothing_type:taxonomy_terms!clothing_type_id(*),
      theater:theaters(id, name, slug),
      costume_media(*),
      costume_items(*),
      costume_provenance(*),
      costume_taxonomy(term_id, taxonomy_term:taxonomy_terms(*))
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Costume;
}

/** Ähnliche Kostüme (gleicher clothing_type). */
export async function getSimilarCostumes(
  supabase: SupabaseClient,
  clothingTypeId: string,
  excludeId: string,
  limit = 4
): Promise<Costume[]> {
  const { data } = await supabase
    .from("costumes")
    .select(`
      id, name,
      clothing_type:taxonomy_terms!clothing_type_id(id, label_de),
      costume_media(storage_path, sort_order)
    `)
    .eq("clothing_type_id", clothingTypeId)
    .neq("id", excludeId)
    .limit(limit);

  return (data ?? []) as Costume[];
}

/** Ensemble-Kinder eines Kostüms. */
export async function getEnsembleChildren(
  supabase: SupabaseClient,
  parentId: string
): Promise<Costume[]> {
  const { data } = await supabase
    .from("costumes")
    .select("id, name, costume_media(storage_path, sort_order)")
    .eq("parent_costume_id", parentId);

  return (data ?? []) as Costume[];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Löscht ein Kostüm vollständig inkl. aller abhängigen Datensätze und Storage-Dateien. */
export async function deleteCostume(
  supabase: SupabaseClient,
  id: string,
  mediaPaths: string[]
): Promise<void> {
  if (mediaPaths.length > 0) {
    await supabase.storage.from("costume-images").remove(mediaPaths);
  }
  await supabase.from("costume_taxonomy").delete().eq("costume_id", id);
  await supabase.from("costume_provenance").delete().eq("costume_id", id);
  await supabase.from("costume_items").delete().eq("costume_id", id);
  await supabase.from("costume_media").delete().eq("costume_id", id);
  await supabase.from("costumes").delete().eq("id", id);
}

/** Dupliziert ein Kostüm inkl. Items, Taxonomie, Provenienz und Media-Referenzen. */
export async function duplicateCostume(
  supabase: SupabaseClient,
  sourceId: string
): Promise<string> {
  const { data: orig, error } = await supabase
    .from("costumes")
    .select("theater_id, name, description, gender_term_id, clothing_type_id, is_ensemble, ensemble_parent_id, is_public, direct_visible")
    .eq("id", sourceId)
    .single();

  if (error || !orig) throw new Error("Kostüm nicht gefunden");

  const { data: newC, error: insertError } = await supabase
    .from("costumes")
    .insert({ ...orig, name: `${orig.name}_Kopie` })
    .select("id")
    .single();

  if (insertError || !newC) throw new Error("Duplizieren fehlgeschlagen");

  const newId = newC.id as string;

  const [items, taxonomy, provenance, media] = await Promise.all([
    supabase.from("costume_items").select("size_label, barcode_id, rfid_id, current_status, storage_location_path, condition, notes").eq("costume_id", sourceId),
    supabase.from("costume_taxonomy").select("term_id").eq("costume_id", sourceId),
    supabase.from("costume_provenance").select("production_title, year, role_name, actor_name, sort_order").eq("costume_id", sourceId),
    supabase.from("costume_media").select("storage_path, sort_order, mime_type").eq("costume_id", sourceId),
  ]);

  await Promise.all([
    items.data?.length     ? supabase.from("costume_items").insert(items.data.map((i) => ({ ...i, costume_id: newId }))) : Promise.resolve(),
    taxonomy.data?.length  ? supabase.from("costume_taxonomy").insert(taxonomy.data.map((t) => ({ costume_id: newId, term_id: t.term_id }))) : Promise.resolve(),
    provenance.data?.length ? supabase.from("costume_provenance").insert(provenance.data.map((p) => ({ ...p, costume_id: newId }))) : Promise.resolve(),
    media.data?.length     ? supabase.from("costume_media").insert(media.data.map((m) => ({ ...m, costume_id: newId }))) : Promise.resolve(),
  ]);

  return newId;
}
