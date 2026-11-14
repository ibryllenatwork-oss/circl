# Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every admin page moves onto one circl.-branded design system (light
and dark), with a new shell, dashboard, sortable tables, a row preview panel,
dialogs, toasts and responsive layouts. No data or permission behavior
changes.

**Architecture:**
- Retheme the shadcn HSL tokens in `app/globals.css` and `tailwind.config.ts`.
- Add Radix-based primitives: dialog, sheet, tooltip and skeleton.
- Add a small admin kit in `components/admin/`.
- Pages keep their data calls and server actions. Only the `?saved=1`
  redirects change.

**Spec:** `docs/superpowers/specs/2026-11-14-admin-redesign-design.md`

## Global Constraints

- **Colors:** only through tokens (`bg-background`, `text-primary`, ...). No
  raw hex in components, except the sidebar gradient tokens.
- **Font:** Inter through `next/font/google`.
- **Radius:** 14 px for cards, 10 px for controls.
- **Icons:** Lucide, 18 px.
- **Unchanged behavior:** Users stays superadmin-only, Soon items stay
  disabled, and the dev badge, filters, masking, typed confirmation and expiry
  badges all stay.
- **Breakpoints:** `sm` 640, `lg` 1024, `xl` 1280. The right panel appears
  only at `xl` and up.

## Review Focus

1. **`?sort` / `?dir` / `?view` are attacker-controlled.** Unknown values fall
   back to the defaults. (`parseSort` tests)
2. **Sorting combined with paging stays stable.** There is always a
   tiebreaker. (`parseSort` returns the full order list, tested)
3. **Greeting at Manila midnight and noon boundaries.** (`greeting` tests)
4. **Contrast:** token pairs meet AA 4.5:1 in both themes. (`contrast` test)
5. **Keyboard:** dialogs trap focus and close on Esc; the drawer the same.
   This comes from Radix and is checked in the browser.

---

### Task 1: Tokens, font, badge tones, helpers

- **`lib/admin/sort.ts`:** `parseSort(raw: { sort?: string; dir?: string }, spec)`.
  - Returns `{ key, dir, order: { column, ascending }[] }`.
  - Specs, with defaults:
    - Employees: `name`, `no`, `position`, `status`, `hired` (default hired,
      descending)
    - Clients: `company` (default ascending), `status`, `contract_end`
  - Tiebreakers: `seq` for employees, `id` for clients.
- **`lib/admin/greeting.ts`:** `greeting(date: Date): "Good morning" | "Good afternoon" | "Good evening"`,
  in Manila time. Boundaries: before 12:00, before 18:00, otherwise evening.
- **`lib/design/contrast.ts`:** `contrastRatio(hexA, hexB)`. Its test asserts
  the token pairs from the spec are at least 4.5, adjusting the token values
  until they pass. The final hex values live in `lib/design/tokens.ts` and are
  mirrored into `globals.css` as HSL.
- **`globals.css` and `tailwind.config.ts`:**
  - Light and dark tokens.
  - Sidebar and brand colors.
  - `shadow-card`.
  - Radius tokens.
  - Inter set in `app/layout.tsx`.
- **`components/ui/badge.tsx`:** add tones: success, pending, processing,
  error, neutral and brand. `StatusBadge` maps statuses to tones as the spec
  says.
- **Tests:** `parseSort` (default, valid, unknown key, bad dir, tiebreaker
  present), `greeting` (11:59 / 12:00 / 17:59 / 18:00 Manila), contrast pairs.
- **Commit:** `feat(ui): circl. design tokens, Inter, badge tones, sort/greeting helpers`

### Task 2: Primitives and shell

- **Run:** `npm i @radix-ui/react-dialog @radix-ui/react-tooltip`.
- **New in `components/ui/`:** `dialog`, `sheet`, `tooltip`, `skeleton`,
  `separator`.
- **Restyle:** `button`, `input` and `card` to the new tokens. Add the button
  variants `secondary` and `ghost`.
- **`components/admin/`:**
  - `app-sidebar.tsx` (client): collapse toggle sets the `sidebar_state`
    cookie; tooltips when collapsed; logo; uses `visibleNav`; active marker.
  - `admin-header.tsx`: mobile menu button opening the `Sheet` with the same
    nav; search form posting to `/admin/search`; Manila date; `UserMenu`.
  - `user-menu.tsx` (client): `DropdownMenu` with email, role, theme radio and
    sign out (hidden in dev mode).
  - `admin-shell.tsx`: reads the cookie and lays out sidebar, header, main and
    an optional aside slot.
- **Logo:** `public/brand/circl-mark.png`.
- **Commit:** `feat(ui): admin shell with collapsible sidebar, header, user menu`

### Task 3: Kit, dashboard, search, states

- **Components:** `page-header`, `stat-card`, `aside-panel`, `empty-state`,
  `toast` (reads `?saved=1`, then `router.replace` to drop it), `skeletons`,
  and the `data-table` pieces (`SortHeader`, `RowLink` with the `matchMedia`
  check, `RowActions`).
- **`lib/dashboard/queries.ts`:** `dashboardCounts()` runs 4 head-count
  queries through `withManager`.
- **Pages:**
  - `/admin`: greeting, 4 stat cards, and the quick-actions aside.
  - `/admin/search`: two result cards.
- **States:** `loading.tsx` and `error.tsx` in `app/admin/`.
- **Commit:** `feat(ui): dashboard, global search, loading and error states`

### Task 4: Employees and Clients

- **Queries:** `listEmployees` and `listClients` accept `sort`; the pages pass
  in `parseSort(searchParams)`.
- **List pages:**
  - Toolbar card.
  - Sortable headers.
  - `RowLink` rows with the selected tint.
  - Row action menu.
  - Responsive columns.
  - Empty state.
  - The `view` aside showing the employee or client preview in its own
    Suspense.
- **Detail pages:** header card, then section cards in a two-column grid at
  `xl`.
- **Forms:** sections become cards; sticky action bar; focus moves to the
  first invalid field.
- **Actions:** create, update and save redirect with `?saved=1`. The `Toast`
  shows on the detail page.
- **Delete:** `ConfirmDelete` becomes a `Dialog`.
- **`DocumentsPanel`:** upload moves into a `Dialog`, and delete uses the
  confirm dialog. Uploads, deletes and assignments show the toast.
- **Commit:** `feat(ui): employees and clients on the new design system`

### Task 5: Users and auth

- **Users page:** new cards and table. Remove uses a confirm `Dialog`. The
  invite form goes in a card.
- **Auth pages:** centered card with the logo and the new inputs and buttons.
  Covers login, forgot password, set password and error.
- **Commit:** `feat(ui): users and auth pages on the new design system`

### Task 6: Verify

- **Screenshots in the browser pane,** in light and dark, at 375, 768, 1024
  and 1440 px wide, of: dashboard, employees list with preview, employee
  detail and form, clients list with preview, client detail, users, search,
  and login. Fix anything broken.
- **Flows:** create, edit, sort with paging, preview, upload, assign, delete
  with confirmation, theme switch, sidebar collapse, drawer, and keyboard tab
  through a dialog.
- **Checks:** test, tsc, lint and build.
- **Review:** the final whole-branch review; fix Critical and Important
  findings.
