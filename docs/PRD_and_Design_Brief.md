# Hồ sơ nguyên liệu — Web Application
## Product Requirements & Design Brief

> A modern web app to replace an AppSheet system that manages raw-material (forest product) cargo intake at multiple factory sites. This document is the single source of truth for the build.

---

## 1. Context

A Vietnamese manufacturer currently uses an internal Google AppSheet app called *Hồ sơ nguyên liệu* ("Raw-material records") to manage incoming cargo trucks at its factories. The app captures each delivery end-to-end: driver, supplier chain, source forest plot, weighbridge readings, photos, and chain-of-custody — a workflow shaped by both operational logistics and EUDR-style legal-sourcing due diligence.

The current AppSheet implementation has hit scale and speed limits driven by Google Sheets as the backend (wide formula-heavy tables, no indexing, concurrent-write contention, API rate limits). This project rebuilds the user-facing application as a modern web app while keeping Google Sheets and Google Drive as the storage tier for an initial phase, behind a swappable data-access layer. A database migration is planned as a later phase and is out of scope for this build, but the architecture must not preclude it.

### Who uses this

| Role | What they do |
| --- | --- |
| Operations staff (User) | Day-to-day cargo intake, weighing, quality check, photo capture |
| Site managers (Manager) | Oversight across cargo, suppliers, plots; approvals; reporting |
| Admins | Configuration, user/role management, cross-plant access |

There are three plants today (NMXH, NMQM, NMCT). Each plant has its own identical set of Google Sheets and Drive folders. Users can have access to one or more plants, with potentially different roles per plant. NMQM is the most active site.

### What stays in AppSheet (out of scope here)

- **Driver registration and gate check-in** runs in a separate AppSheet application at the security gate. That app remains the system of record for driver data. The web app reads driver data and may edit existing drivers, but never creates new ones.
- **Bulk data creation by operations users** continues in the legacy AppSheet app during this phase. The web app is primarily for viewing, editing, weighing-related entry, completion workflow, and reporting. (See section 5 for per-module write permissions.)

---

## 2. Goals

### Must achieve

1. **Faster** than AppSheet for the same data — list views and forms feel instant on a normal laptop and a mid-range Android phone.
2. **Multi-plant aware** — a user picks the plant they're working on, sees only that plant's data, and can switch plants without re-login if they have access to more than one.
3. **Faithful** to the existing operational workflow — no retraining beyond a short walkthrough.
4. **Replaces all daily-use AppSheet screens** except those listed as out of scope.
5. **Storage-agnostic backend** — all data access flows through a repository interface so the Sheets backend can be swapped for a database later.

### Explicit non-goals (this phase)

- Replacing the security-gate AppSheet app.
- Migrating off Google Sheets / Drive.
- Adding new business features that the current AppSheet app does not have.
- Building native mobile apps. Mobile-responsive web is sufficient.

### Success looks like

- The 80% daily-driver workflow (open cargo → enter weight → take photos → complete) takes fewer clicks and less waiting than the AppSheet version.
- A user with access to multiple plants can switch between them in under one second.
- A Sheets API rate-limit spike does not crash the UI; it degrades gracefully.

---

## 3. Architecture & technical constraints

### Stack (suggested, vibe-coding tool may choose comparable)

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js Route Handlers or a separate Node service (NestJS or Express) in TypeScript
- **State / data**: TanStack Query for client cache, Zod for validation everywhere
- **Auth**: Google OAuth (users sign in with the same Google accounts they already use)
- **Storage tier (this phase)**: Google Sheets API + Google Drive API via a service account
- **Cache**: Redis (or in-memory for dev) for read caching with short TTLs
- **Hosting**: Cloud Run, Vercel, or equivalent — irrelevant to the design

### Design tokens are mandatory

**No color, font, spacing, border radius, shadow, or transition value may be hardcoded in a component.** Every visual value must reference a design token. This is a non-negotiable architectural constraint — changing the visual language means changing token values, not hunting through components.

The token system has two tiers:

