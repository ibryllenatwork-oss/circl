# Employees (201) and Clients Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Employees (the VA 201 file) and Clients modules in `/admin`, with
document uploads, VA ↔ client assignment, and rehire history.

**Architecture:**
- Server-only data access. Every query and action goes through `withManager`
  (it uses `requireManager`, which respects dev mode), then uses the
  service-role client.
- Tables have RLS on with no policies.
- The two transactional writes (rehire, and saving a client with its contacts)
  are Postgres functions called with `rpc`.
- Files go to the private `documents` bucket, through signed upload and
  download URLs.

**Tech Stack:** Next.js 16 App Router (cacheComponents), supabase-js 2.119,
zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-employees-clients-design.md`

## Global Constraints

- **No public-key access:**
  - Never query employee or client tables with `lib/supabase/server.ts` or
    `lib/supabase/client.ts`.
  - Only `lib/data/db.ts → withManager` uses `createAdminClient`, apart from
    `app/admin/users`.
- **RLS:** every new table has RLS enabled, with no policies.
- **Postgres functions:** `revoke execute ... from public, anon, authenticated`.
- **Uploads:** 10 MB, PDF, JPG, PNG or WEBP for documents. 5 MB, JPG, PNG or
  WEBP for photos.
- **Signed download URLs:** 60 seconds.
- **Lists:** 25 per page.
- **Choice values:** exactly as listed in the spec tables.
- **Deletes:** permanent, after a typed confirmation of the employee no. or
  company name.

## Review Focus

1. A government ID with dashes, spaces or the wrong digit count. It must
   normalize, or give a field error. (Task 1 tests)
2. A mobile number written `0917…`, `+63917…` or `63917…`. It normalizes to
   `+639…`, and other inputs are rejected. (Task 1 tests)
3. A duplicate personal email or company name, in any case. It gives a
   friendly field error, not a 500. (Tasks 3 and 6, via the `23505` mapping
   test)
4. Rehire: a status change from Resigned to Active without a new hire date is
   refused. With one, it moves the old stint into history. (Task 3 schema test)
5. Uploading a file that is too large or the wrong type. It is rejected before
   the upload. (Task 5 test)

---

### Task 1: Shared foundation

**Files:**
- Create: `lib/data/db.ts`, `lib/data/db.test.ts`
- Create: `lib/validation/ph.ts`, `lib/validation/ph.test.ts`
- Create: `lib/db-types.ts`
- Modify: `lib/admin/nav.ts` and its test
- Run: `npm i zod`

**Produces:**
- `withManager<T>(fn: (db: SupabaseClient, me: Manager) => Promise<T>): Promise<T>`.
  Throws `UnauthorizedError` when there is no manager.
- In `lib/validation/ph.ts`:
  - `formatSSS(v)`, `formatPhilHealth(v)`, `formatPagIbig(v)`, `formatTIN(v)`,
    `formatPHMobile(v)`. Each returns the formatted string, or `null` if the
    value is invalid.
  - zod helpers: `optionalSSS`, `optionalPhilHealth`, `optionalPagIbig`,
    `optionalTIN`, `optionalPHMobile`. Blank input becomes `null`.
  - `uniqueViolationField(err, map): string | null`, which maps a Postgres
    `23505` error to a field name.
- `ADMIN_NAV`, in order:
  - Dashboard, Users (superadmin only) and Employees, all enabled
  - Clients, enabled
  - Services & Rates and Projects, disabled

  HR is removed.

**Tests:**
- **SSS:** `"3412345678"` and `"34-1234567-8"` both become `"34-1234567-8"`.
  `"123"` becomes `null`.
- **PhilHealth:** 12 digits become `##-#########-#`.
- **Pag-IBIG:** 12 digits become `####-####-####`.
- **TIN:** 9 digits become `###-###-###`, 12 digits become `###-###-###-###`,
  and 10 digits become `null`.
