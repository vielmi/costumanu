# CLAUDE.md — palco+ Projektkonventionen

> Dieses File ist der primäre Einstiegspunkt für Claude Code.
> Lies zuerst **dieses File**, dann `design-system.md`, dann `modules.md`.

---

## Referenzdokumente

| Dokument | Inhalt |
|---|---|
| `design-system.md` | Alle Design Tokens (Farben, Typografie, Schatten, Spacing, Radius), Komponenten-Spezifikationen (Buttons, Controls, Navigation, Footer, Filter), Icon System |
| `modules.md` | Alle UI-Module der App (Cockpit, Kostüm Detail, Suche, Anfragen, Ausleihen, Nachrichten u.a.) mit Masse, Abstände und Verhaltensbeschreibungen |
| `seed.md` | Datenbankschema (effektiv), Beispieldaten für alle Tabellen, Erweiterung der Seed-Skripte in `scripts/` |

**Workflow:** Vor jeder Implementierung zuerst den relevanten Abschnitt in `modules.md` und die referenzierten Komponenten in `design-system.md` lesen.

---

## Projekt-Übersicht

**App:** palco+ — Kostümverwaltung für Theater
**Repo:** `C:\Users\vielm\Repos\costumanu`
**Branch:** `main`

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Backend / Auth | Supabase |
| State / Data | TanStack React Query v5 |
| Mobile | Capacitor |
| Hosting | Vercel |

---

## Font

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  variable: '--font-family-base',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
})
```

```html
<html lang="de" className={inter.variable}>
```

**Schrift:** Inter (Google Fonts, Open Source). Ersetzt Modern Era (kostenpflichtig).
Schrift kann jederzeit durch Anpassen von `--font-family-base` gewechselt werden.

---

## CSS Custom Properties

Alle Tokens sind in `design-system.md` vollständig dokumentiert. Kurzreferenz:

```css
/* Farben — Vollständige Liste in design-system.md §2 */
--primary-900: #B59B3A;       /* Gold */
--secondary-900: #0D2F27;     /* Dark Green */
--tertiary-900: #5C7788;      /* Steel Blue */
--neutral-grey-600: #242727;
--neutral-black: #000000;

/* Typografie — Vollständige Skala in design-system.md §1 */
--font-family-base: 'Inter', sans-serif;
--font-size-400: 20px;        /* Body 1 */
--font-size-350: 18px;        /* Body 2 */
--font-size-300: 16px;        /* Subtitle 1 */

/* Schatten — in design-system.md §3 */
--shadow-100: 0px 1px 6px 0px rgba(0, 0, 0, 0.20);
--shadow-300: 0px 12px 12px 0px rgba(0, 0, 0, 0.10);

/* Radius — in design-system.md §8 */
--radius-xs:   4px;
--radius-sm:   8px;
--radius-md:   16px;
--radius-lg:   24px;
--radius-xl:   30px;
--radius-full: 9999px;

/* Spacing — in design-system.md §7 */
--spacing-4:  4px;
--spacing-8:  8px;
--spacing-16: 16px;
--spacing-24: 24px;
--spacing-32: 32px;
```

---

## Breakpoint

```css
/* Mobile:  < 744px  → -s Typografie-Tokens */
/* Tablet+: ≥ 744px  → Standard Tokens */

@media (max-width: 743px) { ... }
```

Responsive Typografie via `-s` Suffix: `font-size-800` (Tablet) → `font-size-800-s` (Mobile).
Vollständige Skala in `design-system.md §1`.

---

## Icon System

- **Pfad:** `src/assets/icons/`
- **Format:** SVG, 32×32px
- **Naming:** `icon-{name}.svg` (kebab-case, kein Leerzeichen)
- **Verwendung:** Inline SVG oder `<img>` Tag

```tsx
// Empfohlenes Pattern
import CloseIcon from '@/assets/icons/icon-close-small.svg'
<CloseIcon className="w-5 h-5" />
```

⚠️ Noch umzubenennen: `icon-catetory.svg` → `icon-category.svg`

Vollständige Icon-Liste in `design-system.md §5`.

---

## Komponenten-Konventionen

- **Neue App-Seiten:** Immer `<AppShell>` aus `src/components/layout/app-shell.tsx` verwenden — nie eigenen Header/Sidebar bauen
- **Seiten-Hintergrund:** Immer `background: "var(--page-bg)"` (`--secondary-500` = `#ECF1EE`) — nie hardcoded `#ECF1EE` oder `--secondary-500` für den Root-Hintergrund verwenden
- **Brand Logo:** Immer `<AppLogo />` aus `src/components/layout/app-logo.tsx` — Specs in `design-system.md §6.5`
- **Buttons:** Immer `btn-primary` / `btn-secondary` / `btn-tertiary` aus `design-system.md §6.1`
- **Höhe Buttons:** 62px standardisiert
- **Controls:** Specs in `design-system.md §6.2` (Radio, Checkbox, Toggle, Input, Textarea, Dropdown)
- **Navigation (Mobile):** App Header Bar, Drawer Level 1+2, Bottom Nav — `design-system.md §11`
- **Footer:** `design-system.md §12`
- **Filter/Suche:** `design-system.md §13`

---

## Git-Strategie

- **Branch:** `main` (direkt, kein separater Feature-Branch)
- **Commits:** 1 Commit pro Session
- **Push:** immer direkt auf `main`

```bash
git add -A
git commit -m "feat: [Modul] [kurze Beschreibung]"
git push origin main
```

---

## Wichtige Entscheidungen (nicht nochmals diskutieren)

| Thema | Entscheidung |
|---|---|
| Schrift | Inter (Google Fonts) — final |
| Button-Höhe | 62px — standardisiert |
| Breakpoint | 744px (iPad Mini 8.3 Portrait) |
| Figma MCP | Nicht verfügbar — alle Werte manuell aus Screenshots |
| Styling | Tailwind CSS v4 (kein v3) |
| State Management | TanStack React Query v5 |

---

## Supabase

Lokale Env-Variablen in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

*Projekt: palco+ / costumanu — HCID-Fundus-Layout-01*

