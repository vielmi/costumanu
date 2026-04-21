# design-system.md — HCID Fundus Design System Rules
> Auto-generated from Figma file: **HCID-Fundus-Layout-01**
> Use this file to guide all Figma-to-code integration via MCP.

---

## 1. Typography

### Font Family

**Inter** — geometrischer Sans-Serif (Google Fonts, Open Source). Schrift kann jederzeit durch Anpassen der CSS-Variable `--font-family-base` gewechselt werden.

**Implementation via `next/font/google`** (empfohlen für Next.js):

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-family-base',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

```css
/* src/app/globals.css — kein @import url() nötig */
@theme inline {
  --font-sans: var(--font-family-base); /* wird von layout.tsx gesetzt */
}
```

> **Warum `next/font` statt `@import url()`:**
> - ✅ Self-hosted — kein Request an Google-Server (DSGVO/DSG-konform)
> - ✅ Automatisches Preloading und `font-display: swap`
> - ✅ Kein Render-Blocking
> - ❌ `@import url()` sendet IP-Adressen der Nutzer an Google — für Schweizer Projekte problematisch

### Font Weights in use
```css
--font-weight-400: 400;  /* Regular */
--font-weight-500: 500;  /* Medium  */
--font-weight-700: 700;  /* Bold    */
```
> Note: `font-weight-300` and `font-weight-900` appear in the design system weight showcase but are **not used** in any text style spec. Do not apply them in components unless explicitly designed.

---

---

### Typography Scale — Tablet

| Token | Role | px | Line-height | Regular (400) letter-spacing | Medium (500) letter-spacing | Bold (700) letter-spacing |
|---|---|---|---|---|---|---|
| `font-size-1000` | H1 | 36px | 120% | 0% | 0.3% | 0% |
| `font-size-900`  | H2 | 32px | 130% | 0% | 0%   | 0% |
| `font-size-800`  | H3 | 28px | 130% | 0% | 0%   | 0% |
| `font-size-700`  | H4 | 26px | 140% | 0% | 0%   | 0% |
| `font-size-600`  | H5 | 24px | 140% | 0% | 0%   | 0% |
| `font-size-500`  | H6 | 22px | 150% | 0% | 0%   | 0% |
| `font-size-400`  | Body 1 | 20px | 150% | 0% | 0% | 0% |
| `font-size-350`  | Body 2 | 18px | 150% | 0% | 0% | 0% |
| `font-size-300`  | Subtitle 1 | 16px | 150% | 0% | 0% | 0% |
| `font-size-200`  | Subtitle 2 | 14px | 150% | 0.2% | 0.2% | 0% |
| `font-size-100`  | Label-1 | 12px | 150% | 1% | 0% | 0% |
| `font-size-50`   | Micro (ID-Nummern) | 10px | — | — | — | — |

> `font-size-50` ist nicht in der Figma-Skala definiert, wird aber in der Implementierung für Kostüm-ID-Texte (10px) verwendet.

### Typography Scale — Mobile (`-s` suffix)

| Token | Role | px | Line-height | Regular (400) letter-spacing | Medium (500) letter-spacing | Bold (700) letter-spacing |
|---|---|---|---|---|---|---|
| `font-size-1000-s` | H1 | 30px | 120% | 0% | 0% | 0% |
| `font-size-900-s`  | H2 | 28px | 130% | 0% | 0% | 0% |
| `font-size-800-s`  | H3 | 26px | 130% | 0% | 0% | 0% |
| `font-size-700-s`  | H4 | 24px | 140% | 0% | 0% | 0% |
| `font-size-600-s`  | H5 | 22px | 140% | 0% | 0.5% | 0% |
| `font-size-500-s`  | H6 | 20px | 150% | 0% | 0% | 0% |
| `font-size-400-s`  | Body 1 | 20px | 150% | 0% | 0% | 0% |
| `font-size-350-s`  | Body 2 | 18px | 150% | 0% | 0% | 0% |
| `font-size-300-s`  | Subtitle 1 | 16px | 150% | 0% | 0% | 0% |
| `font-size-200-s`  | Subtitle 2 | 14px | 150% | 0% | 1% | 0% |
| `font-size-100-s`  | Label-1 | 12px †| 150% | 0% | 1% | 0% |

> † `font-size-100-s` Medium uses **10px** (not 12px). This is the only token where font-size differs per weight variant. Regular and Bold = 12px, Medium = 10px.

---

### Complete CSS Custom Properties

```css
:root {
  /* ─── Font Family ─── */
  --font-family-base: 'Inter', sans-serif;

  /* ─── Font Weights ─── */
  --font-weight-400: 400;
  --font-weight-500: 500;
  --font-weight-700: 700;

  /* ─── Font Sizes: Tablet ─── */
  --font-size-1000: 36px;   /* H1        */
  --font-size-900:  32px;   /* H2        */
  --font-size-800:  28px;   /* H3        */
  --font-size-700:  26px;   /* H4        */
  --font-size-600:  24px;   /* H5        */
  --font-size-500:  22px;   /* H6        */
  --font-size-400:  20px;   /* Body 1    */
  --font-size-350:  18px;   /* Body 2    */
  --font-size-300:  16px;   /* Subtitle 1*/
  --font-size-200:  14px;   /* Subtitle 2*/
  --font-size-100:  12px;   /* Label-1   */
  --font-size-50:   10px;   /* Micro — nicht in Figma-Skala, für ID-Nummern (Kostüm List Item) */

  /* ─── Font Sizes: Mobile ─── */
  --font-size-1000-s: 30px; /* H1 — scaled down from 36px tablet */
  --font-size-900-s:  28px; /* H2 — scaled down from 32px tablet */
  --font-size-800-s:  26px;
  --font-size-700-s:  24px;
  --font-size-600-s:  22px;
  --font-size-500-s:  20px;
  --font-size-400-s:  20px;
  --font-size-350-s:  18px;
  --font-size-300-s:  16px;
  --font-size-200-s:  14px;
  --font-size-100-s:  12px; /* Medium variant: 10px — apply via weight-specific class */

  /* ─── Line Heights ─── */
  --line-height-120: 1.2;   /* H1 */
  --line-height-130: 1.3;   /* H2, H3 */
  --line-height-140: 1.4;   /* H4, H5 */
  --line-height-150: 1.5;   /* H6, Body, Subtitle, Label */
}
```

### Text Style Utility Classes (recommended pattern)

```css
/* Tablet — apply weight variant via modifier class or prop */
.text-h1 {
  font-family: var(--font-family-base);
  font-size: var(--font-size-1000);
  line-height: var(--line-height-120);
}
.text-h1--medium { font-weight: 500; letter-spacing: 0.003em; }
.text-h1--bold   { font-weight: 700; }
.text-h1--regular { font-weight: 400; }

.text-h2 { font-size: var(--font-size-900); line-height: var(--line-height-130); }
.text-h3 { font-size: var(--font-size-800); line-height: var(--line-height-130); }
.text-h4 { font-size: var(--font-size-700); line-height: var(--line-height-140); }
.text-h5 { font-size: var(--font-size-600); line-height: var(--line-height-140); }
.text-h6 { font-size: var(--font-size-500); line-height: var(--line-height-150); }
.text-body-1    { font-size: var(--font-size-400); line-height: var(--line-height-150); }
.text-body-2    { font-size: var(--font-size-350); line-height: var(--line-height-150); }
.text-subtitle-1 { font-size: var(--font-size-300); line-height: var(--line-height-150); }
.text-subtitle-2 { font-size: var(--font-size-200); line-height: var(--line-height-150); }
.text-label-1   { font-size: var(--font-size-100); line-height: var(--line-height-150); }

/* Responsive override — mobile */
@media (max-width: 743px) {
  .text-h1 { font-size: var(--font-size-1000-s); }
  .text-h2 { font-size: var(--font-size-900-s); }
  .text-h3 { font-size: var(--font-size-800-s); }
  .text-h4 { font-size: var(--font-size-700-s); }
  .text-h5 { font-size: var(--font-size-600-s); }
  .text-h6 { font-size: var(--font-size-500-s); }
  .text-body-1     { font-size: var(--font-size-400-s); }
  .text-body-2     { font-size: var(--font-size-350-s); }
  .text-subtitle-1 { font-size: var(--font-size-300-s); }
  .text-subtitle-2 { font-size: var(--font-size-200-s); }
  .text-label-1    { font-size: var(--font-size-100-s); }
}
```

---

## 2. Color Tokens

### 00 Neutral Colors
```css
--neutral-white:      #FFFFFF;
--neutral-grey-50:    #FBFBFB;
--neutral-grey-100:   #F3F4F6;
--neutral-grey-200:   #EEEEEE;
--neutral-grey-300:   #D1D1D1;
--neutral-grey-400:   #A4A4A4;
--neutral-grey-500:   #606060;
--neutral-grey-600:   #242727;
--neutral-grey-700:   #0B0B0B;
--neutral-black:      #000000;
```

### 01 Primary Colors (Gold/Olive)
```css
--primary-900: #B59B3A;
--primary-800: #C7B46B;
--primary-700: #DDD5B7;
--primary-600: #EEECE5;
```

