# Employees (201 File) and Clients Modules — Design

Date: 2026-11-14
Status: Draft, awaiting approval
Builds on: `2026-11-13-foundation-design.md`, `2026-11-13-google-login-superadmin-design.md`

## Intent

circl. management needs one place for:

- **Employees:** each virtual assistant's **201 file**, the standard Philippine
  HR employee record. It holds personal details, government IDs, employment
  terms, payout details, emergency contact, education and documents.
- **Clients:** each client's company, contact, billing and engagement details,
  including which VAs are assigned to them.

These replace whatever spreadsheets or paper are used today, and they are the
first real data in the admin.

## Goals

- **Employees:** list, search, filter, view, create, edit and delete VA
  records, with every 201 field below, plus document uploads. NBI clearance
  gets an expiry date.
- **Clients:** list, search, filter, view, create, edit and delete client
  records, with multiple contacts, billing, engagement terms, assigned VAs and
  document uploads.
- **Linking:** a client record shows its assigned VAs, and an employee record
  shows the clients they're assigned to.

## Non-goals (later modules)

- Salary history, payroll, performance reviews, leave tracking
- Tasks or hours per client (the Projects module)
- Expiry alerts or email reminders. The NBI expiry is stored and shown, and
  flagged on screen if it has passed or is within 30 days, but nothing is
  sent.
- Import from existing spreadsheets
- Different access levels per manager

## Anti-goals

- Employee or client data readable with the public (browser) Supabase key.
- Uploaded documents reachable by a guessable or permanent public URL.
- Losing data without a confirmation step.

## Decisions made with the user

- **Fields:** as listed below (proposed by Claude, approved by "proceed").
- **Delete:** permanent, after a typed confirmation. No archive.
- **Rehire:** reactivates the same record, and keeps a list of past stints.
- **Access:** every manager can see and edit every employee and client field,
  including government IDs, payout details and documents (option A). Only
  superadmins manage users; that is unchanged.
- **Documents:** real file uploads.
- **Data access approach:** only the app's server touches the data (option A).
- **Sidebar:** the separate "HR" and "Employees" placeholders become one live
  **Employees** item. **Clients** is a new live item. "Services & Rates" and
  "Projects" stay as "Soon".

## Approaches considered (data access)

| Approach | Trade-off | Outcome |
|---|---|---|
| **Server-only:** every page and action checks for a manager, then uses the service-role client. Tables have RLS on with no policies, so the public key can do nothing. | Simple; works with dev mode (`AUTH_BYPASS`). The database trusts the server, so the manager check must live in one shared place. | **Chosen** |
| Each manager's session, plus RLS policies for `authenticated` | Adds a second lock inside the database, but dev mode shows empty data without a real sign-in, and it only pays off with per-manager access levels | Rejected |
| Ready-made admin builder (Refine / React Admin) | Fast plain CRUD, but fights the custom 201 sections, uploads and VA assignment | Rejected |

## Data model (Postgres, one migration per module)

Shared conventions for every table:

- `id uuid primary key default gen_random_uuid()`
- `created_at` and `updated_at timestamptz` (kept current by a trigger)
- `created_by` and `updated_by text`: the manager's email
- **Row-level security on, with no policies.** Only the service role can read
  or write.
- Choice fields are `text` with `check` constraints rather than Postgres
  enums, so adding an option is a one-line migration.
- Optional fields are nullable. Required fields are marked **(required)**.

### `employees`

| Column | Type / rule |
|---|---|
| `seq` | `integer generated always as identity`, unique |
| `employee_no` | `text generated always as ('CIRCL-' \|\| lpad(seq::text, 4, '0')) stored`, unique |
| `photo_path` | text (Storage path) |
| `first_name`, `last_name` | text **(required)** |
| `middle_name`, `suffix`, `nickname` | text |
| `birth_date` | date |
| `sex` | `male` / `female` |
| `civil_status` | `single` / `married` / `widowed` / `separated` / `annulled` |
| `nationality` | text, default `Filipino` |
| `personal_email` | text **(required)**, unique (case-insensitive) |
| `mobile` | text |
| `current_address`, `permanent_address` | text |
| `sss_no`, `philhealth_no`, `pagibig_no`, `tin` | text. Format checked in the app (see Validation). |
| `position` | text **(required)**, e.g. "General VA" (free text with suggestions) |
| `employment_type` | `full_time` / `part_time` / `project_based` **(required)** |
| `status` | `active` / `on_leave` / `resigned` / `terminated` **(required)**, default `active` |
| `date_hired` | date **(required)** |
| `date_separated` | date. Required when status is `resigned` or `terminated`; must be on or after `date_hired`. |
| `work_schedule` | text, e.g. "Mon–Fri 9pm–6am" |
| `timezone` | text, IANA name, default `Asia/Manila` |
| `rate` | numeric(12,2) ≥ 0 |
| `rate_basis` | `hourly` / `monthly`. Currency is always PHP. |
| `skills` | text[], free tags, e.g. "Canva", "GoHighLevel" |
| `payout_method` | text, e.g. "BDO", "GCash" (free text with suggestions) |
| `payout_account_name`, `payout_account_no` | text |
| `emergency_name`, `emergency_relationship`, `emergency_mobile` | text |
| `education_attainment` | `high_school` / `vocational` / `college_undergraduate` / `bachelors` / `masters` / `doctorate` |
| `education_school`, `education_course` | text |
| `notes` | text |