**Tier 1 — Primitive tokens** in `src/styles/tokens.css`. Raw named values, never referenced in components directly.
```css
--blue-800: #1E40AF;
--slate-900: #0F172A;
--green-600: #16A34A;
/* ... full primitive palette */
```

**Tier 2 — Semantic tokens**, referencing primitives by role. These are the only tokens components may use.
```css
:root {
  /* Backgrounds */
  --color-bg-page:        var(--neutral-50);
  --color-bg-surface:     var(--white);
  --color-bg-subtle:      var(--neutral-100);

  /* Text */
  --color-text-primary:   var(--slate-900);
  --color-text-secondary: var(--slate-600);
  --color-text-tertiary:  var(--slate-400);

  /* Accent (one) */
  --color-accent:         var(--blue-800);
  --color-accent-hover:   var(--blue-700);
  --color-accent-subtle:  var(--blue-50);

  /* Status — used only for state, never decoration */
  --color-success:        var(--green-600);
  --color-warning:        var(--amber-600);
  --color-danger:         var(--red-600);
  --color-info:           var(--color-accent);

  /* Borders */
  --color-border:         var(--slate-200);
  --color-border-strong:  var(--slate-300);

  /* Typography */
  --font-sans:      'Inter', system-ui, sans-serif;
  --font-mono:      'JetBrains Mono', monospace;
  --font-size-xs:   12px;  --font-size-sm:   13px;
  --font-size-base: 14px;  --font-size-md:   16px;
  --font-size-lg:   18px;  --font-size-xl:   22px;
  --font-size-2xl:  28px;

  /* Spacing scale */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;

  /* Shape */
  --radius-sm: 4px;  --radius-md: 6px;
  --radius-lg: 12px; --radius-full: 9999px;

  /* Motion */
  --duration-fast:   150ms;
  --duration-normal: 200ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}

/* Dark mode — override semantic tokens only */
[data-theme="dark"] {
  --color-bg-page:        var(--neutral-950);
  --color-bg-surface:     var(--neutral-900);
  --color-bg-subtle:      var(--neutral-800);
  --color-text-primary:   var(--neutral-50);
  --color-text-secondary: var(--neutral-400);
  --color-text-tertiary:  var(--neutral-600);
  --color-border:         var(--neutral-800);
  --color-border-strong:  var(--neutral-700);
  --color-accent:         var(--blue-500);
  --color-accent-hover:   var(--blue-400);
}
```

**Tailwind integration:** Extend `tailwind.config.ts` to map Tailwind utility classes to the semantic CSS variables — `text-primary`, `bg-surface`, `border-default`, `text-accent` — so components use Tailwind syntax throughout and never reference raw values.

**Adding a new theme** requires only a new `[data-theme="name"]` block overriding semantic tokens. Zero component changes. This covers per-plant themes, client variations, or high-contrast accessibility modes.

**Enforcement:** An ESLint rule flags any hardcoded hex, rgb, or named CSS color in a component file. Treat violations as build errors.

### The repository pattern is mandatory

All data reads and writes pass through a single TypeScript interface:

```ts
interface Repository<T> {
  list(plantId: string, query?: ListQuery): Promise<T[]>;
  get(plantId: string, id: string): Promise<T | null>;
  update(plantId: string, id: string, patch: Partial<T>): Promise<T>;
  // create is only exposed for entities the web app owns (see section 5)
}
```

Behind the interface, the Sheets adapter resolves `plantId` to the correct spreadsheet and tab, applies caching, batches writes, and handles rate-limit backoff. The UI never knows whether data comes from Sheets or Postgres. **No business logic in the adapter, no Sheets-specific code anywhere else.**

### Multi-plant scoping

- A small `plants` config (JSON file or table) maps `plantId` → spreadsheet IDs, Drive folder IDs, display name, timezone, address.
- Every API request carries `plantId` as a header or path parameter. Server validates that the authenticated user has access to that plant with sufficient role for the operation.
- Plant selection lives in the header (see design). Persisted per user in their settings.
- Cache keys are namespaced by `plantId` so plants never see each other's data.

