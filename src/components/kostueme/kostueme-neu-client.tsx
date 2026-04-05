"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TaxTerm { id: string; label_de: string; }

interface Taxonomy {
  genders: TaxTerm[];
  clothingTypes: TaxTerm[];
  materials: TaxTerm[];
  colors: TaxTerm[];
  epochs: TaxTerm[];
  sparten: TaxTerm[];
}

interface Props {
  theaterId: string;
  costumeType: "single" | "ensemble" | "serie";
  taxonomy: Taxonomy;
}

const NAV_SECTIONS = [
  { id: "kategorie",   label: "Kategorie",   icon: "icon-category"  },
  { id: "material",    label: "Material",    icon: "icon-material"  },
  { id: "bilder",      label: "Bilder",      icon: "icon-image-filled" },
  { id: "masse",       label: "Masse",       icon: "icon-measuring" },
  { id: "lagerort",    label: "Lagerort",    icon: "icon-location"  },
  { id: "infos",       label: "ID & Infos",  icon: "icon-list"      },
  { id: "nachrichten", label: "Nachrichten", icon: "icon-chat"      },
];

// Gender cards — static list with icons
const GENDER_CARDS = [
  { id: "damen",   label: "Damen",   icon: "icon-female"   },
  { id: "herren",  label: "Herren",  icon: "icon-male"     },
  { id: "unisex",  label: "Unisex",  icon: "icon-unisex"   },
  { id: "kinder",  label: "Kinder",  icon: "icon-children" },
  { id: "tier",    label: "Tier",    icon: "icon-animal"   },
  { id: "fantasy", label: "Fantasy", icon: "icon-fantasy"  },
];

const EPOCHE_PILLS = [
  "Antike", "Frühmittelalter", "Hochmittelalter", "Spätmittelalter",
  "Renaissance", "Barock", "Rokoko", "Klassizismus", "Empire", "Biedermeier",
  "Gründerzeit", "Jugendstil", "Zwanziger Jahre", "Dreissiger & Vierziger Jahre",
  "Fünfziger & Sechziger Jahre", "Siebziger & Achtziger Jahre", "Zeitgenössisch",
];

const SECTION_GAP = 40;
const HEADER_H = 72;
const NAV_W = 209;
const CONTENT_PADDING_LEFT = 85;

// ─── small helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "var(--font-family-base)",
      fontSize: "var(--font-size-200)",
      fontWeight: "var(--font-weight-500)",
      color: "var(--neutral-grey-600)",
      marginBottom: 6,
    }}>
      {children}
    </label>
  );
}

function SectionHeading({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <Image src={`/icons/${icon}.svg`} alt="" width={22} height={22} />
      <h3 style={{
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-400)",
        fontWeight: "var(--font-weight-700)",
        color: "var(--neutral-grey-700)",
        margin: 0,
      }}>
        {children}
      </h3>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: 48,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--neutral-grey-300)",
        padding: "0 14px",
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-300)",
        fontWeight: "var(--font-weight-400)",
        color: "var(--neutral-grey-700)",
        outline: "none",
        background: "#FFFFFF",
        boxSizing: "border-box",
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--neutral-grey-300)",
        padding: "12px 14px",
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-300)",
        fontWeight: "var(--font-weight-400)",
        color: "var(--neutral-grey-700)",
        outline: "none",
        background: "#FFFFFF",
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

function SelectDropdown({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: TaxTerm[]; placeholder?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 48,
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--neutral-grey-300)",
          padding: "0 40px 0 14px",
          fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-300)",
          fontWeight: "var(--font-weight-400)",
          color: value ? "var(--neutral-grey-700)" : "var(--neutral-grey-400)",
          background: "#FFFFFF",
          outline: "none",
          appearance: "none",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.id} value={o.id}>{o.label_de}</option>)}
      </select>
      <Image
        src="/icons/icon-arrow-dropdown-down.svg"
        alt=""
        width={16}
        height={16}
        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  );
}

