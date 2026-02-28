# kostüm+ Implementation Plan

> Based on Figma mockups (48 pages) vs. current codebase state.
> Created: 2026-02-23

---

## Current State vs. Figma Target

| Area | Current State | Figma Requires |
|------|--------------|----------------|
| Homepage | Static/hardcoded data, placeholder images | **Dynamic from DB**: real counts, real images, real events, real partners |
| SiteHeader | Simple icons, hamburger does nothing | Hamburger opens full nav, icons link to real pages, cart badge |
| SiteFooter | Hardcoded links, flat layout | Arrow-style links ("→"), matches Figma footer design |
| Fundus (internal) | Basic list + create form | Visual polish to match Figma card style |
| Navigation Menu | Not built (hamburger is a dead button) | Full-screen hamburger with 3-level category drill-down |
| Location Filter | Not built | Theater selection modal |
| Filter Panel | Not built | Comprehensive filter (gender, type, epoch, sizes, material, colors) |
| Search | UI-only shell (no functionality) | Full-text search with live suggestions + thumbnails |
| Results / Marketplace | Not built | 2-column grid with add-to-wishlist actions |
| Costume Detail | Not built | Rich detail page with all specs, actions, similar costumes |
| Merkliste (Wishlist) | Basic CRUD (name only, no items) | Full redesign: items, sharing, selection mode, actions menu |
| Interne Ausleihe (Rental) | Not built | 3-step wizard (Personalien → Auswahl → Ausleihe) |
| Barcode Scanner | Not built | Camera-based label scanning (Capacitor) |
| Nachrichten (Messages) | Not built | Chat thread list with search |
| Profil | Not built | "Mein Profil" in menu |

---

## Phase 0 — Update Existing Pages (Static → Dynamic)

Everything currently built uses hardcoded data from `src/lib/constants/homepage-data.ts` and placeholder `<div>` elements instead of real images. This phase converts all existing pages to load real data from Supabase.

### 0.1: Homepage — Make Dynamic (Figma page 03)

**Current problems:**
- `GenderGrid` — hardcoded 6 categories with fake counts (4520, 3870...) from `homepage-data.ts`
- `ClothingTypeSection` — hardcoded 2 items (Kleider, Anzug) with fake tags
- `EventBanner` — hardcoded single event ("Rampenverkauf Südpol Luzern")
- `HorizontalCardRow` (Epochen/Sparten/Uniformen) — all hardcoded arrays
- `NetworkSection` — hardcoded 6 partner names with placeholder initials instead of logos
- `SearchBar` — renders an input but does nothing on submit
- All images are placeholder `<div>` gradients — no actual `<img>` tags

**What to change:**

| Component | Currently | Should Load From |
|-----------|----------|-----------------|
| `GenderGrid` | `homepage-data.ts` → 6 items with fake counts | `taxonomy_terms` (vocabulary='gender') + COUNT of costumes per gender via Supabase query |
| `ClothingTypeSection` | `homepage-data.ts` → 2 hardcoded types | `taxonomy_terms` (vocabulary='clothing_type', parent_id IS NULL) + child terms as tags |
| `EventBanner` | `homepage-data.ts` → single hardcoded event | `events` table (is_published=true, ordered by event_date DESC, LIMIT 1), image from Supabase Storage |
| `HorizontalCardRow` Epochen | `homepage-data.ts` → 8 epochs | `taxonomy_terms` (vocabulary='epoche') with representative costume images |
| `HorizontalCardRow` Sparte | `homepage-data.ts` → 6 sparten | `taxonomy_terms` (vocabulary='sparte') — **needs DB seed if vocabulary doesn't exist yet** |
| `HorizontalCardRow` Uniformen | `homepage-data.ts` → 5 uniforms | Subset of `taxonomy_terms` (clothing types tagged as uniform category) or dedicated vocabulary |
| `NetworkSection` | `homepage-data.ts` → 6 partners | `theaters` table (all public/partner theaters), with logos from storage or theater settings |
| `SearchBar` | Static input, no `onSubmit` | Navigate to `/suche?q=...` or open search overlay on focus |

