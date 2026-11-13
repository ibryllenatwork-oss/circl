# circl. Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js app on Vercel, backed by Supabase. It has the default
landing page and a login-protected `/admin` area where management can invite,
list and remove managers.

**Architecture:** Built from Vercel's `with-supabase` Next.js example, then
changed: sign-up is removed, the protected area moves to `/admin`, an admin
shell gets a sidebar, and a Users module runs on server actions through a
server-only Supabase admin client. Pure logic lives in `lib/` and is
unit-tested with Vitest. Supabase and Vercel wiring is checked by hand at the
end.

**Tech Stack:** Next.js (App Router, TypeScript), `@supabase/ssr`,
`@supabase/supabase-js`, Tailwind, shadcn/ui, Vitest, Supabase CLI via `npx`,
Vercel.

**Spec:** `docs/superpowers/specs/2026-11-13-foundation-design.md`

## Global Constraints

- No public sign-up route, page, component or link may remain.
- `SUPABASE_SERVICE_ROLE_KEY` is read only in `server-only` modules and never
  gets a `NEXT_PUBLIC_` prefix.
- Env var names, exactly: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `.env.local` is gitignored; `.env.example` is committed with names only.
- The landing page (`/`) stays the starter's default page.
- A manager cannot remove themselves.
- Use `npx` for the Supabase CLI and the Vercel CLI; install neither globally.
- Windows host: commands must work in Git Bash.

## Review Focus

1. **Open redirect.** A `next=https://evil.com` or `next=//evil.com` query on
   `/auth/confirm` or the login page must fall back to `/admin`. Tested in
   Task 2 (`safeNext`).
2. **Inviting an email that already belongs to a manager.** This shows a clear
   error and must not crash or send a duplicate invite. Tested in Task 4 by
   mapping the Supabase error.
3. **Malformed or blank invite email.** It is rejected before Supabase is
   called. Tested in Task 4 (`parseInviteEmail`).
4. **Removing yourself, or removing with a missing or empty id.** The action is
   refused. Tested in Task 4 (`canRemoveManager`).
5. **Server actions called without a session.** For example, a POST sent after
   the session expired. Each action returns an "unauthorized" result instead
   of running. Task 4 covers this with the `requireManager` guard plus a
   manual check in Task 6.

---

### Task 1: Scaffold the repo, starter app, test runner and Supabase folder

**Files:**
- Move: `logo version 1.png` to `brand/logo-v1.png`; `logo version 1.psd` to
  `brand/logo-v1.psd`
- Create via generator: the whole Next.js app at the repo root
- Create: `.env.example`, `vitest.config.ts`, `supabase/` (via `npx supabase init`)
- Modify: `package.json` (add a `"test": "vitest run"` script), `.gitignore`
  (confirm that `.env*.local` and `supabase/.temp` are listed)

**Interfaces:**
- Produces: the starter's `lib/supabase/server.ts` exporting
  `createClient(): Promise<SupabaseClient>`, plus `lib/supabase/client.ts`.
  Produces the starter's middleware session helper (`lib/supabase/middleware.ts`
  or `proxy.ts`, depending on the Next version). Record the actual file names
  in the commit message, because later tasks refer to them.

- [ ] **Step 1:** `git init`. Move the logos into `brand/`.
- [ ] **Step 2:** Scaffold into a temporary directory with
  `npx create-next-app@latest circl-app --example with-supabase`. Move its
  contents (including dotfiles) into the repo root, then delete the temporary
  directory. The root is not empty, so the generator refuses to run there
  directly.
- [ ] **Step 3:** `npm i -D vitest` and add `vitest.config.ts` with
  `test.environment = "node"` and a `@` alias to the repo root.
- [ ] **Step 4:** Write `lib/smoke.test.ts` asserting `1 + 1 === 2`. Run
  `npm test`. Expected: 1 passed.
