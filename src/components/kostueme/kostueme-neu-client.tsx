"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/layout/app-logo";

interface TaxTerm { id: string; label_de: string; }

interface Taxonomy {
  genders: TaxTerm[];
  clothingTypes: TaxTerm[];
  clothingSubtypes: TaxTerm[];
  materials: TaxTerm[];
  musters: TaxTerm[];
  colors: TaxTerm[];
  sparten: TaxTerm[];
  temperatures: TaxTerm[];
  washingTypes: TaxTerm[];
  dryings: TaxTerm[];
  ironings: TaxTerm[];
}

// Muster icon mapping
const MUSTER_ICON: Record<string, string> = {
  uni:       "icon-material-solid",
  kariert:   "icon-material-squared",
  gestreift: "icon-material-stripe",
  gepunktet: "icon-material-pointed",
  floral:    "icon-material-floral",
  gemustert: "icon-material-batik",
  verlauf:   "icon-material-gradient",
  abstrakt:  "icon-material-gradient",
  anderes:   "icon-material-divers",
};

function getMusterIcon(label: string): string {
  return MUSTER_ICON[label.toLowerCase()] ?? "icon-material-divers";
}

// Color hex map for swatches
const COLOR_HEX: Record<string, string> = {
  beige: "#D4C5A9", blau: "#4A90D9", bordeaux: "#7B1C35", braun: "#8B5E3C",
  gelb: "#F5D800", gold: "#C8A84B", grau: "#9B9B9B", grün: "#3CB34A",
  orange: "#F57C00", rosa: "#F48FB1", rot: "#E53935", schwarz: "#000000",
  silber: "#B0B8BE", türkis: "#00BCD4", violett: "#9B59B6", weiss: "#FFFFFF",
  transparent: "transparent",
  multicolor: "multicolor",
};

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

const GENDER_CARDS = [
  { id: "damen",   label: "Damen",   icon: "icon-female"   },
  { id: "herren",  label: "Herren",  icon: "icon-male"     },
  { id: "unisex",  label: "Unisex",  icon: "icon-unisex"   },
  { id: "kinder",  label: "Kinder",  icon: "icon-children" },
  { id: "tier",    label: "Tier",    icon: "icon-animal"   },
  { id: "fantasy", label: "Fantasy", icon: "icon-fantasy"  },
];



const KONFEKTIONS_SIZES_INT = ["XS", "S", "M", "L", "XL", "XXL"];
const KONFEKTIONS_SIZES_EU = ["≤ 32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "≥ 54"];

const HEADER_H = 72;
const NAV_W = 209;

// ─── Pill component ──────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 44,
        padding: "10px 25px",
        borderRadius: 44,
        border: "1px solid var(--secondary-800)",
        background: active ? "var(--secondary-500)" : "var(--neutral-grey-50)",
        color: active ? "var(--secondary-800)" : "var(--secondary-700)",
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-300)",
        fontWeight: "var(--font-weight-500)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 150ms ease",
      }}
    >
      {label}
      {active && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <line x1="1" y1="1" x2="11" y2="11" stroke="var(--secondary-800)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11" y1="1" x2="1" y2="11" stroke="var(--secondary-800)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

// ─── Search card (Aufführung fields) ─────────────────────────────────────────
function SearchCard({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      background: "var(--secondary-500)",
      borderRadius: "var(--radius-md)",
      padding: "13px 13px 16px",
      flex: 1,
    }}>
      <div style={{
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-350)",
        fontWeight: "var(--font-weight-500)",
        color: "var(--neutral-black)",
        marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        border: "1px solid var(--neutral-black)",
        borderRadius: 47,
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 16px",
        background: "var(--secondary-500)",
      }}>
        <Image src="/icons/icon-search.svg" alt="" width={25} height={25} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="durchsuchen"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            fontWeight: "var(--font-weight-400)",
            color: "var(--neutral-grey-600)",
            letterSpacing: "0.002em",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}

// ─── Flat name input ──────────────────────────────────────────────────────────
function FlatInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        maxWidth: 599,
        height: 70,
        background: "var(--neutral-grey-100)",
        border: "none",
        borderBottom: "1px solid var(--neutral-black)",
        padding: "0 20px",
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-400)",
        fontWeight: "var(--font-weight-500)",
        color: "var(--neutral-black)",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

