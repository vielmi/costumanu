import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ResultsClient, type CostumeResult } from "@/components/results/results-client";
import type { TaxonomyTerm } from "@/lib/types/costume";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  gender?: string;
  clothing_type?: string;
  epoche?: string;
  sparte?: string;
  theater?: string;
  q?: string;
}>;

export default async function ErgebnissePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Resolve filter labels for display
  const filterTermIds = [
    params.gender,
    params.clothing_type,
    params.epoche,
    params.sparte,
  ].filter(Boolean) as string[];

  let filterTerms: TaxonomyTerm[] = [];
  if (filterTermIds.length > 0) {
    const { data } = await supabase
      .from("taxonomy_terms")
      .select("id, vocabulary, label_de, parent_id, sort_order")
      .in("id", filterTermIds);
    filterTerms = (data ?? []) as TaxonomyTerm[];
  }

  // Resolve theater name if filtering by theater
  let theaterName: string | null = null;
  if (params.theater) {
    const { data } = await supabase
      .from("theaters")
      .select("name")
      .eq("id", params.theater)
      .single();
    theaterName = data?.name ?? null;
  }

  // Build costume query
  let query = supabase
    .from("costumes")
    .select(
      `
      id, name, description, gender_term_id, clothing_type_id,
      is_ensemble, theater_id, created_at,
      gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
      clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
      costume_media(id, storage_path, sort_order),
      costume_provenance(production_title, year),
      costume_taxonomy(term_id),
      theater:theaters!theater_id(id, name, slug)
    `,
      { count: "exact" }
    )
    .is("parent_costume_id", null) // exclude ensemble children
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  // Apply filters
  if (params.gender) {
    query = query.eq("gender_term_id", params.gender);
  }
  if (params.clothing_type) {
    query = query.eq("clothing_type_id", params.clothing_type);
  }
  if (params.theater) {
    query = query.eq("theater_id", params.theater);
  }
  if (params.q) {
    query = query.textSearch("fts_doc", params.q, { type: "websearch" });
  }

  const { data: costumes, count, error } = await query;

  if (error) {
    console.error("[Ergebnisse] Query failed:", error);
  }

  // For epoche/sparte filters, we need to post-filter via costume_taxonomy
  // since these are many-to-many relations
  let filteredCostumes = (costumes ?? []) as unknown as CostumeResult[];
  if (params.epoche || params.sparte) {
    const requiredTermIds = [params.epoche, params.sparte].filter(Boolean) as string[];
    filteredCostumes = filteredCostumes.filter((c) => {
      const costumeTermIds = ((c.costume_taxonomy as { term_id: string }[]) ?? []).map(
        (ct) => ct.term_id
      );
      return requiredTermIds.every((id) => costumeTermIds.includes(id));
    });
  }

  // Build page title from active filters
  const filterLabels = filterTerms.map((t) => t.label_de);
  if (theaterName) filterLabels.push(theaterName);
  const pageTitle =
    filterLabels.length > 0 ? filterLabels.join(" · ") : "Alle Kostüme";

  // Build active filters for chips
  const activeFilters: { id: string; label: string; paramKey: string }[] = [];
  for (const term of filterTerms) {
    const paramKey =
      term.vocabulary === "gender"
        ? "gender"
        : term.vocabulary === "clothing_type"
          ? "clothing_type"
          : term.vocabulary === "epoche"
            ? "epoche"
            : "sparte";
    activeFilters.push({ id: term.id, label: term.label_de, paramKey });
  }
  if (theaterName && params.theater) {
    activeFilters.push({
      id: params.theater,
      label: theaterName,
      paramKey: "theater",
    });
  }
  if (params.q) {
    activeFilters.push({
      id: "q",
      label: `"${params.q}"`,
      paramKey: "q",
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <ResultsClient
          initialCostumes={filteredCostumes}
          totalCount={count ?? filteredCostumes.length}
          pageTitle={pageTitle}
          activeFilters={activeFilters}
          searchParams={params}
          pageSize={PAGE_SIZE}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
