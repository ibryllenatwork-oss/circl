# Admin Redesign — Design

Date: 2026-11-14
Status: Draft, awaiting approval
Builds on: the existing admin (Dashboard, Users, Employees, Clients, auth pages)

## Intent

Turn the plain starter-styled admin into a premium, minimalist SaaS dashboard
that feels designed for circl. It should be calm, spacious and polished, and
every admin page should feel like part of one application.

The user's brief asked for a terracotta-on-blush look, inspired by a reference
image that never arrived. The user chose **circl. brand colors** instead, with
the same style. They also chose **light and dark themes**, and to **work from
the written brief**.

## Goals

- **One design system:** tokens for color, radius, shadow, type and spacing in
  `app/globals.css` and `tailwind.config.ts`, plus a small reusable component
  kit. Every admin page uses these, with no one-off styling.
- **New admin shell:**
  - A fixed violet sidebar with Lucide icons. It collapses to icons on
    desktop and becomes a drawer on mobile.
  - A top header with search, today's date and an avatar menu.
  - A spacious main area.
- **Dashboard home:** headcount summary cards, plus a quick-actions panel on
  the right.
- **Employees and Clients lists:**
  - Clean tables with server-side sorting, search, filters and paging, kept
    working.
  - Clicking a row selects it (violet tint) and opens a right preview panel
    with quick actions.
- **Detail and edit pages:** restyled into white section cards, with the same
  content as today.
- **Dialogs:** typed-confirm deletes become proper modal dialogs.
- **Auth pages:** login, forgot password, set password and error, in the same
  style.
- **States:** loading, empty, success and error for every page.
- **Responsive:** desktop, tablet and mobile (down to 360 px).
- **Light and dark themes:** a toggle in the avatar menu (Light / Dark /
  System), remembered per browser.
- **Accessible:** visible focus, AA contrast, labelled controls, and keyboard
  use for the sidebar, menus and dialogs.

## Non-goals

- The public landing page (`/`). It stays as it is.
- Notifications or messaging. There's no data source yet, so no bell icon.
- Charts, and the dashboard "attention" or recent-activity lists. The user
  picked headcount cards only.
- Any change to routes, queries, the database, permissions or dev mode. The
  only change to server actions is the `?saved=1` redirect described below.

## Anti-goals

- A generic admin-template look, or heavy saturated color everywhere.
- Business logic duplicated or moved into UI components.
- Any feature lost, including the masked IDs, dev badges, filters, typed
  confirmation and NBI/contract expiry badges.

## Approaches considered

| Approach | Trade-off | Outcome |
|---|---|---|
| **Retheme the tokens and build a shared UI kit**, then move each page onto it | One place to change the look; routes, actions and data code untouched | **Chosen (user)** |
| Port pages into a dashboard template | Faster first look, but brings unrelated code and conventions | Rejected |
| Switch to another component library (Mantine, Chakra) | Many widgets, but every component and form gets rewritten | Rejected |

## Visual system

### Color tokens

Colors are sampled from `brand/logo-v1.png`: a violet → magenta → red →
orange → yellow ring. They are defined as HSL CSS variables, following the
existing shadcn convention.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#F7F1F6` (lavender blush) | `#17111C` (aubergine) | Workspace |
| `--surface` / `--card` | `#FFFFFF` | `#211A27` | Cards, tables, panels |
| `--muted` | `#FBF8FB` | `#2A2231` | Input fields, table header |
| `--foreground` | `#2E2A33` | `#F3EEF5` | Primary text |
| `--muted-foreground` | `#8C8494` | `#A79DAE` | Secondary text |
| `--border` | `#EEE6EE` | `#352B3C` | Borders and dividers |
| `--primary` | `#6B2A8C` (violet) | `#B98AD6` | Primary buttons, active states, focus ring, links |
| `--primary-foreground` | `#FFFFFF` | `#17111C` | Text on primary |
| `--accent` | `#F3E9F7` | `#3A2A45` | Hover, and selected-row tint |
| `--brand-magenta` | `#B5306E` | `#E06BA0` | Small highlights, avatar ring |
| `--brand-red` | `#E23A3A` | `#F07272` | Destructive actions |
| `--brand-orange` | `#F07A2A` | `#F59A5B` | Attention, and the active-nav marker |
| `--brand-yellow` | `#F2D45C` | `#F2D45C` | Gradient end only |
| Sidebar background | Gradient `#4A1F66` → `#6B2A8C` | Gradient `#1E1426` → `#2E1D3B` | Sidebar |

**Status badges** are soft tinted pills with darker text, in both themes:

| Tone | Used for |
|---|---|
| **success** (green) | Active |
| **pending** (yellow) | On leave, Prospect, Expiring soon |
| **processing** (blue) | Paused |
| **error** (red) | Terminated, Expired |
| **neutral** (gray) | Resigned, Ended |

