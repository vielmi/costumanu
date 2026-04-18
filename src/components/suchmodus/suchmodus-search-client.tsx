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

      const { data, error } = await supabase
        .from("costumes")
        .select("id, name, costume_provenance(production_title, year), costume_media(storage_path, sort_order)")
        .textSearch("fts_doc", debouncedQuery, { type: "websearch" })
        .limit(8);

      if (error) {
        console.error("[SuchmodusSearch] query error:", error);
        return [];
      }

      return (data ?? []) as Suggestion[];
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
              <svg width="9" height="9" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M32 1.82856L30.1715 0L16 14.1714L1.82856 0L0 1.82856L14.1714 16L0 30.1715L1.82856 32L16 17.8286L30.1715 32L32 30.1715L17.8286 16L32 1.82856Z" fill="#242727"/>
              </svg>
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
