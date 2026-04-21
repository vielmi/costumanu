"use client";

import { useState, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createTheaterAction,
  updateTheaterAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/einstellungen/konfiguration/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Term {
  id: string;
  vocabulary: string;
  label_de: string;
  sort_order: number;
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
}

interface Theater {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  isPlatformAdmin: boolean;
  theaterId: string;
  terms: Term[];
  members: Member[];
  allTheaters: Theater[];
  allMembers: Member[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VOCABULARIES = [
  { key: "gender",           label: "Allgemein"      },
  { key: "sparte",           label: "Sparte"         },
  { key: "clothing_type",    label: "Bekleidungsart" },
  { key: "clothing_subtype", label: "Bekleidungstyp" },
  { key: "material",         label: "Materialart"    },
  { key: "muster",           label: "Muster"         },
  { key: "color",            label: "Farbrichtung"   },
  { key: "temperature",      label: "Temperatur"     },
  { key: "washing_type",     label: "Reinigungsart"  },
  { key: "drying",           label: "Trocknen"       },
  { key: "ironing",          label: "Bügeln"         },
  { key: "floor",            label: "Stockwerk"      },
  { key: "rail",             label: "Stange"         },
  { key: "sector",           label: "Sektor"         },
];

// Lagerort-Vocabularies: pro Theater vom Theater-Admin bearbeitbar.
// Alle anderen Vocabularies sind global (theaterübergreifend) und nur vom Platform Admin bearbeitbar.
const STORAGE_VOCAB_KEYS = ["floor", "rail", "sector"];

const ROLES = [
  { value: "owner",  label: "Owner"  },
  { value: "admin",  label: "Admin"  },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  height: 40, padding: "0 20px", borderRadius: 10,
  background: "var(--primary-900)", color: "#FFFFFF",
  border: "none", cursor: "pointer",
  fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-200)",
  fontWeight: "var(--font-weight-500)",
};

const btnSecondary: React.CSSProperties = {
  height: 40, padding: "0 16px", borderRadius: 10,
  background: "transparent", border: "1px solid var(--neutral-grey-300)",
  cursor: "pointer", fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-200)", color: "var(--neutral-grey-600)",
};


const inputStyle: React.CSSProperties = {
  height: 44, borderRadius: 10,
  border: "1px solid var(--neutral-grey-300)",
  padding: "0 14px", fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-200)", color: "var(--neutral-black)",
  background: "var(--neutral-white)", outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-family-base)",
  fontSize: "var(--font-size-100)", fontWeight: "var(--font-weight-700)",
  color: "var(--neutral-grey-600)", marginBottom: 6,
};