**Files to modify:**
- `src/app/page.tsx` — convert to async server component, fetch all data via Supabase server client
- `src/components/homepage/gender-grid.tsx` — accept props instead of importing constants; show real costume count; each card links to `/ergebnisse?gender=...`
- `src/components/homepage/clothing-type-section.tsx` — accept props; load real sub-type tags; real images from `costume_media`; link to results
- `src/components/homepage/event-banner.tsx` — accept props; load real event image from Supabase Storage
- `src/components/homepage/horizontal-card-row.tsx` — accept props with real images (signed URLs); each card links to filtered results
- `src/components/homepage/network-section.tsx` — accept props; show real theater logos
- `src/components/homepage/search-bar.tsx` — wire up navigation to `/suche?q=...`
- `src/lib/constants/homepage-data.ts` — **can be deleted** once all components use DB data (keep footer links as they are static)

**Data fetching pattern:**
```
// src/app/page.tsx (server component)
const supabase = await createClient();
const [genders, clothingTypes, epochs, events, theaters] = await Promise.all([
  supabase.from('taxonomy_terms').select('*').eq('vocabulary', 'gender'),
  supabase.from('taxonomy_terms').select('*').eq('vocabulary', 'clothing_type').is('parent_id', null),
  supabase.from('taxonomy_terms').select('*').eq('vocabulary', 'epoche'),
  supabase.from('events').select('*').eq('is_published', true).order('event_date', { ascending: false }).limit(1),
  supabase.from('theaters').select('id, name, slug, settings'),
]);
// Pass as props to each component
```

### 0.2: SiteHeader — Wire Up Navigation (Figma page 03 header + page 07)

**Current problems:**
- Hamburger button does nothing (`<Button>` with no onClick/link)
- Chat icon has no link
- ShoppingBag icon has no link
- No notification badges on any icon
- Logo "kostüm+" is plain text, should link to `/`

**What to change:**
- Hamburger → triggers navigation menu overlay (Phase 1, but prepare the state hook now)
- Chat icon → `<Link href="/nachrichten">`
- Heart icon → already links to `/merkliste` ✓
- ShoppingBag icon → `<Link href="/ausleihe">` with badge showing `cart_items` count
- Fundus icon → already links to `/fundus` ✓
- Logo → `<Link href="/">`
- Convert to client component (needs state for menu open/close + cart badge query)

**Files to modify:**
- `src/components/layout/site-header.tsx`

### 0.3: SiteFooter — Match Figma Design (Figma page 03 footer)

**Current:** Flat list of text links centered.
**Figma shows:** Dark footer with "kostüm+" heading, then rows with arrow links:
- "Häufige Fragen →"
- "Ausleihe & Abholung →"
- "Support & Kontakt →"
- Bottom: "© Kostüm+ | Impressum | Datenschutz"

**What to change:**
- Restructure footer layout to match Figma (left-aligned links with "→" arrows)
- Update link labels to match Figma text exactly
- Update copyright line format

**Files to modify:**
- `src/components/layout/site-footer.tsx`
- `src/lib/constants/homepage-data.ts` — update `footerLinks` array

### 0.4: Fundus Page — Visual Polish

**Current:** Basic list with horizontal cards (thumbnail + text).
**Figma doesn't show a dedicated Fundus management screen** (it focuses on the public marketplace), but the existing internal view should match the overall design language.

**What to change:**
- Update `CostumeCard` in `fundus-client.tsx` to use the same card style as the results grid (page 17): image on top, text below, "+" action
- Cards should link to `/kostuem/[id]` (costume detail page, Phase 3)
- Add filter/sort options at top
- Improve empty state

**Files to modify:**
- `src/components/fundus/fundus-client.tsx`
- `src/app/fundus/page.tsx` — minor layout updates

### 0.5: Login Page — No Major Changes

The login page isn't shown in the Figma mocks. Current implementation is functional. **No changes needed** unless a design is provided later.

---

## Phase 1 — Core Navigation & Layout (Foundation)

