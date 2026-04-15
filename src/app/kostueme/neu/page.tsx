import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KostuemeNeuClient } from "@/components/kostueme/kostueme-neu-client";

export default async function KostuemeNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const costumeType = params.type ?? "single";

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

  return (
    <KostuemeNeuClient
      theaterId={theaterId}
      theaterName={theaterName}
      currentUserId={user.id}
      currentUserName={currentUserName}
      costumeType={costumeType as "single" | "ensemble" | "serie"}
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
