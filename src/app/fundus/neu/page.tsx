import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CostumeForm } from "@/components/fundus/costume-form";

export default async function FundusNeuPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check theater membership — redirect to /fundus to bootstrap if needed
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/fundus");
  }

  const theaterId = membership.theater_id;

  // Prefetch all taxonomy vocabularies in parallel
  const [genders, clothingTypes, materials, colors, epochs] = await Promise.all([
    supabase
      .from("taxonomy_terms")
      .select("id, vocabulary, label_de, parent_id, sort_order")
      .eq("vocabulary", "gender")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, vocabulary, label_de, parent_id, sort_order")
      .eq("vocabulary", "clothing_type")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, vocabulary, label_de, parent_id, sort_order")
      .eq("vocabulary", "material")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, vocabulary, label_de, parent_id, sort_order")
      .eq("vocabulary", "color")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("id, vocabulary, label_de, parent_id, sort_order")
      .eq("vocabulary", "epoche")
      .order("sort_order"),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)" }}>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <CostumeForm
          theaterId={theaterId}
          initialTaxonomy={{
            genders: genders.data ?? [],
            clothingTypes: clothingTypes.data ?? [],
            materials: materials.data ?? [],
            colors: colors.data ?? [],
            epochs: epochs.data ?? [],
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
