import de from "./locales/de.json";

const locales = { de } as const;

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof de;

const DEFAULT_LOCALE: Locale = "de";

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

/**
 * Get a translation function for the given locale.
 * Works in both server and client components.
 */
export function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  const messages = locales[locale];

  function t(key: string, params?: Record<string, string | number>): string {
    const value = getNestedValue(messages as unknown as Record<string, unknown>, key);
    return interpolate(value, params);
  }

  return t;
}

/**
 * Default translation function using the default locale.
 */
export const t = getTranslations(DEFAULT_LOCALE);
