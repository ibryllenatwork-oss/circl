# Services & Rates and Package Builder — Design

Date: 2026-11-14
Status: Draft, awaiting approval
Builds on: the admin redesign (design system, shell, kit), and server-only data access through `withManager`

## Intent

circl. needs one source of truth for **what it sells and at what price**:

- a catalog of services, each with optional subservices
- for each service, the hourly rate the **client pays** and the hourly rate
  the **VA is paid**, at three skill tiers: **Entry**, **Intermediate** and
  **Expert**
- reusable **package templates** that bundle services at a tier and a number
  of hours, with a package amount the manager sets

Managers use it to quote clients consistently and to see the margin on every
rate and package.

## Decisions made with the user

- **Rates:** hourly, with **both sides in USD**. The margin is client rate
  minus VA rate.
- **Hierarchy:** **one level**, service → subservices.
- **Packages:** **reusable templates**.
- **Package lines:** each line is a service, a tier and hours per month. The
  manager types the package amount by hand. The builder shows the value at
  standard rates, the VA cost, the discount and the margin, updating as you
  type.
- **No client assignment yet.** Linking packages to clients comes later.

## Goals

- **Catalog:**
  - Add, rename, reorder, describe and archive or restore services and
    subservices.
  - Delete a service only if no package uses it.
- **Rate grid:** for each priceable service, Entry, Intermediate and Expert,
  each with a client rate, a VA rate, and the margin in dollars and percent.
- **Package templates:**
  - List them.
  - Create, edit, duplicate, archive or restore, and delete them.
  - A builder with priced lines and live totals.
- **Navigation:** the existing "Services & Rates" sidebar item goes live. It
  has two tabs: **Catalog** and **Packages**.

## Non-goals

- Assigning packages to clients. The clients' existing free-text `services`
  field and agreed rate stay as they are.
- Currencies other than USD, exchange rates, and showing VA pay in PHP.
- Invoices, billing runs, quotes or PDFs.
- Rate history or effective dates. The current rate is the only rate.
- Different access per manager. All managers can view and edit, as in the
  other modules.

## Anti-goals

- A package whose numbers silently disagree with the rates. The totals are
  always calculated from the current rates.
- Deleting a service that a package depends on.
- Rates entered on a service that also has subservices, which would make it
  unclear which rate applies.

## Data model

There is one migration: `supabase/migrations/20261114000003_services_packages.sql`.

**Conventions:** the same as the other tables:

- uuid primary key
- `created_at` / `updated_at` (with the trigger), plus `created_by` /
  `updated_by` emails
- RLS on with no policies (server-only access)
- choice fields as `text` with a `check` constraint

### `services`

| Column | Type / rule |
|---|---|
| `parent_id` | uuid, references `services` (on delete restrict); null means top-level |
| `name` | text **(required)**, unique among siblings (case-insensitive) |
| `description` | text |
| `position` | integer, default 0 (order among siblings) |
| `active` | boolean, default true |

**Trigger `services_one_level`:**

- A service's parent must itself be top-level (`parent.parent_id is null`).
- A service that has children can't be given a parent.
- A service that has rates can't receive children.

**Uniqueness index:** `(coalesce(parent_id, '00000000-…'), lower(name))`.

### `service_rates`

| Column | Type / rule |
|---|---|
| `service_id` | uuid, references `services` (on delete cascade) |
| `tier` | `entry` / `intermediate` / `expert` |
| `client_rate` | numeric(10,2) ≥ 0, USD per hour **(required)** |
| `va_rate` | numeric(10,2) ≥ 0, USD per hour **(required)** |
| | primary key (`service_id`, `tier`) |

**A service is "priceable"** when it has no children. Rates can only be set
on priceable services; the trigger above enforces this from both directions.

**Partial rate sets are allowed.** A service may have only an Entry rate, for
example. The grid shows the missing tiers as "—".

**When the VA rate is higher than the client rate,** the app allows it but
shows the negative margin in red. It isn't blocked, because a loss-leader
might be deliberate.

### `packages`

| Column | Type / rule |
|---|---|
| `name` | text **(required)**, unique (case-insensitive) |
| `description` | text |
| `monthly_amount` | numeric(12,2) ≥ 0, USD per month **(required)** |
| `active` | boolean, default true |
| `notes` | text |

### `package_lines`

| Column | Type / rule |
|---|---|
| `package_id` | uuid, references `packages` (on delete cascade) |
| `service_id` | uuid, references `services` (on delete **restrict**). It must be priceable when saved. |
| `tier` | `entry` / `intermediate` / `expert` |
| `hours_per_month` | numeric(6,1) > 0 and ≤ 744 |
| `position` | integer |

