"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createTheaterAction,
  updateTheaterAction,
  deleteTheaterAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  updateNetworkSettingsAction,
  createNetworkAction,
  deleteNetworkAction,
  addTheaterToNetworkAction,
  removeTheaterFromNetworkAction,
} from "@/app/einstellungen/konfiguration/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Term {
  id: string;
  vocabulary: string;
  label_de: string;
  sort_order: number;
  parent_id?: string | null;
}

interface Member {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isSelf: boolean;
  theaterName: string;
  theaterId: string;
  isPlatformAdmin: boolean;
}

interface Theater {
  id: string;
  name: string;
  slug: string;
}

export interface FieldDef {
  id: string;
  label: string;
  field_type: "text" | "textarea" | "number" | "boolean" | "select";
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

interface NetworkMember {
  theater_id: string;
  theater_name: string;
  network_role: "member" | "admin";
}

export interface NetworkWithMembers {
  id: string;
  name: string;
  slug: string;
  members: NetworkMember[];
}

export interface AdminNetwork {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  default_visibility: "none" | "all";
  members: NetworkMember[];
}

interface Props {
  isPlatformAdmin: boolean;
  theaterId: string;
  terms: Term[];
  members: Member[];
  allTheaters: Theater[];
  allMembers: Member[];
  fieldDefinitions: FieldDef[];
  networks: NetworkWithMembers[];
  adminNetworks?: AdminNetwork[];
  subscriptionTier: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VOCABULARIES = [
  { key: "gender", label: "Allgemein" },
  { key: "sparte", label: "Sparte" },
  { key: "clothing_type", label: "Bekleidungsart" },
  { key: "clothing_subtype", label: "Bekleidungstyp" },
  { key: "material", label: "Materialart" },
  { key: "muster", label: "Muster" },
  { key: "color", label: "Farbrichtung" },
  { key: "temperature", label: "Temperatur" },
  { key: "washing_type", label: "Reinigungsart" },
  { key: "drying", label: "Trocknen" },
  { key: "ironing", label: "Bügeln" },
  { key: "floor", label: "Stockwerk" },
  { key: "rail", label: "Stange" },
  { key: "sector", label: "Sektor" },
];

// Lagerort-Vocabularies: pro Theater vom Theater-Admin bearbeitbar.
// Alle anderen Vocabularies sind global (theaterübergreifend) und nur vom Platform Admin bearbeitbar.
const STORAGE_VOCAB_KEYS = ["floor", "rail", "sector"];

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  height: 40,
  padding: "0 20px",
  borderRadius: 10,
  background: "var(--primary-900)",
  color: "#FFFFFF",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-200)",
  fontWeight: "var(--font-weight-500)",
};

const btnSecondary: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 10,
  background: "transparent",
  border: "1px solid var(--neutral-grey-300)",
  cursor: "pointer",
  fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-200)",
  color: "var(--neutral-grey-600)",
};

const inputStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: "1px solid var(--neutral-grey-300)",
  padding: "0 14px",
  fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-200)",
  color: "var(--neutral-black)",
  backgroundColor: "var(--neutral-white)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-100)",
  fontWeight: "var(--font-weight-700)",
  color: "var(--neutral-grey-600)",
  marginBottom: 6,
};

const panelStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--neutral-white)",
  borderRadius: "var(--radius-panel) var(--radius-panel) 0 0",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

// ─── Taxonomy tab ─────────────────────────────────────────────────────────────

