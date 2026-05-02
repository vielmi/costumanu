# modules.md — palco+ Modul-Dokumentation
> Dieses Dokument beschreibt die einzelnen App-Module als Kompositionen der Design-System-Komponenten.
> Basis: `design-system.md` — alle Tokens, Farben, Icons und Basis-Komponenten sind dort dokumentiert.
> Projekt: **costumanu** — `C:\Users\vielm\Repos\costumanu`
> Viewport: Mobile = 375px, Tablet/Desktop >= 744px

---

## Modul-Übersicht

| # | Modul | Route | Status |
|---|---|---|---|
| 1 | Cockpit | `/` (Home) | ✅ Dokumentiert |
| 2 | Kostümübersicht | `/fundus` | ✅ Implementiert |
| 3 | Kostüm erfassen | `/kostueme/neu` | ✅ Implementiert |
| 4 | Ausleihe | `/rental` | ✅ Implementiert |
| 5 | Kostüm Detail | `/costume/[id]` | ✅ Dokumentiert |
| 6 | Nachrichten | `/messages` | ✅ Implementiert |
| 15 | Suchmodus Cockpit | `/suchmodus` | ✅ Dokumentiert |
| 16 | Suchmodus Filter-Overlay | `/suchmodus/filter` | ✅ Dokumentiert |
| 17 | Suchmodus Resultate-Grid | `/suchmodus/results` | ✅ Dokumentiert |
| 18 | Suchmodus Kostüm-Detail | `/suchmodus/costume/[id]` | ✅ Dokumentiert |
| 19 | Suchmodus Suche | `/suchmodus/search` | ✅ Dokumentiert |
| 20 | Suchmodus Mobile Menu Drawer | — (Shared) | ✅ Dokumentiert |
| 21 | Standort-Sheet | — (Shared) | ✅ Dokumentiert |
| 22 | Cockpit Mobile-Layout (Drawer) | — (Shared) | ✅ Dokumentiert |

> **Geteilte Komponenten** (in Sektion am Ende dieses Dokuments, gehören zusätzlich in design-system.md):
> Mobile Navigation (Drawer + Multi-Level), Footer, Search-Filter Overlay, Search Input + Dropdown

---

## 1. Modul Cockpit

### Übersicht
Startseite nach dem Login. Zeigt 3 Navigations-Kacheln, Liste zuletzt bearbeiteter Kostüme, CTA-Karte.

### Layout-Struktur

```
+--------------------------------------------------+
|  [Kachel 1]  [Kachel 2]  [Kachel 3]  | CTA Card |
+--------------------------------------------------+
|  Zuletzt bearbeitete Kostüme                     |
|  [ List Item — aktiv (grüner Balken) ]           |
|  [ List Item ]                                   |
|  [ List Item ]                                   |
|  [ List Item ]                                   |
+--------------------------------------------------+
```

### Komponente 1: Navigations-Kachel (Image Card)

| Eigenschaft | Wert |
|---|---|
| Grösse Desktop | `flex: 1` (fluid, gleichmässig breit im Row) |
| Höhe | 180px |
| Border-radius | `--radius-md` (12px) |
| Overlay hell | `rgba(0, 0, 0, 0.3)` |
| Overlay dunkel | `rgba(0, 0, 0, 0.5)` (mittlere Kachel) |
| Titel | Body-1-medium, 20px, `#FFFFFF` |
| Icon | `icon-arrow-right`, 26x26px, weiss |

> ⚠️ Figma zeigt 269px fix — Implementierung nutzt `flex: 1` damit alle drei Kacheln gleichmässig den verfügbaren Platz füllen.

**Drei Kacheln:**

| Kachel | Titel | Route |
|---|---|---|
| 1 | Kostüm Übersicht | `/fundus` |
| 2 | Aktuelle- & vergangene Aufführungen | `/auffuehrungen` |
| 3 | Darsteller & Masse | `/darsteller` |

```css
.image-card {
  flex: 1;   /* fluid — passt sich an Content-Breite an */
  height: 180px;
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.image-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}
.image-card__title {
  position: absolute;
  bottom: 16px;
  left: 20px;
  right: 40px;
  font-size: var(--font-size-400);
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
.image-card__arrow {
  position: absolute;
  bottom: 20px;
  right: 16px;
  width: 26px;
  height: 26px;
  color: #FFFFFF;
}
```

### Komponente 2: Kostüm List Item

