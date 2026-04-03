# CLAUDE.md — Project Guide for AI Agents

## Project Overview

**kostüm+** — A costume rental management platform for theaters, film productions, and performing arts. German UI throughout. Multi-tenant via `theaters` + `theater_members`.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + Shadcn/UI + Lucide icons
- **Backend:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** Supabase Auth via `@supabase/ssr` (cookie-based sessions)
- **State:** TanStack React Query v5
- **Mobile:** Capacitor (iOS/Android wrapper)
- **Hosting:** Vercel

## Key Conventions

- **Path alias:** `@/*` maps to `./src/*`
- **UI language:** German — all labels, error messages, placeholders in German
- **Component library:** Shadcn/UI — add components via `npx shadcn@latest add <name>`
- **Supabase clients:**
  - Browser: `import { createClient } from "@/lib/supabase/client"`
  - Server Component / Route Handler: `import { createClient } from "@/lib/supabase/server"`
- **Server components** are the default in Next.js App Router; add `"use client"` only when needed
- **React Query** is provided via `<Providers>` in the root layout

## Common Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build — run this to verify before committing
npm run lint       # ESLint
```

## Database & RLS Patterns

- All tables have Row Level Security (RLS) enabled
- `is_member_of(theater_id)` — helper function for theater-scoped access
- `is_wishlist_owner(wishlist_id)` / `is_wishlist_collaborator(wishlist_id)` — SECURITY DEFINER helpers to avoid circular RLS between `wishlists` ↔ `wishlist_collaborators`
- `bootstrap_personal_theater(p_name, p_slug)` — SECURITY DEFINER RPC that creates a theater + owner membership atomically (avoids chicken-and-egg RLS problem)
- `wishlists.owner_id` has **no DEFAULT** — must be set explicitly in every INSERT
- Migrations live in `supabase/migrations/` as timestamped SQL files
- Apply migrations: `npx supabase db push` (requires `npx supabase login` with a `sbp_` PAT token)

## Project Structure

```
src/app/                    → Pages (App Router)
src/app/auth/callback/      → Supabase auth code exchange
src/app/login/              → Sign-in / sign-up
src/app/merkliste/          → Wishlist page (auth-guarded server component)
src/components/layout/      → SiteHeader, SiteFooter
src/components/homepage/    → Home page sections
src/components/merkliste/   → Wishlist client component (React Query CRUD)
src/components/ui/          → Shadcn/UI primitives + Icon wrapper
src/lib/supabase/           → Supabase client factories (browser, server, middleware)
supabase/migrations/        → SQL migration files
```

## Auth Flow

1. User signs up/in at `/login` (client-side, `supabase.auth`)
2. Email confirmation links hit `/auth/callback` which exchanges the code for a session
3. Protected pages (e.g., `/merkliste`) call `supabase.auth.getUser()` server-side and redirect to `/login` if unauthenticated
4. Middleware (`src/middleware.ts`) refreshes the auth session on every request

## Gotchas

- `supabase db push` may fail with "Invalid access token format" — use a `sbp_*` personal access token, not the browser login flow
- The RETURNING clause after INSERT is subject to SELECT RLS policies — use SECURITY DEFINER RPCs when the inserting user doesn't yet satisfy the SELECT policy
- Avoid circular RLS policies (table A policy queries table B, whose policy queries table A) — use SECURITY DEFINER helper functions to break the cycle

---

## Design System

Always read `@design-system.md` before building any component.
It is the single source of truth for colors, typography, spacing, border-radius, and shadows.

### shadcn Token Mapping
Override shadcn's visual appearance exclusively via CSS variables in `src/app/globals.css`.
Never override shadcn component APIs, remove existing variants, or use inline styles.
Use Tailwind utility classes only as a fallback when no CSS variable exists.

### Icon Usage
All icons go through the wrapper component at `src/components/ui/icon.tsx`.

```tsx
// Always use this — never import lucide-react directly in page/component files
<Icon name="home" size={20} className="text-primary" />
```

Resolution order:
1. Local SVG: `src/assets/icons/icon-{name}.svg` (rendered inline)
2. Fallback: matching Lucide icon (same name convention)

**Never** import from `lucide-react` directly in pages or feature components.
The `icon.tsx` wrapper itself may import from lucide-react — that is the only permitted location.

---

## Screen References

All target screens are in `docs/screens/`.
Always open and reference the relevant screen file before writing any component or page.
Screen index: `@docs/screens.md`

---

## Selected State Patterns

Apply these patterns consistently. Never mix them across element types.

| Pattern | Elements | Unselected | Selected |
|---------|----------|------------|----------|
| **A** | Icon cards, size buttons, temperature buttons, sector buttons | White bg, dark border, teal icon | Dark green bg, white icon, white text |
| **B** | Chip/tag pills (Sparte, Materialien, Bekleidungstypen) | White bg, light border, dark text | White bg, **dark border**, bold text, **× icon appended** — no fill |
| **C** | Radio-row buttons (Bekleidungsart) | White bg, empty circle radio | Mint bg on full row, filled teal radio circle |
| **D** | Checkbox rows (Reinigung, Trocknen, Bügeln) | White bg, empty rounded-square checkbox | Mint bg on full row, filled teal checkbox |
| **E** | Location cards (Lagerort) | White bg, light border, dark text | Full dark green bg, white text, white icon |
| **E** | Color swatch cards (Farbrichtung) | White bg, light border, color circle | Mint/grey bg, border unchanged, color circle unchanged |

---

## Development Workflow

- **One component or page per session** — never request multiple features at once
- Always reference the relevant screen from `docs/screens/` before writing code
- Flag inconsistencies between screens and `design-system.md` explicitly — never resolve silently
- Run `npm run build` after each session to catch type errors early
- The costume form (`/costume/new`) uses sticky left sub-nav with IntersectionObserver scroll-spy
- Camera interactions: `capture="environment"` input for photos, `@zxing/browser` for barcode/QR scanning