function TaxonomyTab({
  theaterId,
  initialTerms,
  isPlatformAdmin,
  allTheaters,
}: {
  theaterId: string;
  initialTerms: Term[];
  isPlatformAdmin: boolean;
  allTheaters: Theater[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [activeVocab, setActiveVocab] = useState(VOCABULARIES[0].key);
  const [selectedTheaterId, setSelectedTheaterId] = useState(
    isPlatformAdmin ? (allTheaters[0]?.id ?? "") : theaterId
  );
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const effectiveTheaterId = isPlatformAdmin ? selectedTheaterId : theaterId;

  const isStorageVocab = STORAGE_VOCAB_KEYS.includes(activeVocab);
  const canEdit = isPlatformAdmin || isStorageVocab;

  const vocabTerms = terms
    .filter((t) => t.vocabulary === activeVocab)
    .sort((a, b) => a.sort_order - b.sort_order || a.label_de.localeCompare(b.label_de));

  async function addTerm() {
    const label = newLabel.trim();
    if (!label || !effectiveTheaterId) return;
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("taxonomy_terms")
      .insert({
        vocabulary: activeVocab,
        label_de: label,
        sort_order: vocabTerms.length,
      })
      .select("id, vocabulary, label_de, sort_order")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) setTerms((prev) => [...prev, data]);
    setNewLabel("");
  }

  async function saveEdit(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("taxonomy_terms")
      .update({ label_de: label })
      .eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setTerms((prev) => prev.map((t) => (t.id === id ? { ...t, label_de: label } : t)));
    setEditingId(null);
  }

  async function deleteTerm(id: string) {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("taxonomy_terms").delete().eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setTerms((prev) => prev.filter((t) => t.id !== id));
  }

  async function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIdx = vocabTerms.findIndex((t) => t.id === fromId);
    const toIdx = vocabTerms.findIndex((t) => t.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    // Build new ordered list
    const reordered = [...vocabTerms];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Optimistic update
    setTerms((all) => {
      const others = all.filter((t) => t.vocabulary !== activeVocab);
      return [...others, ...reordered.map((t, i) => ({ ...t, sort_order: i }))];
    });

    // Persist to DB
    setSaving(true);
    await Promise.all(
      reordered.map((t, i) =>
        supabase.from("taxonomy_terms").update({ sort_order: i }).eq("id", t.id)
      )
    );
    setSaving(false);
    // Invalidate Next.js router cache so /kostueme/neu re-fetches on next visit
    router.refresh();
  }

  // For clothing_subtype: group by parent clothing_type; otherwise flat
  type DisplayRow = { type: "header"; label: string; count: number } | { type: "term"; term: Term };

  const displayRows: DisplayRow[] =
    activeVocab === "clothing_subtype"
      ? (() => {
          const result: DisplayRow[] = [];
          const assignedIds = new Set<string>();
          const clothingTypes = terms
            .filter((t) => t.vocabulary === "clothing_type")
            .sort((a, b) => a.sort_order - b.sort_order || a.label_de.localeCompare(b.label_de));
          for (const ct of clothingTypes) {
            const children = vocabTerms.filter((t) => t.parent_id === ct.id);
            if (children.length === 0) continue;
            result.push({ type: "header", label: ct.label_de, count: children.length });
            children.forEach((t) => {
              assignedIds.add(t.id);
              result.push({ type: "term", term: t });
            });
          }
          // Fallback: terms without a matching parent (or parent_id not yet loaded)
          const unassigned = vocabTerms.filter((t) => !assignedIds.has(t.id));
          if (unassigned.length > 0) {
            if (result.length > 0) {
              result.push({ type: "header", label: "Ohne Zuordnung", count: unassigned.length });
            }
            unassigned.forEach((t) => result.push({ type: "term", term: t }));
          }
          return result;
        })()
      : vocabTerms.map((t) => ({ type: "term" as const, term: t }));

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        flex: 1,
        overflow: "hidden",
        paddingTop: 24,
        paddingLeft: 48,
      }}
    >
      {/* Sidebar */}
      <nav style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {isPlatformAdmin && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-100)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-grey-500)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: 6,
              }}
            >
              Theater
            </div>
            <select
              value={selectedTheaterId}
              onChange={(e) => setSelectedTheaterId(e.target.value)}
              style={{ ...inputStyle, width: "100%", height: 40, fontSize: "var(--font-size-200)" }}
            >
              {allTheaters.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {[
          {
            groupLabel: "Suchbare Eigenschaften",
            keys: VOCABULARIES.filter((v) => !STORAGE_VOCAB_KEYS.includes(v.key)),
          },
          {
            groupLabel: "Lagerort",
            keys: VOCABULARIES.filter((v) => STORAGE_VOCAB_KEYS.includes(v.key)),
          },
        ].map(({ groupLabel, keys }) => (
          <div key={groupLabel} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-100)",
                  fontWeight: "var(--font-weight-700)",
                  color: "var(--neutral-grey-500)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {groupLabel}
              </span>
              {!isPlatformAdmin && groupLabel !== "Lagerort" && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ flexShrink: 0, opacity: 0.4 }}
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7a5 5 0 0 1 10 0v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            {keys.map((v) => {
              const count = terms.filter((t) => t.vocabulary === v.key).length;
              const isActive = activeVocab === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setActiveVocab(v.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 44,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "none",
                    background: isActive ? "var(--secondary-550)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-200)",
                      fontWeight: isActive ? "var(--font-weight-700)" : "var(--font-weight-500)",
                      color: "var(--neutral-grey-700)",
                    }}
                  >
                    {v.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-100)",
                      color: "var(--neutral-grey-500)",
                      background: "var(--neutral-grey-200)",
                      borderRadius: 99,
                      padding: "1px 7px",
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Main panel */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 48px 40px" }}>
          <h2
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-600)",
              fontWeight: "var(--font-weight-700)",
              color: "var(--neutral-black)",
              margin: "0 0 8px",
            }}
          >
            {VOCABULARIES.find((v) => v.key === activeVocab)?.label}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              color: "var(--neutral-grey-500)",
              margin: "0 0 32px",
            }}
          >
            {canEdit
              ? "Einträge können bearbeitet, umbenannt, gelöscht und neu erstellt werden."
              : "Diese Eigenschaften sind theaterübergreifend definiert und können nur vom Platform Admin bearbeitet werden."}
          </p>

          {error && <ErrorBox message={error} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
            {displayRows.map((row, idx) => {
              if (row.type === "header") {
                return (
                  <div
                    key={"h-" + idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "16px 4px 4px",
                      borderBottom: "1px solid var(--neutral-grey-200)",
                      marginTop: idx === 0 ? 0 : 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-200)",
                        fontWeight: "var(--font-weight-700)",
                        color: "var(--neutral-grey-600)",
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-100)",
                        color: "var(--neutral-grey-400)",
                        background: "var(--neutral-grey-200)",
                        borderRadius: 99,
                        padding: "1px 7px",
                      }}
                    >
                      {row.count}
                    </span>
                  </div>
                );
              }
              const term = row.term;
              const isEditing = editingId === term.id;
              const isDragOver = dragOverId === term.id;
              return (
                <div
                  key={term.id}
                  draggable={canEdit}
                  onDragStart={
                    canEdit
                      ? () => {
                          dragId.current = term.id;
                        }
                      : undefined
                  }
                  onDragEnd={
                    canEdit
                      ? () => {
                          dragId.current = null;
                          setDragOverId(null);
                        }
                      : undefined
                  }
                  onDragOver={
                    canEdit
                      ? (e) => {
                          e.preventDefault();
                          setDragOverId(term.id);
                        }
                      : undefined
                  }
                  onDragLeave={canEdit ? () => setDragOverId(null) : undefined}
                  onDrop={
                    canEdit
                      ? (e) => {
                          e.preventDefault();
                          if (dragId.current) reorder(dragId.current, term.id);
                          setDragOverId(null);
                        }
                      : undefined
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    height: 56,
                    padding: "0 16px",
                    borderRadius: 12,
                    background: isDragOver ? "var(--secondary-600)" : "var(--secondary-500)",
                    border: isDragOver
                      ? "1.5px solid var(--primary-900)"
                      : "1px solid var(--neutral-grey-200)",
                    transition: "background 0.15s, border 0.15s",
                    cursor: canEdit ? "grab" : "default",
                  }}
                >
                  {/* Drag handle — nur wenn bearbeitbar */}
                  {canEdit && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{ flexShrink: 0, opacity: 0.35 }}
                    >
                      <circle cx="5" cy="4" r="1.5" fill="currentColor" />
                      <circle cx="5" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="11" cy="4" r="1.5" fill="currentColor" />
                      <circle cx="11" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="11" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  )}

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(term.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      style={{ ...inputStyle, flex: 1, height: 36 }}
                    />
                  ) : (
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-200)",
                        fontWeight: "var(--font-weight-500)",
                        color: "var(--neutral-grey-700)",
                      }}
                    >
                      {term.label_de}
                    </span>
                  )}

                  {canEdit && (
                    <div style={{ display: "flex", gap: 0, alignItems: "center", flexShrink: 0 }}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(term.id)}
                            disabled={saving}
                            style={btnPrimary}
                          >
                            Speichern
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{ ...btnSecondary, marginLeft: 8 }}
                          >
                            Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTerm(term.id);
                            }}
                            disabled={saving}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              width: 32,
                              height: 32,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 6,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 20,
                                height: 20,
                                background: "var(--neutral-grey-600)",
                                WebkitMaskImage: "url(/icons/icon-delete.svg)",
                                maskImage: "url(/icons/icon-delete.svg)",
                                WebkitMaskSize: "contain",
                                maskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                              }}
                            />
                          </button>
                          <div
                            style={{
                              width: 1,
                              height: 18,
                              background: "var(--neutral-grey-300)",
                              flexShrink: 0,
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(term.id);
                              setEditLabel(term.label_de);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              width: 32,
                              height: 32,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 6,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 20,
                                height: 20,
                                background: "var(--neutral-grey-600)",
                                WebkitMaskImage: "url(/icons/icon-edit.svg)",
                                maskImage: "url(/icons/icon-edit.svg)",
                                WebkitMaskSize: "contain",
                                maskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                              }}
                            />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {vocabTerms.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  color: "var(--neutral-grey-400)",
                }}
              >
                Noch keine Einträge.
              </div>
            )}
          </div>

          {canEdit && (
            <div style={{ borderTop: "1px solid var(--neutral-grey-200)", paddingTop: 24 }}>
              <div
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-700)",
                  color: "var(--neutral-grey-700)",
                  marginBottom: 12,
                }}
              >
                Neuer Eintrag
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTerm();
                  }}
                  placeholder="Bezeichnung…"
                  style={{ ...inputStyle, width: 320 }}
                />
                <button
                  type="button"
                  onClick={addTerm}
                  disabled={saving || !newLabel.trim()}
                  style={{ ...btnPrimary, opacity: newLabel.trim() ? 1 : 0.4 }}
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Theater tab (platform admin only) ───────────────────────────────────────

