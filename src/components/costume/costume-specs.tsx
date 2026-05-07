"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { t } from "@/lib/i18n";
import { COLOR_SWATCHES } from "@/lib/constants/color-swatches";
import type { Costume, CostumeItem, CostumeProvenance, TaxonomyTerm } from "@/lib/types/costume";

type CostumeSpecsProps = {
  costume: Costume;
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  firstItem: CostumeItem | null;
  firstProvenance: CostumeProvenance | null;
};

const sizeDataLabels: Record<string, string> = {
  chest:          t("costume.chest"),
  waist:          t("costume.waist"),
  hip:            t("costume.hip"),
  back_length:    t("costume.backLength"),
  shoulder_width: t("costume.shoulderWidth"),
  leg_length:     t("costume.legLength"),
};


const statusLabel: Record<string, string> = {
  available: t("costume.statusAvailable"),
  rented:    t("costume.statusRented"),
  cleaning:  t("costume.statusCleaning"),
  repair:    t("costume.statusRepair"),
  lost:      t("costume.statusLost"),
};

export function CostumeSpecs({ costume, taxonomyByVocabulary, firstItem, firstProvenance }: CostumeSpecsProps) {
  const isMobile = useIsMobile();
  const materials    = taxonomyByVocabulary["material"]            ?? [];
  const materialoptik = taxonomyByVocabulary["materialoptik"]      ?? [];
  const muster       = taxonomyByVocabulary["muster"]              ?? [];
  const colors       = taxonomyByVocabulary["color"]               ?? [];
  const washing = [
    ...(taxonomyByVocabulary["temperature"]  ?? []),
    ...(taxonomyByVocabulary["washing_type"] ?? []),
    ...(taxonomyByVocabulary["drying"]       ?? []),
    ...(taxonomyByVocabulary["ironing"]      ?? []),
  ];
  const sparten      = taxonomyByVocabulary["sparte"]              ?? [];
  const epochs       = taxonomyByVocabulary["epoche"]              ?? [];
  const subtypes     = taxonomyByVocabulary["clothing_subtype"]    ?? [];

  const sizeDataEntries = Object.entries(firstItem?.size_data ?? {}).filter(([, v]) => v !== null && v !== undefined && String(v) !== "");
  const hasMasse   = !!(firstItem?.size_label || sizeDataEntries.length > 0 || firstItem?.size_notes);
  const hasDetails = !!(costume.gender_term || costume.clothing_type || epochs.length > 0 || sparten.length > 0 || subtypes.length > 0);
  const hasMaterial = materials.length > 0 || materialoptik.length > 0 || muster.length > 0 || colors.length > 0;
  const hasLocation = !!(costume.theater || firstItem?.storage_location_path || firstItem?.current_status);

  const address = costume.theater?.address_info as Record<string, string> | null | undefined;
  const locationParts = firstItem?.storage_location_path?.split(".") ?? [];

  return (
    <section style={{ padding: isMobile ? "0 16px 32px" : "0 32px 32px" }}>
      <div style={isMobile ? {} : { maxWidth: 560, margin: "0 auto" }}>
      <Accordion type="multiple" defaultValue={[]}>

        {/* 1 — Masse */}
        {hasMasse && firstItem && (
          <AccordionItem value="masse">
            <AccordionTrigger>{t("costume.measurements")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                {firstItem.size_label && (
                  <InlineRow label={t("costume.sizeLabel")} value={firstItem.size_label} />
                )}
                {(sizeDataEntries.length > 0 || firstItem.size_notes) && (
                  <InlineRow
                    label={t("costume.additionalMeasurements")}
                    value={[
                      sizeDataEntries.map(([key, val]) => `${sizeDataLabels[key] ?? key}: ${val} cm`).join(", "),
                      firstItem.size_notes ?? "",
                    ].filter(Boolean).join(", ")}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 2 — Kostümdetails */}
        {hasDetails && (
          <AccordionItem value="details">
            <AccordionTrigger>{t("costume.costumeDetails")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                {costume.gender_term && (
                  <InlineRow label={t("costume.genderAndType")} value={costume.gender_term.label_de} />
                )}
                {epochs.length > 0 && (
                  <InlineRow label={t("costume.epoch")} value={epochs.map((e) => e.label_de).join(", ")} />
                )}
                {sparten.length > 0 && (
                  <InlineRow label={t("costume.division")} value={sparten.map((s) => s.label_de).join(", ")} />
                )}
                {costume.clothing_type && (
                  <InlineRow label={t("costume.clothingType")} value={costume.clothing_type.label_de} />
                )}
                {subtypes.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>
                      <span style={{ fontWeight: "var(--font-weight-600)" as React.CSSProperties["fontWeight"] }}>{t("costume.clothingSubType")}:</span>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {subtypes.map((s) => (
                        <span key={s.id} style={{
                          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", fontWeight: 500,
                          color: "var(--secondary-700)",
                          background: "var(--neutral-grey-50)",
                          border: "1px solid var(--secondary-800)",
                          borderRadius: 44, padding: "4px 14px",
                          whiteSpace: "nowrap",
                        }}>
                          {s.label_de}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 3 — Material & Farbe */}
        {hasMaterial && (
          <AccordionItem value="material">
            <AccordionTrigger>{t("costume.materialAndColor")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                {materials.length > 0 && (
                  <InlineRow label={t("costume.material")} value={materials.map((m) => m.label_de).join(", ")} />
                )}
                {materialoptik.length > 0 && (
                  <InlineRow label={t("costume.materialAppearance")} value={materialoptik.map((m) => m.label_de).join(", ")} />
                )}
                {muster.length > 0 && (
                  <InlineRow label={t("costume.pattern")} value={muster.map((m) => m.label_de).join(", ")} />
                )}
                {colors.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: "var(--font-weight-600)" as React.CSSProperties["fontWeight"], color: "var(--neutral-grey-700)", flexShrink: 0 }}>
                      {t("costume.colors")}:
                    </span>
                    {colors.map((c) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: COLOR_SWATCHES[c.label_de] ?? "#ccc",
                          border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0,
                        }} />
                        <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)" }}>{c.label_de}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 4 — Pflege */}
        {washing.length > 0 && (
          <AccordionItem value="pflege">
            <AccordionTrigger>{t("costume.care")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                {washing.map((w) => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
                      color: "var(--neutral-grey-700)",
                    }}>
                      {w.label_de}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 5 — Produktion */}
        {firstProvenance && (
          <AccordionItem value="produktion">
            <AccordionTrigger>{t("costume.production")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <SpecRow label={t("costume.productionTitle")} value={firstProvenance.production_title} />
                {firstProvenance.year && (
                  <SpecRow label={t("costume.seasonYear")} value={String(firstProvenance.year)} />
                )}
                {firstProvenance.director_name && (
                  <SpecRow label={t("costume.director")} value={firstProvenance.director_name} />
                )}
                {firstProvenance.costume_designer && (
                  <SpecRow label={t("costume.costumeDesigner")} value={firstProvenance.costume_designer} />
                )}
                {firstProvenance.role_name && (
                  <SpecRow label={t("costume.role")} value={firstProvenance.role_name} />
                )}
                {firstProvenance.actor_name && (
                  <SpecRow label={t("costume.actor")} value={firstProvenance.actor_name} />
                )}
                {firstProvenance.costume_assistant && (
                  <SpecRow label={t("costume.costumeAssistant")} value={firstProvenance.costume_assistant} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 6 — Standort & Verfügbarkeit */}
        {hasLocation && (
          <AccordionItem value="standort">
            <AccordionTrigger>{t("costume.locationAndAvailability")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                {costume.theater && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: 700, color: "var(--neutral-grey-700)", margin: 0 }}>
                      {costume.theater.name}:
                    </p>
                    {address?.venue && (
                      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>{address.venue}</p>
                    )}
                    {address?.street && (
                      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>{address.street}</p>
                    )}
                    {(address?.zip || address?.city) && (
                      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>
                        {[address.zip, address.city].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                )}

                {locationParts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: 700, color: "var(--neutral-grey-700)", margin: 0 }}>
                      {t("costume.placement")}:
                    </p>
                    {locationParts[0] && (
                      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>Stockwerk: {locationParts[0]}</p>
                    )}
                    {locationParts[1] && (
                      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>Regal Nr.: {locationParts[1]}</p>
                    )}
                    {locationParts[2] && (
                      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>Sektor: {locationParts[2]}</p>
                    )}
                  </div>
                )}

                {firstItem?.current_status && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: 700, color: "var(--neutral-grey-700)", margin: 0 }}>
                      {t("costume.availability")}:
                    </p>
                    <AvailabilityIndicator status={firstItem.current_status} />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 7 — ID & Infos */}
        {firstItem && (
          <AccordionItem value="id">
            <AccordionTrigger>{t("costume.idAndInfo")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <IdRow label="ID" value={firstItem.barcode_id} />
                {firstItem.rfid_id && (
                  <IdRow label="Etikett" value={firstItem.rfid_id} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

      </Accordion>
      </div>
    </section>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: 500, color: "var(--neutral-grey-500)", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function InlineRow({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>
      <span style={{ fontWeight: "var(--font-weight-600)" as React.CSSProperties["fontWeight"] }}>{label}:</span>{" "}{value}
    </p>
  );
}

function AvailabilityIndicator({ status }: { status: string }) {
  const isAvailable = status === "available";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: isAvailable ? "var(--color-status-available)" : "var(--neutral-grey-400)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Image src="/icons/icon-check.svg" alt="" width={10} height={10} style={{ filter: "invert(1)" }} />
      </span>
      <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)" }}>
        {statusLabel[status] ?? status}
      </span>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", margin: 0 }}>
        <span style={{ fontWeight: "var(--font-weight-600)" as React.CSSProperties["fontWeight"] }}>{label}:</span>{" "}{value}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, opacity: copied ? 1 : 0.5 }}
        title="Kopieren"
      >
        <Image
          src={copied ? "/icons/icon-check.svg" : "/icons/icon-copy.svg"}
          alt={copied ? "Kopiert" : "Kopieren"}
          width={16}
          height={16}
        />
      </button>
    </div>
  );
}
