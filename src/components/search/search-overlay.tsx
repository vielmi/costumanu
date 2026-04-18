"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type Suggestion = {
  id: string;
  name: string;
  costume_provenance: { production_title: string; year: number | null }[];
  costume_media: { storage_path: string; sort_order: number }[];
};

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface SearchOverlayProps {
  initialQuery: string;
  cancelHref?: string;
  costumeRoutePrefix?: string;
  inputClassName?: string;
}

export function SearchOverlay({
  initialQuery,
  cancelHref = "/",
  costumeRoutePrefix = "/costume",
  inputClassName,
}: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query.trim(), 300);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const supabase = createClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: async (): Promise<Suggestion[]> => {
      if (!debouncedQuery) return [];

      const { data, error } = await supabase
        .from("costumes")
        .select(
          `
          id, name,
          costume_provenance(production_title, year),
          costume_media(storage_path, sort_order)
        `
        )
        .textSearch("fts_doc", debouncedQuery, { type: "websearch" })
        .limit(8);

      if (error) {
        console.error("[SearchOverlay] Suggestion query failed:", error);
        return [];
      }

      return (data ?? []) as Suggestion[];
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        router.push(`${costumeRoutePrefix}?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [query, router, costumeRoutePrefix]
  );

  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  const showSuggestions = debouncedQuery.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Search input row */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSubmit} className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            {t("search.placeholder")}
          </label>
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="search-input"
            name="q"
            type="search"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputClassName ?? "h-12 rounded-full pl-12 pr-10 text-base"}
            autoComplete="off"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href={cancelHref}>{t("common.cancel")}</Link>
        </Button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("search.suggestions")}
          </h2>

          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : suggestions && suggestions.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {suggestions.map((suggestion) => {
                const provenance = suggestion.costume_provenance?.[0];
                const subtitle = provenance
                  ? [
                      provenance.production_title,
                      provenance.year ? String(provenance.year) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : null;

                const sortedMedia = [...(suggestion.costume_media ?? [])].sort(
                  (a, b) => a.sort_order - b.sort_order
                );
                const imageUrl = sortedMedia[0]
                  ? supabase.storage
                      .from("costume-images")
                      .getPublicUrl(sortedMedia[0].storage_path).data.publicUrl
                  : null;

                return (
                  <li key={suggestion.id}>
                    <Link
                      href={`${costumeRoutePrefix}/${suggestion.id}`}
                      className="flex items-center gap-3 px-2 py-3 transition-colors hover:bg-muted/50"
                    >
                      {/* Thumbnail */}
                      <div className="h-[75px] w-[75px] shrink-0 overflow-hidden rounded-[4px] bg-muted">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-bold leading-snug">
                          {suggestion.name}
                        </span>
                        {subtitle && (
                          <span className="text-sm text-muted-foreground">
                            {subtitle}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("search.noSuggestions")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