- [ ] **Step 5:** `npx supabase init` (answer no to the VS Code/Deno prompts).
  Expected: `supabase/config.toml` and `supabase/migrations/` exist. Create
  `supabase/migrations/.gitkeep`.
- [ ] **Step 6:** Write `.env.example` with the three variable names and empty
  values. Rename the starter's anon/publishable variable if its name differs
  from the Global Constraints, and update every reference.
- [ ] **Step 7:** `npm run build`. Expected: the build succeeds without a
  `.env.local` (the starter tolerates missing env vars).
- [ ] **Step 8:** Commit with the message `chore: scaffold Next.js + Supabase starter`.

### Task 2: Remove sign-up, protect `/admin`, make redirects safe

**Files:**
- Delete: `app/auth/sign-up/`, `app/auth/sign-up-success/`,
  `components/sign-up-form.tsx`, and every "Sign up" link in the starter's
  components, such as `auth-button.tsx` and `login-form.tsx`
- Move: `app/protected/` to `app/admin/`
- Create: `lib/auth/paths.ts`, `lib/auth/paths.test.ts`
- Modify: the middleware session helper (it redirects only for protected
  paths); `app/auth/confirm/route.ts` (uses `safeNext`); `components/login-form.tsx`
  and `components/update-password-form.tsx` (both send the user to `/admin` on
  success)

**Interfaces:**
- Produces: `isProtectedPath(pathname: string): boolean` and
  `safeNext(next: string | null | undefined): string` in `lib/auth/paths.ts`.

- [ ] **Step 1: Write the failing tests** in `lib/auth/paths.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isProtectedPath, safeNext } from "./paths";

describe("isProtectedPath", () => {
  it.each(["/admin", "/admin/", "/admin/users"])("protects %s", p =>
    expect(isProtectedPath(p)).toBe(true));
  it.each(["/", "/auth/login", "/administrator", "/about"])("allows %s", p =>
    expect(isProtectedPath(p)).toBe(false));
});

describe("safeNext", () => {
  it("keeps internal paths", () => {
    expect(safeNext("/admin/users")).toBe("/admin/users");
    expect(safeNext("/auth/update-password")).toBe("/auth/update-password");
  });
  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "admin"])(
    "falls back to /admin for %s", v => expect(safeNext(v)).toBe("/admin"));
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL, because the module is not found.
- [ ] **Step 3:** Implement both functions in `lib/auth/paths.ts`.
  `safeNext` accepts only strings that start with a single `/`, followed by
  something other than `/` or `\`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Do the deletes, the move and the modifications listed above.
  The middleware redirects to `/auth/login` only when `isProtectedPath` is
  true and there is no user. `confirm/route.ts` redirects to
  `safeNext(searchParams.get("next"))`.
- [ ] **Step 6:** Run `grep -ri "sign-up\|signup\|sign up" app components lib`.
  Expected: no matches. Run `npm run build`. Expected: success.
- [ ] **Step 7:** Commit with the message `feat: remove public sign-up and protect /admin`.

### Task 3: Admin shell with sidebar

**Files:**
- Create: `lib/admin/nav.ts`, `lib/admin/nav.test.ts`,
  `components/admin/sidebar.tsx`
- Modify: `app/admin/layout.tsx` (renders the sidebar next to its children),
  `app/admin/page.tsx` (a simple "Welcome, {email}" dashboard that replaces
  the starter's protected-page content)

**Interfaces:**
- Produces: `type AdminNavItem = { label: string; href: string; enabled: boolean }`
  and `ADMIN_NAV: AdminNavItem[]` in `lib/admin/nav.ts`.

- [ ] **Step 1: Write the failing test:**

```ts
import { it, expect } from "vitest";
import { ADMIN_NAV } from "./nav";

