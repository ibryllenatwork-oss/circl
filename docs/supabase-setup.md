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

## 6. Invite the first manager (you)

1. Go to **Authentication → Users → Add user → Send invitation**, and enter
   your email.
2. Open the email and click the link. Set your password. You land on `/admin`.

After this, invite other managers from **Admin → Users** in the app.
