"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import { SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaxonomyTerm } from "@/lib/types/costume";

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
  currentFilters: Record<string, string | undefined>;
  onApply: (filters: Record<string, string>) => void;
};

export function FilterPanel({
  open,
  onClose,
  currentFilters,
  onApply,
}: FilterPanelProps) {
  // Local draft state derived from currentFilters when panel opens
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    stripUndefined(currentFilters)
  );

  // Sync draft when sheet opens with new currentFilters
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setDraft(stripUndefined(currentFilters));
      } else {
        onClose();
      }
    },
    [currentFilters, onClose]
  );

  const supabase = createClient();

  // ── Taxonomy queries ─────────────────────────────────────────────

  const { data: clothingTypes } = useQuery({
    queryKey: ["taxonomy", "clothing_type", "top"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "clothing_type")
        .is("parent_id", null)
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const selectedClothingTypeId = draft.clothing_type;

  const { data: clothingSubTypes } = useQuery({
    queryKey: ["taxonomy", "clothing_type", "sub", selectedClothingTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "clothing_type")
        .eq("parent_id", selectedClothingTypeId!)
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open && !!selectedClothingTypeId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sparteTerms } = useQuery({
    queryKey: ["taxonomy", "sparte"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "sparte")
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: epocheTerms } = useQuery({
    queryKey: ["taxonomy", "epoche"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "epoche")
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // ── Draft helpers ────────────────────────────────────────────────

  function toggleDraftValue(key: string, value: string) {
    setDraft((prev) => {
      const next = { ...prev };
      if (next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }

      // When the parent clothing_type changes, clear the sub-type
      if (key === "clothing_type") {
        delete next["clothing_sub_type"];
      }

      return next;
    });
  }

  function toggleSeriesOnly(checked: boolean) {
    setDraft((prev) => {
      const next = { ...prev };
      if (checked) {
        next.is_ensemble = "true";
      } else {
        delete next.is_ensemble;
      }
      return next;
    });
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft({});
  }

  const activeCount = useMemo(() => Object.keys(draft).length, [draft]);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col rounded-t-2xl"
        showCloseButton
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            {t("filter.title")}
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("filter.title")}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable filter sections */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <Accordion type="multiple" defaultValue={["clothing_type"]}>
            {/* ── Bekleidungsart ──────────────────────────────── */}
            <AccordionItem value="clothing_type">
              <AccordionTrigger>{t("filter.clothingType")}</AccordionTrigger>
              <AccordionContent>
                <TermGrid
                  terms={clothingTypes ?? []}
                  selectedId={draft.clothing_type}
                  onToggle={(id) => toggleDraftValue("clothing_type", id)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ── Bekleidungstyp (sub-type, shown conditionally) ─ */}
            {selectedClothingTypeId && (clothingSubTypes ?? []).length > 0 && (
              <AccordionItem value="clothing_sub_type">
                <AccordionTrigger>
                  {t("filter.clothingSubType")}
                </AccordionTrigger>
                <AccordionContent>
                  <TermGrid
                    terms={clothingSubTypes ?? []}
                    selectedId={draft.clothing_sub_type}
                    onToggle={(id) =>
                      toggleDraftValue("clothing_sub_type", id)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* ── Sparte ─────────────────────────────────────── */}
            <AccordionItem value="sparte">
              <AccordionTrigger>{t("filter.division")}</AccordionTrigger>
              <AccordionContent>
                <TermGrid
                  terms={sparteTerms ?? []}
                  selectedId={draft.sparte}
                  onToggle={(id) => toggleDraftValue("sparte", id)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ── Epoche ─────────────────────────────────────── */}
            <AccordionItem value="epoche">
              <AccordionTrigger>{t("filter.epoch")}</AccordionTrigger>
              <AccordionContent>
                <TermGrid
                  terms={epocheTerms ?? []}
                  selectedId={draft.epoche}
                  onToggle={(id) => toggleDraftValue("epoche", id)}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* ── Nur Serien anzeigen ──────────────────────────── */}
          <div className="flex items-center justify-between border-t py-4">
            <label
              htmlFor="series-toggle"
              className="text-sm font-medium leading-none"
            >
              {t("filter.onlySeriesToggle")}
            </label>
            <Switch
              id="series-toggle"
              checked={draft.is_ensemble === "true"}
              onCheckedChange={toggleSeriesOnly}
            />
          </div>
        </div>

        {/* ── Bottom action bar ─────────────────────────────── */}
        <SheetFooter className="flex-row gap-3 border-t pt-4">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
            {t("filter.resetFilter")}
          </Button>
          <Button className="flex-1 gap-2" onClick={handleApply}>
            <Check className="h-4 w-4" />
            {t("filter.applyFilter")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Shared term grid ────────────────────────────────────────────────

function TermGrid({
  terms,
  selectedId,
  onToggle,
}: {
  terms: TaxonomyTerm[];
  selectedId: string | undefined;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((term) => {
        const isActive = selectedId === term.id;
        return (
          <button
            key={term.id}
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onToggle(term.id)}
          >
            {isActive && <Check className="h-3 w-3" />}
            {term.label_de}
          </button>
        );
      })}
    </div>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────

function stripUndefined(
  obj: Record<string, string | undefined>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
