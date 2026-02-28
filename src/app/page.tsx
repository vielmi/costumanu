import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchBar } from "@/components/homepage/search-bar";
import { HeroText } from "@/components/homepage/hero-text";
import { GenderGrid } from "@/components/homepage/gender-grid";
import { ClothingTypeSection } from "@/components/homepage/clothing-type-section";
import { EventBanner } from "@/components/homepage/event-banner";
import { HorizontalCardRow } from "@/components/homepage/horizontal-card-row";
import { NetworkSection } from "@/components/homepage/network-section";
import type { TaxonomyTerm } from "@/lib/types/costume";

// Fixed UUID from seed file (20260222_seed_taxonomy_terms.sql)
const UNIFORMEN_PARENT_ID = "a0000000-0000-0000-0000-000000000008";

export default async function Home() {
  const supabase = await createClient();

  const [
    gendersResult,
    clothingTypesResult,
    clothingSubTypesResult,
    epochsResult,
    spartenResult,
    uniformSubTypesResult,
    eventsResult,
    theatersResult,
  ] = await Promise.all([
    supabase
      .from("taxonomy_terms")
      .select("*")
      .eq("vocabulary", "gender")
      .order("sort_order"),
    // Show 4 top-level types to fill the 2×2 grid in ClothingTypeSection
    supabase
      .from("taxonomy_terms")
      .select("*")
      .eq("vocabulary", "clothing_type")
      .is("parent_id", null)
      .order("sort_order")
      .limit(4),
    supabase
      .from("taxonomy_terms")
      .select("*")
      .eq("vocabulary", "clothing_type")
      .not("parent_id", "is", null)
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("*")
      .eq("vocabulary", "epoche")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("*")
      .eq("vocabulary", "sparte")
      .order("sort_order"),
    supabase
      .from("taxonomy_terms")
      .select("*")
      .eq("vocabulary", "clothing_type")
      .eq("parent_id", UNIFORMEN_PARENT_ID)
      .order("sort_order"),
    supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false })
      .limit(1),
    supabase
      .from("theaters")
      .select("id, name, slug")
      .limit(12),
  ]);

  // Log query errors server-side for observability
  for (const [label, result] of Object.entries({
    genders: gendersResult,
    clothingTypes: clothingTypesResult,
    clothingSubTypes: clothingSubTypesResult,
    epochs: epochsResult,
    sparten: spartenResult,
    uniformSubTypes: uniformSubTypesResult,
    events: eventsResult,
    theaters: theatersResult,
  })) {
    if (result.error) {
      console.error(`[Homepage] ${label} query failed:`, result.error);
    }
  }

  const genders = gendersResult.data ?? [];
  const clothingTypes = clothingTypesResult.data ?? [];
  const epochs = epochsResult.data ?? [];
  const sparten = spartenResult.data ?? [];
  const uniformSubTypes = uniformSubTypesResult.data ?? [];
  const theaters = theatersResult.data ?? [];
  const featuredEvent = eventsResult.data?.[0] ?? null;

  // Group sub-types by parent for clothing type section
  const subTypesByParent: Record<string, TaxonomyTerm[]> = {};
  for (const sub of clothingSubTypesResult.data ?? []) {
    if (!sub.parent_id) continue;
    subTypesByParent[sub.parent_id] ??= [];
    subTypesByParent[sub.parent_id].push(sub);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main id="main-content">
        <SearchBar />
        <HeroText />
        <GenderGrid genders={genders} />
        <ClothingTypeSection
          clothingTypes={clothingTypes}
          subTypesByParent={subTypesByParent}
        />
        {featuredEvent && <EventBanner event={featuredEvent} />}

        <HorizontalCardRow
          title="Epochen"
          items={epochs.map((e) => ({
            id: e.id,
            label: e.label_de,
            href: `/ergebnisse?epoche=${e.id}`,
          }))}
        />

        <HorizontalCardRow
          title="Sparte"
          items={sparten.map((s) => ({
            id: s.id,
            label: s.label_de,
            href: `/ergebnisse?sparte=${s.id}`,
          }))}
        />

        {uniformSubTypes.length > 0 && (
          <HorizontalCardRow
            title="Arbeitsuniformen"
            items={uniformSubTypes.map((u) => ({
              id: u.id,
              label: u.label_de,
              href: `/ergebnisse?clothing_type=${u.id}`,
            }))}
          />
        )}

        <NetworkSection theaters={theaters} />
      </main>

      <SiteFooter />
    </div>
  );
}
