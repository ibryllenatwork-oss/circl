# circl. — Foundation Setup Design

Date: 2026-11-13
Status: Draft, awaiting approval

## Intent

circl. is a virtual assistant agency. It needs a public website and a private
internal system for management. The internal system will grow to include HR,
services and rates, employee (VA) management, project management and more.

This round sets up only the **foundation** the modules will be built on. No
business modules are built yet.

## Goals

- A single Next.js app, deployed on Vercel, backed by Supabase.
- The public landing page: the default page that Vercel's Next.js + Supabase
  starter generates, kept as-is for now.
- A protected `/admin` area that only signed-in circl. management can open.
- **User management inside the system:** a signed-in manager can invite a new
  manager by email, see the list of managers, and remove one.
- Supabase database changes tracked as migration files in the repo.
- Every push to GitHub deploys automatically to Vercel.

## Non-goals

These come later, one module at a time:

- HR, services, rates, employee and project modules
- A custom landing page or branding (brand colors are applied later)
- Logins for VAs or clients

## Anti-goals

- Public sign-up. Nobody can create an account from the website.
- Secret keys in the browser, or committed to git.

## Constraints

- Only circl. management signs in. Every signed-in user can see everything, so
  there are no roles.
- You create the GitHub, Vercel and Supabase accounts and sign in to them
  yourself. Claude does not create accounts or handle passwords.
- Windows machine with Node 24 and git. The Vercel and Supabase command-line
  tools are not installed. Claude runs them through `npx` rather than
  installing them globally.

## Approaches considered

| Approach | Trade-off | Outcome |
|---|---|---|
| **A. One Next.js app: landing page plus `/admin`** | One codebase and one deploy; simplest for a small team | **Chosen** |
| B. Two apps: the landing site and an admin app on a subdomain | Cleaner separation, but twice the setup and shared code to keep in sync | Rejected: too much overhead for now |
| C. One app with a ready-made admin framework (Refine) | Fast basic tables and forms, but custom screens fight the framework | Rejected: table and form libraries can still be picked per module later |

## Design

### Starting point (Claude's call)

The app starts from Vercel's official Next.js + Supabase starter
(`create-next-app --example with-supabase`). The starter already provides:

- the default landing page
- login, forgot-password and set-password pages
- Supabase clients for the browser and the server, using `@supabase/ssr`
- session refresh on every request
- Tailwind and shadcn/ui

### Changes to the starter

1. **Remove public sign-up:** delete the sign-up page and every link to it.
2. **Protected area:** rename the starter's protected area to `/admin`. A
   visitor who is not signed in and opens any `/admin` page is sent to
   `/auth/login`.
3. **Admin shell:** `/admin` gets a sidebar. It has one working item, **Users**,
   plus disabled placeholders for HR, Services & Rates, Employees and Projects.
4. **Users page** (`/admin/users`):
   - **List managers:** email, date invited, last sign-in.
   - **Invite a manager by email:** Supabase sends an invite link. The new
     manager opens it, sets their own password on the set-password page, and
     lands in `/admin`.
   - **Remove a manager:** asks for confirmation first. A manager cannot remove
     themselves, so the system always keeps at least one manager.
   - All of these run on the server through server actions, using Supabase's
     admin API and the service-role (secret) key. Each action first checks that
     the person calling it is signed in. The secret key never reaches the
     browser.
5. **Invite link handling:** Supabase's invite email template is changed to
   point at the starter's `/auth/confirm` route, which then sends the new
   manager on to the set-password page.

### First manager

You invite the first manager, yourself, from the Supabase dashboard. After
that, managers add each other inside the system.

### Configuration

Environment variables, kept in `.env.local` locally and in Vercel's project
settings:

| Variable | Exposed to the browser? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project address |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Public key, limited by database rules |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Inviting, listing and removing managers |

- A committed `.env.example` lists the variable names without values.
- In Supabase's Auth settings, the Site URL and redirect URLs must include both
  `http://localhost:3000` and the Vercel production domain.

### Database

- `npx supabase init` creates a `supabase/` folder with `migrations/`.
- No tables are created yet. Managers live in Supabase Auth's built-in users
  table.
- Each later module adds its own migration, and every new table has row-level
  security turned on from the start.

### Repository and deployment

- The project folder becomes a git repo. The logo files move to `brand/`.
- You create a private GitHub repo, and Claude pushes to it.
- You import the repo into Vercel and add the three environment variables.
  Vercel's Supabase integration can fill them in for you instead.
- **Done when:** the live Vercel URL shows the landing page; `/admin` sends a
  visitor who is not signed in to the login page; and you can sign in, invite a
  second manager, accept that invite, and remove that manager.

## Left to the builder

- Exact sidebar layout and styling, kept to the starter's defaults.
- Whether removing a manager is a hard delete or a ban. Default: delete.
- `README.md` with local setup steps.