- **Mobile:** `"09171234567"`, `"+639171234567"`, `"639171234567"` and
  `"0917 123 4567"` all become `"+639171234567"`. `"0817…"` and `"12345"`
  become `null`.
- **`withManager`:** throws when the mocked `requireManager` returns null, and
  passes `me` and the db through otherwise.
- **`uniqueViolationField`:** `{code:"23505", message:"...employees_personal_email_key..."}`
  maps to `"personal_email"`, and other errors map to `null`.
- **Nav:** the test is updated for the new order.

**Commit:** `feat: shared data guard, PH validators, nav for Employees/Clients`

### Task 2: Migrations

**Files:**
- Create: `supabase/migrations/20261114000001_employees.sql`
- Create: `supabase/migrations/20261114000002_clients.sql`

**Contents, following the spec's data model:**
- `set_updated_at()` trigger function.
- Tables, `check` constraints, and case-insensitive unique indexes on
  `lower(personal_email)` and `lower(company_name)`.
- The generated `employee_no`.
- The partial unique index on `client_contacts (client_id) where is_primary`.
- `alter table ... enable row level security` on every table.
- The `documents` bucket, inserted into `storage.buckets` with
  `public=false`, a 10485760-byte limit and the 4 allowed MIME types, using
  `on conflict do nothing`.
- Functions:
  - `rehire_employee(p_employee_id uuid, p_date_hired date, p_status text, p_updated_by text)`:
    inserts into `employment_history` from the current row, then sets
    `date_hired`, clears `date_separated` and sets the status. It raises an
    error if the employee isn't currently resigned or terminated.
  - `save_client(p_client jsonb, p_contacts jsonb, p_actor text) returns uuid`:
    upserts the client, then replaces the contacts in the same transaction. If
    none is marked primary, the first contact becomes primary.
- Both functions run `revoke execute on function ... from public, anon, authenticated`.

**Verify:** use `npx supabase db lint`, if it works without linking.
Otherwise, review the SQL by eye.

**The user applies it:** paste both files into the SQL Editor in order, or run
`npx supabase db push`.

**Commit:** `feat(db): employees and clients schema, documents bucket`

### Task 3: Employees data and actions

**Files:**
- Create: `lib/employees/schema.ts` and its test
- Create: `lib/employees/labels.ts`
- Create: `lib/employees/queries.ts`
- Create: `app/admin/employees/actions.ts`

**Produces:**
- `employeeFormSchema`: zod, with every field from the spec. Rules:
  - `date_separated` is required when the status is resigned or terminated,
    and must be on or after `date_hired`.
  - `skills` comes from a comma-separated string, as `string[]`.
- `parseEmployeeForm(formData): { ok: true; data } | { ok: false; fieldErrors }`.
- `isRehire(prevStatus, nextStatus): boolean`.
- `listEmployees({ q, statuses, devOnly, page })` returns
  `{ rows, total }`. Search uses `ilike` on first name, last name,
  employee_no and personal email, or-ed together.
- `getEmployee(id)` returns the employee with its documents, history and
  assigned clients.
- Actions:
  - `createEmployee(prev, formData)` returns `ActionResult & { fieldErrors?, id? }`.
  - `updateEmployee(id, prev, formData)`. When `isRehire` is true, it calls
    the `rehire_employee` rpc, then updates the remaining fields.
  - `deleteEmployee(id, confirmText)`: the confirm text must equal the
    `employee_no`. It removes the `employees/<id>/` Storage files first.

**Tests:**
- Required fields are missing → `fieldErrors` names `first_name`,
  `last_name`, `personal_email`, `position`, `employment_type` and
  `date_hired`.
- `status=resigned` without `date_separated` → an error.
- `date_separated` before `date_hired` → an error.
- IDs normalize, for example SSS `3412345678` → `34-1234567-8`.
- `isRehire("resigned","active")` is true. `isRehire("active","on_leave")` is
  false.
- Rehire without a changed `date_hired` → an error on `date_hired`
  (checked with `parseEmployeeForm(fd, { previous })`).

**Commit:** `feat: employees data layer and actions`