function TagPills({ selected, onToggle, options }: { selected: string[]; onToggle: (id: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: "var(--radius-full)",
              border: `1px solid ${active ? "var(--primary-900)" : "var(--neutral-grey-300)"}`,
              background: active ? "var(--primary-900)" : "#FFFFFF",
              color: active ? "#FFFFFF" : "var(--neutral-grey-600)",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              fontWeight: "var(--font-weight-500)",
              cursor: "pointer",
              transition: "all 150ms ease",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Gender Select Cards (design-system §6.3) ─────────────────────────────────
function GenderCards({ selected, onToggle }: { selected: string; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {GENDER_CARDS.map((g) => {
        const active = selected === g.id;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onToggle(g.id)}
            style={{
              width: 100,
              height: 93,
              borderRadius: 12,
              border: `1px solid var(--secondary-700)`,
              background: active ? "var(--secondary-700)" : "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 12,
              gap: 6,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            <Image
              src={`/icons/${g.icon}.svg`}
              alt={g.label}
              width={28}
              height={28}
              style={{ filter: active ? "invert(1)" : "none", opacity: active ? 1 : 0.7 }}
            />
            <span style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              fontWeight: "var(--font-weight-500)",
              color: active ? "#FFFFFF" : "var(--secondary-800)",
              lineHeight: 1.5,
            }}>
              {g.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function KostuemeNeuClient({ theaterId, costumeType, taxonomy }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState("kategorie");
  const [saving, setSaving] = useState(false);

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Image uploads
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    genderId: "",          // single-select via GenderCards
    clothingTypeId: "",
    materialIds: [] as string[],
    colorIds: [] as string[],
    epochLabels: [] as string[],   // static pill labels
    spartanIds: [] as string[],
    sizeLabel: "",
    chest: "", waist: "", hip: "", backLength: "", shoulderWidth: "",
    storageLocation: "",
    barcodeId: "",
    conditionGrade: "3",
    productionTitle: "", productionYear: "", actorName: "", roleName: "",
    notes: "",
  });

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function toggleArr(key: "materialIds" | "colorIds" | "spartanIds", id: string) {
    setForm((f) => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  }
  function toggleEpoche(label: string) {
    setForm((f) => {
      const arr = f.epochLabels;
      return { ...f, epochLabels: arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label] };
    });
  }

  // Scroll-spy
  const handleScroll = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    let current = NAV_SECTIONS[0].id;
    for (const sec of NAV_SECTIONS) {
      const ref = sectionRefs.current[sec.id];
      if (ref && ref.offsetTop - 40 <= scrollTop) current = sec.id;
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  function scrollToSection(id: string) {
    const ref = sectionRefs.current[id];
    if (ref && mainRef.current) {
      mainRef.current.scrollTo({ top: ref.offsetTop - 16, behavior: "smooth" });
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // Map gender id back to taxonomy term id for DB
  const genderTermId = taxonomy.genders.find(
    (g) => g.label_de.toLowerCase() === form.genderId
  )?.id ?? null;

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data: costume, error: costumeErr } = await supabase
        .from("costumes")
        .insert({
          theater_id: theaterId,
          name: form.name,
          description: form.description || null,
          gender_term_id: genderTermId,
          clothing_type_id: form.clothingTypeId || null,
          is_ensemble: costumeType === "ensemble",
        })
        .select("id")
        .single();

      if (costumeErr || !costume) throw costumeErr;

      const taxRelations: { costume_id: string; term_id: string }[] = [
        ...form.materialIds,
        ...form.colorIds,
        ...form.spartanIds,
      ].map((term_id) => ({ costume_id: costume.id, term_id }));

      if (taxRelations.length > 0) {
        await supabase.from("costume_taxonomy").insert(taxRelations);
      }

      await supabase.from("costume_items").insert({
        costume_id: costume.id,
        theater_id: theaterId,
        barcode_id: form.barcodeId || null,
        size_label: form.sizeLabel || null,
        size_data: {
          chest: form.chest || null,
          waist: form.waist || null,
          hip: form.hip || null,
          back_length: form.backLength || null,
          shoulder_width: form.shoulderWidth || null,
        },
        condition_grade: form.conditionGrade ? Number(form.conditionGrade) : null,
        current_status: "available",
        storage_location_path: form.storageLocation || null,
        is_public_for_rent: false,
      });

      if (form.productionTitle) {
        await supabase.from("costume_provenance").insert({
          costume_id: costume.id,
          production_title: form.productionTitle,
          year: form.productionYear ? Number(form.productionYear) : null,
          actor_name: form.actorName || null,
          role_name: form.roleName || null,
        });
      }

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const ext = img.file.name.split(".").pop() ?? "jpg";
        const path = `${theaterId}/${costume.id}/${i}.${ext}`;
        await supabase.storage.from("costume-images").upload(path, img.file);
        await supabase.from("costume_media").insert({ costume_id: costume.id, storage_path: path, sort_order: i });
      }

      router.push(`/costume/${costume.id}`);
    } catch {
      setSaving(false);
    }
  }

  const spartanOptions = taxonomy.sparten.map((s) => ({ id: s.id, label: s.label_de }));
  const materialOptions = taxonomy.materials.map((m) => ({ id: m.id, label: m.label_de }));
  const colorOptions = taxonomy.colors.map((c) => ({ id: c.id, label: c.label_de }));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--secondary-500)", overflow: "hidden" }}>

      {/* ═══ Header ═══ */}
      <div style={{
        height: HEADER_H,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        background: "var(--secondary-500)",
        padding: "0 20px",
        gap: 14,
      }}>
        {/* Logo K + kostüm+ */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, background: "#0D0D0D", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--font-family-base)", fontWeight: "var(--font-weight-700)", fontSize: 18, color: "#F5C842", lineHeight: 1 }}>K</span>
          </div>
          <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-350)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-700)", whiteSpace: "nowrap" }}>
            kostüm+
          </span>
        </Link>

        {/* Avatar with camera overlay */}
        <div
          style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
          onClick={() => avatarInputRef.current?.click()}
        >
          <div style={{
            width: 42, height: 42,
            borderRadius: "50%",
            background: "var(--neutral-grey-300)",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Image src="/icons/icon-avatar.svg" alt="" width={20} height={20} style={{ opacity: 0.5 }} />
            )}
          </div>
          <div style={{
            position: "absolute", bottom: -1, right: -1,
            width: 18, height: 18,
            borderRadius: "50%",
            background: "var(--primary-900)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid var(--secondary-500)",
          }}>
            <Image src="/icons/icon-camera.svg" alt="" width={9} height={9} style={{ filter: "invert(1)" }} />
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>

        {/* Spacer — three-dot menu in centre */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <button type="button" style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Image src="/icons/icon-more.svg" alt="Mehr" width={22} height={22} />
          </button>
        </div>

        {/* Camera filled circle */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          title="Bilder hinzufügen"
          style={{
            width: 40, height: 40,
            borderRadius: "50%",
            background: "#0D0D0D",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Image src="/icons/icon-camera-filled.svg" alt="Bilder" width={20} height={20} style={{ filter: "invert(1)" }} />
        </button>

        {/* Speichern */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          style={{
            height: 40,
            padding: "0 20px",
            borderRadius: "var(--radius-sm)",
            background: saving || !form.name.trim() ? "var(--neutral-grey-300)" : "var(--primary-900)",
            color: "#FFFFFF",
            border: "none",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            fontWeight: "var(--font-weight-700)",
            cursor: saving || !form.name.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background 150ms ease",
          }}
        >
          {saving ? "Speichert..." : "Speichern"}
        </button>

        {/* X — borderless */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36,
          flexShrink: 0,
          textDecoration: "none",
        }}>
          <Image src="/icons/icon-close-medium.svg" alt="Schliessen" width={22} height={22} />
        </Link>
      </div>

      {/* ═══ Body ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "0 12px 12px", gap: 12 }}>

        {/* Left sticky nav */}
        <nav style={{
          width: NAV_W,
          flexShrink: 0,
          background: "transparent",
          borderRadius: "var(--radius-xl)",
          display: "flex",
          flexDirection: "column",
          padding: "16px 8px",
          gap: 2,
          overflowY: "auto",
        }}>
          {NAV_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: 160,
                  height: 50,
                  paddingLeft: 12,
                  paddingRight: 12,
                  gap: 10,
                  borderRadius: 8,
                  background: isActive ? "#D6DFDD" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Image
                  src={`/icons/${sec.icon}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  style={{ flexShrink: 0, opacity: 0.8 }}
                />
                <span style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-500)",
                  color: "var(--neutral-grey-600)",
                  whiteSpace: "nowrap",
                }}>
                  {sec.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Scrollable form — white rounded card */}
        <main
          ref={mainRef}
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#FFFFFF",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleImageAdd}
          />
          <div style={{ padding: `36px 40px 80px ${CONTENT_PADDING_LEFT}px` }}>

            {/* ─── Kategorie ─── */}
            <section
              id="kategorie"
              ref={(el) => { sectionRefs.current["kategorie"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-category">Kategorie</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Name */}
                <div>
                  <FieldLabel>Name des Kostüms *</FieldLabel>
                  <TextInput
                    value={form.name}
                    onChange={(v) => setField("name", v)}
                    placeholder="z.B. Grüner Satin-Jumpsuit"
                  />
                </div>

                {/* Geschlecht — icon cards */}
                <div>
                  <FieldLabel>Geschlecht</FieldLabel>
                  <GenderCards
                    selected={form.genderId}
                    onToggle={(id) => setField("genderId", form.genderId === id ? "" : id)}
                  />
                </div>

                {/* Sparte — pills */}
                <div>
                  <FieldLabel>Sparte</FieldLabel>
                  <TagPills
                    selected={form.spartanIds}
                    onToggle={(id) => toggleArr("spartanIds", id)}
                    options={spartanOptions}
                  />
                </div>

                {/* Bekleidungsart — dropdown */}
                <div>
                  <FieldLabel>Bekleidungsart</FieldLabel>
                  <SelectDropdown
                    value={form.clothingTypeId}
                    onChange={(v) => setField("clothingTypeId", v)}
                    options={taxonomy.clothingTypes}
                    placeholder="Auswählen"
                  />
                </div>

                {/* Epoche — static pills */}
                <div>
                  <FieldLabel>Epoche</FieldLabel>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {EPOCHE_PILLS.map((label) => {
                      const active = form.epochLabels.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleEpoche(label)}
                          style={{
                            height: 36, padding: "0 14px",
                            borderRadius: "var(--radius-full)",
                            border: `1px solid ${active ? "var(--primary-900)" : "var(--neutral-grey-300)"}`,
                            background: active ? "var(--primary-900)" : "#FFFFFF",
                            color: active ? "#FFFFFF" : "var(--neutral-grey-600)",
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-200)",
                            fontWeight: "var(--font-weight-500)",
                            cursor: "pointer",
                            transition: "all 150ms ease",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Beschreibung */}
                <div>
                  <FieldLabel>Beschreibung</FieldLabel>
                  <TextArea
                    value={form.description}
                    onChange={(v) => setField("description", v)}
                    placeholder="Kurze Beschreibung des Kostüms..."
                    rows={3}
                  />
                </div>
              </div>
            </section>

            <Divider />

            {/* ─── Material ─── */}
            <section
              id="material"
              ref={(el) => { sectionRefs.current["material"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-material">Material</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <FieldLabel>Materialien</FieldLabel>
                  <TagPills selected={form.materialIds} onToggle={(id) => toggleArr("materialIds", id)} options={materialOptions} />
                </div>
                <div>
                  <FieldLabel>Farben</FieldLabel>
                  <TagPills selected={form.colorIds} onToggle={(id) => toggleArr("colorIds", id)} options={colorOptions} />
                </div>
              </div>
            </section>

            <Divider />

            {/* ─── Bilder ─── */}
            <section
              id="bilder"
              ref={(el) => { sectionRefs.current["bilder"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-image-filled">Bilder</SectionHeading>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: "relative", width: 100, height: 100 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.preview}
                      alt=""
                      style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        width: 22, height: 22,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Image src="/icons/icon-close-small.svg" alt="" width={12} height={12} style={{ filter: "invert(1)" }} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    width: 100, height: 100,
                    borderRadius: "var(--radius-sm)",
                    border: "1.5px dashed var(--neutral-grey-400)",
                    background: "var(--neutral-grey-100)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, cursor: "pointer",
                  }}
                >
                  <Image src="/icons/icon-camera.svg" alt="" width={24} height={24} style={{ opacity: 0.5 }} />
                  <span style={{ fontFamily: "var(--font-family-base)", fontSize: 11, color: "var(--neutral-grey-500)", fontWeight: "var(--font-weight-500)" }}>
                    Hinzufügen
                  </span>
                </button>
              </div>
            </section>

            <Divider />

            {/* ─── Masse ─── */}
            <section
              id="masse"
              ref={(el) => { sectionRefs.current["masse"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-measuring">Masse</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <FieldLabel>Konfektionsgrösse</FieldLabel>
                  <TextInput value={form.sizeLabel} onChange={(v) => setField("sizeLabel", v)} placeholder="z.B. 38, M, XL" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><FieldLabel>Brust (cm)</FieldLabel><TextInput value={form.chest} onChange={(v) => setField("chest", v)} placeholder="z.B. 92" /></div>
                  <div><FieldLabel>Taille (cm)</FieldLabel><TextInput value={form.waist} onChange={(v) => setField("waist", v)} placeholder="z.B. 72" /></div>
                  <div><FieldLabel>Hüfte (cm)</FieldLabel><TextInput value={form.hip} onChange={(v) => setField("hip", v)} placeholder="z.B. 98" /></div>
                  <div><FieldLabel>Rückenlänge (cm)</FieldLabel><TextInput value={form.backLength} onChange={(v) => setField("backLength", v)} placeholder="z.B. 42" /></div>
                  <div><FieldLabel>Schulterbreite (cm)</FieldLabel><TextInput value={form.shoulderWidth} onChange={(v) => setField("shoulderWidth", v)} placeholder="z.B. 38" /></div>
                </div>
              </div>
            </section>

            <Divider />

            {/* ─── Lagerort ─── */}
            <section
              id="lagerort"
              ref={(el) => { sectionRefs.current["lagerort"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-location">Lagerort</SectionHeading>
              <div>
                <FieldLabel>Lagerort-Pfad</FieldLabel>
                <TextInput
                  value={form.storageLocation}
                  onChange={(v) => setField("storageLocation", v)}
                  placeholder="z.B. Bern.Stock1.Regal3.Box7"
                />
                <p style={{ marginTop: 6, fontFamily: "var(--font-family-base)", fontSize: 12, color: "var(--neutral-grey-400)" }}>
                  Format: Haus.Stockwerk.Regal.Box
                </p>
              </div>
            </section>

            <Divider />

            {/* ─── ID & Infos ─── */}
            <section
              id="infos"
              ref={(el) => { sectionRefs.current["infos"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-list">ID & Infos</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <FieldLabel>Barcode / ID</FieldLabel>
                  <TextInput value={form.barcodeId} onChange={(v) => setField("barcodeId", v)} placeholder="Leer lassen für Auto-Generierung" />
                </div>
                <div>
                  <FieldLabel>Zustand (1 = schlecht, 5 = neuwertig)</FieldLabel>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["1", "2", "3", "4", "5"].map((g) => (
                      <button key={g} type="button" onClick={() => setField("conditionGrade", g)} style={{
                        width: 44, height: 44,
                        borderRadius: "var(--radius-sm)",
                        border: `1.5px solid ${form.conditionGrade === g ? "var(--primary-900)" : "var(--neutral-grey-300)"}`,
                        background: form.conditionGrade === g ? "var(--primary-900)" : "#FFFFFF",
                        color: form.conditionGrade === g ? "#FFFFFF" : "var(--neutral-grey-600)",
                        fontFamily: "var(--font-family-base)",
                        fontWeight: "var(--font-weight-700)",
                        fontSize: "var(--font-size-300)",
                        cursor: "pointer",
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Aufführung / Produktion</FieldLabel>
                    <TextInput value={form.productionTitle} onChange={(v) => setField("productionTitle", v)} placeholder="z.B. Fidelio" />
                  </div>
                  <div><FieldLabel>Jahr</FieldLabel><TextInput value={form.productionYear} onChange={(v) => setField("productionYear", v)} placeholder="z.B. 2024" /></div>
                  <div><FieldLabel>Darsteller</FieldLabel><TextInput value={form.actorName} onChange={(v) => setField("actorName", v)} placeholder="Name" /></div>
                  <div><FieldLabel>Rolle</FieldLabel><TextInput value={form.roleName} onChange={(v) => setField("roleName", v)} placeholder="Rollenname" /></div>
                </div>
              </div>
            </section>

            <Divider />

            {/* ─── Nachrichten ─── */}
            <section
              id="nachrichten"
              ref={(el) => { sectionRefs.current["nachrichten"] = el; }}
              style={{ marginBottom: SECTION_GAP }}
            >
              <SectionHeading icon="icon-chat">Nachrichten</SectionHeading>
              <div>
                <FieldLabel>Interne Notizen</FieldLabel>
                <TextArea
                  value={form.notes}
                  onChange={(v) => setField("notes", v)}
                  placeholder="Interne Anmerkungen zum Kostüm..."
                  rows={5}
                />
                <p style={{ marginTop: 8, fontFamily: "var(--font-family-base)", fontSize: 12, color: "var(--neutral-grey-400)" }}>
                  Chat-Nachrichten werden nach dem Speichern verfügbar.
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--neutral-grey-200)", marginBottom: SECTION_GAP }} />;
}