**Contrast:** every text and background pair must meet WCAG AA, 4.5:1 for body
text. The implementer checks the token pairs with a script and adjusts the
shades if needed. The final values are recorded in `globals.css`.

### Type, shape and spacing

- **Font:** Inter, via `next/font/google`, replacing Geist. Sizes:
  - Page title: 24 px, semibold
  - Section title: 15 px, semibold
  - Body: 14 px
  - Labels and table headers: 12–13 px, medium, muted
  - Metric values: 28–32 px, semibold, tabular numbers
- **Radius:** 14 px for cards and panels, 10 px for inputs and buttons, full
  for badges and avatars.
- **Shadow:**
  - Cards: `0 1px 2px rgb(46 42 51 / .04), 0 4px 16px rgb(107 42 140 / .06)`
  - Dark theme: a 1 px border instead of a shadow
- **Spacing:** a 4 px scale. Page padding is 24 px on mobile and 32 px on
  desktop. Gaps are 24 px between sections and 16 px between items inside a
  card.
- **Buttons:**
  - 36 px tall by default, 32 px when small.
  - Primary: violet with white text. Secondary: white with a border. Ghost:
    transparent. Destructive: red.
  - Hover darkens by about 6%. Pressed scales to 0.98. Focus shows a 2 px
    violet ring.
- **Inputs:**
  - The `--muted` background with a 1 px border, 36 px tall, 10 px radius.
  - Focus: violet border plus ring.
  - Error: red border, plus a message below that is linked by
    `aria-describedby`.

### Icons and logo

- **Icons:** Lucide (already installed), 18 px, 1.75 stroke.
- **Nav icons:**
  - Dashboard: `LayoutDashboard`
  - Users: `ShieldCheck`
  - Employees: `Users`
  - Clients: `Building2`
  - Services & Rates: `Tags`
  - Projects: `FolderKanban`
- **Logo:** a web-sized copy of `brand/logo-v1.png` goes in
  `public/brand/circl-mark.png`, shown through `next/image`. The sidebar header
  shows the mark plus a "circl." wordmark, and just the mark when collapsed.
  The login card shows the mark.

## Layout

### Admin shell (`app/admin/layout.tsx` → `AdminShell`)

```
┌──────────┬───────────────────────────────────────────────┬──────────────┐
│ ◯ circl. │  [🔍 Search employees & clients…]   Fri, Nov 14  (A)▾ │              │
│          ├───────────────────────────────────────────────┤  right panel │
│ ▣ Dash   │  Page title                     [Primary btn] │  (optional,  │
│ ⛨ Users  │  supporting text                              │   per page)  │
│ 👥 Empl.  │  ┌────────── white card ─────────────┐        │              │
│ 🏢 Clients│  │ ...                                │        │              │
│ ◇ Soon   │  └────────────────────────────────────┘        │              │
│          │                                               │              │
│ « Collapse│                                              │              │
└──────────┴───────────────────────────────────────────────┴──────────────┘
```

#### Sidebar

- **Size:** 248 px wide, or 72 px when collapsed.
- **Collapse:** the button at the bottom remembers its state in a
  `sidebar_state` cookie, so the server renders the right width with no
  flicker.
- **Below 1024 px:** the sidebar is hidden. A menu button in the header opens
  it as a drawer, using the shadcn `Sheet` (Radix Dialog), with a focus trap
  and Esc to close.
- **Items:**
  - Built from `visibleNav()`, so Users stays superadmin-only.
  - The active item gets a white/10% fill, an orange 3 px left marker and
    `aria-current="page"`.
  - "Soon" items are dimmed, with a small "Soon" pill and `aria-disabled`.
  - When collapsed, labels become tooltips.
- **Bottom of the sidebar:** the existing dev-mode note, made compact.

#### Header

- **Search (global):** a GET form to `/admin/search?q=`. The results page
  lists matching employees and clients in two cards, reusing `listEmployees`
  and `listClients` with every status included. It is limited to 5 each, with
  "See all" links to the filtered lists.
- **Date:** today in Manila, from `todayInManila()`, for example "Friday,
  November 14".
- **Avatar menu** (a shadcn `DropdownMenu`):
  - Initials avatar with a magenta ring
  - Email and role (Superadmin, Manager, or Dev mode)
  - Theme: Light / Dark / System
  - Sign out (hidden in dev mode)

#### Page structure

Every page uses one `PageHeader` component: title, optional description, and
optional actions on the right. The content goes below, in cards.

#### Right panel (`<AsidePanel>`)

- Shown only on pages that pass one.
- **From 1280 px wide:** a fixed 320 px column.
- **Below 1280 px:**
  - On list pages, the preview isn't shown. Clicking a row goes straight to
    the detail page.
  - On the Dashboard, the quick actions move below the cards.

