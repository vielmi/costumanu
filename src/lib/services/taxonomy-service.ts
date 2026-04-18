/**
 * taxonomy-service.ts
 *
 * Alle Datenbankzugriffe auf taxonomy_terms.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaxonomyTerm } from "@/lib/types/costume";

export async function getTaxonomyTerms(
  supabase: SupabaseClient,
  vocabulary?: string
): Promise<TaxonomyTerm[]> {
  let query = supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de, parent_id, sort_order")
    .order("vocabulary")
    .order("sort_order");

  if (vocabulary) {
    query = query.eq("vocabulary", vocabulary);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TaxonomyTerm[];
}

export async function getTaxonomyTermsByVocabulary(
  supabase: SupabaseClient,
  vocabularies: string[]
): Promise<Record<string, TaxonomyTerm[]>> {
  const { data, error } = await supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de, parent_id, sort_order")
    .in("vocabulary", vocabularies)
    .order("sort_order");

  if (error) throw error;

  const result: Record<string, TaxonomyTerm[]> = {};
  for (const term of data ?? []) {
    if (!result[term.vocabulary]) result[term.vocabulary] = [];
    result[term.vocabulary].push(term as TaxonomyTerm);
  }
  return result;
}

export async function createTaxonomyTerm(
  supabase: SupabaseClient,
  term: Omit<TaxonomyTerm, "id">
): Promise<TaxonomyTerm> {
  const { data, error } = await supabase
    .from("taxonomy_terms")
    .insert(term)
    .select()
    .single();

  if (error) throw error;
  return data as TaxonomyTerm;
}

export async function updateTaxonomyTerm(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<TaxonomyTerm, "id">>
): Promise<void> {
  const { error } = await supabase
    .from("taxonomy_terms")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteTaxonomyTerm(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("taxonomy_terms")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
