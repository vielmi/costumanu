"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type LogEntry = {
  id: string;
  action_type: "created" | "edited";
  changed_by_name: string | null;
  changed_at: string;
  production_title: string | null;
  season: string | null;
  role_name: string | null;
  director_name: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function CostumeActivityLog({
  costumeId,
  onClose,
}: {
  costumeId: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("costume_activity_log")
      .select("id, action_type, changed_by_name, changed_at, production_title, season, role_name, director_name")
      .eq("costume_id", costumeId)
      .order("changed_at", { ascending: false })
      .then(({ data }) => {
        setEntries((data ?? []) as LogEntry[]);
        setLoading(false);
      });
  }, [costumeId, supabase]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "var(--overlay-light)",
          zIndex: 900,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 100vw)",
        background: "var(--neutral-white)",
        zIndex: 901,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "24px 24px 20px",
          borderBottom: "1px solid var(--secondary-600)",
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-400)",
            fontWeight: 700,
            color: "var(--secondary-900)",
            margin: 0,
          }}>
            Änderungshistorie
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Image src="/icons/icon-close-small.svg" alt="Schließen" width={24} height={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 32px" }}>
          {loading && (
            <p style={{
              fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
              color: "var(--neutral-grey-500)", textAlign: "center", marginTop: 48,
            }}>
              Wird geladen…
            </p>
          )}
          {!loading && entries.length === 0 && (
            <p style={{
              fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
              color: "var(--neutral-grey-500)", textAlign: "center", marginTop: 48,
            }}>
              Noch keine Einträge vorhanden.
            </p>
          )}
          {!loading && entries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {entries.map((entry, i) => (
                <div key={entry.id} style={{ display: "flex", gap: 16 }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                      background: "var(--primary-900)",
                      marginTop: 4,
                    }} />
                    {i < entries.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "var(--secondary-600)", minHeight: 24 }} />
                    )}
                  </div>

                  {/* Entry content */}
                  <div style={{ paddingBottom: i < entries.length - 1 ? 24 : 0, flex: 1 }}>
                    {/* Date + action type */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
                        color: "var(--neutral-grey-500)",
                      }}>
                        {formatDate(entry.changed_at)}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", fontWeight: 500,
                        color: entry.action_type === "created" ? "var(--accent-01)" : "var(--tertiary-900)",
                        background: entry.action_type === "created" ? "var(--accent-01-light, #e8f5e9)" : "var(--tertiary-100, #edf0f3)",
                        borderRadius: "var(--radius-full)",
                        padding: "2px 10px",
                      }}>
                        {entry.action_type === "created" ? "Erstellt" : "Bearbeitet"}
                      </span>
                    </div>

                    {/* Changed by */}
                    {entry.changed_by_name && (
                      <p style={{
                        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
                        color: "var(--neutral-grey-700)", margin: "0 0 8px", fontWeight: 500,
                      }}>
                        {entry.changed_by_name}
                      </p>
                    )}

                    {/* Production details */}
                    {(entry.production_title || entry.season || entry.role_name || entry.director_name) && (
                      <div style={{
                        background: "var(--secondary-500)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 14px",
                        display: "flex", flexDirection: "column", gap: 4,
                      }}>
                        {(entry.production_title || entry.season) && (
                          <Row label="Stück & Spielsaison" value={[entry.production_title, entry.season].filter(Boolean).join(", ")} />
                        )}
                        {entry.role_name && (
                          <Row label="Rolle" value={entry.role_name} />
                        )}
                        {entry.director_name && (
                          <Row label="Regie" value={entry.director_name} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{
        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
        color: "var(--neutral-grey-500)", flexShrink: 0, minWidth: 130,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
        color: "var(--neutral-grey-700)", fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  );
}
