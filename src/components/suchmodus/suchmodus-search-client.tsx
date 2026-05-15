"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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

function stemGerman(q: string): string {
  const lower = q.toLowerCase();
  for (const suffix of ["es", "en", "em", "er", "e"]) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 1) {
      return lower.slice(0, -suffix.length);
    }
  }
  return lower;
}

export function SuchmodusSearchClient({ initialQuery }: { initialQuery: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query.trim(), 300);

  // ─── Voice state ───────────────────────────────────────────────────────────
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing">("idle");
  const [isVoiceQuery, setIsVoiceQuery] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTranscriptRef = useRef("");
  const [searchError, setSearchError] = useState<string | null>(null);

  const parseAndSearch = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setVoiceState("processing");
      setSearchError(null);
      try {
        const res = await fetch("/api/parse-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const json = await res.json();
        if (!res.ok) {
          setSearchError("Sprachsuche nicht verfügbar. Bitte ANTHROPIC_API_KEY konfigurieren.");
          setVoiceState("idle");
          return;
        }
        router.push(`/suchmodus/results${json.params ? `?${json.params}` : ""}`);
      } catch {
        setSearchError("Verbindungsfehler — bitte nochmals versuchen.");
        setVoiceState("idle");
      }
    },
    [router]
  );

  function startListening() {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SR) {
      alert("Spracherkennung wird von diesem Browser nicht unterstützt.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "de-DE";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    lastTranscriptRef.current = "";
    recognition.onstart = () => {
      setVoiceState("listening");
      setIsVoiceQuery(true);
      setSearchError(null);
      setQuery("");
    };
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      lastTranscriptRef.current = transcript;
      setQuery(transcript);
    };
    recognition.onend = () => {
      setVoiceState("idle");
      if (!lastTranscriptRef.current.trim()) {
        setIsVoiceQuery(false);
      }
    };
    recognition.onerror = () => {
      setVoiceState("idle");
      setIsVoiceQuery(false);
    };
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const supabase = createClient();

  // Normal keyword suggestions (only shown for non-voice queries)
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["suchmodus-search", debouncedQuery],
    queryFn: async (): Promise<Suggestion[]> => {
      if (!debouncedQuery) return [];

      const FIELDS =
        "id, name, costume_provenance(production_title, year), costume_media(storage_path, sort_order)";

      const stemmed = stemGerman(debouncedQuery);
      const ilikeFilter =
        stemmed !== debouncedQuery.toLowerCase()
          ? `label_de.ilike.%${debouncedQuery}%,label_de.ilike.%${stemmed}%`
          : `label_de.ilike.%${debouncedQuery}%`;

      const [ftsResult, termResult] = await Promise.all([
        supabase
          .from("costumes")
          .select(FIELDS)
          .textSearch("fts_doc", debouncedQuery, { type: "websearch" })
          .limit(8),
        supabase.from("taxonomy_terms").select("id").or(ilikeFilter),
      ]);

      if (ftsResult.error) console.error("[SuchmodusSearch] fts error:", ftsResult.error);

      const ftsData = (ftsResult.data ?? []) as Suggestion[];

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

      const seen = new Set<string>();
      return [...ftsData, ...taxonomyData]
        .filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        })
        .slice(0, 8);
    },
    enabled: debouncedQuery.length > 0 && !isVoiceQuery,
    staleTime: 30 * 1000,
  });

  function handleClear() {
    setQuery("");
    setIsVoiceQuery(false);
    inputRef.current?.focus();
  }

  function handleChange(v: string) {
    setQuery(v);
    setIsVoiceQuery(false);
  }

  const showSuggestions = debouncedQuery.length > 0 && !isVoiceQuery;
  const showSendBtn = query.trim().length > 0 && isVoiceQuery;

  return (
    <div className={styles.page}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div
          className={`${styles.inputWrap} ${voiceState === "listening" ? styles.inputWrapListening : ""}`}
        >
          <Image
            src="/icons/icon-search.svg"
            alt=""
            width={20}
            height={20}
            className={styles.inputIcon}
          />
          <input
            ref={inputRef}
            type="search"
            placeholder={voiceState === "listening" ? "Spreche jetzt…" : "Suche"}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            className={styles.input}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query.length > 0 && voiceState !== "listening" && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearBtn}
              aria-label="Eingabe löschen"
            >
              <Image src="/icons/icon-close-small.svg" alt="" width={9} height={9} />
            </button>
          )}
          <button
            type="button"
            aria-label={voiceState === "listening" ? "Aufnahme stoppen" : "Sprachsuche starten"}
            className={`${styles.micBtn} ${voiceState === "listening" ? styles.micBtnActive : ""}`}
            onClick={voiceState === "listening" ? stopListening : startListening}
            disabled={voiceState === "processing"}
          >
            <Image src="/icons/icon-microphone.svg" alt="" width={20} height={20} />
          </button>
        </div>

        <Link href="/suchmodus" className={styles.cancelLink}>
          Abbrechen
        </Link>
      </div>

      {/* ─── Voice: Senden-Button ─── */}
      {showSendBtn && (
        <div className={styles.voiceSendBar}>
          {searchError && <p className={styles.voiceSendError}>{searchError}</p>}
          <p className={styles.voiceSendHint}>Spracheingabe erkannt — prüfen und suchen:</p>
          <button
            type="button"
            className={styles.voiceSendBtn}
            onClick={() => parseAndSearch(query)}
            disabled={voiceState === "processing"}
          >
            {voiceState === "processing" ? (
              <span className={styles.voiceSendSpinner} />
            ) : (
              <Image
                src="/icons/icon-search.svg"
                alt=""
                width={18}
                height={18}
                style={{ filter: "invert(1)" }}
              />
            )}
            {voiceState === "processing" ? "Wird gesucht…" : "Suchen"}
          </button>
        </div>
      )}

      {/* ─── Suggestions (nur bei Tastatursuche) ─── */}
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
                  ? [prov.production_title, prov.year ? String(prov.year) : null]
                      .filter(Boolean)
                      .join(" | ")
                  : null;

                const sortedMedia = [...(s.costume_media ?? [])].sort(
                  (a, b) => a.sort_order - b.sort_order
                );
                const imageUrl = sortedMedia[0]
                  ? supabase.storage
                      .from("costume-images")
                      .getPublicUrl(sortedMedia[0].storage_path).data.publicUrl
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
      {!showSuggestions && !showSendBtn && (
        <div className={styles.hint}>
          <p className={styles.hintText}>
            Kostüm-, Produktions- oder Rollentitel eingeben{"\n"}oder Mikrofon für Sprachsuche
            nutzen
          </p>
        </div>
      )}
    </div>
  );
}