function TheaterTab({ initialTheaters }: { initialTheaters: Theater[] }) {
  const [theaters, setTheaters] = useState<Theater[]>(initialTheaters);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editTarget, setEditTarget] = useState<Theater | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Theater | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setName("");
    setSlug("");
    setEditTarget(null);
    setError(null);
    setMode("create");
  }

  function openEdit(t: Theater) {
    setName(t.name);
    setSlug(t.slug);
    setEditTarget(t);
    setError(null);
    setMode("edit");
  }

  function handleNameChange(v: string) {
    setName(v);
    if (mode === "create") {
      setSlug(
        v
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      );
    }
  }

  function handleSave() {
    if (!name.trim() || !slug.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createTheaterAction({ name, slug });
          setTheaters((prev) => [...prev, created]);
        } else if (editTarget) {
          await updateTheaterAction({ theaterId: editTarget.id, name, slug });
          setTheaters((prev) =>
            prev.map((t) => (t.id === editTarget.id ? { ...t, name, slug } : t))
          );
        }
        setMode("list");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
          <button
            type="button"
            onClick={() => setMode("list")}
            style={{ ...btnSecondary, marginBottom: 24 }}
          >
            ← Zurück
          </button>
          <h2
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-600)",
              fontWeight: "var(--font-weight-700)",
              color: "var(--neutral-black)",
              margin: "0 0 32px",
            }}
          >
            {mode === "create" ? "Neues Theater anlegen" : "Theater bearbeiten"}
          </h2>
          {error && <ErrorBox message={error} />}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
                placeholder="z.B. Luzerner Theater"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Slug *{" "}
                <span style={{ fontWeight: 400, color: "var(--neutral-grey-400)" }}>
                  (URL-Kennung, nur Kleinbuchstaben + Bindestriche)
                </span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                style={{ ...inputStyle, width: "100%" }}
                placeholder="z.B. luzerner-theater"
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !name.trim() || !slug.trim()}
                style={{ ...btnPrimary, opacity: name.trim() && slug.trim() ? 1 : 0.4 }}
              >
                {isPending
                  ? "Speichert…"
                  : mode === "create"
                    ? "Theater erstellen"
                    : "Änderungen speichern"}
              </button>
              <button type="button" onClick={() => setMode("list")} style={btnSecondary}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-600)",
                  fontWeight: "var(--font-weight-700)",
                  color: "var(--neutral-black)",
                  margin: "0 0 4px",
                }}
              >
                Theater
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  color: "var(--neutral-grey-500)",
                  margin: 0,
                }}
              >
                {theaters.length} {theaters.length === 1 ? "Theater" : "Theater"} auf der Plattform
              </p>
            </div>
            <button type="button" onClick={openCreate} style={btnPrimary}>
              + Neues Theater
            </button>
          </div>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px 48px",
              gap: 12,
              padding: "0 16px",
              marginBottom: 8,
            }}
          >
            {["Name", "Slug", ""].map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-100)",
                  fontWeight: "var(--font-weight-700)",
                  color: "var(--neutral-grey-500)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {theaters.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 200px 88px",
                  gap: 12,
                  alignItems: "center",
                  height: 60,
                  padding: "0 16px",
                  borderRadius: 12,
                  background: "var(--secondary-500)",
                  border: "1px solid var(--neutral-grey-200)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-200)",
                    fontWeight: "var(--font-weight-500)",
                    color: "var(--neutral-grey-700)",
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "var(--font-size-200)",
                    color: "var(--neutral-grey-500)",
                  }}
                >
                  {t.slug}
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: 0,
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 20,
                        height: 20,
                        background: "var(--neutral-grey-600)",
                        WebkitMaskImage: "url(/icons/icon-delete.svg)",
                        maskImage: "url(/icons/icon-delete.svg)",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                      }}
                    />
                  </button>
                  <div
                    style={{
                      width: 1,
                      height: 18,
                      background: "var(--neutral-grey-300)",
                      flexShrink: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 20,
                        height: 20,
                        background: "var(--neutral-grey-600)",
                        WebkitMaskImage: "url(/icons/icon-edit.svg)",
                        maskImage: "url(/icons/icon-edit.svg)",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                      }}
                    />
                  </button>
                </div>
              </div>
            ))}
            {theaters.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  color: "var(--neutral-grey-400)",
                }}
              >
                Noch keine Theater angelegt.
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              background: "var(--overlay-medium)",
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2001,
              background: "var(--neutral-white)",
              borderRadius: "24px 24px 0 0",
              padding: "28px 20px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--neutral-grey-200)",
                alignSelf: "center",
                marginBottom: 8,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-325)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-grey-600)",
                marginBottom: 4,
              }}
            >
              Theater löschen?
            </p>
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                color: "var(--neutral-grey-400)",
                marginBottom: 8,
              }}
            >
              «{deleteTarget.name}» wird unwiderruflich gelöscht — inkl. aller Mitglieder und
              Kostüme.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await deleteTheaterAction(deleteTarget.id);
                  setTheaters((prev) => prev.filter((t) => t.id !== deleteTarget.id));
                } catch (e) {
                  alert(e instanceof Error ? e.message : "Fehler");
                }
                setDeleteTarget(null);
              }}
              style={{
                height: "var(--button-height-md)",
                borderRadius: "var(--radius-md)",
                background: "none",
                border: "1.5px solid var(--primary-900)",
                color: "var(--primary-900)",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-250)",
                fontWeight: "var(--font-weight-500)",
                cursor: "pointer",
              }}
            >
              Endgültig löschen
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              style={{
                height: "var(--button-height-md)",
                borderRadius: "var(--radius-md)",
                background: "var(--secondary-900)",
                border: "none",
                color: "var(--neutral-white)",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-250)",
                fontWeight: "var(--font-weight-500)",
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
    </>
  );
}

// ─── User form ────────────────────────────────────────────────────────────────

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  theaterId: string;
  platformAdmin: boolean;
}