### Pages

#### Dashboard (`/admin`)

- **Header:** "Good morning, <name or email>", with the greeting following
  Manila time.
- **4 stat cards:** Active VAs, VAs on leave, Active clients, Prospects.
  - Each shows a large value, a muted label and a Lucide icon in a soft tinted
    circle.
  - A new server query, `dashboardCounts()`, does 4 head-count queries through
    `withManager`.
  - No trend percentages, since there's no history to compare against.
- **Right panel:** Quick actions:
  - Add employee
  - Add client
  - Invite manager (superadmins only)

#### Employees list and Clients list

- **Card contents:** a toolbar (search box, status chips as toggle pills, the
  "Dev mode" chip, then Apply), the table, and paging.
- **Sorting:** clicking a sortable header toggles ascending and descending.
  - The URL holds `sort=<key>&dir=asc|desc`, alongside the existing params.
  - Each header shows an arrow and has `aria-sort`.
  - Allowed keys:
    - Employees: `name` (last name, then first name), `no` (sequence),
      `position`, `status`, `hired` (default: hired, descending)
    - Clients: `company` (default: ascending), `status`, `contract_end`
  - Unknown values fall back to the default.
- **Rows:**
  - 56 px tall with subtle dividers and a hover tint.
  - The selected row (`?view=<id>`) gets the violet tint and a left border.
  - The status uses the new badge.
- **Row actions:** a `MoreHorizontal` menu with Open, Edit, and (employees)
  Copy employee no.
- **Selecting a row:** on wide screens, clicking a row sets `view=<id>` in the
  URL, keeping the other params, without scrolling the page.
  - The server renders `<AsidePanel>` with a compact summary:
    - **Employees:** photo or initials, name, employee no., position, status,
      hired date, assigned clients, NBI expiry, and Open / Edit buttons.
    - **Clients:** company, status, primary contact, number of VAs, contract
      end, and Open / Edit buttons.
  - Masked fields are **not** shown in the panel.
  - Below 1280 px, clicking a row goes straight to the detail page.