// ─── Measurement input ────────────────────────────────────────────────────────
function MeasureInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-300)",
        fontWeight: "var(--font-weight-500)",
        color: "var(--neutral-grey-600)",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 222,
            height: 60,
            background: "var(--neutral-grey-100)",
            border: "none",
            borderBottom: "1px solid var(--neutral-black)",
            padding: "0 16px",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-350)",
            fontWeight: "var(--font-weight-400)",
            color: "var(--neutral-black)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <span style={{
          fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-350)",
          fontWeight: "var(--font-weight-400)",
          color: "var(--neutral-black)",
        }}>cm</span>
      </div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, marginLeft: -55 }}>
      <Image src={`/icons/${icon}.svg`} alt="" width={30} height={30} />
      <h2 style={{
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-1000)",
        fontWeight: "var(--font-weight-500)",
        letterSpacing: "0.003em",
        lineHeight: "var(--line-height-120)",
        color: "var(--neutral-black)",
        margin: 0,
      }}>
        {children}
      </h2>
    </div>
  );
}

// ─── TextArea ────────────────────────────────────────────────────────────────
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
        background: "var(--neutral-white)",
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

// ─── Sub-heading (H6-medium, 22px) ───────────────────────────────────────────
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-family-base)",
      fontSize: "var(--font-size-500)",
      fontWeight: "var(--font-weight-500)",
      lineHeight: "var(--line-height-150)",
      color: "var(--neutral-black)",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}


// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ id, sectionRef, children }: {
  id: string;
  sectionRef: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      ref={sectionRef}
      style={{
        background: "var(--neutral-white)",
        borderRadius: "40px",
        overflow: "hidden",
        padding: "48px 40px 60px 85px",
        flexShrink: 0,
      }}
    >
      {children}
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function KostuemeNeuClient({ theaterId, costumeType, taxonomy }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState("kategorie");
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    genderId: "",
    clothingTypeLabel: "",
    clothingTypeSearch: "",
    clothingTypeSuggestions: [] as string[],
    materialSearch: "",
    materialIds: [] as string[],
    musterIds: [] as string[],
    colorIds: [] as string[],
    spartanIds: [] as string[],
    temperatureIds: [] as string[],
    washingTypeIds: [] as string[],
    dryingIds: [] as string[],
    ironingIds: [] as string[],
    keineReinigung: false,
    nichtBuegeln: false,
    colorNote: "",
    materialNotes: "",
    sizeLabel: "",
    chest: "", waist: "", hip: "", backLength: "", shoulderWidth: "", legLength: "",
    storageLocation: "",
    barcodeId: "",
    conditionGrade: "3",
    productionTitle: "", productionYear: "", actorName: "", roleName: "",
    notes: "",
  });

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function toggleArr(key: "materialIds" | "musterIds" | "colorIds" | "spartanIds" | "temperatureIds" | "washingTypeIds" | "dryingIds" | "ironingIds", id: string) {
    setForm((f) => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  }

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
          clothing_type_id: taxonomy.clothingTypes.find((t) => t.label_de === form.clothingTypeLabel)?.id ?? null,
          is_ensemble: costumeType === "ensemble",
        })
        .select("id")
        .single();

      if (costumeErr || !costume) throw costumeErr;

      const taxRelations: { costume_id: string; term_id: string }[] = [
        ...form.materialIds,
        ...form.musterIds,
        ...form.colorIds,
        ...form.spartanIds,
        ...form.temperatureIds,
        ...form.washingTypeIds,
        ...form.dryingIds,
        ...form.ironingIds,
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
          leg_length: form.legLength || null,
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
  const musterOptions = taxonomy.musters.map((m) => ({ id: m.id, label: m.label_de }));
  const temperatureOptions = taxonomy.temperatures.map((t) => ({ id: t.id, label: t.label_de }));
  const washingTypeOptions = taxonomy.washingTypes.map((w) => ({ id: w.id, label: w.label_de }));
  const dryingOptions = taxonomy.dryings.map((d) => ({ id: d.id, label: d.label_de }));
  const ironingOptions = taxonomy.ironings.map((i) => ({ id: i.id, label: i.label_de }));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--page-bg)", overflow: "hidden", paddingTop: 20 }}>

      {/* ═══ Header ═══ */}
      <div style={{
        height: HEADER_H,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        background: "var(--page-bg)",
      }}>
        {/* Logo section — same width as sidebar nav */}
        <div style={{
          width: NAV_W,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 20px",
          gap: 8,
          overflow: "hidden",
        }}>
          <AppLogo />
        </div>

        {/* Content row — starts at same x-position as white content card */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 20px 0 24px", gap: 14 }}>

        {/* Two avatar circles */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, position: "relative" }}>
          {/* Avatar 1 — filled, clickable */}
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{
              width: 60, height: 60,
              borderRadius: "50%",
              border: "4px solid var(--secondary-500)",
              background: "var(--neutral-grey-300)",
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              zIndex: 2,
              position: "relative",
            }}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Image src="/icons/icon-avatar.svg" alt="" width={28} height={28} style={{ opacity: 0.6 }} />
            )}
          </div>
          {/* Avatar 2 — empty placeholder */}
          <div style={{
            width: 60, height: 60,
            borderRadius: "50%",
            border: "1px dashed #0B0B0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            marginLeft: -14,
          }}>
            <Image src="/icons/icon-avatar.svg" alt="" width={28} height={28} style={{ opacity: 0.3 }} />
          </div>
          {/* Camera overlay on avatar 1 */}
          <div style={{
            position: "absolute",
            bottom: 0, left: 38,
            width: 22, height: 22,
            borderRadius: "50%",
            background: "#0B0B0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 3,
          }}>
            <Image src="/icons/icon-camera.svg" alt="" width={10} height={10} style={{ filter: "invert(1)" }} />
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>

        {/* icon-more */}
        <button type="button" style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Image src="/icons/icon-more.svg" alt="Mehr" width={32} height={32} />
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Camera filled circle — 50×50 dark */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          title="Bilder hinzufügen"
          style={{
            width: 50, height: 50,
            borderRadius: "50%",
            background: "#242727",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Image src="/icons/icon-camera-filled.svg" alt="Bilder" width={23} height={23} style={{ filter: "invert(1)" }} />
        </button>

        {/* Speichern */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          style={{
            height: 63,
            padding: "0 30px",
            borderRadius: 16,
            background: saving || !form.name.trim() ? "var(--neutral-grey-300)" : "var(--primary-900)",
            color: "var(--neutral-white)",
            border: "none",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-350)",
            fontWeight: "var(--font-weight-500)",
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
        </div>{/* end content row */}
      </div>

      {/* ═══ Body ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "20px 12px 12px", gap: 12 }}>

        {/* Left sticky nav */}
        <nav style={{
          width: NAV_W,
          flexShrink: 0,
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          padding: "16px 8px",
          gap: 2,
          overflowY: "auto",
        }}>
          {NAV_SECTIONS.map((sec, index) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: 166,
                  height: 50,
                  paddingLeft: 12,
                  paddingRight: 12,
                  gap: 10,
                  borderRadius: 8,
                  background: isActive ? "#D6DFDD" : "transparent",
                  border: "none",
                  borderBottom: index < NAV_SECTIONS.length - 1 ? "1px solid var(--secondary-500)" : "none",
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

        {/* Scrollable content — sections as individual cards */}
        <div
          ref={mainRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingTop: 4,
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

          {/* ─── Kategorie ─── */}
          <SectionCard id="kategorie" sectionRef={(el) => { sectionRefs.current["kategorie"] = el; }}>
            <SectionHeading icon="icon-category">Kategorie</SectionHeading>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Name */}
              <div>
                <SubHeading>Name des Kostüms *</SubHeading>
                <FlatInput
                  value={form.name}
                  onChange={(v) => setField("name", v)}
                  placeholder="z.B. Abendkleid aus Satin & Tüll"
                />
              </div>

              {/* Geschlecht */}
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {GENDER_CARDS.map((g) => {
                    const active = form.genderId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setField("genderId", form.genderId === g.id ? "" : g.id)}
                        style={{
                          width: 174,
                          height: 102,
                          borderRadius: 12,
                          border: `1px solid var(--secondary-700)`,
                          background: active ? "var(--secondary-700)" : "var(--neutral-white)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingBottom: 14,
                          gap: 8,
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                      >
                        <Image
                          src={`/icons/${g.icon}.svg`}
                          alt={g.label}
                          width={32}
                          height={32}
                          style={{ filter: active ? "invert(1)" : "none", opacity: active ? 1 : 0.7 }}
                        />
                        <span style={{
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-350)",
                          fontWeight: "var(--font-weight-500)",
                          color: active ? "var(--neutral-white)" : "var(--secondary-800)",
                          lineHeight: 1.5,
                        }}>
                          {g.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sparte */}
              <div>
                <SubHeading>Sparte</SubHeading>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {spartanOptions.map((o) => (
                    <Pill
                      key={o.id}
                      label={o.label}
                      active={form.spartanIds.includes(o.id)}
                      onClick={() => toggleArr("spartanIds", o.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Aufführung — 2×2 search card grid */}
              <div>
                <SubHeading>Aufführung</SubHeading>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <SearchCard label="Epoche" value={form.productionYear} onChange={(v) => setField("productionYear", v)} />
                  <SearchCard label="Stücktitel" value={form.productionTitle} onChange={(v) => setField("productionTitle", v)} />
                  <SearchCard label="Darsteller" value={form.actorName} onChange={(v) => setField("actorName", v)} />
                  <SearchCard label="Rolle" value={form.roleName} onChange={(v) => setField("roleName", v)} />
                </div>
              </div>

              {/* Bekleidungsart — radio grid */}
              <div>
                <SubHeading>Bekleidungsart</SubHeading>

                {/* Radio cards grid */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                  {taxonomy.clothingTypes.map(({ label_de: label }) => {
                      const isActive = form.clothingTypeLabel === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setField("clothingTypeLabel", isActive ? "" : label)}
                          style={{
                            width: 174,
                            height: 60,
                            borderRadius: 12,
                            border: "1px solid #556E68",
                            background: isActive ? "#ECF1EE" : "#FBFBFB",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "0 16px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          <div style={{
                            width: 20, height: 20,
                            borderRadius: "50%",
                            border: "1.5px solid #556E68",
                            background: isActive ? "#556E68" : "transparent",
                            flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isActive && (
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FBFBFB" }} />
                            )}
                          </div>
                          <span style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-300)",
                            fontWeight: "var(--font-weight-500)",
                            color: isActive ? "#556E68" : "#75958D",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Search + suggestions */}
                <SubHeading>Bekleidungstyp hinzufügen</SubHeading>
                <div style={{
                  border: "1px solid #000000",
                  borderRadius: 47,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 16px",
                  background: "#FBFBFB",
                  maxWidth: 400,
                  marginBottom: 20,
                }}>
                  <Image src="/icons/icon-search.svg" alt="" width={25} height={25} />
                  <input
                    type="text"
                    value={form.clothingTypeSearch}
                    onChange={(e) => setField("clothingTypeSearch", e.target.value)}
                    placeholder="durchsuchen"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-200)",
                      fontWeight: "var(--font-weight-400)",
                      color: "var(--neutral-grey-600)",
                      letterSpacing: "0.002em",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-200)",
                  fontWeight: "var(--font-weight-500)",
                  color: "var(--neutral-grey-600)",
                  marginBottom: 10,
                }}>
                  Häufig verwendete Bekleidungstypen
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {taxonomy.clothingSubtypes
                    .filter((t) => !form.clothingTypeSearch || t.label_de.toLowerCase().includes(form.clothingTypeSearch.toLowerCase()))
                    .map((t) => (
                      <Pill
                        key={t.id}
                        label={t.label_de}
                        active={form.clothingTypeSuggestions.includes(t.id)}
                        onClick={() => setForm((f) => ({
                          ...f,
                          clothingTypeSuggestions: f.clothingTypeSuggestions.includes(t.id)
                            ? f.clothingTypeSuggestions.filter((x) => x !== t.id)
                            : [...f.clothingTypeSuggestions, t.id],
                        }))}
                      />
                    ))}
                </div>
              </div>


              {/* Beschreibung */}
              <div>
                <SubHeading>Kostüm Beschreibung & zusätzliche Informationen</SubHeading>
                <TextArea
                  value={form.description}
                  onChange={(v) => setField("description", v)}
                  placeholder="Kurze Beschreibung des Kostüms..."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>

          {/* ─── Material ─── */}
          <SectionCard id="material" sectionRef={(el) => { sectionRefs.current["material"] = el; }}>
            <SectionHeading icon="icon-material">Material</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Materialart */}
              <div>
                <SubHeading>Materialien hinzufügen</SubHeading>
                <div style={{
                  border: "1px solid #000000", borderRadius: 47, height: 60,
                  display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
                  background: "#FBFBFB", maxWidth: 540, marginBottom: 16,
                }}>
                  <Image src="/icons/icon-search.svg" alt="" width={25} height={25} />
                  <input type="text" value={form.materialSearch}
                    onChange={(e) => setField("materialSearch", e.target.value)}
                    placeholder="durchsuchen"
                    style={{ flex: 1, border: "none", background: "transparent", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-600)", letterSpacing: "0.002em", outline: "none" }}
                  />
                </div>
                <div style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-600)", marginBottom: 10 }}>
                  Häufig verwendete Materialien
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {materialOptions
                    .filter((o) => !form.materialSearch || o.label.toLowerCase().includes(form.materialSearch.toLowerCase()))
                    .map((o) => (
                      <Pill key={o.id} label={o.label} active={form.materialIds.includes(o.id)} onClick={() => toggleArr("materialIds", o.id)} />
                    ))}
                </div>
              </div>

              {/* Muster */}
              <div>
                <SubHeading>Muster</SubHeading>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 174px)", gap: 8 }}>
                  {musterOptions.map((o) => {
                    const isActive = form.musterIds.includes(o.id);
                    return (
                      <button key={o.id} type="button" onClick={() => toggleArr("musterIds", o.id)}
                        style={{
                          width: 174, height: 93,
                          display: "flex", flexDirection: "column", alignItems: "center",
                          paddingTop: 14, paddingBottom: 0, gap: 8,
                          borderRadius: 12, cursor: "pointer",
                          border: "1px solid #75958D",
                          background: isActive ? "var(--secondary-700)" : "var(--neutral-white)",
                          boxSizing: "border-box",
                        }}>
                        <span style={{
                          display: "inline-block", width: 32, height: 32, flexShrink: 0,
                          backgroundColor: isActive ? "var(--neutral-white)" : "var(--secondary-700)",
                          WebkitMaskImage: `url(/icons/${getMusterIcon(o.label)}.svg)`,
                          maskImage: `url(/icons/${getMusterIcon(o.label)}.svg)`,
                          WebkitMaskSize: "contain", maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center", maskPosition: "center",
                        }} />
                        <span style={{
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-400)",
                          fontWeight: isActive ? "var(--font-weight-700)" : "var(--font-weight-400)",
                          color: isActive ? "var(--neutral-white)" : "var(--secondary-700)",
                        }}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Farbrichtung */}
              <div>
                <SubHeading>Farbrichtung</SubHeading>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 174px)", gap: 8 }}>
                  {colorOptions.map((o) => {
                    const isActive = form.colorIds.includes(o.id);
                    const labelLower = o.label.toLowerCase();
                    const isMulticolor = labelLower === "multicolor";
                    const isTransparent = labelLower === "transparent";
                    const isLight = labelLower === "weiss" || labelLower === "beige" || labelLower === "silber" || isTransparent;
                    const hex = COLOR_HEX[labelLower] ?? "#CCCCCC";
                    return (
                      <button key={o.id} type="button" onClick={() => toggleArr("colorIds", o.id)}
                        style={{
                          width: 174, height: 54,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "0 14px 0 16px", borderRadius: 12, cursor: "pointer",
                          border: `1px solid ${isActive ? "#556E68" : "#75958D"}`,
                          background: isActive ? "var(--secondary-500)" : "var(--neutral-white)",
                          boxSizing: "border-box",
                        }}>
                        <span style={{
                          fontFamily: "var(--font-family-base)",
                          fontSize: "var(--font-size-350)",
                          fontWeight: "var(--font-weight-400)",
                          color: "#75958D",
                        }}>{o.label}</span>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          boxSizing: "border-box",
                          border: isLight ? "1px solid #DCDCDC" : "none",
                          ...(isMulticolor
                            ? { background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }
                            : isTransparent
                            ? { backgroundImage: "linear-gradient(45deg, #D0D0D0 25%, #FFFFFF 25%, #FFFFFF 75%, #D0D0D0 75%), linear-gradient(45deg, #D0D0D0 25%, #FFFFFF 25%, #FFFFFF 75%, #D0D0D0 75%)", backgroundSize: "8px 8px", backgroundPosition: "0 0, 4px 4px" }
                            : { background: hex }
                          ),
                        }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zusätzliche Farbbezeichnung */}
              <div>
                <SubHeading>Zusätzliche Farbbezeichnung</SubHeading>
                <input
                  type="text"
                  value={form.colorNote}
                  onChange={(e) => setField("colorNote", e.target.value)}
                  placeholder=""
                  style={{
                    width: "100%", maxWidth: 540, height: 56,
                    borderRadius: 10, border: "1px solid var(--neutral-grey-300)",
                    padding: "0 16px", fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-400)", color: "var(--neutral-grey-700)",
                    background: "var(--neutral-white)", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Reinigung */}
              <div>
                <SubHeading>Reinigung</SubHeading>
                {/* Reinigung Card: volle Breite */}
                <div style={{ border: "1px solid var(--secondary-700)", borderRadius: 16, padding: 24, marginBottom: 0 }}>
                  {/* Icon + Titel */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <Image src="/icons/icon-wasch.svg" alt="" width={28} height={28} />
                    <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>
                      Temperatur &amp; Reinigungsart
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 24 }}>
                    {/* Temperatur-Kacheln 3×2 */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 90px)", gridTemplateRows: "repeat(2, 80px)", gap: 8 }}>
                      {temperatureOptions.map((o) => {
                        const isActive = form.temperatureIds.includes(o.id);
                        return (
                          <button key={o.id} type="button" onClick={() => toggleArr("temperatureIds", o.id)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              borderRadius: 12, cursor: "pointer", border: "1px solid var(--secondary-700)",
                              background: isActive ? "var(--secondary-700)" : "var(--neutral-white)",
                              fontFamily: "var(--font-family-base)",
                              fontSize: "var(--font-size-400)",
                              fontWeight: isActive ? "var(--font-weight-700)" : "var(--font-weight-400)",
                              color: isActive ? "var(--neutral-white)" : "var(--neutral-grey-700)",
                            }}>
                            {o.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Reinigungsart Checkboxen */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      {washingTypeOptions.map((o) => {
                        const isActive = form.washingTypeIds.includes(o.id);
                        return (
                          <button key={o.id} type="button" onClick={() => toggleArr("washingTypeIds", o.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12, height: 54,
                              padding: "0 16px", borderRadius: 12, cursor: "pointer",
                              border: "1px solid var(--secondary-700)",
                              background: "var(--neutral-white)", textAlign: "left",
                            }}>
                            {/* Checkbox */}
                            <div style={{
                              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                              border: isActive ? "none" : "2px solid var(--secondary-700)",
                              background: "transparent", position: "relative",
                            }}>
                              {isActive && (
                                <div style={{
                                  position: "absolute", top: 5, left: 5,
                                  width: 20, height: 20, borderRadius: 6,
                                  background: "var(--secondary-700)",
                                }} />
                              )}
                            </div>
                            <span style={{
                              fontFamily: "var(--font-family-base)",
                              fontSize: "var(--font-size-400)",
                              fontWeight: "var(--font-weight-400)",
                              color: "var(--neutral-grey-700)",
                            }}>{o.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggle: Keine Reinigung möglich */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, keineReinigung: !f.keineReinigung }))}
                      style={{
                        width: 65, height: 34, borderRadius: 72, border: "none", cursor: "pointer",
                        background: form.keineReinigung ? "var(--secondary-700)" : "var(--secondary-500)",
                        boxShadow: "inset 0px 1px 4px 0px rgba(0,0,0,0.30)",
                        position: "relative", flexShrink: 0, transition: "background 0ms",
                      }}>
                      <div style={{
                        position: "absolute", top: 3, width: 28, height: 28, borderRadius: "50%",
                        background: "var(--neutral-white)", boxShadow: "0px 0.83px 2.5px 0px rgba(0,0,0,0.20)",
                        left: form.keineReinigung ? 34 : 3, transition: "left 0ms",
                      }} />
                    </button>
                    <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-700)" }}>
                      Keine Reinigung möglich
                    </span>
                  </div>
                </div>
              </div>

              {/* Trocknen + Bügeln nebeneinander */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Trocknen */}
                <div style={{ border: "1px solid var(--secondary-700)", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <Image src="/icons/icon-tumbler.svg" alt="" width={28} height={28} />
                    <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>
                      Trocknen
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dryingOptions.map((o) => {
                      const isActive = form.dryingIds.includes(o.id);
                      return (
                        <button key={o.id} type="button" onClick={() => toggleArr("dryingIds", o.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, height: 54,
                            padding: "0 16px", borderRadius: 12, cursor: "pointer",
                            border: "1px solid var(--secondary-700)",
                            background: "var(--neutral-white)", textAlign: "left",
                          }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            border: isActive ? "none" : "2px solid var(--secondary-700)",
                            background: "transparent", position: "relative",
                          }}>
                            {isActive && (
                              <div style={{ position: "absolute", top: 5, left: 5, width: 20, height: 20, borderRadius: 6, background: "var(--secondary-700)" }} />
                            )}
                          </div>
                          <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-700)" }}>
                            {o.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bügeln */}
                <div style={{ border: "1px solid var(--secondary-700)", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <Image src="/icons/icon-steam.svg" alt="" width={28} height={28} />
                    <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)" }}>
                      Bügeln
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {ironingOptions.map((o) => {
                      const isActive = form.ironingIds.includes(o.id);
                      return (
                        <button key={o.id} type="button" onClick={() => toggleArr("ironingIds", o.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, height: 54,
                            padding: "0 16px", borderRadius: 12, cursor: "pointer",
                            border: "1px solid var(--secondary-700)",
                            background: "var(--neutral-white)", textAlign: "left",
                          }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            border: isActive ? "none" : "2px solid var(--secondary-700)",
                            background: "transparent", position: "relative",
                          }}>
                            {isActive && (
                              <div style={{ position: "absolute", top: 5, left: 5, width: 20, height: 20, borderRadius: 6, background: "var(--secondary-700)" }} />
                            )}
                          </div>
                          <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-700)" }}>
                            {o.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Toggle: Nicht bügeln */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, nichtBuegeln: !f.nichtBuegeln }))}
                      style={{
                        width: 65, height: 34, borderRadius: 72, border: "none", cursor: "pointer",
                        background: form.nichtBuegeln ? "var(--secondary-700)" : "var(--secondary-500)",
                        boxShadow: "inset 0px 1px 4px 0px rgba(0,0,0,0.30)",
                        position: "relative", flexShrink: 0,
                      }}>
                      <div style={{
                        position: "absolute", top: 3, width: 28, height: 28, borderRadius: "50%",
                        background: "var(--neutral-white)", boxShadow: "0px 0.83px 2.5px 0px rgba(0,0,0,0.20)",
                        left: form.nichtBuegeln ? 34 : 3,
                      }} />
                    </button>
                    <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-700)" }}>
                      Nicht bügeln
                    </span>
                  </div>
                </div>
              </div>

              {/* Zusätzliche Waschinfos */}
              <div>
                <SubHeading>Zusätzliche Waschinfos</SubHeading>
                <TextArea value={form.materialNotes} onChange={(v) => setField("materialNotes", v)} placeholder="" rows={3} />
              </div>
            </div>
          </SectionCard>

          {/* ─── Bilder ─── */}
          <SectionCard id="bilder" sectionRef={(el) => { sectionRefs.current["bilder"] = el; }}>
            <SectionHeading icon="icon-images">Bilder</SectionHeading>

            {/* Upload container */}
            <div style={{
              width: "100%",
              maxWidth: 726,
              border: "1px solid var(--neutral-grey-300)",
              boxShadow: "var(--shadow-300)",
              borderRadius: 10,
              overflow: "hidden",
            }}>
              {/* Dashed drop zone */}
              <div style={{ padding: "24px 48px 0" }}>
                <div style={{
                  width: "100%",
                  minHeight: 280,
                  border: "1.5px dashed var(--neutral-grey-500)",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: 24,
                  background: "var(--neutral-white)",
                }}>
                  {images.length === 0 ? (
                    <>
                      <Image src="/icons/icon-images.svg" alt="" width={48} height={48} style={{ opacity: 0.3 }} />
                      <span style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-300)",
                        color: "var(--neutral-grey-500)",
                        fontWeight: "var(--font-weight-500)",
                        textAlign: "center",
                      }}>
                        <strong>Bilder</strong> und <strong>Videos</strong> hochladen oder aufnehmen
                      </span>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, width: "100%" }}>
                      {images.map((img, idx) => (
                        <div key={idx} style={{ position: "relative", width: 100, height: 100 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.preview} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
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
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons row */}
              <div style={{ display: "flex", gap: 10, padding: "16px 48px 24px", justifyContent: "flex-end" }}>
                {/* Upload Bildmaterial — secondary */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    height: 46,
                    padding: "0 30px",
                    borderRadius: 8,
                    border: "1px solid var(--primary-900)",
                    background: "var(--neutral-white)",
                    color: "var(--primary-900)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-350)",
                    fontWeight: "var(--font-weight-500)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Upload Bildmaterial
                  <span style={{
                    display: "inline-block", width: 22, height: 22, flexShrink: 0,
                    backgroundColor: "var(--primary-900)",
                    WebkitMaskImage: "url(/icons/icon-upload.svg)",
                    maskImage: "url(/icons/icon-upload.svg)",
                    WebkitMaskSize: "contain", maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center", maskPosition: "center",
                  }} />
                </button>
                {/* Foto aufnehmen — primary */}
                <button
                  type="button"
                  style={{
                    height: 46,
                    padding: "0 30px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--primary-900)",
                    color: "var(--neutral-white)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-350)",
                    fontWeight: "var(--font-weight-500)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Foto aufnehmen
                  <span style={{
                    display: "inline-block", width: 22, height: 22, flexShrink: 0,
                    backgroundColor: "var(--neutral-white)",
                    WebkitMaskImage: "url(/icons/icon-camera.svg)",
                    maskImage: "url(/icons/icon-camera.svg)",
                    WebkitMaskSize: "contain", maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center", maskPosition: "center",
                  }} />
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ─── Masse ─── */}
          <SectionCard id="masse" sectionRef={(el) => { sectionRefs.current["masse"] = el; }}>
            <SectionHeading icon="icon-measuring">Masse</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Konfektionsgrösse — Size Tiles */}
              <div>
                <SubHeading>Konfektionsgrösse</SubHeading>
                {/* International */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", fontWeight: "var(--font-weight-400)", color: "var(--secondary-800)" }}>International</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {KONFEKTIONS_SIZES_INT.map((s) => {
                    const isActive = form.sizeLabel === s;
                    return (
                      <button key={s} type="button" onClick={() => setField("sizeLabel", form.sizeLabel === s ? "" : s)}
                        style={{
                          width: 106, height: 70,
                          border: "1px solid var(--secondary-800)",
                          borderRadius: isActive ? "var(--radius-md)" : "var(--radius-sm)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-500)",
                          fontFamily: "var(--font-family-base)",
                          color: "var(--secondary-800)",
                          background: isActive ? "var(--secondary-500)" : "var(--neutral-white)",
                          cursor: "pointer",
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
                {/* EU */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", fontWeight: "var(--font-weight-400)", color: "var(--secondary-800)" }}>EU</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {KONFEKTIONS_SIZES_EU.map((s) => {
                    const isActive = form.sizeLabel === s;
                    return (
                      <button key={s} type="button" onClick={() => setField("sizeLabel", form.sizeLabel === s ? "" : s)}
                        style={{
                          width: 106, height: 70,
                          border: "1px solid var(--secondary-800)",
                          borderRadius: isActive ? "var(--radius-md)" : "var(--radius-sm)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "var(--font-size-600)", fontWeight: "var(--font-weight-500)",
                          fontFamily: "var(--font-family-base)",
                          color: "var(--secondary-800)",
                          background: isActive ? "var(--secondary-500)" : "var(--neutral-white)",
                          cursor: "pointer",
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kostümmasse — flat fields */}
              <div>
                <SubHeading>Kostümmasse</SubHeading>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "20px 30px" }}>
                  <MeasureInput label="Brustumfang" value={form.chest} onChange={(v) => setField("chest", v)} />
                  <MeasureInput label="Hüftumfang" value={form.hip} onChange={(v) => setField("hip", v)} />
                  <MeasureInput label="Taillenumfang" value={form.waist} onChange={(v) => setField("waist", v)} />
                  <MeasureInput label="Rückenbreite" value={form.shoulderWidth} onChange={(v) => setField("shoulderWidth", v)} />
                  <MeasureInput label="Rückenlänge" value={form.backLength} onChange={(v) => setField("backLength", v)} />
                  <MeasureInput label="Beinlänge" value={form.legLength} onChange={(v) => setField("legLength", v)} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ─── Lagerort ─── */}
          <SectionCard id="lagerort" sectionRef={(el) => { sectionRefs.current["lagerort"] = el; }}>
            <SectionHeading icon="icon-location">Lagerort</SectionHeading>
            <div>
              <SubHeading>Lagerort-Pfad</SubHeading>
              <FlatInput
                value={form.storageLocation}
                onChange={(v) => setField("storageLocation", v)}
                placeholder="z.B. Bern.Stock1.Regal3.Box7"
              />
              <p style={{ marginTop: 8, fontFamily: "var(--font-family-base)", fontSize: 12, color: "var(--neutral-grey-400)" }}>
                Format: Haus.Stockwerk.Regal.Box
              </p>
            </div>
          </SectionCard>

          {/* ─── ID & Infos ─── */}
          <SectionCard id="infos" sectionRef={(el) => { sectionRefs.current["infos"] = el; }}>
            <SectionHeading icon="icon-list">ID & Infos</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <SubHeading>Barcode / ID</SubHeading>
                <FlatInput value={form.barcodeId} onChange={(v) => setField("barcodeId", v)} placeholder="Leer lassen für Auto-Generierung" />
              </div>
              <div>
                <SubHeading>Zustand (1 = schlecht, 5 = neuwertig)</SubHeading>
                <div style={{ display: "flex", gap: 8 }}>
                  {["1", "2", "3", "4", "5"].map((g) => (
                    <button key={g} type="button" onClick={() => setField("conditionGrade", g)} style={{
                      width: 44, height: 44,
                      borderRadius: "var(--radius-sm)",
                      border: `1.5px solid ${form.conditionGrade === g ? "var(--primary-900)" : "var(--neutral-grey-300)"}`,
                      background: form.conditionGrade === g ? "var(--primary-900)" : "var(--neutral-white)",
                      color: form.conditionGrade === g ? "var(--neutral-white)" : "var(--neutral-grey-600)",
                      fontFamily: "var(--font-family-base)",
                      fontWeight: "var(--font-weight-700)",
                      fontSize: "var(--font-size-300)",
                      cursor: "pointer",
                    }}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <SubHeading>Aufführung / Produktion</SubHeading>
                <FlatInput value={form.productionTitle} onChange={(v) => setField("productionTitle", v)} placeholder="z.B. Fidelio" />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <SubHeading>Jahr</SubHeading>
                  <FlatInput value={form.productionYear} onChange={(v) => setField("productionYear", v)} placeholder="z.B. 2024" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ─── Nachrichten ─── */}
          <SectionCard id="nachrichten" sectionRef={(el) => { sectionRefs.current["nachrichten"] = el; }}>
            <SectionHeading icon="icon-chat">Nachrichten</SectionHeading>
            <div>
              <SubHeading>Interne Notizen</SubHeading>
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
          </SectionCard>

          {/* bottom spacer */}
          <div style={{ height: 40, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}
