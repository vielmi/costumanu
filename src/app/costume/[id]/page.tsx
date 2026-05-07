import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { FundusTopBar } from "@/components/fundus/fundus-top-bar";
import { CostumeDetailClient } from "@/components/costume/costume-detail-client";
import type { Costume, TaxonomyTerm } from "@/lib/types/costume";

type Params = Promise<{ id: string }>;

export default async function CostumeDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the costume with all relations
  const { data: costume, error } = await supabase
    .from("costumes")
    .select(
      `
      id, name, description, gender_term_id, clothing_type_id,
      parent_costume_id, is_ensemble, created_at, theater_id,
      gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
      clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
      costume_media(id, costume_id, storage_path, sort_order, created_at),
      costume_provenance(id, costume_id, production_title, year, actor_name, role_name, director_name, costume_designer, costume_assistant, is_original_production),
      costume_items(id, costume_id, theater_id, barcode_id, rfid_id, size_label, size_data, size_notes, condition_grade, current_status, storage_location_path, is_public_for_rent, updated_at),
      costume_taxonomy(term_id, taxonomy_term:taxonomy_terms(id, vocabulary, label_de, parent_id, sort_order)),
      theater:theaters!theater_id(id, name, slug, address_info)
    `
    )
    .eq("id", id)
    .single();

  if (error || !costume) {
    notFound();
  }

  // Fetch ensemble children if this is an ensemble
  let ensembleChildren: Costume[] = [];
  if (costume.is_ensemble) {
    const { data } = await supabase
      .from("costumes")
      .select(
        `
        id, name, description, gender_term_id, clothing_type_id,
        parent_costume_id, is_ensemble, created_at, theater_id,
        costume_media(id, costume_id, storage_path, sort_order, created_at)
      `
      )
      .eq("parent_costume_id", id)
      .order("created_at");
    ensembleChildren = (data ?? []) as unknown as Costume[];
  }

  // Fetch similar costumes (same clothing type, different costume)
  let similarCostumes: Costume[] = [];
  if (costume.clothing_type_id) {
    const { data } = await supabase
      .from("costumes")
      .select(
        `
        id, name, theater_id,
        costume_media(id, storage_path, sort_order),
        costume_provenance(production_title, year)
      `
      )
      .eq("clothing_type_id", costume.clothing_type_id)
      .neq("id", id)
      .limit(10);
    similarCostumes = (data ?? []) as unknown as Costume[];
  }

  // Group taxonomy terms by vocabulary
  // Supabase returns nested joins as arrays; extract the first element
  const taxonomyByVocabulary: Record<string, TaxonomyTerm[]> = {};
  for (const ct of (costume.costume_taxonomy as unknown as { term_id: string; taxonomy_term: TaxonomyTerm | TaxonomyTerm[] }[]) ?? []) {
    const term = Array.isArray(ct.taxonomy_term) ? ct.taxonomy_term[0] : ct.taxonomy_term;
    if (!term) continue;
    const vocab = term.vocabulary;
    taxonomyByVocabulary[vocab] ??= [];
    taxonomyByVocabulary[vocab].push(term);
  }

  return (
    <AppShell topBar={<FundusTopBar theaterId={costume.theater_id} />}>
      <CostumeDetailClient
        costume={costume as unknown as Costume}
        taxonomyByVocabulary={taxonomyByVocabulary}
        ensembleChildren={ensembleChildren}
        similarCostumes={similarCostumes}
      />
    </AppShell>
  );
}
