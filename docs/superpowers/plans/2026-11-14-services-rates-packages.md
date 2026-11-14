# Services & Rates and Package Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A catalog of services with one level of subservices, plus an
Entry/Intermediate/Expert rate grid (client and VA rates, USD per hour) and
package templates built by a priced-line builder.

**Architecture:**
- One migration adds the services, rates, packages and package lines tables,
  the one-level trigger, and the `save_service_rates` and `save_package`
  functions.
- All server work goes through `withManager`.
- Pricing is done in pure functions, shared by the server (list totals) and
  the client (live builder totals).
- The UI is built from the redesign kit.

**Spec:** `docs/superpowers/specs/2026-11-14-services-rates-packages-design.md`

## Global Constraints

- **Access:** RLS on, with no policies. Both functions are revoked from `anon`
  and `authenticated`.
- **Units:** money is USD. Rates are per hour; package amounts are per month.
- **Tiers:** exactly `entry`, `intermediate`, `expert`.
- **Hierarchy:** one level only. Rates and package lines may only point at
  priceable services, meaning services with no children.
- **Saving:** last write wins. Deleting a service is blocked while it has
  children or is used in a package line.

## Review Focus

1. Dividing by zero in the totals (zero amount, or a zero standard value):
   return `null` for the percentages. (pricing tests)
2. A tier with only one side filled in: field error. (schema test)
3. The same service and tier added twice to one package: field error.
   (schema test)
4. A trigger bypass through `parent_id` updates, such as making a parent the
   child of its own child, or nesting two levels deep. (PGlite test)
5. Effective active state when the parent is archived. (pricing/catalog test)

### Task 1: Migration and its SQL test

- **File:** `supabase/migrations/20261114000003_services_packages.sql`.
- **PGlite test script** (scratchpad) checks:
  - nesting two levels is rejected
  - a parent with rates can't get children
  - a parent used in a package can't get children
  - a service with children can't be moved under another
  - names are unique among siblings, ignoring case
  - deleting a service fails while a package uses it, and deleting it removes
    its rates
  - `save_package` inserts, then replaces the lines, and rolls back when a
    line points at an unpriceable service or when there are 0 lines
  - `save_service_rates` upserts, and deletes a tier when both rates are
    empty
  - RLS, the revoked grants
- **Commit:** `feat(db): services, rates and packages schema`.

### Task 2: Pricing and schemas

- **`lib/services/pricing.ts`:** `rateMargin`, `lineTotals`, `packageTotals`,
  `effectiveActive`.
- **`lib/services/schema.ts`:** `parseServiceForm`, `parseRatesForm`,
  `parsePackageForm`.
- **Tests:** the Review Focus items 1–3 and 5, plus the totals worked out by
  hand from the spec's "Starter Admin" example.
- **Commit:** `feat: service pricing and validation`.

### Task 3: Queries and actions

- **`lib/services/queries.ts`:**
  - `getCatalog({ includeArchived })` returns the tree of services, each with
    rates, a `usedInPackages` count, `childCount` and the effective active
    flag.
  - `listPackages({ q, status, sort })` returns rows with totals calculated
    by `packageTotals`.
  - `getPackage(id)` returns the package with its lines and rates.
  - `priceableServices()` returns the line picker options.
- **`app/admin/services/actions.ts`:** `saveService`, `moveService`,
  `setServiceActive`, `deleteService`, `saveRates`, `clearRates`,
  `savePackage`, `duplicatePackage`, `setPackageActive`, `deletePackage`.
  - Each returns a `FormState` or a result object.
  - Each maps `23505`, `23503` and trigger errors to friendly messages.
- **Nav:** "Services & Rates" is enabled.
- **Commit:** `feat: services data layer and actions`.

### Task 4: Catalog UI

- **Pages:** `/admin/services`, with segmented tabs, service cards, the rate
  table, the Add/Edit service dialog, the Edit rates dialog and the row menus.
- **Checks:** in the browser with dev data, at 375 / 1440 px, light and dark.
- **Commit:** `feat(ui): services catalog and rate grid`.

### Task 5: Packages UI

- **Pages:**
  - `/admin/services/packages`: list with search, status filter, sort and row
    menu.
  - `/new` and `/[id]`: the builder (lines editor, live totals aside, sticky
    actions).
- **Checks:** the browser flows from the spec's "Done when".
- **Commit:** `feat(ui): package builder`.

### Task 6: Verify and review

- **Checks:** test, tsc, lint and build. Clean up the dev test records.
- **Review:** a fresh reviewer, then fix the Important findings.