it("has Users enabled and module placeholders disabled, in order", () => {
  expect(ADMIN_NAV.map(i => [i.label, i.href, i.enabled])).toEqual([
    ["Dashboard", "/admin", true],
    ["Users", "/admin/users", true],
    ["HR", "/admin/hr", false],
    ["Services & Rates", "/admin/services", false],
    ["Employees", "/admin/employees", false],
    ["Projects", "/admin/projects", false],
  ]);
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `ADMIN_NAV`. Build the `Sidebar` component: enabled
  items are `<Link>`s, and disabled items show a "Soon" badge with
  `aria-disabled`. Include the starter's logout button. On narrow screens the
  sidebar collapses to a top bar.
- [ ] **Step 4:** Run `npm test` and then `npm run build`. Expected: both pass.
- [ ] **Step 5:** Commit with the message `feat: admin shell with module sidebar`.

### Task 4: Users module — list, invite, remove

**Files:**
- Create: `lib/supabase/admin.ts`, `lib/users/rules.ts`,
  `lib/users/rules.test.ts`, `lib/auth/require-manager.ts`,
  `app/admin/users/page.tsx`, `app/admin/users/actions.ts`,
  `components/admin/invite-form.tsx`, `components/admin/remove-button.tsx`
- Modify: `package.json` (add the `server-only` dependency)

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts` (Task 1).
- Produces:
  - `createAdminClient(): SupabaseClient` in `lib/supabase/admin.ts`. Starts
    with `import "server-only"`, uses `SUPABASE_SERVICE_ROLE_KEY`, and throws
    `Error("SUPABASE_SERVICE_ROLE_KEY is not set")` when the key is missing.
  - In `lib/users/rules.ts`:
    - `parseInviteEmail(input: unknown): { ok: true; email: string } | { ok: false; error: string }`
    - `canRemoveManager(callerId: string, targetId: string): boolean`
    - `inviteErrorMessage(err: { message?: string; status?: number; code?: string }): string`
  - `requireManager(): Promise<{ id: string; email: string } | null>` in
    `lib/auth/require-manager.ts`.
  - `type ActionResult = { ok: true; message: string } | { ok: false; error: string }`,
    `inviteManager(prev: ActionResult | null, formData: FormData): Promise<ActionResult>` and
    `removeManager(userId: string): Promise<ActionResult>` in `app/admin/users/actions.ts`.

- [ ] **Step 1: Write the failing tests** in `lib/users/rules.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseInviteEmail, canRemoveManager, inviteErrorMessage } from "./rules";

describe("parseInviteEmail", () => {
  it("trims and lowercases a valid email", () =>
    expect(parseInviteEmail("  Ana@Circl.PH ")).toEqual({ ok: true, email: "ana@circl.ph" }));
  it.each([undefined, null, 42, "", "   ", "ana", "ana@", "@circl.ph", "a b@circl.ph"])(
    "rejects %s", v => expect(parseInviteEmail(v)).toEqual({ ok: false, error: "Enter a valid email address." }));
});

describe("canRemoveManager", () => {
  it("allows removing someone else", () => expect(canRemoveManager("a", "b")).toBe(true));
  it("refuses removing yourself", () => expect(canRemoveManager("a", "a")).toBe(false));
  it("refuses empty ids", () => {
    expect(canRemoveManager("a", "")).toBe(false);
    expect(canRemoveManager("", "b")).toBe(false);
  });
});

describe("inviteErrorMessage", () => {
  it("explains an already-registered email", () =>
    expect(inviteErrorMessage({ code: "email_exists", status: 422 }))
      .toBe("That email already belongs to a manager."));
  it("explains rate limiting", () =>
    expect(inviteErrorMessage({ status: 429 }))
      .toBe("Too many invites sent. Wait a few minutes and try again."));
  it("falls back to a generic message", () =>
    expect(inviteErrorMessage({ message: "boom" }))
      .toBe("Could not send the invite. Try again."));
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `lib/users/rules.ts` to the signatures above.
  `inviteErrorMessage` also treats a message containing "already been
  registered" as `email_exists`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Implement `createAdminClient` with `persistSession: false`
  and `autoRefreshToken: false`. Implement `requireManager`, which wraps
  `(await createClient()).auth.getUser()`.
- [ ] **Step 6:** Implement the actions, each marked `"use server"`:
  - **Both actions:** call `requireManager()` first. If it returns `null`,
    return `{ ok: false, error: "Your session expired. Sign in again." }`.
  - **`inviteManager`:** calls `parseInviteEmail`, then
    `admin.auth.admin.inviteUserByEmail(email, { redirectTo: \`${origin}/auth/confirm?next=/auth/update-password\` })`.
    Take `origin` from the request headers. Map errors with
    `inviteErrorMessage`. Call `revalidatePath("/admin/users")`.
  - **`removeManager`:** calls `canRemoveManager`, then
    `admin.auth.admin.deleteUser(userId)`, then `revalidatePath`.
- [ ] **Step 7:** Build the page. `app/admin/users/page.tsx` is a server
  component calling `admin.auth.admin.listUsers({ perPage: 200 })`. It shows a
  table with Email, Invited (`invited_at ?? created_at`), Last sign-in
  (`last_sign_in_at` or "Pending"), and a remove button that is hidden on the
  current user's row. `InviteForm` uses `useActionState(inviteManager, null)`.
  `RemoveButton` calls `confirm("Remove {email}? They will lose access immediately.")`
  before running the action.
- [ ] **Step 8:** Run `npm test` and `npm run build`. Expected: both pass. Run
  `grep -rn "SUPABASE_SERVICE_ROLE_KEY" app components lib`. Expected: only
  `lib/supabase/admin.ts`.
- [ ] **Step 9:** Commit with the message `feat: manage managers from /admin/users`.

### Task 5: Docs and Supabase configuration notes

**Files:**
- Create: `README.md`, `docs/supabase-setup.md`

- [ ] **Step 1:** Write `README.md`: what circl. is (one line), the stack,
  local setup (`npm i`, copy `.env.example` to `.env.local`, `npm run dev`,
  `npm test`), the folder map, and the rule that each module adds a migration
  with row-level security on.
- [ ] **Step 2:** Write `docs/supabase-setup.md` with the dashboard steps:
  - Where to find the URL, the publishable key and the service-role key.
  - Auth: turn off "Allow new users to sign up". Set the Site URL to the Vercel
    production URL. Add the redirect URLs `http://localhost:3000/**` and
    `https://<vercel-domain>/**`.
  - Email template "Invite user": change the link to
    `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/update-password`.
  - First manager: Authentication → Users → Invite user.
- [ ] **Step 3:** Commit with the message `docs: setup and Supabase configuration`.

### Task 6: Connect accounts, deploy, and run the acceptance check (with the user)

The user does every account and dashboard step. Claude never handles their
passwords.

- [ ] **Step 1:** The user creates a Supabase project and follows
  `docs/supabase-setup.md`. The user pastes the three values into `.env.local`
  themselves.
- [ ] **Step 2:** Local check with `npm run dev`:
  - `/` shows the landing page.
  - `/admin` sends a visitor who is not signed in to `/auth/login`.
  - `/auth/sign-up` returns 404.
- [ ] **Step 3:** The user invites themselves from the dashboard, accepts the
  invite, sets a password, and lands on `/admin`.
- [ ] **Step 4:** From `/admin/users`, the user invites a second email and
  accepts it in a private window. Expected: the row shows a last sign-in. The
  user tries inviting the same email again. Expected: "That email already
  belongs to a manager." The user removes the second manager. Expected: the
  row disappears. Expected: there is no remove button on their own row.
- [ ] **Step 5:** The user creates a private GitHub repo. Claude adds the
  remote and pushes `main`.
- [ ] **Step 6:** The user imports the repo in Vercel and adds the three env
  vars, either by hand or through the Supabase integration. Expected: the
  deploy succeeds.
- [ ] **Step 7:** Repeat Step 2's checks and Step 4's sign-in on the
  production URL. Then update the Supabase Site URL to the production domain
  if it was still on localhost.