### 02 Secondary Colors (Dark Green)
```css
--secondary-900: #0D2F27;
--secondary-800: #556E68;
--secondary-700: #75958D;
--secondary-600: #BFD0C6;
--secondary-550: #D6DFDD;  /* Aktiver Nav-Item Hintergrund — nicht in Figma, aus globals.css */
--secondary-500: #ECF1EE;
```

### 03 Tertiary Colors (Steel Blue)
```css
--tertiary-900: #5C7788;
--tertiary-800: #83A7BF;
--tertiary-700: #CDDBE4;
--tertiary-600: #E4EEF5;
--tertiary-500: #EFF4F7;
```

### 04 Accent Colors
```css
--accent-01: #76FEAC;  /* Mint green */
--accent-02: #F5E4E4;  /* Blush pink */
```
> ⚠️ Verify `accent-01` hex — reads as `#76FEA` which may be `#076FEA` or `#76FEAA`. Confirm in Figma.

### 05 Feedback Colors
```css
--color-error:       #FF525A;
--color-warning:     #FEA800;
--color-success:     #85CAA0;
--color-error-light: #fee2e2;  /* Hintergrund für Fehler-Banner (tailwind red-100) */
```

### 06 Overlay Tokens
Werden für Bild-Overlays (Hero, Category Tiles, CTA Cards, Netzwerk-Ovals) verwendet.
```css
--overlay-light:  rgba(0, 0, 0, 0.30);
--overlay-medium: rgba(0, 0, 0, 0.40);
--overlay-heavy:  rgba(0, 0, 0, 0.60);
```

| Token | Opacity | Verwendung |
|---|---|---|
| `--overlay-light`  | 30% | Subtile Verdunkelung (z.B. Netzwerk-Ovals) |
| `--overlay-medium` | 40% | Standard Bild-Overlay (Hero, Category Tiles) |
| `--overlay-heavy`  | 60% | Starke Verdunkelung (z.B. CTA Event Card) |

**Verwendungsbeispiel (TSX):**
```tsx
<div style={{ position: "absolute", inset: 0, background: "var(--overlay-medium)" }} />
```

### 07 Token-Verwendungsregeln

**Regel: Keine hardcodierten Hex-Farben in Komponenten.**
Alle Farben müssen via CSS Custom Properties gesetzt werden.

| Kontext | Erlaubt | Verboten |
|---|---|---|
| Texte | `color: "var(--neutral-black)"` | `color: "#000000"` |
| Hintergründe | `background: "var(--neutral-white)"` | `background: "#FFFFFF"` |
| Seiten-Hintergrund | `background: "var(--page-bg)"` | `background: "#ECF1EE"` |
| Fehler-Banner | `background: "var(--color-error-light)"` | `background: "#fee2e2"` |
| Bild-Overlays | `background: "var(--overlay-medium)"` | `background: "rgba(0,0,0,0.4)"` |

**Ausnahmen (absichtlich hardcodiert):**
- SVG-Attribute (`stroke`, `fill`) in inline SVGs — CSS-Variablen werden dort nicht als HTML-Attribute unterstützt
- Box-Shadows mit spezifischen Blur/Spread-Werten, die keinem Shadow-Token entsprechen
- `COLOR_HEX`-Maps in Filter-Komponenten — diese sind Daten (Farbwähler-Swatches), keine Design-Tokens

### Full CSS Custom Properties Block
```css
:root {
  /* Neutrals */
  --neutral-white:      #FFFFFF;
  --neutral-grey-50:    #FBFBFB;
  --neutral-grey-100:   #F3F4F6;
  --neutral-grey-200:   #EEEEEE;
  --neutral-grey-300:   #D1D1D1;
  --neutral-grey-400:   #A4A4A4;
  --neutral-grey-500:   #606060;
  --neutral-grey-600:   #242727;
  --neutral-grey-700:   #0B0B0B;
  --neutral-black:      #000000;

  /* Primary */
  --primary-900: #B59B3A;
  --primary-800: #C7B46B;
  --primary-700: #DDD5B7;
  --primary-600: #EEECE5;

  /* Secondary */
  --secondary-900: #0D2F27;
  --secondary-800: #556E68;
  --secondary-700: #75958D;
  --secondary-600: #BFD0C6;
  --secondary-550: #D6DFDD;  /* Aktiver Nav-Item Hintergrund */
  --secondary-500: #ECF1EE;

  /* Tertiary */
  --tertiary-900: #5C7788;
  --tertiary-800: #83A7BF;
  --tertiary-700: #CDDBE4;
  --tertiary-600: #E4EEF5;
  --tertiary-500: #EFF4F7;

  /* Accent */
  --accent-01: #76FEAC;  /* Mint green */
  --accent-02: #F5E4E4;

  /* Feedback */
  --color-error:       #FF525A;
  --color-warning:     #FEA800;
  --color-success:     #85CAA0;
  --color-error-light: #fee2e2;

  /* Overlays */
  --overlay-light:  rgba(0, 0, 0, 0.30);
  --overlay-medium: rgba(0, 0, 0, 0.40);
  --overlay-heavy:  rgba(0, 0, 0, 0.60);
}
```

---

## 3. Shadows

### Shadow Values
| Token        | X   | Y    | Blur | Spread | Opacity | Color   |
|--------------|-----|------|------|--------|---------|---------|
| `shadow-100` | 0px | 1px  | 6px  | 0px    | 20%     | #000000 |
| `shadow-200` | 0px | 20px | 4px  | 0px    | 10%     | #000000 |
| `shadow-300` | 0px | 12px | 12px | 0px    | 10%     | #000000 |
| `shadow-400` | 0px | 24px | 24px | 0px    | 10%     | #000000 |

### CSS Custom Properties
```css
:root {
  --shadow-100: 0px 1px 6px 0px rgba(0, 0, 0, 0.20);
  --shadow-200: 0px 20px 4px 0px rgba(0, 0, 0, 0.10);
  --shadow-300: 0px 12px 12px 0px rgba(0, 0, 0, 0.10);
  --shadow-400: 0px 24px 24px 0px rgba(0, 0, 0, 0.10);
}
```

### Usage
- `shadow-100` — Subtle lift (inputs, cards at rest)
- `shadow-200` — Light floating element
- `shadow-300` — Modal, dropdown
- `shadow-400` — Deep elevation (dialogs, popovers)

---

## 4. Brand & Logos

### Location
```
C:\Users\vielm\Repos\costumanu\src\assets\logos\
```
Relative path from project root (use in imports):
```
src/assets/logos/
```

---

### kostüm+ Wordmark

| Filename       | Size     | Description                        |
|----------------|----------|------------------------------------|
| `Union.svg`    | 443×86px | **kostüm+** wordmark, dark (`#1D1D1B`), no partner |

---

### kostüm+ Brand Lockups (with partner)
Full horizontal lockup: partner icon left + "kostüm+" text right.

| Filename       | Partner          | Size     | Partner colour |
|----------------|------------------|----------|----------------|
| `brand-lu.svg` | Luzerner Theater | 260×79px | White on black |
| `brand-be.svg` | Bühnen Bern      | 260×79px | `#FF4F26` on black |
| `brand-srf.svg`| SRF              | 260×79px | White on `#AF001D` |

---

### Partner Labels — Circle (50×50px)
Round icon badges, used at small sizes or as avatars.

| Filename       | Partner          | Shape  |
|----------------|------------------|--------|
| `label-lu.svg` | Luzerner Theater | Circle |
| `label-be.svg` | Bühnen Bern      | Circle |
| `label-srf.svg`| SRF              | Circle |

### Partner Labels — Square variant
| Filename         | Partner          | Shape  |
|------------------|------------------|--------|
| `label-lu-2.svg` | Luzerner Theater | Square/rounded |
| `label-be-2.svg` | Bühnen Bern      | Square/rounded |
| `label-srf-2.svg`| SRF              | Square/rounded |

---

### Network Logos (standalone partner brands)

| Filename                | Partner          | Size      | Notes                  |
|-------------------------|------------------|-----------|------------------------|
| `logo-brand-luzern.svg` | luzerner theater | 490×116px | Horizontal             |
| `logo-brand-luzern-2.svg`| luzerner theater | 490×116px | Stacked variant        |
| `logo-brand-bern.svg`   | BÜHNEN BERN      | 490×116px | All caps wordmark      |
| `logo-brand-srf.svg`    | SRF              | —         | Red badge              |

---

### SVG Technical Notes
- Brand logos use **hardcoded colours** (partner brand colours) — do **not** override with `currentColor`
- The `Union.svg` wordmark uses `fill="#1D1D1B"` — can be overridden if needed on coloured backgrounds
- All logos are multi-path SVGs — do not apply global `fill` overrides

### Usage (React example)
```jsx
import { ReactComponent as BrandLu } from '@/assets/logos/brand-lu.svg';
import { ReactComponent as LogoBern } from '@/assets/logos/logo-brand-bern.svg';
import { ReactComponent as Wordmark } from '@/assets/logos/Union.svg';

// In a header component:
<Wordmark width={200} />
<BrandLu width={180} />
```

> **Naming rule:** Partner abbreviations: `lu` = Luzerner Theater, `be` = Bühnen Bern, `srf` = SRF.

---

## 5. Icon System

### Location
```
C:\Users\vielm\Repos\costumanu\src\assets\icons\
```
Relative path from project root (use this in imports):
```
src/assets/icons/
```

