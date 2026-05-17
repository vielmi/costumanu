/**
 * Icon-Mappings für Taxonomy-Labels auf SVG-Dateinamen.
 * Ändert sich ein Label in der DB, nur hier anpassen.
 *
 * Shared React Icon Components (inline SVG, unterstützen currentColor):
 *   BurgerIcon — 2-Streifen Menü-Icon
 */

export function BurgerIcon() {
  return (
    <svg width="24" height="14" viewBox="0 0 24 14" fill="none" aria-hidden="true">
      <rect width="24" height="2" rx="1" fill="currentColor" />
      <rect y="12" width="24" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export const GENDER_ICON: Record<string, string> = {
  Herren: "male",
  Damen: "female",
  Unisex: "unisex",
  Kinder: "children",
  Tier: "animal",
  Fantasy: "fantasy",
  Anderes: "unisex",
};

export const MUSTER_ICON: Record<string, string> = {
  uni: "icon-material-solid",
  kariert: "icon-material-squared",
  gestreift: "icon-material-stripe",
  gepunktet: "icon-material-pointed",
  floral: "icon-material-floral",
  gemustert: "icon-material-batik",
  verlauf: "icon-material-gradient",
  abstrakt: "icon-material-gradient",
  tierprint: "icon-animal",
  anderes: "icon-material-divers",
};

/** Gibt den Icon-Dateinamen für ein Gender-Label zurück, Fallback "unisex". */
export function getGenderIcon(labelDe: string | null | undefined): string {
  return GENDER_ICON[labelDe ?? ""] ?? "unisex";
}

/** Gibt den Icon-Dateinamen für ein Muster-Label zurück, Fallback "icon-material-divers". */
export function getMusterIcon(labelDe: string | null | undefined): string {
  return MUSTER_ICON[(labelDe ?? "").toLowerCase()] ?? "icon-material-divers";
}

export const CLOTHING_TYPE_ICON: Record<string, string> = {
  Anzug: "icon-kleider-anzug",
  Bluse: "icon-kleider-bluse",
  Hemd: "icon-kleider-hemd",
  Hose: "icon-kleider-hose",
  Jacke: "icon-kleider-jacke",
  Jacken: "icon-kleider-jacke",
  Jupe: "icon-kleider-jupe",
  Rock: "icon-kleider-jupe",
  Kleid: "icon-kleider-kleid",
  Abendkleid: "icon-kleider-kleid",
  Ballkleid: "icon-kleider-kleid",
  Hochzeitskleid: "icon-kleider-kleid",
  Pullover: "icon-kleider-pullover",
  Mäntel: "icon-kleider-Mantel",
  "Mantel & Jacke": "icon-kleider-Mantel",
  Shirt: "icon-kleider-shirt",
  Uniform: "icon-kleider-uniform",
  Plastisch: "icon-kleider-plastik",
  Kostüm: "icon-kleider-plastik",
  "Kostüme (Komplett)": "icon-kleider-plastik",
  Anderes: "icon-kleider-anderes",
  Jumpsuit: "icon-kleider-jumpsuit",
  Weste: "icon-kleider-weste",
  Gilet: "icon-kleider-weste",
};

/** Gibt den Icon-Dateinamen für einen Bekleidungstyp zurück, Fallback "icon-shirt". */
export function getClothingTypeIcon(labelDe: string | null | undefined): string {
  return CLOTHING_TYPE_ICON[labelDe ?? ""] ?? "icon-shirt";
}