### Performance targets

- List view (50 rows): under 300 ms perceived load after first paint
- Detail view open: under 200 ms
- Form save: under 500 ms (Sheets latency is the floor; show optimistic UI)
- App shell first paint: under 1 s on 4G

### Reliability constraints

- Sheets API quota is finite. Read-heavy paths must be cached; write-heavy paths must batch and queue.
- Treat every Sheets call as potentially returning 429 — retry with exponential backoff, show the user a non-blocking toast if it persists.
- Optimistic UI for writes; reconcile on response.

### Languages

- **Primary UI language: Vietnamese.** Field labels match the existing AppSheet labels.
- Existing data column names (e.g. `DanhSachXeHang`, `NhaCungCap`, `PhieuCan`) are preserved in the data layer but never shown to the user — UI labels are Vietnamese phrases.
- An English locale toggle is nice-to-have, not required.

### Computed fields (replacing AppSheet "virtual columns")

The AppSheet app uses ~1,900 columns, many of them virtual (computed at render time). These split into four kinds and must be handled accordingly:

| Kind | Example | How to handle in the web app |
| --- | --- | --- |
| Display formatting | `driver_name & " — " & plate_number` | Format in the UI when rendering. Do not store. |
| Reference deref | `cargo.supplier.name` | API joins and returns the populated field. Do not store. |
| Computed values used for filter/display | `completion_duration`, `distance_to_factory` | Compute server-side on write, store as real columns; the UI reads them like any other field. |
| Business-logic / validation | `is_complete`, `risk_status`, `required_if` rules | Backend services with unit tests. Never client-only. |

A categorized list of the existing virtual columns will be produced separately and used to drive the implementation; for the PRD it's enough to know the rule.

---

## 4. Information architecture

### Top-level navigation (sidebar)

- **Trang chủ** (Home / dashboard)
- **Xe hàng** (Cargo) — the central daily-driver workspace
- **Phiếu cân** (Weighing slips)
- **Hồ sơ rừng** (Plot registry)
- **Nhà cung cấp** (Suppliers)
- **Nguyên liệu** (Materials)
- **Báo cáo** (Reports / CSV export)
- **Tài xế** (Drivers — read & edit only)
- **Cài đặt** (Settings, role-gated)

Header carries the plant switcher (always visible), user avatar with role indicator, and search.

### Routes (suggested)

```
/                         Home dashboard
/cargo                    Cargo list (default: in-progress for the active plant)
/cargo/new                New cargo (operations role)
/cargo/[id]               Cargo detail (tabs: overview, weighing, photos, completion)
/weighing                 Weighing slips list
/weighing/[id]            Weighing slip detail / edit
/plots                    Plot registry list (with map view toggle)
/plots/[id]               Plot detail (info, owners, polygon, documents)
/suppliers                Suppliers list (tabs: primary, secondary)
/suppliers/[id]           Supplier detail with secondary suppliers under them
/materials                Material catalog
/drivers                  Driver list (read-only listing, edit allowed)
/drivers/[id]             Driver detail (no "new" button — gate app handles creation)
/reports                  Report builder + saved filters + CSV export
/settings                 Profile, plant preferences; admin sees user/role mgmt
```

---

## 5. Modules

Each module below lists: purpose, primary data, key screens, permissions, and the specific workflow rules that must be preserved from AppSheet. Read this section as the build backlog.

### 5.1 Plant switcher (foundation)

**Purpose**: A user selects the plant they're operating on. All subsequent data is scoped to that plant.