All icons are individual SVG files. Format: `32×32px`, `viewBox="0 0 32 32"`, `fill="none"` on the `<svg>` element, `fill="black"` on the `<path>`. This means **colour is fully overridable via CSS `currentColor`**.

### ⚠️ Naming inconsistency — rename these 3 files
The following files don't follow the `icon-{name}.svg` convention used by all others:

| Current filename     | Rename to              |
|----------------------|------------------------|
| `Check.svg`          | `icon-check.svg`       |
| `Barcode_Scan.svg`   | `icon-barcode-scan.svg`|
| `Loading.svg`        | `icon-loading.svg`     |

---

### Available Icon Files

Alle Icons liegen unter `src/assets/icons/`. Verwendung immer über `<Icon name="{name}" />` — nie direkt importieren.

#### Navigation & UI
| Name | Datei |
|---|---|
| home | icon-home.svg |
| home-filled | icon-home-filled.svg |
| home-menu | icon-home-menu.svg |
| search | icon-search.svg |
| filter | icon-filter.svg |
| more | icon-more.svg |
| setting | icon-setting.svg |
| list | icon-list.svg |
| close-small | icon-close-small.svg |
| close-medium | icon-close-medium.svg |
| close-large | icon-close-large.svg |
| arrow-up | icon-arrow-up.svg |
| arrow-up-1 | icon-arrow-up-1.svg |
| arrow-down | icon-arrow-down.svg |
| arrow-down-l | icon-arrow-down-l.svg |
| arrow-left | icon-arrow-left.svg |
| arrow-l-right | icon-arrow-l-right.svg |
| arrow-s | icon-arrow-s.svg |
| arrow-dropdown-down | icon-arrow-dropdown-down.svg |
| arrow-dropdown-up | icon-arrow-dropdown-up.svg |
| left-arrow | icon-left-arrow.svg |
| right-arrow | icon-right-arrow.svg |
| chevron-left | icon-chevron-left.svg |
| dropdown | icon-dropdown.svg |
| placeholder | icon-placeholder.svg |

#### Kostüm & Erfassung
| Name | Datei |
|---|---|
| shirt | icon-shirt.svg |
| shirt-filled | icon-shirt-filled.svg |
| shirt-1 | icon-shirt-1.svg |
| category | icon-catetory.svg |
| label | icon-label.svg |
| tag | icon-tag.svg |
| barcode-scan | icon-barcode-scan.svg |
| qr-code | icon-qr-code.svg |
| qr-code-scan | icon-qr-code-scan.svg |
| rfid | icon-rfid.svg |
| id | icon-id.svg |
| serie | icon-serie.svg |
| copy | icon-copy.svg |
| measuring | icon-measuring.svg |
| location | icon-location.svg |
| destination | icon-destination.svg |
| archive | icon-archive.svg |
| print | icon-print.svg |
| view | icon-view.svg |
| edit | icon-edit.svg |
| delete | icon-delete.svg |
| star | icon-star.svg |
| heart | icon-heart.svg |
| heart-1 | icon-heart-1.svg |
| share | icon-share.svg |
| link | icon-link.svg |
| loading | icon-loading.svg |

#### Personen & Darsteller
| Name | Datei |
|---|---|
| female | icon-female.svg |
| male | icon-male.svg |
| unisex | icon-unisex.svg |
| kid | icon-kid.svg |
| children | icon-children.svg |
| family | icon-family.svg |
| fantasy | icon-fantasy.svg |
| animal | icon-animal.svg |
| avatar | icon-avatar.svg |
| user | icon-user.svg |
| artist-menu | icon-artist-menu.svg |

#### Material & Muster
| Name | Datei |
|---|---|
| material | icon-material.svg |
| material-solid | icon-material-solid.svg |
| material-stripe | icon-material-stripe.svg |
| material-squared | icon-material-squared.svg |
| material-pointed | icon-material-pointed.svg |
| material-gradient | icon-material-gradient.svg |
| material-floral | icon-material-floral.svg |
| material-batik | icon-material-batik.svg |
| material-divers | icon-material-divers.svg |
| decorative-textile | icon-decorative-textile.svg |
| textile | icon-textile.svg |
| fabric | icon-fabric.svg |
| weft | icon-weft.svg |

#### Reinigung & Pflege
| Name | Datei |
|---|---|
| wasch | icon-wasch.svg |
| washmachine | icon-washmachine.svg |
| steam | icon-steam.svg |
| tumbler | icon-tumbler.svg |

#### Kommunikation & Nachrichten
| Name | Datei |
|---|---|
| chat | icon-chat.svg |
| chat-filled | icon-chat-filled.svg |
| reply | icon-reply.svg |
| reply-all | icon-reply-all.svg |
| mail | icon-mail.svg |
| bell-menu | icon-bell-menu.svg |
| anfrage | icon-anfrage.svg |
| whatsapp | icon-whatsapp.svg |
| phone | icon-phone.svg |
| phone-silhouette | icon-phone-silhouette.svg |
| microphone | icon-microphone.svg |

#### Medien & Bilder
| Name | Datei |
|---|---|
| camera | icon-camera.svg |
| camera-filled | icon-camera-filled.svg |
| image-filled | icon-image-filled.svg |
| images | icon-images.svg |
| play | icon-play.svg |
| upload | icon-upload.svg |
| download | icon-download.svg |

#### Aktionen & Controls
| Name | Datei |
|---|---|
| plus-s | icon-plus-s.svg |
| plus-m | icon-plus-m.svg |
| plus-l | icon-plus-l.svg |
| check | icon-check.svg |
| check-alt | icon-check-alt.svg |
| checkmark | icon-checkmark.svg |
| checkbox | icon-checkbox.svg |

#### Aufführung & Produktion
| Name | Datei |
|---|---|
| production-menu | icon-production-menu.svg |
| calendar-menu | icon-calendar-menu.svg |
| calendar-menu-1 | icon-calendar-menu-1.svg |
| contact-menu | icon-contact-menu.svg |
| contact-book | icon-contact-book.svg |

#### Sonstiges
| Name | Datei |
|---|---|
| shopping-bag | icon-shopping-bag.svg |
| shopping-bag-1 | icon-shopping-bag-1.svg |
| gps | icon-gps.svg |
| maps-flags | icon-maps-flags.svg |
| group | icon-group.svg |

---

### SVG Technical Spec
```
Size:       32 × 32 px
viewBox:    0 0 32 32
fill:       "none" on <svg>, "black" on <path>
stroke:     none (all icons are filled paths)
```
Because paths use `fill="black"`, override colour in CSS via `fill: currentColor` — the icon then inherits whatever `color` is set on the parent element.

---

### CSS Usage

```css
/* Make all icons inherit colour from context */
.icon {
  display: inline-block;
  width: 24px;   /* scale as needed — native size is 32px */
  height: 24px;
  fill: currentColor;
}

/* Example: icon in a button picks up the button text colour */
.btn-primary {
  color: var(--neutral-white);
}
.btn-primary .icon {
  fill: currentColor; /* → white */
}
```

### HTML Usage (inline SVG or `<img>`)

```html
<!-- Option A: img tag (colour NOT overridable) -->
<img src="/assets/icons/icon-edit.svg" alt="Edit" width="24" height="24" />

<!-- Option B: inline SVG (colour IS overridable via CSS currentColor) -->
<!-- Change fill="black" on the path to fill="currentColor" in the SVG file -->
<svg width="24" height="24" viewBox="0 0 32 32" fill="none">
  <path d="..." fill="currentColor" />
</svg>
```

### React Usage (recommended)

```jsx
// Simple wrapper component: src/components/Icon.jsx
import { ReactComponent as IconEdit } from '@/assets/icons/icon-edit.svg';
import { ReactComponent as IconCheck } from '@/assets/icons/icon-check.svg';
// ... etc.

// Usage
<IconEdit style={{ color: 'var(--secondary-900)' }} width={24} height={24} />
```

> **Note:** For React, configure your bundler (Vite/CRA/Next.js) to handle SVG imports as React components (e.g. via `vite-plugin-svgr` or `@svgr/webpack`). Then `fill="currentColor"` must be set on the `<path>` inside each SVG file — not `fill="black"`. This is a one-time find-and-replace across all SVG files.

---

## 6. Components

### 6.1 Action Buttons

Drei Button-Typen, je mit 3 Zuständen und einer invertierten Variante.
Zwei Grössen: **Small** (154px breit) und **Large** (340px breit).

---

#### Gemeinsame Werte (alle Button-Typen)
```css
border-radius: 16px;
padding-left:  30px;
padding-right: 30px;
gap:           10px;
```

---

#### action-primary

Gefüllter Button, goldener Hintergrund, weisser Text.

| Zustand | Size | Height | Padding T/B | Background | Border |
|---|---|---|---|---|---|
| default | Small | 63px | 18px | `#B59B3A` (primary-900) | — |
| default | Large | 60px | 17.5px ① | `#B59B3A` (primary-900) | — |
| hover | Small | 61px | 17px | `#C7B46B` (primary-800) | — |
| hover | Large | 62px | 17.5px | `#C7B46B` (primary-800) | — |
| disable | Small | 61px | 17px | `#A4A4A4` (neutral-grey-400) | — |
| disable | Large | 62px | 17.5px | `#A4A4A4` (neutral-grey-400) | — |

