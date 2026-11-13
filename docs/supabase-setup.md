# Supabase setup

You do these steps once, in the Supabase dashboard (https://supabase.com/dashboard).

## 1. Create the project

1. Click **New project**. Name it `circl`, choose a region close to you (for
   example Singapore), and save the database password in your password
   manager.
2. Wait for the project to finish setting up.

## 2. Copy the keys into `.env.local`

Go to **Project Settings → API Keys** (the project URL is under **Data API**).

| Dashboard value | Goes into |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable key (or legacy `anon` key) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key (or legacy `service_role` key) | `SUPABASE_SERVICE_ROLE_KEY` |

The secret key can do anything to your database. Keep it in `.env.local` and
in Vercel's environment variables only.

## 3. Turn off public sign-up

Go to **Authentication → Sign In / Providers**. Turn off **Allow new users to
sign up**. Invites still work.

## 4. Site URL and redirect URLs

Go to **Authentication → URL Configuration**.

- **Site URL:** while testing on your computer, use `http://localhost:3000`.
  After the Vercel deploy, change it to your production address, for example
  `https://circl.vercel.app`. Invite and password-reset links point here.
- **Redirect URLs:** add both `http://localhost:3000/**` and
  `https://<your-vercel-domain>/**`.

## 5. Invite and reset-password emails

Go to **Authentication → Emails → Templates**.

**Invite user:** replace the link in the message body with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/update-password">Accept the invite</a>
```

**Reset password:** replace the link with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password">Reset your password</a>
```

Optional: change the subjects to "You're invited to circl. admin" and "Reset
your circl. admin password".

Supabase's built-in email sender only allows a few emails per hour. Before
inviting many people, set up your own email service under **Authentication →
Emails → SMTP Settings**.

## 6. Turn on Google sign-in

### 6a. Google Cloud (https://console.cloud.google.com)

1. Create a project, for example `circl`. Use the project picker at the top,
   then **New project**.
2. Go to **APIs & Services → OAuth consent screen**, also called **Google Auth
   Platform → Branding**:
   - **App name:** `circl.`
   - **Support email:** your email
   - **Audience:** External
3. Under **Audience**, click **Publish app**. While the app is left in
   "Testing", only the test users you list there can sign in.
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - **Application type:** Web application
   - **Name:** `circl Supabase`
   - **Authorized JavaScript origins:** `http://localhost:3000`, and later your
     Vercel address
   - **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback`.
     Supabase shows this exact address on its Google provider page, so copy it
     from there.
5. Copy the **Client ID** and the **Client secret**.

### 6b. Supabase

Go to **Authentication → Sign In / Providers → Google**. Turn on **Enable Sign
in with Google**, paste the Client ID and the Client secret, then click
**Save**.

Public sign-up stays off, so Google only lets in people who already exist under
**Authentication → Users**. Anyone else sees "This Google account isn't a
circl. manager."

## 7. Add the superadmin (you)

The superadmin email comes from the `SUPERADMIN_EMAILS` setting in `.env.local`,
and in Vercel. Out of the box it is `ibryllen.atwork@gmail.com`.

1. Go to **Authentication → Users → Add user → Create new user**:
   - **Email:** `ibryllen.atwork@gmail.com`
   - **Password:** any strong password, saved in your password manager
   - Tick **Auto Confirm User**.
2. In the app, click **Continue with Google** and choose that Gmail account.
   You land on `/admin`, and **Users** appears in the sidebar.

From then on, invite other managers from **Admin → Users**. They can sign in
with Google if they were invited with their Gmail address. Otherwise they sign
in with the password they set from the invite email.
