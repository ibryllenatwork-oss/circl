# Google Sign-in and Superadmin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Managers can sign in with Google. Only the superadmins listed in
`SUPERADMIN_EMAILS` can manage users, and a superadmin can't be removed.

**Architecture:** A pure helper module (`lib/auth/roles.ts`) feeds
`requireManager()`, which now returns `isSuperadmin`. The admin layout becomes
an `AdminShell` server component: it verifies the session and passes
`isSuperadmin` to the sidebar. Google sign-in uses
`signInWithOAuth` → `/auth/callback` (`exchangeCodeForSession`). Errors come
back to the login page as `?error=<code>`.

**Spec:** `docs/superpowers/specs/2026-11-13-google-login-superadmin-design.md`

## Global Constraints

- `SUPERADMIN_EMAILS` is server-only: no `NEXT_PUBLIC_` prefix, comma-separated,
  compared trimmed and in lowercase.
- Exact copy:
  - "Only a superadmin can manage users."
  - "This Google account isn't a circl. manager. Ask a superadmin to invite you."
- All redirects from `/auth/callback` go through `safeNext`.

## Review Focus

1. Uppercase letters or spaces in `SUPERADMIN_EMAILS` or in a user's email must
   still match. (Task 1 test)
2. `SUPERADMIN_EMAILS` unset or empty: there are no superadmins, and nothing
   crashes. (Task 1 test)
3. A manager who isn't a superadmin calls `inviteManager` or `removeManager`
   directly: refused. (Task 1, by the guard)
4. A call that targets a superadmin for removal: refused. (Task 1,
   `canRemoveManager` test)
5. A `next` value on the callback pointing to an outside site: falls back to
   `/admin`. (Covered by the existing `safeNext` tests)

### Task 1: Superadmin rules, guard, sidebar and Users page

- Create `lib/auth/roles.ts` with:
  - `parseSuperadminEmails(raw: string | undefined): string[]`
  - `isSuperadmin(email: string | null | undefined, list: string[]): boolean`
- Tests:
  - `" A@x.com , b@y.com ,"` gives `["a@x.com","b@y.com"]`
  - `undefined` gives `[]`
  - `isSuperadmin(" A@X.com ", ["a@x.com"])` is true
  - `isSuperadmin(null, [...])` is false
- Change `canRemoveManager` to
  `(callerId: string, targetId: string, targetIsSuperadmin: boolean): boolean`.
  Add a test: `canRemoveManager("a", "b", true)` is false.
- `ADMIN_NAV` items gain `superadminOnly?: boolean` (true for Users). Add
  `visibleNav(isSuperadmin: boolean): AdminNavItem[]`, with a test that Users
  is hidden when the argument is false.
- `Manager` gains `isSuperadmin: boolean`.
- Actions:
  - Both refuse anyone who isn't a superadmin, with the exact copy above.
  - `removeManager` fetches the target with `getUserById`, then calls
    `canRemoveManager` with that target's superadmin status.
- Rename `AdminGate` to `AdminShell` (`components/admin/admin-shell.tsx`). It
  renders `<Sidebar isSuperadmin>` plus the page content. Its test checks the
  redirect when the user is null, and that the sidebar gets `isSuperadmin`.
- Users page:
  - Someone who isn't a superadmin sees the copy above instead of the page.
  - Superadmin rows get a "Superadmin" badge and no Remove button.
- Commit: `feat: superadmin-only user management`.

### Task 2: Google sign-in

- Create `lib/auth/login-errors.ts` with
  `loginErrorMessage(code: string | null): string | null`. Codes and messages:
  - `"not_manager"`: the exact copy above
  - `"oauth_failed"`: "Google sign-in failed. Try again."
  - anything else: `null`
- Add `oauthErrorCode(params: URLSearchParams): "not_manager" | "oauth_failed" | null`.
  It returns `not_manager` when `error_code` is `signup_disabled`, or when
  `error_description` matches /signups? not allowed/i. Tests for each.
- `app/auth/callback/route.ts`:
  - On an error, redirect to `/auth/login?error=<code>`.
  - When there is a code, call `exchangeCodeForSession`, then redirect to
    `safeNext(next)`.
  - If there's no code, or the exchange fails, redirect with `oauth_failed`.
- `LoginForm`:
  - Add a "Continue with Google" button calling
    `signInWithOAuth({ provider: "google", options: { redirectTo: origin + "/auth/callback" } })`.
  - Show `loginErrorMessage(useSearchParams().get("error"))`.
  - The login page wraps the form in `<Suspense>`.
- Commit: `feat: sign in with Google`.

### Task 3: Docs and env

- Add `SUPERADMIN_EMAILS` to `.env.example`, `.env.local` and the README table.
- In `docs/supabase-setup.md`:
  - Add a Google section: the Google Cloud OAuth client, the redirect URI
    `https://<ref>.supabase.co/auth/v1/callback`, and the Supabase Google
    provider.
  - Add a "Superadmin" section.
- Run `npm test`, `tsc` and `npm run build`. Check with curl that
  `/auth/callback?error=access_denied&error_code=signup_disabled` redirects to
  `/auth/login?error=not_manager`.
- Commit: `docs: Google sign-in and superadmin setup`.