> `--inverted` Varianten sind **identisch** zu den normalen Varianten — nur der Seiten-Hintergrund ist dunkel (`neutral-grey-600`).

① *Padding nicht in Figma angegeben — abgeleitet aus Hover-Wert (17.5px) und Pattern.*

```css
.btn-primary {
  background-color: var(--primary-900);
  color: var(--neutral-white);
  border: none;
  border-radius: 16px;
  padding: 18px 30px;    /* small */
  gap: 10px;
}
.btn-primary:hover {
  background-color: var(--primary-800);
  padding: 17px 30px;    /* small */
}
.btn-primary:disabled {
  background-color: var(--neutral-grey-400);
  color: var(--neutral-white);
  cursor: not-allowed;
  padding: 17px 30px;
}

/* Large variant */
.btn-primary--large {
  padding: 17.5px 30px;
}
.btn-primary--large:hover,
.btn-primary--large:disabled {
  padding: 17.5px 30px;
}
```

---

#### action-secondary

Outlined Button, transparenter Hintergrund, goldener Border und Text.

| Zustand | Size | Height | Padding T/B | Border | Text colour |
|---|---|---|---|---|---|
| default | Small | 57px | 15px | `1px solid #B59B3A` | `#B59B3A` |
| default | Large | 60px | 17.5px ① | `1px solid #B59B3A` | `#B59B3A` |
| hover | Small | 57px | 15px | `1px solid #C7B46B` | `#C7B46B` |
| hover | Large | 62px | 17.5px | `1px solid #C7B46B` | `#C7B46B` |
| disable | Small | 57px | 15px | `1px solid #A4A4A4` | `#A4A4A4` |
| disable | Large | 62px | 17.5px | `1px solid #A4A4A4` | `#A4A4A4` |
| default--inverted | Small | 57px | 15px | `1px solid #FFFFFF` | `#FFFFFF` |
| default--inverted | Large | 60px | 17.5px ① | `1px solid #FFFFFF` | `#FFFFFF` |
| hover--inverted | Small | 57px | 15px | `1px solid #C7B46B` | `#C7B46B` |
| hover--inverted | Large | 62px | 17.5px | `1px solid #C7B46B` | `#C7B46B` |
| disable--inverted | Small | 57px | 15px | `1px solid #D1D1D1` | `#D1D1D1` |
| disable--inverted | Large | 62px | 17.5px | `1px solid #D1D1D1` | `#D1D1D1` |

① *Padding nicht in Figma angegeben — abgeleitet aus Hover-Wert und Pattern.*

```css
.btn-secondary {
  background-color: transparent;
  color: var(--primary-900);
  border: 1px solid var(--primary-900);
  border-radius: 16px;
  padding: 15px 30px;    /* small */
  gap: 10px;
}
.btn-secondary:hover {
  color: var(--primary-800);
  border-color: var(--primary-800);
}
.btn-secondary:disabled {
  color: var(--neutral-grey-400);
  border-color: var(--neutral-grey-400);
  cursor: not-allowed;
}

/* Inverted */
.btn-secondary--inverted {
  color: var(--neutral-white);
  border-color: var(--neutral-white);
}
.btn-secondary--inverted:hover {
  color: var(--primary-800);
  border-color: var(--primary-800);
}
.btn-secondary--inverted:disabled {
  color: var(--neutral-grey-300);
  border-color: var(--neutral-grey-300);
}

/* Large variant */
.btn-secondary--large {
  padding: 17.5px 30px;
}
```

---

#### ⚠️ Inkonsistenz in Figma — Large Default Height

Bei `action-primary` und `action-secondary` (Large, default) zeigt Figma **height: 60px**, aber beim Hover **height: 62px** mit `padding: 17.5px`. Das ist geometrisch inkonsistent (17.5 × 2 + content = mehr als 60px). Empfehlung: **einheitlich 62px** für Large-Buttons verwenden und `padding: 17.5px 30px` als Standard für Large setzen.

---

#### action-tertiary

Icon-only Button, runder Badge, 60×60px. Alle 3 Zustände haben identische Dimensionen — der Unterschied liegt im Icon-Farbton (visuell aus Screenshot abgeleitet).

| Zustand | Width | Height | Border | Background | Opacity |
|---|---|---|---|---|---|
| default | 60px | 60px | `1px solid #D1D1D1` | transparent | 100% |
| hover | 60px | 60px | `1px solid #D1D1D1` | `neutral-grey-100` (abgeleitet) | 100% |
| disable | 60px | 60px | `1px solid #D1D1D1` | transparent | 40% (abgeleitet) |

```css
.btn-tertiary {
  width: 60px;
  height: 60px;
  background-color: transparent;
  border: 1px solid var(--neutral-grey-300); /* #D1D1D1 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.btn-tertiary:hover {
  background-color: var(--neutral-grey-100);
}
.btn-tertiary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

#### Vollständige Token-Übersicht Actions

```
action-primary                     → bg: primary-900,     text: white
action-primary:hover               → bg: primary-800,     text: white
action-primary:disable             → bg: neutral-grey-400, text: white
action-primary--inverted           → bg: primary-900,     text: white
action-primary:hover--inverted     → bg: primary-800,     text: white
action-primary:disable--inverted   → bg: neutral-grey-400, text: white

action-secondary                   → border: primary-900,     text: primary-900
action-secondary:hover             → border: primary-800,     text: primary-800
action-secondary:disable           → border: neutral-grey-400, text: neutral-grey-400
action-secondary--inverted         → border: white,           text: white
action-secondary:hover--inverted   → border: primary-800,     text: primary-800
action-secondary:disable--inverted → border: neutral-grey-300, text: neutral-grey-300

action-tertiary                    → border: neutral-grey-300, bg: transparent
action-tertiary:hover              → border: neutral-grey-300, bg: neutral-grey-100
action-tertiary:disable            → border: neutral-grey-300, opacity: 40%
```

---

### 6.2 Basic Controls

Alle Farb-Referenzen verwenden Design-Token-Variablen wo möglich.
Farb-Mapping: `#75958D` = `secondary-700`, `#76FEAC` = `accent-01`, `#ECF1EE` = `secondary-500`, `#242727` = `neutral-grey-600`, `#B59B3A` = `primary-900`.

---

#### Radio Button

| Zustand | Size | Border-radius | Border | Background |
|---|---|---|---|---|
| unchecked | 30×30px | 41px | `2px solid secondary-700` | `#FFFFFF` |
| checked | 30×30px | 41px | `10px solid secondary-700` | `#FBFBFB` |
| checked (Rückgabe) | 30×30px | 41px | `2px solid accent-01` | `accent-01` |

> Der "checked"-Zustand nutzt einen dicken `border-width: 10px` um den weissen Kern freizulassen — kein separater innerer Punkt nötig.
> Interaktion: Instant (0ms), wechselt zu checked-Variante on click.

```css
.radio {
  width: 30px;
  height: 30px;
  border-radius: 41px;
  border: 2px solid var(--secondary-700);
  background: #FFFFFF;
  cursor: pointer;
}
.radio:checked,
.radio--checked {
  border: 10px solid var(--secondary-700);
  background: #FBFBFB;
}
.radio--return {
  border: 2px solid var(--accent-01);
  background: var(--accent-01);
}
```

---

#### Checkbox

| Zustand | Outer size | Border-radius | Border | Inner size | Inner bg |
|---|---|---|---|---|---|
| unchecked | 30×30px | 8px | `2px solid secondary-700` | — | — |
| checked | 30×30px | 8px | — | 20×20px, offset 5px | `secondary-700` |

> Inner checked-Box: 20×20px mit `border-radius: 6px`, positioniert 5px von oben/links (zentriert im 30px Container).
> Interaktion: Instant (0ms), identisch zu Radio Button.

```css
.checkbox {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 2px solid var(--secondary-700);
  background: transparent;
  position: relative;
  cursor: pointer;
}
.checkbox--checked::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 5px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--secondary-700);
}
```

---

#### Toggle

