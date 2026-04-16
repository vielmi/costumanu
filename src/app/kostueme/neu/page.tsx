import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KostuemeNeuClient } from "@/components/kostueme/kostueme-neu-client";
import type { Costume } from "@/lib/types/costume";

export default async function KostuemeNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; edit?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const costumeType = params.type ?? "single";
  const editId = params.edit ?? null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase.from("theater_members").select("theater_id, role, theaters(name)").eq("user_id", user.id).limit(1).single(),
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
  ]);

  if (!membership) redirect("/");
  if ((membership as unknown as { role: string }).role === "viewer") redirect("/suchmodus");

  const theaterId = membership.theater_id;
  const theaterName = (membership.theaters as unknown as { name: string })?.name ?? "";

  const vocabs = ["gender", "clothing_type", "clothing_subtype", "material", "muster", "color", "sparte", "temperature", "washing_type", "drying", "ironing"];
  const results = await Promise.all(
    vocabs.map((v) =>
      supabase.from("taxonomy_terms").select("id, label_de").eq("vocabulary", v).order("sort_order")
    )
  );
  const [genders, clothingTypes, clothingSubtypes, materials, musters, colors, sparten, temperatures, washingTypes, dryings, ironings] = results;

  const currentUserName = (profile as unknown as { display_name: string } | null)?.display_name ?? "Unbekannt";

  // Fetch costume for edit mode
  let editCostume: Costume | null = null;
  if (editId) {
    const { data } = await supabase
      .from("costumes")
      .select(`
        id, name, description, gender_term_id, clothing_type_id,
        parent_costume_id, is_ensemble, created_at, theater_id,
        gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
        clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
        costume_media(id, costume_id, storage_path, sort_order, created_at),
        costume_provenance(id, costume_id, production_title, year, actor_name, role_name, director_name, costume_designer, costume_assistant, is_original_production),
        costume_items(id, costume_id, theater_id, barcode_id, rfid_id, size_label, size_data, condition_grade, current_status, storage_location_path, is_public_for_rent, updated_at),
        costume_taxonomy(term_id, taxonomy_term:taxonomy_terms(id, vocabulary, label_de, parent_id, sort_order))
      `)
      .eq("id", editId)
      .single();
    editCostume = data as unknown as Costume | null;
  }

  return (
    <KostuemeNeuClient
      theaterId={theaterId}
      theaterName={theaterName}
      currentUserId={user.id}
      currentUserName={currentUserName}
      costumeType={costumeType as "single" | "ensemble" | "serie"}
      editCostume={editCostume ?? undefined}
      taxonomy={{
        genders: genders.data ?? [],
        clothingTypes: clothingTypes.data ?? [],
        clothingSubtypes: clothingSubtypes.data ?? [],
        materials: materials.data ?? [],
        musters: musters.data ?? [],
        colors: colors.data ?? [],
        sparten: sparten.data ?? [],
        temperatures: temperatures.data ?? [],
        washingTypes: washingTypes.data ?? [],
        dryings: dryings.data ?? [],
        ironings: ironings.data ?? [],
      }}
    />
  );
}
