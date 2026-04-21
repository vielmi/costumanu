"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/layout/app-logo";
import { CameraCapture } from "@/components/camera/camera-capture";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import styles from "./kostueme-neu.module.css";

interface TaxTerm { id: string; label_de: string; parent_id?: string | null; }

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
  theaterName: string;
  currentUserId: string;
  currentUserName: string;
  costumeType: "single" | "ensemble" | "serie";
  taxonomy: Taxonomy;
  editCostume?: import("@/lib/types/costume").Costume;
}

const NAV_SECTIONS = [
  { id: "kategorie",   label: "Kategorie",   icon: "icon-category"  },
  { id: "material",    label: "Material",    icon: "icon-material"  },
  { id: "bilder",      label: "Bilder",      icon: "icon-image-filled" },
  { id: "masse",       label: "Masse",       icon: "icon-measuring" },
  { id: "lagerort",    label: "Lagerort",    icon: "icon-location"  },
  { id: "infos",       label: "ID & Infos",  icon: "icon-list"      },
  { id: "nachrichten", label: "Kommentar",   icon: "icon-chat"      },
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

// ─── Creatable search card (Aufführung fields) ───────────────────────────────
type ProvenanceColumn = "production_title" | "actor_name" | "role_name" | "year";

function CreatableSearchCard({
  label,
  value,
  onChange,
  dbColumn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dbColumn: ProvenanceColumn;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!value.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      let results: string[] = [];
      if (dbColumn === "year") {
        const { data } = await supabase
          .from("costume_provenance")
          .select("year")
          .not("year", "is", null)
          .limit(50);
        const all = [...new Set((data ?? []).map((d: { year: number | null }) => String(d.year)).filter(Boolean))];
        results = all.filter((y) => y.startsWith(value)).slice(0, 8);
      } else {
        const { data } = await supabase
          .from("costume_provenance")
          .select(dbColumn)
          .ilike(dbColumn, `%${value}%`)
          .limit(20);
        results = [...new Set(
          (data ?? []).map((d: Record<string, unknown>) => String(d[dbColumn])).filter(Boolean)
        )].slice(0, 8);
      }
      setSuggestions(results);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, dbColumn, supabase]);

  const exactMatch = suggestions.some((s) => s.toLowerCase() === value.trim().toLowerCase());
  const showCreate = value.trim().length > 0 && !exactMatch;

  function handleSelect(s: string) {
    onChange(s);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
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
            onFocus={() => { if (value.trim()) setOpen(true); }}
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
      {open && (suggestions.length > 0 || showCreate) && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "white",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-300)",
          zIndex: 100,
          overflow: "hidden",
        }}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => handleSelect(s)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-300)",
                fontWeight: "var(--font-weight-400)",
                color: "var(--neutral-grey-600)",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--secondary-500)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={() => handleSelect(value.trim())}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-300)",
                fontWeight: "var(--font-weight-500)",
                color: "var(--primary-900)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              + Neu erstellen: &bdquo;{value.trim()}&ldquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Build initial form from an existing costume (edit mode) ─────────────────
function buildFormFromCostume(c: import("@/lib/types/costume").Costume): ReturnType<typeof emptyForm> {
  const item = c.costume_items?.[0];
  const prov = c.costume_provenance?.[0];
  const storageParts = item?.storage_location_path?.split(".") ?? [];
  const termsByVocab: Record<string, string[]> = {};
  for (const ct of c.costume_taxonomy ?? []) {
    const term = Array.isArray(ct.taxonomy_term) ? ct.taxonomy_term[0] : ct.taxonomy_term;
    if (!term) continue;
    termsByVocab[term.vocabulary] ??= [];
    termsByVocab[term.vocabulary].push(ct.term_id);
  }
  return {
    name: c.name,
    description: c.description ?? "",
    genderId: c.gender_term?.label_de.toLowerCase() ?? "",
    clothingTypeLabel: c.clothing_type?.label_de ?? "",
    clothingTypeSearch: c.clothing_type?.label_de ?? "",
    clothingTypeSuggestions: [],
    materialSearch: "",
    materialIds: termsByVocab["material"] ?? [],
    musterIds: termsByVocab["muster"] ?? [],
    colorIds: termsByVocab["color"] ?? [],
    spartanIds: termsByVocab["sparte"] ?? [],
    temperatureIds: termsByVocab["temperature"] ?? [],
    washingTypeIds: termsByVocab["washing_type"] ?? [],
    dryingIds: termsByVocab["drying"] ?? [],
    ironingIds: termsByVocab["ironing"] ?? [],
    keineReinigung: false,
    nichtBuegeln: false,
    colorNote: "",
    materialNotes: "",
    sizeLabel: item?.size_label ?? "",
    sizeNotes: "",
    locationFloor: storageParts[0] ?? "",
    locationRack: storageParts[1] ?? "",
    locationSector: storageParts[2] ?? "",
    currentStatus: item?.current_status ?? "available",
    isPublicForRent: item?.is_public_for_rent ?? false,
    chest: item?.size_data?.chest ? String(item.size_data.chest) : "",
    waist: item?.size_data?.waist ? String(item.size_data.waist) : "",
    hip: item?.size_data?.hip ? String(item.size_data.hip) : "",
    backLength: item?.size_data?.back_length ? String(item.size_data.back_length) : "",
    shoulderWidth: item?.size_data?.shoulder_width ? String(item.size_data.shoulder_width) : "",
    legLength: item?.size_data?.leg_length ? String(item.size_data.leg_length) : "",
    storageLocation: item?.storage_location_path ?? "",
    barcodeId: item?.barcode_id ?? "",
    rfidId: item?.rfid_id ?? "",
    qrCodeId: "",
    conditionGrade: item?.condition_grade ? String(item.condition_grade) : "3",
    productionTitle: prov?.production_title ?? "",
    productionYear: prov?.year ? String(prov.year) : "",
    actorName: prov?.actor_name ?? "",
    roleName: prov?.role_name ?? "",
    notes: "",
  };
}