### Screen 1.1: Hamburger Menu (Figma pages 07-09)

**Route:** Overlay/drawer on all pages

**What to build:**
- Full-screen dark overlay menu triggered by hamburger icon
- Two sections: **Kostüme** (Damen, Herren, Unisex, Kinder, Tiere, Fantasy — from `taxonomy_terms` where vocabulary=gender) and **Netzwerk & Support** (Nachrichten, Kostümanfragen, Netzwerk, Support)
- "Mein Profil" bar at bottom with user avatar
- Sub-navigation: tapping a gender → shows clothing types (Bekleidungsart) for that gender (e.g., Herren → Anzüge, Hosen, Hemden...)
- Sub-sub-navigation: tapping a clothing type → shows sub-types (e.g., Hosen → Bermudashorts, Chinohose, Schlaghose...)
- Each terminal item navigates to results page with those filters pre-applied
- Back breadcrumbs ("← Übersicht", "← Bekleidungsart") and X close button

**Files to create/modify:**
- `src/components/layout/navigation-menu.tsx` — new client component
- `src/components/layout/site-header.tsx` — wire up hamburger trigger
- Data: Query `taxonomy_terms` by vocabulary + parent_id hierarchy

### Screen 1.2: Location Filter (Figma pages 04-05)

**Route:** Modal/bottom-sheet, accessible from header or search

**What to build:**
- "Standorte durchsuchen" modal
- List of theaters (from `theaters` table where user has public access or membership)
- Checkbox per theater (multi-select)
- "Alle Standorte durchsuchen" toggle switch
- "speichern & schliessen" gold button
- Persist selection in URL params or local state/context

**Files to create:**
- `src/components/layout/location-filter.tsx`

---

## Phase 2 — Search & Filter (Discovery Engine)

### Screen 2.1: Search Input & Suggestions (Figma pages 13-15)

**Route:** `/suche` or overlay from search bar tap

**What to build:**
- Full-screen search overlay with "Abbrechen" (cancel) link
- Large search input with magnifying glass icon
- As-you-type "Suchvorschläge" (suggestions) using the `fts_doc` GIN index on `costumes`
- Each suggestion shows: thumbnail, **bold** matched keyword, costume name, epoch, production title + year
- Tapping a suggestion navigates to results or directly to costume detail

**Files to create:**
- `src/app/suche/page.tsx` — search page
- `src/components/suche/search-overlay.tsx` — search UI client component
- Supabase query: `costumes` with `.textSearch('fts_doc', query)` + joins for media/provenance

### Screen 2.2: Filter Panel (Figma pages 10-12)

**Route:** Slide-in panel from results page

**What to build (top to bottom per Figma):**
1. **Kategorie** — Gender icons (same 6 as homepage), "Filter anwenden" gold button
2. **Bekleidungsart** — Tag chips (Anzüge, Hosen, Möbel, Dirndl, Uniformen...)
3. **Bekleidungstyp** — Search within type, sub-type tags (Jumpsuit, Leggings, Kurzarm, Ohren)
4. **"Nur Serien anzeigen"** toggle — filters `costumes.is_ensemble = true`
5. **Sparte** — Checkboxes: Film, Schauspiel, Oper, Akademie
6. **Epoche** — Text input: "20-er Jahre"
7. **Production details** — Inputs: Stücktitel, Darsteller, Darstellerin, Regisseur, Kostümbildner, Kostümassistent
8. **Masse (Sizes):**
   - International sizes: XS, S, M, L, XL, XXL (toggle buttons)
   - EU sizes grid: S 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52 & 54
   - Body measurements with range sliders:
     - Oberkörper: Brustumfang (0-150), Rückenlänge (0-100), Schulterbreite (0-100), Taillenumfang (0-100), Hüftumfang (0-75)
     - Unterkörper: Beinlänge (0-100), Schrittlänge (0-100), Oberschenkelweite (0-100), Wadenweite (0-100)