**Behaviour**
- Plant switcher in the header. Shows the current plant name. Clicking opens a popover with the list of plants the user has access to.
- Switching plants is instant — no full page reload. The current route is preserved if applicable (e.g. switching plants while on `/cargo` re-fetches that plant's cargo list).
- A user's accessible plants and their per-plant role come from the `Users` table.
- If a user has access to only one plant, the switcher still appears but is disabled (shows the plant name for clarity).

**Permissions**: every user, by default.

### 5.2 Authentication & roles

**Purpose**: Identify the user, scope what they can see and do per plant.

**Behaviour**
- Sign in with Google. First sign-in goes through an "awaiting approval" state if the email is not in `Users`.
- Session persists across reloads (HTTP-only cookie). Sign-out clears it.
- Role hierarchy: `User` < `Manager` < `Admin`. Roles are per-plant.
- Server enforces role on every API call. Client uses role to hide/show controls, never to grant access.

### 5.3 Materials catalog

**Purpose**: Reference data for raw material types.

**Data**: `NguyenLieu` (id, common name, scientific name, image).

**Screens**
- List: searchable, card or table view, with image thumbnails.
- Detail: read-only for User, editable for Manager+.

**Permissions**: read for all roles; edit for Manager+; create stays in AppSheet.

### 5.4 Suppliers

**Purpose**: Manage primary and secondary suppliers and their relationships.

**Data**: `NhaCungCap` (primary), `NhaCungCapPhu` (secondary, with FK to primary).

**Screens**
- List with tabs for Primary / Secondary. Searchable by name, MST (tax code), or CCCD (national ID).
- Primary supplier detail: identification (company → MST, individual → CCCD + phone), address, secondary suppliers under them as a related list.
- Secondary supplier detail: links back to its primary supplier.

**Rules**
- Identification differs by entity type: company suppliers must have a tax code (MST); individual suppliers must have a national ID (CCCD) and phone. The UI enforces this conditionally based on `hinh_thuc` (entity type).
- Lumber owners and forest owners are sub-types of supplier represented by slices in AppSheet; in the web app expose them as filter chips on the supplier list.

**Permissions**: read for all; edit for Manager+; create stays in AppSheet.

### 5.5 Cargo registration & lifecycle (the core workspace)

**Purpose**: The central record of every truck delivery. Where users spend most of their time.

**Data**: `DanhSachXeHang` (cargo hub, ~96 columns). Foreign keys to driver, material, primary supplier, secondary supplier, plot, weighing slip.

**Screens**
- **List**: default filter is "Chờ lượt" (waiting). Tabs / filter chips for the four statuses: Chờ lượt, Đang xử lý, Hoàn thành, Hủy lượt. Columns: plate number, driver name, material, supplier, status, created at. Sticky header, virtualized scroll for large result sets.
- **Detail**: tabbed layout, since the cargo record carries a lot of information:
  - **Tổng quan** (Overview): identification fields (plate, driver, material, supplier chain, source plot).
  - **Cân hàng** (Weighing): linked weighing slip with in/out weights, net weight, slip image.
  - **Hình ảnh** (Photos): linked photos and moisture readings (see 5.7).
  - **Giám sát & hoàn thành** (Monitoring & completion): KCS quality check, dossier completion (see 5.8).
- **New cargo** *(operations role only — kept available for cases where it's faster than AppSheet)*: a single form that walks through driver lookup (by QR or plate), supplier selection, material, source plot. Driver lookup is read-only against the gate app's data; if the driver isn't found, the user is told to register them in the gate app first.

**Status transitions**
- Created → Chờ lượt (waiting)
- Chờ lượt → Đang xử lý (in progress) when weighing starts
- Đang xử lý → Hoàn thành (completed) when KCS confirmation + dossier complete
- Any → Hủy lượt (cancelled) with a required reason

**Rules to preserve from AppSheet**
- Completion time is stamped automatically when status moves to Hoàn thành. This is a backend computed field.
- Distance-from-factory is computed when the source plot is set (replacing the AppSheet Bot that does this today).
- Activity-log entries are written on create, update, status change, and delete — handled by backend logging.

**Permissions**: read for all; edit for User+ on cargo at their plant; status changes follow the workflow rules above.

### 5.6 Weighbridge / weighing slips

**Purpose**: Capture in/out weights, generate the slip.

**Data**: `PhieuCan` (slip header), `DuLieuCan` (raw scale data feed).

**Screens**
- List of slips, filterable by date and by cargo status.
- Slip detail / edit: weigh-in time, weight-in, weigh-out time, weight-out, net weight (computed), scale operator, slip image (uploaded to Drive).
- A "Print / download" action that produces a PDF or image of the slip in the format Operations uses today.

**Rules**
- Net weight is computed server-side as `weight_in - weight_out` (or vice versa depending on direction) and stored.
- Slip number is unique per plant.
- High write volume; expect this module to be the most concurrent.

**Permissions**: edit for User+; create stays in AppSheet for now.

### 5.7 Cargo photos & moisture

**Purpose**: Attach photos and moisture readings to each cargo.

**Data**: `XeHangHinhAnh` (photos), `XeHangDoAm` (moisture readings). Files in Drive.

**Screens**
- Gallery view inside the cargo detail's Hình ảnh tab.
- Per-photo: thumbnail, full-size preview, capture timestamp, captured by.
- Upload: drag-and-drop on desktop, camera capture on mobile.
- Moisture readings: a small inline table — reading, position, captured by, timestamp.

**Rules**
- Files are stored in the plant-specific Drive folder.
- Show upload progress and surface Drive API errors clearly.

**Permissions**: edit for User+.

### 5.8 HSLS completion & quality check

**Purpose**: The KCS (quality control) step and dossier completion workflow that closes out a cargo.

**Data**: `XeHangGiamSat` (monitoring/QC), `DanhSachXeHang` (status fields).

**Screens**
- A wizard or panel inside the cargo detail's "Giám sát & hoàn thành" tab.
- Step 1 — Giám sát: KCS captures quality observations, sample notes, optional photos.
- Step 2 — Xác nhận: a confirmation form (`XacNhanHoSoHoanThanh`) that surfaces a checklist of required fields across the cargo record; only enabled when all required items are green.
- Submitting completion moves cargo status to Hoàn thành and stamps the completion time.

**Rules**
- The completion checklist is the operational gate — the AppSheet version uses a Show_If/Required_If pattern; in the web app, port these as backend validation rules returned to the UI.

**Permissions**: edit for User+ (KCS step), Manager+ (final confirmation).

### 5.9 Plot registry (traceability)

**Purpose**: Forest plots that material can be sourced from, plus their ownership, geometry, and supporting documents. This is the EUDR / legal-sourcing layer.

**Data**: `PlotRegistry`, `PlotOwners`, `PolygonCoordinates`, `PlotDocuments`.

**Screens**
- **List**: searchable; filter by harvest status, deforestation-risk status, species. Toggle between list and map view.
- **Map**: leaflet/maplibre map of all plots in the active plant, colour-coded by risk status. Click a plot to open its detail.
- **Detail**: tabbed layout:
  - Thông tin (info): area, species, land title, risk status, certifications.
  - Chủ sở hữu (owners): list of `PlotOwners` with role and share.
  - Ranh giới (boundary): polygon on a map plus the lat/long centroid.
  - Tài liệu (documents): supporting documents from Drive.

**Permissions**: read for all; edit for Manager+.

### 5.10 Drivers (read + edit, no create)

**Purpose**: Look up driver info and correct minor data issues. Driver creation is done in the gate app.

**Data**: `TaiXe`, `CccdScan` (read-only references for the scan data).

**Screens**
- List: search by name, CCCD, plate, phone.
- Detail: identification, contact, recent cargo history. Editable fields only — no "New driver" button anywhere.

**Permissions**: read for all; edit for Manager+.

### 5.11 Dashboard & reports

**Purpose**: Daily situational awareness and CSV export.

**Screens**
- **Home dashboard** (`/`): for the active plant — today's stats (cargo waiting, in-progress, completed, cancelled), trend chart for the last 30 days, recent activity feed.
- **Reports** (`/reports`): a builder with date range, plant, status, supplier, material filters. Result table with a "Tải CSV" (download CSV) button. Mirrors the existing AppSheet `FilteredViewCSV` flow.

**Permissions**: read for all; CSV export for Manager+ (admin-configurable later).

### 5.12 Settings (role-gated)

**Purpose**: User self-service plus admin-only user/role management.

**Screens**
- All users: profile, default plant, language preference, notification toggles.
- Admin only: users list with per-plant roles, plant configuration (display name, timezone), and a "Reload config" button for `GlobalVariables`.

---

## 6. Cross-cutting behaviour

### Search
A global search box in the header searches across cargo (by plate or driver), suppliers, plots, and drivers within the active plant. Keyboard shortcut `⌘K` / `Ctrl K`.

### Empty, loading, error states
Every list and detail view defines all four: loading skeletons, empty state with helpful next action, error state with retry, and success content. Never a bare spinner.

### Optimistic UI
Mutations (status change, weight entry, photo upload) update the UI immediately and reconcile on the server response. On failure, roll back and show a toast.

### Activity log
Every create/update/delete/status-change is written to a backend log (replacing AppSheet's `ActivityLog` bot). Admins can view it; users see only their own actions in their profile.

### Audit + compliance fields
Every record carries `created_at`, `created_by`, `updated_at`, `updated_by`. The web app populates these on writes — never trust client clocks.

### Offline / poor connection
This is a desktop-primary app at fixed workstations, but the photo capture and weighing flows can run on mobile in noisy network conditions. For those:
- Writes are queued locally and retried.
- The UI clearly indicates "saved" vs "saving" vs "queued".
- A small connectivity badge in the header turns amber when degraded.

---

## 7. Design system

### Direction

**Minimal industrial workspace.** The visual language draws from modern productivity tools (Linear, Vercel, Notion's data views) tuned for an operational, daily-driver context. Neutral surfaces, generous data tables, one purposeful accent. Zero decorative gradients, glass, or playful flourish. Density without crowding. Calm.

The aesthetic decision behind this: users will spend 6–8 hour shifts in this app. Visual restraint reduces cognitive load. The interface should feel like a tool, not a brand showcase.

### Palette

- **Background**: near-white surfaces (`#FAFAFA` page, `#FFFFFF` cards) over a soft neutral page background. Dark mode mirror: near-black (`#0A0A0A` page, `#141414` cards).
- **Text**: near-black on light (`#0F172A` primary, `#475569` secondary, `#94A3B8` tertiary). Near-white on dark.
- **Borders**: 1px hairlines, ~10% opacity of foreground. Never heavier.
- **Accent (single)**: deep blue (`#1E40AF` light / `#3B82F6` dark) for primary actions, links, selection.
- **Status colours**: used only for state, never decoration.
  - Success / Hoàn thành: green (`#16A34A`)
  - Warning / Chờ lượt: amber (`#D97706`)
  - Danger / Hủy lượt: red (`#DC2626`)
  - Info / Đang xử lý: blue (the accent)

### Typography

- **Sans**: Inter (or system equivalent). Two weights: 400 regular, 500 medium. Never 600+.
- **Mono**: JetBrains Mono or system mono for IDs, plate numbers, MST/CCCD codes.
- **Sizes**: 13/14/16 px for body text; 18/22/28 px for headings. Tight line heights (1.4 for headings, 1.5 for body).
- **Sentence case everywhere**, including buttons and labels. Vietnamese diacritics are first-class — verify rendering at all sizes.

### Components

Use shadcn/ui or equivalent. The non-negotiables:

- **Buttons**: outline default, filled accent for the single primary action per screen. Never two primary buttons in the same view.
- **Inputs**: 36 px tall, hairline border, subtle focus ring (2 px accent at 30% alpha). Labels above inputs, helper/error text below.
- **Tables**: zebra-striping off by default; sticky header; row hover; click row to open detail; right-click for context actions; column sort by clicking the header.
- **Tabs**: simple underline tabs, no pill backgrounds. Active = accent underline + 500 weight.
- **Cards**: thin border, 12 px radius, 16 px padding. Never shadows.
- **Toasts**: bottom-right, auto-dismiss, with an undo action where applicable.
- **Modals**: used sparingly. Most edits open inline or in side panels, not in modal dialogs.

### Layout

- **App shell**: left sidebar (collapsible), top header, content area. Sidebar widths 240 px expanded, 56 px collapsed.
- **Header** (always visible): logo + app name on the left; plant switcher centered or left-of-center; global search; notifications; user menu on the right. Height 56 px.
- **Content padding**: 24 px desktop, 16 px mobile.
- **Max content width**: 1440 px (lists and dashboards can go full width; forms cap at 720 px).

### Responsive

- Desktop is the primary target. Optimize for 1280–1920 px screens.
- Tablet (768–1024 px): sidebar collapses to icons by default. Tables remain tables.
- Mobile (under 768 px): sidebar becomes a slide-out drawer. Tables become card lists. Forms stack. Photo capture flows are designed mobile-first within the cargo detail screen.

### Iconography

Lucide icons (or Tabler), outline style, 16–20 px inline. No filled icons. Never decorative — every icon paired with a label, except in icon-only buttons where the label is in the tooltip.

### Motion

- 150 ms ease-out for state changes (tab switches, expand/collapse, hover).
- No spring physics, no bouncy effects.
- Respect `prefers-reduced-motion`.

### Empty states

Every empty state gets: a small Lucide icon (40 px), a one-line message in Vietnamese, an optional secondary action. Tone: matter-of-fact, never cute.

### Accessibility

- WCAG AA contrast on all text.
- All interactive elements keyboard-reachable; visible focus rings.
- Form errors announced to screen readers.
- All Lucide icons that aren't decorative get `aria-label`.

---

## 8. What to build first

The vibe-coding tool should build modules in this dependency order. Each step is self-contained enough to ship and demo before moving to the next.

1. **App shell + auth + plant switcher** — sidebar, header, Google OAuth, plant context, role enforcement scaffolding. No real data yet, mock the repository.
2. **Materials catalog** — small, simple, proves the Sheets read/edit path end-to-end.
3. **Suppliers** — primary and secondary, proves the parent-child relationship pattern.
4. **Drivers (read + edit)** — proves read from the gate app's sheets without owning creation.
5. **Cargo list + detail (overview tab only)** — the central workspace appears. No weighing or completion yet.
6. **Weighbridge** — adds the weighing tab inside cargo detail and the standalone slips list.
7. **Cargo photos** — Drive uploads and gallery view.
8. **HSLS completion & QC** — the wizard, status transitions, the completion gate.
9. **Plot registry** — list, map, detail, owners, polygon, documents.
10. **Dashboard & reports** — once enough data flows exist for the dashboard to be meaningful.
11. **Settings & admin** — last; admin needs come into focus once everything else is live.

---

## 9. Out of scope (and explicitly so)

- Driver registration (stays in the gate AppSheet app)
- Bulk operational data creation (stays in legacy AppSheet)
- Migration off Google Sheets (separate later phase)
- New business features beyond what AppSheet does today
- Native mobile apps
- Email and SMS sending (mirror what AppSheet does today via the same channels; do not redesign)

---

## 10. Open questions for the team

These are intentionally surfaced rather than guessed. The vibe-coding tool should flag any blocker, and the product team should answer before the affected module is built.

1. The exact list of required fields at completion (used by the HSLS confirmation gate) — to be confirmed from the AppSheet expressions.
2. Whether the Phase-1 build keeps writing `Transactions` chain-of-custody records via the existing AppSheet Bot, or whether the web app takes over that write path. Recommendation: keep the Bot until Phase 4.
3. Whether plant configuration (spreadsheet IDs, Drive folder IDs, timezone) is editable in the admin UI, or fixed in a config file. Recommendation: config file for this phase.
4. The PDF format of the printed weighing slip — needs a sample from operations.
5. Specific email/SMS triggers that exist today and must continue to fire.