const panelStyle: React.CSSProperties = {
  flex: 1, background: "var(--neutral-white)", borderRadius: "var(--radius-panel) var(--radius-panel) 0 0",
  overflow: "hidden", display: "flex", flexDirection: "column",
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
    setSaving(true); setError(null);
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
    if (err) { setError(err.message); return; }
    if (data) setTerms((prev) => [...prev, data]);
    setNewLabel("");
  }

  async function saveEdit(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("taxonomy_terms").update({ label_de: label }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setTerms((prev) => prev.map((t) => t.id === id ? { ...t, label_de: label } : t));
    setEditingId(null);
  }

  async function deleteTerm(id: string) {
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("taxonomy_terms").delete().eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setTerms((prev) => prev.filter((t) => t.id !== id));
  }

  async function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIdx = vocabTerms.findIndex((t) => t.id === fromId);
    const toIdx   = vocabTerms.findIndex((t) => t.id === toId);
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
  }

  return (
    <div style={{ display: "flex", gap: 20, flex: 1, overflow: "hidden" }}>
      {/* Sidebar */}
      <nav style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {isPlatformAdmin && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-500)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 12px", marginBottom: 6 }}>Theater</div>
            <select
              value={selectedTheaterId}
              onChange={(e) => setSelectedTheaterId(e.target.value)}
              style={{ ...inputStyle, width: "100%", height: 40, fontSize: "var(--font-size-200)" }}
            >
              {allTheaters.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
        {[
          { groupLabel: "Suchbare Eigenschaften", keys: VOCABULARIES.filter(v => !STORAGE_VOCAB_KEYS.includes(v.key)) },
          { groupLabel: "Lagerort",               keys: VOCABULARIES.filter(v =>  STORAGE_VOCAB_KEYS.includes(v.key)) },
        ].map(({ groupLabel, keys }) => (
          <div key={groupLabel} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {groupLabel}
              </span>
              {!isPlatformAdmin && groupLabel !== "Lagerort" && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            {keys.map((v) => {
              const count = terms.filter((t) => t.vocabulary === v.key).length;
              const isActive = activeVocab === v.key;
              return (
                <button key={v.key} type="button" onClick={() => setActiveVocab(v.key)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, padding: "0 12px", borderRadius: 8, border: "none", background: isActive ? "var(--secondary-550)" : "transparent", cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: isActive ? "var(--font-weight-700)" : "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>{v.label}</span>
                  <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", color: "var(--neutral-grey-500)", background: "var(--neutral-grey-200)", borderRadius: 99, padding: "1px 7px", minWidth: 22, textAlign: "center" }}>{count}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Main panel */}
      <div style={panelStyle}>
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
          <h2 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-black)", margin: "0 0 8px" }}>
            {VOCABULARIES.find((v) => v.key === activeVocab)?.label}
          </h2>
          <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-500)", margin: "0 0 32px" }}>
            {canEdit
              ? "Einträge können bearbeitet, umbenannt, gelöscht und neu erstellt werden."
              : "Diese Eigenschaften sind theaterübergreifend definiert und können nur vom Platform Admin bearbeitet werden."}
          </p>

          {error && <ErrorBox message={error} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
            {vocabTerms.map((term) => {
              const isEditing = editingId === term.id;
              const isDragOver = dragOverId === term.id;
              return (
                <div
                  key={term.id}
                  draggable={canEdit}
                  onDragStart={canEdit ? () => { dragId.current = term.id; } : undefined}
                  onDragEnd={canEdit ? () => { dragId.current = null; setDragOverId(null); } : undefined}
                  onDragOver={canEdit ? (e) => { e.preventDefault(); setDragOverId(term.id); } : undefined}
                  onDragLeave={canEdit ? () => setDragOverId(null) : undefined}
                  onDrop={canEdit ? (e) => { e.preventDefault(); if (dragId.current) reorder(dragId.current, term.id); setDragOverId(null); } : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    height: 56, padding: "0 16px", borderRadius: 12,
                    background: isDragOver ? "var(--secondary-600)" : "var(--secondary-500)",
                    border: isDragOver ? "1.5px solid var(--primary-900)" : "1px solid var(--neutral-grey-200)",
                    transition: "background 0.15s, border 0.15s",
                    cursor: canEdit ? "grab" : "default",
                  }}
                >
                  {/* Drag handle — nur wenn bearbeitbar */}
                  {canEdit && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
                      <circle cx="5" cy="4" r="1.5" fill="currentColor"/>
                      <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
                      <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="11" cy="4" r="1.5" fill="currentColor"/>
                      <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
                      <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
                    </svg>
                  )}

                  {isEditing ? (
                    <input autoFocus value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(term.id); if (e.key === "Escape") setEditingId(null); }}
                      style={{ ...inputStyle, flex: 1, height: 36 }} />
                  ) : (
                    <span style={{ flex: 1, fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>
                      {term.label_de}
                    </span>
                  )}

                  {canEdit && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => saveEdit(term.id)} disabled={saving} style={btnPrimary}>Speichern</button>
                          <button type="button" onClick={() => setEditingId(null)} style={btnSecondary}>Abbrechen</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(term.id); setEditLabel(term.label_de); }} style={btnSecondary}>Bearbeiten</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); deleteTerm(term.id); }} disabled={saving} className="btn-danger btn-danger--sm">Löschen</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {vocabTerms.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-400)" }}>
                Noch keine Einträge.
              </div>
            )}
          </div>

          {canEdit && (
            <div style={{ borderTop: "1px solid var(--neutral-grey-200)", paddingTop: 24 }}>
              <div style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-700)", marginBottom: 12 }}>
                Neuer Eintrag
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTerm(); }}
                  placeholder="Bezeichnung…" style={{ ...inputStyle, width: 320 }} />
                <button type="button" onClick={addTerm} disabled={saving || !newLabel.trim()}
                  style={{ ...btnPrimary, opacity: newLabel.trim() ? 1 : 0.4 }}>
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
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setName(""); setSlug(""); setEditTarget(null); setError(null); setMode("create");
  }

  function openEdit(t: Theater) {
    setName(t.name); setSlug(t.slug); setEditTarget(t); setError(null); setMode("edit");
  }

  function handleNameChange(v: string) {
    setName(v);
    if (mode === "create") {
      setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
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
          setTheaters((prev) => prev.map((t) => t.id === editTarget.id ? { ...t, name, slug } : t));
        }
        setMode("list");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div style={{ flex: 1, display: "flex" }}>
        <div style={panelStyle}>
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
            <button type="button" onClick={() => setMode("list")} style={{ ...btnSecondary, marginBottom: 24 }}>← Zurück</button>
            <h2 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-black)", margin: "0 0 32px" }}>
              {mode === "create" ? "Neues Theater anlegen" : "Theater bearbeiten"}
            </h2>
            {error && <ErrorBox message={error} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="z.B. Luzerner Theater" />
              </div>
              <div>
                <label style={labelStyle}>Slug * <span style={{ fontWeight: 400, color: "var(--neutral-grey-400)" }}>(URL-Kennung, nur Kleinbuchstaben + Bindestriche)</span></label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  style={{ ...inputStyle, width: "100%" }} placeholder="z.B. luzerner-theater" />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={handleSave} disabled={isPending || !name.trim() || !slug.trim()}
                  style={{ ...btnPrimary, opacity: name.trim() && slug.trim() ? 1 : 0.4 }}>
                  {isPending ? "Speichert…" : mode === "create" ? "Theater erstellen" : "Änderungen speichern"}
                </button>
                <button type="button" onClick={() => setMode("list")} style={btnSecondary}>Abbrechen</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={panelStyle}>
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-black)", margin: "0 0 4px" }}>Theater</h2>
              <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-500)", margin: 0 }}>
                {theaters.length} {theaters.length === 1 ? "Theater" : "Theater"} auf der Plattform
              </p>
            </div>
            <button type="button" onClick={openCreate} style={btnPrimary}>+ Neues Theater</button>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 140px", gap: 12, padding: "0 16px", marginBottom: 8 }}>
            {["Name", "Slug", ""].map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {theaters.map((t) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 200px 140px", gap: 12, alignItems: "center", height: 60, padding: "0 16px", borderRadius: 12, background: "var(--secondary-500)", border: "1px solid var(--neutral-grey-200)" }}>
                <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>{t.name}</span>
                <span style={{ fontFamily: "monospace", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-500)" }}>{t.slug}</span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => openEdit(t)} style={{ ...btnSecondary, height: 34 }}>Bearbeiten</button>
                </div>
              </div>
            ))}
            {theaters.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-400)" }}>
                Noch keine Theater angelegt.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
}

function UserForm({ initial, onSave, onCancel, isEdit, saving, allTheaters, showTheaterPicker }: {
  initial: UserFormState;
  onSave: (f: UserFormState) => void;
  onCancel: () => void;
  isEdit: boolean;
  saving: boolean;
  allTheaters: Theater[];
  showTheaterPicker: boolean;
}) {
  const [f, setF] = useState<UserFormState>(initial);
  const set = (k: keyof UserFormState, v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const valid = f.firstName.trim() && f.email.trim() && (isEdit || f.password.trim()) && (!showTheaterPicker || f.theaterId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Vorname *</label>
          <input type="text" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Nachname</label>
          <input type="text" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>E-Mail *</label>
        <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" style={{ ...inputStyle, width: "100%" }} />
      </div>
      <div>
        <label style={labelStyle}>Passwort {isEdit ? "(leer lassen = unverändert)" : "*"}</label>
        <input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" style={{ ...inputStyle, width: "100%" }} />
      </div>
      {showTheaterPicker && (
        <div>
          <label style={labelStyle}>Theater *</label>
          <select value={f.theaterId} onChange={(e) => set("theaterId", e.target.value)} style={{ ...inputStyle, width: "100%" }}>
            <option value="">Theater wählen…</option>
            {allTheaters.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label style={labelStyle}>Rolle *</label>
        <select value={f.role} onChange={(e) => set("role", e.target.value)} style={{ ...inputStyle, width: 200 }}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button type="button" onClick={() => onSave(f)} disabled={saving || !valid}
          style={{ ...btnPrimary, opacity: valid ? 1 : 0.4 }}>
          {saving ? "Speichert…" : isEdit ? "Änderungen speichern" : "Benutzer erstellen"}
        </button>
        <button type="button" onClick={onCancel} style={btnSecondary}>Abbrechen</button>
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
}: {
  initialMembers: Member[];
  isPlatformAdmin: boolean;
  allTheaters: Theater[];
  defaultTheaterId: string;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emptyForm: UserFormState = {
    firstName: "", lastName: "", email: "", password: "", role: "viewer",
    theaterId: defaultTheaterId,
  };

  const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

  function handleCreate(f: UserFormState) {
    setError(null);
    startTransition(async () => {
      try {
        await createUserAction({
          email: f.email, password: f.password,
          firstName: f.firstName, lastName: f.lastName,
          role: f.role,
          theaterId: isPlatformAdmin ? f.theaterId : undefined,
        });
        const theaterName = allTheaters.find((t) => t.id === f.theaterId)?.name ?? "";
        setMembers((prev) => [...prev, {
          userId: crypto.randomUUID(),
          email: f.email, firstName: f.firstName, lastName: f.lastName,
          role: f.role, isSelf: false,
          theaterName, theaterId: f.theaterId,
        }]);
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
        });
        setMembers((prev) => prev.map((m) =>
          m.userId === editTarget.userId
            ? { ...m, email: f.email, firstName: f.firstName, lastName: f.lastName, role: f.role }
            : m
        ));
        setMode("list"); setEditTarget(null);
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
      <div style={{ flex: 1, display: "flex" }}>
        <div style={panelStyle}>
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
            <button type="button" onClick={() => { setMode("list"); setEditTarget(null); setError(null); }}
              style={{ ...btnSecondary, marginBottom: 24 }}>← Zurück</button>
            <h2 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-black)", margin: "0 0 32px" }}>
              {mode === "create" ? "Neuen Benutzer erfassen" : "Benutzer bearbeiten"}
            </h2>
            {error && <ErrorBox message={error} />}
            <UserForm
              initial={target
                ? { firstName: target.firstName, lastName: target.lastName, email: target.email, password: "", role: target.role, theaterId: target.theaterId }
                : emptyForm}
              onSave={mode === "create" ? handleCreate : handleEdit}
              onCancel={() => { setMode("list"); setEditTarget(null); setError(null); }}
              isEdit={mode === "edit"}
              saving={isPending}
              allTheaters={allTheaters}
              showTheaterPicker={isPlatformAdmin}
            />
          </div>
        </div>
      </div>
    );
  }

  const showTheaterCol = isPlatformAdmin;
  const gridCols = showTheaterCol
    ? "1fr 1fr 1fr 120px 160px"
    : "1fr 1fr 120px 160px";
  const headers = showTheaterCol
    ? ["Name", "E-Mail", "Theater", "Rolle", ""]
    : ["Name", "E-Mail", "Rolle", ""];

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={panelStyle}>
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-black)", margin: "0 0 4px" }}>
                Benutzerverwaltung
              </h2>
              <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-500)", margin: 0 }}>
                {members.length} {members.length === 1 ? "Benutzer" : "Benutzer"}{isPlatformAdmin ? " auf der Plattform" : ` in ${allTheaters.find(t => t.id === defaultTheaterId)?.name ?? "diesem Theater"}`}
              </p>
            </div>
            <button type="button" onClick={() => { setMode("create"); setError(null); }} style={btnPrimary}>
              + Neuer Benutzer
            </button>
          </div>

          {error && <ErrorBox message={error} />}

          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12, padding: "0 16px", marginBottom: 8 }}>
            {headers.map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div key={`${m.userId}-${m.theaterId}`} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12, alignItems: "center", height: 60, padding: "0 16px", borderRadius: 12, background: "var(--secondary-500)", border: "1px solid var(--neutral-grey-200)" }}>
                <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.firstName} {m.lastName}
                  {m.isSelf && <span style={{ marginLeft: 8, fontSize: "var(--font-size-50)", color: "var(--neutral-grey-400)", background: "var(--neutral-grey-200)", borderRadius: 99, padding: "1px 6px" }}>ich</span>}
                </span>
                <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</span>
                {showTheaterCol && (
                  <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.theaterName}</span>
                )}
                <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)", fontWeight: "var(--font-weight-700)", color: "var(--secondary-800)", background: "var(--secondary-600)", borderRadius: 99, padding: "3px 10px", textAlign: "center", width: "fit-content" }}>
                  {roleLabel(m.role)}
                </span>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => { setEditTarget(m); setMode("edit"); setError(null); }} style={{ ...btnSecondary, height: 34 }}>Bearbeiten</button>
                  {!m.isSelf && (
                    <button type="button" onClick={() => setDeleteTarget(m)} disabled={isPending} className="btn-danger btn-danger--sm">Löschen</button>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-400)" }}>
                Noch keine Benutzer.
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <>
          <div onClick={() => setDeleteTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "var(--overlay-medium)" }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 2001,
            background: "var(--neutral-white)",
            borderRadius: "24px 24px 0 0",
            padding: "28px 20px 40px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--neutral-grey-200)", alignSelf: "center", marginBottom: 8 }} />
            <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-325)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-600)", marginBottom: 4 }}>
              Benutzer löschen?
            </p>
            <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-400)", marginBottom: 8 }}>
              {deleteTarget.email} wird unwiderruflich gelöscht und kann nicht wiederhergestellt werden.
            </p>
            <button
              type="button"
              onClick={() => { handleDelete(deleteTarget.userId); setDeleteTarget(null); }}
              disabled={isPending}
              style={{ height: "var(--button-height-md)", borderRadius: "var(--radius-md)", background: "none", border: "1.5px solid var(--primary-900)", color: "var(--primary-900)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-250)", fontWeight: "var(--font-weight-500)", cursor: "pointer" }}
            >
              Endgültig löschen
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              style={{ height: "var(--button-height-md)", borderRadius: "var(--radius-md)", background: "var(--secondary-900)", border: "none", color: "var(--neutral-white)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-250)", fontWeight: "var(--font-weight-500)", cursor: "pointer" }}
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Error box ────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ background: "var(--accent-02)", border: "1px solid var(--color-error)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--color-error)" }}>
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
}: Props) {
  type TabKey = "theater" | "merkmale" | "benutzer";
  const [activeTab, setActiveTab] = useState<TabKey>(isPlatformAdmin ? "theater" : "merkmale");

  const tabs = isPlatformAdmin
    ? [
        { key: "theater"  as TabKey, label: "Theater"         },
        { key: "merkmale" as TabKey, label: "Kostüm-Merkmale" },
        { key: "benutzer" as TabKey, label: "Benutzer"        },
      ]
    : [
        { key: "merkmale" as TabKey, label: "Kostüm-Merkmale" },
        { key: "benutzer" as TabKey, label: "Benutzer"        },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Title + Tabs */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 24, padding: "24px 40px 0" }}>
        <h1 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-500)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-700)", margin: 0 }}>
          Konfiguration
        </h1>
        <span style={{
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
          color: isPlatformAdmin ? "var(--primary-900)" : "var(--neutral-grey-500)",
          background: isPlatformAdmin ? "rgba(181,155,58,0.12)" : "var(--neutral-grey-200)",
          borderRadius: 99, padding: "2px 10px",
          fontWeight: isPlatformAdmin ? "var(--font-weight-700)" : "var(--font-weight-500)",
        }}>
          {isPlatformAdmin ? "Platform Admin" : "Admin"}
        </span>
        <div style={{ display: "flex", gap: 4, marginLeft: 16 }}>
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              style={{
                height: 40, padding: "0 20px", borderRadius: 10, border: "none",
                background: activeTab === t.key ? "var(--page-bg)" : "transparent",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                fontWeight: activeTab === t.key ? "var(--font-weight-700)" : "var(--font-weight-500)",
                color: activeTab === t.key ? "var(--neutral-grey-700)" : "var(--neutral-grey-500)",
                cursor: "pointer",
                boxShadow: activeTab === t.key ? "var(--shadow-100)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "0 24px 24px" }}>
        {activeTab === "theater" && isPlatformAdmin && (
          <TheaterTab initialTheaters={allTheaters} />
        )}
        {activeTab === "merkmale" && (
          <TaxonomyTab
            theaterId={theaterId}
            initialTerms={terms}
            isPlatformAdmin={isPlatformAdmin}
            allTheaters={allTheaters}
          />
        )}
        {activeTab === "benutzer" && (
          <UsersTab
            initialMembers={isPlatformAdmin ? allMembers : members}
            isPlatformAdmin={isPlatformAdmin}
            allTheaters={allTheaters}
            defaultTheaterId={isPlatformAdmin ? (allTheaters[0]?.id ?? "") : theaterId}
          />
        )}
      </div>
    </div>
  );
}