**Uniqueness:** the same service at the same tier can't appear twice in one
package, so the hours are combined instead.

**Lines whose rate is missing** (no rate set for that service at that tier)
can be saved. Each such line shows "rate missing", and the totals say they're
incomplete.

### Functions

- **`save_package(p_package jsonb, p_lines jsonb, p_actor text) returns uuid`:**
  inserts or updates the package and replaces its lines, all in one
  transaction. It is the same pattern as `save_client`. It raises an error
  when a line's service isn't priceable, and requires at least one line.
- **`save_service_rates(p_service_id uuid, p_rates jsonb, p_actor text)`:**
  upserts the 3 tiers. A tier whose client and VA rates are both empty is
  deleted.

Both functions are revoked from `anon` and `authenticated`.

## Calculations

Pure functions in `lib/services/pricing.ts`, unit-tested:

- `lineValue(rate, hours)`: `client_rate × hours`
- `lineCost(rate, hours)`: `va_rate × hours`
- `packageTotals(lines, rates, amount)` returns:
  - `standardValue`: sum of the line values
  - `vaCost`: sum of the line costs
  - `amount`
  - `discount`: `standardValue − amount`
  - `discountPct`: `discount / standardValue`, or `null` when the value is 0
  - `margin`: `amount − vaCost`
  - `marginPct`: `margin / amount`, or `null` when the amount is 0
  - `hours`: total hours
  - `missingRates`: the number of lines without a rate
- `rateMargin(client, va)` returns `{ amount, pct }`, where `pct` is
  `margin / client`, or `null` when the client rate is 0.
- **Rounding:** money is rounded to cents only for display; calculations keep
  full precision. Percentages show one decimal place.

## Pages and UI

Everything is built from the existing design kit: `PageHeader`, cards,
`TableCard`, badges, dialogs, toasts and `EmptyState`.

### `/admin/services`, the Catalog tab

- **Header:** "Services & Rates", with tabs **Catalog** | **Packages** (links
  styled as segmented tabs) and an **Add service** button.
- **Filter:** "Show archived" (shown as a chip toggle).
- **One card per top-level service**, in position order:
  - **Card header:** the name, the description in muted text, and an
    "Archived" badge if archived. A menu (`⋯`) offers Edit, Add subservice,
    Move up/down, Archive/Restore and Delete. Delete is disabled with a
    tooltip when the service is used in a package or has subservices.
  - **Card body, a rate table:** one row per priceable item. That is each
    subservice, or the service itself when it has no subservices.
  - **Columns:** Item | Entry | Intermediate | Expert | (actions).
  - **Each tier cell** shows the client rate `$12.00` over the VA rate `$7.00`
    in muted text, plus a margin chip (`+$5.00 · 41.7%`). The chip is
    neutral, or red when negative. A missing tier shows "—".
  - **Row actions:** Edit rates (a dialog), Edit / Archive / Delete for
    subservices.
- **Edit rates dialog:** three rows (Entry, Intermediate, Expert), each with
  client $/hr and VA $/hr inputs and the margin calculated as you type.
  Saving calls `save_service_rates`.
- **Add / Edit service dialog:**
  - Fields: name, description, and a parent selector (none means top-level).
  - Only top-level services can be chosen as parents, and never one that has
    rates. Those are disabled, with "has rates" shown next to them.
- **Mobile:** each tier stacks under the item name instead of in columns.

### `/admin/services/packages`, the Packages tab

- **Table:** Package | Hours/mo | Amount/mo | Margin | Status.
  - The status badge shows **Active** or **Archived**, and "Incomplete" when
    rates are missing.
  - It is sortable by name and by amount.
  - Search by name, and filter Active, Archived or all.
- **Row menu:** Open, Duplicate (copies into the builder as "Copy of …"),
  Archive/Restore, Delete (with a confirmation dialog, since nothing depends
  on a package yet).
- **Empty state:** "No packages yet. Build your first package."

### `/admin/services/packages/new` and `/[id]`, the Package builder

**Left: the form, in cards.**

- **Details:** name, description, notes, active.
- **Lines:** a list of rows, each with:
  - a service select, grouped by parent, listing only active priceable
    services
  - a tier select
  - hours per month
  - read-only cells: rate (client / VA), value and cost
  - remove

  Below the rows are "Add line" and a quick "Add service…" shortcut.
- **Package amount:** a USD input. Next to it, a "Use standard value" button
  copies the standard value into the amount.

