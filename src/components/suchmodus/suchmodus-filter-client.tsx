"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./suchmodus-filter.module.css";
import { getGenderIcon, getMusterIcon } from "@/lib/constants/icons";
import { COLOR_SWATCHES } from "@/lib/constants/color-swatches";

// ─── Types ────────────────────────────────────────────────────────────────────

type Term = { id: string; label_de: string };

export type SuchmodusFilterProps = {
  genderTerms: Term[];
  clothingTypes: Term[];
  segmentTerms: Term[];
  epocheTerms: Term[];
  materialTerms: Term[];
  farbeTerms: Term[];
  musterTerms: Term[];
};


// ─── EU sizes ────────────────────────────────────────────────────────────────

const INT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const EU_SIZES  = ["32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54 S"];

// ─── Toggle helper ────────────────────────────────────────────────────────────

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) { next.delete(id); } else { next.add(id); }
  return next;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SuchmodusFilterClient({
  genderTerms,
  clothingTypes,
  segmentTerms,
  epocheTerms,
  materialTerms,
  farbeTerms,
  musterTerms,
}: SuchmodusFilterProps) {
  const router = useRouter();

  // Multi-select state
  const [selectedGenders,       setSelectedGenders]       = useState<Set<string>>(new Set());
  const [selectedClothingTypes, setSelectedClothingTypes] = useState<Set<string>>(new Set());
  const [selectedSegments,      setSelectedSegments]      = useState<Set<string>>(new Set());
  const [selectedMaterials,     setSelectedMaterials]     = useState<Set<string>>(new Set());
  const [selectedFarben,        setSelectedFarben]        = useState<Set<string>>(new Set());
  const [selectedMuster,        setSelectedMuster]        = useState<Set<string>>(new Set());
  const [selectedEpochen,       setSelectedEpochen]       = useState<Set<string>>(new Set());
  const [selectedIntSizes,      setSelectedIntSizes]      = useState<Set<string>>(new Set());
  const [selectedEuSizes,       setSelectedEuSizes]       = useState<Set<string>>(new Set());

  // Free-text
  const [clothingSearch, setClothingSearch] = useState("");
  const [titleSearch,    setTitleSearch]    = useState("");
  const [actorSearch,    setActorSearch]    = useState("");
  const [roleSearch,     setRoleSearch]     = useState("");
  const [directorSearch, setDirectorSearch] = useState("");
  const [designerSearch, setDesignerSearch] = useState("");
  const [assistantSearch,setAssistantSearch]= useState("");
  const [materialSearch, setMaterialSearch] = useState("");

  function reset() {
    setSelectedGenders(new Set());
    setSelectedClothingTypes(new Set());
    setSelectedSegments(new Set());
    setSelectedEpochen(new Set());
    setSelectedMaterials(new Set());
    setSelectedFarben(new Set());
    setSelectedMuster(new Set());
    setSelectedIntSizes(new Set());
    setSelectedEuSizes(new Set());
    setClothingSearch("");
    setTitleSearch("");
    setActorSearch("");
    setRoleSearch("");
    setDirectorSearch("");
    setDesignerSearch("");
    setAssistantSearch("");
    setMaterialSearch("");
  }

  function apply() {
    const params = new URLSearchParams();
    if (selectedGenders.size === 1)       params.set("gender",        [...selectedGenders][0]);
    if (selectedGenders.size > 1)         params.set("genders",       [...selectedGenders].join(","));
    if (selectedClothingTypes.size > 0)   params.set("clothing_type", [...selectedClothingTypes].join(","));
    if (selectedSegments.size > 0)        params.set("segment",       [...selectedSegments].join(","));
    if (selectedMaterials.size > 0)       params.set("material",      [...selectedMaterials].join(","));
    if (selectedFarben.size > 0)          params.set("farbe",         [...selectedFarben].join(","));
    if (selectedMuster.size > 0)          params.set("muster",        [...selectedMuster].join(","));
    if (selectedEpochen.size > 0)         params.set("epoche",        [...selectedEpochen].join(","));
    if (selectedIntSizes.size > 0)        params.set("size_int",      [...selectedIntSizes].join(","));
    if (selectedEuSizes.size > 0)         params.set("size_eu",       [...selectedEuSizes].join(","));
    if (titleSearch.trim())               params.set("title",         titleSearch.trim());
    if (actorSearch.trim())               params.set("actor",         actorSearch.trim());
    if (roleSearch.trim())                params.set("role",          roleSearch.trim());
    if (directorSearch.trim())            params.set("director",      directorSearch.trim());
    if (designerSearch.trim())            params.set("designer",      designerSearch.trim());
    if (assistantSearch.trim())           params.set("assistant",     assistantSearch.trim());
    router.push(`/suchmodus/results?${params.toString()}`);
  }

  // Filtered clothing type list
  const visibleClothingTypes = clothingSearch
    ? clothingTypes.filter((t) => t.label_de.toLowerCase().includes(clothingSearch.toLowerCase()))
    : clothingTypes;

  const visibleMaterials = materialSearch
    ? materialTerms.filter((t) => t.label_de.toLowerCase().includes(materialSearch.toLowerCase()))
    : materialTerms;

  return (
    <div className={styles.page}>

      {/* ═══ Header ═══ */}
      <header className={styles.header}>
        <button type="button" className={styles.resetBtn} onClick={reset}>
          Zurücksetzen
        </button>
        <h1 className={styles.headerTitle}>Kostümfilter</h1>
        <button type="button" className={styles.applyBtn} onClick={apply}>
          Anwenden
        </button>
      </header>

      {/* ═══ Body ═══ */}
      <div className={styles.body}>

        {/* ── Kategorie ── */}
        <section className={styles.section}>
          <span className={styles.sectionBadge}>Kategorie</span>

          {/* Gender / Typ */}
          <p className={styles.subSectionLabel}>Gender oder Typ</p>
          <div className={styles.genderGrid}>
            {genderTerms.map((term) => (
              <button
                key={term.id}
                type="button"
                className={`${styles.genderCard} ${selectedGenders.has(term.id) ? styles.selected : ""}`}
                onClick={() => setSelectedGenders((s) => toggle(s, term.id))}
              >
                <Image
                  src={`/icons/icon-${getGenderIcon(term.label_de)}.svg`}
                  alt=""
                  width={32}
                  height={32}
                />
                <span className={styles.genderCardLabel}>{term.label_de}</span>
              </button>
            ))}
          </div>

          {/* Bekleidungsart */}
          <p className={styles.subSectionLabel} style={{ marginTop: 8 }}>Bekleidungsart</p>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><Image src="/icons/icon-search.svg" alt="" width={20} height={20} /></span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Bekleidungsart durchsuchen"
              value={clothingSearch}
              onChange={(e) => setClothingSearch(e.target.value)}
            />
          </div>
          <div className={styles.chipGrid}>
            {visibleClothingTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.chip} ${selectedClothingTypes.has(t.id) ? styles.selected : ""}`}
                onClick={() => setSelectedClothingTypes((s) => toggle(s, t.id))}
              >
                {t.label_de}
              </button>
            ))}
          </div>
        </section>

        {/* ── Sparte ── */}
        {segmentTerms.length > 0 && (
          <section className={styles.section}>
            <span className={styles.sectionBadge}>Sparte</span>
            <div className={styles.chipGrid}>
              {segmentTerms.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.chip} ${selectedSegments.has(t.id) ? styles.selected : ""}`}
                  onClick={() => setSelectedSegments((s) => toggle(s, t.id))}
                >
                  {t.label_de}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Epoche ── */}
        {epocheTerms.length > 0 && (
          <section className={styles.section}>
            <span className={styles.sectionBadge}>Epoche</span>
            <div className={styles.chipGrid}>
              {epocheTerms.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.chip} ${selectedEpochen.has(t.id) ? styles.selected : ""}`}
                  onClick={() => setSelectedEpochen((s) => toggle(s, t.id))}
                >
                  {t.label_de}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Aufführung ── */}
        <section className={styles.section}>
          <span className={styles.sectionBadge}>Aufführung</span>
          {[
            { label: "Stücktitel", value: titleSearch,    setter: setTitleSearch    },
            { label: "Darsteller", value: actorSearch,    setter: setActorSearch    },
            { label: "Rolle",      value: roleSearch,     setter: setRoleSearch     },
          ].map(({ label, value, setter }) => (
            <div key={label} className={styles.searchWrap}>
              <span className={styles.searchIcon}><Image src="/icons/icon-search.svg" alt="" width={20} height={20} /></span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={label}
                value={value}
                onChange={(e) => setter(e.target.value)}
              />
            </div>
          ))}
        </section>

        {/* ── Regie & Assistenz ── */}
        <section className={styles.section}>
          <span className={styles.sectionBadge}>Regie &amp; Assistenz</span>
          {[
            { label: "Regie",            value: directorSearch, setter: setDirectorSearch },
            { label: "Kostümbildner",    value: designerSearch, setter: setDesignerSearch },
            { label: "Kostümassistenz",  value: assistantSearch,setter: setAssistantSearch },
          ].map(({ label, value, setter }) => (
            <div key={label} className={styles.searchWrap}>
              <span className={styles.searchIcon}><Image src="/icons/icon-search.svg" alt="" width={20} height={20} /></span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={label}
                value={value}
                onChange={(e) => setter(e.target.value)}
              />
            </div>
          ))}
        </section>

        {/* ── Konfektionsgrösse ── */}
        <section className={styles.section}>
          <span className={styles.sectionBadge}>Konfektionsgrösse</span>
          <p className={styles.subSectionLabel}>International</p>
          <div className={styles.chipGrid}>
            {INT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.chip} ${selectedIntSizes.has(s) ? styles.selected : ""}`}
                onClick={() => setSelectedIntSizes((set) => toggle(set, s))}
              >
                {s}
              </button>
            ))}
          </div>
          <p className={styles.subSectionLabel}>EU</p>
          <div className={styles.chipGrid}>
            {EU_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.chip} ${selectedEuSizes.has(s) ? styles.selected : ""}`}
                onClick={() => setSelectedEuSizes((set) => toggle(set, s))}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* ── Material ── */}
        <section className={styles.section}>
          <span className={styles.sectionBadge}>Material</span>

          <p className={styles.subSectionLabel}>Materialart &amp; Verarbeitung</p>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><Image src="/icons/icon-search.svg" alt="" width={20} height={20} /></span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Materialart durchsuchen"
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
            />
          </div>
          <div className={styles.chipGrid}>
            {visibleMaterials.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.chip} ${selectedMaterials.has(t.id) ? styles.selected : ""}`}
                onClick={() => setSelectedMaterials((s) => toggle(s, t.id))}
              >
                {t.label_de}
              </button>
            ))}
          </div>

          {/* Muster */}
          {musterTerms.length > 0 && (
            <>
              <p className={styles.subSectionLabel} style={{ marginTop: 8 }}>Muster</p>
              <div className={styles.musterGrid}>
                {musterTerms.map((t) => {
                  const iconName = getMusterIcon(t.label_de);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.musterCard} ${selectedMuster.has(t.id) ? styles.selected : ""}`}
                      onClick={() => setSelectedMuster((s) => toggle(s, t.id))}
                    >
                      <Image src={`/icons/${iconName}.svg`} alt="" width={36} height={36} />
                      <span className={styles.musterCardLabel}>{t.label_de}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ── Farbe ── */}
        {farbeTerms.length > 0 && (
          <section className={styles.section}>
            <span className={styles.sectionBadge}>Farbe</span>
            <div className={styles.colorGrid}>
              {farbeTerms.map((t) => {
                const hex = COLOR_SWATCHES[t.label_de] ?? "#A0A0A0";
                const isGradient = hex.startsWith("linear") || hex.startsWith("conic");
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.colorSwatch} ${selectedFarben.has(t.id) ? styles.selected : ""}`}
                    style={
                      isGradient
                        ? { background: hex, backgroundSize: "8px 8px" }
                        : { background: hex, border: hex === "#FFFFFF" ? "2px solid #D1D1D1" : undefined }
                    }
                    onClick={() => setSelectedFarben((s) => toggle(s, t.id))}
                    aria-label={t.label_de}
                    title={t.label_de}
                  />
                );
              })}
            </div>
          </section>
        )}

      </div>


    </div>
  );
}
