# Google Sign-in and Superadmin — Design

Date: 2026-11-13
Status: Draft, awaiting approval
Builds on: `2026-11-13-foundation-design.md`

## Intent

- Managers can sign in with Google.
- `ibryllen.atwork@gmail.com` is the default superadmin, and only superadmins
  manage who can access the admin (option A).

## Goals

- Add a **"Continue with Google"** button to the login page. Email and password
  login stays as a backup.
- Public sign-up stays off. A Google account that hasn't been added as a
  manager is turned away with a clear message.
- Only superadmins can see **Users** in the sidebar, open `/admin/users`, or
  invite and remove managers.
- A superadmin can't be removed from inside the app.

## Non-goals

- Per-module permissions (option C). These get designed together with HR and
  Employees.
- A screen for promoting someone to superadmin.

## Approaches considered (for where the superadmin list lives)

| Approach | Trade-off | Outcome |
|---|---|---|
| **Server setting `SUPERADMIN_EMAILS`** (comma-separated) | Simple, and can't be tampered with from the app. To add a superadmin, edit the setting in Vercel and redeploy. | **Chosen** (Claude's call) |
| A role saved on each user in Supabase | Allows a "make superadmin" button later, but needs more code and a way to set the first role | Deferred; we can switch when per-module roles come |

## Design

### Google sign-in

- **Login form:** gets a Google button that calls
  `signInWithOAuth({ provider: "google", redirectTo: <origin>/auth/callback })`.
- **New `/auth/callback` route:** exchanges the code for a session, then
  redirects through `safeNext`, which defaults to `/admin`.
- **Rejected Google account:** if Supabase refuses the account because sign-ups
  are off, the user goes back to the login page with this message: "This Google
  account isn't a circl. manager. Ask a superadmin to invite you."
- **Existing managers:** Supabase links Google to a manager's account when the
  Gmail address matches the email they were invited with.

### Superadmin

- **Server-only setting:** `SUPERADMIN_EMAILS=ibryllen.atwork@gmail.com`, kept
  in `.env.local` and in Vercel. Emails are compared trimmed and in lowercase.
- **Pure helper:** `isSuperadmin(email, list)`.
- **`requireSuperadmin()`:** guards the Users page and both user actions. A
  manager who isn't a superadmin gets "Only a superadmin can manage users."
- **Sidebar:** shows **Users** only to superadmins.
- **Removal:** `removeManager` refuses a superadmin target. The Users table
  shows a "Superadmin" badge and no Remove button on those rows.

### One-time setup (you)

1. **Google Cloud:** create an OAuth client (Web application). Add the
   authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase:** go to Authentication → Sign In / Providers → Google, turn it
   on, and paste the Google Client ID and Client Secret.
3. **Supabase:** add `ibryllen.atwork@gmail.com` as a user, either through
   Authentication → Users → Invite, or Create user with "Auto confirm". Then
   sign in with Google.

All three steps get added to `docs/supabase-setup.md`.

## Done when

- `ibryllen.atwork@gmail.com` signs in with Google, sees Users, invites a
  manager, and can't be removed.
- An invited manager who isn't a superadmin signs in, doesn't see Users, and
  gets refused if they open `/admin/users` directly.
- A Google account that was never invited gets the "not a circl. manager"
  message.
