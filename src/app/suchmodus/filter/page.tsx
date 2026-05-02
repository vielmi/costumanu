import { createClient } from "@/lib/supabase/server";
import { SuchmodusFilterClient } from "@/components/suchmodus/suchmodus-filter-client";

export default async function SuchmodusFilterPage() {
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de, sort_order")
    .in("vocabulary", ["gender", "clothing_type", "segment", "epoche", "material", "farbe", "muster"])
    .order("sort_order");

  const byVocab = (vocab: string) =>
    (terms ?? []).filter((t) => t.vocabulary === vocab);

  return (
    <SuchmodusFilterClient
      genderTerms={byVocab("gender")}
      clothingTypes={byVocab("clothing_type")}
      segmentTerms={byVocab("segment")}
      epocheTerms={byVocab("epoche")}
      materialTerms={byVocab("material")}
      farbeTerms={byVocab("farbe")}
      musterTerms={byVocab("muster")}
    />
  );
}
