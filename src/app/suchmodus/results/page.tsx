import { createClient } from "@/lib/supabase/server";
import { SuchmodusResultsClient, type ResultCostume } from "@/components/suchmodus/suchmodus-results-client";

type SearchParams = Promise<{
  gender?: string;
  genders?: string;
  clothing_type?: string;
  theater?: string;
  segment?: string;
  material?: string;
  farbe?: string;
  muster?: string;
  size_int?: string;
  size_eu?: string;
  epoche?: string;
  title?: string;
  actor?: string;
  role?: string;
  director?: string;
  designer?: string;
  assistant?: string;
}>;

export default async function SuchmodusResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Resolve single gender (from drawer) or first of multi (from filter)
  const genderId = params.gender ?? (params.genders ? params.genders.split(",")[0] : undefined);
  const clothingTypeId = params.clothing_type ? params.clothing_type.split(",")[0] : undefined;

  // ── Resolve title labels ──────────────────────────────────────────────────
  const termIds = [genderId, clothingTypeId].filter(Boolean) as string[];
  const { data: termRows } = termIds.length > 0
    ? await supabase.from("taxonomy_terms").select("id, label_de").in("id", termIds)
    : { data: [] };

  const termMap = Object.fromEntries((termRows ?? []).map((t) => [t.id, t.label_de]));

  const genderLabel  = genderId       ? (termMap[genderId]       ?? "") : "";
  const clothingLabel = clothingTypeId ? (termMap[clothingTypeId] ?? "") : "";

  const title = clothingLabel
    ? `${clothingLabel} ${genderLabel}`.trim()
    : genderLabel || "Kostüme";

  // ── Build costume query ───────────────────────────────────────────────────
  let query = supabase
    .from("costumes")
    .select(`
      id, name,
      clothing_type:taxonomy_terms!clothing_type_id(id, label_de),
      costume_media(storage_path, sort_order),
      costume_provenance(production_title, year, actor_name, role_name, director_name, costume_designer, costume_assistant),
      costume_items(current_status, size_label),
      theater:theaters(name)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  // Gender filter (single from drawer, or multi from filter page)
  const genderIds = params.genders
    ? params.genders.split(",").filter(Boolean)
    : genderId ? [genderId] : [];
  if (genderIds.length === 1) {
    query = query.eq("gender_term_id", genderIds[0]);
  } else if (genderIds.length > 1) {
    query = query.in("gender_term_id", genderIds);
  }

  // Clothing type
  const clothingTypeIds = params.clothing_type?.split(",").filter(Boolean) ?? [];
  if (clothingTypeIds.length === 1) {
    query = query.eq("clothing_type_id", clothingTypeIds[0]);
  } else if (clothingTypeIds.length > 1) {
    query = query.in("clothing_type_id", clothingTypeIds);
  }

  // Theater
  if (params.theater) {
    const theaterIds = params.theater.split(",").filter(Boolean);
    if (theaterIds.length > 0) query = query.in("theater_id", theaterIds);
  }

  const { data: rows, error: queryError } = await query;
  if (queryError) console.error("[suchmodus/results] costume query error:", queryError);

  // ── Post-filter: free-text fields (provenance, size) ─────────────────────
  // These can't be done in the main query without joins — filter in JS
  let filtered = rows ?? [];

  if (params.title) {
    const q = params.title.toLowerCase();
    filtered = filtered.filter((r) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r.costume_provenance as any[])?.some((p: any) => p.production_title?.toLowerCase().includes(q))
    );
  }
  if (params.actor) {
    const q = params.actor.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_provenance as any[])?.some((p: any) => p.actor_name?.toLowerCase().includes(q)));
  }
  if (params.role) {
    const q = params.role.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_provenance as any[])?.some((p: any) => p.role_name?.toLowerCase().includes(q)));
  }
  if (params.director) {
    const q = params.director.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_provenance as any[])?.some((p: any) => p.director_name?.toLowerCase().includes(q)));
  }
  if (params.designer) {
    const q = params.designer.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_provenance as any[])?.some((p: any) => p.costume_designer?.toLowerCase().includes(q)));
  }
  if (params.assistant) {
    const q = params.assistant.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_provenance as any[])?.some((p: any) => p.costume_assistant?.toLowerCase().includes(q)));
  }
  if (params.size_int) {
    const sizes = params.size_int.split(",").map((s) => s.toLowerCase());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_items as any[])?.some((i: any) => sizes.includes(i.size_label?.toLowerCase() ?? "")));
  }
  if (params.size_eu) {
    const sizes = params.size_eu.split(",").map((s) => s.toLowerCase());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r) => (r.costume_items as any[])?.some((i: any) => sizes.includes(i.size_label?.toLowerCase() ?? "")));
  }

  // ── Build public image URLs ───────────────────────────────────────────────
  const costumes: ResultCostume[] = filtered.map((row) => {
    const media = [...(row.costume_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const imageUrl = media[0]
      ? supabase.storage.from("costume-images").getPublicUrl(media[0].storage_path).data.publicUrl
      : null;

    const firstProvenance = row.costume_provenance?.[0];
    const provenance = firstProvenance
      ? [firstProvenance.production_title, firstProvenance.year].filter(Boolean).join(" · ")
      : null;

    const firstItem = row.costume_items?.[0];
    const isAvailable = firstItem?.current_status === "available";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const theater = (row as any).theater;
    const theaterName = theater?.name ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clothingTypeRow = (row as any).clothing_type;
    const clothingTypeLabel = clothingTypeRow?.label_de ?? null;

    return {
      id: row.id,
      name: row.name,
      clothingTypeLabel,
      imageUrl,
      provenance,
      theaterName,
      isAvailable,
    };
  });

  return (
    <SuchmodusResultsClient
      title={title}
      count={costumes.length}
      costumes={costumes}
    />
  );
}
