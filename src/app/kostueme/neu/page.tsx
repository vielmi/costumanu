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
  const costumeType = params.type ?? "single"; // "single" | "ensemble" | "serie"

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/");
  }

  const theaterId = membership.theater_id;

  const [genders, clothingTypes, materials, colors, epochs, sparten] = await Promise.all([
    supabase
      .from("taxonomy_terms")
      .select("id, label_de")
      .eq("vocabulary", "gender")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, label_de")
      .eq("vocabulary", "clothing_type")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, label_de")
      .eq("vocabulary", "material")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, label_de")
      .eq("vocabulary", "color")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, label_de")
      .eq("vocabulary", "epoche")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, label_de")
      .eq("vocabulary", "sparte")
      .order("sort_order"),
  ]);

  return (
    <KostuemeNeuClient
      theaterId={theaterId}
      costumeType={costumeType as "single" | "ensemble" | "serie"}
      taxonomy={{
        genders: genders.data ?? [],
        clothingTypes: clothingTypes.data ?? [],
        materials: materials.data ?? [],
        colors: colors.data ?? [],
        epochs: epochs.data ?? [],
        sparten: sparten.data ?? [],
      }}
    />
  );
}
