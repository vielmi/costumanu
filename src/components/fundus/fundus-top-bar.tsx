"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COCKPIT } from "@/lib/constants/layout";
import styles from "@/components/cockpit/cockpit.module.css";

interface FundusTopBarProps {
  theaterId: string;
}

type SearchResult = {
  id: string;
  name: string;
  costume_provenance: { production_title: string; year: number | null }[];
  costume_media: { storage_path: string; sort_order: number }[];
};

function FundusSearch({ theaterId }: { theaterId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      const { data } = await supabase
        .from("costumes")
        .select("id, name, costume_provenance(production_title, year), costume_media(storage_path, sort_order)")
        .eq("theater_id", theaterId)
        .ilike("name", `%${query}%`)
        .limit(8);
      setResults((data ?? []) as SearchResult[]);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, theaterId, supabase]);

  function clearSearch() { setQuery(""); setResults([]); setIsOpen(false); }
  function navigateTo(id: string) { router.push(`/costume/${id}`); clearSearch(); }

  return (
    <div ref={containerRef} style={{ flex: 1, maxWidth: COCKPIT.SEARCH_MAX_WIDTH, position: "relative" }}>
      <div style={{
        height: 52, borderRadius: 47,
        background: "var(--secondary-500)", border: "1px solid var(--neutral-black)",
        display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
      }}>
        <Image src="/icons/icon-search.svg" alt="" width={20} height={20} style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Kostüme suchen"
          style={{
            flex: 1, border: "none", background: "transparent",
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
            fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-700)",
            letterSpacing: "0.002em", outline: "none",
          }}
        />
        {query && (
          <button type="button" onClick={clearSearch}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: 0.5 }}
          >
            <Image src="/icons/icon-close-medium.svg" alt="Suche löschen" width={16} height={16} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className={styles.searchDropdown}>
          {results.length === 0 ? (
            <p className={styles.searchEmpty}>Keine Kostüme gefunden</p>
          ) : results.map((costume) => {
            const prov = costume.costume_provenance?.[0];
            const subtitle = prov
              ? [prov.production_title, prov.year ? String(prov.year) : null].filter(Boolean).join(" | ")
              : null;
            const sorted = [...(costume.costume_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
            const imageUrl = sorted[0]
              ? supabase.storage.from("costume-images").getPublicUrl(sorted[0].storage_path).data.publicUrl
              : null;
            return (
              <button key={costume.id} type="button" onClick={() => navigateTo(costume.id)} className={styles.searchResultBtn}>
                <div className={styles.searchResultThumb}>
                  {imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={imageUrl} alt="" className={styles.searchResultImg} />
                    : <Image src="/icons/icon-shirt.svg" alt="" width={20} height={20} style={{ opacity: 0.4 }} />
                  }
                </div>
                <div className={styles.searchResultText}>
                  <span className={styles.searchResultName}>{costume.name}</span>
                  {subtitle && <span className={styles.searchResultSub}>{subtitle}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ERFASSEN_ITEMS = [
  { label: "Etikett scannen", href: "/kostueme/scan", icon: "icon-barcode-scan" },
  { label: "Kostüm erfassen", href: "/kostueme/neu",  icon: "icon-shirt"        },
] as const;

function ErfassenDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{
          height: "var(--button-height-md)", padding: "0 30px", borderRadius: "16px",
          background: "var(--primary-900)", color: "var(--neutral-white)",
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-350)",
          fontWeight: "var(--font-weight-500)", whiteSpace: "nowrap",
          border: "none", cursor: "pointer",
        }}
      >
        Kostüm erfassen
        <Image src="/icons/icon-arrow-dropdown-down.svg" alt="" width={16} height={16}
          style={{ filter: "invert(1)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
        />
      </button>

      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--neutral-white)", border: "1px solid var(--neutral-grey-300)",
          borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-300)",
          minWidth: 220, zIndex: 100, overflow: "hidden",
        }}>
          {ERFASSEN_ITEMS.map((item, i) => (
            <button key={item.href} onClick={() => { setIsOpen(false); router.push(item.href); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px",
                borderTop: i > 0 ? "1px solid var(--neutral-grey-200)" : "none",
                fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
                fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)",
                background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left",
              }}
            >
              <Image src={`/icons/${item.icon}.svg`} alt="" width={18} height={18} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FundusTopBar({ theaterId }: FundusTopBarProps) {
  return (
    <div className={styles.desktopTopBar}>
      <FundusSearch theaterId={theaterId} />
      <ErfassenDropdown />
    </div>
  );
}