9. **Material** — Searchable multi-select with visual icons: Seide, Tüll, Polyester, Filz, Canvas, Chiffon, Denim, Leinen, Leder, Spitze, Wolle, Kaschmir, Floral, Genadelt, Gepaddet, Geschnürt, Anderes, Verlauf
10. **Farbe (Color)** — Color circle swatches: Beige, Rose, Braun, Schwarz, Blau, Grau, Transparent, Rot, Weiss, Grün, Multicolor

**Files to create:**
- `src/components/suche/filter-panel.tsx` — main client component
- `src/components/suche/filter-sections/` — sub-components per filter section
- Shadcn additions needed: `Slider`, `Switch`, `Checkbox`, `ToggleGroup`, `Sheet` (side panel)

---

## Phase 3 — Marketplace Results & Costume Detail

### Screen 3.1: Results Grid (Figma pages 17-18)

**Route:** `/ergebnisse` or `/kostueme/[gender]/[type]`

**What to build:**
- Header: "Jumpsuits & Overall Herren" (dynamic from filters) + result count ("9873 Kostüme")
- "KostümFilter" button (opens filter panel)
- Filter chips at top (e.g., "Herren", "Anfragen") — removable
- 2-column responsive grid of costume cards
- Each card shows:
  - Costume image (from `costume_media`)
  - "+" button overlay (top-right) → opens "Add to Merkliste" sheet
  - Costume name (bold first word matching search)
  - Production title + year
  - Epoch badge
  - Theater location badge (icon + name)
- Infinite scroll or pagination
- Footer

**Files to create:**
- `src/app/ergebnisse/page.tsx` — server component with search params
- `src/components/ergebnisse/results-client.tsx` — client component
- `src/components/ergebnisse/costume-card.tsx` — reusable card

### Screen 3.2: Costume Detail Page (Figma page 19)

**Route:** `/kostuem/[id]`

**What to build (top to bottom per Figma):**
1. **Breadcrumbs**: Zurück > Herren > Hosen > Jumpsuit
2. **Image carousel**: Dots indicator, swipeable photos
3. **Title block**: Clothing type badge, costume name, "Konfektionsgrösse M"
4. **Description text**
5. **Tags**: Herren, Mehrteilig, Serie
6. **Theater badge**: "Bühne Bern"
7. **Action buttons**:
   - "Ausleihen" (gold, primary) — starts rental flow
   - "Teilen" (outline) — share
   - "Merken" (outline) — add to wishlist
8. **Kostümspezifikationen** (collapsible sections):
   - Gender/Typ, Epoche, Segment, Bekleidungsart, Bekleidungstyp
   - Aufführung: Stücktitel, Darsteller, Rolle, Regie, Kostümbildner, Kostümassistent
   - Material, Materialart, Materialoptik, Muster, Farbrichtung (color dots)
   - Waschanleitung
9. **Masse**: Konfektionsgrösse, Rückenlänge, Taillenumfang, Brustumfang, Hüftumfang
10. **Standort**: Bühne Bern address, Platzierung (Stockwerk, Regal, Sektor)
11. **Status**: Current location/availability
12. **ID & Infos**: Barcode ID, RFID, QR-Code (with copy icons)
13. **Kostümteile**: Linked sub-costumes (e.g., "Grüner Mantel mit rotem Innenfutter")
14. **Ähnliche Kostüme**: Horizontal scroll of similar costumes
15. **Historie**: Timeline of provenance/rental history

**Files to create:**
- `src/app/kostuem/[id]/page.tsx` — server component
- `src/components/kostuem/costume-detail-client.tsx`
- `src/components/kostuem/image-carousel.tsx`
- `src/components/kostuem/costume-specs.tsx`
- `src/components/kostuem/similar-costumes.tsx`
- Shadcn additions: `Carousel`, `Collapsible`/`Accordion`, `Tabs`

---

## Phase 4 — Merkliste (Wishlist) Redesign

### Screen 4.1: Merkliste Overview (Figma page 26)

**Route:** `/merkliste` (replace existing page)

