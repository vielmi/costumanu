/**
 * Layout-Konstanten abgeleitet aus dem Design-System.
 * Pixel-Werte entsprechen den Figma-Specs in design-system.md.
 */

export const SIDEBAR = {
  EXPANDED_WIDTH: 209,
  COLLAPSED_WIDTH: 80,
} as const;

export const COCKPIT = {
  SEARCH_MAX_WIDTH: 640,
  CTA_CARD_WIDTH: 187,
  CTA_CARD_HEIGHT: 245,
} as const;

export const BREAKPOINTS = {
  /** iPad Mini 8.3 Portrait — primärer Mobile-Breakpoint */
  MOBILE_MAX: 743,
} as const;
