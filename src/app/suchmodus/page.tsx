import { createClient } from "@/lib/supabase/server";
import { SuchmodusCockpit, type NetworkTheater, type GenderTerm } from "@/components/suchmodus/suchmodus-cockpit";

export default async function SuchmodusPage() {
  const supabase = await createClient();

  const [
    { data: networkData },
    { data: allData },
    { data: genderData },
    { data: clothingData },
    { data: epochData },
    { data: sparteData },
  ] = await Promise.all([
    supabase.from("theaters").select("id, name, slug, settings").eq("settings->>show_in_network", "true").order("name"),
    supabase.from("theaters").select("id, name, slug, settings").order("name"),
    supabase.from("taxonomy_terms").select("id, label_de").eq("vocabulary", "gender").order("sort_order"),
    supabase.from("taxonomy_terms").select("id, label_de").eq("vocabulary", "clothing_type").is("parent_id", null).order("sort_order"),
    supabase.from("taxonomy_terms").select("id, label_de").eq("vocabulary", "epoche").order("sort_order"),
    supabase.from("taxonomy_terms").select("id, label_de").eq("vocabulary", "sparte").order("sort_order"),
  ]);

  return (
    <SuchmodusCockpit
      networkTheaters={(networkData ?? []) as NetworkTheater[]}
      theaters={(allData ?? []) as NetworkTheater[]}
      genderTerms={(genderData ?? []) as GenderTerm[]}
      clothingTypeTerms={(clothingData ?? []) as GenderTerm[]}
      epocheTerms={(epochData ?? []) as GenderTerm[]}
      sparteTerms={(sparteData ?? []) as GenderTerm[]}
    />
  );
}