**What to build:**
- "Meine Merklisten" heading with 3-dot menu
- Search bar "Merklisten durchsuchen"
- List of wishlists, each showing: thumbnail (first costume image), name, ">" chevron
- "Neue Merkliste erstellen" gold button with "+" icon
- Tapping a wishlist → navigates to detail

### Screen 4.2: Add to Merkliste (Figma pages 21-22)

**Route:** Bottom sheet (triggered from costume detail or results page)

**What to build:**
- "Zur Merkliste hinzufügen" bottom sheet
- Search "Merklisten durchsuchen"
- List of user's wishlists with thumbnails
- "Neue Merkliste erstellen" inline option
- Tapping "Neue Merkliste erstellen" → inline modal: name input + "Speichern"
- After adding, costume appears with "gemerkt" badge on image

### Screen 4.3: Merkliste Detail (Figma pages 27-28)

**Route:** `/merkliste/[id]`

**What to build:**
- "← Übersicht" back link
- Wishlist name as heading ("Der Kleine Prinz 2024")
- "Alle Auswählen" / "Auswählen" toggle buttons
- List of costume items, each showing:
  - Thumbnail
  - ID badge (e.g., "ID-123456780 / Jumpsuit")
  - Costume name (bold)
  - Production title + year
  - Epoch
  - Theater badge with green check icon
- Selection mode: checkboxes appear on each item

### Screen 4.4: Merkliste Actions Menu (Figma page 30)

**Route:** Bottom sheet from 3-dot menu on merkliste detail

**Options:**
- Auswahl erstellen (create selection)
- Merkliste anfragen (request entire wishlist)
- Merkliste teilen (share)
- Drucken (print)
- Umbenennen (rename)
- Löschen (delete)
- Archivieren (archive)
- Schliessen (close)

### Screen 4.5: Merkliste Sharing (Figma page 29)

**Route:** Bottom sheet from "Merkliste teilen"

**What to build:**
- "Mitwirkende einladen" modal
- Search input
- "Merkliste geteilt mit" section showing current collaborators
- "Merkliste teilen" section listing other theater members
- Uses `wishlist_collaborators` table

### Screen 4.6: Merkliste Selection Mode (Figma page 31)

**What to build:**
- Items with checkboxes (multi-select)
- Bottom action bar: "Ausleihen" button (gold) + trash icon
- Selected items can be sent to rental flow or deleted

**Files to create/modify:**
- `src/app/merkliste/page.tsx` — rewrite
- `src/app/merkliste/[id]/page.tsx` — new detail page
- `src/components/merkliste/merkliste-overview.tsx`
- `src/components/merkliste/merkliste-detail.tsx`
- `src/components/merkliste/add-to-merkliste-sheet.tsx`
- `src/components/merkliste/merkliste-actions-menu.tsx`
- `src/components/merkliste/share-merkliste-sheet.tsx`
- Shadcn additions: `Sheet` (bottom sheet), `Dialog`

---

## Phase 5 — Interne Ausleihe (Internal Rental Flow)

### Screen 5.1: Anfragen & Ausleihen Overview (Figma page 33)

**Route:** `/ausleihe`

**What to build:**
- "Anfragen & Ausleihen" heading with 3-dot menu
- "Externe Fundis anfragen" — horizontal cards of other theaters (with notification badges)
- "Kostüme [Theater Name]" — list of own-theater costumes in cart/pending
  - Each item: thumbnail, ID, type, name, production, epoch, theater badge, green check, trash
- "Ausleihe erfassen" gold button → starts wizard
- "Anfragen" outline button → sends inquiry message

### Screen 5.2: Rental Wizard — Step 1: Personalien (Figma pages 34-35)

**Route:** `/ausleihe/neu` (step 1)

**What to build:**
- 3-step progress indicator (Personalien → Auswahl → Ausleihe)
- "Meine Personalien" card: avatar, name, title, theater, phone, email (from `profiles` + `theaters`)
- "Verwendungszweck" textarea (purpose of rental)
- "Ausleihdauer" date range picker (from-to)
- "Nächster Schritt →" gold button

### Screen 5.3: Rental Wizard — Step 2: Auswahl (Figma pages 36-37, 47)

