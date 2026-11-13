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
| `NEXT_PUBLIC_ENABLE_GOOGLE_SIGNIN` | Set to `true` to show "Continue with Google" on the login page, but only after Google is set up (docs/supabase-setup.md §6). Off by default. |
| `SUPERADMIN_EMAILS` | **Server only.** A comma-separated list of the emails that can manage users. Superadmins can't be removed from inside the app. To add one, edit this value in Vercel and redeploy. |

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

## Modules

- **Employees** (`/admin/employees`): the VA 201 file. It holds personal
  details, government IDs, employment, payout, emergency contact, education,
  documents with expiry dates, and a photo. Rehiring reactivates the same
  record and keeps past stints in its history.
- **Clients** (`/admin/clients`): company, contacts (one primary), billing,
  engagement, assigned VAs and documents.

**How access works:** all data goes through `withManager` in
`lib/data/db.ts`, using the service-role key. Every table has RLS on with no
policies, so the public key can't read anything. Files live in the private
`documents` bucket and are only reachable through short-lived signed URLs.

**Dev mode:** on your computer, dev mode writes to the live Supabase project.
Records you create there are tagged "Dev", and the lists' **Created in dev
mode** filter finds them so you can delete them.

### Applying database migrations

```bash
npx supabase login
npx supabase link --project-ref yjtqwoljbihvljlejual
npx supabase db push --linked
```

## Adding a module (Services & Rates, Projects, ...)

1. Create a migration: `npx supabase migration new <name>`.
2. In it, turn on row-level security for every new table, with **no policies**
   (data is read and written only through `withManager` on the server).
3. Add pages under `app/admin/<module>/`, and set `enabled: true` for the
   module in `lib/admin/nav.ts`.
