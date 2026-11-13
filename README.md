# circl.

The website and internal admin system for circl., a virtual assistant agency.

- **Public site** at `/`: the default starter landing page for now.
- **Admin** at `/admin`: for circl. management only. Sign-in is by invite;
  there is no public sign-up.

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind, shadcn/ui
- Supabase: Postgres and Auth, through `@supabase/ssr`
- Vercel for hosting; every push to `main` deploys
- Vitest for unit tests

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # http://localhost:3000
npm test
```

For the Supabase dashboard settings (sign-ups off, invite email, first
manager), see [docs/supabase-setup.md](docs/supabase-setup.md).

## Environment variables

| Name | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server (public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** (`lib/supabase/admin.ts`). Never commit it, and never give it a `NEXT_PUBLIC_` prefix. |

## Folder map

| Path | What's there |
|---|---|
| `app/page.tsx` | Landing page |
| `app/auth/` | Login, forgot and set password, the email-link handler (`confirm`) |
| `app/admin/` | Admin area: layout with sidebar, dashboard, `users/` |
| `components/admin/` | Sidebar, invite form, remove button |
| `lib/auth/` | Which paths are protected, safe redirects, `requireManager()` |
| `lib/admin/nav.ts` | Sidebar entries. Enable a module here when it ships. |
| `lib/supabase/` | Browser, server, session-refresh (`proxy.ts`) and admin clients |
| `lib/users/` | Invite and remove rules |
| `supabase/migrations/` | Database changes, as SQL files |
| `brand/` | Logo source files |
| `docs/` | Design, plans, setup guides |

## Adding a module (HR, Services & Rates, ...)

1. Create a migration: `npx supabase migration new <name>`.
2. In it, turn on row-level security for every new table, with a policy that
   lets signed-in users (`authenticated`) read and write.
3. Add pages under `app/admin/<module>/`, and set `enabled: true` for the
   module in `lib/admin/nav.ts`.
