# CLAUDE.md — palcoPiù Projektkonventionen

> Dieses File ist der primäre Einstiegspunkt für Claude Code.
> Lies zuerst **dieses File**, dann `design-system.md`, dann `modules.md`.

---

## Referenzdokumente

| Dokument           | Inhalt                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design-system.md` | Alle Design Tokens (Farben, Typografie, Schatten, Spacing, Radius), Komponenten-Spezifikationen (Buttons, Controls, Navigation, Footer, Filter), Icon System |
| `modules.md`       | Alle UI-Module der App (Cockpit, Kostüm Detail, Suche, Anfragen, Ausleihen, Nachrichten u.a.) mit Masse, Abstände und Verhaltensbeschreibungen               |
| `seed.md`          | Datenbankschema (effektiv), Beispieldaten für alle Tabellen, Erweiterung der Seed-Skripte in `scripts/`                                                      |

**Workflow:** Vor jeder Implementierung zuerst den relevanten Abschnitt in `modules.md` und die referenzierten Komponenten in `design-system.md` lesen.

---

## Projekt-Übersicht

**App:** palcoPiù — Kostümverwaltung für Theater
**Repo:** `C:\Users\vielm\Repos\costumanu`
**Branch:** `main`

---

## Tech Stack

| Layer          | Technologie             |
| -------------- | ----------------------- |
| Framework      | Next.js (App Router)    |
| Language       | TypeScript              |
| Styling        | Tailwind CSS v4         |
| UI Components  | shadcn/ui               |
| Backend / Auth | Supabase                |
| State / Data   | TanStack React Query v5 |
| Mobile         | Capacitor               |
| Hosting        | Vercel                  |

---

## Font

```typescript
// src/app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-family-base",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});
```

```html
<html lang="de" className="{inter.variable}"></html>
```

**Schrift:** Inter (Google Fonts, Open Source). Ersetzt Modern Era (kostenpflichtig).
Schrift kann jederzeit durch Anpassen von `--font-family-base` gewechselt werden.

---

## CSS Custom Properties

Alle Tokens sind in `design-system.md` vollständig dokumentiert. Kurzreferenz:

```css
/* Farben — Vollständige Liste in design-system.md §2 */
--primary-900: #b59b3a; /* Gold */
--secondary-900: #0d2f27; /* Dark Green */
--tertiary-900: #5c7788; /* Steel Blue */
--neutral-grey-600: #242727;
--neutral-black: #000000;

/* Typografie — Vollständige Skala in design-system.md §1 */
--font-family-base: "Inter", sans-serif;
--font-size-400: 20px; /* Body 1 */
--font-size-350: 18px; /* Body 2 */
--font-size-300: 16px; /* Subtitle 1 */

/* Schatten — in design-system.md §3 */
--shadow-100: 0px 1px 6px 0px rgba(0, 0, 0, 0.2);
--shadow-300: 0px 12px 12px 0px rgba(0, 0, 0, 0.1);

/* Radius — in design-system.md §8 */
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 30px;
--radius-full: 9999px;

/* Spacing — in design-system.md §7 */
--spacing-4: 4px;
--spacing-8: 8px;
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
import CloseIcon from "@/assets/icons/icon-close-small.svg";
<CloseIcon className="h-5 w-5" />;
```

⚠️ Noch umzubenennen: `icon-catetory.svg` → `icon-category.svg`

Vollständige Icon-Liste in `design-system.md §5`.

---

## Komponenten-Konventionen

- **Neue App-Seiten:** Immer `<AppShell>` aus `src/components/layout/app-shell.tsx` verwenden — nie eigenen Header/Sidebar bauen
- **Auth-Guard:** Jede geschützte Seite muss als erstes `const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");` enthalten
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

| Thema            | Entscheidung                                         |
| ---------------- | ---------------------------------------------------- |
| Schrift          | Inter (Google Fonts) — final                         |
| Button-Höhe      | 62px — standardisiert                                |
| Breakpoint       | 744px (iPad Mini 8.3 Portrait)                       |
| Figma MCP        | Nicht verfügbar — alle Werte manuell aus Screenshots |
| Styling          | Tailwind CSS v4 (kein v3)                            |
| State Management | TanStack React Query v5                              |

---

## Supabase

Lokale Env-Variablen in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Nach jeder neuen Migrationsdatei in `supabase/migrations/` anwenden:

```bash
supabase db push
```

---

## Code-Qualität

**Prettier** ist konfiguriert (`.prettierrc`, `.prettierignore`):

```bash
npm run format        # alle Dateien formatieren
npm run format:check  # nur prüfen (läuft im CI)
```

**GitHub Actions CI** (`/.github/workflows/ci.yml`) prüft bei jedem Push:

1. `npm run format:check` — Prettier
2. `npm run lint` + `tsc --noEmit` — ESLint & TypeScript
3. `npm run test` — Vitest Unit Tests
4. Playwright E2E Tests

---

## Rollen-Modell

### Theater-Mitglieder (`theater_members.role`)

| Code-Rolle | Bedeutung im Projekt                                   | Business Case §11 Äquivalent                     |
| ---------- | ------------------------------------------------------ | ------------------------------------------------ |
| `owner`    | Vollzugriff auf ein Theater, kann Mitglieder verwalten | Theater-Admin                                    |
| `admin`    | Kann Kostüme verwalten, aber keine Mitglieder einladen | Theater-Admin (eingeschränkt)                    |
| `member`   | Kann Kostüme erfassen und bearbeiten                   | Owner (BC: Person die Kostüme besitzt/verwaltet) |
| `viewer`   | Nur Lesezugriff auf den eigenen Fundus                 | Interner Viewer                                  |

