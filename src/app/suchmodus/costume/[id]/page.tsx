import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuchmodusCostumeDetailClient } from "@/components/suchmodus/suchmodus-costume-detail-client";
import type { TaxonomyTerm } from "@/lib/types/costume";

type Params = Promise<{ id: string }>;

export default async function SuchmodusCostumeDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: costume, error } = await supabase
    .from("costumes")
    .select(`
      id, name, description, gender_term_id, clothing_type_id,
      parent_costume_id, is_ensemble, created_at, theater_id,
      gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
      clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
      costume_media(id, costume_id, storage_path, sort_order, created_at),
      costume_provenance(id, costume_id, production_title, year, actor_name, role_name, director_name, costume_designer, costume_assistant, is_original_production),
      costume_items(id, costume_id, theater_id, barcode_id, rfid_id, size_label, size_data, size_notes, condition_grade, current_status, storage_location_path, is_public_for_rent, updated_at),
      costume_taxonomy(term_id, taxonomy_term:taxonomy_terms(id, vocabulary, label_de, parent_id, sort_order)),
      theater:theaters(id, name, slug, address_info)
    `)
    .eq("id", id)
    .single();

  if (error || !costume) notFound();

  // Similar costumes
  let similarCostumes: { id: string; name: string; imageUrl: string | null; clothingTypeLabel: string | null; provenance: string | null; status: string | null; theaterName: string | null }[] = [];
  if (costume.clothing_type_id) {
    const { data: simRows } = await supabase
      .from("costumes")
      .select(`
        id, name,
        clothing_type:taxonomy_terms!clothing_type_id(id, label_de),
        costume_media(storage_path, sort_order),
        costume_provenance(production_title, year),
        costume_items(current_status),
        theater:theaters!theater_id(name)
      `)
      .eq("clothing_type_id", costume.clothing_type_id)
      .neq("id", id)
      .limit(6);

    similarCostumes = (simRows ?? []).map((r) => {
      const media = [...(r.costume_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      const imageUrl = media[0]
        ? supabase.storage.from("costume-images").getPublicUrl(media[0].storage_path).data.publicUrl
        : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ct = (r as any).clothing_type;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prov = (r as any).costume_provenance?.[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = (r as any).costume_items?.[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const theater = (r as any).theater;
      const theaterName = Array.isArray(theater) ? theater[0]?.name : theater?.name;
      return {
        id: r.id,
        name: r.name,
        imageUrl,
        clothingTypeLabel: ct?.label_de ?? null,
        provenance: prov ? [prov.production_title, prov.year].filter(Boolean).join(", ") : null,
        status: item?.current_status ?? null,
        theaterName: theaterName ?? null,
      };
    });
  }

  // Ensemble children
  let ensembleChildren: { id: string; name: string }[] = [];
  if (costume.is_ensemble) {
    const { data } = await supabase
      .from("costumes")
      .select("id, name")
      .eq("parent_costume_id", id)
      .order("created_at");
    ensembleChildren = (data ?? []) as { id: string; name: string }[];
  }

  // Build image URLs server-side
  const mediaWithUrls = [...(costume.costume_media ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      id: m.id,
      url: supabase.storage.from("costume-images").getPublicUrl(m.storage_path).data.publicUrl,
    }));

  // Taxonomy by vocabulary
  const taxonomyByVocabulary: Record<string, TaxonomyTerm[]> = {};
  for (const ct of (costume.costume_taxonomy as unknown as { term_id: string; taxonomy_term: TaxonomyTerm | TaxonomyTerm[] }[]) ?? []) {
    const term = Array.isArray(ct.taxonomy_term) ? ct.taxonomy_term[0] : ct.taxonomy_term;
    if (!term) continue;
    taxonomyByVocabulary[term.vocabulary] ??= [];
    taxonomyByVocabulary[term.vocabulary].push(term);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const costumeAny = costume as any;
  const genderTerm = Array.isArray(costumeAny.gender_term) ? costumeAny.gender_term[0] : costumeAny.gender_term;
  const clothingType = Array.isArray(costumeAny.clothing_type) ? costumeAny.clothing_type[0] : costumeAny.clothing_type;
  const theater = Array.isArray(costumeAny.theater) ? costumeAny.theater[0] : costumeAny.theater;
  const firstItem = costume.costume_items?.[0] ?? null;
  const firstProvenance = costume.costume_provenance?.[0] ?? null;

  return (
    <SuchmodusCostumeDetailClient
      id={costume.id}
      name={costume.name}
      description={costume.description ?? null}
      isEnsemble={costume.is_ensemble ?? false}
      mediaWithUrls={mediaWithUrls}
      genderTerm={genderTerm ?? null}
      clothingType={clothingType ?? null}
      theater={theater ?? null}
      firstItem={firstItem}
      firstProvenance={firstProvenance}
      allProvenance={costume.costume_provenance ?? []}
      taxonomyByVocabulary={taxonomyByVocabulary}
      ensembleChildren={ensembleChildren}
      similarCostumes={similarCostumes}
    />
  );
}
