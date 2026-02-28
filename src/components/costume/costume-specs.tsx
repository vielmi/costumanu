"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { Costume, CostumeItem, CostumeProvenance, TaxonomyTerm } from "@/lib/types/costume";

type CostumeSpecsProps = {
  costume: Costume;
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  firstItem: CostumeItem | null;
  firstProvenance: CostumeProvenance | null;
};

const sizeDataLabels: Record<string, string> = {
  chest: t("costume.chest"),
  waist: t("costume.waist"),
  back_length: t("costume.backLength"),
  shoulder_width: t("costume.shoulderWidth"),
  hip: t("costume.hip"),
  inseam: t("costume.inseam"),
  thigh: t("costume.thigh"),
  waistband: t("costume.waistband"),
  skirt_length: t("costume.skirtLength"),
};

const colorMap: Record<string, string> = {
  Beige: "#d2b48c",
  Rosa: "#f4a6c1",
  Braun: "#8b4513",
  Schwarz: "#1a1a1a",
  Blau: "#2563eb",
  Rot: "#dc2626",
  Grau: "#9ca3af",
  Gold: "#d4a017",
  Weiss: "#f5f5f5",
  Grün: "#16a34a",
  Gelb: "#eab308",
  Orange: "#ea580c",
  Lila: "#9333ea",
  Silber: "#c0c0c0",
  Türkis: "#06b6d4",
  Bordeaux: "#722f37",
};

export function CostumeSpecs({
  costume,
  taxonomyByVocabulary,
  firstItem,
  firstProvenance,
}: CostumeSpecsProps) {
  const materials = taxonomyByVocabulary["material"] ?? [];
  const materialoptik = taxonomyByVocabulary["materialoptik"] ?? [];
  const muster = taxonomyByVocabulary["muster"] ?? [];
  const colors = taxonomyByVocabulary["color"] ?? [];
  const washing = taxonomyByVocabulary["washing_instruction"] ?? [];
  const sparten = taxonomyByVocabulary["sparte"] ?? [];
  const epochs = taxonomyByVocabulary["epoche"] ?? [];

  const hasKategorisierung =
    costume.gender_term || costume.clothing_type || epochs.length > 0 || sparten.length > 0;
  const hasAuffuehrung = !!firstProvenance;
  const hasMaterial =
    materials.length > 0 || materialoptik.length > 0 || muster.length > 0 || colors.length > 0;
  const hasMasse =
    firstItem?.size_label || (firstItem?.size_data && Object.keys(firstItem.size_data).length > 0);

  if (!hasKategorisierung && !hasAuffuehrung && !hasMaterial && !hasMasse && washing.length === 0) {
    return null;
  }

  return (
    <section className="px-4">
      <h2 className="mb-3 text-lg font-bold">{t("costume.specifications")}</h2>
      <Accordion type="multiple" defaultValue={["kategorisierung"]}>
        {/* Kategorisierung */}
        {hasKategorisierung && (
          <AccordionItem value="kategorisierung">
            <AccordionTrigger>{t("costume.categorization")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                {costume.gender_term && (
                  <SpecRow
                    label={t("costume.gender")}
                    value={costume.gender_term.label_de}
                  />
                )}
                {costume.clothing_type && (
                  <SpecRow
                    label={t("costume.clothingType")}
                    value={costume.clothing_type.label_de}
                  />
                )}
                {epochs.length > 0 && (
                  <SpecRow
                    label={t("costume.epoch")}
                    value={epochs.map((e) => e.label_de).join(", ")}
                  />
                )}
                {sparten.length > 0 && (
                  <SpecRow
                    label={t("costume.division")}
                    value={sparten.map((s) => s.label_de).join(", ")}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Aufführung */}
        {hasAuffuehrung && firstProvenance && (
          <AccordionItem value="auffuehrung">
            <AccordionTrigger>{t("costume.performance")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <SpecRow
                  label={t("costume.productionTitle")}
                  value={firstProvenance.production_title}
                />
                {firstProvenance.year && (
                  <SpecRow label={t("costume.year")} value={String(firstProvenance.year)} />
                )}
                {firstProvenance.actor_name && (
                  <SpecRow
                    label={t("costume.actor")}
                    value={firstProvenance.actor_name}
                  />
                )}
                {firstProvenance.role_name && (
                  <SpecRow label={t("costume.role")} value={firstProvenance.role_name} />
                )}
                {firstProvenance.director_name && (
                  <SpecRow label={t("costume.director")} value={firstProvenance.director_name} />
                )}
                {firstProvenance.costume_designer && (
                  <SpecRow
                    label={t("costume.costumeDesigner")}
                    value={firstProvenance.costume_designer}
                  />
                )}
                {firstProvenance.costume_assistant && (
                  <SpecRow
                    label={t("costume.costumeAssistant")}
                    value={firstProvenance.costume_assistant}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Material & Farbe */}
        {hasMaterial && (
          <AccordionItem value="material">
            <AccordionTrigger>{t("costume.materialAndColor")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                {materials.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("costume.material")}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {materials.map((m) => (
                        <Badge key={m.id} variant="secondary">
                          {m.label_de}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {materialoptik.length > 0 && (
                  <SpecRow
                    label={t("costume.materialAppearance")}
                    value={materialoptik.map((m) => m.label_de).join(", ")}
                  />
                )}
                {muster.length > 0 && (
                  <SpecRow
                    label={t("costume.pattern")}
                    value={muster.map((m) => m.label_de).join(", ")}
                  />
                )}
                {colors.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("costume.colorDirection")}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{
                              backgroundColor:
                                colorMap[c.label_de] ?? "#ccc",
                            }}
                          />
                          <span className="text-xs">{c.label_de}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Masse */}
        {hasMasse && firstItem && (
          <AccordionItem value="masse">
            <AccordionTrigger>{t("costume.measurements")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                {firstItem.size_label && (
                  <SpecRow
                    label={t("costume.sizeLabel")}
                    value={firstItem.size_label}
                  />
                )}
                {firstItem.size_data &&
                  Object.entries(firstItem.size_data).map(([key, val]) => (
                    <SpecRow
                      key={key}
                      label={sizeDataLabels[key] ?? key}
                      value={`${val} cm`}
                    />
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Waschanleitung */}
        {washing.length > 0 && (
          <AccordionItem value="waschanleitung">
            <AccordionTrigger>{t("costume.washingInstructions")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {washing.map((w) => (
                  <Badge key={w.id} variant="secondary">
                    {w.label_de}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
