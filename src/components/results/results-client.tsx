"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CostumeCard } from "@/components/results/costume-card";
import { FilterPanel } from "@/components/results/filter-panel";
import { t } from "@/lib/i18n";

export type CostumeResult = {
  id: string;
  name: string;
  theater_id: string;
  costume_media?: { id: string; storage_path: string; sort_order: number }[];
  costume_provenance?: { production_title: string; year: number | null }[];
  costume_taxonomy?: { term_id: string }[];
  gender_term?: { id: string; label_de: string } | null;
  clothing_type?: { id: string; label_de: string } | null;
  theater?: { id: string; name: string; slug: string } | null;
  [key: string]: unknown;
};

type ActiveFilter = {
  id: string;
  label: string;
  paramKey: string;
};

type ResultsClientProps = {
  initialCostumes: CostumeResult[];
  totalCount: number;
  pageTitle: string;
  activeFilters: ActiveFilter[];
  searchParams: Record<string, string | undefined>;
  pageSize: number;
};

export function ResultsClient({
  initialCostumes,
  totalCount,
  pageTitle,
  activeFilters,
  searchParams,
  pageSize,
}: ResultsClientProps) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [costumes, setCostumes] = useState(initialCostumes);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const hasMore = costumes.length < totalCount;

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const offset = costumes.length;

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
      `
      )
      .is("parent_costume_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (searchParams.gender) query = query.eq("gender_term_id", searchParams.gender);
    if (searchParams.clothing_type) query = query.eq("clothing_type_id", searchParams.clothing_type);
    if (searchParams.theater) query = query.eq("theater_id", searchParams.theater);
    if (searchParams.q) query = query.textSearch("fts_doc", searchParams.q, { type: "websearch" });

    const { data } = await query;
    let newCostumes = (data ?? []) as unknown as CostumeResult[];

    // Post-filter for epoche/sparte
    if (searchParams.epoche || searchParams.sparte) {
      const requiredTermIds = [searchParams.epoche, searchParams.sparte].filter(Boolean) as string[];
      newCostumes = newCostumes.filter((c) => {
        const ids = (c.costume_taxonomy ?? []).map((ct) => ct.term_id);
        return requiredTermIds.every((id) => ids.includes(id));
      });
    }

    setCostumes((prev) => [...prev, ...newCostumes]);
    setLoading(false);
  }

  function removeFilter(paramKey: string) {
    const params = new URLSearchParams(currentParams.toString());
    params.delete(paramKey);
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount === 1 ? t("results.costumeCount", { count: totalCount.toLocaleString("de-CH") }) : t("results.costumesCount", { count: totalCount.toLocaleString("de-CH") })}
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {t("results.costumeFilter")}
        </Button>
      </div>

      {/* Filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
              onClick={() => removeFilter(filter.paramKey)}
            >
              {filter.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Results grid */}
      {costumes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg font-medium">{t("results.noCostumesFound")}</p>
          <p className="text-sm text-muted-foreground">
            {t("results.tryDifferentFilters")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {costumes.map((costume) => (
              <CostumeCard key={costume.id} costume={costume} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? t("common.loading") : t("common.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Filter panel */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        currentFilters={searchParams as Record<string, string | undefined>}
        onApply={(filters) => {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(filters)) {
            if (value) params.set(key, value);
          }
          router.push(`/results?${params.toString()}`);
          setFilterOpen(false);
        }}
      />
    </div>
  );
}