| Zustand | Size | Border-radius | Background | Shadow |
|---|---|---|---|---|
| unchecked | 65×34px | 72px | `secondary-500` (#ECF1EE) | `inset 0px 1px 4px rgba(0,0,0,0.30)` |
| checked | 65×34px | 72px | `secondary-700` (#75958D) | `inset 0px 1px 4px rgba(0,0,0,0.30)` |

> Thumb (weisser Kreis): **28×28px**, `border-radius: 50%`, bg `#FFFFFF`, offset `top: 2.83px / left: 2.83px`, shadow: `0px 0.83px 2.5px 0px rgba(0,0,0,0.20)`.

```css
.toggle-track {
  width: 65px;
  height: 34px;
  border-radius: 72px;
  background: var(--secondary-500);
  box-shadow: inset 0px 1px 4px 0px rgba(0, 0, 0, 0.30);
  position: relative;
  cursor: pointer;
}
.toggle-track--checked {
  background: var(--secondary-700);
}
.toggle-thumb {
  position: absolute;
  top: 2.83px;
  left: 2.83px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0px 0.83px 2.5px 0px rgba(0, 0, 0, 0.20);
  transition: transform 0ms;
}
.toggle-track--checked .toggle-thumb {
  transform: translateX(31px);
}
```

---

#### Input Field

| Eigenschaft | Wert |
|---|---|
| Height | 60px |
| Border-radius | 8px |
| Border | `1px solid neutral-grey-600` (#242727) |
| Font | Inter Medium, 16px, line-height 150% |
| Token | `font-size-300` weight 500 |

Sondervariante Masse (Brustumfang, Hüftumfang etc.):
- Width: 222px (fixe Breite), sonst identisch
- Border: `1px solid #000000`

```css
.input-field {
  height: 60px;
  border-radius: 8px;
  border: 1px solid var(--neutral-grey-600);
  font-family: var(--font-family-base);
  font-size: var(--font-size-300); /* 16px */
  font-weight: var(--font-weight-500);
  line-height: 1.5;
  padding: 0 20px;
  width: 100%; /* fluid */
}
.input-field--measure {
  width: 222px;
  border-color: var(--neutral-black);
}
```

---

#### Textarea

| Eigenschaft | Wert |
|---|---|
| Height | 80px (min-height) |
| Border-radius | 8px |
| Border | `1px solid neutral-grey-600` (#242727) |
| Font | Inter Medium, 16px, line-height 150% |
| Token | `font-size-300` weight 500 |

```css
.textarea {
  min-height: 80px;
  border-radius: 8px;
  border: 1px solid var(--neutral-grey-600);
  font-family: var(--font-family-base);
  font-size: var(--font-size-300); /* 16px */
  font-weight: var(--font-weight-500);
  line-height: 1.5;
  width: 100%;
  resize: vertical;
}
```

---

#### Dropdown

| Eigenschaft | Wert |
|---|---|
| Height | 60px |
| Border-radius | 8px |
| Border | `1px solid neutral-grey-600` (#242727) |
| Font | Inter Medium, 18px, line-height 150% |
| Token | `font-size-350` weight 500 |
| Icon | `icon-arrow-down` (rechts) |

```css
.dropdown {
  height: 60px;
  border-radius: 8px;
  border: 1px solid var(--neutral-grey-600);
  font-family: var(--font-family-base);
  font-size: var(--font-size-350); /* 18px */
  font-weight: var(--font-weight-500);
  line-height: 1.5;
}
```

---

#### Search

| Eigenschaft | Wert |
|---|---|
| Searchbox height | 60px |
| Border-radius | 47px (Pill-Form) |
| Border | `1px solid #000000` |
| Label-Font | Inter Medium, 18px — Token `font-size-350` |
| Content-Font | Inter Medium, 16px — Token `font-size-300` |
| Icon | `icon-search` (links) |

Dropdown-Liste:
| Eigenschaft | Wert |
|---|---|
| Background | `#FFFFFF` |
| Border-radius | 4px |
| Shadow | `0px 10px 20px 0px rgba(0,0,0,0.20)` |
| Scrollbar | 4×93px, `border-radius: 45px`, bg `#90A3B0` (tertiary-800 approx.) |

```css
.search-box {
  height: 60px;
  border-radius: 47px;
  border: 1px solid var(--neutral-black);
  font-family: var(--font-family-base);
  font-size: var(--font-size-300); /* 16px content */
  font-weight: var(--font-weight-500);
  padding: 0 16px;
}
.search-dropdown {
  background: #FFFFFF;
  border-radius: 4px;
  box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.20);
}
```

---

#### Progressbar

Runder Fortschrittsindikator (circular, nicht linear).

| Zustand | Size | Border | Background |
|---|---|---|---|
| default (leer) | 40×40px | `0.83px solid primary-900` | `#FFFFFF` |
| aktiv (gefüllt) | 40×40px | `0.83px solid primary-900` | `primary-900` (#B59B3A) |

```css
.progressbar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0.83px solid var(--primary-900);
  background: #FFFFFF;
}
.progressbar--active {
  background: var(--primary-900);
}
```

---

### 6.3 Controls — Select

Wiederverwendbare Auswahl-Komponenten mit Default und Selected Zustand. Alle verwenden `secondary-700` (#75958D) als Akzentfarbe.

**Gemeinsames Muster:**
- Default → weisser Hintergrund, `secondary-700` Border, `secondary-800` Text/Icon
- Selected → `secondary-700` Hintergrund, weisser Text/Icon

---

#### Select Card — Gender / Typ & Pattern

Kacheln mit Icon oben, Label unten. Zwei Grössen je nach Kategorie.

| Eigenschaft | Gender/Pattern | Temperatur |
|---|---|---|
| Size | 174×93px | 88×80px |
| Border-radius | 12px | 12px |
| Border default | `1px solid #75958D` | `1.58px solid #75958D` |
| Border selected | `1px solid #75958D` | `1.58px solid #75958D` |
| Bg default | `#FFFFFF` | `#FFFFFF` |
| Bg selected | `#75958D` | `#75958D` |
| Label font | Inter 500, 18px, 150% | Inter 500, 24px, 140% |
| Label color default | `#556E68` (secondary-800) | `#556E68` |
| Label color selected | `#FFFFFF` | `#FFFFFF` |
| Icon color default | `#75958D` (secondary-700) | — |
| Icon color selected | `#FFFFFF` | — |

**Konfektionsgrösse (XS, S, M...):**
- Size: 112×80px
- Border-radius default: `8px`, selected: `12px`
- Sonst identisch zu Temperature-Karte

```css
.select-card {
  width: 174px;
  height: 93px;
  border-radius: 12px;
  border: 1px solid var(--secondary-700);
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 14px;
  cursor: pointer;
}
.select-card--selected {
  background: var(--secondary-700);
  border-color: var(--secondary-700);
}
.select-card__label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-350); /* 18px */
  font-weight: var(--font-weight-500);
  line-height: 1.5;
  color: var(--secondary-800);
  text-align: center;
}
.select-card--selected .select-card__label {
  color: var(--neutral-white);
}
.select-card__icon {
  fill: var(--secondary-700);
}
.select-card--selected .select-card__icon {
  fill: var(--neutral-white);
}
```

---

#### Select Card — Standort (Location)

| Eigenschaft | Default | Selected |
|---|---|---|
| Size | 285×120px | 285×120px |
| Border-radius | 8px | 8px |
| Border | `1px solid #556E68` | `2px solid #75958D` |
| Background | `#FFFFFF` | `#75958D` |
| Title font | Inter Bold 16px | Inter Bold 16px |
| Title color | `#556E68` | `#FFFFFF` |
| Address font | Inter Regular 16px | Inter Regular 16px |
| Address color | `#556E68` | `#FFFFFF` |
| Icon | `icon-placeholder`, `#556E68` | `icon-placeholder`, `#FFFFFF` |

```css
.select-location {
  width: 285px;
  min-height: 120px;
  border-radius: 8px;
  border: 1px solid var(--secondary-800);
  background: #FFFFFF;
  padding: 12px 16px;
  cursor: pointer;
}
.select-location--selected {
  background: var(--secondary-700);
  border: 2px solid var(--secondary-700);
  color: var(--neutral-white);
}
```

---

#### Select Pill — Farben (Color Swatches)

Zeile mit Farbname links und Farbkreis rechts.

| Eigenschaft | Default | Selected |
|---|---|---|
| Size | 174×60px | 174×60px |
| Border-radius | 12px | 12px |
| Border | `1px solid #75958D` | `1px solid #75958D` |
| Background | `#FFFFFF` | `#ECF1EE` (secondary-500) |
| Font | Inter 500, 18px | Inter 500, 18px |
| Text color | `#556E68` | `#556E68` |
| Color circle | 35px border-radius, hardcoded colour | identisch |

**Verfügbare Farb-Token:**

| Name | Hex |
|---|---|
| Gelb | `#FEF400` |
| Beige | `#D2D1BC` |
| Weiss | `#FFFFFF` (border: neutral-grey-300) |
| Transparent | `#606060` opacity 20% |
| Orange | `#FEA800` |
| Violett | `#8266E3` |
| Grau | `#838586` |
| Silber | `#90A3B0` |
| Rot | `#FF525A` |
| Blau | `#1456FF` |
| Braun | `#684614` |
| Gold | `#96864F` |
| Rosa | `#EC9FC9` |
| Grün | `#058202` |
| Schwarz | `#000000` |
| Mehrfarbig | `conic-gradient(...)` |

```css
.select-color {
  width: 174px;
  height: 60px;
  border-radius: 12px;
  border: 1px solid var(--secondary-700);
  background: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  cursor: pointer;
}
.select-color--selected {
  background: var(--secondary-500);
}
.select-color__swatch {
  width: 34px;
  height: 34px;
  border-radius: 35px;
  flex-shrink: 0;
}
.select-color__label {
  font-size: var(--font-size-350); /* 18px */
  font-weight: var(--font-weight-500);
  color: var(--secondary-800);
}
```

---

#### Select Tag / Label Pill

Kompakte Pill-Tags, horizontal gruppiert, für Kategorien und Eigenschaften.

| Eigenschaft | Wert |
|---|---|
| Height | 44px |
| Padding | `10px 25px` |
| Border-radius | 44px (Pill) |
| Border | `1px solid #556E68` (secondary-800) |
| Background | `#FBFBFB` (neutral-grey-50) |
| Font | Inter 500, 16px, 150% |
| Text color | `#75958D` (secondary-700) |
| Gap zwischen Tags | 10px |

> Selected Tag: `background: #ECF1EE` (secondary-500), `border: 1px solid #556E68` (secondary-800), plus `icon-close-small` (X) zum Entfernen — **kein** filled secondary-700.

```css
.select-tag {
  height: 44px;
  padding: 10px 25px;
  border-radius: 44px;
  border: 1px solid var(--secondary-800);
  background: var(--neutral-grey-50);
  font-family: var(--font-family-base);
  font-size: var(--font-size-300); /* 16px */
  font-weight: var(--font-weight-500);
  color: var(--secondary-700);
  white-space: nowrap;
  cursor: pointer;
}
.select-tag--selected {
  background: var(--secondary-500); /* #ECF1EE */
  border-color: var(--secondary-800);
  color: var(--secondary-700);
  gap: 8px;
  /* zeigt icon-close-small rechts */
}
/* Tag group */
.select-tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
```

The following design tokens were **not visible** in the provided screenshots and must be documented once the Figma file is accessible or component files are shared:

### 6.1 Spacing Scale
```css
/* TBD — expected pattern based on design system conventions */
--spacing-4:   4px;
--spacing-8:   8px;
--spacing-12:  12px;
--spacing-16:  16px;
--spacing-24:  24px;
--spacing-32:  32px;
--spacing-40:  40px;
--spacing-48:  48px;
--spacing-64:  64px;
--spacing-80:  80px;
--spacing-96:  96px;
```

### 6.2 Border Radius
```css
/* TBD */
--radius-sm:   ;
--radius-md:   ;
--radius-lg:   ;
--radius-full: 9999px;
```

### 6.3 Breakpoints / Responsive Layout
```css
/* TBD — two breakpoints implied by "Tablet" and "Mobile" font scales */
--breakpoint-mobile: ; /* max-width */
--breakpoint-tablet: ; /* min-width */
--breakpoint-desktop: ;
```

### 6.4 Z-Index Scale
Not documented.

### 6.5 Transitions / Animations
Not documented.

### 6.6 Grid & Layout
Column count, gutter, and margin for each breakpoint not documented.

---

### 6.4 Navigation — Sidebar Menu

Vertikale Sidebar-Navigation, pro Sektion eigener Container.

#### Container
```css
.nav-container {
  width: 209px;
  background: var(--secondary-500); /* #ECF1EE */
  padding: 8px;
}
```

#### Menu Item (allgemein)
```css
.nav-item {
  width: 166px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  cursor: pointer;
}
.nav-item + .nav-item {
  border-top: 1px solid var(--neutral-grey-400); /* #A4A4A4 */
}
.nav-item--active {
  background: #D6DFDD; /* secondary-500 etwas dunkler */
}
```

#### Zwei Navigations-Stile (Cockpit vs. Inventarisierung)

| Eigenschaft | Cockpit | Inventarisierung |
|---|---|---|
| Font | Inter **500**, 14px | Inter **400**, 16px |
| Text color | `neutral-grey-600` (#242727) | `secondary-900` (#0D2F27) |
| Icon color | `neutral-grey-600` | `secondary-900` |
| Token | `font-size-200` weight 500 | `font-size-300` weight 400 |

#### Badge (Notification Counter)
```css
.nav-badge {
  width: 22px;
  height: 22px;
  background: var(--neutral-grey-600);
  border-radius: 103px;
  font-family: var(--font-family-base);
  font-size: 10px;
  font-weight: 700;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}
```

#### Cockpit — Menüpunkte

| Label | Icon |
|---|---|
| Home | `icon-home-menu` |
| Kostüme | `icon-shirt` |
| Aufführungen | `icon-production-menu` |
| Darsteller | `icon-artist-menu` |
| Termine | `icon-calendar-menu` |
| Kontakte | `icon-contact-book` |
| Einstellungen | `icon-setting` |
| Nachrichten | `icon-chat` + Badge |
| Ausleihen | `icon-shopping-bag` + Badge |

#### Inventarisierung — Menüpunkte

| Label | Icon |
|---|---|
| Kategorie | `icon-category` |
| Material | `icon-material` |
| Bilder | `icon-images` |
| Masse | `icon-measuring` |
| Lagerort | `icon-placeholder` |
| ID & Infos | `icon-list` |
| Nachrichten | `icon-chat` |

---

### 6.5 Header / Reiter / Filter

#### Tab-Navigation (Reiter)

Horizontale Tabs mit Underline-Indikator.

| Eigenschaft | Aktiv | Inaktiv |
|---|---|---|
| Font | Inter Bold 16px | Inter Bold 16px |
| Text color | `secondary-700` (#75958D) | `neutral-grey-600` (#242727) |
| Underline | `6px solid secondary-700` | — |
| Badge | `22×22px`, `neutral-grey-600` bg, white text 10px bold | — |

```css
.tab {
  font-family: var(--font-family-base);
  font-size: var(--font-size-300); /* 16px */
  font-weight: var(--font-weight-700);
  color: var(--neutral-grey-600);
  padding-bottom: 8px;
  cursor: pointer;
  position: relative;
}
.tab--active {
  color: var(--secondary-700);
}
.tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--secondary-700);
  border-radius: 3px;
}
.tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: var(--neutral-grey-600);
  border: 1px solid #FFFFFF;
  border-radius: 103px;
  font-size: 10px;
  font-weight: 700;
  color: #FFFFFF;
  margin-left: 4px;
}
```

---

#### `AppShell` — Standard Seiten-Layout

**Jede neue App-Seite verwendet `AppShell` als äussere Hülle.** Die Komponente liefert Header (Logo + Collapse-Button), Sidebar-Navigation mit aktivem Menüpunkt und weissen Content-Bereich.

**Pfade:**
| Datei | Zweck |
|---|---|
| `src/components/layout/app-shell.tsx` | Server Component — fetcht Auth, userRole, Badges |
| `src/components/layout/app-shell-client.tsx` | Client Component — rendert Header + Sidebar + Content |

**Template für neue Seiten (`src/app/[route]/page.tsx`):**
```tsx
import { AppShell } from "@/components/layout/app-shell";

export default async function MeinePage() {
  return (
    <AppShell>
      <div style={{ padding: 40 }}>
        {/* Seiteninhalt hier */}
      </div>
    </AppShell>
  );
}
```

**Layout-Specs:**
| Element | Wert |
|---|---|
| Seiten-Hintergrund | `var(--page-bg)` = `#ECF1EE` |
| Header-Höhe | 72px |
| Sidebar-Breite (expanded) | 209px |
| Sidebar-Breite (collapsed) | 80px (K-Icon + »-Button) |
| Content-Bereich | `background: #FFFFFF`, `border-radius: 40px 40px 0 0` |
| Nav-Item Höhe | 50px |
| Aktiver Nav-Item | `background: #D6DFDD` |

**Was AppShell automatisch liefert:**
- Auth-Check (redirect auf `/login` falls nicht eingeloggt)
- `userRole` aus `theater_members` (für Admin-Nav-Item)
- Badge-Counts: `unreadMessages`, `pendingRentals`
- Sidebar-Collapse per Button (expanded: 209px, collapsed: 80px mit K-Icon + »)
- Aktiver Menüpunkt via `usePathname()`
- Profil-Dropdown (unten in Sidebar): „Mein Profil" → `/profile`, „Abmelden" → signOut + `/login`

**Wann AppShell NICHT verwenden:**
- Seiten mit eigenem vollständigem Shell (z.B. `CockpitShell` für Home `/`, `KostuemeNeuClient`)
- Login-Seite, Auth-Callbacks

---

#### Seiten-Hintergrund

Alle App-Seiten verwenden den Token `--page-bg` als Root-Hintergrundfarbe.

```css
--page-bg: #ECF1EE; /* = secondary-500 */
```

```tsx
// Root-Element jeder Seite / Shell-Komponente:
<div style={{ background: "var(--page-bg)", minHeight: "100vh" }}>
```

⚠️ Nie `--secondary-500` oder `#ECF1EE` direkt für den Seiten-Hintergrund verwenden — immer `--page-bg`.

---

#### `AppLogo` — Brand Logo Komponente

Wiederverwendbare Logo-Komponente: schwarzes K-Icon-Box + „kostüm+" Schriftzug, verlinkt auf `/`.

**Pfad:** `src/components/layout/app-logo.tsx`

```tsx
import { AppLogo } from "@/components/layout/app-logo";

<AppLogo />                  // Logo + Text (Standard)
<AppLogo showText={false} /> // Nur K-Icon (collapsed Sidebar)
```

| Property | Typ | Default | Beschreibung |
|---|---|---|---|
| `showText` | `boolean` | `true` | Blendet den „kostüm+" Schriftzug ein/aus |

**Specs:**
| Element | Wert |
|---|---|
| Icon-Box | 38×38px, `background: #0D0D0D`, `border-radius: 8px` |
| Icon-Buchstabe „K" | 18px, `font-weight: 700`, `color: #F5C842` |
| Schriftzug „kostüm+" | `font-size-350` (18px), `font-weight: 700`, `color: neutral-grey-700` |
| Gap Icon–Text | 8px |

**Verwendet in:** `cockpit-shell.tsx`, `kostueme-neu-client.tsx`

---

#### App Header Bar

Wird für alle Hauptansichten verwendet. Zwei Ebenen: obere Tabs + untere Content-Bar.

```css
.app-header {
  width: 100%;
  height: 70px;
  background: #FFFFFF;
  box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.20);
  border-radius: 40px 40px 0px 0px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}
```

**Varianten:**

| Variante | Inhalt |
|---|---|
| Header Anfrage bearbeiten | Brand-Logo links, Avatar + More-Icon, Speichern-Button, Close-Icon rechts |
| Header Ausleihe erfassen | Brand-Logo, Avatar, More-Icon, Speichern-Button, Close + Progressbar darunter |
| Filter Kostümübersicht | Tabs, Toggle, Filter-Dropdowns, Search |
| Header Kostüm Erfassung | Brand-Logo, Avatar, More-Icon, Camera-Button, Speichern, Close |
| Header Cockpit | Brand-Logo, Search-Box, "Ausleihe erfassen" + "Kostüme erfassen" Buttons |

---

#### Progressbar (Mehrstufig — Ausleihe erfassen)

Horizontale Schritt-Anzeige mit Kreisen und verbindender Linie.

| Zustand | Background | Border | Text color |
|---|---|---|---|
| Aktiv (current) | `primary-900` (#B59B3A) | `0.83px solid primary-900` | `#FFFFFF` |
| Inaktiv | `#FFFFFF` | `0.83px solid primary-900` | `primary-900` |

Verbindungslinie: `1.5px solid primary-900`, horizontal zwischen den Kreisen.

```css
.progress-step {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0.83px solid var(--primary-900);
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-base);
  font-size: var(--font-size-300); /* 16px */
  font-weight: var(--font-weight-500);
  color: var(--primary-900);
}
.progress-step--active {
  background: var(--primary-900);
  color: #FFFFFF;
}
.progress-line {
  flex: 1;
  height: 0;
  border-top: 1.5px solid var(--primary-900);
}
```

---

#### Ausleihen-Toggle (innerhalb Filter)

Pill-förmiger Zustand-Switcher innerhalb der Ausleihen-Ansicht.

| Zustand | Background | Border | Text |
|---|---|---|---|
| Aktiv | `secondary-800` (#556E68) | `3px solid secondary-800` | `#FFFFFF` |
| Inaktiv | `#FFFFFF` | `3px solid secondary-800` | `secondary-800` |

```css
.toggle-pill {
  height: 50px;
  border-radius: 46px;
  border: 3px solid var(--secondary-800);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-200); /* 14px */
  font-weight: var(--font-weight-500);
  cursor: pointer;
}
.toggle-pill--active {
  background: var(--secondary-800);
  color: #FFFFFF;
}
.toggle-pill--inactive {
  background: #FFFFFF;
  color: var(--secondary-800);
}
```

---

## 7. Spacing Scale (abgeleitet aus Komponenten)

Kein formales Figma-Spacing-Token-System vorhanden. Werte aus allen Komponenten-Specs abgeleitet.

```css
:root {
  --spacing-2:   2px;   /* Micro-Abstände */
  --spacing-4:   4px;   /* Divider, Border-Offsets */
  --spacing-8:   8px;   /* Gap Icon↔Text */
  --spacing-10:  10px;  /* Gap Buttons, Tag-Gruppen */
  --spacing-12:  12px;  /* Card-Innenabstand */
  --spacing-16:  16px;  /* Standard-Innenabstand */
  --spacing-18:  18px;  /* Button padding-top/bottom (default) */
  --spacing-20:  20px;  /* Input padding horizontal */
  --spacing-24:  24px;  /* Sektion-Abstände */
  --spacing-25:  25px;  /* Tag padding horizontal */
  --spacing-30:  30px;  /* Button padding horizontal */
  --spacing-40:  40px;  /* Container-Abstände */
}
```

| Verwendung | Wert |
|---|---|
| Icon ↔ Text (Nav, Buttons) | 8–10px |
| Button padding horizontal | 30px |
| Button padding vertikal | 17–18px |
| Input padding horizontal | 20px |
| Card interner Abstand | 12–16px |
| Tag padding | `10px 25px` |
| Tag-Gruppe gap | 10px |

---

## 8. Border-Radius Tokens (abgeleitet aus Komponenten)

Kein formales Figma-Radius-Token-System vorhanden. Alle Werte aus Komponenten-Specs abgeleitet.

```css
:root {
  --radius-xs:   4px;    /* List items, Dropdown-Liste */
  --radius-sm:   8px;    /* Input, Textarea, Dropdown, Nav-Items */
  --radius-md:   12px;   /* Select Cards, Image Cards, Icon-Badges */
  --radius-lg:   16px;   /* Buttons Primary/Secondary */
  --radius-xl:   40px;   /* App Header (nur oben) */
  --radius-pill: 44px;   /* Tags, Toggle-Pills, Search */
  --radius-full: 9999px; /* Avatar, Radio, Toggle, Tertiary Button */

  /* Semantische Radius-Tokens (Suchmodus & App-Panels) */
  --radius-card:    20px; /* Kostüm-Kachel, Category Tile */
  --radius-section: 30px; /* Abgerundete Sektions-Container */
  --radius-footer:  24px; /* Suchmodus Footer (oben abgerundet) */
  --radius-panel:   40px; /* App Header Panel (oben abgerundet) */
}
```

| Komponente | Radius |
|---|---|
| Input / Textarea / Dropdown | `--radius-sm` (8px) |
| Checkbox outer | `--radius-sm` (8px) |
| Select Card / Image Card | `--radius-md` (12px) |
| Button Primary/Secondary | `--radius-lg` (16px) |
| Navigation Item | `--radius-sm` (8px) |
| List Item | `--radius-xs` (4px) |
| App Header | `--radius-panel` = `40px 40px 0 0` |
| Tag / Search | `--radius-pill` (44–47px) |
| Avatar / Radio / Toggle / Tertiary | `--radius-full` |
| Progress Step | `--radius-full` |
| Kostüm-Kachel / Category Tile | `--radius-card` (20px) |
| Suchmodus Footer | `--radius-footer 24px 24px 0 0` |
| Abgerundeter Sektions-Container | `--radius-section` (30px) |

---

## 9. Breakpoints

Zwei Schriftskalen ("Tablet" / "Mobile") implizieren zwei Breakpoints. Empfohlene Werte:

```css
@media (max-width: 767px) {
  /* Mobile → font-size-{n}-s Skala */
}
@media (min-width: 744px) {
  /* Tablet/Desktop → font-size-{n} Skala */
}
```

> ⚠️ Bitte bestätigen: Bei welcher Bildschirmbreite soll die App von Mobile auf Tablet wechseln? 744px (iPad Mini 8.3 Portrait) — final entschieden.

---

## 10. Token Naming Convention Summary

| Kategorie | Pattern | Beispiel |
|---|---|---|
| Color | `{palette}-{shade}` | `secondary-700` |
| Font size | `font-size-{scale}[-s]` | `font-size-800`, `font-size-800-s` |
| Font weight | `font-weight-{value}` | `font-weight-700` |
| Shadow | `shadow-{level}` | `shadow-300` |
| Spacing | `--spacing-{value}` | `--spacing-16` |
| Radius | `--radius-{size}` | `--radius-md` |
| Logo | `logo-{type}-{partner}` | `logo-kostuem+_srf` |
| Icon | `icon-{name}` | `icon-check`, `icon-edit` |

---

*Generiert aus Figma Design System HCID-Fundus-Layout-01 — kostüm+ / costumanu*

---

## 11. Mobile Navigation

### 11.1 App Header Bar (Mobile)

| Eigenschaft | Wert |
|---|---|
| Höhe | 70px |
| Hintergrund | `#FFFFFF`, `box-shadow: 0px 1px 10px rgba(0,0,0,0.2)` |
| Logo | `brand-lu.svg` (oder partnerspezifisch), links |
| Rechte Icons | `icon-chat`, `icon-heart`, `icon-shopping-bag` — je 45×45px Hitbox |
| Hamburger | Zwei horizontale Linien, links |

```css
.app-header-mobile {
  height: 70px;
  background: #FFFFFF;
  box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}
.app-header-mobile__icon-btn {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### 11.2 Navigation Drawer — Level 1

Vollbild-Overlay, gleitet von links/oben ein.

| Eigenschaft | Wert |
|---|---|
| Hintergrund | `neutral-grey-600` (#242727) |
| Breite | 375px (full-width Mobile) |
| Padding | `24px 32px` |
| Abschnittstitel | Body-2-bold, 18px, `neutral-grey-400` (#A4A4A4) |
| Nav-Item-Höhe | 50px |
| Nav-Item-Font | Body-1-regular, 20px, `#FFFFFF` |
| Trennlinien | `1px solid rgba(255,255,255,0.2)` |
| Pfeil rechts | `icon-arrow-s`, 20×20px, weiss |
| Schliessen | `icon-close-small`, 20×20px, weiss, oben rechts |

```css
.nav-drawer {
  position: fixed;
  inset: 0;
  background: var(--neutral-grey-600);
  z-index: 50;
  padding: 24px 32px;
  overflow-y: auto;
}
.nav-drawer__section-title {
  font-size: 18px;
  font-weight: var(--font-weight-700);
  color: var(--neutral-grey-400);
  margin-bottom: 16px;
}
.nav-drawer__item {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 20px;
  font-weight: var(--font-weight-400);
  color: #FFFFFF;
}
.nav-drawer__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Level 1 Sektionen:**

| Sektion | Items |
|---|---|
| Kostüme | Damen, Herren, Unisex, Kinder, Tiere, Fantasy |
| Netzwerk & Support | Nachrichten, Kostümanfragen, Netzwerk, Support |
| (Profil) | Mein Profil |

---

### 11.3 Navigation Drawer — Level 2 (Sub-Kategorie)

Identische Optik wie Level 1 — mit zusätzlichem "Zurück"-Link oben.

```css
.nav-drawer__back {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-300);
  text-decoration: underline;
  margin-bottom: 16px;
}
/* icon-arrow-left davor: 14×14px, neutral-grey-300 */
```

**Beispiel Level 2 — "Herren Bekleidungsart":**
Alles entdecken, Anzüge, Hosen, Hemden, Mäntel & Jacken, Pullover, Shorts, T-Shirts

---

### 11.4 Bottom Nav Bar (Mobile — Profil-Leiste)

Erscheint am unteren Bildschirmrand, zeigt eingeloggten Nutzer.

| Eigenschaft | Wert |
|---|---|
| Höhe | 95px |
| Hintergrund | `neutral-grey-600` (#242727) |
| Border-radius | `8px 8px 0 0` |
| Box-shadow | `0px -3px 10px rgba(0,0,0,0.25)` |
| Avatar | 60×60px Kreis |
| Name | Body-2-medium, 18px, `#FFFFFF` |
| Pfeil | `icon-arrow-s`, 20×20px, weiss |

```css
.bottom-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 95px;
  background: var(--neutral-grey-600);
  box-shadow: 0px -3px 10px rgba(0, 0, 0, 0.25);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  padding: 0 21px;
  gap: 24px;
}
.bottom-nav-bar__avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.bottom-nav-bar__name {
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
```

---

## 12. Footer

| Eigenschaft | Wert |
|---|---|
| Hintergrund | `#000000` |
| Border-radius | `30px 30px 0 0` |
| Padding | `24px 33px` |
| Logo | `kostüm+` Wordmark (`Union.svg`), `primary-900` (#B59B3A), zentriert |
| Links | H4-regular, 26px, `#FFFFFF`, mit `icon-arrow-right` (27×27px) rechts |
| Copyright-Zeile | Subtitle-1-regular, 16px, `rgba(255,255,255,0.5)`, zentriert |
| Copyright-BG | `rgba(255,255,255,0.05)`, `padding: 16px 0` |

```css
.footer {
  background: #000000;
  border-radius: 30px 30px 0 0;
  padding: 24px 33px;
}
.footer__logo {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  color: var(--primary-900);
}
.footer__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  font-size: 26px; /* H4-regular */
  font-weight: var(--font-weight-400);
  color: #FFFFFF;
  border-bottom: none;
}
.footer__copyright {
  font-size: 16px;
  font-weight: var(--font-weight-400);
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 16px 0;
  background: rgba(255, 255, 255, 0.05);
}
```

**Footer-Links:** Häufige Fragen, Ausleihe & Abholung, Support & Kontakt

---

## 13. Search-Filter

### 13.1 Filter-Trigger Button

Pill-Button, öffnet Filter-Overlay.

```css
.filter-trigger {
  background: var(--primary-900);
  border-radius: 61px;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
/* Icon: icon-filter, 24×24px, weiss */
```

---

### 13.2 Filter-Overlay

Slide-Up Panel von unten.

| Eigenschaft | Wert |
|---|---|
| Hintergrund | `#FFFFFF` |
| Border-radius | `20px 20px 0 0` |
| Box-shadow | `0px -2px 20px rgba(0,0,0,0.2)` |
| Kopfzeile | `icon-filter` + Label "Filter", `icon-close-small` rechts (46×46px) |

**Sektionstitel-Pill** (schwarzer Pill-Label pro Kategorie):

```css
.filter-section-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 15px;
  background: #000000;
  border-radius: 49px;
  font-size: 16px;
  font-weight: var(--font-weight-400);
  color: #FFFFFF;
  margin-bottom: 12px;
}
```

**Filter-Sektionen (Mobile):**

| Sektion | Inhalt-Typ |
|---|---|
| Gender oder Typ | 2×3 Select Cards (93px Höhe) |
| Bekleidungsart | Select Cards (60px) + Suchfeld |
| Aufführung | 4× Suchfeld-Rows (Epoche, Stücktitel, Darsteller, Rolle) |
| Regie & Assistenz | Suchfeld-Rows |
| Sparte | Select Cards |
| Konfektionsgrösse | Size-Grid (106×70px) + Tag-Pills |
| Masse | Range-Slider in `secondary-500` Container |
| Materialart | Suchfeld + Select Cards (93px) |
| Muster | Select Cards (93px) |
| Farben | Color Swatches (60px) |

**"Filter anwenden" Button:**

```css
.btn-filter-apply {
  width: 343px;
  height: 62px;
  background: var(--primary-900);
  border-radius: var(--radius-md); /* 16px */
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
```

---

### 13.3 Search Input (globales Suchfeld)

**Default / Typing State:**

```css
.search-input-global {
  width: 343px;
  height: 60px;
  border: 1px solid #000000;
  border-radius: 47px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  background: #FFFFFF;
}
/* icon-search 25×25px links, vertikale Trennlinie 37px, Placeholder/Text, X-Button (20px rund) */
```

**Dropdown (Suchvorschläge):**

```css
.search-dropdown {
  background: #FFFFFF;
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-xs); /* 4px */
  padding: 8px 0;
}
.search-dropdown__item {
  padding: 12px 40px;
  font-size: 18px;
  font-weight: var(--font-weight-700); /* Match-Anteil fett */
  color: #000000;
}
.search-dropdown__item span {
  font-weight: var(--font-weight-400); /* Nicht-Match normal */
}
```

**Selected State** (Wert gewählt — 2-zeilig):

```css
.search-input-global--selected {
  height: 60px;
  border: 1px solid #000000;
  border-radius: 47px;
  padding: 8px 24px 8px 40px; /* Platz für icon-search links */
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.search-input-global--selected .label {
  font-size: 12px; /* Label-1-medium */
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
.search-input-global--selected .value {
  font-size: 18px; /* Body-2-medium */
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
```

---

### 13.4 Suchfeld-Row (im Filter)

60px hohe Pill-Zeile mit Icon und Placeholder/Wert.

```css
.filter-search-row {
  width: 343px;
  height: 60px;
  border: 1px solid #000000;
  border-radius: 47px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
}
.filter-search-row__label {
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
```

**Selected State** — 2-zeilig mit Kategorie-Label oben:

```css
/* Gleiche Optik wie search-input-global--selected */
```

---

### 13.5 Range-Slider (Masse-Filter)

Beidseitiger Slider in `secondary-500` Container.

```css
.range-slider-container {
  background: var(--secondary-500);
  border-radius: 25px;
  padding: 32px;
}
.range-slider__title {
  font-size: 20px;
  font-weight: var(--font-weight-700);
  color: #000000;
  margin-bottom: 16px;
}
.range-slider__label {
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
.range-slider__track {
  height: 6px;
  background: var(--secondary-700);
  border-radius: 47px;
  position: relative;
}
.range-slider__thumb {
  width: 30px;
  height: 30px;
  background: var(--secondary-800);
  border-radius: 50%;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
```

---

## 14. Controls-Select Ergänzungen

### 14.1 Konfektionsgrösse-Kachel (Size Tile)

Grid aus Kacheln zur Auswahl einer Konfektionsgrösse.

| Eigenschaft | Wert |
|---|---|
| Grösse | 106×70px |
| Border | `1px solid secondary-800` |
| Border-radius | `--radius-sm` (8px) |
| Font | H5-medium, 24px, `secondary-800` |
| Selected BG | `secondary-500` |

```css
.size-tile {
  width: 106px;
  height: 70px;
  border: 1px solid var(--secondary-800);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: var(--font-weight-500);
  color: var(--secondary-800);
  cursor: pointer;
}
.size-tile--selected {
  background: var(--secondary-500);
}
```

---

### 14.2 Tag-Pill (Konfektionsgrösse als Pill)

Horizontal scrollbare Zeile mit Grössen als Pill-Tags.

| Eigenschaft | Wert |
|---|---|
| Höhe | 44px |
| Padding | `10px 25px` |
| Border | `1px solid secondary-800` |
| Border-radius | `44px` |
| BG | `neutral-grey-50` (#FBFBFB) |
| Font | Subtitle-1-medium, 16px, `secondary-700` |

```css
.size-tag-pill {
  height: 44px;
  padding: 10px 25px;
  border: 1px solid var(--secondary-800);
  border-radius: 44px;
  background: #FBFBFB;
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: var(--secondary-700);
  white-space: nowrap;
  cursor: pointer;
}
.size-tag-pill--selected {
  background: var(--secondary-500);
  border-color: var(--secondary-700);
  color: var(--secondary-900);
}
```

---

*Generiert aus Figma Design System HCID-Fundus-Layout-01 — kostüm+ / costumanu*