### `employee_documents`

| Column | Type / rule |
|---|---|
| `employee_id` | uuid, references `employees` (on delete cascade) **(required)** |
| `doc_type` | `resume` / `government_id` / `nbi_clearance` / `contract` / `nda` / `other` **(required)** |
| `label` | text, e.g. "UMID", "2026 contract" |
| `file_path` | text **(required)**: Storage path |
| `file_name`, `mime_type` | text; `size_bytes` int |
| `expires_on` | date. Shown for every type and prompted for NBI. |

Several documents of the same type are allowed, so renewals keep their
history. The NBI flag uses the latest `expires_on` among a person's NBI
clearances.

### `employment_history` (past stints of rehired VAs)

| Column | Type / rule |
|---|---|
| `employee_id` | uuid, references `employees` (on delete cascade) **(required)** |
| `date_hired` | date **(required)** |
| `date_separated` | date **(required)** |
| `separation_status` | `resigned` / `terminated` **(required)** |

**Rehire means reactivating the same record** (user's decision). One person
keeps one 201 file and one employee no., so `personal_email` stays unique
across all employees.

1. A manager edits a resigned or terminated employee and sets the status back
   to `active` or `on_leave`.
2. The form then requires a **new** `date_hired`.
3. On save, the server copies the old `date_hired`, `date_separated` and
   status into `employment_history`, and clears `date_separated`. This happens
   in one transaction, through a Postgres function.
4. The read view lists past stints under "Employment history".

### `clients`

| Column | Type / rule |
|---|---|
| `company_name` | text **(required)**, unique (case-insensitive) |
| `industry`, `website`, `country` | text |
| `timezone` | text, IANA name |
| `status` | `prospect` / `active` / `paused` / `ended` **(required)**, default `prospect` |
| `start_date` | date |
| `billing_email`, `billing_address` | text |
| `currency` | `USD` / `AUD` / `CAD` / `GBP` / `EUR` / `NZD` / `SGD` / `PHP`, default `USD` |
| `rate` | numeric(12,2) ≥ 0 |
| `rate_basis` | `hourly` / `monthly` |
| `billing_cycle` | `weekly` / `biweekly` / `monthly` |
| `payment_method` | text, e.g. "Wise", "PayPal" |
| `services` | text[], free tags |
| `hours_per_week` | numeric(5,1) ≥ 0 |
| `contract_start`, `contract_end` | date; end on or after start |
| `notes` | text |

### `client_contacts`

| Column | Type / rule |
|---|---|
| `client_id` | uuid, references `clients` (on delete cascade) **(required)** |
| `name` | text **(required)** |
| `role`, `email`, `phone` | text |
| `is_primary` | boolean, default false. A partial unique index allows at most one primary contact per client. |

### `client_documents`

Same shape as `employee_documents`, but with `client_id`. `doc_type` is
`contract` / `nda` / `sow` / `other`.

### `client_assignments` (VA ↔ client)

| Column | Type / rule |
|---|---|
| `client_id` | uuid, references `clients` (on delete cascade) |
| `employee_id` | uuid, references `employees` (on delete cascade) |
| | primary key (`client_id`, `employee_id`) |
| `assigned_on` | date, default today |

The picker offers only employees whose status is `active` or `on_leave`. If an
assigned employee later resigns, the assignment stays, and the employee is
shown as "Resigned" on the client record.

## Storage

- **One private bucket, `documents`.** Paths:
  - `employees/<employee_id>/<uuid>-<safe-file-name>`
  - `employees/<employee_id>/photo-<uuid>.<ext>`
  - `clients/<client_id>/<uuid>-<safe-file-name>`
- **Allowed files:** PDF, JPG, PNG and WEBP, up to **10 MB** each (the bucket
  enforces both). Photos: JPG, PNG or WEBP, up to 5 MB.
- **Uploads:**
  1. The server action checks for a manager.
  2. It creates a **signed upload URL**.
  3. The browser uploads the file directly to Storage. This avoids Vercel's
     4.5 MB request-body limit.
  4. A second server action records the document row.
- **Viewing:** a server action checks for a manager and returns a **signed
  download URL valid for 60 seconds**. The browser opens it in a new tab.
- **Deleting a document** removes the row and the stored file.
- **Deleting an employee or client** also removes their whole Storage folder.

## Server structure

- **`lib/data/db.ts`:** `withManager(fn)` runs `requireManager()` (which
  respects dev mode), throws `Unauthorized` if there is no manager, then calls
  `fn(adminClient, manager)`. Every data function and server action goes
  through it. It is the single choke point that makes server-only access safe.
- **One folder per module:** `lib/employees/` and `lib/clients/`, each with:
  - `schema.ts`: zod form schemas
  - `queries.ts`: list, get and the linked lookups
  - `labels.ts`: the human-readable text for each choice value
- **Server actions:** `app/admin/employees/actions.ts` and
  `app/admin/clients/actions.ts`. They return the existing `ActionResult` type,
  plus field errors.
- **Database types:** hand-written TypeScript row types in `lib/db-types.ts`,
  kept in step with the migrations. The builder may switch to
  `supabase gen types` instead, if the CLI is linked.

## Pages

| Route | What's there |
|---|---|
| `/admin/employees` | Table: employee no., name, position, status, date hired, assigned clients. Search by name, employee no. or email. Status filter (default: Active and On leave). 25 per page, newest hire first. "Add employee" button. |
| `/admin/employees/new` | The full form, in sections: Personal, Government IDs, Employment, Payout, Emergency contact, Education, Notes. Only the required fields block saving. |
| `/admin/employees/[id]` | Read view in the same sections, plus Photo, Documents (upload, list, open, delete), Assigned clients, and buttons for Edit and Delete. NBI expiry is shown in red if it has passed, and amber if it is within 30 days. |
| `/admin/employees/[id]/edit` | The same form, filled in |
| `/admin/clients` | Table: company, status, primary contact, number of assigned VAs, contract end. Search by company or contact name. Status filter (default: Prospect, Active, Paused). 25 per page, A–Z. |
| `/admin/clients/new` and `/[id]/edit` | Form: Company, Billing, Engagement, Notes, plus a Contacts editor (add, remove, mark primary). At least one contact is required. |
| `/admin/clients/[id]` | Read view, plus Contacts, Assigned VAs (add from the picker, remove), Documents, Edit, Delete |

- **Deleting is permanent** (user's decision; there is no archive). It removes
  the record, its linked rows and its Storage folder, after you type the
  employee no. or company name to confirm. The confirm dialog says this can't
  be undone, and suggests setting the status to Resigned or Terminated (or
  Ended) to keep the file instead.
- **Sensitive values:** government IDs and payout account numbers are masked on
  the read view (`••••5678`), with a "Show" toggle. Every manager can see them;
  this only stops people reading them over your shoulder.

## Validation

- **Government IDs and mobile numbers:** these rules apply when a value is
  entered; the fields are optional. Values are stored in the formatted form
  shown.
  - **SSS:** 10 digits, stored as `##-#######-#`
  - **PhilHealth:** 12 digits, stored as `##-#########-#`
  - **Pag-IBIG:** 12 digits, stored as `####-####-####`
  - **TIN:** 9 or 12 digits, stored as `###-###-###` or `###-###-###-###`
  - **Mobile (PH):** `09XXXXXXXXX` or `+639XXXXXXXXX`, stored as
    `+639XXXXXXXXX`. Client phones are free text, since they're international.
- Emails must be valid. Rates and hours can't be negative. End dates can't be
  before start dates.
- Duplicate personal emails or company names get a friendly field error, not a
  database error.

## Dev mode and data

On your computer, dev mode writes to the **same, live** Supabase project.
Test records created locally show up on the live site. They should be removed
afterwards. A separate development project is out of scope.

To make test records easy to find:

- Records created in dev mode get `created_by = 'dev-mode@localhost'`, the dev
  identity.
- Both lists show a small **"Dev"** badge on those rows.
- Both lists get a **"Created in dev mode"** filter, so test data can be found
  and deleted.

## Applying migrations

The SQL lives in `supabase/migrations/`. The user applies it to the live
project in one of two ways:

- `npx supabase login`, then `npx supabase link --project-ref yjtqwoljbihvljlejual`,
  then `npx supabase db push`. This needs the database password.
- Or paste each file into the Supabase **SQL Editor** and run it.

Claude cannot apply it without the user's Supabase login.

## Done when

- **Locally, in dev mode:**
  - An employee with every section filled in, plus an NBI clearance upload with
    expiry, can be created, viewed, edited and deleted.
  - A client with 2 contacts, 1 assigned VA and a contract upload can be
    created, viewed, edited and deleted.
  - Each record's links show on the other side.
- **On the live site, after the migrations are applied and the code is pushed:**
  - Signed-in managers see the same data.
  - Signed-out visitors are redirected to the login page.
  - A direct REST call with the public key returns no rows.
- **Checks:** unit tests cover the validators, formatters and `withManager`.
  The build passes.

## Settled during the builder check (Claude's calls)

- **Uploads after the first save:** photo and document uploads appear once the
  record has been saved, because their Storage paths need the record's id.
- **Client and contacts saved together:** creating or editing a client with
  its contacts happens in one transaction, through a Postgres function, so a
  half-saved client can't exist.
- **Migration order:** `employees` (with `employee_documents` and
  `employment_history`) comes first. Then `clients` (with `client_contacts`,
  `client_documents` and `client_assignments`).
- **Primary contact:** if no contact is marked primary, the first one becomes
  primary on save.

## Left to the builder

- Exact layout, styling and form controls, kept to the existing shadcn/Tailwind
  look.
- Suggestion lists for position, payout method and services.
- Whether forms use `useActionState` or a form library. Default:
  `useActionState` plus zod. No new form library.