**Route:** `/ausleihe/neu` (step 2)

**What to build:**
- "Wähle die Kostüm-Quelle aus, um Kostüme zur Ausleihe hinzuzufügen"
- 4 radio options:
  1. Kostümauswahl aus Warenkorb hinzufügen (from cart)
  2. Merkliste zur Ausleihe hinzufügen (from wishlist → shows wishlist picker, pages 43-44)
  3. Etiketten scannen (barcode scan → pages 38-39)
  4. Kostüme manuell erfassen (manual entry)
- "Kostüme wählen →" gold button

### Screen 5.4: Barcode Scanner (Figma pages 38-39)

**What to build:**
- Camera viewfinder (Capacitor Camera/Barcode plugin)
- Scans QR/barcode, shows detected code overlay
- "Weiter scannen" / "Weiter" buttons
- Maps scanned barcode to `costume_items.barcode_id`
- For web: fallback to manual barcode input

### Screen 5.5: Rental Wizard — Step 3: Ausleihe Summary (Figma pages 40, 45)

**Route:** `/ausleihe/neu` (step 3)

**What to build:**
- "Kostüm Ausleihe" heading with Ausleihe-Nr
- 3-dot menu
- User card (same as step 1)
- Verwendungszweck + Ausleihdauer summary
- "Ausleihliste" with all selected costumes
  - "Alle Status ändern" / "Alle löschen" bulk actions
  - Each item: thumbnail, ID, name, production, epoch, status badge ("Probation"), theater
- "Ausleihe erstellen" gold button → creates `rental_order` + `item_reservations`

### Screen 5.6: Success Confirmation (Figma page 46)

- Green checkmark circle
- "Ausleihe erfolgreich erfasst."
- "Zur Startseite" gold button → navigates to `/`

**Files to create:**
- `src/app/ausleihe/page.tsx` — overview
- `src/app/ausleihe/neu/page.tsx` — wizard
- `src/components/ausleihe/rental-wizard.tsx` — multi-step client component
- `src/components/ausleihe/step-personalien.tsx`
- `src/components/ausleihe/step-auswahl.tsx`
- `src/components/ausleihe/step-summary.tsx`
- `src/components/ausleihe/barcode-scanner.tsx`
- `src/components/ausleihe/rental-success.tsx`

---

## Phase 6 — Nachrichten (Messages)

### Screen 6.1: Messages List (Figma page 48)

**Route:** `/nachrichten`

**What to build:**
- "Nachrichten" heading
- Search bar "Suchen"
- Thread list, each showing:
  - Avatar (user or theater logo)
  - Unread count badge (gold circle with number)
  - Name (bold if unread)
  - Message preview (truncated)
  - Timestamp (time or date)
- Tapping a thread → chat detail (not in mocks, but implied by DB schema)

**Files to create:**
- `src/app/nachrichten/page.tsx`
- `src/components/nachrichten/thread-list.tsx`
- (Future) `src/app/nachrichten/[threadId]/page.tsx` — chat detail
- Uses `chat_threads`, `chat_messages`, `chat_thread_participants` tables

---

## Phase 7 — Profile & Supporting Screens

### Screen 7.1: Mein Profil

**Route:** `/profil`

**What to build:**
- User avatar, name, professional title, theater
- Phone + email display/edit
- Links: edit profile, manage theaters
- Uses `profiles` table

---

## Recommended Build Order

