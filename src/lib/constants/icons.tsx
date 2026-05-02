/**
 * Icon-Mappings für Taxonomy-Labels auf SVG-Dateinamen.
 * Ändert sich ein Label in der DB, nur hier anpassen.
 *
 * Shared React Icon Components (inline SVG, unterstützen currentColor):
 *   BurgerIcon — 3-Streifen Hamburger-Menü
 */

export function BurgerIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <rect width="24" height="2" rx="1" fill="currentColor" />
      <rect y="8" width="24" height="2" rx="1" fill="currentColor" />
      <rect y="16" width="24" height="2" rx="1" fill="currentColor" />
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
};

export const MUSTER_ICON: Record<string, string> = {
  uni:       "icon-material-solid",
  kariert:   "icon-material-squared",
  gestreift: "icon-material-stripe",
  gepunktet: "icon-material-pointed",
  floral:    "icon-material-floral",
  gemustert: "icon-material-batik",
  verlauf:   "icon-material-gradient",
  abstrakt:  "icon-material-gradient",
  tierprint: "icon-animal",
  anderes:   "icon-material-divers",
};

/** Gibt den Icon-Dateinamen für ein Gender-Label zurück, Fallback "unisex". */
export function getGenderIcon(labelDe: string | null | undefined): string {
  return GENDER_ICON[labelDe ?? ""] ?? "unisex";
}

/** Gibt den Icon-Dateinamen für ein Muster-Label zurück, Fallback "icon-material-divers". */
export function getMusterIcon(labelDe: string | null | undefined): string {
  return MUSTER_ICON[(labelDe ?? "").toLowerCase()] ?? "icon-material-divers";
}