| Eigenschaft | Wert |
|---|---|
| Breite | 637px Desktop, fluid Mobile |
| Höhe | 70px |
| Border-radius | `--radius-xs` (4px) |
| BG default | `neutral-grey-100` (#F3F4F6) |
| BG aktiv | `secondary-500` (#ECF1EE) |
| Aktiv-Balken | 5x70px links, `accent-01`, `border-radius: 4px 0 0 4px` |

**Inhalte (links nach rechts):** `icon-more` (20x20px) → Avatar (46x46px rund) → [ID 10px + Name 14px bold] → Aufführung 14px → Icon-Badge (75x40px) → Status-Dot (10x10px)

**Status-Dot:** `accent-01` verfügbar, `color-error` nicht verfügbar, `color-warning` in Bearbeitung

**Icon-Badge:** 75x40px, `border: 1px solid neutral-grey-300`, `border-radius: 12px`, Icons 16x16px mit vertikalen Trennlinien `0.8px solid neutral-grey-300`

```css
.costume-list-item {
  width: 100%;
  height: 70px;
  border-radius: var(--radius-xs);
  background: var(--neutral-grey-100);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  position: relative;
}
.costume-list-item--active { background: var(--secondary-500); }
.costume-list-item__indicator {
  position: absolute;
  left: 0; top: 0;
  width: 5px; height: 70px;
  background: var(--accent-01);
  border-radius: 4px 0 0 4px;
}
.costume-list-item__avatar {
  width: 46px; height: 46px;
  border-radius: 100px;
  object-fit: cover;
  flex-shrink: 0;
}
.costume-list-item__id {
  font-size: var(--font-size-50); /* 10px — Token undokumentiert in design-system.md, existiert aber in globals.css */
  font-weight: 400;
  color: var(--neutral-grey-500);
}
.costume-list-item__name {
  font-size: var(--font-size-200);
  font-weight: var(--font-weight-500);
  color: #000000;
  letter-spacing: 0.01em;
}
.costume-list-item__production {
  font-size: var(--font-size-200);
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-600);
}
.costume-list-item__badge {
  border: 1px solid var(--neutral-grey-300);
  border-radius: var(--radius-md);
  height: 40px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.costume-list-item__status {
  width: 10px; height: 10px;
  border-radius: 50%;
  margin-left: auto;
  flex-shrink: 0;
}
.costume-list-item__status--available   { background: var(--accent-01); }
.costume-list-item__status--unavailable { background: var(--color-error); }
.costume-list-item__status--in-progress { background: var(--color-warning); }
```

### Komponente 3: CTA-Karte "Suchmodus öffnen"

| Eigenschaft | Wert |
|---|---|
| Grösse | 187x245px |
| Border-radius | `--radius-md` (12px) |
| Overlay | `rgba(0, 0, 0, 0.4)` |
| Titel | Body-1-medium, 20px, weiss, zentriert |
| Plus-Button | 60x60px Kreis, `border: 1px solid #FFFFFF`, Icon `icon-plus-m` weiss |

### Daten-Struktur

```typescript
interface ImageCard {
  title: string;
  imageUrl: string;
  overlayOpacity: 0.3 | 0.5;
  href: string;
}
interface CostumeListItem {
  id: string;
  name: string;
  imageUrl: string;
  production: string;
  gender: 'female' | 'male' | 'unisex' | 'kid' | 'family';
  type?: string;
  status: 'available' | 'unavailable' | 'in-progress';
  isActive?: boolean;
}
```

---

## 2. Modul Kostüm Detail (Kostüm Heading)

**Route:** `/kostueme/[id]`

### Layout-Struktur (Mobile)

```
+-------------------------------------------+
|  [Foto-Slideshow, 372px hoch]             |
|         • o o o    (Pagination)           |
|  Jumpsuit                   (Kategorie)   |
|  Grüner Satin-Jumpsuit...   (Titel H4)    |
|  Konfektionsgrösse M        (Grösse)      |
|  Beschreibungstext                        |
|  (M) Herren  (++) Mehrteilig  (=) Serie   |
|  (v) Luzerner Theater       (Verfügbar)   |
+-------------------------------------------+
|  [         Ausleihen  (bag)          ]    |
|  [ Teilen (share) ]  [ Merken (heart) ]  |
+-------------------------------------------+
```

### Komponente: Bild-Slideshow

```css
.costume-image-slide {
  width: 100%;
  height: 372px;
  object-fit: cover;
}
.costume-pagination {
  display: flex;
  gap: 31px;
  justify-content: center;
  margin-top: 8px;
}
.costume-pagination__dot {
  width: 11px; height: 11px;
  border-radius: 50%;
  background: #000000;
}
.costume-pagination__dot--inactive {
  background: transparent;
  border: 1px solid #000000;
}
```

### Komponente: "gemerkt" Overlay-Badge

Temporäres Feedback nach dem Merken, erscheint auf dem Bild.

```css
.gemerkt-badge {
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 90px;
  width: 136px;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}
.gemerkt-badge__icon-bg {
  width: 34px; height: 34px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gemerkt-badge__text {
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
```

### Komponente: Metadaten-Tags

Inline-Tags mit Icon + Labeltext.

```css
.costume-meta-tags {
  display: flex;
  gap: 16px;
  align-items: center;
}
.costume-meta-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-200); /* 14px */
  font-weight: var(--font-weight-400);
  color: #000000;
}
.costume-meta-tag svg {
  width: 20px; height: 20px;
  color: var(--neutral-grey-600);
}
```

### Komponente: Verfügbarkeits-Zeile

| State | Erscheinung |
|---|---|
| Verfügbar | Grüner Kreis (`accent-01`) + Checkmark |
| Auf Anfrage | Grauer Kreis (`neutral-grey-400` outline) + `icon-anfrage` |

```css
.availability-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
.availability-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}
.availability-dot--available { background: var(--accent-01); }
.availability-dot--on-request {
  border: 1.25px solid var(--neutral-grey-400);
}
```

### Komponente: Action-Buttons

```css
.btn-ausleihen {
  width: 100%;
  height: 60px;
  background: var(--primary-900);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
.btn-secondary-action {
  flex: 1;
  height: 60px;
  background: #FFFFFF;
  border: 1px solid var(--primary-900);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: var(--primary-900);
}
```

### Daten-Struktur

```typescript
interface CostumeDetail {
  id: string;
  category: string;         // z.B. "Jumpsuit"
  name: string;
  size: string;             // z.B. "Konfektionsgrösse M"
  description: string;
  images: string[];
  gender: 'female' | 'male' | 'unisex' | 'kid' | 'family';
  type: string;             // z.B. "Mehrteilig"
  series?: string;
  availability: {
    institution: string;
    status: 'available' | 'on-request';
  }[];
}
```

---

## 3. Modul Kostüm Teaser (Grid-Ansicht)

**Verwendung:** Suchergebnisse, Kategorieseite — 2-spaltiges Grid

### Layout (Mobile)

2 Spalten, je 165px, `gap: 13px horizontal, 15px vertikal`.

### Komponente: Kostüm-Karte

| Eigenschaft | Wert |
|---|---|
| Breite | 165px |
| Bild | 165x240px, `object-fit: cover` |
| Kein Foto BG | `secondary-500` mit Multiply blend-mode |
| Kategorie | Label-1-medium, 12px, `#000000` |
| Name | Subtitle-1-medium, 16px, `#000000` |
| Aufführung | Subtitle-2-regular, 14px, `#000000` |
| Verfügbarkeit | `availability-row` Komponente |

```css
.costume-card {
  width: 165px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.costume-card__image-wrapper {
  position: relative;
  width: 165px;
  height: 240px;
  overflow: hidden;
}
.costume-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.costume-card__bookmark {
  position: absolute;
  top: 6px; right: 6px;
  width: 40px; height: 40px;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.costume-card__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.costume-card__category {
  font-size: 12px;
  font-weight: var(--font-weight-500);
  color: #000000;
}
.costume-card__name {
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: #000000;
}
.costume-card__production {
  font-size: 14px;
  font-weight: var(--font-weight-400);
  color: #000000;
}
```

**Loading-Spinner:** 32x32px, zentriert über Bild (während Bild lädt).

### Daten-Struktur

```typescript
interface CostumeTeaserCard {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  production: string;
  availability: { institution: string; status: 'available' | 'on-request'; };
  isBookmarked?: boolean;
}
```

---

## 4. Modul Kategorien

**Verwendung:** Kategorienseite (Epochen, Sparten, etc.)

### Komponente: Kategorie-Kachel

| Eigenschaft | Wert |
|---|---|
| Breite | 224px |
| Höhe | 270px |
| Border-radius | `--radius-md` (12px) |
| Overlay | `rgba(0, 0, 0, 0.4)` |
| Abschnittstitel (über Kacheln) | H6-medium, 22px, `neutral-grey-600` |
| Label im Bild | H4-medium, 26px, weiss, mit Pfeil |
| Pfeil | `icon-arrow-right`, 27x27px, weiss |

```css
.category-section__title {
  font-size: 22px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
  margin-bottom: 12px;
}
.category-tile {
  width: 224px;
  height: 270px;
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.category-tile__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}
.category-tile__label {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 26px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
.category-tiles-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}
```

---

## 5. Modul Heading (Hero)

**Verwendung:** Landing Page / Sektions-Einstieg mit Vollbild-Hero.

### Komponente: Hero Banner

| Eigenschaft | Wert |
|---|---|
| Breite | 100vw (full-width) |
| Höhe Mobile | 400px |
| Overlay | `rgba(0, 0, 0, 0.4)` |
| Text | H1-medium, 36px, weiss, `letter-spacing: 0.003em` |

```css
.hero-banner {
  width: 100%;
  height: 400px;
  position: relative;
  overflow: hidden;
}
.hero-banner__image {
  position: absolute;
  inset: 0;
  object-fit: cover;
  width: 100%;
  height: 100%;
}
.hero-banner__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}
.hero-banner__text {
  position: absolute;
  left: 25px; right: 25px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-1000);
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
  letter-spacing: 0.003em;
  line-height: var(--line-height-120);
}
```

---

## 6. Highlight Teaser

**Verwendung:** Abschnitts-Teaser mit farbigem Hintergrund + horizontalem Bild-Scroll.

### Varianten

| Variante | Hintergrundfarbe | Token |
|---|---|---|
| Grün | `#76FEAC` | `accent-01` |
| Rosa | `#F5E4E4` | `accent-02` |
| Blau | `#CDDBE4` | `tertiary-700` |

### Komponente

| Eigenschaft | Wert |
|---|---|
| Breite | 100% |
| Höhe | 393px |
| Padding | 16px |
| Abschnittstitel | H6-medium, 22px, `neutral-grey-600` |

```css
.highlight-teaser {
  width: 100%;
  height: 393px;
  padding: 16px;
}
.highlight-teaser--green { background: var(--accent-01); }
.highlight-teaser--pink  { background: var(--accent-02); }
.highlight-teaser--blue  { background: var(--tertiary-700); }
.highlight-teaser__title {
  font-size: 22px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
  margin-bottom: 12px;
}
.highlight-teaser__cards {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
```

**Kacheln:** 224px (links) / 220px (rechts), 270px hoch, `border-radius: 12px`, Overlay `rgba(0,0,0,0.4)`, Label H4-medium 26px weiss.

---

## 7. Call to Action (Event-Karte)

**Verwendung:** Aktions-Teaser für Veranstaltungen / Verkäufe.

### Varianten

| Variante | Hintergrundfarbe oberer Bereich |
|---|---|
| Grün | `secondary-700` (#75958D) |
| Blau | `tertiary-800` (#83A7BF) |

### Komponente

| Eigenschaft | Wert |
|---|---|
| Breite | 343px |
| Border-radius | 30px |
| Oberer Bereich | 203px Höhe, einfarbig, `border-radius: 30px` |
| Haupt-Overlay | `rgba(0,0,0,0.6)`, `border-radius: 30px` |
| "Save the date" | Body-1-medium, 20px, weiss, oben links |
| Haupt-Titel | H1-regular, 36px, weiss |
| CTA-Text/Datum | H1-regular, 36px, `primary-900` (#B59B3A) |
| Pfeil rechts | 27x27px, `primary-900` |

```css
.cta-event-card {
  width: 343px;
  border-radius: 30px;
  overflow: hidden;
  position: relative;
}
.cta-event-card__bg-top {
  height: 203px;
  border-radius: 30px;
}
.cta-event-card__title {
  font-size: var(--font-size-1000);
  font-weight: var(--font-weight-400);
  color: #FFFFFF;
  line-height: var(--line-height-120);
}
.cta-event-card__date {
  font-size: var(--font-size-1000);
  font-weight: var(--font-weight-400);
  color: var(--primary-900);
}
```

---

## Geteilte Komponenten (Design-System Ergänzungen)

> Diese Sektionen sollten zusätzlich in `design-system.md` eingefügt werden.

---

### DS-A: Mobile Navigation

#### App Header Bar (Mobile)

| Eigenschaft | Wert |
|---|---|
| Höhe | 70px |
| Hintergrund | `#FFFFFF`, `box-shadow: 0px 1px 10px rgba(0,0,0,0.2)` |
| Logo | `brand-lu.svg` links |
| Rechte Icons | `icon-chat`, `icon-heart`, `icon-shopping-bag`, je 45x45px Hitbox |

#### Drawer Level 1

| Eigenschaft | Wert |
|---|---|
| Hintergrund | `neutral-grey-600` (#242727) |
| Breite | 375px (Vollbild Mobile) |
| Abschnittstitel | Body-2-bold, 18px, `neutral-grey-400` |
| Nav-Items | Body-1-regular, 20px, `#FFFFFF`, 50px Höhe |
| Trennlinien | `1px solid rgba(255,255,255,0.2)` |
| Pfeil rechts | `icon-arrow-s`, 20x20px, weiss |
| Schliessen | `icon-close-small`, 20x20px, weiss, oben rechts |

```css
.nav-drawer {
  position: fixed;
  inset: 0;
  background: var(--neutral-grey-600);
  z-index: 50;
  padding: 24px 32px;
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
```

**Level 1 Sektionen:**
- Kostüme: Damen, Herren, Unisex, Kinder, Tiere, Fantasy
- Netzwerk & Support: Nachrichten, Kostümanfragen, Netzwerk, Support
- Profil: Mein Profil

#### Drawer Level 2 (Sub-Kategorie)

Gleiche Optik wie Level 1, mit "Zurück"-Link oben (14px, `neutral-grey-300`, underline, `icon-arrow-left` 14x14px).

**Beispiel Herren Bekleidungsart:** Alles entdecken, Anzüge, Hosen, Hemden, Mäntel & Jacken, Pullover, Shorts, T-Shirts

#### Bottom Nav Bar (Mobile Profil-Leiste)

| Eigenschaft | Wert |
|---|---|
| Höhe | 95px |
| Hintergrund | `neutral-grey-600`, `box-shadow: 0px -3px 10px rgba(0,0,0,0.25)`, `border-radius: 8px 8px 0 0` |
| Avatar | 60x60px Kreis |
| Name | Body-2-medium, 18px, weiss |

---

### DS-B: Footer

| Eigenschaft | Wert |
|---|---|
| Hintergrund | `#000000` |
| Border-radius | `30px 30px 0 0` |
| Padding | 24px 33px |
| Logo | `palco+` Wordmark, `primary-900` (#B59B3A) |
| Links | H4-regular, 26px, `#FFFFFF`, mit `icon-arrow-right` |
| Copyright | Subtitle-1-regular, 16px, `rgba(255,255,255,0.5)` |

```css
.footer {
  background: #000000;
  border-radius: 30px 30px 0 0;
  padding: 24px 33px;
}
.footer__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26px;
  font-weight: var(--font-weight-400);
  color: #FFFFFF;
  padding: 16px 0;
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

**Footer Links:** Häufige Fragen, Ausleihe & Abholung, Support & Kontakt

---

### DS-C: Search-Filter Overlay

#### Trigger Button

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
```

#### Filter Overlay Container

Slide-Up Panel, `border-radius: 20px 20px 0 0`, `box-shadow: 0px -2px 20px rgba(0,0,0,0.2)`, weisser Hintergrund.

**Sektionstitel-Pill:** `background: #000000`, `border-radius: 49px`, `padding: 3px 15px`, weisser Text Subtitle-1-regular 16px.

**Inhalts-Sektionen:**

| Sektion | Inhalt-Typ |
|---|---|
| Gender oder Typ | 2x3 Select Cards (93px Höhe) |
| Bekleidungsart | Select Cards (60px) + Suchfeld |
| Aufführung | 4x Suchfeld-Rows (Epoche, Stücktitel, Darsteller, Rolle) |
| Regie & Assistenz | Suchfeld-Rows |
| Sparte | Select Cards |
| Konfektionsgrösse | Size-Grid (106x70px) + Tag-Pills |
| Masse | Range-Slider in `secondary-500` Container |
| Materialart | Suchfeld + Select Cards (93px) |
| Muster | Select Cards (93px) |
| Farben | Color Swatches (60px) |

#### Suchfeld-Row (Filter)

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

**Selected State:** Label oben (12px, Subtitle-2-medium) + Wert unten (18px, Body-2-medium), beide `neutral-grey-600`.

#### Range-Slider (Masse)

```css
.range-slider-container {
  background: var(--secondary-500);
  border-radius: 25px;
  padding: 32px;
}
.range-slider__track {
  height: 6px;
  background: var(--secondary-700);
  border-radius: 47px;
}
.range-slider__thumb {
  width: 30px; height: 30px;
  background: var(--secondary-800);
  border-radius: 50%;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
}
```

#### Konfektionsgrösse-Kachel

```css
.size-tile {
  width: 106px; height: 70px;
  border: 1px solid var(--secondary-800);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: var(--font-weight-500);
  color: var(--secondary-800);
}
.size-tile--selected { background: var(--secondary-500); }
```

#### Tag-Pills (Grösse)

```css
.tag-pill {
  height: 44px;
  padding: 10px 25px;
  border: 1px solid var(--secondary-800);
  border-radius: 44px;
  background: #FBFBFB;
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: var(--secondary-700);
}
```

#### "Filter anwenden" Button

```css
.btn-filter-apply {
  width: 343px;
  height: 62px;
  background: var(--primary-900);
  border-radius: var(--radius-md);
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
```

---

### DS-D: Search Input mit Dropdown

```css
/* Default / Typing */
.search-input {
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
.search-input__text {
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: #000000;
}

/* Dropdown */
.search-dropdown {
  background: #FFFFFF;
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-xs);
}
.search-dropdown__item {
  padding: 12px 40px;
  font-size: 18px;
  font-weight: var(--font-weight-700); /* Match bold */
  color: #000000;
}
.search-dropdown__item span { /* Nicht-Match Anteil */
  font-weight: var(--font-weight-400);
}

/* Selected State (Wert gewählt) */
.search-input--selected {
  border: 1px solid #000000;
  border-radius: 47px;
  height: 60px;
  padding: 8px 24px 8px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.search-input--selected .label {
  font-size: 12px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
.search-input--selected .value {
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
```

---

*Stand: Mobile-Screens vollständig dokumentiert — palco+ / costumanu*

---

## 8. Modul Suche

**Route:** `/suche`

### Übersicht
Globale Suchseite mit zwei Zuständen: Default (leeres Feld + iOS-Keyboard) und Type (Suchbegriff + Vorschläge + vertikaler Akzentbalken).

### Layout-Struktur

```
+--------------------------------------------+
| [Abbrechen]                                |
| [Q icon | Suche          ]   (Default)     |
+--------------------------------------------+

+--------------------------------------------+
| [Abbrechen]                                |
| [Q icon | Jumpsuit grün  X ]               |
| Suchvorschläge                             |
| | Bild | Jumpsuit Grün mit...              |  ← aktiv (Balken)
| | Bild | Grüner Satin-Jumpsuit...          |
| | Bild | Jumpsuit in grünem...             |
+--------------------------------------------+
```

### Komponente: Globales Suchfeld

```css
.global-search {
  width: 343px;
  height: 60px;
  border: 1px solid #000000;
  border-radius: 47px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  background: #FFFFFF;
}
.global-search__icon { width: 25px; height: 25px; color: #000000; }
.global-search__divider {
  width: 0;
  height: 37px;
  border-left: 1px solid #000000;
}
.global-search__placeholder {
  font-size: 16px;
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-500);
}
.global-search__value {
  flex: 1;
  font-size: 16px;
  font-weight: var(--font-weight-400);
  color: #000000;
}
.global-search__clear {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 1px solid var(--neutral-grey-600);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Abbrechen-Link:** Subtitle-2-regular, 14px, `#000000`, underline — `position: absolute; right: 0; top: 0`

### Komponente: Suchergebnis-Zeile

| Eigenschaft | Wert |
|---|---|
| Bild | 75x75px, `border-radius: 4px` |
| Aktiv-Balken | 3x69px rechts, `neutral-grey-600`, `border-radius: 45px` |
| Titel | Subtitle-1-bold, 16px, `#000000` — Suchbegriff fett, Rest normal |
| Untertitel | Subtitle-2-regular, 14px, `#000000` |

```css
.search-result-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  position: relative;
}
.search-result-row__image {
  width: 75px; height: 75px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}
.search-result-row__indicator {
  position: absolute;
  right: 0; top: 0;
  width: 3px; height: 69px;
  background: var(--neutral-grey-600);
  border-radius: 45px;
}
.search-result-row__title {
  font-size: 16px;
  font-weight: var(--font-weight-700); /* match-Anteil bold */
  color: #000000;
}
.search-result-row__title span { font-weight: var(--font-weight-400); }
.search-result-row__subtitle {
  font-size: 14px;
  font-weight: var(--font-weight-400);
  color: #000000;
}
```

### Daten-Struktur

```typescript
interface SearchResult {
  id: string;
  imageUrl: string;
  title: string;        // Vollständiger Titel
  matchText: string;    // Suchbegriff (bold markiert)
  subtitle: string;     // Aufführung + Epoche
  isActive?: boolean;   // Zeigt rechten Balken
}
```

---

## 9. Modul Standort-Picker

**Verwendung:** Modal-Overlay für Standortauswahl (z.B. in Filter, Kostüm-Spezifikationen)

### Komponente: Standort-Picker Modal

| Eigenschaft | Wert |
|---|---|
| Container | Weisser Hintergrund, Slide-Up |
| Suchfeld | `border-radius: 47px`, `border: 1px solid #000000`, `icon-location` links, `icon-close-small` rechts |
| List Items | 343px breit, `border: 1px solid secondary-800`, `border-radius: 10px`, 80px Höhe |
| Icon | `icon-location`, 22.5x32px, `secondary-800` |
| Label | Body-2-medium, 18px, `secondary-800` |
| Checkbox | Rechts ausgerichtet, `border: 2px solid secondary-800`, `border-radius: 4px`, 20x20px |
| Toggle | "Alle Standorte durchsuchen", Toggle-Komponente (`secondary-500`/`secondary-700`) |
| Button | `btn-filter-apply`, 62px, `primary-900` |

**Selected State:** `background: secondary-500`, Checkbox filled (`border: 2px solid secondary-700`), `border-radius: 4px`

```css
.standort-item {
  width: 343px;
  height: 80px;
  border: 1px solid var(--secondary-800);
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  background: #FFFFFF;
}
.standort-item--selected { background: var(--secondary-500); }
.standort-item__checkbox {
  margin-left: auto;
  width: 20px; height: 20px;
  border: 2px solid var(--secondary-800);
  border-radius: 4px;
}
.standort-item--selected .standort-item__checkbox {
  border: 2px solid var(--secondary-700);
  background: var(--secondary-700);
}
```

---

## 10. Kostüm Detailpage — Breadcrumb + Heading

**Route:** `/kostueme/[id]` (Erweiterung von Modul 2)

### Zusatz: Breadcrumb-Navigation

Horizontale Breadcrumb-Zeile oben auf der Detailseite.

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px; /* Label-1-regular */
  font-weight: var(--font-weight-400);
  color: #000000;
  letter-spacing: 0.01em;
  margin-bottom: 16px;
}
.breadcrumb__back {
  display: flex;
  align-items: center;
  gap: 4px;
}
.breadcrumb__arrow { /* icon-arrow-left, 15x15px */
  width: 15px; height: 15px;
  color: #000000;
}
.breadcrumb__divider { /* icon-arrow-s small, 10x10px, nach rechts */
  width: 10px; height: 10px;
  color: #000000;
}
.breadcrumb__separator {
  width: 18px; height: 0;
  border-left: 1px solid var(--neutral-grey-300);
  transform: rotate(90deg);
}
```

**Aufbau Beispiel:** `← Zurück | Herren > Hosen > Jumpsuit`

### Merge-Hinweis

Die restlichen Inhalte (Bild, Metadaten, Buttons) sind identisch mit Modul 2 (Kostüm Detail). Breadcrumb wird als separates Modul oben eingefügt.

---

## 11. Kostüm Spezifikationen

**Route:** `/kostueme/[id]/spezifikationen`

### Übersicht
Vollständige Spezifikationsseite eines Kostüms als collapsible Accordion. Alle Sektionen können auf- und zugeklappt werden.

### Layout-Struktur (Mobile)

```
Kostümspezifikationen   (H4-medium, 24px)
+----------------------------------------+
| Kategorie                   ↑ [open]  |
| ─────────────────────────────────────  |
|   Gender / Typ    Herren               |
|   ·············  ·············         |
|   Epoche          20-er Jahre          |
|   Segment         Schauspiel           |
|   Bekleidungsart  Hose                 |
|   Bekleidungstyp  Jumpsuit / ...       |
+----------------------------------------+
| Aufführung                  ↑ [open]  |
| ─────────────────────────────────────  |
|   Stücktitel  / Darsteller / Rolle ... |
+----------------------------------------+
| Material                    ↑ [open]  |
| Masse                       ↑ [open]  |
| Standort                    ↑ [open]  |
| ID & Infos                  ↑ [open]  |
| Kostümteile                 ↑ [open]  |
| Historie                    ↑ [open]  |
+----------------------------------------+
```

### Komponente: Accordion Section

| Eigenschaft | Wert |
|---|---|
| Header-Label | Body-2-bold, 18px, `neutral-grey-600` |
| Trennlinie | `1px solid #000000` unter Header |
| Icon | `icon-arrow-up`/`icon-arrow-down`, 16x16px, schwarz |
| Feld-Label | Subtitle-1-bold, 16px, `#000000` |
| Feld-Wert | Subtitle-1-regular, 16px, `neutral-grey-600` |
| Interne Trennlinien | `1px solid neutral-grey-300` |

```css
.accordion-section {
  margin-bottom: 0;
}
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}
.accordion-header__title {
  font-size: 18px;
  font-weight: var(--font-weight-700);
  color: var(--neutral-grey-600);
}
.accordion-divider { border-top: 1px solid #000000; }
.accordion-field {
  padding: 12px 0;
  border-bottom: 1px solid var(--neutral-grey-300);
}
.accordion-field__label {
  font-size: 16px;
  font-weight: var(--font-weight-700);
  color: #000000;
  margin-bottom: 4px;
}
.accordion-field__value {
  font-size: 16px;
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-600);
}
```

### Accordion Sektionen

**1. Kategorie:** Kategorie-Name (Body-1-medium, 20px), dann Felder: Gender/Typ, Epoche, Segment, Bekleidungsart, Bekleidungstyp

**2. Aufführung:** Stücktitel, Darsteller, Rolle, Regie, Kostümbildner, Kostümassistenz

**3. Material:** Materialart, Materialoptik, Muster, Farbrichtung (mit Farb-Swatches 20x20px inline), Waschanleitung (Icons `icon-wash`, `icon-tumble-dry` etc. + Textlabel)

**4. Masse:** Konfektionsgrösse, Rocklänge, Taillenumfang, Brustumfang, Hüftumfang

**5. Standort:** Institution + Adresse, Platzierung (Stockwerk, Regal, Sektor), Status (`availability-row` Komponente)

**6. ID & Infos:** ID-Nummer (`icon-ID`), RFID (`icon-rfid`), QR-Code (`icon-qr-code`) — je Label + Wert inline

**7. Kostümteile:** Liste mit `icon-family` + verlinktem Kostüm-Namen (underline, 16px)

**8. Historie:** Klappbar, zeigt Verlauf

### Daten-Struktur

```typescript
interface CostumeSpecs {
  category: {
    genderType: string;
    epoch: string;
    segment: string;
    clothingType: string;
    clothingSubtype: string;
  };
  performance: {
    title: string;
    performer: string;
    role: string;
    director: string;
    costumeDesigner: string;
    costumeAssistant: string;
  };
  material: {
    type: string;           // z.B. "Baumwolle"
    finish: string;         // z.B. "Satin"
    pattern: string;        // z.B. "Uni"
    colors: string[];       // z.B. ["Grün", "Rot"]
    washInstructions: WashIcon[];
  };
  measurements: {
    size: string;           // z.B. "M"
    skirtLength?: string;
    waist?: string;
    chest?: string;
    hips?: string;
  };
  location: {
    institution: string;
    address: string;
    floor: string;
    shelf: string;
    sector: string;
    status: 'available' | 'on-request';
  };
  ids: {
    internalId: string;
    rfid?: string;
    qrCode?: string;
  };
  parts?: { id: string; name: string }[];
}
```

---

## 12. Modul Anfragen

**Route:** `/anfragen`

### Übersicht
3-stufiger Anfragefluss für externe Kostüm-Anfragen bei anderen Theatern/Fundus. Inkl. Kostümliste, Kontaktkarte, Formular, Bestätigung.

### Multi-Step Progressbar

3 Schritte horizontal, verbunden durch Linie (`primary-900`).

| State | Erscheinung |
|---|---|
| Aktiv (current) | Gefüllter Kreis `primary-900`, weisse Zahl, 30x30px |
| Pending | Outline Kreis `0.833px solid primary-900`, Zahl `primary-900` |
| Label unter Dot | Subtitle-3-medium, 13px, `#000000` |
| Verbindungslinie | `1px solid primary-900`, 232px breit |

```css
.progress-steps {
  display: flex;
  align-items: flex-start;
  position: relative;
}
.progress-steps__line {
  position: absolute;
  top: 15px; /* center der Dots */
  left: 58px;
  width: 232px;
  height: 0;
  border-top: 1px solid var(--primary-900);
}
.progress-dot {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: var(--font-weight-500);
  letter-spacing: 0.01em;
}
.progress-dot--active {
  background: var(--primary-900);
  color: #FFFFFF;
}
.progress-dot--pending {
  background: #FFFFFF;
  border: 0.833px solid var(--primary-900);
  color: var(--primary-900);
}
.progress-dot__label {
  font-size: 13px;
  font-weight: var(--font-weight-500);
  color: #000000;
  text-align: center;
  margin-top: 4px;
}
```

### Schritt 1: Anfragenden-Auswahl (Personalien)

Zeigt Kontaktkarte des Anfragenden (Slide-up Modal).

**Kontaktkarte:**

| Eigenschaft | Wert |
|---|---|
| Avatar | 80x80px Kreis |
| Name | H5-medium (H4 mobile), 22px/24px |
| Rolle | Body-1-regular/medium, 20px |
| Institution | Body-2-medium, 18px, `neutral-grey-600` |
| Telefon-Pill | `secondary-500`/`tertiary-600` (#E4EEF5) BG, `border-radius: 51px`, `icon-phone` + Nummer |
| Email-Pill | Gleiche Optik, `icon-mail` + "E-Mail" |
| Formular-Felder | 50px hoch, `border-bottom: 1px solid #000000`, Label Body-2-medium 18px, `neutral-grey-600` |

**Formularfelder Personalien:** Anrede (Dropdown, 135x50px), Vorname, Name, Rolle, Institution, E-Mail, Tel.

```css
.contact-card {
  background: #FFFFFF;
  box-shadow: 1px 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.contact-pill {
  height: 40px;
  padding: 0 16px;
  background: var(--secondary-500); /* or tertiary-600 */
  border-radius: 51px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
.form-field-row {
  width: 343px;
  height: 50px;
  border-bottom: 1px solid #000000;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 18px;
  font-weight: var(--font-weight-500);
  color: var(--neutral-grey-600);
}
```

### Schritt 2: Verwendung

**Felder:** Verwendungszweck (Dropdown, 50px + Textarea 160px), Wunschtermin Besichtigung (Datumsfeld), Zeitfenster (2x Radio), Ausleihdauer (Von/Bis Datumsfelder).

**Datumsfeld:**

```css
.date-input {
  width: 147px;
  height: 60px;
  border: 1.2px solid #000000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}
.date-input__placeholder {
  font-size: 16px;
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-600);
}
/* icon-calendar-menu: 25x25px, neutral-grey-600 */
```

**Textarea mit Resize-Handle:**

```css
.textarea-input {
  width: 344px;
  height: 160px;
  border: 1.2px solid #000000;
  border-radius: 4px;
  padding: 16px;
  resize: none;
  position: relative;
}
/* Resize-Handle: zwei diagonale Linien (20px + 10px) rechts unten, rotate(135deg) */
```

### Anfragenübersicht (Zusammenfassung mit Kostümliste)

**Institutions-Kacheln:**

| Eigenschaft | Wert |
|---|---|
| Grösse | 164x120px |
| Background | `primary-600` (#EEECE5) |
| Border-radius | `--radius-md` (12px) |
| Logo | Institution-Logo zentriert |
| Badge | 25x25px Kreis `neutral-grey-600`, weisse Zahl, `border: 2px solid primary-600` |
| Pfeile | 11.85x20px `neutral-grey-700`, links/rechts zum Wechseln |

**Kostüm-Zeile in Anfrage (kompakt):**

| Eigenschaft | Wert |
|---|---|
| Bild | 75x100px, `border-radius: 4px` |
| ID + Kategorie | Label-1-medium, 12px |
| Name | Subtitle-1-medium, 16px |
| Aufführung + Epoche | Subtitle-2-regular, 14px |
| Verfügbarkeit | `availability-row` Komponente |
| Löschen | `icon-delete`, 20x20px, `neutral-grey-600` |
| Trennlinie | `1px solid tertiary-200` (#BCCED9) |

### Bestätigungs-Screen

Grüner Checkmark-Kreis (`accent-01`, 100x100px) + Erfolgstext + "Schliessen"-Button (`primary-900`).

```css
.confirmation-check {
  width: 100px; height: 100px;
  border-radius: 50%;
  background: var(--accent-01);
  display: flex;
  align-items: center;
  justify-content: center;
}
/* icon-check weiss, 45x45px darin */
```

### Daten-Struktur

```typescript
interface AnfrageForm {
  step: 1 | 2 | 3;
  personalien: {
    anrede: string;
    vorname: string;
    name: string;
    rolle: string;
    institution: string;
    email: string;
    tel: string;
  };
  verwendung: {
    zweck: string;
    besichtigungstermin: Date;
    zeitfenster: string[];
    ausleiheVon: Date;
    ausleiheAn: Date;
    mitteilung?: string;
  };
  kostueme: { id: string; name: string; imageUrl: string }[];
}
```

---

## 13. Modul Ausleihen

**Route:** `/rental`

### Übersicht
3-stufiger Ausleih-Flow: (1) Personalien → (2) Kostümauswahl → (3) Zusammenfassung + Bestätigung.

**Step-Keys (Implementierung):**

| Step | Key | Label |
|---|---|---|
| 1 | `personalien` | Kontaktdaten des Ausleihnehmers |
| 2 | `auswahl` | Kostüme auswählen (aus Merkliste/Scan/manuell) |
| 3 | `zusammenfassung` | Ausleihliste + Bestätigung |

### Schritt 1: Ausleih-Quelle wählen

**Ausleih-Quelle Karte** (Radio-Select, 341x80px):

```css
.ausleih-source-card {
  width: 341px;
  height: 80px;
  border: 1px solid var(--secondary-800);
  border-radius: var(--radius-md); /* 12px */
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  background: #FFFFFF;
}
.ausleih-source-card--selected {
  background: var(--secondary-500);
}
/* Radio-Dot: 30x30px Kreis, secondary-700, border 2px oder 10px (selected) */
```

**Scan-Screen (QR/Barcode):**
Vollbild-Kamera (`375x652px`), schwarzer Boden (`#080808`) mit weissem Scan-Rahmen (58x58px, `border: 3px solid #FFFFFF`), Kostüm-Stapel-Thumbnail rechts (3 gestapelte Bilder), Badge `primary-900` mit Anzahl.

### Schritt 2: Kostüme wählen (Merkliste)

**Merklisten-Auswahl** (325x80px pro Item):

```css
.wishlist-item {
  width: 325px;
  height: 80px;
  border: 1px solid var(--secondary-700);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}
.wishlist-item--selected { background: var(--secondary-500); }
.wishlist-item__thumbnail {
  width: 50px; height: 67px;
  border-radius: 10px;
  object-fit: cover;
}
```

### Schritt 3: Ausleihliste

**Ausleihliste Header:**

| Element | Stil |
|---|---|
| Ausleih-Nr. | Subtitle-1-medium, 16px, `neutral-grey-700` |
| Kontaktkarte | Gleiche Optik wie Anfrage-Kontaktkarte (Schritt 2) |
| Telefon-Pill | `tertiary-600` (#E4EEF5) Background |

**Kostüm-Status-Dropdown:**

```css
.status-dropdown {
  width: 115px;
  height: 40px;
  border: 1px solid var(--neutral-grey-300);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}
/* Status-Dot 10x10px + Status-Text 12px + Dropdown-Arrow 12x12px */
```

**Status-Dot Farbe:** `color-error` (#FF525A) = Standard, plus `accent-01`, `color-warning` je nach Status.

**"Alle Status ändern":** Subtitle-2-medium, 14px + Status-Dropdown links davon.

**"Alle löschen":** Subtitle-2-medium, 14px, underline, rechts.

**Ausleihliste Button:** `btn-ausleihen`-Optik: "Ausleihe erstellen →", 341x60px, `primary-900`.

### Daten-Struktur

```typescript
interface Ausleihe {
  id: string;             // z.B. "Ausleih-Nr. 246"
  contact: {
    name: string;
    role: string;
    institution: string;
    phone: string;
    email: string;
    avatarUrl: string;
  };
  purpose: string;
  dateFrom: Date;
  dateTo: Date;
  kostueme: {
    id: string;
    name: string;
    imageUrl: string;
    production: string;
    status: 'nicht-versendet' | 'versendet' | 'zurueckgegeben';
  }[];
}
```

---

## 14. Modul Nachrichten

**Route:** `/messages`

### Übersicht
Nachrichten-Inbox mit Chat-Liste, Suchfeld oben, Absender-Avatare mit Badge.

### Layout-Struktur (Mobile)

```
Nachrichten          (Seitentitel)
Nachrichten          (Abschnittstitel, Body-2-medium, 18px)
[ Q Suchen                      ]   ← Search-Input
─────────────────────────────────
[Avatar] Südpol Fundus    15:55   ← Ungelesen (Badge)
         Liebe Alma, danke...
─────────────────────────────────
[Avatar] SRF Fundus       14:22   ← Ungelesen (Badge)
         Hi Alma, die Artischocke...
─────────────────────────────────
[Avatar] Finja Fundusleitung 10:00
         Hey Alma...
...
```

### Komponente: Nachrichten-List-Item

| Eigenschaft | Wert |
|---|---|
| Avatar | 45x45px, `border-radius: 50%` — Implementierung nutzt einheitlich rund für alle Thread-Typen |
| Badge (ungelesen) | 21x21px Kreis, `#000000` BG, weisse Zahl Label-1-medium 12px, oben rechts am Avatar |
| Absender | Subtitle-1-medium, 16px, `#000000` |
| Preview | Subtitle-2-regular, 14px, `neutral-grey-500` |
| Zeitstempel | Label-1-regular, 12px, `neutral-grey-400` |
| Trennlinie | `1px solid neutral-grey-300`, 279px, ab Avatar-Rand |

```css
.message-list-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  position: relative;
}
.message-list-item__avatar {
  width: 45px; height: 45px;
  border-radius: 4px;
  flex-shrink: 0;
  position: relative;
}
.message-list-item__badge {
  position: absolute;
  top: -6px; right: -6px;
  width: 21px; height: 21px;
  background: #000000;
  border: 1px solid #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: var(--font-weight-500);
  color: #FFFFFF;
}
.message-list-item__content {
  flex: 1;
}
.message-list-item__sender {
  font-size: 16px;
  font-weight: var(--font-weight-500);
  color: #000000;
}
.message-list-item__preview {
  font-size: 14px;
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.message-list-item__time {
  font-size: 12px;
  font-weight: var(--font-weight-400);
  color: var(--neutral-grey-400);
}
.message-list-item__divider {
  position: absolute;
  bottom: 0;
  left: 61px; /* nach Avatar */
  width: 279px;
  border-top: 1px solid var(--neutral-grey-300);
}
```

### Daten-Struktur

```typescript
interface MessageThread {
  id: string;
  sender: string;
  avatarUrl: string;
  isInstitution: boolean;   // Bestimmt border-radius (4px vs 50%)
  preview: string;
  timestamp: string;        // z.B. "15:55", "Dienstag", "20.11.23"
  unreadCount?: number;     // Badge-Zahl
}
```

---

---

## 15. Suchmodus Cockpit

**Route:** `/suchmodus`

### Übersicht
Landing-Page des Suchmodus. Vollbild-Hero mit Filter-Bar, Kategorie-Grid (Gender-Kacheln), horizontal scrollende Category Tiles, CTA-Karte, Netzwerk-Ovals, Footer.

### Layout-Struktur

```
+--------------------------------------------------+
|  Header (sticky, 80px / Mobile: 70px)            |
+--------------------------------------------------+
|  Hero (668px / Mobile: 400px)                    |
|    [ Kostüm finden | ⊙ Standort | ⊙ Suche ]      |  ← Filter Bar
|    Grosse Titel-Überschrift                       |
+--------------------------------------------------+
|  Gender-Grid (3 Spalten / Mobile: 2 Spalten)     |
|  Category Tiles (horizontal scroll Mobile)       |
|  CTA-Event-Karte                                 |
|  Netzwerk-Ovals                                  |
|  Footer                                          |
+--------------------------------------------------+
```

### Header

| Eigenschaft | Wert |
|---|---|
| Höhe Desktop | 80px |
| Höhe Mobile | 70px |
| Position | sticky, top: 0, z-index: 50 |
| Shadow | `0px 1px 10px rgba(0,0,0,0.20)` |
| Padding | `0 20px` |
| Icons rechts | 45×45px Hitbox je Icon |

### Hero

| Eigenschaft | Wert |
|---|---|
| Höhe Desktop | 668px |
| Höhe Mobile | 400px |
| Position | `relative`, `overflow: hidden` |

#### Filter Bar

| Eigenschaft | Wert |
|---|---|
| Position Desktop | `absolute`, `top: 42px`, `left: 50%`, `transform: translateX(-50%)` |
| Position Mobile | `top: 20px`, `left/right: 16px`, `transform: none`, `width: calc(100% - 32px)` |
| Gap | 10px |
| **Filter-Button** | `height: 60px`, `padding: 0 24px`, `border-radius: 61px`, `background: primary-900`, weisser Text |
| **Standort-Button** | 60×60px Kreis, `border: 1px solid primary-900`, weisser Hintergrund → Öffnet Standort-Sheet |
| **Such-Button** | 60×60px Kreis, `border: 1px solid primary-900` |

> ⚠️ Filter Bar hat `transform` auf Desktop — Kind-Elemente mit `position: fixed` müssen via React Portal gerendert werden (siehe Standort-Sheet, Modul 21).

### Gender-Grid

| Eigenschaft | Wert |
|---|---|
| Spalten Desktop | `repeat(3, 1fr)` |
| Spalten Mobile | `repeat(2, 1fr)` |
| Gap | 12px |
| Kachel-Höhe | 140px |
| Border | `1px solid secondary-900` |
| Border-radius | `var(--radius-md)` |
| Padding-bottom | 14px |
| Gap innen | 8px |
| Label | `font-size: var(--font-size-300)`, `font-weight: var(--font-weight-500)` |

### Category Tiles

| Eigenschaft | Desktop | Mobile |
|---|---|---|
| Layout | `display: flex`, `gap: 30px` | `overflow-x: auto`, `scroll-snap-type: x mandatory`, `gap: 12px`, `padding: 0 16px` |
| Kachel-Breite | `flex: 1` (fluid) | `60vw` |
| Kachel-Höhe | 430px | 270px |
| Border-radius | `var(--radius-card)` (20px) | idem |
| Scroll-Snap | — | `scroll-snap-align: start` |

### Section-Abstände

| Klasse | Desktop | Mobile |
|---|---|---|
| `.sectionPadded` | `60px 67px` | `40px 16px` |
| `.sectionPaddedBottom` | `0 67px 60px` | `0 0 40px` |
| `.sectionTitleWrap` | `margin-bottom: 32px` | `padding: 0 16px`, `margin-bottom: 20px` |
| Titel | `var(--font-size-800)`, `font-weight-500`, `neutral-grey-600` | idem |

### Netzwerk-Ovals

| Eigenschaft | Desktop | Mobile |
|---|---|---|
| Grösse | 255×381px | 120×179px |
| Border-radius | 166px | 78px |
| Gap | 32px | idem |

---

## 16. Suchmodus Filter-Overlay

**Route:** `/suchmodus/filter`
**Typ:** Vollbild-Seite (Mobile), keine Overlay-Schicht

### Layout

```
+------------------------------------------+
|  Header (sticky, 70px)                   |
|  [Filter-Icon] Kostümfilter  [X]         |
+------------------------------------------+
|  Body (scrollbar, padding: 24px 16px 120px) |
|  Sektionen mit je einem Badge-Pill        |
+------------------------------------------+
|  Footer (fixed, bottom, 2 Buttons)       |
|  [Zurücksetzen]  [Filter anwenden ——>]   |
+------------------------------------------+
```

### Header

| Eigenschaft | Wert |
|---|---|
| Höhe | 70px |
| Position | sticky, top: 0, z-index: 40 |
| Shadow | `0px 1px 10px rgba(0,0,0,0.12)` |
| Padding | `0 16px` |
| Close-Button | 46×46px |

### Sektion-Badge

| Eigenschaft | Wert |
|---|---|
| Background | `var(--neutral-black)` |
| Border-radius | 49px |
| Padding | `3px 15px` |
| Font | `var(--font-size-300)`, `font-weight-400`, `neutral-white` |

### Gender-Kacheln

| Eigenschaft | Wert |
|---|---|
| Grid | `1fr 1fr`, `gap: 12px` |
| Höhe | 93px |
| Border | `1px solid secondary-700` |
| Border-radius | `var(--radius-sm)` |
| Selected | `background: secondary-500`, `border-color: secondary-800` |

### Chips

| Eigenschaft | Wert |
|---|---|
| Höhe | 36px |
| Padding | `0 16px` |
| Border | `1px solid secondary-700` |
| Border-radius | `var(--radius-full)` |
| Font | `var(--font-size-200)`, `font-weight-500`, `secondary-700` |
| Selected | `background: secondary-800`, `color: neutral-white` |

### Sticky Footer (Filter-Buttons)

| Eigenschaft | Wert |
|---|---|
| Position | `fixed`, `bottom: 0`, `left/right: 0` |
| Padding | `12px 16px 28px` |
| Shadow | `0px -2px 12px rgba(0,0,0,0.10)` |
| Zurücksetzen | `btn-secondary` |
| Filter anwenden | `btn-primary`, `flex: 1` |

### Filter-Sektionen

| Sektion | Inhalt |
|---|---|
| Kategorie | Gender-Kacheln (2-spaltig) + Bekleidungsart-Chips + Suchfeld |
| Sparte | Chips |
| Aufführung | 4× Suchfeld (Epoche, Stücktitel, Darsteller, Rolle) |
| Regie & Assistenz | 3× Suchfeld |
| Konfektionsgrösse | International (XS–XXL) + EU (32–54 S) als Chips |
| Material | Suchfeld + Chips + Muster-Grid (3-spaltig, 80px hoch) |
| Farbe | Color Swatches 36×36px, border-radius 50%, selected: scale(1.15) |

---

## 17. Suchmodus Resultate-Grid

**Route:** `/suchmodus/results`

### Layout

```
+------------------------------------------+
|  Header (sticky)                          |
|  ← Titel (Anzahl)  [Grid/List] [Filter]  |
|  [Aktive Filter Chips, horizontal scroll] |
+------------------------------------------+
|  Grid (2 Spalten, gap: 13px)              |
|  [Karte] [Karte]                          |
|  [Karte] [Karte]                          |
+------------------------------------------+
|  Footer                                  |
+------------------------------------------+
```

### Header

| Eigenschaft | Wert |
|---|---|
| Position | sticky, top: 0, z-index: 50 |
| Shadow | `0px 1px 10px rgba(0,0,0,0.10)` |
| Header-Top-Höhe | 64px |
| Zurück-Button | 40×40px |
| Titel | `var(--font-size-500)`, `font-weight-500`, ellipsis |
| Anzahl | `var(--font-size-200)`, `font-weight-400`, `neutral-grey-400` |
| View-Toggle Buttons | 34×34px, `border-radius: 6px`, active: `background: rgba(0,0,0,0.08)` |
| Filter-Button | `height: 34px`, `padding: 0 12px`, `border-radius: 8px`, `border: 1px solid rgba(0,0,0,0.20)`, `var(--font-size-150)`, `font-weight-500` |

### Kostüm-Karte (Grid-Ansicht)

| Eigenschaft | Wert |
|---|---|
| Grid | `1fr 1fr`, `gap: 13px`, `padding: 16px` |
| Border-radius | `var(--radius-sm)` |
| Bild | `aspect-ratio: 0.688`, `object-fit: cover` |
| Bookmark-Button | 40×40px Kreis, `box-shadow: 0px 2px 6px rgba(0,0,0,0.15)` |
| Kategorie | `var(--font-size-100)`, uppercase, `letter-spacing: 0.02em`, `neutral-grey-400` |
| Name | `var(--font-size-300)`, `font-weight-500`, `neutral-black`, 2-zeilig clamp |
| Aufführung | `var(--font-size-200)`, `font-weight-400`, `neutral-grey-400` |
| Theater | `var(--font-size-75)`, `font-weight-500`, `neutral-grey-400`, ellipsis |
| Verfügbar-Dot | 16×16px, `accent-01` oder outline `neutral-grey-400` |

---

## 18. Suchmodus Kostüm-Detail

**Route:** `/suchmodus/costume/[id]`

### Layout

```
+------------------------------------------+
|  Breadcrumb-Bar (sticky, 52px)            |
|  ← [Resultate > Kostümname]              |
+------------------------------------------+
|  Bild (aspect-ratio: 340/372)            |
|  ● o o  (Pagination Dots)               |
|  Bekleidungstyp  (Label)                 |
|  Titel (H4)                              |
|  Meta: Gender | Grösse                   |
|  Beschreibung                            |
|  ✓ Verfügbar — Theatername              |
+------------------------------------------+
|  [Ausleihen] [Teilen] [Merken]           |
+------------------------------------------+
|  Spezifikationen (Accordion)             |
|  Ähnliche Kostüme (horizontal scroll)    |
+------------------------------------------+
|  Footer                                  |
+------------------------------------------+
```

### Breadcrumb-Bar

| Eigenschaft | Wert |
|---|---|
| Höhe | 52px |
| Position | sticky, top: 0, z-index: 40 |
| Shadow | `0px 1px 6px rgba(0,0,0,0.08)` |
| Font | `var(--font-size-100)`, `font-weight-400` |

### Bild-Bereich

| Eigenschaft | Wert |
|---|---|
| Aspect-ratio | `340 / 372` |
| Object-fit | cover |
| Heart-Button | 40×40px, oben rechts, `box-shadow: 0px 2px 6px rgba(0,0,0,0.15)` |
| Pagination Dots | 11×11px, border-radius 50%, aktiv: `neutral-black` fill |

### Info-Bereich

| Element | Font |
|---|---|
| Bekleidungstyp | `var(--font-size-200)`, `font-weight-400`, `neutral-grey-600` |
| Titel | `var(--font-size-700)`, `font-weight-500`, `neutral-black`, `line-height: 140%` |
| Meta-Labels | `var(--font-size-200)`, `font-weight-400` |
| Verfügbarkeit | `var(--font-size-150)`, `font-weight-500`, `neutral-grey-600` |

### Accordion (Spezifikationen)

| Eigenschaft | Wert |
|---|---|
| Titel-Label | `var(--font-size-600)`, `font-weight-500`, `neutral-grey-600` |
| Accordion-Titel | `var(--font-size-350)`, `font-weight-700` |
| Trennlinie | `1px solid neutral-black` |
| Chevron-Animation | `rotate(180deg)` wenn open, `transition: 200ms ease` |
| Feld-Label | `var(--font-size-300)`, `font-weight-700`, `neutral-black` |
| Feld-Wert | `var(--font-size-300)`, `font-weight-400`, `neutral-grey-600` |

### Ähnliche Kostüme

| Eigenschaft | Wert |
|---|---|
| Layout | horizontal scroll, `scroll-snap-type: x mandatory`, no scrollbar |
| Karte-Breite | 155px |
| Bild | 155×195px, `var(--radius-xs)` |
| Heart-Button | `background: rgba(255,255,255,0.60)`, 40×40px |

---

## 19. Suchmodus Suche

**Route:** `/suchmodus/search`

### Layout

```
+------------------------------------------+
|  [Q  Suche …  X]     [Abbrechen]         |
+------------------------------------------+
|  Suchvorschläge (Label)                  |
|  ─────────────────────────────────────   |
|  [Bild 75px] Kostüm-Titel               |
|              Aufführung                  |
|  ─────────────────────────────────────   |
|  …                                       |
+------------------------------------------+
```

### Such-Input

| Eigenschaft | Wert |
|---|---|
| Höhe | 60px |
| Border | `1px solid neutral-black` |
| Border-radius | `var(--radius-full)` |
| Padding | `0 16px`, `gap: 10px` |
| Font | `var(--font-size-300)`, `font-weight-400` |
| Placeholder | `neutral-grey-500` |
| Clear-Button | 20×20px Kreis, `border: 1px solid neutral-grey-600` |
| Cancel-Link | `var(--font-size-200)`, underline, `flex-shrink: 0` |

### Ergebnis-Liste

| Eigenschaft | Wert |
|---|---|
| Item-Höhe | min-height: 91px |
| Thumbnail | 75×75px, `border-radius: 4px` |
| Gap | 14px |
| Trennlinie | `1px solid neutral-grey-100` |
| Name | `var(--font-size-300)`, `font-weight-700`, `neutral-black` |
| Untertitel | `var(--font-size-300)`, `font-weight-400`, `neutral-black` |

---

## 20. Suchmodus Mobile Menu Drawer

**Verwendung:** Burger-Menu im Suchmodus-Header (nur Mobile < 744px)

### Trigger

| Eigenschaft | Wert |
|---|---|
| Sichtbarkeit | `display: none` (Desktop), `display: flex` (Mobile) |
| Grösse | 8px Padding, kein Border/Background |
| Icon | BurgerIcon SVG (24×24px), `fill: currentColor`, `neutral-black` |

### Overlay (Level 1)

| Eigenschaft | Wert |
|---|---|
| Position | `fixed`, `inset: 0`, `z-index: 3000` |
| Background | `var(--neutral-grey-600)` |
| Close-Button | 46×46px, oben rechts (`top: 7px, right: 7px`) |
| Content-Padding | `56px 32px 0` |

### Navigation Items

| Eigenschaft | Wert |
|---|---|
| Sektion-Label | `var(--font-size-350)`, `font-weight-700`, `neutral-grey-400` |
| Nav-Item-Höhe | 58px |
| Nav-Label | `var(--font-size-400)`, `font-weight-400`, `neutral-white` |
| Trennlinie | `1px solid rgba(255,255,255,0.2)` |

### Level 2 (Bekleidungsart)

Öffnet sich bei Klick auf eine Kategorie (z.B. "Herren"). Gleiche Optik, mit Zurück-Link:

| Eigenschaft | Wert |
|---|---|
| Zurück-Label | `var(--font-size-100)`, `font-weight-400`, `neutral-grey-300`, underline |
| Level-2-Titel | `var(--font-size-350)`, `font-weight-700`, `neutral-grey-400` |
| Inhalte | DB-gefilterte Bekleidungsarten |

### Profil-Footer

| Eigenschaft | Wert |
|---|---|
| Höhe | 95px |
| Padding | `0 32px` |
| Background | `neutral-grey-600` |
| Shadow | `0px -3px 10px rgba(0,0,0,0.25)` |
| Border-radius | `8px 8px 0 0` |
| Avatar | 60×60px Kreis, `secondary-700` |
| Name | `var(--font-size-350)`, `font-weight-500`, `neutral-white` |

---

## 21. Standort-Sheet

**Verwendung:** Trigger im Suchmodus Filter-Bar → Bottom Sheet zur Theater-Auswahl

> ⚠️ Wird via `ReactDOM.createPortal` in `document.body` gerendert, da der Parent `.heroFilterBar` `transform: translateX(-50%)` hat, was `position: fixed` bricht.

### Trigger-Button

| Eigenschaft | Wert |
|---|---|
| Grösse | 60×60px |
| Border | `1px solid var(--primary-900)` |
| Border-radius | `var(--radius-full)` |
| Background | `neutral-white` |

### Backdrop

| Eigenschaft | Wert |
|---|---|
| Position | `fixed`, `inset: 0`, `z-index: 2000` |
| Background | `rgba(36, 39, 39, 0.80)` |

### Sheet

| Eigenschaft | Wert |
|---|---|
| Position | `fixed`, `bottom: 0`, `left/right: 0`, `z-index: 2001` |
| Border-radius | `var(--radius-card) var(--radius-card) 0 0` |
| Shadow | `0px -2px 20px rgba(0,0,0,0.2)` |
| Padding | `28px 16px 40px` |

### Theater-Zeilen

| Eigenschaft | Wert |
|---|---|
| Höhe | 64px |
| Padding | `0 16px` |
| Border-radius | `var(--radius-sm)` |
| Default | `border: 1px solid neutral-grey-600` |
| Selected | `background: secondary-500`, `border-color: secondary-700` |
| Theater-Name | `var(--font-size-350)`, `font-weight-700` |
| Checkbox | 22×22px, `border: 2px solid secondary-800`, `var(--radius-xs)`, filled wenn selected |

### Toggle (Alle Standorte)

| Eigenschaft | Wert |
|---|---|
| Schalter | 50×28px, `border-radius: var(--radius-full)` |
| Off | `background: secondary-500` |
| On | `background: secondary-800` |
| Thumb | 22×22px, weiss, `left: 3px` → `calc(100% - 25px)` |
| Animation | `transition: background/left 150ms ease` |

### Save-Button

`btn-primary`, `width: 100%`

---

## 22. Cockpit Mobile-Layout (Drawer)

**Verwendung:** Burger-Menu im App-Cockpit (Hauptbereich, Mobile < 744px)

> Funktional identisch mit Modul 20 (Suchmodus Mobile Menu Drawer), aber separate Implementierung für den Cockpit-Kontext.

### Unterschiede zu Modul 20

| Eigenschaft | Cockpit (22) | Suchmodus (20) |
|---|---|---|
| Burger-Button sichtbar | immer (`display: flex`) | nur Mobile (`display: none` Desktop) |
| Nav-Item-Trennlinie | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.2)` |
| Divider-Margin | `20px 0 16px` | `16px 0` |
| Avatar Grösse | 50×50px | 60×60px |
| Profil-Label Font | `var(--font-size-300)` | `var(--font-size-350)` |
| Logout-Button | vorhanden (`var(--font-size-200)`, underline, `neutral-grey-400`) | kein Logout |

### Overlay & Content

Identisch mit Modul 20:
- Position: `fixed`, `inset: 0`, `z-index: 3000`, `background: neutral-grey-600`
- Content-Padding: `56px 32px 0`
- Close-Button: 46×46px, `top: 7px right: 7px`

---

*Stand: Alle Module dokumentiert (Suchmodus vollständig) — palco+ / costumanu*