function UserForm({
  initial,
  onSave,
  onCancel,
  onChange,
  isEdit,
  saving,
  allTheaters,
  showTheaterPicker,
  showPlatformAdminToggle,
}: {
  initial: UserFormState;
  onSave: (f: UserFormState) => void;
  onCancel: () => void;
  onChange?: (f: UserFormState) => void;
  isEdit: boolean;
  saving: boolean;
  allTheaters: Theater[];
  showTheaterPicker: boolean;
  showPlatformAdminToggle: boolean;
}) {
  const [f, setF] = useState<UserFormState>(initial);
  const set = <K extends keyof UserFormState>(k: K, v: UserFormState[K]) =>
    setF((prev) => {
      const next = { ...prev, [k]: v };
      onChange?.(next);
      return next;
    });
  const valid =
    f.firstName.trim() &&
    f.email.trim() &&
    (isEdit || f.password.trim()) &&
    (!showTheaterPicker || f.theaterId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Vorname *</label>
          <input
            type="text"
            value={f.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Nachname</label>
          <input
            type="text"
            value={f.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>E-Mail *</label>
        <input
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="off"
          style={{ ...inputStyle, width: "100%" }}
        />
      </div>
      <div>
        <label style={labelStyle}>Passwort {isEdit ? "(leer lassen = unverändert)" : "*"}</label>
        <input
          type="password"
          value={f.password}
          onChange={(e) => set("password", e.target.value)}
          autoComplete="new-password"
          style={{ ...inputStyle, width: "100%" }}
        />
      </div>
      {showTheaterPicker && (
        <div>
          <label style={labelStyle}>Theater *</label>
          <select
            value={f.theaterId}
            onChange={(e) => set("theaterId", e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="">Theater wählen…</option>
            {allTheaters.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label style={labelStyle}>Rolle *</label>
        <select
          value={f.role}
          onChange={(e) => set("role", e.target.value)}
          disabled={f.platformAdmin}
          style={{ ...inputStyle, width: 200, opacity: f.platformAdmin ? 0.4 : 1 }}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      {showPlatformAdminToggle && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={f.platformAdmin}
            onChange={(e) => set("platformAdmin", e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--primary-900)", cursor: "pointer" }}
          />
          <span
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              color: "var(--neutral-grey-700)",
            }}
          >
            Platform Admin
          </span>
        </label>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => onSave(f)}
          disabled={saving || !valid}
          style={{ ...btnPrimary, opacity: valid ? 1 : 0.4 }}
        >
          {saving ? "Speichert…" : isEdit ? "Änderungen speichern" : "Benutzer erstellen"}
        </button>
        <button type="button" onClick={onCancel} style={btnSecondary}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({
  initialMembers,
  isPlatformAdmin,
  allTheaters,
  defaultTheaterId,
  mode,
  setMode,
  editTarget,
  setEditTarget,
  formDraft,
  setFormDraft,
  emptyForm,
}: {
  initialMembers: Member[];
  isPlatformAdmin: boolean;
  allTheaters: Theater[];
  defaultTheaterId: string;
  mode: "list" | "create" | "edit";
  setMode: (m: "list" | "create" | "edit") => void;
  editTarget: Member | null;
  setEditTarget: (t: Member | null) => void;
  formDraft: UserFormState;
  setFormDraft: (f: UserFormState) => void;
  emptyForm: UserFormState;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

  function handleCreate(f: UserFormState) {
    setError(null);
    startTransition(async () => {
      try {
        await createUserAction({
          email: f.email,
          password: f.password,
          firstName: f.firstName,
          lastName: f.lastName,
          role: f.role,
          theaterId: isPlatformAdmin ? f.theaterId : undefined,
          platformAdmin: f.platformAdmin,
        });
        const theaterName = allTheaters.find((t) => t.id === f.theaterId)?.name ?? "";
        setMembers((prev) => [
          ...prev,
          {
            userId: crypto.randomUUID(),
            email: f.email,
            firstName: f.firstName,
            lastName: f.lastName,
            role: f.role,
            isSelf: false,
            theaterName,
            theaterId: f.theaterId,
            isPlatformAdmin: f.platformAdmin,
          },
        ]);
        setFormDraft(emptyForm);
        setMode("list");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  function handleEdit(f: UserFormState) {
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateUserAction({
          userId: editTarget.userId,
          email: f.email,
          password: f.password || undefined,
          firstName: f.firstName,
          lastName: f.lastName,
          role: f.role,
          theaterId: editTarget.theaterId,
          platformAdmin: f.platformAdmin,
        });
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === editTarget.userId
              ? {
                  ...m,
                  email: f.email,
                  firstName: f.firstName,
                  lastName: f.lastName,
                  role: f.role,
                  isPlatformAdmin: f.platformAdmin,
                }
              : m
          )
        );
        setMode("list");
        setEditTarget(null);
        setFormDraft(emptyForm);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  function handleDelete(userId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteUserAction(userId);
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  if (mode === "create" || mode === "edit") {
    const target = editTarget;
    return (
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
          <button
            type="button"
            onClick={() => {
              setMode("list");
              setEditTarget(null);
              setError(null);
            }}
            style={{ ...btnSecondary, marginBottom: 24 }}
          >
            ← Zurück
          </button>
          <h2
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-600)",
              fontWeight: "var(--font-weight-700)",
              color: "var(--neutral-black)",
              margin: "0 0 32px",
            }}
          >
            {mode === "create" ? "Neuen Benutzer erfassen" : "Benutzer bearbeiten"}
          </h2>
          {error && <ErrorBox message={error} />}
          <UserForm
            initial={
              target
                ? {
                    firstName: target.firstName,
                    lastName: target.lastName,
                    email: target.email,
                    password: "",
                    role: target.role,
                    theaterId: target.theaterId,
                    platformAdmin: target.isPlatformAdmin,
                  }
                : formDraft
            }
            onChange={mode === "create" ? setFormDraft : undefined}
            onSave={mode === "create" ? handleCreate : handleEdit}
            onCancel={() => {
              setMode("list");
              setEditTarget(null);
              setFormDraft(emptyForm);
              setError(null);
            }}
            isEdit={mode === "edit"}
            saving={isPending}
            allTheaters={allTheaters}
            showTheaterPicker={isPlatformAdmin}
            showPlatformAdminToggle={isPlatformAdmin}
          />
        </div>
      </div>
    );
  }

  const showTheaterCol = isPlatformAdmin;
  const gridCols = showTheaterCol ? "1fr 1fr 1fr 120px 88px" : "1fr 1fr 120px 88px";
  const headers = showTheaterCol
    ? ["Name", "E-Mail", "Theater", "Rolle", ""]
    : ["Name", "E-Mail", "Rolle", ""];

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-600)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-black)",
                margin: "0 0 4px",
              }}
            >
              Benutzerverwaltung
            </h2>
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                color: "var(--neutral-grey-500)",
                margin: 0,
              }}
            >
              {members.length} {members.length === 1 ? "Benutzer" : "Benutzer"}
              {isPlatformAdmin
                ? " auf der Plattform"
                : ` in ${allTheaters.find((t) => t.id === defaultTheaterId)?.name ?? "diesem Theater"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            style={btnPrimary}
          >
            + Neuer Benutzer
          </button>
        </div>

        {error && <ErrorBox message={error} />}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: 12,
            padding: "0 16px",
            marginBottom: 8,
          }}
        >
          {headers.map((h) => (
            <span
              key={h}
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-100)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-grey-500)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div
              key={`${m.userId}-${m.theaterId}`}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 12,
                alignItems: "center",
                height: 60,
                padding: "0 16px",
                borderRadius: 12,
                background: "var(--secondary-500)",
                border: "1px solid var(--neutral-grey-200)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-500)",
                  color: "var(--neutral-grey-700)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.firstName} {m.lastName}
                {m.isSelf && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: "var(--font-size-50)",
                      color: "var(--neutral-grey-400)",
                      background: "var(--neutral-grey-200)",
                      borderRadius: 99,
                      padding: "1px 6px",
                    }}
                  >
                    ich
                  </span>
                )}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  color: "var(--neutral-grey-600)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.email}
              </span>
              {showTheaterCol && (
                <span
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-200)",
                    color: "var(--neutral-grey-600)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.theaterName}
                </span>
              )}
              <span
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-100)",
                  fontWeight: "var(--font-weight-700)",
                  borderRadius: 99,
                  padding: "3px 10px",
                  textAlign: "center",
                  width: "fit-content",
                  color: m.isPlatformAdmin ? "var(--primary-900)" : "var(--secondary-800)",
                  background: m.isPlatformAdmin ? "rgba(181,155,58,0.12)" : "var(--secondary-600)",
                }}
              >
                {m.isPlatformAdmin ? "Platform Admin" : roleLabel(m.role)}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                {!m.isSelf && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(m)}
                      disabled={isPending}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 20,
                          height: 20,
                          background: "var(--neutral-grey-600)",
                          WebkitMaskImage: "url(/icons/icon-delete.svg)",
                          maskImage: "url(/icons/icon-delete.svg)",
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                        }}
                      />
                    </button>
                    <div
                      style={{
                        width: 1,
                        height: 18,
                        background: "var(--neutral-grey-300)",
                        flexShrink: 0,
                      }}
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(m);
                    setMode("edit");
                    setError(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 20,
                      height: 20,
                      background: "var(--neutral-grey-600)",
                      WebkitMaskImage: "url(/icons/icon-edit.svg)",
                      maskImage: "url(/icons/icon-edit.svg)",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                    }}
                  />
                </button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                color: "var(--neutral-grey-400)",
              }}
            >
              Noch keine Benutzer.
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              background: "var(--overlay-medium)",
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2001,
              background: "var(--neutral-white)",
              borderRadius: "24px 24px 0 0",
              padding: "28px 20px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--neutral-grey-200)",
                alignSelf: "center",
                marginBottom: 8,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-325)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-grey-600)",
                marginBottom: 4,
              }}
            >
              Benutzer löschen?
            </p>
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                color: "var(--neutral-grey-400)",
                marginBottom: 8,
              }}
            >
              {deleteTarget.email} wird unwiderruflich gelöscht und kann nicht wiederhergestellt
              werden.
            </p>
            <button
              type="button"
              onClick={() => {
                handleDelete(deleteTarget.userId);
                setDeleteTarget(null);
              }}
              disabled={isPending}
              style={{
                height: "var(--button-height-md)",
                borderRadius: "var(--radius-md)",
                background: "none",
                border: "1.5px solid var(--primary-900)",
                color: "var(--primary-900)",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-250)",
                fontWeight: "var(--font-weight-500)",
                cursor: "pointer",
              }}
            >
              Endgültig löschen
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              style={{
                height: "var(--button-height-md)",
                borderRadius: "var(--radius-md)",
                background: "var(--secondary-900)",
                border: "none",
                color: "var(--neutral-white)",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-250)",
                fontWeight: "var(--font-weight-500)",
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Field Definitions Tab ────────────────────────────────────────────────────

const FIELD_TYPES: { value: FieldDef["field_type"]; label: string }[] = [
  { value: "text", label: "Kurztext" },
  { value: "textarea", label: "Langtext" },
  { value: "number", label: "Zahl" },
  { value: "boolean", label: "Ja / Nein" },
  { value: "select", label: "Auswahl" },
];

function FieldDefinitionsTab({
  theaterId,
  initialDefs,
  subscriptionTier,
}: {
  theaterId: string;
  initialDefs: FieldDef[];
  subscriptionTier: string;
}) {
  const supabase = createClient();
  const [defs, setDefs] = useState<FieldDef[]>(initialDefs);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FieldDef["field_type"]>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editRequired, setEditRequired] = useState(false);
  const [editOptions, setEditOptions] = useState("");

  const hasAccess = ["standard", "pro", "premium", "enterprise"].includes(subscriptionTier);

  async function addField() {
    const label = newLabel.trim();
    if (!label || !theaterId) return;
    setSaving(true);
    setError(null);
    const options =
      newType === "select"
        ? newOptions
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : null;
    const { data, error: err } = await supabase
      .from("field_definitions")
      .insert({
        theater_id: theaterId,
        label,
        field_type: newType,
        options: options ? JSON.stringify(options) : null,
        is_required: newRequired,
        sort_order: defs.length,
      })
      .select("id, label, field_type, options, is_required, sort_order")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) setDefs((prev) => [...prev, data as FieldDef]);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
    setNewOptions("");
  }

  async function saveEdit(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    setSaving(true);
    setError(null);
    const options = editOptions
      ? editOptions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    const { error: err } = await supabase
      .from("field_definitions")
      .update({
        label,
        is_required: editRequired,
        options: options ? JSON.stringify(options) : null,
      })
      .eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDefs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, label, is_required: editRequired, options } : d))
    );
    setEditingId(null);
  }

  async function deleteField(id: string) {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("field_definitions").delete().eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDefs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
        <h2
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-600)",
            fontWeight: "var(--font-weight-700)",
            color: "var(--neutral-black)",
            margin: "0 0 8px",
          }}
        >
          Eigene Felder
        </h2>
        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            color: "var(--neutral-grey-500)",
            margin: "0 0 32px",
          }}
        >
          {hasAccess
            ? "Definiere theater-spezifische Felder, die beim Erfassen eines Kostüms ausgefüllt werden können."
            : "Eigene Felder sind ab dem Standard-Tarif verfügbar. Bitte upgraden."}
        </p>

        {!hasAccess && (
          <div
            style={{
              background: "rgba(181,155,58,0.1)",
              border: "1px solid var(--primary-900)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                color: "var(--primary-900)",
                fontWeight: "var(--font-weight-500)",
              }}
            >
              Aktueller Tarif:{" "}
              <strong style={{ textTransform: "capitalize" }}>{subscriptionTier}</strong> — Eigene
              Felder erfordern Standard oder höher.
            </span>
          </div>
        )}

        {error && <ErrorBox message={error} />}

        {hasAccess && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              {defs.map((def) => (
                <div
                  key={def.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 56,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "var(--secondary-500)",
                    border: "1px solid var(--neutral-grey-200)",
                  }}
                >
                  {editingId === def.id ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        style={{ ...inputStyle, height: 36 }}
                        placeholder="Feldname"
                      />
                      {def.field_type === "select" && (
                        <textarea
                          value={editOptions}
                          onChange={(e) => setEditOptions(e.target.value)}
                          rows={3}
                          placeholder="Eine Option pro Zeile"
                          style={{
                            ...inputStyle,
                            height: "auto",
                            padding: "8px 14px",
                            resize: "vertical",
                            lineHeight: 1.5,
                          }}
                        />
                      )}
                      <label
                        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={editRequired}
                          onChange={(e) => setEditRequired(e.target.checked)}
                          style={{ accentColor: "var(--primary-900)" }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-100)",
                            color: "var(--neutral-grey-600)",
                          }}
                        >
                          Pflichtfeld
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-200)",
                          fontWeight: "var(--font-weight-500)",
                          color: "var(--neutral-grey-700)",
                        }}
                      >
                        {def.label}
                      </span>
                      <span
                        style={{
                          marginLeft: 10,
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-100)",
                          color: "var(--neutral-grey-400)",
                          background: "var(--neutral-grey-200)",
                          borderRadius: 99,
                          padding: "1px 8px",
                        }}
                      >
                        {FIELD_TYPES.find((t) => t.value === def.field_type)?.label}
                      </span>
                      {def.is_required && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-100)",
                            color: "var(--primary-900)",
                            background: "rgba(181,155,58,0.12)",
                            borderRadius: 99,
                            padding: "1px 8px",
                          }}
                        >
                          Pflicht
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 0, alignItems: "center", flexShrink: 0 }}>
                    {editingId === def.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(def.id)}
                          disabled={saving}
                          style={btnPrimary}
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={{ ...btnSecondary, marginLeft: 8 }}
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => deleteField(def.id)}
                          disabled={saving}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 6,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 20,
                              height: 20,
                              background: "var(--neutral-grey-600)",
                              WebkitMaskImage: "url(/icons/icon-delete.svg)",
                              maskImage: "url(/icons/icon-delete.svg)",
                              WebkitMaskSize: "contain",
                              maskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                            }}
                          />
                        </button>
                        <div
                          style={{ width: 1, height: 18, background: "var(--neutral-grey-300)" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(def.id);
                            setEditLabel(def.label);
                            setEditRequired(def.is_required);
                            setEditOptions(
                              Array.isArray(def.options) ? def.options.join("\n") : ""
                            );
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 6,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 20,
                              height: 20,
                              background: "var(--neutral-grey-600)",
                              WebkitMaskImage: "url(/icons/icon-edit.svg)",
                              maskImage: "url(/icons/icon-edit.svg)",
                              WebkitMaskSize: "contain",
                              maskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                            }}
                          />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {defs.length === 0 && (
                <div
                  style={{
                    padding: 32,
                    textAlign: "center",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-200)",
                    color: "var(--neutral-grey-400)",
                  }}
                >
                  Noch keine eigenen Felder definiert.
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--neutral-grey-200)", paddingTop: 24 }}>
              <div
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-700)",
                  color: "var(--neutral-grey-700)",
                  marginBottom: 12,
                }}
              >
                Neues Feld
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Feldname (z.B. «Schneiderin»)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FieldDef["field_type"])}
                    style={{ ...inputStyle, width: 140 }}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                {newType === "select" && (
                  <textarea
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    rows={3}
                    placeholder="Eine Option pro Zeile (z.B. Historisch / Modern / Fantasy)"
                    style={{
                      ...inputStyle,
                      height: "auto",
                      padding: "8px 14px",
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={newRequired}
                      onChange={(e) => setNewRequired(e.target.checked)}
                      style={{ accentColor: "var(--primary-900)" }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-200)",
                        color: "var(--neutral-grey-700)",
                      }}
                    >
                      Pflichtfeld
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={addField}
                    disabled={saving || !newLabel.trim()}
                    style={{ ...btnPrimary, opacity: newLabel.trim() ? 1 : 0.4 }}
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Networks Tab (Platform Admin only) ───────────────────────────────────────

function NetworksTab({
  networks,
  allTheaters,
}: {
  networks: NetworkWithMembers[];
  allTheaters: Theater[];
}) {
  const [networkList, setNetworkList] = useState<NetworkWithMembers[]>(networks);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");

  // Per-network: which "add theater" dropdown is open
  const [addingToNetwork, setAddingToNetwork] = useState<string | null>(null);
  const [addTheaterId, setAddTheaterId] = useState("");
  const [addRole, setAddRole] = useState<"member" | "admin">("member");

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        const created = await createNetworkAction({ name: createName, slug: createSlug });
        setNetworkList((prev) => [...prev, { ...created, members: [] }]);
        setShowCreate(false);
        setCreateName("");
        setCreateSlug("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  function handleDelete(networkId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteNetworkAction(networkId);
        setNetworkList((prev) => prev.filter((n) => n.id !== networkId));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  function handleAddTheater(networkId: string) {
    if (!addTheaterId) return;
    setError(null);
    startTransition(async () => {
      try {
        await addTheaterToNetworkAction({
          networkId,
          theaterId: addTheaterId,
          networkRole: addRole,
        });
        const theater = allTheaters.find((t) => t.id === addTheaterId);
        setNetworkList((prev) =>
          prev.map((n) =>
            n.id === networkId
              ? {
                  ...n,
                  members: [
                    ...n.members,
                    {
                      theater_id: addTheaterId,
                      theater_name: theater?.name ?? addTheaterId,
                      network_role: addRole,
                    },
                  ],
                }
              : n
          )
        );
        setAddingToNetwork(null);
        setAddTheaterId("");
        setAddRole("member");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  function handleRemoveTheater(networkId: string, theaterId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeTheaterFromNetworkAction({ networkId, theaterId });
        setNetworkList((prev) =>
          prev.map((n) =>
            n.id === networkId
              ? { ...n, members: n.members.filter((m) => m.theater_id !== theaterId) }
              : n
          )
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  function handleToggleRole(networkId: string, theaterId: string, currentRole: "member" | "admin") {
    const newRole: "member" | "admin" = currentRole === "admin" ? "member" : "admin";
    setError(null);
    startTransition(async () => {
      try {
        await addTheaterToNetworkAction({ networkId, theaterId, networkRole: newRole });
        setNetworkList((prev) =>
          prev.map((n) =>
            n.id === networkId
              ? {
                  ...n,
                  members: n.members.map((m) =>
                    m.theater_id === theaterId ? { ...m, network_role: newRole } : m
                  ),
                }
              : n
          )
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-600)",
              fontWeight: "var(--font-weight-700)",
              color: "var(--neutral-black)",
              margin: 0,
            }}
          >
            Netzwerke
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setError(null);
            }}
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 8,
              background: "var(--primary-900)",
              color: "var(--neutral-white)",
              border: "none",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              fontWeight: "var(--font-weight-500)",
              cursor: "pointer",
            }}
          >
            + Neues Netzwerk
          </button>
        </div>
        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            color: "var(--neutral-grey-500)",
            margin: "0 0 24px",
          }}
        >
          Theater können in Netzwerken Kostüme teilen. Netzwerk-Admins verwalten Sichtbarkeit und
          Einschränkungen.
        </p>

        {error && <ErrorBox message={error} />}

        {showCreate && (
          <div
            style={{
              background: "var(--secondary-500)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-300)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-grey-700)",
                margin: 0,
              }}
            >
              Neues Netzwerk
            </h3>
            <input
              type="text"
              placeholder="Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              style={{ ...inputStyle, height: 40 }}
            />
            <input
              type="text"
              placeholder="Slug (z.B. schweizer-buehnen)"
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              style={{ ...inputStyle, height: 40 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending || !createName.trim() || !createSlug.trim()}
                style={{
                  height: 38,
                  padding: "0 20px",
                  borderRadius: 8,
                  background: "var(--primary-900)",
                  color: "var(--neutral-white)",
                  border: "none",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  cursor: "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending ? "Wird erstellt…" : "Erstellen"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--neutral-grey-300)",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  color: "var(--neutral-grey-600)",
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {networkList.length === 0 && !showCreate && (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              color: "var(--neutral-grey-400)",
            }}
          >
            Noch keine Netzwerke vorhanden.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {networkList.map((network) => {
            const memberIds = new Set(network.members.map((m) => m.theater_id));
            const availableTheaters = allTheaters.filter((t) => !memberIds.has(t.id));
            const isAddingHere = addingToNetwork === network.id;

            return (
              <div
                key={network.id}
                style={{ background: "var(--secondary-500)", borderRadius: 12, padding: 16 }}
              >
                {/* Network header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-300)",
                      fontWeight: "var(--font-weight-700)",
                      color: "var(--neutral-grey-700)",
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {network.name}
                  </h3>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "var(--font-size-100)",
                      color: "var(--neutral-grey-400)",
                      background: "var(--neutral-grey-200)",
                      borderRadius: 99,
                      padding: "1px 8px",
                    }}
                  >
                    {network.slug}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-100)",
                      color: "var(--neutral-grey-400)",
                    }}
                  >
                    {network.members.length} Theater
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(network.id)}
                    style={{
                      height: 30,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid var(--color-error)",
                      background: "transparent",
                      color: "var(--color-error)",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-100)",
                      cursor: "pointer",
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    Löschen
                  </button>
                </div>

                {/* Members */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {network.members.map((m) => {
                    const isAdmin = m.network_role === "admin";
                    return (
                      <div
                        key={m.theater_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: 44,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: "var(--neutral-white)",
                          border: "1px solid var(--neutral-grey-200)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-200)",
                            fontWeight: "var(--font-weight-500)",
                            color: "var(--neutral-grey-700)",
                          }}
                        >
                          {m.theater_name}
                        </span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <select
                            value={m.network_role}
                            disabled={isPending}
                            onChange={() =>
                              handleToggleRole(
                                network.id,
                                m.theater_id,
                                isAdmin ? "admin" : "member"
                              )
                            }
                            style={{
                              height: 28,
                              padding: "0 6px",
                              borderRadius: 6,
                              border: "1px solid var(--neutral-grey-300)",
                              background: isAdmin ? "rgba(181,155,58,0.1)" : "transparent",
                              color: isAdmin ? "var(--primary-900)" : "var(--neutral-grey-600)",
                              fontFamily: "var(--font-family-base)",
                              fontSize: "var(--font-size-100)",
                              cursor: "pointer",
                              opacity: isPending ? 0.5 : 1,
                            }}
                          >
                            <option value="member">Mitglied</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleRemoveTheater(network.id, m.theater_id)}
                            style={{
                              height: 28,
                              padding: "0 10px",
                              borderRadius: 6,
                              border: "1px solid var(--color-error)",
                              background: "transparent",
                              color: "var(--color-error)",
                              fontFamily: "var(--font-family-base)",
                              fontSize: "var(--font-size-100)",
                              cursor: "pointer",
                              opacity: isPending ? 0.5 : 1,
                            }}
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add theater row */}
                  {!isAddingHere && availableTheaters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingToNetwork(network.id);
                        setAddTheaterId(availableTheaters[0]?.id ?? "");
                      }}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: "1px dashed var(--neutral-grey-300)",
                        background: "transparent",
                        color: "var(--neutral-grey-500)",
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-200)",
                        cursor: "pointer",
                      }}
                    >
                      + Theater hinzufügen
                    </button>
                  )}
                  {isAddingHere && (
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}
                    >
                      <select
                        value={addTheaterId}
                        onChange={(e) => setAddTheaterId(e.target.value)}
                        style={{ ...inputStyle, height: 36, flex: 1 }}
                      >
                        {availableTheaters.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value as "member" | "admin")}
                        style={{ ...inputStyle, height: 36, width: 120 }}
                      >
                        <option value="member">Mitglied</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddTheater(network.id)}
                        disabled={isPending}
                        style={{
                          height: 36,
                          padding: "0 14px",
                          borderRadius: 8,
                          background: "var(--primary-900)",
                          color: "var(--neutral-white)",
                          border: "none",
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-200)",
                          cursor: "pointer",
                          opacity: isPending ? 0.6 : 1,
                        }}
                      >
                        Hinzufügen
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingToNetwork(null)}
                        style={{
                          height: 36,
                          padding: "0 12px",
                          borderRadius: 8,
                          border: "1px solid var(--neutral-grey-300)",
                          background: "transparent",
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-200)",
                          color: "var(--neutral-grey-600)",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Network Admin Tab (theater-level, not platform admin) ───────────────────

function NetworkAdminTab({ networks }: { networks: AdminNetwork[] }) {
  const [networkList, setNetworkList] = useState<AdminNetwork[]>(networks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<"none" | "all">("none");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEdit(n: AdminNetwork) {
    setEditingId(n.id);
    setEditName(n.name);
    setEditDescription(n.description ?? "");
    setEditVisibility(n.default_visibility);
    setError(null);
  }

  function handleSave(networkId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateNetworkSettingsAction({
          networkId,
          name: editName,
          description: editDescription,
          defaultVisibility: editVisibility,
        });
        setNetworkList((prev) =>
          prev.map((n) =>
            n.id === networkId
              ? {
                  ...n,
                  name: editName,
                  description: editDescription || null,
                  default_visibility: editVisibility,
                }
              : n
          )
        );
        setEditingId(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px 40px" }}>
        <h2
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-600)",
            fontWeight: "var(--font-weight-700)",
            color: "var(--neutral-black)",
            margin: "0 0 8px",
          }}
        >
          Netzwerk-Einstellungen
        </h2>
        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            color: "var(--neutral-grey-500)",
            margin: "0 0 32px",
          }}
        >
          Als Netzwerk-Admin kannst du Name, Beschreibung und Standard-Sichtbarkeit verwalten.
          Mitgliedschaften werden vom Platform Admin vergeben.
        </p>

        {error && <ErrorBox message={error} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {networkList.map((network) => {
            const isEditing = editingId === network.id;
            return (
              <div
                key={network.id}
                style={{
                  border: "1px solid var(--neutral-grey-200)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 24px",
                    background: "var(--secondary-500)",
                    borderBottom: "1px solid var(--neutral-grey-200)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-300)",
                        fontWeight: "var(--font-weight-700)",
                        color: "var(--neutral-grey-700)",
                      }}
                    >
                      {network.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "var(--font-size-100)",
                        color: "var(--neutral-grey-400)",
                        background: "var(--neutral-grey-200)",
                        borderRadius: 99,
                        padding: "1px 8px",
                      }}
                    >
                      {network.slug}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-100)",
                        color: "var(--primary-900)",
                        background: "rgba(181,155,58,0.12)",
                        borderRadius: 99,
                        padding: "1px 8px",
                        fontWeight: "var(--font-weight-500)",
                      }}
                    >
                      Netzwerk-Admin
                    </span>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => openEdit(network)}
                      style={{
                        ...btnSecondary,
                        height: 36,
                        fontSize: "var(--font-size-100)",
                      }}
                    >
                      Bearbeiten
                    </button>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px 24px" }}>
                  {isEditing ? (
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}
                    >
                      <div>
                        <label style={labelStyle}>Name *</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ ...inputStyle, width: "100%" }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Beschreibung</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          style={{
                            ...inputStyle,
                            height: "auto",
                            padding: "10px 14px",
                            resize: "vertical",
                            lineHeight: 1.5,
                            width: "100%",
                          }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Standard-Sichtbarkeit beim Beitritt</label>
                        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                          {(
                            [
                              {
                                value: "none" as const,
                                label: "Keine",
                                hint: "Kostüme müssen explizit freigegeben werden",
                              },
                              {
                                value: "all" as const,
                                label: "Alle",
                                hint: "Alle Kostüme sofort sichtbar",
                              },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setEditVisibility(opt.value)}
                              style={{
                                flex: 1,
                                padding: "10px 16px",
                                borderRadius: 10,
                                border:
                                  editVisibility === opt.value
                                    ? "2px solid var(--primary-900)"
                                    : "1px solid var(--neutral-grey-300)",
                                background:
                                  editVisibility === opt.value
                                    ? "rgba(181,155,58,0.08)"
                                    : "transparent",
                                cursor: "pointer",
                                textAlign: "left" as const,
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "var(--font-family-base)",
                                  fontSize: "var(--font-size-200)",
                                  fontWeight: "var(--font-weight-700)",
                                  color:
                                    editVisibility === opt.value
                                      ? "var(--primary-900)"
                                      : "var(--neutral-grey-700)",
                                }}
                              >
                                {opt.label}
                              </div>
                              <div
                                style={{
                                  fontFamily: "var(--font-family-base)",
                                  fontSize: "var(--font-size-100)",
                                  color: "var(--neutral-grey-400)",
                                  marginTop: 2,
                                }}
                              >
                                {opt.hint}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleSave(network.id)}
                          disabled={isPending || !editName.trim()}
                          style={{ ...btnPrimary, opacity: editName.trim() ? 1 : 0.4 }}
                        >
                          {isPending ? "Speichert…" : "Speichern"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={btnSecondary}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {network.description && (
                        <p
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-200)",
                            color: "var(--neutral-grey-600)",
                            margin: 0,
                          }}
                        >
                          {network.description}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-100)",
                            color: "var(--neutral-grey-500)",
                          }}
                        >
                          Standard-Sichtbarkeit:
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-100)",
                            fontWeight: "var(--font-weight-700)",
                            color:
                              network.default_visibility === "all"
                                ? "var(--accent-01)"
                                : "var(--neutral-grey-500)",
                          }}
                        >
                          {network.default_visibility === "all"
                            ? "Alle sichtbar"
                            : "Keine (manuell freigeben)"}
                        </span>
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-100)",
                            fontWeight: "var(--font-weight-700)",
                            color: "var(--neutral-grey-500)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          Mitglieder ({network.members.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {network.members.map((m) => (
                            <div
                              key={m.theater_id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                height: 44,
                                padding: "0 14px",
                                borderRadius: 10,
                                background: "var(--secondary-500)",
                                border: "1px solid var(--neutral-grey-200)",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-family-base)",
                                  fontSize: "var(--font-size-200)",
                                  color: "var(--neutral-grey-700)",
                                }}
                              >
                                {m.theater_name}
                              </span>
                              {m.network_role === "admin" && (
                                <span
                                  style={{
                                    fontFamily: "var(--font-family-base)",
                                    fontSize: "var(--font-size-100)",
                                    color: "var(--primary-900)",
                                    background: "rgba(181,155,58,0.12)",
                                    borderRadius: 99,
                                    padding: "1px 8px",
                                    fontWeight: "var(--font-weight-500)",
                                  }}
                                >
                                  Admin
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Error box ────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "var(--accent-02)",
        border: "1px solid var(--color-error)",
        borderRadius: 8,
        padding: "10px 16px",
        marginBottom: 20,
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-200)",
        color: "var(--color-error)",
      }}
    >
      {message}
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function KonfigurationClient({
  isPlatformAdmin,
  theaterId,
  terms,
  members,
  allTheaters,
  allMembers,
  fieldDefinitions,
  networks,
  adminNetworks = [],
  subscriptionTier,
}: Props) {
  type TabKey =
    | "theater"
    | "merkmale"
    | "benutzer"
    | "netzwerke"
    | "eigene-felder"
    | "netzwerk-admin";
  const [activeTab, setActiveTab] = useState<TabKey>(isPlatformAdmin ? "theater" : "benutzer");

  const isNetworkAdmin = !isPlatformAdmin && adminNetworks.length > 0;

  const defaultTheaterId = isPlatformAdmin ? (allTheaters[0]?.id ?? "") : theaterId;
  const emptyUserForm: UserFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "viewer",
    theaterId: defaultTheaterId,
    platformAdmin: false,
  };
  const [userMode, setUserMode] = useState<"list" | "create" | "edit">("list");
  const [userEditTarget, setUserEditTarget] = useState<Member | null>(null);
  const [userFormDraft, setUserFormDraft] = useState<UserFormState>(emptyUserForm);

  const tabs = isPlatformAdmin
    ? [
        { key: "theater" as TabKey, label: "Theater" },
        { key: "benutzer" as TabKey, label: "Benutzer" },
        { key: "netzwerke" as TabKey, label: "Netzwerke" },
        { key: "merkmale" as TabKey, label: "Kostüm-Merkmale" },
      ]
    : [
        { key: "benutzer" as TabKey, label: "Benutzer" },
        ...(isNetworkAdmin ? [{ key: "netzwerk-admin" as TabKey, label: "Netzwerk" }] : []),
        { key: "eigene-felder" as TabKey, label: "Eigene Felder" },
        { key: "merkmale" as TabKey, label: "Kostüm-Merkmale" },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Badge */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
          padding: "16px 40px 0",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            color: "var(--primary-900)",
            background: "rgba(181,155,58,0.12)",
            borderRadius: 99,
            padding: "2px 10px",
            fontWeight: "var(--font-weight-700)",
          }}
        >
          {isPlatformAdmin ? "Platform Admin" : "Admin"}
        </span>
      </div>

      {/* Body — one white panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "12px 24px 24px" }}>
        <div style={panelStyle}>
          {/* ── Underline tabs ── */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              borderBottom: "1px solid var(--neutral-grey-200)",
              padding: "0 40px",
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    height: 52,
                    padding: "0 20px",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid var(--neutral-black)"
                      : "2px solid transparent",
                    background: "none",
                    cursor: "pointer",
                    marginBottom: -1,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-200)",
                    fontWeight: isActive ? "var(--font-weight-700)" : "var(--font-weight-400)",
                    color: isActive ? "var(--neutral-black)" : "var(--neutral-grey-500)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab content ── */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
            {activeTab === "theater" && isPlatformAdmin && (
              <TheaterTab initialTheaters={allTheaters} />
            )}
            {activeTab === "netzwerke" && isPlatformAdmin && (
              <NetworksTab networks={networks} allTheaters={allTheaters} />
            )}
            {activeTab === "netzwerk-admin" && isNetworkAdmin && (
              <NetworkAdminTab networks={adminNetworks} />
            )}
            {activeTab === "merkmale" && (
              <TaxonomyTab
                theaterId={theaterId}
                initialTerms={terms}
                isPlatformAdmin={isPlatformAdmin}
                allTheaters={allTheaters}
              />
            )}
            {activeTab === "eigene-felder" && !isPlatformAdmin && (
              <FieldDefinitionsTab
                theaterId={theaterId}
                initialDefs={fieldDefinitions}
                subscriptionTier={subscriptionTier}
              />
            )}
            {activeTab === "benutzer" && (
              <UsersTab
                initialMembers={isPlatformAdmin ? allMembers : members}
                isPlatformAdmin={isPlatformAdmin}
                allTheaters={allTheaters}
                defaultTheaterId={defaultTheaterId}
                mode={userMode}
                setMode={setUserMode}
                editTarget={userEditTarget}
                setEditTarget={setUserEditTarget}
                formDraft={userFormDraft}
                setFormDraft={setUserFormDraft}
                emptyForm={emptyUserForm}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