| Step | Feature | Priority | Depends On | Figma Pages |
|------|---------|----------|------------|-------------|
| 0a | **Homepage: static → dynamic data** | P0 | — | 03 |
| 0b | **SiteHeader: wire up nav + links** | P0 | — | 03 header |
| 0c | **SiteFooter: match Figma layout** | P0 | — | 03 footer |
| 0d | **Fundus: visual polish + card links** | P1 | — | — |
| 1 | **Hamburger Navigation Menu** | P0 | #0b | 07-09 |
| 2 | **Costume Detail Page** | P0 | — | 19, 24 |
| 3 | **Results Grid / Marketplace** | P0 | #2 | 17-18 |
| 4 | **Search with Suggestions** | P0 | #3 | 14-15 |
| 5 | **Filter Panel** | P1 | #3 | 11-12 |
| 6 | **Location Filter** | P1 | #3 | 05 |
| 7 | **Merkliste Redesign** (overview + detail + items) | P0 | #2 | 26-28 |
| 8 | **Add to Merkliste Sheet** | P0 | #7 | 21-22 |
| 9 | **Merkliste Actions & Sharing** | P1 | #7 | 29-31 |
| 10 | **Ausleihe Overview** | P1 | #7 | 33 |
| 11 | **Rental Wizard (3 steps)** | P1 | #10 | 34-40, 43-47 |
| 12 | **Barcode Scanner** | P2 | #11 + Capacitor | 38-39 |
| 13 | **Nachrichten** | P2 | — | 48 |
| 14 | **Mein Profil** | P2 | — | 07 (bottom) |

---

## New Shadcn Components Needed

```bash
npx shadcn@latest add sheet accordion carousel slider switch checkbox toggle-group dialog avatar tabs
```

## Potential DB Migrations Needed

- Add body measurement fields to `costume_items` if not already in `size_data` JSONB (Brustumfang, Rückenlänge, Schulterbreite, Taillenumfang, Hüftumfang, Beinlänge, Schrittlänge, etc.)
- Add `platzierung` fields (Stockwerk, Regal, Sektor) to `costume_items` if not covered by `storage_location_path`
- Add more sub-type taxonomy terms (Hosen sub-types: Bermudashorts, Chinohose, Knickerbockerhose, Latzhose, Schlaghose, etc. as shown in Figma page 09)
- Potentially add `sparte` vocabulary to `taxonomy_terms` (Film, Schauspiel, Oper, Akademie)

---

## Figma Page Index

| Page | Content |
|------|---------|
| 01 | Splash hero |
| 02 | Section: Startseite |
| 03 | Homepage (full) |
| 04 | Section: Standort Eingrenzung |
| 05 | Location filter modal |
| 06 | Section: Menu |
| 07 | Hamburger menu (top level) |
| 08 | Menu: Herren Bekleidungsart |
| 09 | Menu: Herren Hosen (sub-types) |
| 10 | Section: Filter |
| 11-12 | Filter panel (full, two states) |
| 13 | Section: Sucheingabe |
| 14 | Search input (empty) |
| 15 | Search with suggestions |
| 16 | Section: Resultate & Detailansicht |
| 17 | Results grid |
| 18 | Results grid with "+" actions |
| 19 | Costume detail page (full) |
| 20 | Section: Kostüm merken |
| 21 | Add to Merkliste bottom sheet |
| 22 | Create new Merkliste modal |
| 23 | Results grid (after bookmark) |
| 24 | Costume detail (with "gemerkt" badge) |
| 25 | Section: Merkliste teilen |
| 26 | Merkliste overview |
| 27 | Merkliste detail (list view) |
| 28 | Merkliste detail (with selection checkboxes) |
| 29 | Share / Mitwirkende einladen |
| 30 | Merkliste actions menu |
| 31 | Merkliste selection mode with bottom bar |
| 32 | Section: Interne Ausleihe |
| 33 | Anfragen & Ausleihen overview |
| 34 | Rental step 1: Personalien (empty) |
| 35 | Rental step 1: Personalien (filled) |
| 36 | Rental step 2: Auswahl (options) |
| 37 | Rental step 2: Etiketten scannen selected |
| 38 | Barcode scanner (scanning) |
| 39 | Barcode scanner (scanned) |
| 40 | Rental step 3: Ausleihe summary |
| 41 | Section: Nachrichten |
| 42 | Add to Merkliste (duplicate of 21) |
| 43 | Merkliste auswählen (for rental) |
| 44 | Merkliste auswählen (selected) |
| 45 | Rental step 3: with status badges |
| 46 | Success: Ausleihe erfolgreich erfasst |
| 47 | Rental step 2: Merkliste option selected |
| 48 | Nachrichten (messages list) |
