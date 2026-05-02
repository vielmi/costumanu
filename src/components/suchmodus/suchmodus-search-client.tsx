"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./suchmodus-search.module.css";

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

export function SuchmodusSearchClient({ initialQuery }: { initialQuery: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query.trim(), 300);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const supabase = createClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["suchmodus-search", debouncedQuery],
    queryFn: async (): Promise<Suggestion[]> => {
      if (!debouncedQuery) return [];

      const FIELDS = "id, name, costume_provenance(production_title, year), costume_media(storage_path, sort_order)";

      // 1) FTS on name + description
      // 2) Taxonomy term match (colors, materials, epochs, etc.)
      const [ftsResult, termResult] = await Promise.all([
        supabase
          .from("costumes")
          .select(FIELDS)
          .textSearch("fts_doc", debouncedQuery, { type: "websearch" })
          .limit(8),
        supabase
          .from("taxonomy_terms")
          .select("id")
          .ilike("label_de", `%${debouncedQuery}%`),
      ]);

      if (ftsResult.error) console.error("[SuchmodusSearch] fts error:", ftsResult.error);

      const ftsData = (ftsResult.data ?? []) as Suggestion[];

      // Fetch costumes matching the taxonomy terms
      let taxonomyData: Suggestion[] = [];
      const termIds = (termResult.data ?? []).map((t) => t.id);
      if (termIds.length > 0) {
        const { data: ctRows } = await supabase
          .from("costume_taxonomy")
          .select("costume_id")
          .in("term_id", termIds)
          .limit(20);

        const costumeIds = [...new Set((ctRows ?? []).map((r) => r.costume_id))];
        if (costumeIds.length > 0) {
          const { data } = await supabase
            .from("costumes")
            .select(FIELDS)
            .in("id", costumeIds)
            .limit(8);
          taxonomyData = (data ?? []) as Suggestion[];
        }
      }

      // Merge and deduplicate (FTS results first)
      const seen = new Set<string>();
      return [...ftsData, ...taxonomyData].filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      }).slice(0, 8);
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  const showSuggestions = debouncedQuery.length > 0;

  return (
    <div className={styles.page}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.inputWrap}>
          <Image src="/icons/icon-search.svg" alt="" width={20} height={20} className={styles.inputIcon} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Suche"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query.length > 0 && (
            <button type="button" onClick={handleClear} className={styles.clearBtn} aria-label="Eingabe löschen">
              <Image src="/icons/icon-close-small.svg" alt="" width={9} height={9} />
            </button>
          )}
        </div>

        <Link href="/suchmodus" className={styles.cancelLink}>
          Abbrechen
        </Link>
      </div>

      {/* ─── Suggestions ─── */}
      {showSuggestions && (
        <div className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>Suchvorschläge</p>

          {isLoading ? (
            <p className={styles.emptyText}>Suche…</p>
          ) : suggestions && suggestions.length > 0 ? (
            <ul className={styles.list}>
              {suggestions.map((s) => {
                const prov = s.costume_provenance?.[0];
                const subtitle = prov
                  ? [prov.production_title, prov.year ? String(prov.year) : null].filter(Boolean).join(" | ")
                  : null;

                const sortedMedia = [...(s.costume_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
                const imageUrl = sortedMedia[0]
                  ? supabase.storage.from("costume-images").getPublicUrl(sortedMedia[0].storage_path).data.publicUrl
                  : null;

                return (
                  <li key={s.id}>
                    <Link href={`/suchmodus/costume/${s.id}`} className={styles.listItem}>
                      <div className={styles.listItemThumb}>
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt="" className={styles.listItemImg} />
                        ) : (
                          <div className={styles.listItemImgPlaceholder} />
                        )}
                      </div>
                      <div className={styles.listItemText}>
                        <span className={styles.listItemName}>{s.name}</span>
                        {subtitle && <span className={styles.listItemSub}>{subtitle}</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyText}>Keine Kostüme gefunden</p>
          )}
        </div>
      )}

      {/* ─── Empty state hint ─── */}
      {!showSuggestions && (
        <div className={styles.hint}>
          <p className={styles.hintText}>Kostüm-, Produktions- oder Rollentitel eingeben</p>
        </div>
      )}
    </div>
  );
}