**Right: the totals panel.** It is sticky in a side column from 1280 px wide,
and sits below the form on narrower screens.

- The panel shows:
  - total hours
  - standard value
  - your amount
  - discount, in dollars and percent (shown as a premium when negative)
  - VA cost
  - **margin, in dollars and percent**, large, red when negative
- If any lines are missing rates, the panel shows "Rates missing on N lines.
  Totals are incomplete."
- The numbers update live, on the client, using the rates loaded with the
  page.

**Save:** goes through the `save_package` action, then redirects with
`?saved=1` and shows the toast. Validation errors appear inline, with focus
moving to the first error.

**Sticky action bar:** Cancel / Save package.

### Navigation

`ADMIN_NAV` "Services & Rates" becomes `enabled: true` at `/admin/services`.
It is active on `/admin/services/*`.

## Validation (zod, in `lib/services/schema.ts`)

- **Service:** name is required (max 120 characters). The parent, if given,
  must be a uuid.
- **Rates:** each value is blank or a number ≥ 0 and ≤ 10,000. Within a tier,
  both sides must be filled or both left blank.
- **Package:**
  - name is required
  - amount is required, ≥ 0 and ≤ 1,000,000
  - at least 1 line, at most 50
  - every line has a service, a tier, and hours that are > 0 and ≤ 744
  - no duplicate service + tier pairs
- **Database errors become field errors:**
  - Duplicate service name (`23505`): "A service with this name already
    exists here."
  - Duplicate package name: "A package with this name already exists."
  - The FK restrict on delete becomes "This service is used in N packages.
    Archive it instead."

## Done when

- In dev mode, in the browser:
  - Create "Administrative support" with the subservices "Email management"
    and "Calendar management", plus a standalone "Bookkeeping".
  - Set rates for all three tiers on each priceable item.
  - The grid shows the right margins.
  - Adding a subservice to "Bookkeeping" once it has rates is blocked with a
    clear message.
  - Build "Starter Admin": Email management, Intermediate, 40 h, plus Calendar
    management, Entry, 20 h. The amount is $X, and the totals match a hand
    calculation.
  - Duplicate it, archive the copy, then delete it.
  - Archiving a service hides it from the line picker. A service used in a
    package can't be deleted.
- Unit tests cover the pricing functions, the zod schemas and the hierarchy
  rules. The SQL is checked in PGlite: the one-level trigger, the rates-vs-
  children rule, FK restrict, and the `save_package` transaction.
- Checks pass: test, tsc, lint and build. The page works at 375, 768 and
  1440 px in light and dark.
- The migration is applied by the user (`npx supabase db push --linked`).

## Settled during the builder check (Claude's calls)

1. **Splitting a priced service.** A service can't get subservices while it
   has rates **or** is used in any package line. The trigger checks both
   `service_rates` and `package_lines`. The UI blocks it with a message:
   "Remove this service's rates (and take it out of packages) before adding
   subservices." The Edit rates dialog has a **Clear all rates** button.
   There is no automatic way to move the rates over.
2. **Archived services in existing packages.**
   - Lines keep their service and current rates, and still count in the
     totals.
   - The line shows an "Archived" badge. The package list shows a "Needs
     review" badge.
   - The line picker won't offer archived services for new lines, but
     existing archived lines can be saved unchanged.
   - Duplicate copies them as they are.
3. **Missing rates.**
   - Totals and margins are calculated on the lines that have rates, and
     marked "Incomplete".
   - The package list joins the current rates and calculates hours, value,
     cost and margin each time it loads, using the same `packageTotals`
     function.
4. **Archiving a parent.**
   - The children's own `active` flags don't change.
   - A child counts as **effectively active** only when it and its parent are
     both active. The picker and "Needs review" use that.
   - Restoring a child under an archived parent is allowed. The catalog then
     shows it as "Parent archived".
5. **Ordering.**
   - `services.position` orders siblings within one parent.
   - `package_lines.position` follows the order lines appear in the builder.
     There's no reorder control: remove a line and add it again.
6. **Deleting.**
   - A service with any children can't be deleted, archived ones included.
     Delete the children first.
   - Deleting a service also deletes its rates. The confirmation dialog says
     so.
   - A service used in a package line can't be deleted (FK restrict, shown as
     a friendly message).
7. **Concurrency.** The last save wins, the same as Clients and Employees.
   There is no version check.
8. **Duplicate** copies every line exactly, including archived or unpriced
   ones, so the copy matches the original.

## Left to the builder

- Exact styling of the margin chips and the segmented tabs, within the
  design kit.
- Whether reordering uses up/down buttons (the default) or drag and drop.