> ⚠️ **Abweichung vom Business Case:** Der BC-Begriff „Owner" bezeichnet die zahlende Person, die Kostüme verwaltet — im Code heisst diese Rolle `member`. Der Code-Begriff `owner` entspricht dem BC-Begriff „Theater-Admin". Diese Namensgebung ist bewusst so beibehalten (Umbenennung würde alle Berechtigungsabfragen im Code brechen).

### Platform-weite Rollen (`profiles.platform_role`)

| Wert               | Bedeutung                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `'platform_admin'` | Zugriff auf alle Theater, Netzwerke und den Platform Admin-Bereich |
| `NULL`             | Kein erhöhter Zugriff                                              |

**Technisch:** Die SQL-Funktion `is_platform_admin()` liest `platform_role`. Alle RLS-Policies auf Netzwerk-/Theater-Ebene verwenden diese Funktion. **Nie** direkt `is_platform_admin BOOLEAN` referenzieren — diese Spalte existiert nicht mehr (entfernt in Migration 20260507110000).

### Externer Viewer — implementiert

Nutzer mit Supabase-Account, aber **ohne** Theater-Mitgliedschaft (`theater_members`-Eintrag fehlt):

- Registrierung via `/register` (E-Mail + Passwort + Anzeigename)
- Nach Login/Registrierung → Weiterleitung zu `/suchmodus` (via Root-Page-Logik)
- Suchmodus erfordert Login — anonymer Zugriff ist nicht mehr möglich
- RLS: `TO authenticated`-Policies erlauben Lesezugriff auf öffentliche Kostüme
- Middleware schützt alle `/suchmodus/*`-Routen und leitet unauthentifizierte Requests zu `/login`

**`resolveUserContext()` in `src/lib/services/profile-service.ts`:** Gibt für Nutzer ohne Theater-Mitgliedschaft `userRole = "viewer"` zurück (nicht `"member"`). Die Root-Seite prüft damit einfach `if (userRole === "viewer") redirect("/suchmodus")` — deckt interne Viewer und externe Viewer gleich ab.

### Netzwerk-Admin — implementiert

Theater-User mit `theater_members.role IN ('owner','admin')` und `theater_network_members.network_role = 'admin'` für ein Netzwerk:

- Kann Netzwerk-Name, Beschreibung und `default_visibility` bearbeiten (via RLS-Policy `is_network_admin()`)
- Sieht Tab «Netzwerk» auf der Konfigurationsseite (nur wenn mind. ein Netzwerk admin)
- Kann keine Mitgliedschaften verwalten — das bleibt Platform Admin
- SQL-Funktion: `is_network_admin(p_network_id UUID)` — SECURITY DEFINER, kein RLS-Recursion-Risiko
- Server Action: `updateNetworkSettingsAction` (nutzt User-Session, RLS erzwingt Berechtigungsprüfung)

### Subscription-Tiers — implementiert

DB-Schema und Helper-Funktionen vorhanden (`theater_tier()`, `has_feature()`):

| Tier                 | `custom_fields` | `network_sharing` | `network_admin` |
| -------------------- | --------------- | ----------------- | --------------- |
| free                 | ❌              | ❌                | ❌              |
| starter              | ❌              | ✅                | ❌              |
| standard             | ✅              | ✅                | ❌              |
| pro                  | ✅              | ✅                | ✅              |
| premium / enterprise | ✅              | ✅                | ✅              |

**Gates implementiert:**

- `field_definitions` INSERT/UPDATE/DELETE: RLS-Policy prüft `has_feature(theater_id, 'custom_fields')` (Migration `20260508100000`) — Free-Tier-Theater können keine Felder anlegen, auch nicht via direktem API-Call
- UI: «Eigene Felder»-Tab in Konfiguration zeigt Upgrade-Hinweis wenn Tier < standard

**Gates noch nicht implementiert:** `network_sharing` und `network_admin` haben noch keine RLS-Gates.

### Kaufbar-Flag (`is_purchasable`) — DB only

`costume_network_visibility.is_purchasable BOOLEAN` (Default: `false`):

- Trennt Kaufbarkeit von Ausleihbarkeit (`is_lendable`)
- Helper-Funktion: `costume_purchasable_to_theater(costume_id, viewer_theater_id)`
- UI/Verwaltung noch nicht gebaut — vollständiges Feature, braucht eigene Netzwerk-Sichtbarkeits-Sektion

### Eigene Felder (Custom Fields) — implementiert

Theater können eigene Kostüm-Felder definieren (Standard+-Tier):

**DB-Tabellen:**

- `field_definitions` — pro Theater: `label`, `field_type` (text/textarea/number/boolean/select), `options` (JSON), `is_required`, `sort_order`
- `field_requirements` — pro Netzwerk: identisches Schema, schreibt Mitglied-Theatern Felder vor
- `costumes.custom_fields JSONB` — Schlüssel = `field_definitions.label`, Wert = Nutzereingabe als String

**Services:** `src/lib/services/field-service.ts`

- `getFieldDefinitions(supabase, theaterId)` — lädt Theater-eigene Felder
- `getFieldRequirements(supabase, theaterId)` — lädt Netzwerk-Anforderungen über alle Netzwerke des Theaters

**Formular:** Sektion «Eigene Felder» in `kostueme-neu-client.tsx` — erscheint nur wenn `fieldDefinitions.length > 0`. Beim Speichern wird validiert, ob alle Netzwerk-Pflichtfelder (`field_requirements.is_required = true`) ausgefüllt sind (nur für Felder die auch in `field_definitions` vorhanden sind).

**Duplizieren:** `duplicateCostume()` in `costume-service.ts` kopiert `custom_fields` automatisch, falls die Spalte existiert.

---

_Projekt: palcoPiù / costumanu — HCID-Fundus-Layout-01_
