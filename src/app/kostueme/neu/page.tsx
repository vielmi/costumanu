import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCostume } from "@/lib/services/costume-service";
import { KostuemeNeuClient } from "@/components/kostueme/kostueme-neu-client";
import type { Costume } from "@/lib/types/costume";

const VALID_COSTUME_TYPES = ["single", "ensemble", "serie"] as const;
type CostumeType = (typeof VALID_COSTUME_TYPES)[number];

function parseCostumeType(value: string | undefined): CostumeType {
  if (VALID_COSTUME_TYPES.includes(value as CostumeType)) return value as CostumeType;
  return "single";
}

export default async function KostuemeNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; edit?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const costumeType = parseCostumeType(params.type);
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
      supabase.from("taxonomy_terms").select("id, label_de, parent_id").eq("vocabulary", v).order("sort_order")
    )
  );
  const [genders, clothingTypes, clothingSubtypes, materials, musters, colors, sparten, temperatures, washingTypes, dryings, ironings] = results;

  const currentUserName = (profile as unknown as { display_name: string } | null)?.display_name ?? "Unbekannt";

  const editCostume: Costume | null = editId ? await getCostume(supabase, editId) : null;

  return (
    <KostuemeNeuClient
      theaterId={theaterId}
      theaterName={theaterName}
      currentUserId={user.id}
      currentUserName={currentUserName}
      costumeType={costumeType}
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