function emptyForm() {
  return {
    name: "", description: "", genderId: "",
    clothingTypeLabel: "", clothingTypeSearch: "", clothingTypeSuggestions: [] as string[],
    materialSearch: "", materialIds: [] as string[], musterIds: [] as string[],
    colorIds: [] as string[], spartanIds: [] as string[], temperatureIds: [] as string[],
    washingTypeIds: [] as string[], dryingIds: [] as string[], ironingIds: [] as string[],
    keineReinigung: false, nichtBuegeln: false,
    colorNote: "", materialNotes: "",
    sizeLabel: "", sizeNotes: "",
    locationFloor: "", locationRack: "", locationSector: "",
    currentStatus: "available", isPublicForRent: false,
    chest: "", waist: "", hip: "", backLength: "", shoulderWidth: "", legLength: "",
    storageLocation: "", barcodeId: "", rfidId: "", qrCodeId: "",
    conditionGrade: "3",
    productionTitle: "", productionYear: "", actorName: "", roleName: "",
    notes: "",
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function KostuemeNeuClient({ theaterId, theaterName, currentUserId, currentUserName, costumeType, taxonomy, editCostume }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState("kategorie");
  const [saving, setSaving] = useState(false);
  const [showCloseSheet, setShowCloseSheet] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingComments, setPendingComments] = useState<{ body: string; author_name: string; created_at: string }[]>([]);
  const [commentDraft, setCommentDraft] = useState("");

  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showScanner, setShowScanner] = useState<"barcodeId" | "qrCodeId" | null>(null);
  const [showLabelCamera, setShowLabelCamera] = useState(false);
  const [labelPhotoPreview, setLabelPhotoPreview] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  const [form, setForm] = useState(() => editCostume ? buildFormFromCostume(editCostume) : emptyForm());

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (showErrors && next.name.trim() && next.genderId && next.clothingTypeLabel && next.colorIds.length > 0) {
        setShowErrors(false);
      }
      return next;
    });
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
    const containerTop = el.getBoundingClientRect().top;
    let current = NAV_SECTIONS[0].id;
    for (const sec of NAV_SECTIONS) {
      const ref = sectionRefs.current[sec.id];
      if (ref) {
        const refTop = ref.getBoundingClientRect().top - containerTop;
        if (refTop - 60 <= 0) current = sec.id;
      }
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
      const containerTop = mainRef.current.getBoundingClientRect().top;
      const refTop = ref.getBoundingClientRect().top;
      const offset = mainRef.current.scrollTop + (refTop - containerTop) - 24;
      mainRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
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
    const isValid = form.name.trim() && form.genderId && form.clothingTypeLabel && form.colorIds.length > 0;
    if (!isValid) {
      setShowErrors(true);
      const firstMissing = !form.name.trim() ? "name-field"
        : !form.genderId ? "gender-field"
        : !form.clothingTypeLabel ? "clothing-type-field"
        : "color-field";
      const el = document.getElementById(firstMissing);
      if (el && mainRef.current) {
        const containerTop = mainRef.current.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        mainRef.current.scrollTo({ top: mainRef.current.scrollTop + (elTop - containerTop) - 40, behavior: "smooth" });
      }
      return;
    }
    setSaving(true);
    try {
      const taxTermIds = [
        ...form.materialIds, ...form.musterIds, ...form.colorIds,
        ...form.spartanIds, ...form.temperatureIds, ...form.washingTypeIds,
        ...form.dryingIds, ...form.ironingIds,
      ];
      const sizeData = {
        chest: form.chest || null, waist: form.waist || null, hip: form.hip || null,
        back_length: form.backLength || null, shoulder_width: form.shoulderWidth || null,
        leg_length: form.legLength || null,
      };
      const storagePath = [form.locationFloor, form.locationRack, form.locationSector].filter(Boolean).join(".") || form.storageLocation || null;

      if (editCostume) {
        await supabase.from("costumes").update({
          name: form.name,
          description: form.description || null,
          gender_term_id: genderTermId,
          clothing_type_id: taxonomy.clothingTypes.find((t) => t.label_de === form.clothingTypeLabel)?.id ?? null,
        }).eq("id", editCostume.id);

        await supabase.from("costume_taxonomy").delete().eq("costume_id", editCostume.id);
        if (taxTermIds.length > 0) {
          await supabase.from("costume_taxonomy").insert(
            taxTermIds.map((term_id) => ({ costume_id: editCostume.id, term_id }))
          );
        }

        const existingItem = editCostume.costume_items?.[0];
        if (existingItem) {
          await supabase.from("costume_items").update({
            barcode_id: form.barcodeId || null,
            size_label: form.sizeLabel || null,
            size_data: sizeData,
            condition_grade: form.conditionGrade ? Number(form.conditionGrade) : null,
            current_status: form.currentStatus,
            storage_location_path: storagePath,
            is_public_for_rent: form.isPublicForRent,
          }).eq("id", existingItem.id);
        }

        await supabase.from("costume_provenance").delete().eq("costume_id", editCostume.id);
        if (form.productionTitle) {
          await supabase.from("costume_provenance").insert({
            costume_id: editCostume.id,
            production_title: form.productionTitle,
            year: form.productionYear ? Number(form.productionYear) : null,
            actor_name: form.actorName || null,
            role_name: form.roleName || null,
          });
        }

        const existingCount = editCostume.costume_media?.length ?? 0;
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const ext = img.file.name.split(".").pop() ?? "jpg";
          const path = `${theaterId}/${editCostume.id}/${existingCount + i}.${ext}`;
          await supabase.storage.from("costume-images").upload(path, img.file);
          await supabase.from("costume_media").insert({ costume_id: editCostume.id, storage_path: path, sort_order: existingCount + i });
        }

        router.push(`/costume/${editCostume.id}`);
      } else {
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

        if (taxTermIds.length > 0) {
          await supabase.from("costume_taxonomy").insert(
            taxTermIds.map((term_id) => ({ costume_id: costume.id, term_id }))
          );
        }

        await supabase.from("costume_items").insert({
          costume_id: costume.id, theater_id: theaterId,
          barcode_id: form.barcodeId || null,
          size_label: form.sizeLabel || null,
          size_data: sizeData,
          condition_grade: form.conditionGrade ? Number(form.conditionGrade) : null,
          current_status: form.currentStatus,
          storage_location_path: storagePath,
          is_public_for_rent: form.isPublicForRent,
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

        if (pendingComments.length > 0) {
          await supabase.from("costume_comments").insert(
            pendingComments.map((c) => ({
              costume_id: costume.id, user_id: currentUserId,
              body: c.body, parent_id: null,
            }))
          );
        }

        router.push(`/costume/${costume.id}`);
      }
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

  const STATUS_OPTIONS = [
    { value: "available",   label: "Verfügbar",   color: "var(--accent-01)" },
    { value: "cleaning",    label: "Reinigung",   color: "var(--color-warning)" },
    { value: "in_progress", label: "In Arbeit",   color: "var(--color-error)" },
    { value: "rented",      label: "Ausgeliehen", color: "var(--color-error)" },
    { value: "reserved",    label: "Reserviert",  color: "var(--color-error)" },
    { value: "stage",       label: "Bühne",       color: "var(--color-error)" },
    { value: "rehearsal",   label: "Probebühne",  color: "var(--color-error)" },
    { value: "sorted_out",  label: "Aussortiert", color: "var(--color-error)" },
    { value: "sold",        label: "Verkauft",    color: "var(--color-error)" },
  ];
  const selectedStatus = STATUS_OPTIONS.find(o => o.value === form.currentStatus) ?? STATUS_OPTIONS[0];

  return (
    <div className={styles.root}>

      {/* ═══ Header ═══ */}
      <div className={styles.header} style={{ height: 72 }}>
        <div className={styles.headerLogo} style={{ width: NAV_W }}>
          <AppLogo />
        </div>

        {/* Mobile-only Titel */}
        <span className={styles.headerMobileTitle}>Kostüm erfassen</span>

        <div className={styles.headerActions}>
          <div className={styles.spacer} />

          {/* Camera */}
          <button type="button" onClick={() => setShowCamera(true)} title="Foto aufnehmen" className={styles.cameraBtn}>
            <Image src="/icons/icon-camera-filled.svg" alt="Bilder" width={23} height={23} style={{ filter: "invert(1)" }} />
          </button>

          {/* Löschen — nur im Edit-Mode, auf Desktop im Header */}
          {editCostume && (
            <button
              type="button"
              onClick={() => setShowDeleteSheet(true)}
              className={`btn-secondary ${styles.deleteBtnDesktop}`}
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Löschen
            </button>
          )}

          {/* Speichern */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {saving ? "Speichert..." : "Speichern"}
          </button>

          {/* Close */}
          <button type="button" onClick={() => setShowCloseSheet(true)} className={styles.closeBtn}>
            <Image src="/icons/icon-close-medium.svg" alt="Schliessen" width={22} height={22} />
          </button>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div className={styles.body}>

        {/* Left nav */}
        <nav className={styles.nav} style={{ width: NAV_W }}>
          {NAV_SECTIONS.map((sec, index) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} ${index < NAV_SECTIONS.length - 1 ? styles.navItemBorder : ""}`}
              >
                <Image src={`/icons/${sec.icon}.svg`} alt="" width={20} height={20} className={styles.navItemIcon} />
                <span className={styles.navItemLabel}>{sec.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scrollable content */}
        <div className={styles.contentClip}>
          <div ref={mainRef} className={styles.contentScroll}>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={handleImageAdd} />
            <input id="camera-capture-input" ref={cameraCaptureRef} type="file" accept="image/*" capture="environment" className={styles.hiddenInput} onChange={handleImageAdd} />

            {/* ─── Kategorie ─── */}
            <section
              id="kategorie"
              ref={(el) => { sectionRefs.current["kategorie"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-category.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>Kategorie</h2>
              </div>

              <div className={styles.sectionFields}>

                {/* Name */}
                <div id="name-field">
                  <div className={styles.subHeading}>Name des Kostüms *</div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => { setField("name", e.target.value); if (showErrors) setShowErrors(false); }}
                    placeholder="z.B. Abendkleid aus Satin & Tüll"
                    className={styles.flatInput}
                  />
                  {showErrors && !form.name.trim() && (
                    <p className={styles.errorMsg}>Bitte gib dem Kostüm einen Namen.</p>
                  )}
                </div>

                {/* Kategorie (Gender) */}
                <div id="gender-field">
                  <div className={styles.subHeading}>Kategorie *</div>
                  <div className={styles.genderGrid}>
                    {GENDER_CARDS.map((g) => {
                      const active = form.genderId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setField("genderId", g.id)}
                          className={`${styles.genderCard} ${active ? styles.genderCardActive : ""}`}
                        >
                          <Image
                            src={`/icons/${g.icon}.svg`}
                            alt={g.label}
                            width={32}
                            height={32}
                            style={{ filter: active ? "invert(1)" : "none", opacity: active ? 1 : 0.7 }}
                          />
                          <span className={styles.genderCardLabel}>{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {showErrors && !form.genderId && (
                    <p className={styles.errorMsg}>Bitte eine Kategorie wählen.</p>
                  )}
                </div>

                {/* Sparte */}
                <div>
                  <div className={styles.subHeading}>Sparte</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {spartanOptions.map((o) => (
                      <Pill key={o.id} label={o.label} active={form.spartanIds.includes(o.id)} onClick={() => toggleArr("spartanIds", o.id)} />
                    ))}
                  </div>
                </div>

                {/* Aufführung */}
                <div>
                  <div className={styles.subHeading}>Aufführung</div>
                  <div className={styles.auffuehrungGrid}>
                    <CreatableSearchCard label="Epoche"     value={form.productionYear}  onChange={(v) => setField("productionYear", v)}  dbColumn="year" />
                    <CreatableSearchCard label="Stücktitel" value={form.productionTitle} onChange={(v) => setField("productionTitle", v)} dbColumn="production_title" />
                    <CreatableSearchCard label="Darsteller" value={form.actorName}       onChange={(v) => setField("actorName", v)}        dbColumn="actor_name" />
                    <CreatableSearchCard label="Rolle"      value={form.roleName}        onChange={(v) => setField("roleName", v)}         dbColumn="role_name" />
                  </div>
                </div>

                {/* Bekleidungsart */}
                <div id="clothing-type-field">
                  <div className={styles.subHeading}>Bekleidungsart *</div>
                  <div className={styles.clothingGrid}>
                    {taxonomy.clothingTypes.map(({ label_de: label }) => {
                      const isActive = form.clothingTypeLabel === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setField("clothingTypeLabel", isActive ? "" : label)}
                          className={`${styles.clothingBtn} ${isActive ? styles.clothingBtnActive : ""}`}
                        >
                          <div className={`${styles.radioCircle} ${isActive ? styles.radioCircleActive : ""}`}>
                            {isActive && <div className={styles.radioCircleDot} />}
                          </div>
                          <span className={styles.clothingLabel}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {showErrors && !form.clothingTypeLabel && (
                    <p className={styles.errorMsg}>Bitte eine Bekleidungsart wählen.</p>
                  )}

                  {/* Bekleidungstypen — nur wenn eine Bekleidungsart gewählt */}
                  {(() => {
                    const selectedType = taxonomy.clothingTypes.find(t => t.label_de === form.clothingTypeLabel);
                    const subtypes = selectedType
                      ? taxonomy.clothingSubtypes.filter(s => s.parent_id === selectedType.id)
                      : [];
                    if (!selectedType || subtypes.length === 0) return null;
                    return (
                      <div style={{ marginTop: 24 }}>
                        <div className={styles.subHeading}>Bekleidungstyp</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                          {subtypes.map((t) => (
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
                    );
                  })()}

                </div>

                {/* Beschreibung */}
                <div>
                  <div className={styles.subHeading}>Kostüm Beschreibung &amp; zusätzliche Informationen</div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Kurze Beschreibung des Kostüms..."
                    rows={4}
                    className={styles.textarea}
                  />
                </div>
              </div>
            </section>

            {/* ─── Material ─── */}
            <section
              id="material"
              ref={(el) => { sectionRefs.current["material"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-material.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>Material</h2>
              </div>
              <div className={styles.sectionFields}>

                {/* Materialien */}
                <div>
                  <div className={styles.subHeading}>Materialien</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {materialOptions.map((o) => (
                      <Pill key={o.id} label={o.label} active={form.materialIds.includes(o.id)} onClick={() => toggleArr("materialIds", o.id)} />
                    ))}
                  </div>
                </div>

                {/* Muster */}
                <div>
                  <div className={styles.subHeading}>Muster</div>
                  <div className={styles.musterGrid}>
                    {musterOptions.map((o) => {
                      const isActive = form.musterIds.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => toggleArr("musterIds", o.id)}
                          className={`${styles.musterBtn} ${isActive ? styles.musterBtnActive : ""}`}
                        >
                          <span
                            className={styles.maskIcon}
                            style={{
                              width: 32, height: 32,
                              backgroundColor: isActive ? "var(--neutral-white)" : "var(--secondary-700)",
                              WebkitMaskImage: `url(/icons/${getMusterIcon(o.label)}.svg)`,
                              maskImage: `url(/icons/${getMusterIcon(o.label)}.svg)`,
                            }}
                          />
                          <span className={styles.musterLabel}>{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Farbrichtung */}
                <div id="color-field">
                  <div className={styles.subHeading}>Farbrichtung *</div>
                  <div className={styles.colorGrid}>
                    {colorOptions.map((o) => {
                      const isActive = form.colorIds.includes(o.id);
                      const labelLower = o.label.toLowerCase();
                      const isMulticolor = labelLower === "multicolor";
                      const isTransparent = labelLower === "transparent";
                      const isLight = labelLower === "weiss" || labelLower === "beige" || labelLower === "silber" || isTransparent;
                      const hex = COLOR_HEX[labelLower] ?? "#CCCCCC";
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setField("colorIds", form.colorIds[0] === o.id ? [] : [o.id])}
                          className={`${styles.colorBtn} ${isActive ? styles.colorBtnActive : ""}`}
                        >
                          <span className={styles.colorLabel}>{o.label}</span>
                          <div
                            className={styles.colorSwatch}
                            style={{
                              border: isLight ? "1px solid #DCDCDC" : "none",
                              ...(isMulticolor
                                ? { background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }
                                : isTransparent
                                ? { backgroundImage: "linear-gradient(45deg, #D0D0D0 25%, #FFFFFF 25%, #FFFFFF 75%, #D0D0D0 75%), linear-gradient(45deg, #D0D0D0 25%, #FFFFFF 25%, #FFFFFF 75%, #D0D0D0 75%)", backgroundSize: "8px 8px", backgroundPosition: "0 0, 4px 4px" }
                                : { background: hex }
                              ),
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {showErrors && form.colorIds.length === 0 && (
                    <p className={styles.errorMsg}>Bitte eine Farbrichtung wählen.</p>
                  )}
                </div>

                {/* Zusätzliche Farbbezeichnung */}
                <div>
                  <div className={styles.subHeading}>Zusätzliche Farbbezeichnung</div>
                  <input
                    type="text"
                    value={form.colorNote}
                    onChange={(e) => setField("colorNote", e.target.value)}
                    className={styles.simpleInput}
                  />
                </div>

                {/* Reinigung */}
                <div>
                  <div className={styles.subHeading}>Reinigung</div>
                  <div className={styles.careCard}>
                    <div className={styles.careHeader}>
                      <Image src="/icons/icon-wasch.svg" alt="" width={28} height={28} />
                      <span className={styles.careTitle}>Temperatur &amp; Reinigungsart</span>
                    </div>
                    <div className={styles.careBody}>
                      <div className={styles.tempGrid}>
                        {temperatureOptions.map((o) => {
                          const isActive = form.temperatureIds.includes(o.id);
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => toggleArr("temperatureIds", o.id)}
                              className={`${styles.tempBtn} ${isActive ? styles.tempBtnActive : ""}`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className={styles.checkboxList}>
                        {washingTypeOptions.map((o) => {
                          const isActive = form.washingTypeIds.includes(o.id);
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => toggleArr("washingTypeIds", o.id)}
                              className={`${styles.checkboxBtn} ${isActive ? styles.checkboxBtnActive : ""}`}
                            >
                              <div className={styles.checkbox}>
                                {isActive && <div className={styles.checkboxDot} />}
                              </div>
                              <span className={styles.checkboxLabel}>{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className={styles.toggleRow}>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, keineReinigung: !f.keineReinigung }))}
                        className={`${styles.toggleBtn} ${form.keineReinigung ? styles.toggleBtnOn : ""}`}
                      >
                        {/* thumb position is dynamic */}
                        <div className={styles.toggleThumb} style={{ left: form.keineReinigung ? 34 : 3 }} />
                      </button>
                      <span className={styles.toggleLabel}>Keine Reinigung möglich</span>
                    </div>
                  </div>
                </div>

                {/* Trocknen + Bügeln */}
                <div className={styles.careGrid}>
                  <div className={styles.careCard}>
                    <div className={styles.careHeader}>
                      <Image src="/icons/icon-tumbler.svg" alt="" width={28} height={28} />
                      <span className={styles.careTitle}>Trocknen</span>
                    </div>
                    <div className={styles.checkboxList}>
                      {dryingOptions.map((o) => {
                        const isActive = form.dryingIds.includes(o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => toggleArr("dryingIds", o.id)}
                            className={`${styles.checkboxBtn} ${isActive ? styles.checkboxBtnActive : ""}`}
                          >
                            <div className={styles.checkbox}>
                              {isActive && <div className={styles.checkboxDot} />}
                            </div>
                            <span className={styles.checkboxLabel}>{o.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.careCard}>
                    <div className={styles.careHeader}>
                      <Image src="/icons/icon-steam.svg" alt="" width={28} height={28} />
                      <span className={styles.careTitle}>Bügeln</span>
                    </div>
                    <div className={styles.checkboxList} style={{ marginBottom: 16 }}>
                      {ironingOptions.map((o) => {
                        const isActive = form.ironingIds.includes(o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => toggleArr("ironingIds", o.id)}
                            className={`${styles.checkboxBtn} ${isActive ? styles.checkboxBtnActive : ""}`}
                          >
                            <div className={styles.checkbox}>
                              {isActive && <div className={styles.checkboxDot} />}
                            </div>
                            <span className={styles.checkboxLabel}>{o.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className={`${styles.toggleRow} ${styles.toggleRowBuegeln}`}>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, nichtBuegeln: !f.nichtBuegeln }))}
                        className={`${styles.toggleBtn} ${form.nichtBuegeln ? styles.toggleBtnOn : ""}`}
                      >
                        <div className={styles.toggleThumb} style={{ left: form.nichtBuegeln ? 34 : 3 }} />
                      </button>
                      <span className={styles.toggleLabel}>Nicht bügeln</span>
                    </div>
                  </div>
                </div>

                {/* Zusätzliche Waschinfos */}
                <div>
                  <div className={styles.subHeading}>Zusätzliche Waschinfos</div>
                  <textarea
                    value={form.materialNotes}
                    onChange={(e) => setField("materialNotes", e.target.value)}
                    rows={3}
                    className={styles.textarea}
                  />
                </div>
              </div>
            </section>

            {/* ─── Bilder ─── */}
            <section
              id="bilder"
              ref={(el) => { sectionRefs.current["bilder"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-images.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>Bilder</h2>
              </div>

              <div className={styles.uploadContainer}>
                <div className={styles.dropZoneWrap}>
                  <div className={styles.dropZone}>
                    {images.length === 0 ? (
                      <>
                        <Image src="/icons/icon-images.svg" alt="" width={48} height={48} style={{ opacity: 0.3 }} />
                        <span className={styles.dropZoneHint}><strong>Bilder</strong> hochladen oder aufnehmen</span>
                      </>
                    ) : (
                      <div className={styles.imageThumbs}>
                        {images.map((img, idx) => (
                          <div key={idx} className={styles.imageThumbWrap}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.preview} alt="" className={styles.imageThumb} />
                            <button type="button" onClick={() => removeImage(idx)} className={styles.imageRemoveBtn}>
                              <Image src="/icons/icon-close-small.svg" alt="" width={12} height={12} style={{ filter: "invert(1)" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.uploadButtons}>
                  <button type="button" onClick={() => imageInputRef.current?.click()} className={styles.uploadBtnSecondary}>
                    Upload Bildmaterial
                    <span
                      className={styles.maskIcon}
                      style={{
                        backgroundColor: "var(--primary-900)",
                        WebkitMaskImage: "url(/icons/icon-upload.svg)",
                        maskImage: "url(/icons/icon-upload.svg)",
                      }}
                    />
                  </button>
                  <button type="button" onClick={() => setShowCamera(true)} className={styles.uploadBtnPrimary}>
                    Foto aufnehmen
                    <span
                      className={styles.maskIcon}
                      style={{
                        backgroundColor: "var(--neutral-white)",
                        WebkitMaskImage: "url(/icons/icon-camera.svg)",
                        maskImage: "url(/icons/icon-camera.svg)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Masse ─── */}
            <section
              id="masse"
              ref={(el) => { sectionRefs.current["masse"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-measuring.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>Masse</h2>
              </div>
              <div className={styles.sectionFields}>
                <div>
                  <div className={styles.subHeading}>Konfektionsgrösse</div>
                  <div className={styles.sizeSubLabel}>International</div>
                  <div className={styles.sizeGrid}>
                    {KONFEKTIONS_SIZES_INT.map((s) => {
                      const isActive = form.sizeLabel === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setField("sizeLabel", form.sizeLabel === s ? "" : s)}
                          className={`${styles.sizeBtn} ${isActive ? styles.sizeBtnActive : ""}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <div className={styles.sizeSubLabel}>EU</div>
                  <div className={styles.sizeGrid}>
                    {KONFEKTIONS_SIZES_EU.map((s) => {
                      const isActive = form.sizeLabel === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setField("sizeLabel", form.sizeLabel === s ? "" : s)}
                          className={`${styles.sizeBtn} ${isActive ? styles.sizeBtnActive : ""}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className={styles.subHeading}>Zusätzliche Massinfos</div>
                  <textarea
                    value={form.sizeNotes}
                    onChange={(e) => setField("sizeNotes", e.target.value)}
                    rows={3}
                    className={styles.textarea}
                  />
                </div>
              </div>
            </section>

            {/* ─── Lagerort ─── */}
            <section
              id="lagerort"
              ref={(el) => { sectionRefs.current["lagerort"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-location.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>Lagerort</h2>
              </div>
              <div className={styles.lagerortLayout}>
                <div className={styles.theaterCardWrap}>
                  <div className={styles.subHeading}>{theaterName}</div>
                  <div className={styles.theaterCard}>
                    <Image src="/icons/icon-location.svg" alt="" width={20} height={20} style={{ filter: "invert(1)", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p className={styles.theaterCardName}>{theaterName}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.platzierungWrap}>
                  <div className={styles.subHeading}>Platzierung</div>
                  <div className={styles.platzierungCard}>
                    <div className={styles.locationGrid}>
                      {([
                        { label: "Stockwerk", field: "locationFloor" as const },
                        { label: "Stange",    field: "locationRack"  as const },
                      ] as const).map(({ label, field }) => (
                        <div key={field}>
                          <p className={styles.locationFieldLabel}>{label}</p>
                          <div className={styles.locationSelectWrap}>
                            <select
                              value={form[field]}
                              onChange={(e) => setField(field, e.target.value)}
                              className={styles.locationSelect}
                              style={{ color: form[field] ? "var(--secondary-800)" : "var(--neutral-grey-400)" }}
                            >
                              <option value="">–</option>
                              {["1", "2", "3", "4", "5"].map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                            <Image src="/icons/icon-dropdown.svg" alt="" width={16} height={16} className={styles.selectChevron} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className={styles.sektorLabel}>Sektor</p>
                      <div className={styles.sektorGrid}>
                        {["A", "B", "C", "D", "E", "F"].map((s) => {
                          const isActive = form.locationSector === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setField("locationSector", isActive ? "" : s)}
                              className={`${styles.sektorBtn} ${isActive ? styles.sektorBtnActive : ""}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sichtbarkeit */}
              <div className={styles.sichtbarkeit}>
                <div className={styles.subHeading}>Sichtbarkeit</div>
                <div className={styles.sichtbarkeitRow}>

                  {/* Status dropdown */}
                  <div className={styles.statusDropdownWrap}>
                    <p className={styles.fieldLabel}>Status</p>
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(v => !v)}
                      className={styles.statusDropdownTrigger}
                    >
                      <div className={styles.statusDot} style={{ background: selectedStatus.color }} />
                      <span style={{ flex: 1, textAlign: "left" }}>{selectedStatus.label}</span>
                      <Image src="/icons/icon-dropdown.svg" alt="" width={16} height={16} />
                    </button>
                    {showStatusDropdown && (
                      <>
                        <div onClick={() => setShowStatusDropdown(false)} className={styles.statusDropdownBackdrop} />
                        <div className={styles.statusDropdownMenu}>
                          {STATUS_OPTIONS.map(o => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => { setField("currentStatus", o.value); setShowStatusDropdown(false); }}
                              className={`${styles.statusOption} ${o.value === form.currentStatus ? styles.statusOptionActive : ""}`}
                            >
                              <div className={styles.statusDot} style={{ background: o.color }} />
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sichtbar im Netzwerk */}
                  <div>
                    <p className={styles.fieldLabel}>Sichtbar im Kostüm-Netzwerk</p>
                    <div className={styles.radioGroup}>
                      {([{ label: "Nein", value: false }, { label: "Ja", value: true }] as const).map(({ label, value }) => {
                        const isActive = form.isPublicForRent === value;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setField("isPublicForRent", value)}
                            className={styles.radioBtn}
                          >
                            <div className={styles.radioOuter}>
                              {isActive && <div className={styles.radioInner} />}
                            </div>
                            <span className={styles.radioLabel}>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── ID & Infos ─── */}
            <section
              id="infos"
              ref={(el) => { sectionRefs.current["infos"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-list.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>ID &amp; Infos</h2>
              </div>
              <div className={styles.sectionFields}>

                {/* Identifikation */}
                <div>
                  <div className={styles.subHeading}>Identifikation</div>
                  <div className={styles.identTable}>
                    {([
                      { label: "ID",      icon: "icon-list",    field: "barcodeId" as const, placeholder: "Auto-Generierung", scan: "barcodeId" as const, photo: true  },
                      { label: "RFID",    icon: "icon-rfid",    field: "rfidId"    as const, placeholder: "–",                scan: null,                 photo: false },
                      { label: "QR-Code", icon: "icon-qr-code", field: "qrCodeId"  as const, placeholder: "–",                scan: "qrCodeId"  as const, photo: false },
                    ]).map(({ label, icon, field, placeholder, scan, photo }, i, arr) => (
                      <div key={field} className={styles.identRow} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--neutral-grey-200)" : "none" }}>
                        <div className={styles.identCellLabel}>
                          <Image src={`/icons/${icon}.svg`} alt="" width={22} height={22} />
                          {label}
                        </div>
                        <div className={styles.identDivider} />
                        <input
                          type="text"
                          value={form[field] ?? ""}
                          onChange={(e) => setField(field, e.target.value)}
                          placeholder={placeholder}
                          className={styles.identInput}
                        />
                        {scan && (
                          <button type="button" onClick={() => setShowScanner(scan)} className={styles.identMoreBtn} title="Scannen">
                            <Image src="/icons/icon-qr-code-scan.svg" alt="Scannen" width={20} height={20} />
                          </button>
                        )}
                        {photo && (
                          <button type="button" onClick={() => setShowLabelCamera(true)} className={styles.identMoreBtn} title="Foto aufnehmen">
                            <Image src="/icons/icon-camera.svg" alt="Foto" width={20} height={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {labelPhotoPreview && (
                    <div className={styles.identPhotoWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={labelPhotoPreview} alt="Etikette" className={styles.identPhoto} />
                      <button type="button" onClick={() => setLabelPhotoPreview(null)} className={styles.identPhotoRemove}>
                        <Image src="/icons/icon-close-small.svg" alt="" width={12} height={12} style={{ filter: "invert(1)" }} />
                      </button>
                      <span className={styles.identPhotoHint}>Etikette — ID manuell eingeben</span>
                    </div>
                  )}
                </div>

                {/* Notizen */}
                <div>
                  <div className={styles.subHeading}>Notizen</div>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Interne Anmerkungen zum Kostüm..."
                    rows={6}
                    className={styles.textarea}
                  />
                  <p className={styles.notesHint}>Die Notizen werden nicht im öffentlichen Netzwerk angezeigt.</p>
                </div>

                {/* Historie */}
                <div>
                  <div className={styles.subHeading}>Historie</div>
                  <div className={styles.historieTable}>
                    <div className={styles.historieRow}>
                      <span className={styles.historieDate}>—</span>
                      <span className={styles.historieText}>Datei wird nach dem Speichern erstellt</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Kommentar ─── */}
            <section
              id="nachrichten"
              ref={(el) => { sectionRefs.current["nachrichten"] = el; }}
              className={styles.sectionCard}
            >
              <div className={styles.sectionHeading}>
                <Image src="/icons/icon-chat.svg" alt="" width={30} height={30} />
                <h2 className={styles.sectionHeadingTitle}>Kommentar</h2>
              </div>

              <div className={styles.commentList}>
                {pendingComments.map((c, i) => (
                  <div key={i} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAvatar}>
                        {currentUserName.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <span className={styles.commentAuthor}>{currentUserName}</span>
                      <button
                        type="button"
                        onClick={() => setPendingComments((prev) => prev.filter((_, idx) => idx !== i))}
                        className={styles.commentDeleteBtn}
                      >✕</button>
                    </div>
                    <p className={styles.commentBody}>{c.body}</p>
                  </div>
                ))}

                <div className={styles.commentInput}>
                  <div className={styles.commentInputBody}>
                    <div className={styles.commentAvatar}>
                      {currentUserName.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Kommentar schreiben…"
                      rows={3}
                      className={styles.commentTextarea}
                    />
                  </div>
                  <div className={styles.commentFooter}>
                    <button
                      type="button"
                      disabled={!commentDraft.trim()}
                      onClick={() => {
                        if (!commentDraft.trim()) return;
                        setPendingComments((prev) => [...prev, {
                          body: commentDraft.trim(),
                          author_name: currentUserName,
                          created_at: new Date().toISOString(),
                        }]);
                        setCommentDraft("");
                      }}
                      className={`${styles.commentSubmitBtn} ${commentDraft.trim() ? styles.commentSubmitBtnActive : ""}`}
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>

                <p className={styles.commentHint}>Kommentare werden beim Speichern des Kostüms übernommen.</p>
              </div>
            </section>

            {/* Löschen — Mobile only, am Ende des Formulars */}
            {editCostume && (
              <div className={styles.deleteBtnMobileWrap}>
                <button
                  type="button"
                  onClick={() => setShowDeleteSheet(true)}
                  className="btn-secondary"
                  style={{ width: "100%" }}
                >
                  Kostüm löschen
                </button>
              </div>
            )}

            <div className={styles.bottomSpacer} />
          </div>
        </div>
      </div>

      {/* Camera overlay — Kostümbilder */}
      {showCamera && (
        <CameraCapture
          onCapture={(file) => {
            const preview = URL.createObjectURL(file);
            setImages((prev) => [...prev, { file, preview }]);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Camera overlay — Etikett fotografieren (handgeschrieben) */}
      {showLabelCamera && (
        <CameraCapture
          onCapture={(file) => {
            setLabelPhotoPreview(URL.createObjectURL(file));
            setShowLabelCamera(false);
          }}
          onClose={() => setShowLabelCamera(false)}
        />
      )}

      {/* Barcode/QR-Code Scanner */}
      {showScanner && (
        <BarcodeScanner
          onDetected={(code) => {
            setField(showScanner, code);
            setShowScanner(null);
          }}
          onClose={() => setShowScanner(null)}
        />
      )}

      {/* Delete sheet */}
      {showDeleteSheet && (
        <>
          <div onClick={() => setShowDeleteSheet(false)} className={styles.sheetBackdrop} />
          <div className={styles.sheet}>
            <div className={styles.sheetHandle} />
            <p className={styles.sheetTitle}>Kostüm löschen?</p>
            <p className={styles.sheetSubtitle}>Das Kostüm wird unwiderruflich gelöscht und kann nicht wiederhergestellt werden.</p>
            <button type="button" onClick={() => { setShowDeleteSheet(false); }} className="btn-danger" style={{ width: "100%" }}>
              Endgültig löschen
            </button>
            <button type="button" onClick={() => setShowDeleteSheet(false)} className="btn-primary" style={{ width: "100%" }}>
              Abbrechen
            </button>
          </div>
        </>
      )}

      {/* Close sheet */}
      {showCloseSheet && (
        <>
          <div onClick={() => setShowCloseSheet(false)} className={styles.sheetBackdrop} />
          <div className={styles.sheet}>
            <div className={styles.sheetHandle} />
            <p className={styles.sheetTitle}>Kostüm schliessen?</p>
            <p className={styles.sheetSubtitle}>Deine Eingaben gehen verloren, wenn du jetzt schliesst.</p>
            <button type="button" onClick={() => router.push("/")} className="btn-danger" style={{ width: "100%" }}>
              Schliessen ohne Speichern
            </button>
            <button type="button" onClick={() => setShowCloseSheet(false)} className="btn-primary" style={{ width: "100%" }}>
              Weiter bearbeiten
            </button>
          </div>
        </>
      )}
    </div>
  );
}