### Task 4: Employees pages

**Files:**
- `app/admin/employees/page.tsx`
- `app/admin/employees/new/page.tsx`
- `app/admin/employees/[id]/page.tsx`
- `app/admin/employees/[id]/edit/page.tsx`
- `components/employees/employee-form.tsx`
- `components/employees/employee-view.tsx`
- `components/admin/masked-value.tsx`
- `components/admin/confirm-delete.tsx`
- `components/admin/list-controls.tsx`: search, status chips, the dev filter
  and pagination, all through URL search params

**Rules:**
- Dynamic reads go inside `<Suspense>`.
- `params` and `searchParams` are awaited inside the Suspense child.

**Verify:**
- `npm run build`.
- After the migrations are applied, in the browser pane, in dev mode: create,
  view, edit and rehire a test employee.

**Commit:** `feat: employees pages`

### Task 5: Documents and photos (shared)

**Files:**
- Create: `lib/documents/rules.ts` and its test
- Create: `lib/documents/actions.ts`
- Create: `components/admin/documents-panel.tsx`
- Create: `components/employees/photo.tsx`

**Produces:**
- `validateUpload({ size, type }, kind: "document" | "photo"): string | null`,
  which returns an error message or null.
- `safeFileName(name): string`
- `storagePath(owner: "employees" | "clients", ownerId, fileName): string`
- Actions:
  - `createUploadUrl(owner, ownerId, fileName, size, type)` returns
    `{ path, token }`.
  - `recordDocument(owner, ownerId, meta)`
  - `documentDownloadUrl(owner, docId)` returns a 60-second signed URL.
  - `deleteDocument(owner, docId)`
  - `setEmployeePhoto(employeeId, path)`
  - `employeePhotoUrl(employeeId)`

The browser uploads with `supabase.storage.from("documents").uploadToSignedUrl(path, token, file)`,
using the browser client and the signed token.

**Tests:**
- **`validateUpload`:** an 11 MB PDF, a `.docx`, and a 6 MB photo each return
  an error. A 2 MB PDF returns null.
- **`safeFileName`:** `"NBI clearance (1).PDF"` becomes
  `"nbi-clearance-1.pdf"`.
- **`storagePath`:** the result starts with `employees/<id>/`.

**Commit:** `feat: document and photo uploads`

### Task 6: Clients data, actions, pages, assignments

**Files:**
- `lib/clients/schema.ts` and its test
- `lib/clients/labels.ts`
- `lib/clients/queries.ts`
- `app/admin/clients/actions.ts`
- `app/admin/clients/` pages: list, new, `[id]`, `[id]/edit`
- `components/clients/client-form.tsx`, including the contacts editor
- `components/clients/client-view.tsx`
- `components/clients/assign-va.tsx`

**Produces:**
- `parseClientForm(formData)` parses the client fields plus a `contacts` JSON
  string.
- Actions:
  - `saveClient(id | null, prev, formData)`, which calls the `save_client` rpc.
  - `deleteClient(id, confirmText)`
  - `assignEmployee(clientId, employeeId)`
  - `unassignEmployee(clientId, employeeId)`
- The picker lists active and on-leave employees not already assigned.
- `getEmployee` also returns assigned clients, for the employee page.

**Tests:**
- `company_name` is required, and at least 1 contact is required.
- A contact without a name → an error.
- `contract_end` before `contract_start` → an error.
- An invalid currency → an error.
- Two contacts marked primary → an error.

**Commit:** `feat: clients module with contacts and VA assignment`

### Task 7: Verify, docs, review

- **README:** add the modules and how to apply migrations.
- **Browser pane, in dev mode:**
  - The full flows from the spec's "Done when".
  - A REST call with the publishable key to `/rest/v1/employees` returns no
    rows.
  - Delete the test data afterwards.
- **Final whole-branch review:** a fresh reviewer, then fix any Critical or
  Important findings.
- **Push:** the user pushes, or allows `git push`. Then verify on the live
  site.