- **Empty state:** an icon, "No employees match your filters" (or "No
  employees yet"), and the primary action.

#### Detail pages

- **Header:** the photo or avatar, name, employee no. and status badge, with
  Edit and the "⋯" menu (Delete) on the right.
- **Sections:** each section is a white card, with the existing content.
- **Layout:** two columns of cards from 1280 px wide, one column below.

#### Forms (new and edit)

- **Same fields and actions.** Each form section becomes a card with a title
  and description.
- **Sticky action bar:** a bar at the bottom of the viewport holds Cancel and
  Save.
- **Validation:** the existing error summary becomes an alert banner at the
  top. When a save fails, the first field with an error gets focus.

#### Delete

- `ConfirmDelete` becomes a modal `Dialog` with the same typed-confirm rule:
  - The title says what is being deleted.
  - The body explains it's permanent and gives the "set the status instead"
    hint.
  - Footer: Cancel, then a red "Delete permanently" button, disabled until the
    confirmation word is typed.

#### Users

- **Table:** the same columns, now in the new table card.
- **Invite form:** moves into a card at the top, still superadmin-only.
- **Remove:** uses a confirm `Dialog` instead of the browser `confirm()`.

#### Documents panel

- Restyled as a card with a list of documents.
- **"Upload document"** opens a `Dialog` with the type, label, expiry date and
  a file drop zone.
- Delete uses the confirm `Dialog`.

#### Auth pages

- A centered card on the lavender background, with the logo mark above it.
- Same forms and logic.
- The error page uses the same card.

### States

| State | How it looks |
|---|---|
| **Loading** | A `loading.tsx` for each admin route segment, with skeleton cards and table rows. The existing Suspense fallbacks use the same skeletons. |
| **Empty** | The `EmptyState` component: icon, title, text and action. |
| **Success** | After a save, the server action redirects with `?saved=1`. The detail page shows a dismissible success toast, which is `role="status"`, disappears after 4 s and removes the param with `router.replace`. Uploads and assignments show the same toast. |
| **Error** | An `error.tsx` for each admin segment, with a friendly message and a "Try again" button that calls `reset()`. Form errors stay inline. |

### Responsive breakpoints

| Width | Layout |
|---|---|
| **< 640 px** | One column. Stat cards 2 per row. The list table shows only the main columns (name, status), and the rest moves under the name as muted text. Filters wrap. |
| **640–1023 px** | The sidebar is a drawer. Stat cards 2 per row. Full table, scrolling sideways if needed. |
| **1024–1279 px** | The sidebar is fixed. No right panel. |
| **≥ 1280 px** | The right panel appears on the Dashboard and the lists. |

## New and changed components

All under `components/ui/`, shadcn-style, or `components/admin/`.

- **New shadcn primitives:**
  - `dialog`
  - `sheet`
  - `tooltip`
  - `skeleton`
  - `avatar`, as a plain styled element
  - `separator`
  - `badge`, updated with the status tones above

  This means adding `@radix-ui/react-dialog` and `@radix-ui/react-tooltip`.
- **`admin-shell`, `app-sidebar`, `admin-header`, `user-menu`:** rewritten
  around the new layout.
- **New admin components:**
  - `page-header`
  - `stat-card`
  - `aside-panel`
  - `empty-state`
  - `data-table`: header cells with sort links, the row-selection link wrapper
    and the row-action menu
  - `toast` (success)
  - `form-section`: replaces the old `FormSection`
- **Changed existing components:**
  - `badges.tsx`: uses the new `Badge` tones
  - `confirm-delete.tsx`: becomes a dialog
  - `documents-panel.tsx`: restyled, with the upload dialog
  - `list-controls.tsx`: restyled, with the sort parameters added
  - `form-fields.tsx`: restyled
- **New pure helpers, with tests:**
  - `lib/admin/sort.ts`, `parseSort(raw, allowed, fallback)`: returns
    `{ key, dir }`
  - `lib/admin/greeting.ts`: works out the Manila greeting
- **Data changes:**
  - The queries take an optional `sort`.
  - `dashboardCounts()` is added.

  Nothing else in the data layer changes.

## Done when

- **Every admin route renders in the new style,** in light and dark, at 375,
  768, 1024 and 1440 px, with no horizontal page scroll. The routes are
  `/admin`, `/admin/users`, the employees and clients list, new, detail and
  edit pages, `/admin/search`, and the 4 auth pages. These are checked with
  screenshots in the browser pane.
- **All existing flows still work in dev mode:**
  - create, edit and rehire an employee
  - upload and open a document
  - assign a VA
  - delete with typed confirmation
  - invite a manager (UI only)
- **New behavior works:**
  - sort and paging together
  - row selection and preview
  - global search
  - collapsing the sidebar, and the mobile drawer
  - switching themes
  - keyboard navigation through the sidebar, menus and dialogs
- **Checks:** `npm test`, `tsc`, lint and build all pass. Token contrast is
  checked.

## Settled during the builder check (Claude's calls)

1. **The success signal is allowed to touch the actions.** `createEmployee`,
   `updateEmployee` and `saveClient` change only their final `redirect(...)`
   to add `?saved=1`. The logic is otherwise unchanged. Uploads, deletes inside
   panels and assignments already return results to client components, and
   those components show the toast directly.
2. **Choosing between row preview and navigation:**
   - Each row is a real link to the detail page. Without JS, or below 1280 px,
     it opens the detail page.
   - A small client wrapper checks `matchMedia('(min-width: 1280px)')` when
     clicked. When it matches, it calls `router.replace` with `?view=<id>`
     (keeping the other params, `scroll: false`) instead of navigating.
   - The server renders the panel only when `view` is present.
   - CSS hides the panel column below 1280 px. If the window shrinks while a
     row is selected, the panel just hides; the `view` param is harmless.
3. **The preview panel's data:**
   - A separate fetch by id: `getEmployee(view)` or `getClient(view)`, in its
     own `<Suspense>` with a skeleton, so the table never waits on it.
   - These queries already return assigned clients, documents (for the NBI
     expiry) and contacts, so no new queries are needed.
   - If the id is invalid or not found, there's no panel. If it's outside the
     current filter or page, the panel still shows the record.
4. **Cookies and theme:**
   - `sidebar_state` is read in `AdminShell`, which already runs inside the
     layout's `<Suspense>` (it calls `requireManager`), so the dynamic boundary
     doesn't move.
   - The theme keeps using `next-themes`: it's already in the root layout,
     stores the choice in localStorage, and prevents a flash of the wrong
     theme on load. The auth pages share the root layout, so they inherit the
     theme.
5. **Global search:**
   - Goes through `withManager` via the existing list queries. It is the same
     for every manager, since everyone sees all employees and clients.
   - It doesn't search Users. That's a small, superadmin-only list with its
     own page.
6. **Sorting:**
   - Done in SQL with `order by`, always with a stable tiebreaker so paging
     stays consistent: employees end with `seq` and clients with `id`.
   - `name` sorts by `last_name`, then `first_name`, then `seq`.
   - Unknown keys or directions fall back to the default.
7. **Mobile columns:**
   - Employees: name and status visible, with position and employee no.
     underneath.
   - Clients: company and status, with the primary contact underneath.
   - Users: email and last sign-in, with the invited date underneath.

## Left to the builder

- Exact skeleton shapes, icon choices for empty states, and minor spacing
  inside the component tokens.
- Whether the stat-card icon circles use the primary or magenta tint.
