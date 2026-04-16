/**
 * Icon-Mappings für Taxonomy-Labels auf SVG-Dateinamen.
 * Ändert sich ein Label in der DB, nur hier anpassen.
 */

export const GENDER_ICON: Record<string, string> = {
  Herren: "male",
  Damen: "female",
  Unisex: "unisex",
  Kinder: "child",
  Tier: "animal",
  Fantasy: "fantasy",
};

export const MUSTER_ICON: Record<string, string> = {
  uni: "icon-material-solid",
  kariert: "icon-material-squared",
  gestreift: "icon-material-striped",
  gepunktet: "icon-material-dotted",
  gemustert: "icon-material-pattern",
  blumig: "icon-material-floral",
  abstrakt: "icon-material-abstract",
  animalprint: "icon-material-animal",
  paisley: "icon-material-paisley",
};

/** Gibt den Icon-Dateinamen für ein Gender-Label zurück, Fallback "unisex". */
export function getGenderIcon(labelDe: string | null | undefined): string {
  return GENDER_ICON[labelDe ?? ""] ?? "unisex";
}
