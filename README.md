# Costumanu

Costume rental management platform for theaters, film productions, and performing arts.

## Live Environments

| Environment | URL |
|---|---|
| Production | [costumanu.vercel.app](https://costumanu.vercel.app) |
| Supabase Dashboard | [supabase.com/dashboard/project/dkzhnzwjthwjwtvlufyz](https://supabase.com/dashboard/project/dkzhnzwjthwjwtvlufyz) |

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind v4 | SSR/SSG React framework with utility-first CSS |
| Mobile | Capacitor | Wraps the web app into native iOS/Android binaries |
| Backend | Supabase (PostgreSQL) | Auth, Storage, Database with Row Level Security |
| Hosting | Vercel | Production deployment with auto-builds |
| State/Data | TanStack Query | Server state management with caching and optimistic updates |
| UI | Shadcn/UI + Lucide Icons | Copy-paste component library with icon set |

## Prerequisites

- Node.js >= 18
- npm
- A [Supabase](https://supabase.com) project (free tier works)
- A [Vercel](https://vercel.com) account (free hobby tier works)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and fill in your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Link and apply the database schema**

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build (SSR) |
| `npm run build:mobile` | Static export for Capacitor |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run cap:sync` | Sync web assets to native projects |
| `npm run cap:android` | Open project in Android Studio |
| `npm run cap:ios` | Open project in Xcode |

## Deployment (Vercel)

The app is deployed on [Vercel](https://costumanu.vercel.app/). To deploy manually:

```bash
npx vercel --prod
```

### Environment variables on Vercel

The following env vars must be set in the Vercel project settings (or via CLI):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

To set them via CLI:

```bash
echo "https://your-project.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
echo "your-anon-key" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
```

### Auto-deploys from GitHub

To enable auto-deploys on every push, connect the GitHub repo in the Vercel dashboard:
**Project Settings > Git > Connected Git Repository** and authorize the Vercel GitHub app.

## Database & Migrations

The database schema is managed via [Supabase CLI](https://supabase.com/docs/guides/cli) migrations, stored in `supabase/migrations/`. Timestamped SQL files are applied in order and tracked so each migration runs exactly once.

### Applying migrations

```bash
npx supabase db push
```

### Creating a new migration

```bash
npx supabase migration new <name>
```

This creates a new file at `supabase/migrations/<timestamp>_<name>.sql`. Write your SQL there, then run `db push` to apply it.

### Useful commands

| Command | Description |
|---|---|
| `npx supabase db push` | Apply pending migrations to your remote Supabase project |
| `npx supabase db reset` | Drop and re-run all migrations (local dev only) |
| `npx supabase migration list` | Show which migrations have been applied |
| `npx supabase migration new <name>` | Create a new timestamped migration file |

### Schema overview

The initial migration (`supabase/migrations/20260221134118_initial_schema.sql`) creates:

| Table | Purpose |
|---|---|
| `theaters` | Multi-tenant organizations |
| `theater_members` | User-to-theater membership with roles |
| `profiles` | User profiles (display name, professional title, avatar, phone) |
| `taxonomy_terms` | Standardized vocabulary (gender, clothing type, epoch, material, color, etc.) |
| `costumes` | Costume designs/concepts with full-text search |
| `costume_taxonomy` | Many-to-many link between costumes and taxonomy terms |
| `costume_items` | Physical items (the 1M+ row table) with barcode, RFID, size, condition |
| `costume_media` | Photos linked to Supabase Storage |
| `costume_provenance` | Production history (play, actor, role, director, costume designer) |
| `wishlists` | Named costume collections ("Merklisten") per production |
| `wishlist_items` | Costumes saved inside a Merkliste |
| `wishlist_collaborators` | Shared Merkliste access for team members |
| `cart_items` | Temporary shopping cart before creating a rental |
| `rental_orders` | Lending/borrowing orders between theaters |
| `item_reservations` | Date-range reservations with database-level double-booking prevention |
| `chat_threads` | Conversation threads (order-linked or direct) |
| `chat_thread_participants` | Users participating in a chat thread |
| `chat_messages` | In-app messages within threads |
| `events` | Homepage announcements and events |

Row Level Security is enabled on all tables with an `is_member_of()` helper function for theater-scoped access control.

## Adding UI Components

Shadcn/UI components are added on demand:

```bash
npx shadcn@latest add button
npx shadcn@latest add card dialog input
```

Browse available components at [ui.shadcn.com](https://ui.shadcn.com).

## Mobile Builds (Capacitor)

1. **Add native platforms** (one-time setup):

   ```bash
   npx cap add android
   npx cap add ios
   ```

2. **Build and sync**:

   ```bash
   npm run build:mobile
   npm run cap:sync
   ```

3. **Open in IDE**:

   ```bash
   npm run cap:android   # Android Studio
   npm run cap:ios       # Xcode
   ```

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts  # Supabase auth code exchange
│   ├── fundus/
│   │   ├── page.tsx            # Costume inventory listing (auth-guarded)
│   │   └── neu/page.tsx        # Create new costume form
│   ├── login/page.tsx          # Sign-in / sign-up page
│   ├── merkliste/page.tsx      # Wishlist page (auth-guarded)
│   ├── globals.css             # Tailwind + Shadcn theme
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Home page
├── components/
│   ├── fundus/                 # Costume listing + creation form
│   ├── homepage/               # Home page sections
│   ├── layout/                 # SiteHeader, SiteFooter
│   ├── merkliste/              # Wishlist client component
│   ├── providers.tsx           # Client-side providers (TanStack Query)
│   └── ui/                     # Shadcn/UI components (added via CLI)
├── lib/
│   ├── helpers/
│   │   └── barcode.ts          # Barcode ID generator for costume items
│   ├── types/
│   │   └── costume.ts          # TypeScript interfaces for costumes & taxonomy
│   ├── utils.ts                # cn() class merge helper
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server Component client
│       └── middleware.ts       # Session refresh logic
└── middleware.ts               # Next.js middleware (auth)

supabase/
├── config.toml                 # Supabase local config
└── migrations/                 # Timestamped SQL migration files
```
